import fs from "fs";
import path from "path";
import { format } from "prettier";

// Helper function to convert kebab-case to PascalCase
export const toPascalCase = (str: string) => {
  if (!str) return '';
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
};

// Helper function to convert kebab-case to snake_case
function toSnakeCase(str: string): string {
  return str.replace(/-/g, '_').toLowerCase();
}

// Helper function to convert PascalCase to snake_case
function pascalToSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toLowerCase();
}

type ModelField = {
  name: string;
  type: "string" | "number" | "boolean" | "date";
  required?: boolean;
  relation?: {
    type: "belongsTo" | "hasMany" | "manyToMany";
    model: string;
    inverse?: string;
  };
};

type ModelConfig = {
  // Core model info
  name: string;
  singular: string;    // e.g. "wiper", "vehicle"
  plural: string;      // e.g. "wipers", "vehicles"
  isParent?: boolean;  // Is this the parent model for the module?
  
  // Relationship info (for child models)
  parent?: {
    model: string;     // e.g. "Wiper" for WiperKit
    routePrefix: string; // e.g. "wipers/kits" vs just "wipers" for parent
  };
  
  fields: ModelField[];
}

type ModuleConfig = {
  name: string;
  plural: string;      // Module's plural name (often same as parent model's plural)
  models: ModelConfig[];
};

// Helper function to get route path based on model config
function getRoutePath(moduleConfig: ModuleConfig, modelConfig: ModelConfig): string {
  if (modelConfig.isParent) {
    return moduleConfig.plural;
  }
  return modelConfig.parent?.routePrefix || `${moduleConfig.plural}/${modelConfig.plural}`;
}

// Helper function to get component name based on model config
function getComponentName(modelConfig: ModelConfig): string {
  if (modelConfig.isParent) {
    return modelConfig.singular;
  }
  const parentPrefix = modelConfig.parent?.model.toLowerCase() || '';
  return `${parentPrefix}-${modelConfig.singular}`;
}

export const TEMPLATES = {
  model: (modelName: string, fields: ModelField[]) => {
    const className = toPascalCase(modelName);
    const toKebabCase = (str: string) => str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    
    const imports = fields
      .filter((f) => f.relation)
      .map((f) => `import ${f.relation!.model} from "./${toKebabCase(f.relation!.model).toLowerCase()}";`)
      .join("\n");

    return `
    import { model } from "@medusajs/framework/utils"
    ${imports}

    const ${className} = model.define("${toSnakeCase(modelName)}", {
      id: model.id().primaryKey(),
      ${fields
        .map((f) => {
          if (f.relation) {
            switch (f.relation.type) {
              case "belongsTo":
                return `${f.name}: model.belongsTo(() => ${f.relation.model}${
                  f.relation.inverse ? `, { mappedBy: "${f.relation.inverse}" }` : ''
                })`;
              case "hasMany":
                return `${f.name}: model.hasMany(() => ${f.relation.model}, { 
                  mappedBy: "${f.relation.inverse || f.name}" 
                })`;
              case "manyToMany":
                return `${f.name}: model.manyToMany(() => ${f.relation.model}, {
                  pivotTable: "${toSnakeCase(modelName)}_${toSnakeCase(f.relation.model)}",
                  joinColumn: "${toSnakeCase(modelName)}_id",
                  inverseJoinColumn: "${toSnakeCase(f.relation.model)}_id"
                })`;
            }
          }
          switch (f.type) {
            case "string":
              return `${f.name}: model.text()`;
            case "number":
              return `${f.name}: model.number()`;
            case "boolean":
              return `${f.name}: model.boolean()`;
            case "date":
              return `${f.name}: model.date()`;
          }
        })
        .join(",\n      ")}
    })

    export default ${className}
    `;
  },

  service: ({ moduleName, models }) => {
    console.log('Service template input:', { moduleName, models });
    const modelImports = models.map(m => {
      const name = typeof m === 'string' ? m : m.name;
      const className = toPascalCase(name);
      // Convert PascalCase to kebab-case for import paths
      const path = name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
      return { path, className };
    });

    return `
    import { MedusaService } from "@medusajs/framework/utils"
    ${modelImports.map(({ className, path }) => `import ${className} from "./models/${path}"`).join("\n    ")}

    class ${moduleName}Service extends MedusaService({
      ${modelImports.map(({ className }) => className).join(",\n      ")}
    }){
    }

    export default ${moduleName}Service
    `
  },

  middleware: (moduleConfig: ModuleConfig) => {
    // Generate route configurations
    const routes = moduleConfig.models.map(model => {
      const routePath = model.parent?.routePrefix || 
        `${moduleConfig.plural}/${model.plural}`;
      
      const className = toPascalCase(model.name);
      const schemaName = `Get${className}Schema`;
      
      // Get fields for defaultFields, excluding relation fields
      const defaultFields = ["id", ...model.fields
        .filter(f => !f.relation)
        .map(f => f.name)];

      // Get relation fields for defaultRelations
      const defaultRelations = model.fields
        .filter(f => f.relation)
        .map(f => f.name);
      
      return [
        // GET route
        `{
          matcher: "/admin/${routePath}",
          method: "GET",
          middlewares: [
            validateAndTransformQuery(${schemaName}, {
              defaults: ${JSON.stringify(defaultFields)},
              select: ${JSON.stringify(defaultFields)},
              relations: ${JSON.stringify(defaultRelations)},
              isList: true,
            }),
          ],
        }`,
        // CREATE route
        `{
          matcher: "/admin/${routePath}",
          method: "POST",
          middlewares: [validateAndTransformBody(PostAdminCreate${className})],
        }`,
        // UPDATE route
        `{
          matcher: "/admin/${routePath}/:id",
          method: "POST",
          middlewares: [validateAndTransformBody(PostAdminUpdate${className})],
        }`
      ].join(',\n');
    }).join(',\n');

    const imports = moduleConfig.models.map(model => {
      const className = toPascalCase(model.name);
      const routePath = model.parent?.routePrefix || 
        `${moduleConfig.plural}/${model.plural}`;
      
      return `import {
  PostAdminCreate${className},
  PostAdminUpdate${className}
} from "./admin/${routePath}/validators";`;
    }).join('\n');

    const schemas = moduleConfig.models.map(model => {
      const className = toPascalCase(model.name);
      const makeIdField = model.fields.find(f => f.relation?.model === 'Make');
      
      if (makeIdField) {
        return `export const Get${className}Schema = createFindParams().extend({
  make_id: z.string().optional()
});`;
      }
      return `export const Get${className}Schema = createFindParams();`;
    }).join('\n');

    return {
      imports,
      routes,
      schemas,
      fullTemplate: `// This file is auto-generated and will be overwritten by subsequent generations
// Manual changes should be made to the generator templates instead

import { z } from "zod";
import {
  defineMiddlewares,
  unlessPath,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";

${imports}

${schemas}

export default defineMiddlewares({
  routes: [
    ${routes}
  ],
});`
    }
  },

  validator: (modelName: string, fields: ModelField[]) => {
    const className = toPascalCase(modelName);
    return `import { z } from "zod"

export const PostAdminCreate${className} = z.object({
  ${fields
    .filter((f) => !f.relation)
    .map((f) => {
      switch(f.type) {
        case "string":
          return `${f.name}: z.string()${f.required ? "" : ".optional()"}`;
        case "number":
          return `${f.name}: z.number()${f.required ? "" : ".optional()"}`;
        case "boolean":
          return `${f.name}: z.boolean()${f.required ? "" : ".optional()"}`;
        case "date":
          return `${f.name}: z.date()${f.required ? "" : ".optional()"}`;
        default:
          return `${f.name}: z.any()${f.required ? "" : ".optional()"}`;
      }
    })
    .join(",\n  ")}
}).strict();

export const PostAdminUpdate${className} = z.object({
  ${fields
    .filter((f) => !f.relation)
    .map((f) => `${f.name}: z.${f.type}().optional()`)
    .join(",\n  ")}
}).strict();

export type AdminCreate${className}Req = z.infer<typeof PostAdminCreate${className}>;
export type AdminUpdate${className}Req = z.infer<typeof PostAdminUpdate${className}>;
`;
  },

  route: (moduleConfig: ModuleConfig, modelConfig: ModelConfig) => {
    const routePath = getRoutePath(moduleConfig, modelConfig);
    const className = toPascalCase(modelConfig.name);
    
    return `
    import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
    import { z } from "zod"
    import { PostAdminCreate${className} } from "./validators"
    
    type QueryResponse = {
      data: any[]
      metadata: {
        count: number
        take: number
        skip: number
      }
    }

    export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
      const query = req.scope.resolve("query")

      const queryOptions = {
        entity: "${toSnakeCase(modelConfig.name)}",
        ...req.queryConfig,
      }

      const { data: ${toSnakeCase(modelConfig.name)}_items, metadata } = await query.graph(
        queryOptions
      ) as QueryResponse

      res.json({
        ${toSnakeCase(modelConfig.name)}_items,
        count: metadata.count,
        limit: metadata.take,
        offset: metadata.skip,
      })
    }

    type PostAdminCreate${className}Type = z.infer<typeof PostAdminCreate${className}>

    export const POST = async (
      req: MedusaRequest<PostAdminCreate${className}Type>,
      res: MedusaResponse
    ) => {
      const { result } = await create${className}Workflow(req.scope).run({
        input: req.validatedBody,
      })

      res.json({ ${toSnakeCase(modelConfig.name)}: result })
    }
  `;
  },

  idRoute: (moduleConfig: ModuleConfig, modelConfig: ModelConfig) => {
    const routePath = getRoutePath(moduleConfig, modelConfig);
    const className = toPascalCase(modelConfig.name);
    
    return `
    import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
    import { z } from "zod"
    import { update${className}Workflow } from "../../../../../workflows/update-${modelConfig.name}"
    import { PostAdminUpdate${className} } from "../validators"

    type PostAdminUpdate${className}Type = z.infer<typeof PostAdminUpdate${className}>

    export const POST = async (
      req: MedusaRequest<PostAdminUpdate${className}Type>,
      res: MedusaResponse
    ) => {
      const { result } = await update${className}Workflow(req.scope).run({
        input: {
          id: req.params.id,
          ...req.validatedBody,
        },
      })

      res.json({ ${className}: result })
    }
  `;
  },

  workflow: (modelName: string, fields: ModelField[]) => `
    import {
      createStep,
      StepResponse,
      createWorkflow,
      WorkflowResponse,
    } from "@medusajs/framework/workflows-sdk"

    export type Create${toPascalCase(modelName)}StepInput = {
      ${fields
        .map((f) => `${f.name}${f.required ? "" : "?"}: ${f.type}`)
        .join("\n      ")}
    }

    export const create${toPascalCase(modelName)}Step = createStep(
      "create-${modelName}-step",
      async (input: Create${toPascalCase(modelName)}StepInput, { container }) => {
        const moduleService = container.resolve("${modelName}")

        const result = await moduleService.create({
          ...input,
        })

        return new StepResponse(result, result.id)
      },
      async (id: string, { container }) => {
        const moduleService = container.resolve("${modelName}")
        await moduleService.delete(id)
      }
    )

    export const create${toPascalCase(modelName)}Workflow = (container) =>
      createWorkflow(container, {
        steps: [create${toPascalCase(modelName)}Step],
      })
  `,

  pageComponent: (moduleConfig: ModuleConfig, modelConfig: ModelConfig) => {
    const className = toPascalCase(modelConfig.name);
    const snakeName = toSnakeCase(modelConfig.name);
    const routePath = getRoutePath(moduleConfig, modelConfig);
    const componentName = getComponentName(modelConfig);
    
    return `
    import { defineRouteConfig } from "@medusajs/admin-sdk";
    import { createDataTableColumnHelper, FocusModal, Drawer } from "@medusajs/ui";
    import { ${className} } from "../../../types";
    import { DataTablePage } from "../../../components/data-table-page";
    import { ${className}Create } from "./create/${componentName}-create";
    import { useState } from "react";
    import { ActionMenu } from "../../../components/action-menu";
    import { Pencil } from "@medusajs/icons";
    import { ${className}Edit } from "./edit/${componentName}-edit";

    const columnHelper = createDataTableColumnHelper<${className}>();

    const ${className}Page = () => {
      const [showCreate, setShowCreate] = useState(false);
      const [editing${className}, setEditing${className}] = useState<${className} | null>(null);

      const columns = [
        columnHelper.accessor("id", {
          header: "ID",
        }),
        ${modelConfig.fields.map(f => {
          if (f.relation) {
            return `columnHelper.accessor("${f.name}.name", {
              header: "${toPascalCase(f.name)}",
              enableSorting: true,
            }),`;
          }
          return `columnHelper.accessor("${f.name}", {
            header: "${toPascalCase(f.name).replace(/_/g, ' ')}",
            enableSorting: true,
          }),`;
        }).join('\n        ')}
        columnHelper.accessor("actions", {
          header: "",
          cell: ({ row }) => {
            const item = row.original;
            return (
              <ActionMenu
                groups={[
                  {
                    actions: [
                      {
                        label: "Edit",
                        icon: <Pencil />,
                        onClick: () => setEditing${className}(item),
                      },
                    ],
                  },
                ]}
              />
            );
          },
        }),
      ];

      return (
        <>
          <DataTablePage<${className}>
            title="${className}"
            subtitle="Manage your ${modelConfig.plural}"
            endpoint="/admin/${routePath}"
            columns={columns}
            queryKey="${snakeName}"
            dataKey="${snakeName}"
            actions={[
              {
                type: "button",
                props: {
                  variant: "secondary",
                  size: "small",
                  children: "Create",
                  onClick: () => setShowCreate(true),
                },
              },
            ]}
          />
          {showCreate && (
            <FocusModal open={showCreate} onOpenChange={setShowCreate}>
              <${className}Create onClose={() => setShowCreate(false)} />
            </FocusModal>
          )}
          {editing${className} && (
            <Drawer open onOpenChange={() => setEditing${className}(null)}>
              <${className}Edit 
                item={editing${className}} 
                onClose={() => setEditing${className}(null)} 
              />
            </Drawer>
          )}
        </>
      );
    };

    export const config = defineRouteConfig({
      label: "${className}",
    });

    export default ${className}Page;
    `;
  },

  createComponent: (moduleConfig: ModuleConfig, modelConfig: ModelConfig) => {
    const className = toPascalCase(modelConfig.name);
    const routePath = getRoutePath(moduleConfig, modelConfig);
    const componentName = getComponentName(modelConfig);
    
    return `
    import { Form } from "@medusajs/forms";
    import { Button, FocusModal } from "@medusajs/ui";
    import { useForm } from "react-hook-form";
    import { zodResolver } from "@hookform/resolvers/zod";
    import { PostAdminCreate${className} } from "../../../../api/admin/${routePath}/validators";
    import { InputField, SelectField } from "../../../components/form";

    type Props = {
      onClose: () => void;
    };

    export const ${className}Create = ({ onClose }: Props) => {
      const form = useForm({
        resolver: zodResolver(PostAdminCreate${className}),
      });

      const onSubmit = async (data) => {
        try {
          await fetch(\`/admin/${routePath}\`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          onClose();
        } catch (error) {
          console.error("Failed to create ${className}:", error);
        }
      };

      return (
        <FocusModal.Content>
          <FocusModal.Header>
            <h1>Create ${className}</h1>
          </FocusModal.Header>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FocusModal.Body className="flex flex-col gap-y-8">
                ${modelConfig.fields.map(f => {
                  if (f.relation) {
                    return `<SelectField
                      name="${f.name}_id"
                      label="${toPascalCase(f.name)}"
                      required={${f.required}}
                    />`;
                  }
                  return `<InputField
                    name="${f.name}"
                    label="${toPascalCase(f.name).replace(/_/g, ' ')}"
                    required={${f.required}}
                    type="${f.type === 'number' ? 'number' : 'text'}"
                  />`;
                }).join('\n                ')}
              </FocusModal.Body>
              <FocusModal.Footer>
                <div className="flex items-center justify-end w-full gap-x-2">
                  <Button
                    variant="secondary"
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Create
                  </Button>
                </div>
              </FocusModal.Footer>
            </form>
          </Form>
        </FocusModal.Content>
      );
    };
    `;
  },

  editComponent: (moduleConfig: ModuleConfig, modelConfig: ModelConfig) => {
    const className = toPascalCase(modelConfig.name);
    const routePath = getRoutePath(moduleConfig, modelConfig);
    const componentName = getComponentName(modelConfig);
    
    return `
    import { Form } from "@medusajs/forms";
    import { Button, Drawer } from "@medusajs/ui";
    import { useForm } from "react-hook-form";
    import { zodResolver } from "@hookform/resolvers/zod";
    import { PostAdminUpdate${className} } from "../../../../api/admin/${routePath}/validators";
    import { InputField, SelectField } from "../../../components/form";

    type Props = {
      item: any;
      onClose: () => void;
    };

    export const ${className}Edit = ({ item, onClose }: Props) => {
      const form = useForm({
        resolver: zodResolver(PostAdminUpdate${className}),
        defaultValues: item,
      });

      const onSubmit = async (data) => {
        try {
          await fetch(\`/admin/${routePath}/\${item.id}\`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          onClose();
        } catch (error) {
          console.error("Failed to update ${className}:", error);
        }
      };

      return (
        <Drawer.Content>
          <Drawer.Header>
            <h1>Edit ${className}</h1>
          </Drawer.Header>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Drawer.Body className="flex flex-col gap-y-8">
                ${modelConfig.fields.map(f => {
                  if (f.relation) {
                    return `<SelectField
                      name="${f.name}_id"
                      label="${toPascalCase(f.name)}"
                      required={${f.required}}
                    />`;
                  }
                  return `<InputField
                    name="${f.name}"
                    label="${toPascalCase(f.name).replace(/_/g, ' ')}"
                    required={${f.required}}
                    type="${f.type === 'number' ? 'number' : 'text'}"
                  />`;
                }).join('\n                ')}
              </Drawer.Body>
              <Drawer.Footer>
                <div className="flex items-center justify-end w-full gap-x-2">
                  <Button
                    variant="secondary"
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Save Changes
                  </Button>
                </div>
              </Drawer.Footer>
            </form>
          </Form>
        </Drawer.Content>
      );
    };
    `;
  }
};

type FileChange = {
  path: string;
  type: 'create' | 'modify' | 'merge';
  mergeStrategy?: 'append' | 'prepend';
  description: string;
  originalContent?: string; // Track original content for revert
  content: string; // Add content property
};

function mergeMiddleware(existingContent: string, newContent: string): string {
  // Extract sections using more precise regex
  const extractSection = (content: string, type: 'imports' | 'schemas' | 'routes') => {
    switch (type) {
      case 'imports':
        return (content.match(/import[^;]+;/g) || []).map(imp => imp.trim());
      case 'schemas':
        return (content.match(/export const [^;]+;/g) || []).map(schema => schema.trim());
      case 'routes':
        const routesMatch = content.match(/routes:\s*\[([\s\S]*?)\]\s*}\s*\);/);
        if (!routesMatch) return [];
        return (routesMatch[1].match(/\s*{[^{}]*(?:{[^{}]*})*[^{}]*},?/g) || [])
          .map(route => route.trim())
          .filter(route => route.includes('matcher:'));
    }
  };

  // Extract all sections
  const existingImports = extractSection(existingContent, 'imports');
  const existingSchemas = extractSection(existingContent, 'schemas');
  const existingRoutes = extractSection(existingContent, 'routes');

  const newImports = extractSection(newContent, 'imports');
  const newSchemas = extractSection(newContent, 'schemas');
  const newRoutes = extractSection(newContent, 'routes');

  // Combine unique items
  const allImports = [...new Set([...existingImports, ...newImports])].join('\n');
  const allSchemas = [...new Set([...existingSchemas, ...newSchemas])].join('\n');

  // Helper to get route key (matcher + method)
  const getRouteKey = (route: string) => {
    const matcher = route.match(/matcher:\s*"([^"]+)"/)?.[1] || '';
    const method = route.match(/method:\s*"([^"]+)"/)?.[1] || '';
    return `${method}:${matcher}`;
  };

  // Combine routes using a Map to handle duplicates
  const routeMap = new Map();
  [...existingRoutes, ...newRoutes].forEach(route => {
    const key = getRouteKey(route);
    if (key && !routeMap.has(key)) {
      routeMap.set(key, route);
    }
  });

  // Sort routes by matcher path
  const sortedRoutes = Array.from(routeMap.values())
    .sort((a, b) => {
      const matcherA = a.match(/matcher:\s*"([^"]+)"/)?.[1] || '';
      const matcherB = b.match(/matcher:\s*"([^"]+)"/)?.[1] || '';
      return matcherA.localeCompare(matcherB);
    })
    .join(',\n    ');

  return `// This file is auto-generated and will be overwritten by subsequent generations
// Manual changes should be made to the generator templates instead

${allImports}

${allSchemas}

export default defineMiddlewares({
  routes: [
    ${sortedRoutes}
  ],
});`;
}

export async function generateModule(config: ModuleConfig, options: { addToExisting?: boolean; dryRun?: boolean } = {}) {
  const { addToExisting = false, dryRun = false } = options;
  
  // Generate middleware content
  const middlewareTemplate = TEMPLATES.middleware(config);
  const middlewarePath = path.join(process.cwd(), 'src/api/middlewares.ts');
  
  if (addToExisting && fs.existsSync(middlewarePath)) {
    const existingContent = fs.readFileSync(middlewarePath, 'utf-8');
    const mergedContent = mergeMiddleware(existingContent, middlewareTemplate.fullTemplate);
    
    if (!dryRun) {
      fs.writeFileSync(middlewarePath, await format(mergedContent, { parser: 'typescript' }));
    }
  } else {
    if (!dryRun) {
      fs.writeFileSync(middlewarePath, await format(middlewareTemplate.fullTemplate, { parser: 'typescript' }));
    }
  }

  const changes: FileChange[] = [];

  for (const model of config.models) {
    const routePath = model.parent?.routePrefix || config.plural;
    const componentName = model.parent ? `${model.parent.model.toLowerCase()}-${model.singular}` : model.singular;

    // Model file
    const modelPath = `src/modules/${config.plural}/models/${model.name}.ts`;
    if (!fs.existsSync(modelPath)) {
      changes.push({
        path: modelPath,
        type: 'create',
        description: `Create model file for ${model.name}`,
        content: TEMPLATES.model(model.name, model.fields)
      });
    }

    // Service file
    const servicePath = `src/modules/${config.plural}/service.ts`;
    if (fs.existsSync(servicePath) && options.addToExisting) {
      // Read existing service to check for model
      const existingContent = await fs.promises.readFile(servicePath, 'utf8');
      if (!existingContent.includes(toPascalCase(model.name))) {
        changes.push({
          path: servicePath,
          type: 'modify',
          description: `Update service file to include ${model.name}`,
          content: TEMPLATES.service({ 
            moduleName: toPascalCase(config.name), 
            models: [...config.models.map(m => m.name)]
          })
        });
      }
    } else {
      changes.push({
        path: servicePath,
        type: 'create',
        description: `Create service file for ${config.name} module`,
        content: TEMPLATES.service({ 
          moduleName: toPascalCase(config.name), 
          models: config.models.map(m => m.name)
        })
      });
    }

    // Validator file
    const validatorPath = `src/api/admin/${routePath}/validators.ts`;
    if (!fs.existsSync(validatorPath)) {
      changes.push({
        path: validatorPath,
        type: 'create',
        description: `Create validator for ${model.name}`,
        content: TEMPLATES.validator(model.name, model.fields)
      });
    }

    // Route files
    const routeFilePath = `src/api/admin/${routePath}/route.ts`;
    if (!fs.existsSync(routeFilePath)) {
      changes.push({
        path: routeFilePath,
        type: 'create',
        description: `Create route file for ${model.name}`,
        content: TEMPLATES.route(config, model)
      });
    }

    const idRoutePath = `src/api/admin/${routePath}/[id]/route.ts`;
    if (!fs.existsSync(idRoutePath)) {
      changes.push({
        path: idRoutePath,
        type: 'create',
        description: `Create ID route file for ${model.name}`,
        content: TEMPLATES.idRoute(config, model)
      });
    }

    // Admin UI Components
    const adminPagePath = `src/admin/routes/${config.plural}/${model.plural}/page.tsx`;
    if (!fs.existsSync(adminPagePath)) {
      changes.push({
        path: adminPagePath,
        type: 'create',
        description: `Create admin page for ${model.name}`,
        content: TEMPLATES.pageComponent(config, model)
      });
    }

    const adminCreatePath = `src/admin/routes/${config.plural}/${model.plural}/create/${componentName}-create.tsx`;
    if (!fs.existsSync(adminCreatePath)) {
      changes.push({
        path: adminCreatePath,
        type: 'create',
        description: `Create admin create form for ${model.name}`,
        content: TEMPLATES.createComponent(config, model)
      });
    }

    const adminEditPath = `src/admin/routes/${config.plural}/${model.plural}/edit/${componentName}-edit.tsx`;
    if (!fs.existsSync(adminEditPath)) {
      changes.push({
        path: adminEditPath,
        type: 'create',
        description: `Create admin edit form for ${model.name}`,
        content: TEMPLATES.editComponent(config, model)
      });
    }
  }

  if (options.dryRun) {
    console.log('Changes to be made:');
    for (const change of changes) {
      console.log(`\n${change.type.toUpperCase()}: ${change.path}`);
      console.log('-'.repeat(40));
      if (change.type === 'merge') {
        console.log(`Strategy: ${change.mergeStrategy}`);
      }
      console.log(change.description);
    }
    return;
  }

  // Apply changes
  for (const change of changes) {
    const dir = path.dirname(change.path);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    switch (change.type) {
      case 'create':
        if (!fs.existsSync(change.path)) {
          await fs.promises.writeFile(change.path, change.content);
        }
        break;
      case 'modify':
        await fs.promises.writeFile(change.path, change.content);
        break;
      case 'merge':
        if (fs.existsSync(change.path)) {
          const existingContent = await fs.promises.readFile(change.path, 'utf8');
          const newContent = change.mergeStrategy === 'append'
            ? existingContent + '\n' + change.content
            : change.content + '\n' + existingContent;
          await fs.promises.writeFile(change.path, newContent);
        } else {
          await fs.promises.writeFile(change.path, change.content);
        }
        break;
    }
  }
}

export function dryRunModule(config: ModuleConfig, options: { addToExisting?: boolean } = {}) {
  // First show the content that would be generated
  console.log('\nGenerated File Contents:');
  console.log('======================\n');

  // Generate content for each model
  for (const model of config.models) {
    const routePath = model.parent?.routePrefix || config.plural;

    // Show model file content
    console.log(`src/modules/${config.plural}/models/${model.name}.ts:`);
    console.log('----------------------------------------');
    console.log(TEMPLATES.model(model.name, model.fields));
    console.log('\n');

    // Show validator content
    console.log(`src/api/admin/${routePath}/validators.ts:`);
    console.log('----------------------------------------');
    console.log(TEMPLATES.validator(model.name, model.fields));
    console.log('\n');

    // Show page component
    console.log(`src/admin/routes/${config.plural}/${model.plural}/page.tsx:`);
    console.log('--------------------------------------------');
    console.log(TEMPLATES.pageComponent(config, model));
    console.log('\n');

    // Show create component
    const componentName = model.parent ? `${model.parent.model.toLowerCase()}-${model.singular}` : model.singular;
    console.log(`src/admin/routes/${config.plural}/${model.plural}/create/${componentName}-create.tsx:`);
    console.log('-------------------------------------------------------------------');
    console.log(TEMPLATES.createComponent(config, model));
    console.log('\n');

    // Show edit component
    console.log(`src/admin/routes/${config.plural}/${model.plural}/edit/${componentName}-edit.tsx:`);
    console.log('----------------------------------------------------------------');
    console.log(TEMPLATES.editComponent(config, model));
    console.log('\n');
  }

  // Show service update
  console.log(`src/modules/${config.plural}/service.ts:`);
  console.log('---------------------------');
  if (options.addToExisting) {
    // Include existing models in the service
    const existingModels = ['Vehicle', 'VehicleMake', 'VehicleModel', 'VehicleBody'];
    console.log(TEMPLATES.service({ 
      moduleName: toPascalCase(config.name), 
      models: [...existingModels, ...config.models.map(m => m.name)]
    }));
  } else {
    console.log(TEMPLATES.service({ 
      moduleName: toPascalCase(config.name), 
      models: config.models.map(m => m.name)
    }));
  }
  console.log('\n');

  // Execute the generator
  console.log('Generating files:');
  console.log('================\n');

  generateModule(config, { 
    addToExisting: options.addToExisting,
    dryRun: true 
  });
}

// Example usage with dry run:
// generateModule({
//   name: "inventory",
//   models: [
//     {
//       name: "Category",
//       fields: [
//         { name: "name", type: "string", required: true },
//         { name: "products", type: "string", relation: {
//           type: "hasMany",
//           model: "Product",
//           inverse: "category"
//         }}
//       ]
//     }
//   ]
// }, { 
//   addToExisting: true,
//   dryRun: true 
// }); 