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
  return str.replace(/-/g, '_');
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

type ModuleConfig = {
  name: string;
  models: {
    name: string;
    fields: ModelField[];
  }[];
};

export const TEMPLATES = {
  model: (modelName: string, fields: ModelField[]) => {
    const className = toPascalCase(modelName);
    const toKebabCase = (str: string) => str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    
    return `
    import { model } from "@medusajs/framework/utils"
    ${fields
      .filter((f) => f.relation)
      .map((f) => `import ${toPascalCase(f.relation!.model)} from "./${toKebabCase(f.relation!.model)}"`)
      .join("\n    ")}

    const ${className} = model.define("${toSnakeCase(modelName)}", {
      id: model.id().primaryKey(),
      ${fields
        .map((f) => {
          if (f.relation) {
            switch (f.relation.type) {
              case "belongsTo":
                return `${f.name}: model.belongsTo(() => ${toPascalCase(f.relation.model)}${f.relation.inverse ? `, { inverse: "${f.relation.inverse}" }` : ''})`;
              case "hasMany":
                return `${f.name}: model.hasMany(() => ${toPascalCase(f.relation.model)}, { mappedBy: "${f.relation.inverse || f.name}" })`;
              case "manyToMany":
                return `${f.name}: model.manyToMany(() => ${toPascalCase(f.relation.model)}, { mappedBy: "${f.relation.inverse || f.name}" })`;
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
    const classNames = models.map(m => toPascalCase(typeof m === 'string' ? m : m.name));
    const modelPaths = models.map(m => {
      const name = typeof m === 'string' ? m : m.name;
      return name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    });
    return `
    import { MedusaService } from "@medusajs/framework/utils"
    ${classNames.map((className, i) => `import ${className} from "./models/${modelPaths[i]}"`).join("\n    ")}

    class ${moduleName}Service extends MedusaService({
      ${classNames.join(",\n      ")}
    }){
    }

    export default ${moduleName}Service
    `
  },

  validator: (modelName: string, fields: ModelField[]) => {
    const className = toPascalCase(modelName);
    return `
    import { z } from "zod"

    export const PostAdminCreate${className} = z.object({
      ${fields
        .filter((f) => !f.relation)
        .map(
          (f) =>
            `${f.name}: z.${f.type}()${f.required ? "" : ".optional()"}${
              f.type === "string" ? ".min(1)" : ""
            }`
        )
        .join(",\n")},
      ${fields
        .filter((f) => f.relation)
        .map(
          (f) =>
            `${f.name}_id: z.string()${f.required ? "" : ".optional()"}.min(1)`
        )
        .join(",\n")}
    })

    export const PostAdminUpdate${className} = z.object({
      ${fields
        .filter((f) => !f.relation)
        .map(
          (f) =>
            `${f.name}: z.${f.type}()${".optional()"}${
              f.type === "string" ? ".min(1)" : ""
            }`
        )
        .join(",\n")},
      ${fields
        .filter((f) => f.relation)
        .map(
          (f) =>
            `${f.name}_id: z.string().optional().min(1)`
        )
        .join(",\n")}
    })
    `;
  },

  route: (modelName: string) => `
    import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
    import { z } from "zod"
    import { PostAdminCreate${modelName} } from "./validators"
    
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
        entity: "${modelName.toLowerCase()}",
        ...req.queryConfig,
      }

      const { data: ${modelName.toLowerCase()}_items, metadata } = await query.graph(
        queryOptions
      ) as QueryResponse

      res.json({
        ${modelName.toLowerCase()}_items,
        count: metadata.count,
        limit: metadata.take,
        offset: metadata.skip,
      })
    }

    type PostAdminCreate${modelName}Type = z.infer<typeof PostAdminCreate${modelName}>

    export const POST = async (
      req: MedusaRequest<PostAdminCreate${modelName}Type>,
      res: MedusaResponse
    ) => {
      const { result } = await create${modelName}Workflow(req.scope).run({
        input: req.validatedBody,
      })

      res.json({ ${modelName.toLowerCase()}: result })
    }
  `,

  idRoute: (modelName: string) => `
    import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
    import { z } from "zod"
    import { update${modelName}Workflow } from "../../../../../workflows/update-${modelName.toLowerCase()}"
    import { PostAdminUpdate${modelName} } from "../validators"

    type PostAdminUpdate${modelName}Type = z.infer<typeof PostAdminUpdate${modelName}>

    export const POST = async (
      req: MedusaRequest<PostAdminUpdate${modelName}Type>,
      res: MedusaResponse
    ) => {
      const { result } = await update${modelName}Workflow(req.scope).run({
        input: {
          id: req.params.id,
          ...req.validatedBody,
        },
      })

      res.json({ ${modelName.toLowerCase()}: result })
    }
  `,

  workflow: (modelName: string, fields: ModelField[]) => `
    import {
      createStep,
      StepResponse,
      createWorkflow,
      WorkflowResponse,
    } from "@medusajs/framework/workflows-sdk"

    export type Create${modelName}StepInput = {
      ${fields
        .map((f) => `${f.name}${f.required ? "" : "?"}: ${f.type}`)
        .join("\n")}
    }

    export const create${modelName}Step = createStep(
      "create-${modelName.toLowerCase()}-step",
      async (input: Create${modelName}StepInput, { container }) => {
        const moduleService = container.resolve("${modelName.toLowerCase()}")

        const result = await moduleService.create({
          ...input,
        })

        return new StepResponse(result, result.id)
      },
      async (id: string, { container }) => {
        const moduleService = container.resolve("${modelName.toLowerCase()}")
        await moduleService.delete(id)
      }
    )

    type Create${modelName}WorkflowInput = Create${modelName}StepInput

    export const create${modelName}Workflow = createWorkflow(
      "create-${modelName.toLowerCase()}-workflow",
      (input: Create${modelName}WorkflowInput) => {
        const result = create${modelName}Step(input)
        return new WorkflowResponse(result)
      }
    )
  `,

  adminPage: (modelName: string, fields: ModelField[]) => {
    const className = toPascalCase(modelName);
    return `
    import { defineRouteConfig } from "@medusajs/admin-sdk"
    import { createDataTableColumnHelper, FocusModal, Drawer } from "@medusajs/ui"
    import { ${className} } from "../../../../types"
    import { DataTablePage } from "../../../../components/data-table-page"
    import { ${className}Create } from "./create/vehicle-${modelName}-create"
    import { ${className}Edit } from "./edit/vehicle-${modelName}-edit"
    import { useState } from "react"
    import { ActionMenu } from "../../../../components/action-menu"
    import { Pencil } from "@medusajs/icons"

    const columnHelper = createDataTableColumnHelper<${className}>()

    const ${className}Page = () => {
      const [showCreate, setShowCreate] = useState(false)
      const [editing, setEditing] = useState<${className} | null>(null)

      const columns = [
        columnHelper.accessor("id", {
          header: "ID",
        }),
        ${fields
          .filter(f => !f.relation)
          .map(f => `columnHelper.accessor("${f.name}", {
          header: "${f.name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}",
          enableSorting: true,
        })`).join(",\n        ")},
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
                        onClick: () => setEditing(item),
                      },
                    ],
                  },
                ]}
              />
            );
          },
        }),
      ]

      return (
        <>
          <DataTablePage<${className}>
            title="${className}s"
            subtitle="Manage your ${modelName.toLowerCase()}s"
            endpoint="/admin/vehicles/${modelName}"
            columns={columns}
            queryKey="${modelName}"
            dataKey="${modelName}s"
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
          {editing && (
            <Drawer open onOpenChange={() => setEditing(null)}>
              <${className}Edit 
                item={editing} 
                onClose={() => setEditing(null)} 
              />
            </Drawer>
          )}
        </>
      )
    }

    export const config = defineRouteConfig({
      label: "${className}s",
    })

    export default ${className}Page
    `
  },

  createWorkflow: (modelName: string, fields: ModelField[]) => {
    const className = toPascalCase(modelName);
    return `
    import {
      createStep,
      StepResponse,
      createWorkflow,
      WorkflowResponse,
    } from "@medusajs/framework/workflows-sdk"
    import { VEHICLES_MODULE } from "../modules/vehicles"
    import VehiclesModuleService from "../modules/vehicles/service"

    export type Create${className}StepInput = {
      ${fields
        .filter(f => !f.relation)
        .map((f) => `${f.name}${f.required ? "" : "?"}: ${f.type}`)
        .join(",\n")}
      ${fields
        .filter(f => f.relation)
        .map((f) => `${f.name}_id${f.required ? "" : "?"}: string`)
        .join(",\n")}
    }

    export const create${className}Step = createStep(
      "create-${modelName}-step",
      async (input: Create${className}StepInput, { container }) => {
        const vehiclesModuleService: VehiclesModuleService =
          container.resolve(VEHICLES_MODULE)

        const result = await vehiclesModuleService.create${className}({
          ...input,
        })

        return new StepResponse(result, result.id)
      },
      async (id: string, { container }) => {
        const vehiclesModuleService: VehiclesModuleService =
          container.resolve(VEHICLES_MODULE)

        await vehiclesModuleService.delete${className}(id)
      }
    )

    type Create${className}WorkflowInput = Create${className}StepInput

    export const create${className}Workflow = createWorkflow(
      "create-${modelName}-workflow",
      (input: Create${className}WorkflowInput) => {
        const result = create${className}Step(input)
        return new WorkflowResponse(result)
      }
    )
    `;
  },

  updateWorkflow: (modelName: string, fields: ModelField[]) => {
    const className = toPascalCase(modelName);
    return `
    import {
      createStep,
      StepResponse,
      createWorkflow,
      WorkflowResponse,
    } from "@medusajs/framework/workflows-sdk"
    import { VEHICLES_MODULE } from "../modules/vehicles"
    import VehiclesModuleService from "../modules/vehicles/service"

    export type Update${className}StepInput = {
      id: string
      ${fields
        .filter(f => !f.relation)
        .map((f) => `${f.name}?: ${f.type}`)
        .join(",\n")}
      ${fields
        .filter(f => f.relation)
        .map((f) => `${f.name}_id?: string`)
        .join(",\n")}
    }

    export const update${className}Step = createStep(
      "update-${modelName}-step",
      async (input: Update${className}StepInput, { container }) => {
        const vehiclesModuleService: VehiclesModuleService =
          container.resolve(VEHICLES_MODULE)

        // First, get the existing entity to preserve any fields we're not updating
        const existing = await vehiclesModuleService.retrieve${className}(input.id)

        const result = await vehiclesModuleService.update${className}({
          id: input.id,
          ...input,
        })

        return new StepResponse(result, result.id)
      },
      async (id: string, { container }) => {
        // Rollback logic if needed
        const vehiclesModuleService: VehiclesModuleService =
          container.resolve(VEHICLES_MODULE)
      }
    )

    type Update${className}WorkflowInput = Update${className}StepInput

    export const update${className}Workflow = createWorkflow(
      "update-${modelName}-workflow",
      (input: Update${className}WorkflowInput) => {
        const result = update${className}Step(input)
        return new WorkflowResponse(result)
      }
    )
    `;
  },

  createForm: (modelName: string, fields: ModelField[]) => {
    const className = toPascalCase(modelName);
    
    // Type guard function
    const hasValidRelation = (field: ModelField): field is ModelField & { relation: { model: string } } => {
      return field.relation !== undefined && 
             typeof field.relation === 'object' && 
             'model' in field.relation &&
             typeof field.relation.model === 'string';
    };

    return `
    import { useForm } from "react-hook-form"
    import { zodResolver } from "@hookform/resolvers/zod"
    import { useNavigate } from "react-router-dom"
    import { Form, Input, Select } from "@medusajs/ui"
    import { useAdminCreateVehicle${className} } from "../../../../hooks/vehicles/${modelName}"
    import { PostAdminCreate${className} } from "../../../../types"
    import { useToast } from "../../../../hooks/use-toast"
    import { useEffect } from "react"
    ${fields
      .filter(hasValidRelation)
      .map(f => `import { useAdminList${toPascalCase(f.relation.model)} } from "../../../../hooks/vehicles/${f.relation.model.toLowerCase()}"`)
      .join("\n    ")}

    type Props = {
      onClose: () => void
    }

    export const ${className}Create = ({ onClose }: Props) => {
      const navigate = useNavigate()
      const { toast } = useToast()
      const { mutateAsync: create${className}, isLoading } = useAdminCreateVehicle${className}()
      ${fields
        .filter(hasValidRelation)
        .map(f => `const { data: ${f.relation.model.toLowerCase()}s } = useAdminList${toPascalCase(f.relation.model)}()`)
        .join("\n      ")}

      const form = useForm<PostAdminCreate${className}>({
        resolver: zodResolver(PostAdminCreate${className}),
        defaultValues: {
          ${fields.map(f => `${f.name}: ${f.type === "string" ? '""' : f.type === "number" ? "0" : "null"}`).join(",\n          ")}
        }
      })

      const onSubmit = async (data: PostAdminCreate${className}) => {
        try {
          await create${className}(data)
          toast({
            title: "Success",
            description: "${className} created successfully",
            variant: "success",
          })
          onClose()
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to create ${className}",
            variant: "error",
          })
        }
      }

      return (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold">Create ${className}</h1>
              <p className="text-sm text-gray-500">Fill in the details below to create a new ${modelName.toLowerCase()}</p>
            </div>
            ${fields.map(f => {
              if (hasValidRelation(f)) {
                return `
              <Form.Field
                control={form.control}
                name="${f.name}"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>${f.name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</Form.Label>
                    <Form.Control>
                      <Select
                        {...field}
                        options={${f.relation.model.toLowerCase()}s?.items?.map(item => ({
                          label: item.name || item.id,
                          value: item.id,
                        })) || []}
                      />
                    </Form.Control>
                    <Form.Message />
                  </Form.Item>
                )}
              />`
              }
              return `
              <Form.Field
                control={form.control}
                name="${f.name}"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>${f.name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</Form.Label>
                    <Form.Control>
                      <Input {...field} type="${f.type === "number" ? "number" : "text"}" />
                    </Form.Control>
                    <Form.Message />
                  </Form.Item>
                )}
              />`
            }).join("")}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </form>
        </Form>
      )
    }
    `
  },

  editForm: (modelName: string, fields: ModelField[]) => {
    const className = toPascalCase(modelName);
    
    // Type guard function
    const hasValidRelation = (field: ModelField): field is ModelField & { relation: { model: string } } => {
      return field.relation !== undefined && 
             typeof field.relation === 'object' && 
             'model' in field.relation &&
             typeof field.relation.model === 'string';
    };

    return `
    import { useForm } from "react-hook-form"
    import { zodResolver } from "@hookform/resolvers/zod"
    import { useNavigate } from "react-router-dom"
    import { Form, Input, Select } from "@medusajs/ui"
    import { useAdminUpdateVehicle${className} } from "../../../../hooks/vehicles/${modelName}"
    import { PostAdminUpdate${className} } from "../../../../types"
    import { useToast } from "../../../../hooks/use-toast"
    import { useEffect } from "react"
    ${fields
      .filter(hasValidRelation)
      .map(f => `import { useAdminList${toPascalCase(f.relation.model)} } from "../../../../hooks/vehicles/${f.relation.model.toLowerCase()}"`)
      .join("\n    ")}

    type Props = {
      item: any
      onClose: () => void
    }

    export const ${className}Edit = ({ item, onClose }: Props) => {
      const navigate = useNavigate()
      const { toast } = useToast()
      const { mutateAsync: update${className}, isLoading } = useAdminUpdateVehicle${className}()
      ${fields
        .filter(hasValidRelation)
        .map(f => `const { data: ${f.relation.model.toLowerCase()}s } = useAdminList${toPascalCase(f.relation.model)}()`)
        .join("\n      ")}

      const form = useForm<PostAdminUpdate${className}>({
        resolver: zodResolver(PostAdminUpdate${className}),
        defaultValues: {
          ${fields.map(f => `${f.name}: item.${f.name}`).join(",\n          ")}
        }
      })

      const onSubmit = async (data: PostAdminUpdate${className}) => {
        try {
          await update${className}({
            id: item.id,
            ...data
          })
          toast({
            title: "Success",
            description: "${className} updated successfully",
            variant: "success",
          })
          onClose()
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to update ${className}",
            variant: "error",
          })
        }
      }

      return (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold">Edit ${className}</h1>
              <p className="text-sm text-gray-500">Update the details below to modify this ${modelName.toLowerCase()}</p>
            </div>
            ${fields.map(f => {
              if (hasValidRelation(f)) {
                return `
              <Form.Field
                control={form.control}
                name="${f.name}"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>${f.name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</Form.Label>
                    <Form.Control>
                      <Select
                        {...field}
                        options={${f.relation.model.toLowerCase()}s?.items?.map(item => ({
                          label: item.name || item.id,
                          value: item.id,
                        })) || []}
                      />
                    </Form.Control>
                    <Form.Message />
                  </Form.Item>
                )}
              />`
              }
              return `
              <Form.Field
                control={form.control}
                name="${f.name}"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>${f.name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</Form.Label>
                    <Form.Control>
                      <Input {...field} type="${f.type === "number" ? "number" : "text"}" />
                    </Form.Control>
                    <Form.Message />
                  </Form.Item>
                )}
              />`
            }).join("")}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Form>
      )
    }
    `
  },
};

type FileChange = {
  path: string;
  type: 'create' | 'modify' | 'merge';
  mergeStrategy?: 'append' | 'prepend';
  description: string;
};

export async function generateModule(config: ModuleConfig, options: { 
  addToExisting?: boolean;
  dryRun?: boolean;
} = {}) {
  const { name, models } = config;
  const basePath = path.join(process.cwd(), "src");
  const changes: FileChange[] = [];
  
  // Check if module exists
  const moduleExists = fs.existsSync(path.join(basePath, `modules/${name}`));
  
  if (moduleExists && !options.addToExisting) {
    throw new Error(`Module ${name} already exists. Use addToExisting: true to add models to it.`);
  }

  // Track directory creation
  const dirs = [
    `modules/${name}/models`,
    `modules/${name}/migrations`,
    `api/admin/${name}`,
    ...models.map(model => [
      `api/admin/${name}/${model.name}`,
      `api/admin/${name}/${model.name}/[id]`,
      `admin/routes/${name}/${model.name}`,
      `admin/routes/${name}/${model.name}/create`,
      `admin/routes/${name}/${model.name}/edit`
    ]).flat()
  ];

  dirs.forEach((dir) => {
    const fullPath = path.join(basePath, dir);
    if (!fs.existsSync(fullPath)) {
      changes.push({
        path: dir,
        type: 'create',
        description: `Create directory: ${dir}`
      });
      if (!options.dryRun) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    }
  });

  // Helper to track and write file changes
  async function safeWrite(filePath: string, content: string, mergeStrategy?: 'append' | 'prepend') {
    const fullPath = path.join(basePath, filePath);
    let finalContent = content;
    const fileExists = fs.existsSync(fullPath);

    if (fileExists && mergeStrategy) {
      const existing = fs.readFileSync(fullPath, 'utf-8');
      if (mergeStrategy === 'append') {
        finalContent = existing + '\n' + content;
      } else {
        finalContent = content + '\n' + existing;
      }
      changes.push({
        path: filePath,
        type: 'merge',
        mergeStrategy,
        description: `Merge content into existing file: ${filePath} (${mergeStrategy})`
      });
    } else {
      changes.push({
        path: filePath,
        type: fileExists ? 'modify' : 'create',
        description: `${fileExists ? 'Modify' : 'Create'} file: ${filePath}`
      });
    }

    if (!options.dryRun) {
      fs.writeFileSync(fullPath, await format(finalContent, { parser: "typescript" }));
    }
  }

  // Generate or update files for each model
  for (const model of models) {
    // Model file - always create new
    await safeWrite(
      `modules/${name}/models/${model.name}.ts`,
      TEMPLATES.model(model.name, model.fields)
    );

    // Validators - merge if exists
    const validatorPath = `api/admin/${name}/validators.ts`;
    if (fs.existsSync(path.join(basePath, validatorPath))) {
      await safeWrite(
        validatorPath,
        TEMPLATES.validator(model.name, model.fields),
        'append'
      );
    } else {
      await safeWrite(
        validatorPath,
        TEMPLATES.validator(model.name, model.fields)
      );
    }

    // Routes - create if don't exist
    const routePath = `api/admin/${name}/${model.name}/route.ts`;
    if (!fs.existsSync(path.join(basePath, routePath))) {
      await safeWrite(routePath, TEMPLATES.route(model.name));
    }

    const idRoutePath = `api/admin/${name}/${model.name}/[id]/route.ts`;
    if (!fs.existsSync(path.join(basePath, idRoutePath))) {
      await safeWrite(idRoutePath, TEMPLATES.idRoute(model.name));
    }

    // Admin UI - always create new
    const adminPagePath = `admin/routes/${name}/${model.name}/page.tsx`;
    await safeWrite(adminPagePath, TEMPLATES.adminPage(model.name, model.fields));

    const adminCreatePath = `admin/routes/${name}/${model.name}/create/vehicle-${model.name}-create.tsx`;
    await safeWrite(adminCreatePath, TEMPLATES.createForm(model.name, model.fields));

    const adminEditPath = `admin/routes/${name}/${model.name}/edit/vehicle-${model.name}-edit.tsx`;
    await safeWrite(adminEditPath, TEMPLATES.editForm(model.name, model.fields));

    // Workflow - always create new
    await safeWrite(
      `workflows/create-${model.name.toLowerCase()}.ts`,
      TEMPLATES.createWorkflow(model.name, model.fields)
    );

    // Update workflow - always create new
    await safeWrite(
      `workflows/update-${model.name.toLowerCase()}.ts`,
      TEMPLATES.updateWorkflow(model.name, model.fields)
    );
  }

  // Service - merge if exists, create if new
  const servicePath = `modules/${name}/service.ts`;
  if (fs.existsSync(path.join(basePath, servicePath))) {
    const existingService = fs.readFileSync(path.join(basePath, servicePath), 'utf-8');
    const existingModels = existingService.match(/MedusaService\({([^}]+)}/)?.[1].split(',').map(m => m.trim()) || [];
    const allModels = [...new Set([...existingModels, ...models.map(m => m.name)])];
    
    await safeWrite(
      servicePath,
      TEMPLATES.service({ moduleName: name, models })
    );
  } else {
    await safeWrite(
      servicePath,
      TEMPLATES.service({ moduleName: name, models })
    );
  }

  // Update types file
  const typesPath = 'admin/types/index.ts';
  if (fs.existsSync(path.join(basePath, typesPath))) {
    const typeDefinitions = models.map(model => `
      export type ${model.name} = {
        id: string
        ${model.fields.map(f => `${f.name}: ${f.type}`).join('\n')}
        created_at: string
        updated_at: string
        deleted_at: string | null
      }

      export type List${model.name}sRes = {
        ${model.name.toLowerCase()}_items: ${model.name}[]
        count: number
        limit: number
        offset: number
      }
    `).join('\n');

    await safeWrite(typesPath, typeDefinitions, 'append');
  }

  if (options.dryRun) {
    console.log('\nDry Run Summary:');
    console.log('================\n');
    
    // Group changes by type
    const grouped = changes.reduce((acc, change) => {
      const key = change.type + (change.mergeStrategy ? ` (${change.mergeStrategy})` : '');
      if (!acc[key]) acc[key] = [];
      acc[key].push(change);
      return acc;
    }, {} as Record<string, FileChange[]>);

    // Print summary
    Object.entries(grouped).forEach(([type, typeChanges]) => {
      console.log(`${type.toUpperCase()}:`);
      typeChanges.forEach(change => {
        console.log(`  - ${change.description}`);
      });
      console.log('');
    });

    console.log('No files were modified (dry run)');
    return changes;
  }

  return changes;
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