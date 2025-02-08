import { generateModule, TEMPLATES, toPascalCase, dryRunModule } from './generate-module';

// First show the content that would be generated
console.log('\nGenerated File Contents:');
console.log('======================\n');

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

// Generate content for each model
for (const model of config.models) {
  const routePath = model.parent?.routePrefix || config.plural;

  // Show model file content
  console.log(`src/modules/${config.plural}/models/${model.name}.ts:`)
  console.log('----------------------------------------\n')
  console.log(TEMPLATES.model(model.name, model.fields))
  console.log('\n\n')

  // Show validator content
  console.log(`src/api/admin/${routePath}/validators.ts:`)
  console.log('----------------------------------------\n')
  console.log(TEMPLATES.validator(model.name, model.fields))
  console.log('\n\n')

  // Show route content
  console.log(`src/api/admin/${routePath}/route.ts:`)
  console.log('----------------------------------------\n')
  console.log(TEMPLATES.route(config, model))
  console.log('\n\n')

  // Show route ID content
  console.log(`src/api/admin/${routePath}/[id]/route.ts:`)
  console.log('----------------------------------------\n')
  console.log(TEMPLATES.route(config, model))
  console.log('\n\n')

  // Show page component
  console.log(`src/admin/routes/${config.plural}/${model.plural}/page.tsx:`)
  console.log('--------------------------------------------\n')
  console.log(TEMPLATES.pageComponent(config, model))
  console.log('\n\n')

  // Show create component
  const componentName = model.parent ? `${model.parent.model.toLowerCase()}-${model.singular}` : model.singular
  console.log(`src/admin/routes/${config.plural}/${model.plural}/create/${componentName}-create.tsx:`)
  console.log('-------------------------------------------------------------------\n')
  console.log(TEMPLATES.createComponent(config, model))
  console.log('\n\n')

  // Show edit component
  console.log(`src/admin/routes/${config.plural}/${model.plural}/edit/${componentName}-edit.tsx:`)
  console.log('----------------------------------------------------------------\n')
  console.log(TEMPLATES.editComponent(config, model))
  console.log('\n\n')
}

// Show service update
console.log(`src/modules/${config.plural}/service.ts:`)
console.log('---------------------------')
// Include existing models in the service
const existingModels = ['Vehicle', 'VehicleMake', 'VehicleModel', 'VehicleBody']
console.log('Service template input:', { 
  moduleName: toPascalCase(config.name), 
  models: [...existingModels, ...config.models.map(m => m.name)]
})
console.log('\n')
console.log(TEMPLATES.service({ 
  moduleName: toPascalCase(config.name), 
  models: [...existingModels, ...config.models.map(m => m.name)]
}))
console.log('\n\n')

// Show middleware update
console.log(`src/api/middlewares.ts:`)
console.log('---------------------------\n')
const middleware = TEMPLATES.middleware(config)
console.log(middleware.fullTemplate)
console.log('\n\n')

// Execute the generator
console.log('Generating files:')
console.log('================\n')

dryRunModule(config, { addToExisting: true }) 