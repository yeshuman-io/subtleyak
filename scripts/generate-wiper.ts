import { generateModule } from './generate-module';

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

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const skipExisting = args.includes('--skip-existing');

generateModule(config, { 
  addToExisting: false,
  dryRun: isDryRun,
  skipExisting: skipExisting 
}); 