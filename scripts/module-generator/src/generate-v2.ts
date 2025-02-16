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
  type: "string" | "number" | "boolean" | "date";
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

export type ModelConfig = {
  name: string;
  singular: string;
  plural: string;
  fields: ModelField[];
};

export type ModuleConfig = {
  moduleName: string;
  moduleModelName: string;
  singular: string;
  plural: string;
  models: ModelConfig[];
};

export type FileChange = {
  path: string;
  type: "create" | "modify";
  templatePath: string;
  model?: ModelConfig;
  module?: ModuleConfig;
  modules?: Array<{
    moduleName: string;
    plural: string;
    models: Array<{
      name: string;
      plural: string;
    }>;
  }>;
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

// Debug helper
Handlebars.registerHelper("debug", function (context) {
  console.log("Template Debug Context:", JSON.stringify(context, null, 2));
  return "";
});

// Add debug utility function
function debug(...args: any[]) {
  if (process.env.DEBUG === '1') {
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
    if (process.env.DEBUG === '1') {
      const templateName = options?.templatePath 
        ? path.basename(options.templatePath, '.hbs')
            .replace(/\[module\.plural\]/, data.module?.plural || '')
            .replace(/\[module\.singular\]/, data.module?.singular || '')
            .replace(/\[model\.plural\]/, data.model?.plural || '')
            .replace(/\[model\.name\]/, data.model?.name || '')
        : 'unknown';

      const debugInfo = {
        template: templateName,
        destination: options?.outputPath || 'unknown',
        module: {
          name: data.module?.moduleName,
          singular: data.module?.singular,
          plural: data.module?.plural,
        },
        model: data.model ? {
          name: data.model.name,
          singular: data.model.singular,
          plural: data.model.plural,
          isModuleModel: data.isModuleModel
        } : null,
        multipleModules: data.modules ? `${data.modules.length} modules` : null
      };

      debug(chalk.gray('\nProcessing template:'));
      debug(chalk.blue('Template:     '), debugInfo.template);
      debug(chalk.blue('Destination:  '), debugInfo.destination);
      if (debugInfo.model) {
        debug(chalk.blue('Model:        '), 
          `${debugInfo.model.name}${debugInfo.model.isModuleModel ? ' (module model)' : ''}`);
      }
      debug(chalk.blue('Module:       '), 
        `${debugInfo.module.name} (${debugInfo.module.singular}/${debugInfo.module.plural})`);
      if (debugInfo.multipleModules) {
        debug(chalk.blue('Modules:      '), debugInfo.multipleModules);
      }
      debug('');
    }

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
  const { testMode = false, dryRun = process.env.DRY_RUN === "1" } = options;
  const baseDir = testMode ? ".test-output" : "";
  const changes: FileChange[] = [];
  const templates = await loadTemplates();

  // Find module's own model using moduleModelName
  const moduleModel = config.models.find((m) => m.name === config.moduleModelName);
  debug(`Debug - Module ${config.moduleName}:`, {
    foundModuleModel: !!moduleModel,
    moduleModelName: config.moduleModelName,
    matchedModelName: moduleModel?.name
  });
  if (!moduleModel) {
    console.warn(
      chalk.yellow(`Warning: No model found matching module model name: ${config.moduleModelName}`)
    );
  }

  // Process all models (including module's own model if found)
  const allModels = moduleModel
    ? [
        moduleModel,
        ...config.models.filter((m) => m.name !== config.moduleModelName),
      ]
    : config.models;

  for (const model of allModels) {
    const isModuleModel = model.name === config.moduleModelName;
    debug(`Debug - Processing model ${model.name}:`, {
      isModuleModel,
      moduleModelName: config.moduleModelName
    });
    
    // Always use models directory and model's plural for routes
    const routePath = `${config.plural}/${model.plural}`;

    // Model file - always in models directory
    const modelPath = path.join(
      baseDir,
      "src/modules",
      config.plural,
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
      module: config,
    });

    // API routes
    const apiBasePath = path.join(baseDir, "src/api/admin", routePath);

    changes.push({
      path: path.join(apiBasePath, "route.ts"),
      type: "create",
      templatePath: isModuleModel
        ? templates.moduleListRouteTemplate
        : templates.modelListRouteTemplate,
      model,
      module: config,
    });

    changes.push({
      path: path.join(apiBasePath, "[id]", "route.ts"),
      type: "create",
      templatePath: isModuleModel
        ? templates.moduleIdRouteTemplate
        : templates.modelIdRouteTemplate,
      model,
      module: config,
    });

    changes.push({
      path: path.join(apiBasePath, "validators.ts"),
      type: "create",
      templatePath: isModuleModel
        ? templates.moduleValidatorsTemplate
        : templates.modelValidatorsTemplate,
      model,
      module: config,
    });

    // Admin UI routes
    const adminBasePath = path.join(baseDir, "src/admin/routes", routePath);

    changes.push({
      path: path.join(adminBasePath, "page.tsx"),
      type: "create",
      templatePath: isModuleModel
        ? templates.moduleListPageTemplate
        : templates.modelListPageTemplate,
      model,
      module: config,
    });

    changes.push({
      path: path.join(adminBasePath, "create", `${model.name}-create.tsx`),
      type: "create",
      templatePath: isModuleModel
        ? templates.moduleCreateFormTemplate
        : templates.modelCreateFormTemplate,
      model,
      module: config,
    });

    changes.push({
      path: path.join(adminBasePath, "edit", `${model.name}-edit.tsx`),
      type: "create",
      templatePath: isModuleModel
        ? templates.moduleEditFormTemplate
        : templates.modelEditFormTemplate,
      model,
      module: config,
    });
  }

  // Generate module service
  changes.push({
    path: path.join(baseDir, "src/modules", config.plural, "service.ts"),
    type: "create",
    templatePath: templates.serviceTemplate,
    module: config,
  });

  // Generate module index
  changes.push({
    path: path.join(baseDir, "src/modules", config.plural, "index.ts"),
    type: "create",
    templatePath: templates.indexTemplate,
    module: config,
  });

  if (!dryRun) {
    for (const change of changes) {
      const dir = path.dirname(change.path);
      await fs.mkdir(dir, { recursive: true });

      const data = {
        module: config,
        model: change.model || null,
        isModuleModel: change.model?.name === config.moduleModelName,
      };

      const content = await processTemplate(change.templatePath, data, {
        templatePath: change.templatePath,
        outputPath: change.path
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
    path: path.join(baseDir, "src/admin/types/index.ts"),
    type: "create" as const,
    templatePath: templates.mainTypesTemplate,
    modules: modules.map((module) => ({
      plural: module.plural,
      singular: module.singular,
      moduleName: module.moduleName,
      models: module.models.map((m) => ({
        name: m.name,
        plural: m.plural,
        singular: m.singular,
        fields: m.fields,
      })),
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
        outputPath: change.path
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
      module,
    });

    // Generate model-level middlewares
    for (const model of module.models) {
      changes.push({
        path: path.join(
          baseDir,
          "src/api/admin",
          module.plural,
          model.plural,
          "middlewares.ts"
        ),
        type: "create",
        templatePath: templates.modelMiddlewaresTemplate,
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
      moduleName: module.moduleName,
      plural: module.plural,
      models: module.models.map((m) => ({
        name: m.name,
        plural: m.plural,
      })),
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
        outputPath: change.path
      });
      await fs.writeFile(change.path, content);
    }
  }

  return changes;
}

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
