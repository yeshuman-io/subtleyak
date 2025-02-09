import fs from "fs";
import path from "path";
import { format } from "prettier";
import { mergeRoutes } from './utils/route-merge';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import { CallExpression, ObjectProperty, Identifier } from '@babel/types';
import { MiddlewareManager } from './utils/middleware-manager';

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

// Import the utilities
import { generateMiddleware, parseExistingMiddleware } from './utils/middleware-generator';
import { mergeSchemas } from './utils/schema-merge';

// Add type definitions
type Route = {
  matcher: string;
  method: string;
  middlewares: {
    name: string;
    args: any[];
  }[];
};

type MiddlewareConfig = {
  routes: Route[];
  schemas: {
    imports: string[];
    schemas: { name: string; definition: string; }[];
  };
};

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

  middleware: (moduleConfig: ModuleConfig): MiddlewareConfig => {
    const imports = new Set<string>();
    const schemas = new Set<string>();
    const routes: Route[] = [];

    // Add framework imports
    imports.add("import { createFindParams } from '@medusajs/medusa/api/utils/validators';");
    imports.add("import { defineMiddlewares, validateAndTransformQuery, validateAndTransformBody } from '@medusajs/framework/http';");
    imports.add("import { z } from 'zod';");

    // Process each model
    moduleConfig.models.forEach(model => {
      const modelName = toPascalCase(model.name);
      const modelPath = getRoutePath(moduleConfig, model);
      
      // Add validator imports
      imports.add(`import { PostAdminCreate${modelName}, PostAdminUpdate${modelName} } from './admin/${modelPath}/validators';`);
      
      // Add schema
      const schemaName = `Get${modelName}Schema`;
      const schemaDefinition = model.fields.find(f => f.relation?.model === 'Make')
        ? 'createFindParams().extend({ make_id: z.string().optional() })'
        : 'createFindParams()';
      schemas.add(`export const ${schemaName} = ${schemaDefinition};`);

      // Add routes
      const modelRoutes = [
        // GET route
        {
          matcher: `/admin/${modelPath}`,
          method: 'GET',
          middlewares: [
            {
              name: 'validateAndTransformQuery',
              args: [schemaName, {
                defaults: ['id', ...model.fields.map(f => f.name)],
                select: ['id', ...model.fields.map(f => f.name)],
                relations: model.fields
                  .filter(f => f.relation)
                  .map(f => f.name),
                isList: true,
              }]
            }
          ]
        },
        // CREATE route
        {
          matcher: `/admin/${modelPath}`,
          method: 'POST',
          middlewares: [
            {
              name: 'validateAndTransformBody',
              args: [`PostAdminCreate${modelName}`]
            }
          ]
        },
        // UPDATE route
        {
          matcher: `/admin/${modelPath}/:id`,
          method: 'POST',
          middlewares: [
            {
              name: 'validateAndTransformBody',
              args: [`PostAdminUpdate${modelName}`]
            }
          ]
        }
      ];

      routes.push(...modelRoutes);
    });

    return {
      routes,
      schemas: {
        imports: Array.from(imports),
        schemas: Array.from(schemas).map(schema => {
          const [, name, definition] = schema.match(/export const (\w+) = (.+);/) || [];
          return { name, definition };
        })
      }
    };
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

function mergeMiddleware(templates: string[]): string {
  const importMap = new Map<string, string>();
  const standardImports = [
    "import { z } from 'zod';",
    "import { defineMiddlewares, unlessPath, validateAndTransformBody, validateAndTransformQuery } from '@medusajs/framework/http';",
    "import { createFindParams } from '@medusajs/medusa/api/utils/validators';"
  ];

  const routes: string[] = [];
  const schemaMap = new Map<string, string>();

  templates.forEach(content => {
    // Extract imports
    const importMatches = content.match(/import\s+{[^}]+}\s+from\s+['"].*?['"]/g) || [];
    importMatches.forEach(imp => {
      if (!imp.includes('@medusajs/') && !imp.includes('zod')) {
        // Extract the path and imports separately
        const [_, imports, path] = imp.match(/import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/) || [];
        if (imports && path) {
          // Split multiple imports and trim each one
          const importList = imports.split(',').map(i => i.trim());
          importList.forEach(importName => {
            importMap.set(`${importName}:${path}`, `import { ${importName} } from "${path}";`);
          });
        }
      }
    });

    // Extract routes from template strings
    const routeMatches = content.match(/routes:\s*\[([\s\S]*?)\s*\]\s*}\s*\);?$/m);
    if (routeMatches && routeMatches[1].trim()) {
      const routeContent = routeMatches[1].trim();
      let currentRoute = '';
      let depth = 0;

      for (let i = 0; i < routeContent.length; i++) {
        const char = routeContent[i];
        
        if (char === '{') {
          depth++;
          currentRoute += char;
        }
        else if (char === '}') {
          depth--;
          currentRoute += char;
          if (depth === 0) {
            if (currentRoute.includes('matcher:')) {
              routes.push(currentRoute.trim());
            }
            currentRoute = '';
          }
        }
        else {
          currentRoute += char;
        }
      }
    }

    // Extract schemas with deduplication
    const schemaMatches = content.match(/export const (\w+Schema)\s*=\s*[^;]+;/g) || [];
    schemaMatches.forEach(schema => {
      const schemaName = schema.match(/export const (\w+Schema)/)?.[1];
      if (schemaName) {
        schemaMap.set(schemaName, schema);
      }
    });
  });

  // Group routes by type
  const getRoutes = routes.filter(r => r.includes('method: "GET"'));
  const createRoutes = routes.filter(r => r.includes('method: "POST"') && !r.includes('/:id'));
  const updateRoutes = routes.filter(r => r.includes('method: "POST"') && r.includes('/:id'));

  const routeGroups = [
    getRoutes.length > 0 ? `    // GET routes\n    ${getRoutes.join(',\n    ')}` : '',
    createRoutes.length > 0 ? `    // CREATE routes\n    ${createRoutes.join(',\n    ')}` : '',
    updateRoutes.length > 0 ? `    // UPDATE routes\n    ${updateRoutes.join(',\n    ')}` : ''
  ].filter(Boolean);

  return `// This file is auto-generated and will be overwritten by subsequent generations
// Manual changes should be made to the generator templates instead

${standardImports.join('\n')}

${Array.from(importMap.values()).join('\n')}

${Array.from(schemaMap.values()).join('\n')}

export default defineMiddlewares({
  routes: [
${routeGroups.join(',\n\n')}
  ],
});`;
}

// Helper to stringify a route object
function stringifyRoute(route: Route): string {
  const middlewares = route.middlewares.map(m => stringifyMiddleware(m)).join(', ');
  return `{
      matcher: "${route.matcher}",
      method: "${route.method}",
      middlewares: [${middlewares}]
    }`;
}

// Helper to stringify a middleware object
function stringifyMiddleware(middleware: { name: string; args: any[] }): string {
  const args = middleware.args.map(arg => {
    if (typeof arg === 'string') {
      // If it looks like a variable name, return as is
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(arg)) {
        return arg;
      }
      // Otherwise quote it
      return `"${arg}"`;
    }
    if (typeof arg === 'object' && arg !== null) {
      return JSON.stringify(arg);
    }
    return String(arg);
  });
  
  return `${middleware.name}(${args.join(', ')})`;
}

export async function generateModule(moduleConfig: ModuleConfig, options: { addToExisting?: boolean; dryRun?: boolean } = {}) {
  const { addToExisting = false, dryRun = false } = options;
  
  // Create middleware manager and read existing content
  const middlewarePath = path.join(process.cwd(), 'src/api/middlewares.ts');
  const existingContent = fs.existsSync(middlewarePath) 
    ? await fs.promises.readFile(middlewarePath, 'utf-8')
    : '';
  
  const manager = new MiddlewareManager(existingContent);
  
  // Generate new middleware config
  const middlewareConfig = TEMPLATES.middleware(moduleConfig);
  
  // Add imports
  middlewareConfig.schemas.imports.forEach(imp => {
    const match = imp.match(/import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/);
    if (match) {
      const [_, imports, path] = match;
      imports.split(',').forEach(imp => {
        manager.addImport(path, imp.trim());
      });
    }
  });
  
  // Add schemas
  middlewareConfig.schemas.schemas.forEach(schema => {
    manager.addSchema(schema.name, schema.definition);
  });
  
  // Add routes
  middlewareConfig.routes.forEach(route => {
    manager.addRoute(route);
  });
  
  // Generate and write the final file
  const content = await manager.generateFile();
  if (!dryRun) {
    await fs.promises.writeFile(middlewarePath, content);
  }

  const changes: FileChange[] = [];
  
  // For all other files, respect the addToExisting flag
  for (const model of moduleConfig.models) {
    const routePath = model.parent?.routePrefix || moduleConfig.plural;
    const componentName = model.parent ? `${model.parent.model.toLowerCase()}-${model.singular}` : model.singular;

    // Model file
    const modelPath = `src/modules/${moduleConfig.plural}/models/${model.name}.ts`;
    if (!fs.existsSync(modelPath) || !addToExisting) {
      changes.push({
        path: modelPath,
        type: 'create',
        description: `Create model file for ${model.name}`,
        content: TEMPLATES.model(model.name, model.fields)
      });
    }

    // Service file
    const servicePath = `src/modules/${moduleConfig.plural}/service.ts`;
    if (fs.existsSync(servicePath) && addToExisting) {
      // Read existing service to check for model
      const existingContent = await fs.promises.readFile(servicePath, 'utf8');
      if (!existingContent.includes(toPascalCase(model.name))) {
        changes.push({
          path: servicePath,
          type: 'modify',
          description: `Update service file to include ${model.name}`,
          content: TEMPLATES.service({ 
            moduleName: toPascalCase(moduleConfig.name), 
            models: [...moduleConfig.models.map(m => m.name)]
          })
        });
      }
    } else {
      changes.push({
        path: servicePath,
        type: 'create',
        description: `Create service file for ${moduleConfig.name} module`,
        content: TEMPLATES.service({ 
          moduleName: toPascalCase(moduleConfig.name), 
          models: moduleConfig.models.map(m => m.name)
        })
      });
    }

    // Other files - only create if they don't exist or if not addToExisting
    const filesToCreate = [
      {
        path: `src/api/admin/${routePath}/validators.ts`,
        content: TEMPLATES.validator(model.name, model.fields),
        description: `Create validator for ${model.name}`
      },
      {
        path: `src/api/admin/${routePath}/route.ts`,
        content: TEMPLATES.route(moduleConfig, model),
        description: `Create route file for ${model.name}`
      },
      {
        path: `src/api/admin/${routePath}/[id]/route.ts`,
        content: TEMPLATES.idRoute(moduleConfig, model),
        description: `Create ID route file for ${model.name}`
      },
      {
        path: `src/admin/routes/${moduleConfig.plural}/${model.plural}/page.tsx`,
        content: TEMPLATES.pageComponent(moduleConfig, model),
        description: `Create admin page for ${model.name}`
      },
      {
        path: `src/admin/routes/${moduleConfig.plural}/${model.plural}/create/${componentName}-create.tsx`,
        content: TEMPLATES.createComponent(moduleConfig, model),
        description: `Create admin create form for ${model.name}`
      },
      {
        path: `src/admin/routes/${moduleConfig.plural}/${model.plural}/edit/${componentName}-edit.tsx`,
        content: TEMPLATES.editComponent(moduleConfig, model),
        description: `Create admin edit form for ${model.name}`
      }
    ];

    for (const file of filesToCreate) {
      if (!fs.existsSync(file.path) || !addToExisting) {
        changes.push({
          path: file.path,
          type: 'create',
          description: file.description,
          content: file.content
        });
      }
    }
  }

  if (dryRun) {
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