/**
 * Medusa Module Generator v2
 * 
 * A step-by-step rebuild of the module generator with improved architecture.
 * Step 1: Basic model generation
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';
import { format, resolveConfig } from 'prettier';
import Handlebars from 'handlebars';

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
  name: string;
  modelName: string;
  singular: string;
  plural: string;
  fields: ModelField[];
  models: ModelConfig[];
};

export type FileChange = {
  path: string;
  type: 'create' | 'modify';
  templatePath: string;
  model?: ModelConfig;
  module?: ModuleConfig;
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
      relationConfig.push(`inverseJoinColumn: "${field.relation.inverseJoinColumn}"`);
    }
    
    return new Handlebars.SafeString(`${field.name}: model.${field.relation.type}(() => ${field.relation.model}${relationConfig.length ? `, {\n      ${relationConfig.join(',\n      ')}\n    }` : ''}`);
  }

  // Build the field definition with required flag and default value
  let fieldDef = `${field.name}: model.${field.type === 'string' ? 'text' : field.type}()`;
  if (field.required) {
    fieldDef += `.required()`;
  }
  if (field.default !== undefined) {
    fieldDef += `.default(${JSON.stringify(field.default)})`;
  }
  return new Handlebars.SafeString(fieldDef);
}

// Register Handlebars helpers
Handlebars.registerHelper('toPascalCase', (str: string) => {
  if (!str) return '';
  return str.split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
});

Handlebars.registerHelper('toSnakeCase', (str: string) => {
  if (!str) return '';
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/-/g, '_')
    .toLowerCase();
});

Handlebars.registerHelper('toTitleCase', (str: string) => {
  if (!str) return '';
  return str.split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
});

Handlebars.registerHelper('toLowerCase', (str: string) => {
  if (!str) return '';
  return str.toLowerCase();
});

Handlebars.registerHelper('toCamelCase', (str: string) => {
  if (!str) return '';
  return str.split(/[-_]/)
    .map((word, i) => i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
});

Handlebars.registerHelper('toKebabCase', (str: string) => {
  if (!str) return '';
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
});

Handlebars.registerHelper('eq', function(a: any, b: any) {
  return a === b;
});

Handlebars.registerHelper('type', function(value: string, type: string) {
  return value === type;
});

// Property access helpers
Handlebars.registerHelper('propAccess', function(obj: string, prop: string, options: any) {
  if (typeof obj !== 'string' || typeof prop !== 'string') {
    return '';
  }
  const propertyAccess = `${obj}.${prop}`;
  // For template literals, wrap in ${} and return as SafeString
  if (options.hash.templateLiteral) {
    return new Handlebars.SafeString('${' + propertyAccess + '}');
  }
  // For normal usage, escape the expression
  return Handlebars.Utils.escapeExpression(propertyAccess);
});

// Enhanced React component helper
Handlebars.registerHelper('reactComponent', function(options: any) {
  const content = options.fn(this);
  return new Handlebars.SafeString(
    content
      // Handle JSX expressions
      .replace(/\{\{([^}]+)\}\}/g, (match, p1) => {
        if (p1.startsWith('#') || p1.startsWith('/')) return match;
        if (p1.includes('&&') || p1.includes('||') || p1.includes('?')) {
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
Handlebars.registerHelper('jsx-if', function(condition: string, options: any) {
  // First evaluate any nested Handlebars expressions in the condition
  const evaluatedCondition = Handlebars.compile(condition)(this);
  // Remove extra whitespace and wrap content tightly
  const content = options.fn(this).trim();
  return new Handlebars.SafeString(
    `{${evaluatedCondition} && (${content})}`
  );
});

// JSX-specific list rendering helper
Handlebars.registerHelper('jsx-each', function(items: string, options: any) {
  // First evaluate any nested Handlebars expressions in items
  const evaluatedItems = Handlebars.compile(items)(this);
  return new Handlebars.SafeString(
    `{${evaluatedItems}.map((item, index) => (${options.fn(this).trim()}))}`
  );
});

// JSX-specific ternary helper
Handlebars.registerHelper('jsx-ternary', function(condition: string, truthy: string, falsy: string) {
  // First evaluate any nested expressions
  const evaluatedCondition = Handlebars.compile(condition)(this);
  const evaluatedTruthy = Handlebars.compile(truthy)(this);
  const evaluatedFalsy = Handlebars.compile(falsy)(this);
  return new Handlebars.SafeString(
    `{${evaluatedCondition} ? ${evaluatedTruthy} : ${evaluatedFalsy}}`
  );
});

// JSX-specific raw expression helper
Handlebars.registerHelper('jsx-expr', function(expression: string) {
  // First evaluate any nested Handlebars expressions
  const evaluatedExpr = Handlebars.compile(expression)(this);
  return new Handlebars.SafeString(`{${evaluatedExpr}}`);
});

// Helper to process field definitions
Handlebars.registerHelper('processField', processField);

// Add new module/model helpers
Handlebars.registerHelper('isModuleModel', function(model: any, module: any) {
  return model?.name === module?.modelName ? 'true' : '';
});

Handlebars.registerHelper('getRoutePath', function(model: any, module: any) {
  return model?.name === module?.modelName ? module?.plural : `${module?.plural}/${model?.plural}`;
});

Handlebars.registerHelper('getModelImportPath', function(model: any, module: any) {
  return model?.name === module?.modelName ? './' : `./models/${model?.name}`;
});

Handlebars.registerHelper('toUpperCase', (str: string) => {
  if (!str) return '';
  return str.toUpperCase();
});

Handlebars.registerHelper('find', (array: any[], key: string, value: string) => {
  if (!array || !Array.isArray(array)) return null;
  return array.find(item => item[key] === value);
});

// Process template using Handlebars
async function processTemplate(templateContent: string, data: Record<string, any>): Promise<string> {
  try {
    const compiledTemplate = Handlebars.compile(templateContent);
    return compiledTemplate(data);
  } catch (error) {
    console.error(`Error processing template:`, error);
    throw error;
  }
}

// Load template content
async function loadTemplates() {
  const templateDir = path.join(process.cwd(), 'scripts/module-generator/templates');
  
  // Module level templates
  const moduleModelTemplate = await fs.readFile(
    path.join(templateDir, 'src/modules/[module.plural]/models/[module.modelName].hbs'),
    'utf-8'
  );
  const moduleListRouteTemplate = await fs.readFile(
    path.join(templateDir, 'src/api/admin/[module.plural]/route.hbs'),
    'utf-8'
  );
  const moduleIdRouteTemplate = await fs.readFile(
    path.join(templateDir, 'src/api/admin/[module.plural]/[id]/route.hbs'),
    'utf-8'
  );
  const moduleValidatorsTemplate = await fs.readFile(
    path.join(templateDir, 'src/api/admin/[module.plural]/validators.hbs'),
    'utf-8'
  );
  const moduleListPageTemplate = await fs.readFile(
    path.join(templateDir, 'src/admin/routes/[module.plural]/page.hbs'),
    'utf-8'
  );
  const moduleCreateFormTemplate = await fs.readFile(
    path.join(templateDir, 'src/admin/routes/[module.plural]/create/[module.singular]-create.hbs'),
    'utf-8'
  );
  const moduleEditFormTemplate = await fs.readFile(
    path.join(templateDir, 'src/admin/routes/[module.plural]/edit/[module.singular]-edit.hbs'),
    'utf-8'
  );

  // Model level templates
  const modelTemplate = await fs.readFile(
    path.join(templateDir, 'src/modules/[module.plural]/models/[model.name].hbs'),
    'utf-8'
  );
  const modelListRouteTemplate = await fs.readFile(
    path.join(templateDir, 'src/api/admin/[module.plural]/[model.plural]/route.hbs'),
    'utf-8'
  );
  const modelIdRouteTemplate = await fs.readFile(
    path.join(templateDir, 'src/api/admin/[module.plural]/[model.plural]/[id]/route.hbs'),
    'utf-8'
  );
  const modelValidatorsTemplate = await fs.readFile(
    path.join(templateDir, 'src/api/admin/[module.plural]/[model.plural]/validators.hbs'),
    'utf-8'
  );
  const modelListPageTemplate = await fs.readFile(
    path.join(templateDir, 'src/admin/routes/[module.plural]/[model.plural]/page.hbs'),
    'utf-8'
  );
  const modelCreateFormTemplate = await fs.readFile(
    path.join(templateDir, 'src/admin/routes/[module.plural]/[model.plural]/create/[model.name]-create.hbs'),
    'utf-8'
  );
  const modelEditFormTemplate = await fs.readFile(
    path.join(templateDir, 'src/admin/routes/[module.plural]/[model.plural]/edit/[model.name]-edit.hbs'),
    'utf-8'
  );

  // Service and index templates
  const serviceTemplate = await fs.readFile(
    path.join(templateDir, 'src/modules/[module.plural]/service.hbs'),
    'utf-8'
  );
  const indexTemplate = await fs.readFile(
    path.join(templateDir, 'src/modules/[module.plural]/index.hbs'),
    'utf-8'
  );

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
    indexTemplate
  };
}

// Generate module files
async function generateModuleFiles(module: ModuleConfig): Promise<FileChange[]> {
  const changes: FileChange[] = [];
  const templates = await loadTemplates();

  // Create module's own model
  const moduleModel: ModelConfig = {
    name: module.modelName,
    singular: module.singular,
    plural: module.plural,
    fields: module.fields
  };

  // Process all models (including module's own model)
  const allModels = [moduleModel, ...module.models];
  
  for (const model of allModels) {
    const isModuleModel = model.name === module.modelName;
    const routePath = isModuleModel ? module.plural : `${module.plural}/${model.plural}`;

    // Model file
    changes.push({
      path: `src/modules/${module.plural}/${isModuleModel ? model.name : `models/${model.name}`}.ts`,
      type: 'create',
      templatePath: isModuleModel ? templates.moduleModelTemplate : templates.modelTemplate,
      model: model,
      module: module
    });

    // API routes
    changes.push({
      path: `src/api/admin/${routePath}/route.ts`,
      type: 'create',
      templatePath: isModuleModel ? templates.moduleListRouteTemplate : templates.modelListRouteTemplate,
      model: model,
      module: module
    });

    changes.push({
      path: `src/api/admin/${routePath}/[id]/route.ts`,
      type: 'create',
      templatePath: isModuleModel ? templates.moduleIdRouteTemplate : templates.modelIdRouteTemplate,
      model: model,
      module: module
    });

    changes.push({
      path: `src/api/admin/${routePath}/validators.ts`,
      type: 'create',
      templatePath: isModuleModel ? templates.moduleValidatorsTemplate : templates.modelValidatorsTemplate,
      model: model,
      module: module
    });

    // Admin UI routes
    changes.push({
      path: `src/admin/routes/${routePath}/page.tsx`,
      type: 'create',
      templatePath: isModuleModel ? templates.moduleListPageTemplate : templates.modelListPageTemplate,
      model: model,
      module: module
    });

    const createFormPath = isModuleModel 
      ? `src/admin/routes/${routePath}/create/${module.singular}-create.tsx`
      : `src/admin/routes/${routePath}/create/${model.name}-create.tsx`;

    changes.push({
      path: createFormPath,
      type: 'create',
      templatePath: isModuleModel ? templates.moduleCreateFormTemplate : templates.modelCreateFormTemplate,
      model: model,
      module: module
    });

    const editFormPath = isModuleModel
      ? `src/admin/routes/${routePath}/edit/${module.modelName}-edit.tsx`
      : `src/admin/routes/${routePath}/edit/${model.name}-edit.tsx`;

    changes.push({
      path: editFormPath,
      type: 'create',
      templatePath: isModuleModel ? templates.moduleEditFormTemplate : templates.modelEditFormTemplate,
      model: model,
      module: module
    });
  }

  // Generate module service
  changes.push({
    path: `src/modules/${module.plural}/service.ts`,
    type: 'create',
    templatePath: templates.serviceTemplate,
    module: module
  });

  // Generate module index
  changes.push({
    path: `src/modules/${module.plural}/index.ts`,
    type: 'create',
    templatePath: templates.indexTemplate,
    module: module
  });

  return changes;
}

// Main generation function
export async function generateModule(
  config: ModuleConfig,
  options: {
    testMode?: boolean;
    dryRun?: boolean;
  } = {}
): Promise<FileChange[]> {
  const { testMode = false, dryRun = process.env.DRY_RUN === '1' } = options;
  const changes: FileChange[] = [];
  const baseDir = testMode ? '.test-output/src' : 'src';
  const templateDir = path.join(process.cwd(), 'scripts/module-generator/templates');
  const templates = await loadTemplates();

  // Generate module's own model
  const moduleModel: ModelConfig = {
    name: config.modelName,
    singular: config.singular,
    plural: config.plural,
    fields: config.fields
  };

  // Process all models (including module's own model)
  const allModels = [moduleModel, ...config.models];
  
  for (const model of allModels) {
    const isModuleModel = model.name === config.modelName;
    const routePath = isModuleModel ? config.plural : `${config.plural}/${model.plural}`;

    // Model file
    const modelPath = isModuleModel 
      ? path.join(baseDir, 'modules', config.plural, `${model.name}.ts`)
      : path.join(baseDir, 'modules', config.plural, 'models', `${model.name}.ts`);

    changes.push({
      path: modelPath,
      type: 'create',
      templatePath: isModuleModel ? templates.moduleModelTemplate : templates.modelTemplate,
      model: model,
      module: config
    });

    // API routes
    const apiBasePath = path.join(baseDir, 'api/admin', routePath);
    
    changes.push({
      path: path.join(apiBasePath, 'route.ts'),
      type: 'create',
      templatePath: isModuleModel ? templates.moduleListRouteTemplate : templates.modelListRouteTemplate,
      model: model,
      module: config
    });

    changes.push({
      path: path.join(apiBasePath, '[id]', 'route.ts'),
      type: 'create',
      templatePath: isModuleModel ? templates.moduleIdRouteTemplate : templates.modelIdRouteTemplate,
      model: model,
      module: config
    });

    changes.push({
      path: path.join(apiBasePath, 'validators.ts'),
      type: 'create',
      templatePath: isModuleModel ? templates.moduleValidatorsTemplate : templates.modelValidatorsTemplate,
      model: model,
      module: config
    });

    // Admin UI routes
    const adminBasePath = path.join(baseDir, 'admin/routes', routePath);

    changes.push({
      path: path.join(adminBasePath, 'page.tsx'),
      type: 'create',
      templatePath: isModuleModel ? templates.moduleListPageTemplate : templates.modelListPageTemplate,
      model: model,
      module: config
    });

    changes.push({
      path: path.join(adminBasePath, 'create', `${model.name}-create.tsx`),
      type: 'create',
      templatePath: isModuleModel ? templates.moduleCreateFormTemplate : templates.modelCreateFormTemplate,
      model: model,
      module: config
    });

    changes.push({
      path: path.join(adminBasePath, 'edit', `${model.name}-edit.tsx`),
      type: 'create',
      templatePath: isModuleModel ? templates.moduleEditFormTemplate : templates.modelEditFormTemplate,
      model: model,
      module: config
    });
  }

  // Generate module service
  changes.push({
    path: path.join(baseDir, 'modules', config.plural, 'service.ts'),
    type: 'create',
    templatePath: templates.serviceTemplate,
    module: config
  });

  // Generate module index
  changes.push({
    path: path.join(baseDir, 'modules', config.plural, 'index.ts'),
    type: 'create',
    templatePath: templates.indexTemplate,
    module: config
  });

  if (dryRun) {
    // Log module templates
    console.log(`\nModule: ${config.modelName}`);
    changes.filter(c => c.model?.name === config.modelName).forEach(change => {
      console.log(`Template: ${change.templatePath}`);
      console.log(`Output:   ${change.path}`);
      console.log('...');
    });

    // Log model templates
    config.models.forEach(model => {
      console.log(`\nModel: ${model.name}`);
      changes.filter(c => c.model?.name === model.name).forEach(change => {
        console.log(`Template: ${change.templatePath}`);
        console.log(`Output:   ${change.path}`);
        console.log('...');
      });
    });

    // Log common templates
    const commonChanges = changes.filter(c => !c.model);
    if (commonChanges.length > 0) {
      console.log(`\nCommon:`);
      commonChanges.forEach(change => {
        console.log(`Template: ${change.templatePath}`);
        console.log(`Output:   ${change.path}`);
        console.log('...');
      });
    }
  } else {
    // Process all changes
    console.log(`\nGenerating files for module: ${config.name}`);
    console.log('='.repeat(50));
    
    for (const change of changes) {
      const dir = path.dirname(change.path);
      await fs.mkdir(dir, { recursive: true });
      
      const data = {
        module: config,
        model: change.model || null,
        isModuleModel: change.model?.name === config.modelName
      };

      const content = await processTemplate(change.templatePath, data);
      await fs.writeFile(change.path, content);
    }
  }

  return changes;
}

// Export functions
export {
  processTemplate,
  loadTemplates,
  generateModuleFiles
};

