import { generateModule, processTemplate, generateModules } from '../src/generate-v2';
import { TestUtils } from './test-utils';
import path from 'path';
import fs from 'fs/promises';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import Handlebars from 'handlebars';
import { TEST_MODULE, RELATIONSHIP_MODULE, MANY_TO_MANY_MODULE, FIELD_TYPES_MODULE } from '../configs/test-modules';
import { parse, traverse } from '@babel/core';

describe('Module Generator', () => {
  beforeEach(async () => {
    await TestUtils.cleanTestDir();
  });

  describe('Template System', () => {
    it('should validate required template files exist', async () => {
      const templateDir = path.join(process.cwd(), 'scripts/module-generator/templates');
      const requiredTemplates = [
        'src/modules/[module.plural]/models/[model.name].hbs',
        'src/modules/[module.plural]/service.hbs',
        'src/modules/[module.plural]/index.hbs',
        'src/api/admin/[module.plural]/[model.plural]/route.hbs',
        'src/api/admin/[module.plural]/[model.plural]/[id]/route.hbs',
        'src/api/admin/[module.plural]/[model.plural]/validators.hbs',
        'src/admin/routes/[module.plural]/[model.plural]/page.hbs',
        'src/admin/routes/[module.plural]/[model.plural]/create/[model.name]-create.hbs',
        'src/admin/routes/[module.plural]/[model.plural]/edit/[model.name]-edit.hbs'
      ];

      for (const template of requiredTemplates) {
        const templatePath = path.join(templateDir, template);
        const exists = await TestUtils.fileExists(templatePath);
        if (!exists) {
          console.log(`Missing template: ${templatePath}`);
        }
        expect(exists).toBe(true);
      }
    });

    it('should validate template syntax', async () => {
      const templateDir = path.join(process.cwd(), 'scripts/module-generator/templates');
      const templates = await TestUtils.getTemplateFiles(templateDir);

      for (const templatePath of templates) {
        const content = await fs.readFile(templatePath, 'utf-8');
        expect(() => {
          Handlebars.compile(content);
        }).not.toThrow();
      }
    });

    describe('Handlebars Helpers', () => {
      describe('module/model helpers', () => {
        it('should identify module models correctly', () => {
          const template = Handlebars.compile('{{isModuleModel model module}}');
          expect(template({ 
            model: { name: 'tests' }, 
            module: { moduleName: 'tests' } 
          })).toBe('true');
          expect(template({ 
            model: { name: 'test-model' }, 
            module: { moduleName: 'tests' } 
          })).toBe('');
        });

        it('should generate correct route paths', () => {
          const template = Handlebars.compile('{{getRoutePath model module}}');
          // Module model route
          expect(template({ 
            model: { name: 'tests', plural: 'tests' }, 
            module: { moduleName: 'tests', plural: 'tests' } 
          })).toBe('tests');
          // Regular model route
          expect(template({ 
            model: { name: 'test-model', plural: 'models' }, 
            module: { moduleName: 'tests', plural: 'tests' } 
          })).toBe('tests/models');
        });

        it('should generate correct import paths', () => {
          const template = Handlebars.compile('{{getModelImportPath model module}}');
          // Module model import
          expect(template({ 
            model: { name: 'tests' }, 
            module: { moduleName: 'tests' } 
          })).toBe('./');
          // Regular model import
          expect(template({ 
            model: { name: 'test-model' }, 
            module: { moduleName: 'tests' } 
          })).toBe('./models/test-model');
        });
      });

      describe('field processing', () => {
        it('should handle required fields', () => {
          const template = Handlebars.compile('{{processField field}}');
          expect(template({ 
            field: { name: 'name', type: 'string', required: true }
          })).toBe('name: model.text().required()');
        });

        it('should handle optional fields', () => {
          const template = Handlebars.compile('{{processField field}}');
          expect(template({ 
            field: { name: 'description', type: 'string' }
          })).toBe('description: model.text()');
        });
      });

      describe('propAccess helper', () => {
        it('should handle basic property access', () => {
          const template = Handlebars.compile('{{propAccess "obj" "prop"}}');
          expect(template({})).toBe('obj.prop');
        });

        it('should handle template literal mode', () => {
          const template = Handlebars.compile('{{propAccess "obj" "prop" templateLiteral=true}}');
          expect(template({})).toBe('${obj.prop}');
        });
      });

      describe('case conversion helpers', () => {
        it('should convert to PascalCase', () => {
          const template = Handlebars.compile('{{toPascalCase "hello-world"}}');
          expect(template({})).toBe('HelloWorld');
        });

        it('should convert to snake_case', () => {
          const template = Handlebars.compile('{{toSnakeCase "helloWorld"}}');
          expect(template({})).toBe('hello_world');
        });

        it('should convert to kebab-case', () => {
          const template = Handlebars.compile('{{toKebabCase "helloWorld"}}');
          expect(template({})).toBe('hello-world');
        });

        it('should convert to camelCase', () => {
          const template = Handlebars.compile('{{toCamelCase "hello-world"}}');
          expect(template({})).toBe('helloWorld');
        });
      });

      describe('JSX helpers', () => {
        it('should handle jsx-if helper', () => {
          const template = Handlebars.compile('{{#jsx-if "condition"}}content{{/jsx-if}}');
          expect(template({})).toBe('{condition && (content)}');
        });

        it('should handle jsx-expr helper', () => {
          const template = Handlebars.compile('{{jsx-expr "value"}}');
          expect(template({})).toBe('{value}');
        });

        it('should handle jsx-ternary helper', () => {
          const template = Handlebars.compile('{{jsx-ternary "condition" "yes" "no"}}');
          expect(template({})).toBe('{condition ? yes : no}');
        });
      });
    });

    describe('Middleware Templates', () => {
      it('should validate middleware template files exist', async () => {
        const templateDir = path.join(process.cwd(), 'scripts/module-generator/templates');
        const requiredTemplates = [
          'src/api/admin/[module.plural]/middlewares.hbs',
          'src/api/admin/[module.plural]/[model.plural]/middlewares.hbs',
          'src/api/middlewares.hbs'
        ];

        for (const template of requiredTemplates) {
          const templatePath = path.join(templateDir, template);
          const exists = await TestUtils.fileExists(templatePath);
          if (!exists) {
            console.log(`Missing template: ${templatePath}`);
          }
          expect(exists).toBe(true);
        }
      });

      it('should handle field defaults in query transform', () => {
        const template = Handlebars.compile(`
          {{#each fields}}
          "{{name}}"{{#if relation}}, "{{name}}.*"{{/if}}{{#unless @last}},{{/unless}}
          {{/each}}
        `);
        
        const result = template({
          fields: [
            { name: 'name', type: 'string' },
            { name: 'models', type: 'string', relation: { type: 'hasMany' }}
          ]
        });
        
        const defaults = result.trim().split(',').map(s => s.trim());
        // Verify all required fields are present
        expect(defaults).toContain('"name"');
        expect(defaults.some(d => d.includes('"models"'))).toBe(true);
        expect(defaults.some(d => d.includes('"models.*"'))).toBe(true);
      });

      it('should handle parent/child model relationships', () => {
        const template = Handlebars.compile(`
          {{#if parent}}
          {{toSnakeCase parent.model}}_id: z.string().optional()
          {{/if}}
        `);
        
        // Test parent model (no extension)
        const parentResult = template({});
        expect(parentResult.trim()).toBe('');
        
        // Test child model (with extension)
        const childResult = template({
          parent: { model: 'Wiper' }
        });
        expect(childResult.trim()).toBe('wiper_id: z.string().optional()');
      });
    });
  });

  describe('Module Generation', () => {
    describe('File Structure', () => {
      it('should generate model files in correct locations', async () => {
        const changes = await generateModule(TEST_MODULE, { testMode: true });
        
        const expectedFiles = [
          'src/modules/tests/models/test-model.ts',
          'src/api/admin/tests/models/route.ts',
          'src/api/admin/tests/models/[id]/route.ts',
          'src/api/admin/tests/models/validators.ts',
          'src/admin/routes/tests/models/page.tsx',
          'src/admin/routes/tests/models/create/test-model-create.tsx',
          'src/admin/routes/tests/models/edit/test-model-edit.tsx'
        ];

        for (const file of expectedFiles) {
          const filePath = path.join('.test-output', file);
          expect(await TestUtils.fileExists(filePath)).toBe(true);
        }
      });
    });

    describe('Field Types', () => {
      it('should handle all field types correctly', async () => {
        await generateModule(FIELD_TYPES_MODULE, { testMode: true });
        
        const modelPath = path.join('.test-output', 'src/modules/field-types/models/all-types.ts');
        const content = await TestUtils.readGeneratedFile(modelPath);
        
        expect(content).toMatch(/string_field:\s*model\.text\(\)\.required\(\)/);
        expect(content).toMatch(/number_field:\s*model\.number\(\)\.required\(\)/);
        expect(content).toMatch(/boolean_field:\s*model\.boolean\(\)/);
        expect(content).toMatch(/date_field:\s*model\.date\(\)/);
      });
    });

    describe('Middleware Generation', () => {
      it('should generate all required middleware files', async () => {
        const changes = await generateModules([TEST_MODULE], { testMode: true });
        
        const expectedMiddlewareFiles = [
          'src/api/middlewares.ts',
          'src/api/admin/tests/middlewares.ts',
          'src/api/admin/tests/models/middlewares.ts'
        ];

        for (const file of expectedMiddlewareFiles) {
          const filePath = path.join('.test-output', file);
          expect(await TestUtils.fileExists(filePath)).toBe(true);
        }
      });
    });
  });

  describe('Dry Run', () => {
    beforeEach(async () => {
      // For dry run tests, ensure directory doesn't exist
      try {
        await fs.rm(TestUtils.TEST_OUTPUT_DIR, { recursive: true, force: true });
      } catch (error) {
        // Ignore if directory doesn't exist
      }
    });

    it('should not create files during dry run', async () => {
      const testDir = path.join(process.cwd(), '.test-output');
      await generateModule(TEST_MODULE, { testMode: true, dryRun: true });
      
      // Verify test directory wasn't created
      expect(await TestUtils.fileExists(testDir)).toBe(false);
    });

    it('should return correct FileChange array', async () => {
      const changes = await generateModule(TEST_MODULE, { testMode: true, dryRun: true });
      
      // Verify structure of changes
      expect(changes.length).toBeGreaterThan(0);
      changes.forEach(change => {
        expect(change).toMatchObject({
          path: expect.any(String),
          type: 'create',
          templatePath: expect.any(String)
        });
      });

      // Verify module model files are included
      const moduleFiles = changes.filter(c => c.model?.name === TEST_MODULE.moduleName);
      expect(moduleFiles).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: expect.stringContaining(`/tests.ts`) }),
          expect.objectContaining({ path: expect.stringContaining(`/tests/route.ts`) }),
          expect.objectContaining({ path: expect.stringContaining(`/tests/[id]/route.ts`) }),
          expect.objectContaining({ path: expect.stringContaining(`/tests/validators.ts`) })
        ])
      );

      // Verify model files are included
      TEST_MODULE.models.forEach(model => {
        const modelFiles = changes.filter(c => c.model?.name === model.name);
        expect(modelFiles).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ path: expect.stringContaining(`/models/${model.name}.ts`) }),
            expect.objectContaining({ path: expect.stringContaining(`/${model.plural}/route.ts`) }),
            expect.objectContaining({ path: expect.stringContaining(`/${model.plural}/[id]/route.ts`) }),
            expect.objectContaining({ path: expect.stringContaining(`/${model.plural}/validators.ts`) })
          ])
        );
      });
    });

    it('should capture all potential file changes', async () => {
      // Run both dry-run and actual generation
      const dryRunChanges = await generateModule(TEST_MODULE, { testMode: true, dryRun: true });
      
      // Clean up and run actual generation
      await TestUtils.cleanTestDir();
      await generateModule(TEST_MODULE, { testMode: true });

      // Get actual generated files
      const testDir = path.join(process.cwd(), '.test-output');
      const actualFiles = await TestUtils.getAllFiles(testDir);

      // Compare counts
      expect(dryRunChanges.length).toBe(actualFiles.length);

      // Normalize and sort paths for comparison
      const dryRunPaths = dryRunChanges
        .map(c => path.normalize(c.path))
        .sort();
      const actualPaths = actualFiles
        .map(f => path.normalize(path.join('.test-output', f)))
        .sort();
      
      // Compare full arrays
      expect(dryRunPaths).toEqual(actualPaths);
    });

    it('should work in both test and production modes', async () => {
      // Test mode
      const testChanges = await generateModule(TEST_MODULE, { testMode: true, dryRun: true });
      expect(testChanges.every(c => c.path.includes('.test-output'))).toBe(true);

      // Production mode
      const prodChanges = await generateModule(TEST_MODULE, { testMode: false, dryRun: true });
      expect(prodChanges.every(c => !c.path.includes('.test-output'))).toBe(true);
      expect(prodChanges.every(c => c.path.startsWith('src/'))).toBe(true);
    });
  });

  describe('Middleware Template Data Injection', () => {
    it('should pass correct data to middleware templates', async () => {
      const changes = await generateModules([TEST_MODULE], { testMode: true, dryRun: true });
      
      // Main middlewares template should receive modules array
      const mainMiddlewaresChange = changes.find(c => c.path.endsWith('src/api/middlewares.ts'));
      expect(mainMiddlewaresChange?.modules).toBeDefined();
      expect(mainMiddlewaresChange?.modules?.[0].moduleName).toBe(TEST_MODULE.moduleName);
      
      // Module middlewares template should receive module and its model
      const moduleMiddlewaresChange = changes.find(c => 
        c.path.includes(`/admin/${TEST_MODULE.plural}/middlewares.ts`)
      );
      expect(moduleMiddlewaresChange?.module).toBe(TEST_MODULE);
      
      // Model middlewares template should receive module and model
      const modelMiddlewaresChange = changes.find(c => 
        c.path.includes(`/admin/${TEST_MODULE.plural}/${TEST_MODULE.models[0].plural}/middlewares.ts`)
      );
      expect(modelMiddlewaresChange?.module).toBe(TEST_MODULE);
      expect(modelMiddlewaresChange?.model).toBe(TEST_MODULE.models[0]);
    });

    it('should pass multiple modules data to root middleware template', async () => {
      // Generate changes for multiple modules
      const changes = await generateModules([TEST_MODULE, RELATIONSHIP_MODULE], { 
        testMode: true, 
        dryRun: true 
      });
      
      // Get the main middleware changes
      const mainMiddlewaresChange = changes.find(c => c.path.endsWith('src/api/middlewares.ts'));
      
      // Verify modules array contains multiple modules
      expect(mainMiddlewaresChange?.modules).toBeDefined();
      expect(mainMiddlewaresChange?.modules?.length).toBe(2);
      
      // Verify specific modules are present
      expect(mainMiddlewaresChange?.modules).toEqual(
          expect.arrayContaining([
              expect.objectContaining({ 
                moduleName: TEST_MODULE.moduleName,
                plural: TEST_MODULE.plural,
                models: expect.arrayContaining(
                  TEST_MODULE.models.map(m => ({
                    name: m.name,
                    plural: m.plural
                  }))
                )
              }),
              expect.objectContaining({ 
                moduleName: RELATIONSHIP_MODULE.moduleName,
                plural: RELATIONSHIP_MODULE.plural,
                models: expect.arrayContaining(
                  RELATIONSHIP_MODULE.models.map(m => ({
                    name: m.name,
                    plural: m.plural
                  }))
                )
              })
          ])
      );
    });
  });
}); 