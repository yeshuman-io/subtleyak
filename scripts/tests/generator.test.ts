import { generateModule } from '../generate-v2';
import { TestUtils } from './test-utils';
import path from 'path';
import fs from 'fs/promises';
import type { ModuleConfig } from '../generate-v2';
import { describe, it, expect, beforeEach, beforeAll } from '@jest/globals';
import Handlebars from 'handlebars';

// Register Handlebars helpers before tests
beforeAll(() => {
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
});

describe('Module Generator', () => {
  const TEST_CONFIG: ModuleConfig = {
    moduleName: 'tests',
    singular: 'test',
    plural: 'tests',
    models: [
      {
        name: 'test-model',
        singular: 'test',
        plural: 'tests',
        fields: [
          {
            name: 'title',
            type: 'string',
            required: true
          },
          {
            name: 'description',
            type: 'string',
            required: false
          },
          {
            name: 'active',
            type: 'boolean',
            required: true
          },
          {
            name: 'count',
            type: 'number',
            required: false
          }
        ]
      }
    ]
  };

  beforeEach(async () => {
    // Clean test output directory
    await TestUtils.cleanTestDir();
  });

  describe('Template Validation', () => {
    it('should validate all template files exist', async () => {
      const templateDir = path.join(process.cwd(), 'scripts/templates');
      const requiredTemplates = [
        'src/modules/[module.plural]/models/[model.name].hbs',
        'src/modules/[module.plural]/service.hbs',
        'src/modules/[module.plural]/index.hbs'
      ];

      for (const template of requiredTemplates) {
        const templatePath = path.join(templateDir, template);
        const exists = await TestUtils.fileExists(templatePath);
        expect(exists).toBe(true);
      }
    });

    it('should validate template syntax', async () => {
      const templateDir = path.join(process.cwd(), 'scripts/templates');
      const templates = await TestUtils.getTemplateFiles(templateDir);

      for (const templatePath of templates) {
        const content = await fs.readFile(templatePath, 'utf-8');
        expect(() => {
          Handlebars.compile(content);
        }).not.toThrow();
      }
    });

    it('should validate helper functions', () => {
      const helpers = Handlebars.helpers;
      expect(helpers.toPascalCase).toBeDefined();
      expect(helpers.toSnakeCase).toBeDefined();

      // Test helper functions
      expect(helpers.toPascalCase('test-model')).toBe('TestModel');
      expect(helpers.toSnakeCase('test-model')).toBe('test_model');
    });
  });

  describe('File Generation', () => {
    it('should generate model file in correct location', async () => {
      await generateModule(TEST_CONFIG, { testMode: true });
      
      const expectedPath = path.join('.test-output', 'src/modules/tests/models/test-model.ts');
      expect(await TestUtils.fileExists(expectedPath)).toBe(true);
    });

    it('should generate model file with correct content', async () => {
      await generateModule(TEST_CONFIG, { testMode: true });
      
      const modelPath = path.join('.test-output', 'src/modules/tests/models/test-model.ts');
      const content = await TestUtils.readGeneratedFile(modelPath);
      
      console.log('Generated content:', content);
      
      // Check basic structure
      expect(content).toContain('const TestModel = model.define');
      expect(content).toContain('test_model');
      
      // Check required field
      expect(content).toContain('title: model.string()');
      
      // Check optional field
      expect(content).toContain('description: model.string().optional()');
      
      // Check boolean field
      expect(content).toContain('active: model.boolean()');
      
      // Check number field
      expect(content).toContain('count: model.number().optional()');
      
      // No need to check timestamps as they're added by Medusa automatically
    });

    it('should generate valid TypeScript files', async () => {
      await generateModule(TEST_CONFIG, { testMode: true });
      const files = await TestUtils.getGeneratedFiles('.test-output');
      
      for (const file of files) {
        const content = await TestUtils.readGeneratedFile(path.join('.test-output', file));
        expect(content).toMatch(/^import .* from/m); // Has imports
        expect(content).not.toContain('undefined');  // No undefined values
        expect(content).toMatch(/export (default |type )/m); // Has exports
      }
    });
  });

  describe('Service Generation', () => {
    it('should generate service file with correct content', async () => {
      await generateModule(TEST_CONFIG, { testMode: true });
      
      const servicePath = path.join('.test-output', 'src/modules/tests/service.ts');
      const content = await TestUtils.readGeneratedFile(servicePath);
      
      // Check service structure
      expect(content).toContain('import { MedusaService } from "@medusajs/framework/utils"');
      expect(content).toContain('import TestModel from "./models/test-model"');
      expect(content).toContain('class TestsService extends MedusaService({');
      expect(content).toContain('TestModel');
      expect(content).toContain('export default TestsService');
    });
  });

  describe('Module Index', () => {
    it('should generate module index file with correct content', async () => {
      await generateModule(TEST_CONFIG, { testMode: true });
      
      const indexPath = path.join('.test-output', 'src/modules/tests/index.ts');
      const content = await TestUtils.readGeneratedFile(indexPath);
      
      // Check module index structure
      expect(content).toContain('import TestsService from "./service"');
      expect(content).toContain('import { Module } from "@medusajs/framework/utils"');
      expect(content).toContain('export const TESTS = "tests"');
      expect(content).toContain('export default Module(TESTS, {');
      expect(content).toContain('service: TestsService');
    });
  });
}); 