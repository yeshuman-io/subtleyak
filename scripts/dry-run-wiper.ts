import { generateModule, TEMPLATES, toPascalCase, dryRunModule } from './generate-module';

// First show the content that would be generated
console.log('\nGenerated File Contents:');
console.log('======================\n');

const config = {
  name: "wiper",
  plural: "wipers",
  models: [
    {
      name: "wiper",
      singular: "wiper",
      plural: "wipers",
      isParent: true,
      fields: [
        { 
          name: "name", 
          type: "string" as const, 
          required: true 
        },
        { 
          name: "code", 
          type: "string" as const, 
          required: true 
        },
        { 
          name: "kits",
          type: "string" as const,
          relation: {
            type: "hasMany" as const,
            model: "WiperKit",
            inverse: "wiper"
          }
        }
      ]
    },
    {
      name: "wiper-kit",
      singular: "kit",
      plural: "kits",
      parent: {
        model: "Wiper",
        routePrefix: "wipers/kits"
      },
      fields: [
        { 
          name: "name", 
          type: "string" as const, 
          required: true 
        },
        { 
          name: "code", 
          type: "string" as const, 
          required: true 
        },
        { 
          name: "wiper",
          type: "string" as const,
          relation: {
            type: "belongsTo" as const,
            model: "Wiper",
            inverse: "kits"
          }
        }
      ]
    }
  ]
};

// Generate content for each model
for (const model of config.models) {
  const routePath = model.isParent ? config.plural : model.parent?.routePrefix;

  // Show model file content
  console.log(`src/modules/${config.plural}/models/${model.name}.ts:`);
  console.log('----------------------------------------');
  console.log(TEMPLATES.model(model.name, model.fields));
  console.log('\n');

  // Show validator content
  console.log(`src/api/admin/${routePath}/validators.ts:`);
  console.log('----------------------------------------');
  console.log(TEMPLATES.validator(model.name, model.fields));
  console.log('\n');

  // Show page component
  console.log(`src/admin/routes/${config.plural}/${model.plural}/page.tsx:`);
  console.log('--------------------------------------------');
  console.log(TEMPLATES.pageComponent(config, model));
  console.log('\n');

  // Show create component
  const componentName = model.isParent ? model.singular : `${model.parent?.model.toLowerCase()}-${model.singular}`;
  console.log(`src/admin/routes/${config.plural}/${model.plural}/create/${componentName}-create.tsx:`);
  console.log('-------------------------------------------------------------------');
  console.log(TEMPLATES.createComponent(config, model));
  console.log('\n');

  // Show edit component
  console.log(`src/admin/routes/${config.plural}/${model.plural}/edit/${componentName}-edit.tsx:`);
  console.log('----------------------------------------------------------------');
  console.log(TEMPLATES.editComponent(config, model));
  console.log('\n');
}

// Show service update
console.log(`src/modules/${config.plural}/service.ts:`);
console.log('---------------------------');
console.log(TEMPLATES.service({ 
  moduleName: toPascalCase(config.name), 
  models: config.models.map(m => m.name)
}));
console.log('\n');

// Execute the generator
console.log('Generating files:');
console.log('================\n');

dryRunModule(config, { addToExisting: false }); 