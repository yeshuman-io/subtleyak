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
  };
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
  model?: string;
  module?: string;
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
    
    return new Handlebars.SafeString(`${field.name}: model.${field.relation.type}(() => ${field.relation.model}, {
      ${relationConfig.join(',\n      ')}
    })`);
  }

  // Build the field definition with required flag
  let fieldDef = `${field.name}: model.${field.type === 'string' ? 'text' : field.type}()`;
  if (field.required) {
    fieldDef += `.required()`;
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

// Process template using Handlebars
async function processTemplate(templatePath: string, data: Record<string, any>): Promise<string> {
  try {
    const template = await fs.readFile(templatePath, 'utf-8');
    const compiledTemplate = Handlebars.compile(template);
    return compiledTemplate(data);
  } catch (error) {
    console.error(`Error processing template at ${templatePath}:`, error);
    throw error;
  }
}

// Load template content
async function loadTemplates() {
  const templateDir = path.join(process.cwd(), 'scripts/module-generator/templates');
  
  // Model templates
  const moduleModelTemplate = await fs.readFile(
    path.join(templateDir, 'src/modules/[module.plural]/[module.modelName].hbs'),
    'utf-8'
  );
  const modelTemplate = await fs.readFile(
    path.join(templateDir, 'src/modules/[module.plural]/models/[model.name].hbs'),
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

  // API route templates
  const routeTemplate = await fs.readFile(
    path.join(templateDir, 'src/api/admin/[module.plural]/[model.plural]/route.hbs'),
    'utf-8'
  );
  const idRouteTemplate = await fs.readFile(
    path.join(templateDir, 'src/api/admin/[module.plural]/[model.plural]/[id]/route.hbs'),
    'utf-8'
  );
  const validatorsTemplate = await fs.readFile(
    path.join(templateDir, 'src/api/admin/[module.plural]/[model.plural]/validators.hbs'),
    'utf-8'
  );

  // Admin UI templates
  const pageTemplate = await fs.readFile(
    path.join(templateDir, 'src/admin/routes/[module.plural]/[model.plural]/page.hbs'),
    'utf-8'
  );
  const createTemplate = await fs.readFile(
    path.join(templateDir, 'src/admin/routes/[module.plural]/[model.plural]/create/[model.name]-create.hbs'),
    'utf-8'
  );
  const editTemplate = await fs.readFile(
    path.join(templateDir, 'src/admin/routes/[module.plural]/[model.plural]/edit/[model.name]-edit.hbs'),
    'utf-8'
  );

  return {
    moduleModelTemplate,
    modelTemplate,
    serviceTemplate,
    indexTemplate,
    routeTemplate,
    idRouteTemplate,
    validatorsTemplate,
    pageTemplate,
    createTemplate,
    editTemplate
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
      path: `src/modules/${module.plural}/${isModuleModel ? '' : 'models/'}${model.name}.ts`,
      type: 'create',
      templatePath: isModuleModel ? templates.moduleModelTemplate : templates.modelTemplate,
      model: model.name,
      module: module.name
    });

    // API routes
    changes.push({
      path: `src/api/admin/${routePath}/route.ts`,
      type: 'create',
      templatePath: templates.routeTemplate,
      model: model.name,
      module: module.name
    });

    changes.push({
      path: `src/api/admin/${routePath}/[id]/route.ts`,
      type: 'create',
      templatePath: templates.idRouteTemplate,
      model: model.name,
      module: module.name
    });

    changes.push({
      path: `src/api/admin/${routePath}/validators.ts`,
      type: 'create',
      templatePath: templates.validatorsTemplate,
      model: model.name,
      module: module.name
    });

    // Admin UI routes
    changes.push({
      path: `src/admin/routes/${routePath}/page.tsx`,
      type: 'create',
      templatePath: templates.pageTemplate,
      model: model.name,
      module: module.name
    });

    changes.push({
      path: `src/admin/routes/${routePath}/create/${model.name}-create.tsx`,
      type: 'create',
      templatePath: templates.createTemplate,
      model: model.name,
      module: module.name
    });

    changes.push({
      path: `src/admin/routes/${routePath}/edit/${model.name}-edit.tsx`,
      type: 'create',
      templatePath: templates.editTemplate,
      model: model.name,
      module: module.name
    });
  }

  // Generate module service
  changes.push({
    path: `src/modules/${module.plural}/service.ts`,
    type: 'create',
    templatePath: templates.serviceTemplate,
    module: module.name
  });

  // Generate module index
  changes.push({
    path: `src/modules/${module.plural}/index.ts`,
    type: 'create',
    templatePath: templates.indexTemplate,
    module: module.name
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
      templatePath: path.join(templateDir, 'src/modules/[module.plural]/models/[model.name].hbs'),
      model: model.name,
      module: config.name
    });

    // API routes
    const apiBasePath = path.join(baseDir, 'api/admin', routePath);
    
    changes.push({
      path: path.join(apiBasePath, 'route.ts'),
      type: 'create',
      templatePath: path.join(templateDir, 'src/api/admin/[module.plural]/[model.plural]/route.hbs'),
      model: model.name,
      module: config.name
    });

    changes.push({
      path: path.join(apiBasePath, '[id]', 'route.ts'),
      type: 'create',
      templatePath: path.join(templateDir, 'src/api/admin/[module.plural]/[model.plural]/[id]/route.hbs'),
      model: model.name,
      module: config.name
    });

    changes.push({
      path: path.join(apiBasePath, 'validators.ts'),
      type: 'create',
      templatePath: path.join(templateDir, 'src/api/admin/[module.plural]/[model.plural]/validators.hbs'),
      model: model.name,
      module: config.name
    });

    // Admin UI routes
    const adminBasePath = path.join(baseDir, 'admin/routes', routePath);

    changes.push({
      path: path.join(adminBasePath, 'page.tsx'),
      type: 'create',
      templatePath: path.join(templateDir, 'src/admin/routes/[module.plural]/[model.plural]/page.hbs'),
      model: model.name,
      module: config.name
    });

    changes.push({
      path: path.join(adminBasePath, 'create', `${model.name}-create.tsx`),
      type: 'create',
      templatePath: path.join(templateDir, 'src/admin/routes/[module.plural]/[model.plural]/create/[model.name]-create.hbs'),
      model: model.name,
      module: config.name
    });

    changes.push({
      path: path.join(adminBasePath, 'edit', `${model.name}-edit.tsx`),
      type: 'create',
      templatePath: path.join(templateDir, 'src/admin/routes/[module.plural]/[model.plural]/edit/[model.name]-edit.hbs'),
      model: model.name,
      module: config.name
    });
  }

  // Generate module service
  changes.push({
    path: path.join(baseDir, 'modules', config.plural, 'service.ts'),
    type: 'create',
    templatePath: path.join(templateDir, 'src/modules/[module.plural]/service.hbs'),
    module: config.name
  });

  // Generate module index
  changes.push({
    path: path.join(baseDir, 'modules', config.plural, 'index.ts'),
    type: 'create',
    templatePath: path.join(templateDir, 'src/modules/[module.plural]/index.hbs'),
    module: config.name
  });

  if (dryRun) {
    console.log(`\nDry run for module: ${config.name}`);
    console.log('='.repeat(50));
    console.log('Files to be generated:');
    changes.forEach(change => {
      console.log(`  ${change.path}`);
    });
  } else {
    // Process all changes
    for (const change of changes) {
      const dir = path.dirname(change.path);
      await fs.mkdir(dir, { recursive: true });
      
      const data = {
        module: config,
        model: change.model ? allModels.find(m => m.name === change.model) : null,
        isModuleModel: change.model === config.modelName
      };

      const content = await processTemplate(change.templatePath, data);
      await fs.writeFile(change.path, content);
      console.log(`Generated: ${change.path}`);
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

Handlebars.registerHelper('toUpperCase', (str: string) => {
  if (!str) return '';
  return str.toUpperCase();
});