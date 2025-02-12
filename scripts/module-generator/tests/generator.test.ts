import { generateModule } from '../src/generate-v2';
import { TestUtils } from './test-utils';
import path from 'path';
import fs from 'fs/promises';
import { describe, it, expect, beforeEach } from '@jest/globals';
import Handlebars from 'handlebars';
import { VEHICLE_MODULE } from '../configs/production-modules';
import { TEST_MODULE, PARENT_CHILD_MODULE, MANY_TO_MANY_MODULE, FIELD_TYPES_MODULE } from '../configs/test-modules';

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
        'src/api/admin/[module.plural]/[model.plural]/validators.hbs'
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
      it('should generate files in correct locations', async () => {
        await generateModule(TEST_MODULE, { testMode: true });
        
        const expectedFiles = [
          'src/modules/tests/models/test-model.ts',
          'src/modules/tests/service.ts',
          'src/modules/tests/index.ts',
          'src/api/admin/tests/models/route.ts',
          'src/api/admin/tests/models/[id]/route.ts',
          'src/api/admin/tests/models/validators.ts'
        ];

        for (const file of expectedFiles) {
          const filePath = path.join('.test-output', file);
          expect(await TestUtils.fileExists(filePath)).toBe(true);
        }
      });
    });

    describe('Model Generation', () => {
      it('should generate fields with chainable arguments', async () => {
        await generateModule(TEST_MODULE, { testMode: true });
        
        const modelPath = path.join('.test-output', 'src/modules/tests/models/test-model.ts');
        const content = await TestUtils.readGeneratedFile(modelPath);
        
        // Check chainables are properly assembled
        expect(content).toContain('required_field: model.text().unique().index()');
        expect(content).toContain('nullable_field: model.text().nullable()');
        expect(content).toContain('complex_field: model.text().unique().index("asc")');
      });

      it('should handle relation options correctly', async () => {
        await generateModule(TEST_MODULE, { testMode: true });
        
        const modelPath = path.join('.test-output', 'src/modules/tests/models/test-model.ts');
        const content = await TestUtils.readGeneratedFile(modelPath);
        
        // Check relation options are properly assembled
        expect(content).toMatch(/parent:\s*model\.belongsTo\(\s*\(\)\s*=>\s*TestParent,\s*{\s*mappedBy:\s*"children",?\s*}\)/);
        expect(content).toMatch(/children:\s*model\.hasMany\(\s*\(\)\s*=>\s*TestChild,\s*{\s*mappedBy:\s*"parent",?\s*}\)/);
      });

      it('should handle many-to-many relationships with through table', async () => {
        await generateModule(MANY_TO_MANY_MODULE, { testMode: true });
        
        const modelPath = path.join('.test-output', 'src/modules/many-to-many-test/models/test-left.ts');
        const content = await TestUtils.readGeneratedFile(modelPath);
        
        // Check many-to-many template output with through table
        expect(content).toMatch(/rights:\s*model\.manyToMany\(\s*\(\)\s*=>\s*TestRight,\s*{[^}]*through:\s*"test_left_right"[^}]*}/);
        expect(content).toMatch(/rights:\s*model\.manyToMany\(\s*\(\)\s*=>\s*TestRight,\s*{[^}]*mappedBy:\s*"lefts"[^}]*}/);
      });
    });

    describe('Route Generation', () => {
      it('should handle parent-child model relationships', async () => {
        await generateModule(PARENT_CHILD_MODULE, { testMode: true });
        
        // Check child route is under parent prefix
        const childRoutePath = path.join('.test-output', 'src/api/admin/parent-child-test/parents/children/route.ts');
        expect(await TestUtils.fileExists(childRoutePath)).toBe(true);
      });

      it('should generate validator with correct field definitions', async () => {
        await generateModule(TEST_MODULE, { testMode: true });
        
        const validatorsPath = path.join('.test-output', 'src/api/admin/tests/models/validators.ts');
        const content = await TestUtils.readGeneratedFile(validatorsPath);
        
        // Check field interpolation from our templates
        expect(content).toContain('required_field: z.string()');
        expect(content).toContain('parent_id: z.string()');
        expect(content).toContain('export type AdminCreateTestModelReq');
      });
    });

    describe('Import Generation', () => {
      it('should generate correct component imports', async () => {
        await generateModule(TEST_MODULE, { testMode: true });
        const pageContent = await fs.readFile(
          path.join('.test-output', 'src/admin/routes/tests/models/page.tsx'),
          'utf-8'
        );
        
        expect(pageContent).toMatch(/import\s*{\s*TestModelCreate\s*}\s*from\s*["']\.\/create\/test-model-create["']/);
        expect(pageContent).toMatch(/import\s*{\s*TestModelEdit\s*}\s*from\s*["']\.\/edit\/test-model-edit["']/);
      });

      it('should generate correct model imports', async () => {
        await generateModule(TEST_MODULE, { testMode: true });
        const pageContent = await fs.readFile(
          path.join('.test-output', 'src/admin/routes/tests/models/page.tsx'),
          'utf-8'
        );
        
        expect(pageContent).toMatch(/import\s*{\s*TestModel\s*}\s*from\s*["']\.\.\/\.\.\/\.\.\/types["']/);
      });

      it('should generate correct validator imports', async () => {
        await generateModule(TEST_MODULE, { testMode: true });
        const routeContent = await fs.readFile(
          path.join('.test-output', 'src/api/admin/tests/models/[id]/route.ts'),
          'utf-8'
        );
        
        expect(routeContent).toMatch(/import\s*{\s*AdminUpdateTestModelReq\s*}\s*from\s*["']\.\.\/validators["']/);
      });

      it('should handle parent-child component imports', async () => {
        await generateModule(PARENT_CHILD_MODULE, { testMode: true });
        const childPageContent = await fs.readFile(
          path.join('.test-output', 'src/admin/routes/parent-child-test/parents/children/page.tsx'),
          'utf-8'
        );
        
        expect(childPageContent).toMatch(/import\s*{\s*TestChildCreate\s*}\s*from\s*["']\.\/create\/test-child-create["']/);
        expect(childPageContent).toMatch(/import\s*{\s*TestChildEdit\s*}\s*from\s*["']\.\/edit\/test-child-edit["']/);
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
          templatePath: expect.any(String),
          model: expect.any(String),
          module: expect.any(String)
        });
      });

      // Verify all expected files are included for each model
      TEST_MODULE.models.forEach(model => {
        const modelFiles = changes.filter(c => c.model === model.name);
        expect(modelFiles).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ path: expect.stringContaining(`/models/${model.name}.ts`) }),
            expect.objectContaining({ path: expect.stringContaining(`/${model.plural}/route.ts`) }),
            expect.objectContaining({ path: expect.stringContaining(`/${model.plural}/[id]/route.ts`) }),
            expect.objectContaining({ path: expect.stringContaining(`/${model.plural}/validators.ts`) }),
            expect.objectContaining({ path: expect.stringContaining(`/${model.plural}/page.tsx`) }),
            expect.objectContaining({ path: expect.stringContaining(`/${model.plural}/create/${model.name}-create.tsx`) }),
            expect.objectContaining({ path: expect.stringContaining(`/${model.plural}/edit/${model.name}-edit.tsx`) })
          ])
        );
      });

      // Verify service and index files
      expect(changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: expect.stringContaining('/service.ts') }),
          expect.objectContaining({ path: expect.stringContaining('/index.ts') })
        ])
      );
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