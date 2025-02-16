import type { ModuleConfig } from '../src/generate-v2.js';

/**
 * Test Module Configuration
 * Used to test specific generator features
 */
export const TEST_MODULE: ModuleConfig = {
  moduleName: 'tests',
  moduleModelName: 'test-model',
  singular: 'test',
  plural: 'tests',
  models: [
    {
      name: 'test-model',
      singular: 'model',
      plural: 'models',
      fields: [
        {
          name: 'name',
          type: 'string',
          required: true
        },
        {
          name: 'code',
          type: 'string',
          required: true
        },
        {
          name: 'test',
          type: 'string',
          relation: {
            type: 'belongsTo',
            model: 'Test',
            mappedBy: 'models'
          }
        }
      ]
    }
  ]
};

/**
 * Relationship Test Module Configuration
 * Used to test different types of relationships
 */
export const RELATIONSHIP_MODULE: ModuleConfig = {
  moduleName: 'relationships',
  moduleModelName: 'one-to-many',
  singular: 'relationship',
  plural: 'relationships',
  models: [
    {
      name: 'one-to-many',
      singular: 'one',
      plural: 'ones',
      fields: [
        {
          name: 'name',
          type: 'string',
          required: true
        },
        {
          name: 'manys',
          type: 'string',
          relation: {
            type: 'hasMany',
            model: 'Many',
            mappedBy: 'one'
          }
        }
      ]
    },
    {
      name: 'many-to-one',
      singular: 'many',
      plural: 'manys',
      fields: [
        {
          name: 'name',
          type: 'string',
          required: true
        },
        {
          name: 'one',
          type: 'string',
          relation: {
            type: 'belongsTo',
            model: 'One',
            mappedBy: 'manys'
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
  moduleName: 'many-to-many',
  moduleModelName: 'left',
  singular: 'many-to-many',
  plural: 'many-to-manys',
  models: [
    {
      name: 'left',
      singular: 'left',
      plural: 'lefts',
      fields: [
        {
          name: 'name',
          type: 'string',
          required: true
        },
        {
          name: 'rights',
          type: 'string',
          relation: {
            type: 'manyToMany',
            model: 'Right',
            through: 'left_right',
            mappedBy: 'lefts'
          }
        }
      ]
    },
    {
      name: 'right',
      singular: 'right',
      plural: 'rights',
      fields: [
        {
          name: 'name',
          type: 'string',
          required: true
        },
        {
          name: 'lefts',
          type: 'string',
          relation: {
            type: 'manyToMany',
            model: 'Left',
            through: 'left_right',
            mappedBy: 'rights'
          }
        }
      ]
    }
  ]
};

/**
 * Field Types Test Module Configuration
 * Used to test different field types
 */
export const FIELD_TYPES_MODULE: ModuleConfig = {
  moduleName: 'field-types',
  moduleModelName: 'all-types',
  singular: 'field-type',
  plural: 'field-types',
  models: [
    {
      name: 'all-types',
      singular: 'type',
      plural: 'types',
      fields: [
        {
          name: 'string_field',
          type: 'string',
          required: true
        },
        {
          name: 'number_field',
          type: 'number',
          required: true
        },
        {
          name: 'boolean_field',
          type: 'boolean',
          required: false
        },
        {
          name: 'date_field',
          type: 'date',
          required: false
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
  relationships: RELATIONSHIP_MODULE,
  'many-to-many': MANY_TO_MANY_MODULE,
  'field-types': FIELD_TYPES_MODULE,
} as const;

/**
 * Helper type to get all test module names
 */
export type ModuleName = keyof typeof MODULES; 