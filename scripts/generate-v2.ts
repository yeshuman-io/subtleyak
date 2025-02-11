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

// Helper to process field definitions
function processField(field: ModelField): string {
  if (field.relation) {
    const relationConfig: string[] = [];
    if (field.relation.mappedBy) {
      relationConfig.push(`mappedBy: "${field.relation.mappedBy}"`);
    }
    if (field.relation.through) {
      relationConfig.push(`through: "${field.relation.through}"`);
    }
    
    return `${field.name}: model.${field.relation.type}(() => ${field.relation.model}, {
      ${relationConfig.join(',\n      ')}
    })`;
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
  return fieldDef;
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
  return str.replace(/-/g, '_').toLowerCase();
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

Handlebars.registerHelper('eq', function(a: any, b: any) {
  return a === b;
});

Handlebars.registerHelper('type', function(value: string, type: string) {
  return value === type;
});

// Helper to process field definitions
Handlebars.registerHelper('processField', processField);

// Process template using Handlebars
async function processTemplate(templatePath: string, data: Record<string, any>): Promise<string> {
  const template = await fs.readFile(templatePath, 'utf-8');
  const compiledTemplate = Handlebars.compile(template);
  return compiledTemplate(data);
}

// Update formatOutput function
async function formatOutput(content: string): Promise<string> {
  const config = await resolveConfig(process.cwd());
  return format(content, {
    ...config,
    parser: 'typescript',
    trailingComma: 'all',
  });
}

// Modify generateFile function
async function generateFile(
  templatePath: string,
  outputPath: string,
  data: Record<string, any>
): Promise<void> {
  const content = await processTemplate(templatePath, data);
  const formattedContent = await formatOutput(content);
  
  // Create directory if it doesn't exist
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  
  // Write formatted file
  await fs.writeFile(outputPath, formattedContent, 'utf-8');
  console.log(`Generated: ${outputPath}`);
}

// Main generation function
export async function generateModule(config: ModuleConfig, options: { testMode?: boolean } = {}): Promise<void> {
  const outputDir = options.testMode ? 
    path.join(process.cwd(), '.test-output') : 
    process.cwd();

  const templatesDir = path.join(process.cwd(), 'scripts/templates');

  // Generate model files
  for (const model of config.models) {
    // Model file generation
    const modelTemplatePath = path.join(
      templatesDir,
      'src/modules/[module.plural]/models/[model.name].hbs'
    );

    const modelOutputPath = path.join(
      outputDir,
      'src/modules',
      config.plural,
      'models',
      `${model.name}.ts`
    );

    // Get unique relations for imports
    const relations = model.fields
      .filter(f => f.relation)
      .map(f => ({
        model: f.relation!.model,
        path: `./${f.relation!.model.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`
      }))
      .filter((rel, index, self) => 
        index === self.findIndex(r => r.model === rel.model)
      );

    // Process template data
    const templateData = {
      model: {
        name: model.name,
        fields: model.fields,
        relations
      }
    };

    await generateFile(modelTemplatePath, modelOutputPath, templateData);

    // Determine route path based on parent/child relationship
    const routeBasePath = model.parent ? 
      path.join(config.plural, ...model.parent.routePrefix.split('/')) :
      path.join(config.plural, model.plural);

    // Generate route-level validators file
    const validatorsTemplatePath = path.join(
      templatesDir,
      'src/api/admin/[module.plural]/[model.plural]/validators.hbs'
    );

    const validatorsOutputPath = path.join(
      outputDir,
      'src/api/admin',
      routeBasePath,
      'validators.ts'
    );

    const validatorsData = {
      model: {
        name: model.name,
        fields: model.fields
      }
    };

    await generateFile(validatorsTemplatePath, validatorsOutputPath, validatorsData);

    // Generate API route files
    const routeTemplatePath = path.join(
      templatesDir,
      'src/api/admin/[module.plural]/[model.plural]/route.hbs'
    );

    const routeOutputPath = path.join(
      outputDir,
      'src/api/admin',
      routeBasePath,
      'route.ts'
    );

    const routeData = {
      module: {
        plural: config.plural
      },
      model: {
        name: model.name,
        fields: model.fields,
        parent: model.parent
      }
    };

    await generateFile(routeTemplatePath, routeOutputPath, routeData);

    // Generate [id] route files
    const idRouteTemplatePath = path.join(
      templatesDir,
      'src/api/admin/[module.plural]/[model.plural]/[id]/route.hbs'
    );

    const idRouteOutputPath = path.join(
      outputDir,
      'src/api/admin',
      routeBasePath,
      '[id]',
      'route.ts'
    );

    await generateFile(idRouteTemplatePath, idRouteOutputPath, routeData);

    // Generate Admin UI files
    const adminRoutesDir = path.join(
      outputDir,
      'src/admin/routes',
      config.plural,
      model.plural
    );

    // List page
    const listPageTemplatePath = path.join(
      templatesDir,
      'src/admin/routes/[module.plural]/[model.plural]/page.hbs'
    );

    const listPageOutputPath = path.join(adminRoutesDir, 'page.tsx');

    const listPageData = {
      module: {
        name: config.moduleName,
        singular: config.singular,
        plural: config.plural
      },
      model: {
        name: model.name,
        singular: model.singular,
        plural: model.plural,
        fields: model.fields
      }
    };

    await generateFile(listPageTemplatePath, listPageOutputPath, listPageData);

    // Create form
    const createFormTemplatePath = path.join(
      templatesDir,
      'src/admin/routes/[module.plural]/[model.plural]/create/[model.name]-create.hbs'
    );

    const createFormOutputPath = path.join(
      adminRoutesDir,
      'create',
      `${model.name}-create.tsx`
    );

    await generateFile(createFormTemplatePath, createFormOutputPath, listPageData);

    // Edit form
    const editFormTemplatePath = path.join(
      templatesDir,
      'src/admin/routes/[module.plural]/[model.plural]/edit/[model.name]-edit.hbs'
    );

    const editFormOutputPath = path.join(
      adminRoutesDir,
      'edit',
      `${model.name}-edit.tsx`
    );

    await generateFile(editFormTemplatePath, editFormOutputPath, listPageData);
  }

  // Generate service file
  const serviceTemplatePath = path.join(
    templatesDir,
    'src/modules/[module.plural]/service.hbs'
  );

  const serviceOutputPath = path.join(
    outputDir,
    'src/modules',
    config.plural,
    'service.ts'
  );

  const serviceData = {
    serviceName: config.moduleName.split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(''),
    models: config.models.map(model => ({
      name: model.name,
      pascalName: model.name.split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('')
    }))
  };

  await generateFile(serviceTemplatePath, serviceOutputPath, serviceData);

  // Generate module index file
  const indexTemplatePath = path.join(
    templatesDir,
    'src/modules/[module.plural]/index.hbs'
  );

  const indexOutputPath = path.join(
    outputDir,
    'src/modules',
    config.plural,
    'index.ts'
  );

  const indexData = {
    serviceName: config.moduleName.split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(''),
    moduleConstName: config.moduleName.toUpperCase().replace(/-/g, '_'),
    moduleName: config.moduleName
  };

  await generateFile(indexTemplatePath, indexOutputPath, indexData);
}

// CLI interface
if (import.meta.url.startsWith('file:') && process.argv[1] === import.meta.url.slice(5)) {
  const args = process.argv.slice(2);
  const configPath = args[0];

  if (!configPath) {
    console.error('Please provide a config file path');
    process.exit(1);
  }

  if (!existsSync(configPath)) {
    console.error(`Config file not found: ${configPath}`);
    process.exit(1);
  }

  import(path.resolve(configPath))
    .then(({ config }) => generateModule(config))
    .then(() => console.log('Generation complete'))
    .catch(err => {
      console.error('Generation failed:', err);
      process.exit(1);
    });
} 