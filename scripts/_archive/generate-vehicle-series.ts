import { generateModule } from './generate-module';

const config = {
  name: "vehicle",
  plural: "vehicles",
  models: [
    {
      name: "vehicle-series",
      singular: "series",
      plural: "series", // Special case where singular = plural
      parent: {
        model: "Vehicle",
        routePrefix: "vehicles/series"
      },
      fields: [
        { 
          name: "start_year", 
          type: "number" as const, 
          required: true 
        },
        { 
          name: "end_year", 
          type: "number" as const, 
          required: true 
        },
        { 
          name: "vehicle",
          type: "string" as const,
          relation: {
            type: "belongsTo" as const,
            model: "Vehicle",
            inverse: "series"
          }
        },
        {
          name: "model",
          type: "string" as const,
          relation: {
            type: "belongsTo" as const,
            model: "VehicleModel",
            inverse: "series"
          }
        }
      ]
    }
  ]
};

// Generate the module
generateModule(config, { addToExisting: true }); 