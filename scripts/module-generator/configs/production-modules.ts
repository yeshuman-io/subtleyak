import type { ModuleConfig } from '../src/generate-v2';

/**
 * Vehicle Module Configuration
 */
export const VEHICLE_MODULE: ModuleConfig = {
  moduleName: 'vehicles',
  singular: 'vehicle',
  plural: 'vehicles',
  models: [
    {
      name: 'vehicle-series',
      singular: 'series',
      plural: 'series',
      fields: [
        {
          name: 'start_year',
          type: 'number'
        },
        {
          name: 'end_year',
          type: 'number'
        },
        {
          name: 'vehicle',
          type: 'text',
          relation: {
            type: 'belongsTo',
            model: 'Vehicle',
            mappedBy: 'series'
          }
        },
        {
          name: 'model',
          type: 'text',
          relation: {
            type: 'belongsTo',
            model: 'VehicleModel',
            mappedBy: 'series'
          }
        }
      ]
    },
    {
      name: 'vehicle-make',
      singular: 'make',
      plural: 'makes',
      fields: [
        {
          name: 'name',
          type: 'text'
        },
        {
          name: 'models',
          type: 'text',
          relation: {
            type: 'hasMany',
            model: 'VehicleModel',
            mappedBy: 'make'
          }
        },
        {
          name: 'vehicles',
          type: 'text',
          relation: {
            type: 'hasMany',
            model: 'Vehicle',
            mappedBy: 'make'
          }
        }
      ]
    },
    {
      name: 'vehicle-model',
      singular: 'model',
      plural: 'models',
      fields: [
        {
          name: 'name',
          type: 'text'
        },
        {
          name: 'make',
          type: 'text',
          relation: {
            type: 'belongsTo',
            model: 'VehicleMake'
          }
        },
        {
          name: 'vehicles',
          type: 'text',
          relation: {
            type: 'hasMany',
            model: 'Vehicle',
            mappedBy: 'model'
          }
        },
        {
          name: 'bodies',
          type: 'text',
          relation: {
            type: 'manyToMany',
            model: 'VehicleBody',
            through: 'vehicle_model_body'
          }
        }
      ]
    },
    {
      name: 'vehicle-body',
      singular: 'body',
      plural: 'bodies',
      fields: [
        {
          name: 'name',
          type: 'text'
        },
        {
          name: 'models',
          type: 'text',
          relation: {
            type: 'manyToMany',
            model: 'VehicleModel',
            mappedBy: 'bodies'
          }
        }
      ]
    }
  ]
};

/**
 * Wiper Module Configuration
 */
export const WIPER_MODULE: ModuleConfig = {
  moduleName: 'wipers',
  singular: 'wiper',
  plural: 'wipers',
  models: [
    {
      name: 'wiper',
      singular: 'wiper',
      plural: 'wipers',
      fields: [
        {
          name: 'name',
          type: 'text'
        },
        {
          name: 'code',
          type: 'text'
        },
        {
          name: 'kits',
          type: 'text',
          relation: {
            type: 'hasMany',
            model: 'WiperKit',
            mappedBy: 'wiper'
          }
        }
      ]
    },
    {
      name: 'wiper-kit',
      singular: 'kit',
      plural: 'kits',
      parent: {
        model: 'Wiper',
        routePrefix: 'wipers/kits'
      },
      fields: [
        {
          name: 'name',
          type: 'text'
        },
        {
          name: 'code',
          type: 'text'
        },
        {
          name: 'wiper',
          type: 'text',
          relation: {
            type: 'belongsTo',
            model: 'Wiper',
            mappedBy: 'kits'
          }
        }
      ]
    }
  ]
};

/**
 * All module configurations
 * Add new modules here as they are created
 */
export const MODULES = {
  vehicles: VEHICLE_MODULE,
  wipers: WIPER_MODULE,
  // Add more modules here
} as const;

/**
 * Helper type to get all module names
 */
export type ModuleName = keyof typeof MODULES; 