import { generateModule } from '../src/generate-v2';
import { TestUtils } from './test-utils';
import path from 'path';
import fs from 'fs/promises';
import { describe, it, expect, beforeEach } from '@jest/globals';
import Handlebars from 'handlebars';
import { TEST_MODULE, RELATIONSHIP_MODULE, MANY_TO_MANY_MODULE, FIELD_TYPES_MODULE } from '../configs/test-modules';

describe('Module Generator', () => {
  beforeEach(async () => {
    await TestUtils.cleanTestDir();
  });

  describe('Template System', () => {
    it('should validate required template files exist', async () => {
      const templateDir = path.join(process.cwd(), 'scripts/module-generator/templates');
      const requiredTemplates = [
        'src/modules/[module.plural]/[module.modelName].hbs',
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
        expect(await TestUtils.fileExists(templatePath)).toBe(true);
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
            module: { modelName: 'tests' } 
          })).toBe('true');
          expect(template({ 
            model: { name: 'test-model' }, 
            module: { modelName: 'tests' } 
          })).toBe('');
        });

        it('should generate correct route paths', () => {
          const template = Handlebars.compile('{{getRoutePath model module}}');
          // Module model route
          expect(template({ 
            model: { name: 'tests', plural: 'tests' }, 
            module: { modelName: 'tests', plural: 'tests' } 
          })).toBe('tests');
          // Regular model route
          expect(template({ 
            model: { name: 'test-model', plural: 'models' }, 
            module: { modelName: 'tests', plural: 'tests' } 
          })).toBe('tests/models');
        });

        it('should generate correct import paths', () => {
          const template = Handlebars.compile('{{getModelImportPath model module}}');
          // Module model import
          expect(template({ 
            model: { name: 'tests' }, 
            module: { modelName: 'tests' } 
          })).toBe('./');
          // Regular model import
          expect(template({ 
            model: { name: 'test-model' }, 
            module: { modelName: 'tests' } 
          })).toBe('./models/test-model');
        });
      });

      describe('field processing', () => {
        it('should handle required fields', () => {
          const template = Handlebars.compile('{{processField field}}');
          expect(template({ 
            field: { name: 'name', type: 'string', required: true }
          })).toBe('name: model.string().required()');
        });

        it('should handle optional fields', () => {
          const template = Handlebars.compile('{{processField field}}');
          expect(template({ 
            field: { name: 'description', type: 'string' }
          })).toBe('description: model.string()');
        });

        it('should handle relationships with inverse', () => {
          const template = Handlebars.compile('{{processField field}}');
          expect(template({ 
            field: { 
              name: 'models', 
              type: 'string',
              relation: {
                type: 'hasMany',
                model: 'TestModel',
                inverse: 'test'
              }
            }
          })).toMatch(/models: model.hasMany\(\(\) => TestModel, {\s*inverse: "test"\s*}\)/);
        });

        it('should handle many-to-many relationships', () => {
          const template = Handlebars.compile('{{processField field}}');
          expect(template({ 
            field: { 
              name: 'rights', 
              type: 'string',
              relation: {
                type: 'manyToMany',
                model: 'Right',
                through: 'left_right',
                inverse: 'lefts'
              }
            }
          })).toMatch(/rights: model.manyToMany\(\(\) => Right, {\s*inverse: "lefts",\s*through: "left_right"\s*}\)/);
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
  });

  describe('Module Generation', () => {
    describe('File Structure', () => {
      it('should generate module model in correct location', async () => {
        await generateModule(TEST_MODULE, { testMode: true });
        
        const moduleModelPath = path.join('.test-output', 'src/modules/tests/tests.ts');
        expect(await TestUtils.fileExists(moduleModelPath)).toBe(true);
      });

      it('should generate model files in correct locations', async () => {
        await generateModule(TEST_MODULE, { testMode: true });
        
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

    describe('Relationship Generation', () => {
      it('should handle one-to-many relationships', async () => {
        await generateModule(RELATIONSHIP_MODULE, { testMode: true });
        
        const oneModelPath = path.join('.test-output', 'src/modules/relationships/models/one-to-many.ts');
        const manyModelPath = path.join('.test-output', 'src/modules/relationships/models/many-to-one.ts');
        
        const oneContent = await TestUtils.readGeneratedFile(oneModelPath);
        const manyContent = await TestUtils.readGeneratedFile(manyModelPath);
        
        expect(oneContent).toMatch(/manys:\s*model\.hasMany\(\s*\(\)\s*=>\s*Many,\s*{\s*mappedBy:\s*"one"\s*}\)/);
        expect(manyContent).toMatch(/one:\s*model\.belongsTo\(\s*\(\)\s*=>\s*One,\s*{\s*mappedBy:\s*"manys"\s*}\)/);
      });

      it('should handle many-to-many relationships', async () => {
        await generateModule(MANY_TO_MANY_MODULE, { testMode: true });
        
        const leftModelPath = path.join('.test-output', 'src/modules/many-to-manys/models/left.ts');
        const rightModelPath = path.join('.test-output', 'src/modules/many-to-manys/models/right.ts');
        
        const leftContent = await TestUtils.readGeneratedFile(leftModelPath);
        const rightContent = await TestUtils.readGeneratedFile(rightModelPath);
        
        expect(leftContent).toMatch(/rights:\s*model\.manyToMany\(\s*\(\)\s*=>\s*Right,\s*{\s*mappedBy:\s*"lefts",\s*through:\s*"left_right"\s*}\)/);
        expect(rightContent).toMatch(/lefts:\s*model\.manyToMany\(\s*\(\)\s*=>\s*Left,\s*{\s*mappedBy:\s*"rights",\s*through:\s*"left_right"\s*}\)/);
      });
    });

    describe('Field Types', () => {
      it('should handle all field types correctly', async () => {
        await generateModule(FIELD_TYPES_MODULE, { testMode: true });
        
        const modelPath = path.join('.test-output', 'src/modules/field-types/models/all-types.ts');
        const content = await TestUtils.readGeneratedFile(modelPath);
        
        expect(content).toContain('string_field: model.string().required()');
        expect(content).toContain('number_field: model.number().required()');
        expect(content).toContain('boolean_field: model.boolean()');
        expect(content).toContain('date_field: model.date()');
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
      const moduleFiles = changes.filter(c => c.model === TEST_MODULE.modelName);
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
        const modelFiles = changes.filter(c => c.model === model.name);
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
}); 