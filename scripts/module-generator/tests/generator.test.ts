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
}); 