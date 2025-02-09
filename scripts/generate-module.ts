import { MiddlewareManager } from './utils/middleware-manager';
import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';
import * as t from '@babel/types';
import { validateAndTransformQuery, validateAndTransformBody } from '@medusajs/framework/http';

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

// Helper function to get admin route path based on model config
function getAdminRoutePath(moduleConfig: ModuleConfig, modelConfig: ModelConfig): string {
  if (modelConfig.isParent) {
    return moduleConfig.plural;
  }
  // For child models, use the parent's route path plus the child's route
  const parentPath = modelConfig.parent?.routePrefix?.split('/')[0] || moduleConfig.plural;
  const childPath = modelConfig.parent?.routePrefix?.split('/')[1] || modelConfig.plural;
  return `${parentPath}/${childPath}`;
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
  types: (moduleConfig: ModuleConfig) => string;
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
    import { model } from "@medusajs/medusa";

    const ${className} = model.define("${toSnakeCase(modelName)}", {
      id: model.id().primaryKey(),
      ${fields.map(f => {
        if (f.relation) {
          switch (f.relation.type) {
            case 'belongsTo':
              return `${f.name}_id: model.string().references(() => ${f.relation.model}.id)${f.required ? '' : '.optional()'}`;
            case 'hasMany':
              return `${f.name}: model.array(() => ${f.relation.model})${f.required ? '' : '.optional()'}`;
            case 'manyToMany':
              return `${f.name}: model.array(() => ${f.relation.model}).through("${toSnakeCase(modelName)}_${toSnakeCase(f.name)}")${f.required ? '' : '.optional()'}`;
            default:
              return `${f.name}: model.text()${f.required ? '' : '.optional()'}`;
          }
        }
        switch (f.type) {
          case 'string':
            return `${f.name}: model.text()${f.required ? '' : '.optional()'}`;
          case 'number':
            return `${f.name}: model.number()${f.required ? '' : '.optional()'}`;
          case 'boolean':
            return `${f.name}: model.boolean()${f.required ? '' : '.optional()'}`;
          case 'date':
            return `${f.name}: model.date()${f.required ? '' : '.optional()'}`;
          default:
            return `${f.name}: model.text()${f.required ? '' : '.optional()'}`;
        }
      }).join(",\n      ")}
    });

    export default ${className};`;
  },

  service: ({ moduleName, models }: { moduleName: string; models: ModelConfig[] }): string => {
    return `import { MedusaService } from "@medusajs/framework/utils";
    ${models.map(m => `import ${toPascalCase(m.name)} from "./models/${m.name}";`).join("\n    ")}

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
    const routeFilePath = `src/api/admin/${routePath}/route.ts`;
    const workflowFilePath = `src/workflows/create-${modelConfig.name}.ts`;
    const relativePath = path.relative(path.dirname(routeFilePath), workflowFilePath).replace(/\\/g, '/');
    
    return `import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
    import { z } from "zod";
    import { PostAdminCreate${className} } from "./validators";
    import { create${className}Workflow } from "${relativePath}";

    type PostAdminCreate${className}Type = z.infer<typeof PostAdminCreate${className}>;

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
    };

    export const POST = async (
      req: MedusaRequest<PostAdminCreate${className}Type>,
      res: MedusaResponse
    ) => {
      const { result } = await create${className}Workflow.run({
        input: req.validatedBody,
      })

      res.json({ ${toSnakeCase(modelConfig.name)}: result })
    };`;
  },

  idRoute: (moduleConfig: ModuleConfig, modelConfig: ModelConfig): string => {
    const routePath = getRoutePath(moduleConfig, modelConfig);
    const className = toPascalCase(modelConfig.name);
    const routeFilePath = `src/api/admin/${routePath}/[id]/route.ts`;
    const workflowFilePath = `src/workflows/update-${modelConfig.name}.ts`;
    const relativePath = path.relative(path.dirname(routeFilePath), workflowFilePath).replace(/\\/g, '/');
    
    return `import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
    import { z } from "zod";
    import { PostAdminUpdate${className} } from "../validators";
    import { update${className}Workflow } from "${relativePath}";

    type PostAdminUpdate${className}Type = z.infer<typeof PostAdminUpdate${className}>;

    export const POST = async (
      req: MedusaRequest<PostAdminUpdate${className}Type>,
      res: MedusaResponse
    ) => {
      const { result } = await update${className}Workflow.run({
        input: {
          id: req.params.id,
          ...req.validatedBody,
        },
      })

      res.json({ ${toSnakeCase(modelConfig.name)}: result })
    };`;
  },

  workflow: (modelName: string, fields: ModelField[]): string => {
    const className = toPascalCase(modelName);
    const variableName = toSnakeCase(modelName).replace(/-/g, '_');
    return `import { createStep, StepResponse, createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk";

    export type Create${className}StepInput = {
      ${fields.map(f => `${f.name}${f.required ? '' : '?'}: ${f.type}`).join(',\n      ')}
    };

    export const create${className}Step = createStep(
      "create-${modelName}-step",
      async (input: Create${className}StepInput, { container }) => {
        const service = container.resolve("${modelName}")
        const result = await service.create(input)
        return new StepResponse(result, result.id)
      },
      async (id: string, { container }) => {
        const service = container.resolve("${modelName}")
        await service.delete(id)
      }
    );

    export type Create${className}WorkflowInput = Create${className}StepInput;

    export const create${className}Workflow = createWorkflow(
      "create-${modelName}-workflow",
      (input: Create${className}WorkflowInput) => {
        const ${variableName} = create${className}Step(input)
        return new WorkflowResponse(${variableName})
      }
    );

    export type Update${className}StepInput = {
      id: string;
      ${fields.map(f => `${f.name}?: ${f.type}`).join(',\n      ')}
    };

    export const update${className}Step = createStep(
      "update-${modelName}-step",
      async (input: Update${className}StepInput, { container }) => {
        const service = container.resolve("${modelName}")
        const { id, ...data } = input
        const result = await service.update(id, data)
        return new StepResponse(result, result.id)
      }
    );

    export type Update${className}WorkflowInput = Update${className}StepInput;

    export const update${className}Workflow = createWorkflow(
      "update-${modelName}-workflow",
      (input: Update${className}WorkflowInput) => {
        const ${variableName} = update${className}Step(input)
        return new WorkflowResponse(${variableName})
      }
    );`;
  },

  pageComponent: (moduleConfig: ModuleConfig, modelConfig: ModelConfig): string => {
    const className = toPascalCase(modelConfig.name);
    const snakeName = toSnakeCase(modelConfig.name);
    const routePath = getRoutePath(moduleConfig, modelConfig);
    const componentName = getComponentName(modelConfig);
    const pageFilePath = `src/admin/routes/${getAdminRoutePath(moduleConfig, modelConfig)}/page.tsx`;
    const dataTablePath = path.relative(path.dirname(pageFilePath), 'src/admin/components/data-table-page.tsx').replace(/\\/g, '/');
    const actionMenuPath = path.relative(path.dirname(pageFilePath), 'src/admin/components/action-menu.tsx').replace(/\\/g, '/');
    const typesPath = path.relative(path.dirname(pageFilePath), 'src/admin/types').replace(/\\/g, '/');
    
    const camelName = modelConfig.name.replace(/-([a-z])/g, g => g[1].toUpperCase());
    
    return `import { defineRouteConfig } from "@medusajs/admin-sdk";
    import { createDataTableColumnHelper, FocusModal, Drawer } from "@medusajs/ui";
    import { ${className} } from "${typesPath}";
    import { DataTablePage } from "${dataTablePath}";
    import { ${className}Create } from "./create/${componentName}-create";
    import { useState } from "react";
    import { ActionMenu } from "${actionMenuPath}";
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
                ${camelName}={editing${className}} 
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
    const createFilePath = `src/admin/routes/${getAdminRoutePath(moduleConfig, modelConfig)}/create/${componentName}-create.tsx`;
    const validatorsPath = path.relative(path.dirname(createFilePath), `src/api/admin/${routePath}/validators.ts`).replace(/\\/g, '/');
    const formDir = path.relative(path.dirname(createFilePath), 'src/admin/components/form').replace(/\\/g, '/');
    const sdkPath = path.relative(path.dirname(createFilePath), 'src/admin/lib/sdk').replace(/\\/g, '/');
    
    return `import * as zod from "zod";
    import { FormProvider, useForm } from "react-hook-form";
    import { PostAdminCreate${className} } from "${validatorsPath}";
    import { sdk } from "${sdkPath}";
    import { useNavigate } from "react-router-dom";
    import { zodResolver } from "@hookform/resolvers/zod";
    import { SelectField } from "${formDir}/select-field";
    import { InputField } from "${formDir}/input-field";
    import { FormLayout } from "${formDir}/form-layout";
    import { ModalForm } from "${formDir}/modal-form";

    const schema = PostAdminCreate${className};
    type Create${className}FormData = zod.infer<typeof schema>;

    type ${className}CreateProps = {
      onClose: () => void;
    };

    export function ${className}Create({ onClose }: ${className}CreateProps) {
      const navigate = useNavigate();

      const form = useForm<Create${className}FormData>({
        defaultValues: {
          ${modelConfig.fields.map(f => {
            if (f.relation) {
              return `${f.name}_id: "",`;
            }
            switch (f.type) {
              case 'string':
                return `${f.name}: "",`;
              case 'number':
                return `${f.name}: 0,`;
              case 'boolean':
                return `${f.name}: false,`;
              default:
                return `${f.name}: "",`;
            }
          }).join('\n          ')}
        },
        resolver: zodResolver(schema),
      });

      const handleSubmit = form.handleSubmit(async (data) => {
        try {
          await sdk.client.fetch("/admin/${routePath}", {
            method: "POST",
            body: data,
          });

          onClose();
          navigate("/${getAdminRoutePath(moduleConfig, modelConfig)}");
        } catch (error) {
          console.error("Failed to create ${className}:", error);
        }
      });

      return (
        <FormProvider {...form}>
          <ModalForm
            title="Create ${className}"
            onSubmit={handleSubmit}
            onClose={onClose}
          >
            <FormLayout>
              ${modelConfig.fields.map(f => {
                if (f.relation) {
                  return `<SelectField
                    name="${f.name}_id"
                    control={form.control}
                    label="${toPascalCase(f.name)}"
                    placeholder="Select a ${f.name}..."
                    options={[]}
                  />`;
                }
                return `<InputField
                  name="${f.name}"
                  control={form.control}
                  label="${toPascalCase(f.name).replace(/_/g, ' ')}"
                  type="${f.type === 'number' ? 'number' : 'text'}"
                />`;
              }).join('\n              ')}
            </FormLayout>
          </ModalForm>
        </FormProvider>
      );
    };`;
  },

  editComponent: (moduleConfig: ModuleConfig, modelConfig: ModelConfig): string => {
    const className = toPascalCase(modelConfig.name);
    const routePath = getRoutePath(moduleConfig, modelConfig);
    const componentName = getComponentName(modelConfig);
    const editFilePath = `src/admin/routes/${getAdminRoutePath(moduleConfig, modelConfig)}/edit/${componentName}-edit.tsx`;
    const validatorsPath = path.relative(path.dirname(editFilePath), `src/api/admin/${routePath}/validators.ts`).replace(/\\/g, '/');
    const formDir = path.relative(path.dirname(editFilePath), 'src/admin/components/form').replace(/\\/g, '/');
    const typesPath = path.relative(path.dirname(editFilePath), 'src/admin/types').replace(/\\/g, '/');
    const sdkPath = path.relative(path.dirname(editFilePath), 'src/admin/lib/sdk').replace(/\\/g, '/');
    const drawerFormLayoutPath = path.relative(path.dirname(editFilePath), 'src/admin/components/drawer-form-layout').replace(/\\/g, '/');
    const drawerPath = path.relative(path.dirname(editFilePath), 'src/admin/components/drawer').replace(/\\/g, '/');
    
    const camelName = modelConfig.name.replace(/-([a-z])/g, g => g[1].toUpperCase());
    
    return `import * as zod from "zod";
    import { Drawer } from "@medusajs/ui";
    import { FormProvider, useForm } from "react-hook-form";
    import { PostAdminUpdate${className} } from "${validatorsPath}";
    import { sdk } from "${sdkPath}";
    import { useNavigate } from "react-router-dom";
    import { zodResolver } from "@hookform/resolvers/zod";
    import { SelectField } from "${formDir}/select-field";
    import { InputField } from "${formDir}/input-field";
    import { FormLayout } from "${formDir}/form-layout";
    import { DrawerFormLayout } from "${drawerFormLayoutPath}";
    import { useDrawer } from "${drawerPath}";
    import { ${className} } from "${typesPath}";

    const schema = PostAdminUpdate${className};
    type Edit${className}FormData = zod.infer<typeof schema>;

    type ${className}EditProps = {
      ${camelName}: {
        id: string;
        ${modelConfig.fields.map(f => {
          if (f.relation) {
            return `${f.name}_id: string;
            ${f.name}?: { id?: string; name: string };`;
          }
          return `${f.name}: ${f.type};`;
        }).join('\n        ')}
      };
    };

    function ${className}EditForm({ ${camelName} }: ${className}EditProps) {
      const { close } = useDrawer();
      const navigate = useNavigate();

      const form = useForm<Edit${className}FormData>({
        defaultValues: {
          ${modelConfig.fields.map(f => {
            if (f.relation) {
              return `${f.name}_id: ${camelName}.${f.name}?.id || ${camelName}.${f.name}_id,`;
            }
            return `${f.name}: ${camelName}.${f.name},`;
          }).join('\n          ')}
        },
        values: {
          ${modelConfig.fields.map(f => {
            if (f.relation) {
              return `${f.name}_id: ${camelName}.${f.name}?.id || ${camelName}.${f.name}_id,`;
            }
            return `${f.name}: ${camelName}.${f.name},`;
          }).join('\n          ')}
        },
        resolver: zodResolver(schema),
      });

      const handleSubmit = form.handleSubmit(async (data) => {
        try {
          await sdk.client.fetch(\`/admin/${routePath}/\${${camelName}.id}\`, {
            method: "POST",
            body: data,
          });
          
          close();
          navigate("/${getAdminRoutePath(moduleConfig, modelConfig)}");
        } catch (error) {
          console.error("Failed to update ${className}:", error);
        }
      });

      return (
        <FormProvider {...form}>
          <DrawerFormLayout
            title="Edit ${className}"
            description="Edit ${modelConfig.name} details"
            onSubmit={handleSubmit}
          >
            <FormLayout>
              ${modelConfig.fields.map(f => {
                if (f.relation) {
                  return `<SelectField
                    name="${f.name}_id"
                    control={form.control}
                    label="${toPascalCase(f.name)}"
                    placeholder="Select a ${f.name}..."
                    options={[]}
                    defaultValue={${camelName}.${f.name}?.name}
                  />`;
                }
                return `<InputField
                  name="${f.name}"
                  control={form.control}
                  label="${toPascalCase(f.name).replace(/_/g, ' ')}"
                  type="${f.type === 'number' ? 'number' : 'text'}"
                />`;
              }).join('\n              ')}
            </FormLayout>
          </DrawerFormLayout>
        </FormProvider>
      );
    }

    export function ${className}Edit(props: ${className}EditProps) {
      return (
        <Drawer.Content aria-describedby="edit-${modelConfig.name}-description">
          <${className}EditForm ${camelName}={props.${camelName}} />
        </Drawer.Content>
      );
    }`;
  },

  types: (moduleConfig: ModuleConfig): string => {
    const imports: string[] = [];
    const types: string[] = [];
    const listTypes: string[] = [];

    moduleConfig.models.forEach(model => {
      const className = toPascalCase(model.name);
      const snakeName = toSnakeCase(model.name);

      // Add type definition
      types.push(`export type ${className} = {
        id: string
        ${model.fields.map(f => {
          if (f.relation) {
            switch (f.relation.type) {
              case 'belongsTo':
                return `${f.name}_id${f.required ? '' : '?'}: string
                ${f.name}?: ${f.relation.model}`;
              case 'hasMany':
                return `${f.name}?: ${f.relation.model}[]`;
              case 'manyToMany':
                return `${f.name}?: ${f.relation.model}[]`;
              default:
                return `${f.name}${f.required ? '' : '?'}: string`;
            }
          }
          return `${f.name}${f.required ? '' : '?'}: ${f.type}`;
        }).join('\n        ')}
        created_at: string
        updated_at: string
        deleted_at: string | null
      }`);

      // Add list response type
      listTypes.push(`export type List${className}Res = {
        ${snakeName}s: ${className}[]
        count: number
        limit: number
        offset: number
      }`);
    });

    return `${imports.join('\n')}

${types.join('\n\n')}

${listTypes.join('\n\n')}`;
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
            t.identifier(`Get${className}Schema`),
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
          args: [t.identifier(`PostAdminCreate${className}`)]
        }
      ]
    });

    manager.addRoute({
      matcher: `/admin/${routePath}/:id`,
      method: 'POST',
      middlewares: [
        {
          name: 'validateAndTransformBody',
          args: [t.identifier(`PostAdminUpdate${className}`)]
        }
      ]
    });
  }

  // Generate and write middleware file
  const middlewareContent = await manager.generateFile();
  if (!dryRun) {
    await fs.writeFile(middlewarePath, middlewareContent);
  }

  // Generate files
  const changes: FileChange[] = [];

  // Add types file
  const typesPath = 'src/admin/types/index.ts';
  const typesContent = TEMPLATES.types(moduleConfig);
  
  if (!dryRun) {
    // If file exists, append new types
    if (existsSync(typesPath) && addToExisting) {
      const existingTypes = await fs.readFile(typesPath, 'utf-8');
      await fs.writeFile(typesPath, `${existingTypes}\n\n${typesContent}`);
    } else {
      await fs.mkdir(path.dirname(typesPath), { recursive: true });
      await fs.writeFile(typesPath, typesContent);
    }
  }
  
  changes.push({
    path: typesPath,
    type: addToExisting ? 'modify' : 'create',
    content: typesContent
  });

  // Generate other files
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
        path: `src/admin/routes/${getAdminRoutePath(moduleConfig, model)}/page.tsx`,
        content: TEMPLATES.pageComponent(moduleConfig, model)
      },
      {
        path: `src/admin/routes/${getAdminRoutePath(moduleConfig, model)}/create/${componentName}-create.tsx`,
        content: TEMPLATES.createComponent(moduleConfig, model)
      },
      {
        path: `src/admin/routes/${getAdminRoutePath(moduleConfig, model)}/edit/${componentName}-edit.tsx`,
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