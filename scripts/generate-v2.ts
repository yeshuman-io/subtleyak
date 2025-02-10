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
};

export type ModelConfig = {
  name: string;
  singular: string;
  plural: string;
  fields: ModelField[];
};

export type ModuleConfig = {
  moduleName: string;
  singular: string;
  plural: string;
  models: ModelConfig[];
};

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

// Helper to process field definitions
function processFields(fields: ModelField[]): string {
  if (fields.length === 0) return '';
  
  return fields.map(field => ({
    name: field.name,
    type: field.type,
    required: field.required
  })).map(field => 
    `${field.name}: ${field.required ? `model.${field.type}()` : `model.${field.type}().optional()`}`
  ).join(',\n  ');
}

// Process template using Handlebars
async function processTemplate(templatePath: string, data: Record<string, any>): Promise<string> {
  const template = await fs.readFile(templatePath, 'utf-8');
  
  console.log('Processing template:', templatePath);
  console.log('With data:', JSON.stringify(data, null, 2));
  
  const compiledTemplate = Handlebars.compile(template);
  const content = compiledTemplate(data);
  
  console.log('Final content:', content);
  return content;
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

    // Process template data
    const templateData = {
      model: {
        name: model.name,
        fields: model.fields
      }
    };

    await generateFile(modelTemplatePath, modelOutputPath, templateData);
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
if (import.meta.url === `file://${process.argv[1]}`) {
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