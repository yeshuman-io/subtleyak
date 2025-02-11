import { describe, it, expect, beforeAll } from '@jest/globals';
import { TestUtils } from './test-utils';
import { generateModule } from '../generate-v2';
import path from 'path';
import fs from 'fs/promises';
import type { ModuleConfig } from '../generate-v2';
import Handlebars from 'handlebars';

// Register Handlebars helpers
beforeAll(async () => {
  // Register helpers
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

  Handlebars.registerHelper('toKebabCase', (str: string) => {
    if (!str) return '';
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
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

  await TestUtils.cleanTestDir();
});

// Test configuration with various field types and relations
const TEST_CONFIG: ModuleConfig = {
  moduleName: 'vehicles',
  singular: 'vehicle',
  plural: 'vehicles',
  models: [
    {
      name: 'test-model',
      singular: 'test-model',
      plural: 'test-models',
      fields: [
        {
          name: 'name',
          type: 'text',
          validation: { min: 1, required: true }
        },
        {
          name: 'code',
          type: 'text',
          chainables: [{ name: 'unique' }]
        },
        {
          name: 'make',
          type: 'text',
          relation: {
            type: 'belongsTo',
            model: 'Make',
            mappedBy: 'models'
          }
        }
      ]
    }
  ]
};

describe('Admin UI Template Generation', () => {
  describe('List Page Generation', () => {
    it('should generate list page with correct structure', async () => {
      await generateModule(TEST_CONFIG, { testMode: true });
      
      const pagePath = path.join('.test-output', 'src/admin/routes/vehicles/test-models/page.tsx');
      const content = await TestUtils.readGeneratedFile(pagePath);
      
      // Check imports
      expect(content).toContain('import { defineRouteConfig } from "@medusajs/admin-sdk"');
      expect(content).toContain('import { createDataTableColumnHelper, FocusModal, Drawer } from "@medusajs/ui"');
      expect(content).toContain('import { TestModel } from "../../../types"');
      
      // Check component structure
      expect(content).toContain('const TestModelPage = () => {');
      expect(content).toContain('const [showCreate, setShowCreate] = useState(false)');
      expect(content).toContain('const [editingTestModel, setEditingTestModel] = useState<TestModel | null>(null)');
      
      // Check DataTable setup
      expect(content).toContain('columnHelper.accessor("name"');
      expect(content).toContain('columnHelper.accessor("make.name"');
      
      // Check actions
      expect(content).toContain('<ActionMenu');
      expect(content).toContain('onClick: () => setEditingTestModel(item)');
    });

    it('should handle modal and drawer states correctly', async () => {
      await generateModule(TEST_CONFIG, { testMode: true });
      
      const pagePath = path.join('.test-output', 'src/admin/routes/vehicles/test-models/page.tsx');
      const content = await TestUtils.readGeneratedFile(pagePath);
      
      // Check create modal
      expect(content).toContain('<FocusModal open={showCreate} onOpenChange={setShowCreate}>');
      expect(content).toContain('<TestModelCreate onClose={() => setShowCreate(false)} />');
      
      // Check edit drawer
      expect(content).toContain('<Drawer open onOpenChange={() => setEditingTestModel(null)}>');
      expect(content).toContain('<TestModelEdit');
    });
  });

  describe('Create Form Generation', () => {
    it('should generate create form with correct fields', async () => {
      await generateModule(TEST_CONFIG, { testMode: true });
      
      const createPath = path.join('.test-output', 'src/admin/routes/vehicles/test-models/create/test-model-create.tsx');
      const content = await TestUtils.readGeneratedFile(createPath);
      
      // Check imports and types
      expect(content).toContain('import { PostAdminCreateTestModel } from "../../../../../api/admin/vehicles/test-models/validators"');
      expect(content).toContain('type Create{{toPascalCase model.name}}FormData = zod.infer<typeof schema>');
      
      // Check form fields
      expect(content).toContain('<InputField name="name"');
      expect(content).toContain('<SelectField name="make_id"');
      
      // Check data fetching
      expect(content).toContain('const { data: makeData } = useQuery<ListMakesRes>');
      expect(content).toContain('queryKey: ["makes"]');
    });

    it('should handle form submission correctly', async () => {
      await generateModule(TEST_CONFIG, { testMode: true });
      
      const createPath = path.join('.test-output', 'src/admin/routes/vehicles/test-models/create/test-model-create.tsx');
      const content = await TestUtils.readGeneratedFile(createPath);
      
      // Check form submission
      expect(content).toContain('const handleSubmit = form.handleSubmit(async (data) => {');
      expect(content).toContain('await sdk.client.fetch("/admin/vehicles/test-models"');
      expect(content).toContain('method: "POST"');
      expect(content).toContain('navigate("/vehicles/test-models")');
    });
  });

  describe('Edit Form Generation', () => {
    it('should generate edit form with correct fields', async () => {
      await generateModule(TEST_CONFIG, { testMode: true });
      
      const editPath = path.join('.test-output', 'src/admin/routes/vehicles/test-models/edit/test-model-edit.tsx');
      const content = await TestUtils.readGeneratedFile(editPath);
      
      // Check imports and types
      expect(content).toContain('import { PostAdminUpdateTestModel } from "../../../../../api/admin/vehicles/test-models/validators"');
      expect(content).toContain('type EditTestModelFormData = zod.infer<typeof schema>');
      
      // Check props type
      expect(content).toContain('type TestModelEditProps = {');
      expect(content).toContain('testModel: {');
      expect(content).toContain('id: string');
      expect(content).toContain('make_id: string');
      
      // Check form fields
      expect(content).toContain('<InputField name="name"');
      expect(content).toContain('<SelectField name="make_id"');
    });

    it('should handle form submission correctly', async () => {
      await generateModule(TEST_CONFIG, { testMode: true });
      
      const editPath = path.join('.test-output', 'src/admin/routes/vehicles/test-models/edit/test-model-edit.tsx');
      const content = await TestUtils.readGeneratedFile(editPath);
      
      // Check form submission
      expect(content).toContain('const handleSubmit = form.handleSubmit(async (data) => {');
      expect(content).toContain('await sdk.client.fetch(`/admin/vehicles/test-models/${testModel.id}`');
      expect(content).toContain('method: "POST"');
      expect(content).toContain('navigate("/vehicles/test-models")');
    });
  });
}); 