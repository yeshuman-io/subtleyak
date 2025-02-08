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
  faker: {
    defaults: {
      string: "string.sample",
      number: "number.int({ min: 1, max: 100 })",
      boolean: "datatype.boolean",
      date: "date.recent"
    }
  },
  models: [
    {
      name: 'test-model',
      modelName: 'TestModel',
      modelNamePlural: 'TestModels',
      singular: 'model',
      plural: 'models',
      faker: {
        fields: {
          name: "commerce.productName",
          code: "string.alphanumeric(10)"
        }
      },
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
  faker: {
    defaults: {
      string: "string.sample",
      number: "number.int({ min: 1, max: 1000 })"
    }
  },
  models: [
    {
      name: 'one-to-many',
      modelName: 'OneToMany',
      modelNamePlural: 'OneToManys',
      singular: 'one',
      plural: 'ones',
      faker: {
        fields: {
          name: "commerce.productName"
        }
      },
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
      modelName: 'ManyToOne',
      modelNamePlural: 'ManyToOnes',
      singular: 'many',
      plural: 'manys',
      faker: {
        fields: {
          name: "commerce.productName"
        }
      },
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
  faker: {
    defaults: {
      string: "string.sample",
      number: "number.int({ min: 1, max: 100 })"
    }
  },
  models: [
    {
      name: 'left',
      modelName: 'Left',
      modelNamePlural: 'Lefts',
      singular: 'left',
      plural: 'lefts',
      faker: {
        fields: {
          name: "commerce.productName"
        }
      },
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
      modelName: 'Right',
      modelNamePlural: 'Rights',
      singular: 'right',
      plural: 'rights',
      faker: {
        fields: {
          name: "commerce.productName"
        }
      },
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
  faker: {
    defaults: {
      string: "string.sample",
      number: "number.int({ min: 1, max: 100 })",
      boolean: "datatype.boolean",
      date: "date.recent"
    }
  },
  models: [
    {
      name: 'all-types',
      modelName: 'AllTypes',
      modelNamePlural: 'AllTypes',
      singular: 'type',
      plural: 'types',
      faker: {
        fields: {
          string_field: "string.sample",
          number_field: "number.int({ min: 1, max: 1000 })",
          boolean_field: "datatype.boolean",
          date_field: "date.recent"
        }
      },
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