import { MiddlewareManager } from './utils/middleware-manager';
import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';
import * as t from '@babel/types';

// Core types
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
  name: string;
  singular: string;
  plural: string;
  isParent?: boolean;
  parent?: {
    model: string;
    routePrefix: string;
  };
  fields: ModelField[];
};

type ModuleConfig = {
  name: string;
  plural: string;
  models: ModelConfig[];
};

type FileChange = {
  path: string;
  type: 'create' | 'modify';
  content: string;
};

// Helper functions
const toPascalCase = (str: string): string => {
  if (!str) return '';
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
};

const toSnakeCase = (str: string): string => {
  return str.replace(/-/g, '_').toLowerCase();
};

// Helper function to get route path based on model config
function getRoutePath(moduleConfig: ModuleConfig, modelConfig: ModelConfig): string {
  if (modelConfig.isParent) {
    return moduleConfig.plural;
  }
  return modelConfig.parent?.routePrefix || `${moduleConfig.plural}/${modelConfig.plural}`;
}

// Template types
type TemplateMap = {
  model: (modelName: string, fields: ModelField[]) => string;
  service: (params: { moduleName: string; models: ModelConfig[] }) => string;
  validator: (modelName: string, fields: ModelField[]) => string;
  route: (moduleConfig: ModuleConfig, modelConfig: ModelConfig) => string;
  idRoute: (moduleConfig: ModuleConfig, modelConfig: ModelConfig) => string;
  workflow: (modelName: string, fields: ModelField[]) => string;
  pageComponent: (moduleConfig: ModuleConfig, modelConfig: ModelConfig) => string;
  createComponent: (moduleConfig: ModuleConfig, modelConfig: ModelConfig) => string;
  editComponent: (moduleConfig: ModuleConfig, modelConfig: ModelConfig) => string;
};

// Helper function to get component name based on model config
function getComponentName(modelConfig: ModelConfig): string {
  if (modelConfig.isParent) {
    return modelConfig.singular;
  }
  const parentPrefix = modelConfig.parent?.model.toLowerCase() || '';
  return `${parentPrefix}-${modelConfig.singular}`;
}

// Core templates
const TEMPLATES: TemplateMap = {
  model: (modelName: string, fields: ModelField[]): string => {
    const className = toPascalCase(modelName);
    const toKebabCase = (str: string) => str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    
    const imports = fields
      .filter((f) => f.relation)
      .map((f) => `import ${f.relation!.model} from "./${toKebabCase(f.relation!.model).toLowerCase()}";`)
      .join("\n");

    return `${imports}

    const ${className} = model.define("${toSnakeCase(modelName)}", {
      id: model.id().primaryKey(),
      ${fields.map(f => `${f.name}: model.text()`).join(",\n      ")}
    });

    export default ${className};`;
  },

  service: ({ moduleName, models }: { moduleName: string; models: ModelConfig[] }): string => {
    return `import { MedusaService } from "@medusajs/framework/utils";
    ${models.map(m => `import ${toPascalCase(m.name)} from "./models/${m.name}";`).join("\n")}

    class ${moduleName}Service extends MedusaService({
      ${models.map(m => toPascalCase(m.name)).join(",\n      ")}
    }) {}

    export default ${moduleName}Service;`;
  },

  validator: (modelName: string, fields: ModelField[]): string => {
    const className = toPascalCase(modelName);
    return `import { z } from "zod";

    // GET schema for querying
    export const Get${className}Schema = z.object({
      id: z.string().optional(),
      ${fields
        .filter(f => !f.relation)
        .map(f => `${f.name}: z.${f.type}().optional()`)
        .join(",\n      ")},
      limit: z.number().optional(),
      offset: z.number().optional()
    }).strict();

    // Create schema - all required fields must be present
    export const PostAdminCreate${className} = z.object({
      ${fields
        .filter(f => !f.relation)
        .map(f => `${f.name}: z.${f.type}()${f.required ? "" : ".optional()"}`)
        .join(",\n      ")}
    }).strict();

    // Update schema - all fields are optional
    export const PostAdminUpdate${className} = z.object({
      ${fields
        .filter(f => !f.relation)
        .map(f => `${f.name}: z.${f.type}().optional()`)
        .join(",\n      ")}
    }).strict();

    export type AdminCreate${className}Req = z.infer<typeof PostAdminCreate${className}>;
    export type AdminUpdate${className}Req = z.infer<typeof PostAdminUpdate${className}>;`;
  },

  route: (moduleConfig: ModuleConfig, modelConfig: ModelConfig): string => {
    const routePath = getRoutePath(moduleConfig, modelConfig);
    const className = toPascalCase(modelConfig.name);
    
    return `import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
    import { z } from "zod";
    import { PostAdminCreate${className} } from "./validators";

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
    };`;
  },

  idRoute: (moduleConfig: ModuleConfig, modelConfig: ModelConfig): string => {
    const routePath = getRoutePath(moduleConfig, modelConfig);
    const className = toPascalCase(modelConfig.name);
    
    return `import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
    import { z } from "zod";
    import { PostAdminUpdate${className} } from "../validators";

    export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
      const { result } = await update${className}Workflow(req.scope).run({
        input: {
          id: req.params.id,
          ...req.validatedBody,
        },
      })

      res.json({ ${toSnakeCase(modelConfig.name)}: result })
    };`;
  },

  workflow: (modelName: string, fields: ModelField[]): string => {
    return `import { createStep, StepResponse, createWorkflow } from "@medusajs/framework/workflows-sdk";

    export const create${toPascalCase(modelName)}Step = createStep(
      "create-${modelName}-step",
      async (input, { container }) => {
        const moduleService = container.resolve("${modelName}")

        const result = await moduleService.create({
          ...input,
        })

        return new StepResponse(result, result.id)
      }
    );

    export const create${toPascalCase(modelName)}Workflow = (container) =>
      createWorkflow(container, {
        steps: [create${toPascalCase(modelName)}Step],
      });`;
  },

  pageComponent: (moduleConfig: ModuleConfig, modelConfig: ModelConfig): string => {
    const className = toPascalCase(modelConfig.name);
    const snakeName = toSnakeCase(modelConfig.name);
    const routePath = getRoutePath(moduleConfig, modelConfig);
    const componentName = getComponentName(modelConfig);
    
    return `import { defineRouteConfig } from "@medusajs/admin-sdk";
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

    export default ${className}Page;`;
  },

  createComponent: (moduleConfig: ModuleConfig, modelConfig: ModelConfig): string => {
    const className = toPascalCase(modelConfig.name);
    const routePath = getRoutePath(moduleConfig, modelConfig);
    const componentName = getComponentName(modelConfig);
    
    return `import { Form } from "@medusajs/forms";
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
    };`;
  },

  editComponent: (moduleConfig: ModuleConfig, modelConfig: ModelConfig): string => {
    const className = toPascalCase(modelConfig.name);
    const routePath = getRoutePath(moduleConfig, modelConfig);
    const componentName = getComponentName(modelConfig);
    
    return `import { Form } from "@medusajs/forms";
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
    };`;
  }
};

// Main module generation function
export async function generateModule(moduleConfig: ModuleConfig, options: { addToExisting?: boolean; dryRun?: boolean } = {}): Promise<{ changes: FileChange[] }> {
  const { addToExisting = false, dryRun = false } = options;
  
  // Initialize middleware manager
  const middlewarePath = path.join(process.cwd(), 'src/api/middlewares.ts');
  const existingContent = existsSync(middlewarePath) 
    ? await fs.readFile(middlewarePath, 'utf-8')
    : '';
  
  const manager = new MiddlewareManager(existingContent);

  // Add standard imports
  type ImportConfig = [string, string[]];

  const standardImports: ImportConfig[] = [
    ['zod', ['z']],
    ['@medusajs/framework/http', ['defineMiddlewares', 'validateAndTransformQuery', 'validateAndTransformBody']],
    ['@medusajs/medusa/api/utils/validators', ['createFindParams']]
  ];

  standardImports.forEach(([source, names]) => {
    names.forEach(name => manager.addImport(source, name));
  });

  // Add base schema definitions
  manager.addSchemaDefinition(
    'GetVehiclesSchema',
    t.callExpression(t.identifier('createFindParams'), []),
    true // export
  );

  manager.addSchemaDefinition(
    'GetVehicleModelsSchema',
    t.callExpression(
      t.memberExpression(
        t.callExpression(t.identifier('createFindParams'), []),
        t.identifier('extend')
      ),
      [
        t.objectExpression([
          t.objectProperty(
            t.identifier('make_id'),
            t.callExpression(
              t.memberExpression(
                t.callExpression(
                  t.memberExpression(t.identifier('z'), t.identifier('string')),
                  []
                ),
                t.identifier('optional')
              ),
              []
            )
          )
        ])
      ]
    ),
    true // export
  );

  // Add routes for each model
  for (const model of moduleConfig.models) {
    const routePath = getRoutePath(moduleConfig, model);
    const className = toPascalCase(model.name);

    // Add validator imports
    manager.addImport(`./admin/${routePath}/validators`, `Get${className}Schema`);
    manager.addImport(`./admin/${routePath}/validators`, `PostAdminCreate${className}`);
    manager.addImport(`./admin/${routePath}/validators`, `PostAdminUpdate${className}`);

    // Add routes
    manager.addRoute({
      matcher: `/admin/${routePath}`,
      method: 'GET',
      middlewares: [
        {
          name: 'validateAndTransformQuery',
          args: [
            { type: 'identifier', value: `Get${className}Schema` },
            {
              defaults: ['id', ...model.fields.map(f => f.name)],
              relations: model.fields.filter(f => f.relation).map(f => f.name),
              isList: true
            }
          ]
        }
      ]
    });

    manager.addRoute({
      matcher: `/admin/${routePath}`,
      method: 'POST',
      middlewares: [
        {
          name: 'validateAndTransformBody',
          args: [{ type: 'identifier', value: `PostAdminCreate${className}` }]
        }
      ]
    });

    manager.addRoute({
      matcher: `/admin/${routePath}/:id`,
      method: 'POST',
      middlewares: [
        {
          name: 'validateAndTransformBody',
          args: [{ type: 'identifier', value: `PostAdminUpdate${className}` }]
        }
      ]
    });
  }

  // Generate and write middleware file
  const middlewareContent = await manager.generateFile();
  if (!dryRun) {
    await fs.writeFile(middlewarePath, middlewareContent);
  }

  // Generate other files
  const changes: FileChange[] = [];
  for (const model of moduleConfig.models) {
    const routePath = getRoutePath(moduleConfig, model);
    const className = toPascalCase(model.name);
    const componentName = getComponentName(model);

    // Only create files if they don't exist or if not addToExisting
    const filesToCreate = [
      // Models
      {
        path: `src/modules/${moduleConfig.plural}/models/${model.name}.ts`,
        content: TEMPLATES.model(model.name, model.fields)
      },
      // API Routes & Validators
      {
        path: `src/api/admin/${routePath}/validators.ts`,
        content: TEMPLATES.validator(model.name, model.fields)
      },
      {
        path: `src/api/admin/${routePath}/route.ts`,
        content: TEMPLATES.route(moduleConfig, model)
      },
      {
        path: `src/api/admin/${routePath}/[id]/route.ts`,
        content: TEMPLATES.idRoute(moduleConfig, model)
      },
      // Admin UI
      {
        path: `src/admin/routes/${routePath}/page.tsx`,
        content: TEMPLATES.pageComponent(moduleConfig, model)
      },
      {
        path: `src/admin/routes/${routePath}/create/${componentName}-create.tsx`,
        content: TEMPLATES.createComponent(moduleConfig, model)
      },
      {
        path: `src/admin/routes/${routePath}/edit/${componentName}-edit.tsx`,
        content: TEMPLATES.editComponent(moduleConfig, model)
      },
      // Workflows
      {
        path: `src/workflows/create-${model.name}.ts`,
        content: TEMPLATES.workflow(model.name, model.fields)
      },
      {
        path: `src/workflows/update-${model.name}.ts`,
        content: TEMPLATES.workflow(model.name, model.fields)
      }
    ];

    // Add service file if it doesn't exist
    if (!addToExisting || !existsSync(`src/modules/${moduleConfig.plural}/service.ts`)) {
      filesToCreate.push({
        path: `src/modules/${moduleConfig.plural}/service.ts`,
        content: TEMPLATES.service({ 
          moduleName: toPascalCase(moduleConfig.name), 
          models: moduleConfig.models
        })
      });
    }

    // Create files
    if (!dryRun) {
      for (const file of filesToCreate) {
        await fs.mkdir(path.dirname(file.path), { recursive: true });
        await fs.writeFile(file.path, file.content);
      }
    }

    changes.push(...filesToCreate.map(f => ({
      path: f.path,
      type: 'create' as const,
      content: f.content
    })));
  }

  return { changes };
}