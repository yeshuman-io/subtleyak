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

// Load template content
async function loadTemplates() {
  const templateDir = path.join(process.cwd(), 'scripts/module-generator/templates');
  const modelTemplate = await fs.readFile(
    path.join(templateDir, 'src/modules/[module.plural]/models/[model.name].hbs'),
    'utf-8'
  );
  const serviceTemplate = await fs.readFile(
    path.join(templateDir, 'src/modules/[module.plural]/service.hbs'),
    'utf-8'
  );
  const indexTemplate = await fs.readFile(
    path.join(templateDir, 'src/modules/[module.plural]/index.hbs'),
    'utf-8'
  );

  return { modelTemplate, serviceTemplate, indexTemplate };
}

// Core types for minimal implementation
export type ModelField = {
  name: string;
  type: "text" | "number" | "boolean" | "date";
  chainables?: Array<{
    name: "nullable" | "unique" | "index" | "primaryKey";  // Only database-level chainables
    args?: Array<string | number | boolean>;
  }>;
  validation?: {  // Separate validation rules for Zod schemas
    min?: number;
    max?: number;
    email?: boolean;
    regex?: string;
    required?: boolean;
  };
  relation?: {
    type: "belongsTo" | "hasMany" | "manyToMany";
    model: string;
    mappedBy?: string;
    through?: string;
  };
};

export type ModelConfig = {
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

export type ModuleConfig = {
  moduleName: string;
  singular: string;
  plural: string;
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

  // Build the field definition with only database-level chainables
  let fieldDef = `${field.name}: model.${field.type}()`;
  if (field.chainables?.length) {
    fieldDef += field.chainables.map(chain => {
      if (chain.args?.length) {
        const args = chain.args.map(arg => {
          if (typeof arg === 'string') return `"${arg}"`;
          return arg;
        }).join(', ');
        return `.${chain.name}(${args})`;
      }
      return `.${chain.name}()`;
    }).join('');
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

// Update formatOutput function
async function formatOutput(content: string): Promise<string> {
  try {
    const config = await resolveConfig(process.cwd());
    return format(content, {
      ...config,
      parser: content.includes('jsx') || content.includes('tsx') ? 'typescript-react' : 'typescript',
      trailingComma: 'all',
    });
  } catch (error) {
    console.error('Error formatting output:', error);
    throw error;
  }
}

// Modify generateFile function
async function generateFile(
  templatePath: string,
  outputPath: string,
  data: Record<string, any>,
  options: { dryRun?: boolean } = {}
): Promise<void> {
  const { dryRun = process.env.DRY_RUN === '1' } = options;
  
  // Process template
  const content = await processTemplate(templatePath, data);
  const formattedContent = await formatOutput(content);

  if (dryRun) {
    console.log(`\nWould generate file:`);
    console.log(`  Path: ${outputPath}`);
    console.log(`  Template: ${path.basename(templatePath)}`);
    if (data.model) {
      console.log(`  Model: ${data.model.name}`);
    }
    if (data.module) {
      console.log(`  Module: ${data.module.moduleName}`);
    }
    console.log('-'.repeat(50));
    return;
  }

  // Create directory if it doesn't exist
  const dir = path.dirname(outputPath);
  await fs.mkdir(dir, { recursive: true });

  // Write file
  await fs.writeFile(outputPath, formattedContent);
  console.log(`Generated: ${outputPath}`);
}

// Helper function to get admin route path based on model config
function getAdminRoutePath(moduleConfig: ModuleConfig, modelConfig: ModelConfig): string {
  if (modelConfig.parent) {
    // Use the parent's route prefix if specified
    return modelConfig.parent.routePrefix;
  }
  if (modelConfig.isParent) {
    // For parent models, use their plural form
    return `${modelConfig.plural}`;
  }
  // For regular models, use the model's plural form
  return `${modelConfig.plural}`;
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
  
  console.log('Debug: Starting module generation');
  console.log('Debug: DRY_RUN =', process.env.DRY_RUN);
  console.log('Debug: Options =', JSON.stringify(options));
  console.log('Debug: Config =', JSON.stringify(config));

  const changes: FileChange[] = [];
  const baseDir = testMode ? '.test-output/src' : 'src';
  const templateDir = path.join(process.cwd(), 'scripts/module-generator/templates');

  if (dryRun) {
    console.log(`\nDry run for module: ${config.moduleName}`);
    console.log('='.repeat(50));
  }

  // Process each model
  for (const model of config.models) {
    // Generate model file
    const modelOutputPath = path.join(
      baseDir,
      'modules',
      config.plural,
      'models',
      `${model.name}.ts`
    );
    await generateFile(
      path.join(templateDir, 'src/modules/[module.plural]/models/[model.name].hbs'),
      modelOutputPath,
      { model, module: config },
      { dryRun }
    );

    // Generate admin route files
    const adminRoutePath = getAdminRoutePath(config, model);
    
    // Base route
    const routeOutputPath = path.join(
      baseDir,
      'api/admin',
      config.plural,
      adminRoutePath,
      'route.ts'
    );
    await generateFile(
      path.join(templateDir, 'src/api/admin/[module.plural]/[model.plural]/route.hbs'),
      routeOutputPath,
      { model, module: config },
      { dryRun }
    );

    // ID route
    const idRouteOutputPath = path.join(
      baseDir,
      'api/admin',
      config.plural,
      adminRoutePath,
      '[id]',
      'route.ts'
    );
    await generateFile(
      path.join(templateDir, 'src/api/admin/[module.plural]/[model.plural]/[id]/route.hbs'),
      idRouteOutputPath,
      { model, module: config },
      { dryRun }
    );

    // Generate validator file
    const validatorOutputPath = path.join(
      baseDir,
      'api/admin',
      config.plural,
      adminRoutePath,
      'validators.ts'
    );
    await generateFile(
      path.join(templateDir, 'src/api/admin/[module.plural]/[model.plural]/validators.hbs'),
      validatorOutputPath,
      { model, module: config },
      { dryRun }
    );

    // Generate admin UI files
    const adminUIPath = path.join(
      baseDir,
      'admin/routes',
      config.plural,
      adminRoutePath
    );

    // List page
    await generateFile(
      path.join(templateDir, 'src/admin/routes/[module.plural]/[model.plural]/page.hbs'),
      path.join(adminUIPath, 'page.tsx'),
      { model, module: config },
      { dryRun }
    );

    // Create form
    await generateFile(
      path.join(templateDir, 'src/admin/routes/[module.plural]/[model.plural]/create/[model.name]-create.hbs'),
      path.join(adminUIPath, 'create', `${model.name}-create.tsx`),
      { model, module: config },
      { dryRun }
    );

    // Edit form
    await generateFile(
      path.join(templateDir, 'src/admin/routes/[module.plural]/[model.plural]/edit/[model.name]-edit.hbs'),
      path.join(adminUIPath, 'edit', `${model.name}-edit.tsx`),
      { model, module: config },
      { dryRun }
    );

    changes.push({
      path: modelOutputPath,
      type: 'create',
      templatePath: path.join(templateDir, 'src/modules/[module.plural]/models/[model.name].hbs'),
      model: model.name,
      module: config.moduleName
    });
    changes.push({
      path: routeOutputPath,
      type: 'create',
      templatePath: path.join(templateDir, 'src/api/admin/[module.plural]/[model.plural]/route.hbs'),
      model: model.name,
      module: config.moduleName
    });
    changes.push({
      path: idRouteOutputPath,
      type: 'create',
      templatePath: path.join(templateDir, 'src/api/admin/[module.plural]/[model.plural]/[id]/route.hbs'),
      model: model.name,
      module: config.moduleName
    });
    changes.push({
      path: validatorOutputPath,
      type: 'create',
      templatePath: path.join(templateDir, 'src/api/admin/[module.plural]/[model.plural]/validators.hbs'),
      model: model.name,
      module: config.moduleName
    });
    changes.push({
      path: path.join(adminUIPath, 'page.tsx'),
      type: 'create',
      templatePath: path.join(templateDir, 'src/admin/routes/[module.plural]/[model.plural]/page.hbs'),
      model: model.name,
      module: config.moduleName
    });
    changes.push({
      path: path.join(adminUIPath, 'create', `${model.name}-create.tsx`),
      type: 'create',
      templatePath: path.join(templateDir, 'src/admin/routes/[module.plural]/[model.plural]/create/[model.name]-create.hbs'),
      model: model.name,
      module: config.moduleName
    });
    changes.push({
      path: path.join(adminUIPath, 'edit', `${model.name}-edit.tsx`),
      type: 'create',
      templatePath: path.join(templateDir, 'src/admin/routes/[module.plural]/[model.plural]/edit/[model.name]-edit.hbs'),
      model: model.name,
      module: config.moduleName
    });

    if (dryRun) {
      console.log(`\nModule: ${config.moduleName}`);
      console.log(`Model: ${model.name}`);
      console.log('Files to be generated:');
      console.log(`  ${modelOutputPath}`);
      console.log(`  ${routeOutputPath}`);
      console.log(`  ${idRouteOutputPath}`);
      console.log(`  ${validatorOutputPath}`);
      console.log(`  ${path.join(adminUIPath, 'page.tsx')}`);
      console.log(`  ${path.join(adminUIPath, 'create', `${model.name}-create.tsx`)}`);
      console.log(`  ${path.join(adminUIPath, 'edit', `${model.name}-edit.tsx`)}`);
    }
  }

  // Generate service file
  const serviceOutputPath = path.join(
    baseDir,
    'modules',
    config.plural,
    'service.ts'
  );
  await generateFile(
    path.join(templateDir, 'src/modules/[module.plural]/service.hbs'),
    serviceOutputPath,
    {
      models: config.models.map(model => ({
        ...model,
        pascalName: model.name.split('-')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join('')
      })),
      serviceName: config.moduleName.split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('')
    },
    { dryRun }
  );

  // Generate index file
  const indexOutputPath = path.join(
    baseDir,
    'modules',
    config.plural,
    'index.ts'
  );
  await generateFile(
    path.join(templateDir, 'src/modules/[module.plural]/index.hbs'),
    indexOutputPath,
    { 
      moduleName: config.moduleName,
      moduleConstName: config.moduleName.toUpperCase().replace(/-/g, '_'),
      serviceName: config.moduleName.split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('')
    },
    { dryRun }
  );

  changes.push({
    path: serviceOutputPath,
    type: 'create',
    templatePath: path.join(templateDir, 'src/modules/[module.plural]/service.hbs'),
    model: config.moduleName,
    module: config.moduleName
  });
  changes.push({
    path: indexOutputPath,
    type: 'create',
    templatePath: path.join(templateDir, 'src/modules/[module.plural]/index.hbs'),
    model: config.moduleName,
    module: config.moduleName
  });

  if (dryRun) {
    console.log(`\nService and Index files:`);
    console.log(`  ${serviceOutputPath}`);
    console.log(`  ${indexOutputPath}`);
  }

  return changes;
}

// Main entry point
if (require.main === module) {
  const configPath = process.argv[2];
  if (!configPath) {
    console.error('Error: No config file specified');
    process.exit(1);
  }

  console.log('Debug: Loading config from', configPath);
  
  import(configPath).then(async (config) => {
    console.log('Debug: Config loaded');
    
    // Generate each module
    for (const moduleName of Object.keys(config.MODULES)) {
      const moduleConfig = config.MODULES[moduleName];
      console.log(`\nProcessing module: ${moduleName}`);
      await generateModule(moduleConfig, { dryRun: true });
    }
  }).catch(error => {
    console.error('Error loading config:', error);
    process.exit(1);
  });
} 