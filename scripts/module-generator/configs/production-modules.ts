import type { ModuleConfig } from "../src/generate-v2.js";

/**
 * Vehicle Module Configuration
 */

export const VEHICLE_MODULE: ModuleConfig = {
  moduleName: "vehicles",
  moduleModelName: "Vehicle",
  singular: "vehicle",
  plural: "vehicles",
  faker: {
    defaults: {
      text: "lorem.word",
      number: "number.int({ min: 1, max: 100 })",
      boolean: "datatype.boolean",
      date: "date.recent"
    }
  },
  models: [
    {
      name: "vehicle",
      modelName: "Vehicle",
      modelNamePlural: "Vehicles",
      singular: "vehicle",
      plural: "vehicles",
      faker: {
        fields: {
          name: "vehicle.model",
          type: "vehicle.type",
          manufacturer: "vehicle.manufacturer",
          vin: "vehicle.vin",
          color: "vehicle.color"
        }
      },
      fields: [
        {
          name: "make",
          type: "text",
          relation: {
            type: "belongsTo",
            model: "VehicleMake",
            mappedBy: "vehicles",
          },
        },
        {
          name: "model",
          type: "text",
          relation: {
            type: "belongsTo",
            model: "VehicleModel",
            mappedBy: "vehicles",
          },
        },
        {
          name: "series",
          type: "text",
          relation: {
            type: "hasMany",
            model: "VehicleSeries",
            mappedBy: "vehicle",
          },
        },
      ],
    },
    {
      name: "vehicle-series",
      modelName: "VehicleSeries",
      modelNamePlural: "VehicleSeries",
      singular: "series",
      plural: "series",
      faker: {
        fields: {
          start_year: "number.int({ min: 1950, max: 2020 })",
          end_year: "number.int({ min: 2021, max: 2024 })"
        }
      },
      fields: [
        {
          name: "start_year",
          type: "number",
        },
        {
          name: "end_year",
          type: "number",
        },
        {
          name: "vehicle",
          type: "text",
          relation: {
            type: "belongsTo",
            model: "Vehicle",
            mappedBy: "series",
          },
        },
        {
          name: "model",
          type: "text",
          relation: {
            type: "belongsTo",
            model: "VehicleModel",
            mappedBy: "series",
          },
        },
      ],
    },
    {
      name: "vehicle-make",
      modelName: "VehicleMake",
      modelNamePlural: "VehicleMakes",
      singular: "make",
      plural: "makes",
      faker: {
        fields: {
          name: "vehicle.manufacturer"
        }
      },
      fields: [
        {
          name: "name",
          type: "text",
        },
        {
          name: "models",
          type: "text",
          relation: {
            type: "hasMany",
            model: "VehicleModel",
            mappedBy: "make",
          },
        },
        {
          name: "vehicles",
          type: "text",
          relation: {
            type: "hasMany",
            model: "Vehicle",
            mappedBy: "make",
          },
        },
      ],
    },
    {
      name: "vehicle-model",
      modelName: "VehicleModel",
      modelNamePlural: "VehicleModels",
      singular: "model",
      plural: "models",
      faker: {
        fields: {
          name: "vehicle.model"
        }
      },
      fields: [
        {
          name: "name",
          type: "text",
        },
        {
          name: "make",
          type: "text",
          relation: {
            type: "belongsTo",
            model: "VehicleMake",
          },
        },
        {
          name: "vehicles",
          type: "text",
          relation: {
            type: "hasMany",
            model: "Vehicle",
            mappedBy: "model",
          },
        },
        {
          name: "bodies",
          type: "text",
          relation: {
            type: "manyToMany",
            model: "VehicleBody",
            through: "vehicle_model_body",
          },
        },
      ],
    },
    {
      name: "vehicle-body",
      modelName: "VehicleBody",
      modelNamePlural: "VehicleBodies",
      singular: "body",
      plural: "bodies",
      faker: {
        fields: {
          name: "vehicle.type"
        }
      },
      fields: [
        {
          name: "name",
          type: "text",
        },
        {
          name: "models",
          type: "text",
          relation: {
            type: "manyToMany",
            model: "VehicleModel",
            mappedBy: "bodies",
          },
        },
      ],
    },
  ],
};

/**
 * Wiper Module Configuration
 */
export const WIPER_MODULE: ModuleConfig = {
  moduleName: "wipers",
  moduleModelName: "Wiper",
  singular: "wiper",
  plural: "wipers",
  faker: {
    defaults: {
      text: "string.alphanumeric(8)",
      number: "number.int({ min: 1, max: 100 })"
    }
  },
  models: [
    {
      name: "wiper",
      modelName: "Wiper",
      modelNamePlural: "Wipers",
      singular: "wiper",
      plural: "wipers",
      faker: {
        fields: {
          name: "commerce.productName",
          code: "string.alphanumeric(10)"
        }
      },
      fields: [
        {
          name: "name",
          type: "text",
        },
        {
          name: "code",
          type: "text",
        },
        {
          name: "kits",
          type: "text",
          relation: {
            type: "hasMany",
            model: "WiperKit",
            mappedBy: "wiper",
          },
        },
      ],
    },
    {
      name: "wiper-kit",
      modelName: "WiperKit",
      modelNamePlural: "WiperKits",
      singular: "kit",
      plural: "kits",
      parent: {
        model: "Wiper",
        routePrefix: "wipers/kits",
      },
      faker: {
        fields: {
          name: "commerce.productName",
          code: "string.alphanumeric(12)"
        }
      },
      fields: [
        {
          name: "name",
          type: "text",
        },
        {
          name: "code",
          type: "text",
        },
        {
          name: "wiper",
          type: "text",
          relation: {
            type: "belongsTo",
            model: "Wiper",
            mappedBy: "kits",
          },
        },
      ],
    },
  ],
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
