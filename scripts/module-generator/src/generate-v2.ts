/**
 * Medusa Module Generator v2
 *
 * A step-by-step rebuild of the module generator with improved architecture.
 * Step 1: Basic model generation
 */

import * as fs from "fs/promises";
import * as path from "path";
import { existsSync } from "fs";
import { format, resolveConfig } from "prettier";
import Handlebars from "handlebars";
import chalk from "chalk";

// Core types for minimal implementation
export type ModelField = {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "text";
  required?: boolean;
  relation?: {
    type: "belongsTo" | "hasMany" | "manyToMany";
    model: string;
    mappedBy?: string;
    through?: string;
    inverse?: string;
    pivotTable?: string;
    joinColumn?: string;
    inverseJoinColumn?: string;
  };
  default?: any;
};

export type FakerMapping = {
  fields?: Record<string, string>;  // Field name to faker method mapping
  defaults?: Record<string, string>; // Type to faker method mapping
};

export type ModelConfig = {
  name: string;
  modelName: string;      // PascalCase singular name
  modelNamePlural: string; // PascalCase plural name
  singular: string;
  plural: string;
  icon?: string;
  isParent?: boolean;
  parent?: {
    model: string;
    routePrefix: string;
  };
  fields: ModelField[];
  faker?: FakerMapping;  // Add faker mapping to model config
};

export type ModuleConfig = {
  moduleName: string;
  moduleModelName: string;
  singular: string;
  plural: string;
  models: ModelConfig[];
  faker?: FakerMapping;  // Add faker mapping to module config
  moduleModel?: ModelConfig;  // Add moduleModel property
};

export type FileChange = {
  path: string;
  type: "create" | "modify";
  templatePath: string;
  model?: ModelConfig;
  module?: ModuleConfig;
  modules?: Array<ModuleConfig>;
};

// Helper to process field definitions
function processField(field: ModelField): string | Handlebars.SafeString {
  if (field.relation) {
    const relationConfig: string[] = [];
    // Maintain consistent order: inverse, mappedBy, through
    if (field.relation.inverse) {
      relationConfig.push(`inverse: "${field.relation.inverse}"`);
    }
    if (field.relation.mappedBy) {
      relationConfig.push(`mappedBy: "${field.relation.mappedBy}"`);
    }
    if (field.relation.through) {
      relationConfig.push(`through: "${field.relation.through}"`);
    }
    if (field.relation.pivotTable) {
      relationConfig.push(`pivotTable: "${field.relation.pivotTable}"`);
    }
    if (field.relation.joinColumn) {
      relationConfig.push(`joinColumn: "${field.relation.joinColumn}"`);
    }
    if (field.relation.inverseJoinColumn) {
      relationConfig.push(
        `inverseJoinColumn: "${field.relation.inverseJoinColumn}"`
      );
    }

    return new Handlebars.SafeString(
      `${field.name}: model.${field.relation.type}(() => ${field.relation.model}${relationConfig.length ? `, {\n      ${relationConfig.join(",\n      ")}\n    }` : ""})`
    );
  }

  // Build the field definition with required flag and default value
  let fieldDef = `${field.name}: model.${field.type === "string" ? "text" : field.type}()`;
  if (field.required) {
    fieldDef += `.required()`;
  }
  if (field.default !== undefined) {
    fieldDef += `.default(${JSON.stringify(field.default)})`;
  }
  return new Handlebars.SafeString(fieldDef);
}

// Register Handlebars helpers
Handlebars.registerHelper("toPascalCase", (str: string) => {
  if (!str) return "";
  return str
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
});

Handlebars.registerHelper("toSnakeCase", (str: string) => {
  if (!str) return "";
  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/-/g, "_")
    .toLowerCase();
});

Handlebars.registerHelper("toTitleCase", (str: string) => {
  if (!str) return "";
  return str
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
});

Handlebars.registerHelper("toLowerCase", (str: string) => {
  if (!str) return "";
  return str.toLowerCase();
});

Handlebars.registerHelper("toCamelCase", (str: string) => {
  if (!str) return "";
  return str
    .split(/[-_]/)
    .map((word, i) =>
      i === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join("");
});

Handlebars.registerHelper("toKebabCase", (str: string) => {
  if (!str) return "";
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
});

Handlebars.registerHelper("toSentenceCase", (str: string) => {
  if (!str) return "";
  return str
    .replace(/[-_]/g, ' ')  // Replace hyphens and underscores with spaces
    .replace(/([a-z])([A-Z])/g, '$1 $2')  // Add space between camelCase
    .toLowerCase()  // Convert to lowercase
    .replace(/\b\w/g, c => c.toUpperCase());  // Capitalize first letter of each word
});

Handlebars.registerHelper("eq", function (a: any, b: any) {
  return a === b;
});

Handlebars.registerHelper("type", function (value: string, type: string) {
  return value === type;
});

// Property access helpers
Handlebars.registerHelper(
  "propAccess",
  function (obj: string, prop: string, options: any) {
    if (typeof obj !== "string" || typeof prop !== "string") {
      return "";
    }
    const propertyAccess = `${obj}.${prop}`;
    // For template literals, wrap in ${} and return as SafeString
    if (options.hash.templateLiteral) {
      return new Handlebars.SafeString("${" + propertyAccess + "}");
    }
    // For normal usage, escape the expression
    return Handlebars.Utils.escapeExpression(propertyAccess);
  }
);

// Enhanced React component helper
Handlebars.registerHelper("reactComponent", function (options: any) {
  const content = options.fn(this);
  return new Handlebars.SafeString(
    content
      // Handle JSX expressions
      .replace(/\{\{([^}]+)\}\}/g, (match, p1) => {
        if (p1.startsWith("#") || p1.startsWith("/")) return match;
        if (p1.includes("&&") || p1.includes("||") || p1.includes("?")) {
          return `{${p1}}`;
        }
        return `{${p1}}`;
      })
      // Handle JSX attributes
      .replace(/(\w+)=\{\{([^}]+)\}\}/g, (match, attr, value) => {
        return `${attr}={${value}}`;
      })
  );
});

// JSX-specific conditional helper
Handlebars.registerHelper("jsx-if", function (condition: string, options: any) {
  // First evaluate any nested Handlebars expressions in the condition
  const evaluatedCondition = Handlebars.compile(condition)(this);
  // Remove extra whitespace and wrap content tightly
  const content = options.fn(this).trim();
  return new Handlebars.SafeString(`{${evaluatedCondition} && (${content})}`);
});

// JSX-specific list rendering helper
Handlebars.registerHelper("jsx-each", function (items: string, options: any) {
  // First evaluate any nested Handlebars expressions in items
  const evaluatedItems = Handlebars.compile(items)(this);
  return new Handlebars.SafeString(
    `{${evaluatedItems}.map((item, index) => (${options.fn(this).trim()}))}`
  );
});

// JSX-specific ternary helper
Handlebars.registerHelper(
  "jsx-ternary",
  function (condition: string, truthy: string, falsy: string) {
    // First evaluate any nested expressions
    const evaluatedCondition = Handlebars.compile(condition)(this);
    const evaluatedTruthy = Handlebars.compile(truthy)(this);
    const evaluatedFalsy = Handlebars.compile(falsy)(this);
    return new Handlebars.SafeString(
      `{${evaluatedCondition} ? ${evaluatedTruthy} : ${evaluatedFalsy}}`
    );
  }
);

// JSX-specific raw expression helper
Handlebars.registerHelper("jsx-expr", function (expression: string) {
  // First evaluate any nested Handlebars expressions
  const evaluatedExpr = Handlebars.compile(expression)(this);
  return new Handlebars.SafeString(`{${evaluatedExpr}}`);
});

// Helper to process field definitions
Handlebars.registerHelper("processField", processField);

// Add new module/model helpers
Handlebars.registerHelper("isModuleModel", function (model: any, module: any) {
  return model?.name === module?.moduleName ? "true" : "";
});

Handlebars.registerHelper("getRoutePath", function (model: any, module: any) {
  return model?.name === module?.moduleName
    ? module?.plural
    : `${module?.plural}/${model?.plural}`;
});

Handlebars.registerHelper(
  "getModelImportPath",
  function (model: any, module: any) {
    return model?.name === module?.moduleName
      ? "./"
      : `./models/${model?.name}`;
  }
);

Handlebars.registerHelper("toUpperCase", (str: string) => {
  if (!str) return "";
  return str.toUpperCase();
});

Handlebars.registerHelper(
  "find",
  (array: any[], key: string, value: string) => {
    if (!array || !Array.isArray(array)) return null;
    return array.find((item) => item[key] === value);
  }
);

// Add plural helper
Handlebars.registerHelper("plural", function (str: string) {
  if (!str) return "";
  // Basic pluralization rules
  // if (str.endsWith('y')) {
  //   return str.slice(0, -1) + 'ies';
  // }
  // if (str.endsWith('s')) {
  //   return str;
  // }
  // return str + 's';
});

Handlebars.registerHelper("hasRelations", (fields, type = null) => {
  return fields.some(field => {
    if (!field.relation) return false;
    if (type) return field.relation.type === type;
    return true;
  });
});

// Debug helper
Handlebars.registerHelper("debug", function (context) {
  console.log("Template Debug Context:", JSON.stringify(context, null, 2));
  return "";
});

// Add debug utility function
function debug(...args: any[]) {
  if (process.env.DEBUG === "1") {
    console.log(...args);
  }
}

// Process template using Handlebars
async function processTemplate(
  templateContent: string,
  data: Record<string, any>,
  options?: {
    templatePath?: string;
    outputPath?: string;
  }
): Promise<string> {
  try {
    const compiledTemplate = Handlebars.compile(templateContent);
    return compiledTemplate(data);
  } catch (error) {
    console.error(chalk.red(`Error processing template:`, error));
    throw error;
  }
}

// Load template content
async function loadTemplates() {
  const templateDir = path.join(
    process.cwd(),
    "scripts/module-generator/templates"
  );

  debug("Debug - Loading templates from:", templateDir);

  // Module level templates
  const moduleModelTemplate = await fs.readFile(
    path.join(
      templateDir,
      "src/modules/[module.plural]/models/[model.name].hbs"
    ),
    "utf-8"
  );
  const moduleListRouteTemplate = await fs.readFile(
    path.join(templateDir, "src/api/admin/[module.plural]/route.hbs"),
    "utf-8"
  );
  const moduleIdRouteTemplate = await fs.readFile(
    path.join(templateDir, "src/api/admin/[module.plural]/[id]/route.hbs"),
    "utf-8"
  );
  const moduleValidatorsTemplate = await fs.readFile(
    path.join(templateDir, "src/api/admin/[module.plural]/validators.hbs"),
    "utf-8"
  );
  const moduleListPageTemplate = await fs.readFile(
    path.join(templateDir, "src/admin/routes/[module.plural]/page.hbs"),
    "utf-8"
  );
  const moduleCreateFormTemplate = await fs.readFile(
    path.join(
      templateDir,
      "src/admin/routes/[module.plural]/create/[module.singular]-create.hbs"
    ),
    "utf-8"
  );
  const moduleEditFormTemplate = await fs.readFile(
    path.join(
      templateDir,
      "src/admin/routes/[module.plural]/edit/[module.singular]-edit.hbs"
    ),
    "utf-8"
  );

  // Model level templates
  const modelTemplate = await fs.readFile(
    path.join(
      templateDir,
      "src/modules/[module.plural]/models/[model.name].hbs"
    ),
    "utf-8"
  );
  const modelListRouteTemplate = await fs.readFile(
    path.join(
      templateDir,
      "src/api/admin/[module.plural]/[model.plural]/route.hbs"
    ),
    "utf-8"
  );
  const modelIdRouteTemplate = await fs.readFile(
    path.join(
      templateDir,
      "src/api/admin/[module.plural]/[model.plural]/[id]/route.hbs"
    ),
    "utf-8"
  );
  const modelValidatorsTemplate = await fs.readFile(
    path.join(
      templateDir,
      "src/api/admin/[module.plural]/[model.plural]/validators.hbs"
    ),
    "utf-8"
  );
  const modelListPageTemplate = await fs.readFile(
    path.join(
      templateDir,
      "src/admin/routes/[module.plural]/[model.plural]/page.hbs"
    ),
    "utf-8"
  );
  const modelCreateFormTemplate = await fs.readFile(
    path.join(
      templateDir,
      "src/admin/routes/[module.plural]/[model.plural]/create/[model.name]-create.hbs"
    ),
    "utf-8"
  );
  const modelEditFormTemplate = await fs.readFile(
    path.join(
      templateDir,
      "src/admin/routes/[module.plural]/[model.plural]/edit/[model.name]-edit.hbs"
    ),
    "utf-8"
  );

  // Service and index templates
  const serviceTemplate = await fs.readFile(
    path.join(templateDir, "src/modules/[module.plural]/service.hbs"),
    "utf-8"
  );
  const indexTemplate = await fs.readFile(
    path.join(templateDir, "src/modules/[module.plural]/index.hbs"),
    "utf-8"
  );

  // Add middleware templates
  const moduleMiddlewaresTemplate = await fs.readFile(
    path.join(templateDir, "src/api/admin/[module.plural]/middlewares.hbs"),
    "utf-8"
  );
  const modelMiddlewaresTemplate = await fs.readFile(
    path.join(
      templateDir,
      "src/api/admin/[module.plural]/[model.plural]/middlewares.hbs"
    ),
    "utf-8"
  );
  const mainMiddlewaresTemplate = await fs.readFile(
    path.join(templateDir, "src/api/middlewares.hbs"),
    "utf-8"
  );

  // Add types template
  const mainTypesTemplate = await fs.readFile(
    path.join(templateDir, "src/admin/types/index.hbs"),
    "utf-8"
  );

  // Add workflow templates
  const createWorkflowTemplate = await fs.readFile(
    path.join(
      templateDir,
      "src/workflows/[module.plural]/create-[model.name].hbs"
    ),
    "utf-8"
  );
  const updateWorkflowTemplate = await fs.readFile(
    path.join(
      templateDir,
      "src/workflows/[module.plural]/update-[model.name].hbs"
    ),
    "utf-8"
  );
  const deleteWorkflowTemplate = await fs.readFile(
    path.join(
      templateDir,
      "src/workflows/[module.plural]/delete-[model.name].hbs"
    ),
    "utf-8"
  );

  // Add seed template
  const seedTemplate = await fs.readFile(
    path.join(templateDir, "src/scripts/seed.hbs"),
    "utf-8"
  );

  debug("Debug - Loaded module create form template:", {
    path: path.join(
      templateDir,
      "src/admin/routes/[module.plural]/create/[module.singular]-create.hbs"
    ),
    exists: !!moduleCreateFormTemplate,
    length: moduleCreateFormTemplate.length,
  });

  return {
    // Module level templates
    moduleModelTemplate,
    moduleListRouteTemplate,
    moduleIdRouteTemplate,
    moduleValidatorsTemplate,
    moduleListPageTemplate,
    moduleCreateFormTemplate,
    moduleEditFormTemplate,

    // Model level templates
    modelTemplate,
    modelListRouteTemplate,
    modelIdRouteTemplate,
    modelValidatorsTemplate,
    modelListPageTemplate,
    modelCreateFormTemplate,
    modelEditFormTemplate,

    // Common templates
    serviceTemplate,
    indexTemplate,

    // Middleware templates
    moduleMiddlewaresTemplate,
    modelMiddlewaresTemplate,
    mainMiddlewaresTemplate,

    // Types template
    mainTypesTemplate,

    // Workflow templates
    createWorkflowTemplate,
    updateWorkflowTemplate,
    deleteWorkflowTemplate,

    // Add seed template
    seedTemplate,
  };
}

// Core file generation for a single module (no middleware concerns)
async function generateModuleFiles(
  config: ModuleConfig,
  options: {
    testMode?: boolean;
    dryRun?: boolean;
  }
): Promise<FileChange[]> {
  const changes: FileChange[] = [];
  const { testMode = false, dryRun = process.env.DRY_RUN === "1" } = options;
  const baseDir = testMode ? ".test-output" : "";
  const templates = await loadTemplates();

  // Inject moduleModel into config
  const configWithModuleModel = {
    ...config,
    moduleModel: config.models.find(m => m.modelName === config.moduleModelName)
  };

  // Use configWithModuleModel instead of config for all file generation
  const allModels = configWithModuleModel.models;

  for (const model of allModels) {
    const isModuleModel = model.modelName === configWithModuleModel.moduleModelName;
    debug(`Debug - Processing model ${model.name}:`, {
      isModuleModel,
      moduleModelName: configWithModuleModel.moduleModelName,
    });

    // Use different path structure for module-level routes
    const apiBasePath = path.join(
      baseDir, 
      "src/api/admin",
      isModuleModel 
        ? configWithModuleModel.plural  // For module-level files
        : `${configWithModuleModel.plural}/${model.plural}`  // For model-level files
    );

    // Model file - always in models directory
    const modelPath = path.join(
      baseDir,
      "src/modules",
      configWithModuleModel.plural,
      "models",
      `${model.name}.ts`
    );

    changes.push({
      path: modelPath,
      type: "create",
      templatePath: isModuleModel
        ? templates.moduleModelTemplate
        : templates.modelTemplate,
      model,
      module: configWithModuleModel,
    });

    // API routes
    changes.push({
      path: path.join(apiBasePath, "route.ts"),
      type: "create",
      templatePath: model.modelName === configWithModuleModel.moduleModelName
        ? templates.moduleListRouteTemplate
        : templates.modelListRouteTemplate,
      model,
      module: configWithModuleModel,
    });

    changes.push({
      path: path.join(apiBasePath, "[id]", "route.ts"),
      type: "create",
      templatePath: isModuleModel
        ? templates.moduleIdRouteTemplate
        : templates.modelIdRouteTemplate,
      model,
      module: configWithModuleModel,
    });

    changes.push({
      path: path.join(apiBasePath, "validators.ts"),
      type: "create",
      templatePath: isModuleModel
        ? templates.moduleValidatorsTemplate
        : templates.modelValidatorsTemplate,
      model,
      module: configWithModuleModel,
    });

    // Admin UI routes
    const adminBasePath = path.join(
      baseDir, 
      "src/admin/routes",
      isModuleModel 
        ? configWithModuleModel.plural
        : model.name === configWithModuleModel.moduleModelName.toLowerCase()
          ? configWithModuleModel.plural
          : `${configWithModuleModel.plural}/${model.plural}`
    );

    changes.push({
      path: path.join(adminBasePath, "page.tsx"),
      type: "create",
      templatePath: model.modelName === configWithModuleModel.moduleModelName
        ? templates.moduleListPageTemplate
        : templates.modelListPageTemplate,
      model,
      module: {
        ...configWithModuleModel,
        moduleModel: configWithModuleModel.models.find(m => m.modelName === configWithModuleModel.moduleModelName)  // Add moduleModel
      },
    });

    changes.push({
      path: path.join(adminBasePath, "create", `${model.name}-create.tsx`),
      type: "create",
      templatePath: isModuleModel
        ? templates.moduleCreateFormTemplate
        : templates.modelCreateFormTemplate,
      model,
      module: configWithModuleModel,
    });

    changes.push({
      path: path.join(adminBasePath, "edit", `${model.name}-edit.tsx`),
      type: "create",
      templatePath: isModuleModel
        ? templates.moduleEditFormTemplate
        : templates.modelEditFormTemplate,
      model,
      module: configWithModuleModel,
    });

    // Generate workflow files
    const workflowBasePath = path.join(baseDir, "src/workflows", configWithModuleModel.plural);

    // Create workflow
    changes.push({
      path: path.join(workflowBasePath, `create-${model.name}.ts`),
      type: "create",
      templatePath: templates.createWorkflowTemplate,
      model,
      module: configWithModuleModel,
    });

    // Update workflow
    changes.push({
      path: path.join(workflowBasePath, `update-${model.name}.ts`),
      type: "create",
      templatePath: templates.updateWorkflowTemplate,
      model,
      module: configWithModuleModel,
    });

    // Delete workflow
    changes.push({
      path: path.join(workflowBasePath, `delete-${model.name}.ts`),
      type: "create",
      templatePath: templates.deleteWorkflowTemplate,
      model,
      module: configWithModuleModel,
    });
  }

  // Generate module service
  changes.push({
    path: path.join(baseDir, "src/modules", configWithModuleModel.plural, "service.ts"),
    type: "create",
    templatePath: templates.serviceTemplate,
    module: configWithModuleModel,
  });

  // Generate module index
  changes.push({
    path: path.join(baseDir, "src/modules", configWithModuleModel.plural, "index.ts"),
    type: "create",
    templatePath: templates.indexTemplate,
    module: configWithModuleModel,
  });

  if (!dryRun) {
    for (const change of changes) {
      const dir = path.dirname(change.path);
      await fs.mkdir(dir, { recursive: true });

      const data = {
        module: configWithModuleModel,
        model: change.model || null,
        isModuleModel: change.model?.name === configWithModuleModel.moduleModelName,
      };

      const content = await processTemplate(change.templatePath, data, {
        templatePath: change.templatePath,
        outputPath: change.path,
      });
      await fs.writeFile(change.path, content);
    }
  }

  return changes;
}

// Types-specific generation
async function generateTypes(
  modules: ModuleConfig[],
  options: {
    testMode?: boolean;
    dryRun?: boolean;
  }
): Promise<FileChange[]> {
  const { testMode = false, dryRun = process.env.DRY_RUN === "1" } = options;
  const baseDir = testMode ? ".test-output" : "";
  const changes: FileChange[] = [];
  const templates = await loadTemplates();

  // Generate main types file with all modules
  const mainTypesChange = {
    path: path.join(baseDir, "src/admin/types/index.hbs"),
    type: "create" as const,
    templatePath: templates.mainTypesTemplate,
    modules: modules.map((module) => ({
      ...module,  // Pass the entire module object
      models: module.models  // Pass complete model objects
    })),
  };
  changes.push(mainTypesChange);

  if (!dryRun) {
    for (const change of changes) {
      const dir = path.dirname(change.path);
      await fs.mkdir(dir, { recursive: true });

      const templateData = change.modules
        ? { modules: change.modules }
        : {
            module: change.module || null,
            model: change.model || null,
            isModuleModel: change.model?.name === change.module?.moduleName,
          };

      const content = await processTemplate(change.templatePath, templateData, {
        templatePath: change.templatePath,
        outputPath: change.path,
      });
      await fs.writeFile(change.path, content);
    }
  }

  return changes;
}

// Middleware-specific generation
async function generateMiddlewares(
  modules: ModuleConfig[],
  options: {
    testMode?: boolean;
    dryRun?: boolean;
  }
): Promise<FileChange[]> {
  const { testMode = false, dryRun = process.env.DRY_RUN === "1" } = options;
  const baseDir = testMode ? ".test-output" : "";
  const changes: FileChange[] = [];
  const templates = await loadTemplates();

  // Generate individual module/model middleware files
  for (const module of modules) {
    // Find module's own model using moduleModelName
    const moduleModel = module.models.find(
      (m) => m.modelName === module.moduleModelName
    );
    module.moduleModel = moduleModel;

    // Generate module-level middleware
    changes.push({
      path: path.join(
        baseDir,
        "src/api/admin",
        module.plural,
        "middlewares.ts"
      ),
      type: "create",
      templatePath: templates.moduleMiddlewaresTemplate,
      module: module,
    });

    // Generate model-level middlewares
    for (const model of module.models) {
      changes.push({
        path: path.join(
          baseDir,
          "src/api/admin",
          module.plural,
          model.modelName === module.moduleModelName  // Check if it's the main model
            ? ""  // No subfolder for main model
            : model.plural,  // Use model plural for other models
          "middlewares.ts"
        ),
        type: "create",
        templatePath: model.modelName === module.moduleModelName
          ? templates.moduleMiddlewaresTemplate
          : templates.modelMiddlewaresTemplate,
        model,
        module,
      });
    }
  }

  // Generate main middleware file with all modules
  const mainMiddlewareChange = {
    path: path.join(baseDir, "src/api/middlewares.ts"),
    type: "create" as const,
    templatePath: templates.mainMiddlewaresTemplate,
    modules: modules.map((module) => ({
      ...module,  // Pass full module data
      models: module.models  // Pass complete model objects
    })),
  };
  changes.push(mainMiddlewareChange);

  if (!dryRun) {
    for (const change of changes) {
      const dir = path.dirname(change.path);
      await fs.mkdir(dir, { recursive: true });

      let templateData;
      if (change.path.endsWith("middlewares.ts")) {
        // For the main middleware file, pass modules directly
        templateData = change.modules
          ? { modules: change.modules }
          : {
              module: change.module || null,
              model: change.model || null,
              isModuleModel: change.model?.name === change.module?.moduleName,
            };
      } else {
        // For other files, use the standard data structure
        templateData = {
          module: change.module || null,
          model: change.model || null,
          isModuleModel: change.model?.name === change.module?.moduleName,
        };
      }

      const content = await processTemplate(change.templatePath, templateData, {
        templatePath: change.templatePath,
        outputPath: change.path,
      });
      await fs.writeFile(change.path, content);
    }
  }

  return changes;
}

// Add concat helper
Handlebars.registerHelper("concat", function (...args) {
  // Remove the last argument (Handlebars options object)
  args.pop();
  
  // Join all arguments with no separator
  return args.join("");
});

// Add getFakerMethod helper
Handlebars.registerHelper("getFakerMethod", function (model: any, field: string, type: string) {
  // First check model-specific field mapping
  if (model?.faker?.fields?.[field]) {
    const method = model.faker.fields[field];
    return method;
  }

  // Then check module-level defaults
  if (model?.module?.faker?.defaults?.[type]) {
    const method = model.module.faker.defaults[type];
    return method;
  }

  // Fallback based on type
  const typeMap = {
    text: "lorem.word",
    number: "number.int({ min: 1, max: 100 })",
    boolean: "datatype.boolean",
    date: "date.recent"
  };

  return typeMap[type] || "lorem.word";
});

// Add getCountString helper
Handlebars.registerHelper("getCountString", function (module: any, model: any) {
  const moduleUpper = module.singular.toUpperCase();
  const modelUpper = model.plural.toUpperCase();
  return `${moduleUpper}_COUNT * ${moduleUpper}_${modelUpper}_PER_${moduleUpper}`;
});

// Add includes helper
Handlebars.registerHelper("includes", function (str: string, search: string) {
  return str.includes(search);
});

// Add modelHasDependencies helper
Handlebars.registerHelper("modelHasDependencies", function(model) {
  return model.fields.some(field => field.relation?.type === "belongsTo");
});

// Add pluralize helper
Handlebars.registerHelper("pluralize", function(str) {
  // For now just return the plural from the model config
  // Later we can use a proper pluralize library if needed
  return str + "s";
});

// Add split helper
Handlebars.registerHelper("split", function(str, separator) {
  return str.split(separator);
});

// Add last helper
Handlebars.registerHelper("last", function(array) {
  return array[array.length - 1] || "";
});

// Add modelHasOnlyIndependentDependencies helper
Handlebars.registerHelper("modelHasOnlyIndependentDependencies", function(model, allModels) {
  return model.fields.every(field => {
    if (!field.relation || field.relation.type !== "belongsTo") return true;
    const dependentModel = allModels.find(m => m.name === field.relation.model);
    return !dependentModel || !dependentModel.fields.some(f => f.relation?.type === "belongsTo");
  });
});

// Add and helper
Handlebars.registerHelper("and", function(a, b) {
  return a && b;
});

// Add not helper
Handlebars.registerHelper("not", function(a) {
  return !a;
});

// Add getDependencyLevel helper
Handlebars.registerHelper("getDependencyLevel", function(model, allModels) {
  // Ensure we have both model and allModels
  if (!model || !allModels) return 0;

  if (!model.fields.some(field => field.relation?.type === "belongsTo")) {
    return 0;  // No dependencies
  }

  let maxDependencyLevel = 0;
  model.fields.forEach(field => {
    if (field.relation?.type === "belongsTo") {
      // Strip "Vehicle" prefix if it exists
      const modelName = field.relation.model.replace(/^Vehicle/, "");
      const dependentModel = allModels.find(m => 
        m.name === modelName || m.name === `vehicle-${modelName.toLowerCase()}`
      );
      if (dependentModel) {
        const level = Handlebars.helpers.getDependencyLevel(dependentModel, allModels);
        maxDependencyLevel = Math.max(maxDependencyLevel, level + 1);
      }
    }
  });
  return maxDependencyLevel;
});

// Add sortModelsByDependencyLevel helper
Handlebars.registerHelper("sortModelsByDependencyLevel", function(models) {
  if (!models || !Array.isArray(models)) return [];

  return [...models].sort((a, b) => {
    const levelA = Handlebars.helpers.getDependencyLevel(a, models);
    const levelB = Handlebars.helpers.getDependencyLevel(b, models);
    return levelA - levelB;
  });
});

// Add gt helper
Handlebars.registerHelper("gt", function(a, b) {
  return a > b;
});

// Add findModelPlural helper
Handlebars.registerHelper("findModelPlural", function(relationModel: string, models: ModelConfig[]) {
  if (!models || !Array.isArray(models)) return "";
  
  const model = models.find(m => m.modelName === relationModel);
  if (!model) return "";
  
  return model.plural;
});

// Add findModel helper
Handlebars.registerHelper("findModel", function(relationModel: string, models: ModelConfig[]) {
  if (!models || !Array.isArray(models)) return null;
  return models.find(m => m.modelName === relationModel) || null;
});

// Public API
export async function generateModule(
  config: ModuleConfig,
  options: {
    testMode?: boolean;
    dryRun?: boolean;
  } = {}
): Promise<FileChange[]> {
  return generateModuleFiles(config, options);
}

export async function generateModules(
  configs: ModuleConfig[],
  options: {
    testMode?: boolean;
    dryRun?: boolean;
  } = {}
): Promise<FileChange[]> {
  const allChanges: FileChange[] = [];
  const { testMode = false, dryRun = process.env.DRY_RUN === "1" } = options;
  const baseDir = testMode ? ".test-output" : "";
  const templates = await loadTemplates();

  // Generate module files
  for (const config of configs) {
    const changes = await generateModuleFiles(config, options);
    allChanges.push(...changes);
  }

  // Generate all middleware files
  const middlewareChanges = await generateMiddlewares(configs, options);
  allChanges.push(...middlewareChanges);

  // Generate all types files
  const typesChanges = await generateTypes(configs, options);
  allChanges.push(...typesChanges);

  // Generate seed file
  const seedChange = {
    path: path.join(baseDir, "src/scripts/seed.ts"),
    type: "create" as const,
    templatePath: templates.seedTemplate,
    modules: configs.map(config => ({
      ...config,
      models: config.models.map(model => ({
        ...model,
        module: config,  // Add module reference to each model
        fields: model.fields.map(field => ({
          ...field,
        }))
      }))
    })),
  };
  allChanges.push(seedChange);

  if (!dryRun) {
    // Process seed file
    const dir = path.dirname(seedChange.path);
    await fs.mkdir(dir, { recursive: true });
    
    const content = await processTemplate(seedChange.templatePath, { modules: seedChange.modules }, {
      templatePath: seedChange.templatePath,
      outputPath: seedChange.path,
    });
    await fs.writeFile(seedChange.path, content);
  }

  return allChanges;
}

// Export functions
export {
  processTemplate,
  loadTemplates,
  generateModuleFiles,
  generateMiddlewares,
  generateTypes,
};

