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
        .join(",\n      ")},
      ${fields
        .filter((f) => f.relation)
        .map(
          (f) =>
            `${f.name}_id: z.string()${f.required ? "" : ".optional()"}.min(1)`
        )
        .join(",\n      ")}
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
        .join(",\n      ")},
      ${fields
        .filter((f) => f.relation)
        .map(
          (f) =>
            `${f.name}_id: z.string().optional().min(1)`
        )
        .join(",\n      ")}
    })
    `;
  },

  route: (modelName: string) => `
    import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
    import { z } from "zod"
    import { PostAdminCreate${toPascalCase(modelName)} } from "./validators"
    
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
        entity: "${toSnakeCase(modelName)}",
        ...req.queryConfig,
      }

      const { data: ${toSnakeCase(modelName)}_items, metadata } = await query.graph(
        queryOptions
      ) as QueryResponse

      res.json({
        ${toSnakeCase(modelName)}_items,
        count: metadata.count,
        limit: metadata.take,
        offset: metadata.skip,
      })
    }

    type PostAdminCreate${toPascalCase(modelName)}Type = z.infer<typeof PostAdminCreate${toPascalCase(modelName)}>

    export const POST = async (
      req: MedusaRequest<PostAdminCreate${toPascalCase(modelName)}Type>,
      res: MedusaResponse
    ) => {
      const { result } = await create${toPascalCase(modelName)}Workflow(req.scope).run({
        input: req.validatedBody,
      })

      res.json({ ${toSnakeCase(modelName)}: result })
    }
  `,

  idRoute: (modelName: string) => `
    import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
    import { z } from "zod"
    import { update${toPascalCase(modelName)}Workflow } from "../../../../../workflows/update-${toPascalCase(modelName).toLowerCase()}"
    import { PostAdminUpdate${toPascalCase(modelName)} } from "../validators"

    type PostAdminUpdate${toPascalCase(modelName)}Type = z.infer<typeof PostAdminUpdate${toPascalCase(modelName)}>

    export const POST = async (
      req: MedusaRequest<PostAdminUpdate${toPascalCase(modelName)}Type>,
      res: MedusaResponse
    ) => {
      const { result } = await update${toPascalCase(modelName)}Workflow(req.scope).run({
        input: {
          id: req.params.id,
          ...req.validatedBody,
        },
      })

      res.json({ ${toPascalCase(modelName)}: result })
    }
  `,

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

  pageComponent: (modelName: string, fields: ModelField[]) => {
    const className = toPascalCase(modelName);
    const snakeName = toSnakeCase(modelName);
    return `
    import { defineRouteConfig } from "@medusajs/admin-sdk";
    import { createDataTableColumnHelper, FocusModal, Drawer } from "@medusajs/ui";
    import { ${className} } from "../../../types";
    import { DataTablePage } from "../../../components/data-table-page";
    import { ${className}Create } from "./create/${modelName}-create";
    import { useState } from "react";
    import { ActionMenu } from "../../../components/action-menu";
    import { Pencil } from "@medusajs/icons";
    import { ${className}Edit } from "./edit/${modelName}-edit";

    const columnHelper = createDataTableColumnHelper<${className}>();

    const ${className}Page = () => {
      const [showCreate, setShowCreate] = useState(false);
      const [editing${className}, setEditing${className}] = useState<${className} | null>(null);

      const columns = [
        columnHelper.accessor("id", {
          header: "ID",
        }),
        ${fields.map(f => {
          if (f.relation) {
            return `columnHelper.accessor("${f.name}.name", {
              header: "${toPascalCase(f.name)}",
              enableSorting: true,
            }),`;
          }
          return `columnHelper.accessor("${f.name}", {
            header: "${toPascalCase(f.name)}",
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
            subtitle="Manage your ${snakeName.replace(/_/g, ' ')}"
            endpoint="/admin/${name}/${modelName}"
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

  createComponent: (modelName: string, fields: ModelField[]) => {
    const className = toPascalCase(modelName);
    return `
    import { Form } from "@medusajs/forms";
    import { Button, FocusModal } from "@medusajs/ui";
    import { useForm } from "react-hook-form";
    import { zodResolver } from "@hookform/resolvers/zod";
    import { PostAdminCreate${className} } from "../../../../api/admin/${name}/validators";
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
          await fetch(\`/admin/${name}/${modelName}\`, {
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
                ${fields.map(f => {
                  if (f.relation) {
                    return `<SelectField
                      name="${f.name}_id"
                      label="${toPascalCase(f.name)}"
                      required={${f.required}}
                    />`;
                  }
                  return `<InputField
                    name="${f.name}"
                    label="${toPascalCase(f.name)}"
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

  editComponent: (modelName: string, fields: ModelField[]) => {
    const className = toPascalCase(modelName);
    return `
    import { Form } from "@medusajs/forms";
    import { Button, Drawer } from "@medusajs/ui";
    import { useForm } from "react-hook-form";
    import { zodResolver } from "@hookform/resolvers/zod";
    import { PostAdminUpdate${className} } from "../../../../api/admin/${name}/validators";
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
          await fetch(\`/admin/${name}/${modelName}/\${item.id}\`, {
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
                ${fields.map(f => {
                  if (f.relation) {
                    return `<SelectField
                      name="${f.name}_id"
                      label="${toPascalCase(f.name)}"
                      required={${f.required}}
                    />`;
                  }
                  return `<InputField
                    name="${f.name}"
                    label="${toPascalCase(f.name)}"
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
};

export async function generateModule(config: ModuleConfig, options: { 
  addToExisting?: boolean;
  dryRun?: boolean;
} = {}) {
  const changes: FileChange[] = [];
  const { name, models } = config;

  for (const model of models) {
    // Model file
    const modelPath = `src/modules/${name}/models/${model.name}.ts`;
    changes.push({
      path: modelPath,
      type: 'create',
      description: `Create model file for ${model.name}`,
      content: TEMPLATES.model(model.name, model.fields)
    });

    // Service file
    const servicePath = `src/modules/${name}/service.ts`;
    if (options.addToExisting) {
      changes.push({
        path: servicePath,
        type: 'modify',
        description: `Update service file to include ${model.name}`,
        content: TEMPLATES.service({ 
          moduleName: toPascalCase(name), 
          models: [model.name] 
        })
      });
    } else {
      changes.push({
        path: servicePath,
        type: 'create',
        description: `Create service file for ${name} module`,
        content: TEMPLATES.service({ 
          moduleName: toPascalCase(name), 
          models: [model.name]
        })
      });
    }

    // Validator file
    const validatorPath = `src/api/admin/${name}/validators.ts`;
    changes.push({
      path: validatorPath,
      type: options.addToExisting ? 'merge' : 'create',
      mergeStrategy: 'append',
      description: `Add validator for ${model.name}`,
      content: TEMPLATES.validator(model.name, model.fields)
    });

    // Route files
    const routePath = `src/api/admin/${name}/${model.name}/route.ts`;
    changes.push({
      path: routePath,
      type: 'create',
      description: `Create route file for ${model.name}`,
      content: TEMPLATES.route(model.name)
    });

    const idRoutePath = `src/api/admin/${name}/${model.name}/[id]/route.ts`;
    changes.push({
      path: idRoutePath,
      type: 'create',
      description: `Create ID route file for ${model.name}`,
      content: TEMPLATES.idRoute(model.name)
    });

    // Admin UI Components
    const adminPagePath = `src/admin/routes/${name}/${model.name}/page.tsx`;
    changes.push({
      path: adminPagePath,
      type: 'create',
      description: `Create admin page for ${model.name}`,
      content: TEMPLATES.pageComponent(model.name, model.fields)
    });

    const adminCreatePath = `src/admin/routes/${name}/${model.name}/create/${model.name}-create.tsx`;
    changes.push({
      path: adminCreatePath,
      type: 'create',
      description: `Create admin create form for ${model.name}`,
      content: TEMPLATES.createComponent(model.name, model.fields)
    });

    const adminEditPath = `src/admin/routes/${name}/${model.name}/edit/${model.name}-edit.tsx`;
    changes.push({
      path: adminEditPath,
      type: 'create',
      description: `Create admin edit form for ${model.name}`,
      content: TEMPLATES.editComponent(model.name, model.fields)
    });
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
        await fs.promises.writeFile(change.path, change.content);
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