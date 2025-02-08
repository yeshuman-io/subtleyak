import { generateModule, TEMPLATES, toPascalCase } from './generate-module';

// First show the content that would be generated
console.log('\nGenerated File Contents:');
console.log('======================\n');

const config = {
  name: "vehicles",
  models: [
    {
      name: "vehicle-series",
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

// Show model file content
console.log('modules/vehicles/models/vehicle-series.ts:');
console.log('----------------------------------------');
console.log(TEMPLATES.model(config.models[0].name, config.models[0].fields));
console.log('\n');

// Show validator content
console.log('api/admin/vehicles/validators.ts (append):');
console.log('----------------------------------------');
console.log(TEMPLATES.validator(config.models[0].name, config.models[0].fields));
console.log('\n');

// Show service update
console.log('modules/vehicles/service.ts:');
console.log('---------------------------');
// Include existing models in the service
const existingModels = ['Vehicle', 'VehicleMake', 'VehicleModel', 'VehicleBody'];
console.log(TEMPLATES.service({ 
  moduleName: 'Vehicle', 
  models: [...existingModels, ...config.models.map(m => toPascalCase(m.name))]
}));
console.log('\n');

// Show create workflow
console.log('workflows/create-vehicle-series.ts:');
console.log('----------------------------------');
console.log(TEMPLATES.createWorkflow(config.models[0].name, config.models[0].fields));
console.log('\n');

// Show update workflow
console.log('workflows/update-vehicle-series.ts:');
console.log('----------------------------------');
console.log(TEMPLATES.updateWorkflow(config.models[0].name, config.models[0].fields));
console.log('\n');

// Execute the generator
console.log('Generating files:');
console.log('================\n');

generateModule(config, { 
  addToExisting: true,
  dryRun: false 
}); 