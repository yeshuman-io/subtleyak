import type { ModuleConfig } from '../src/generate-v2';

/**
 * Test Module Configuration
 * Used to test specific generator features
 */
export const TEST_MODULE: ModuleConfig = {
  moduleName: 'tests',
  singular: 'test',
  plural: 'tests',
  models: [
    {
      name: 'test-model',
      singular: 'model',
      plural: 'models',
      fields: [
        {
          name: 'required_field',
          type: 'text',
          chainables: [
            { name: 'unique' },
            { name: 'index' }
          ]
        },
        {
          name: 'nullable_field',
          type: 'text',
          chainables: [
            { name: 'nullable' }
          ]
        },
        {
          name: 'complex_field',
          type: 'text',
          chainables: [
            { name: 'unique' },
            { name: 'index', args: ['asc'] }
          ]
        },
        {
          name: 'parent',
          type: 'text',
          relation: {
            type: 'belongsTo',
            model: 'TestParent',
            mappedBy: 'children'
          }
        },
        {
          name: 'children',
          type: 'text',
          relation: {
            type: 'hasMany',
            model: 'TestChild',
            mappedBy: 'parent'
          }
        }
      ]
    },
    {
      name: 'test-parent',
      singular: 'parent',
      plural: 'parents',
      fields: [
        {
          name: 'name',
          type: 'text',
          chainables: [
            { name: 'unique' }
          ]
        },
        {
          name: 'children',
          type: 'text',
          relation: {
            type: 'hasMany',
            model: 'TestModel',
            mappedBy: 'parent'
          }
        }
      ]
    },
    {
      name: 'test-child',
      singular: 'child',
      plural: 'children',
      fields: [
        {
          name: 'name',
          type: 'text'
        },
        {
          name: 'parent',
          type: 'text',
          relation: {
            type: 'belongsTo',
            model: 'TestModel',
            mappedBy: 'children'
          }
        }
      ]
    }
  ]
};

/**
 * Parent-Child Test Module Configuration
 * Used to test parent-child relationships in routes
 */
export const PARENT_CHILD_MODULE: ModuleConfig = {
  moduleName: 'parent-child-test',
  singular: 'test',
  plural: 'parent-child-test',
  models: [
    {
      name: 'test-parent',
      singular: 'parent',
      plural: 'parents',
      isParent: true,
      fields: [
        {
          name: 'name',
          type: 'text'
        }
      ]
    },
    {
      name: 'test-child',
      singular: 'child',
      plural: 'children',
      parent: {
        model: 'TestParent',
        routePrefix: 'parents/children'
      },
      fields: [
        {
          name: 'name',
          type: 'text'
        },
        {
          name: 'parent',
          type: 'text',
          relation: {
            type: 'belongsTo',
            model: 'TestParent'
          }
        }
      ]
    }
  ]
};

/**
 * Many-to-Many Test Module Configuration
 * Used to test many-to-many relationships
 */
export const MANY_TO_MANY_MODULE: ModuleConfig = {
  moduleName: 'many-to-many-test',
  singular: 'test',
  plural: 'many-to-many-test',
  models: [
    {
      name: 'test-left',
      singular: 'left',
      plural: 'lefts',
      fields: [
        {
          name: 'name',
          type: 'text'
        },
        {
          name: 'rights',
          type: 'text',
          relation: {
            type: 'manyToMany',
            model: 'TestRight',
            through: 'test_left_right',
            mappedBy: 'lefts'
          }
        }
      ]
    },
    {
      name: 'test-right',
      singular: 'right',
      plural: 'rights',
      fields: [
        {
          name: 'name',
          type: 'text'
        },
        {
          name: 'lefts',
          type: 'text',
          relation: {
            type: 'manyToMany',
            model: 'TestLeft',
            through: 'test_left_right',
            mappedBy: 'rights'
          }
        }
      ]
    }
  ]
};

/**
 * Field Types Test Module Configuration
 * Used to test different field types and chainables
 */
export const FIELD_TYPES_MODULE: ModuleConfig = {
  moduleName: 'field-types-test',
  singular: 'test',
  plural: 'tests',
  models: [
    {
      name: 'test-fields',
      singular: 'field',
      plural: 'fields',
      fields: [
        {
          name: 'text_field',
          type: 'text',
          chainables: [
            { name: 'unique' },
            { name: 'nullable' }
          ]
        },
        {
          name: 'number_field',
          type: 'number',
          chainables: [
            { name: 'index' }
          ]
        },
        {
          name: 'boolean_field',
          type: 'boolean',
          chainables: [
            { name: 'nullable' }
          ]
        }
      ]
    }
  ]
};

/**
 * All test module configurations
 * Add new test modules here as they are created
 */
export const MODULES = {
  tests: TEST_MODULE,
  'parent-child-test': PARENT_CHILD_MODULE,
  'many-to-many-test': MANY_TO_MANY_MODULE,
  'field-types-test': FIELD_TYPES_MODULE,
} as const;

/**
 * Helper type to get all test module names
 */
export type ModuleName = keyof typeof MODULES; 