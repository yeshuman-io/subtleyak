import { faker } from "@faker-js/faker";
import { MedusaContainer } from "@medusajs/framework/types"
import { 
  Vehicle,
  VehicleSeries,
  VehicleMake,
  VehicleModel,
  VehicleBody,
  Wiper,
  WiperKit,
  WiperLength,
  WiperConnector,
  WiperArm,
  Fitment,
} from "../admin/types";
import { VEHICLES_MODULE } from "../modules/vehicles";
import VehiclesModuleService from "../modules/vehicles/service";
import { WIPERS_MODULE } from "../modules/wipers";
import WipersModuleService from "../modules/wipers/service";
import { FITMENTS_MODULE } from "../modules/fitments";
import FitmentsModuleService from "../modules/fitments/service";

// Constants for seeding quantities
const VEHICLE_COUNT = 10;
const VEHICLE_VEHICLES_PER_VEHICLE = 2;
const VEHICLE_SERIES_PER_VEHICLE = 2;
const VEHICLE_MAKES_PER_VEHICLE = 2;
const VEHICLE_MODELS_PER_VEHICLE = 2;
const VEHICLE_BODIES_PER_VEHICLE = 2;
const WIPER_COUNT = 10;
const WIPER_WIPERS_PER_WIPER = 2;
const WIPER_KITS_PER_WIPER = 2;
const WIPER_LENGTHS_PER_WIPER = 2;
const WIPER_CONNECTORS_PER_WIPER = 2;
const WIPER_ARMS_PER_WIPER = 2;
const FITMENT_COUNT = 10;
const FITMENT_FITMENTS_PER_FITMENT = 2;

// Define field types
type Field = {
  name: string;
  type: "text" | "number" | "boolean" | "date";
  relation?: {
    type: "belongsTo" | "hasMany" | "manyToMany";
    model: string;
    mappedBy?: string;
  };
};

export default async function seed(
  { container }: { container: MedusaContainer },
  quantity: number = 10
): Promise<void> {
  console.log("Starting seed process...");
  const startTime = Date.now();
  
  console.log("Inspecting registered modules...");
  
  // Log all registrations in the container
  console.log("Registered modules:", Object.keys(container.registrations));

  // Optionally, you can log more details about each registration
  Object.entries(container.registrations).forEach(([key, value]) => {
    console.log(`Module: ${key}`, typeof value);
  });

  // Resolve services
  const vehiclesModuleService: VehiclesModuleService = 
    container.cradle[VEHICLES_MODULE];
  const wipersModuleService: WipersModuleService = 
    container.cradle[WIPERS_MODULE];
  const fitmentsModuleService: FitmentsModuleService = 
    container.cradle[FITMENTS_MODULE];

  try {
    console.log("\nSeeding Vehicles module...");
    
    // Sort models by dependency level
    const vehicleModels = [
      {
        name: "VehicleMake",
        modelNamePlural: "VehicleMakes",
        service: vehiclesModuleService,
        dependencies: [
        ],
        count: quantity * 2,
        config: {
          fields: [
            {
              name: "name",
              type: "false" as const,
            },
            {
              name: "models",
              type: "false" as const,
              relation: {
                type: "hasMany" as const,
                model: "VehicleModel",
                mappedBy: "make",
              },
            },
            {
              name: "vehicles",
              type: "false" as const,
              relation: {
                type: "hasMany" as const,
                model: "Vehicle",
                mappedBy: "make",
              },
            },
          ] as const,
          faker: {
            fields: {
              "name": "vehicle.manufacturer",
            }
          }
        }
      },
      {
        name: "VehicleBody",
        modelNamePlural: "VehicleBodies",
        service: vehiclesModuleService,
        dependencies: [
        ],
        count: quantity * 2,
        config: {
          fields: [
            {
              name: "name",
              type: "false" as const,
            },
            {
              name: "models",
              type: "false" as const,
              relation: {
                type: "manyToMany" as const,
                model: "VehicleModel",
                mappedBy: "bodies",
              },
            },
          ] as const,
          faker: {
            fields: {
              "name": "vehicle.type",
            }
          }
        }
      },
      {
        name: "VehicleModel",
        modelNamePlural: "VehicleModels",
        service: vehiclesModuleService,
        dependencies: [
          "VehicleMake",
        ],
        count: quantity * 2,
        config: {
          fields: [
            {
              name: "name",
              type: "false" as const,
            },
            {
              name: "make",
              type: "false" as const,
              relation: {
                type: "belongsTo" as const,
                model: "VehicleMake",
              },
            },
            {
              name: "vehicles",
              type: "false" as const,
              relation: {
                type: "hasMany" as const,
                model: "Vehicle",
                mappedBy: "model",
              },
            },
            {
              name: "bodies",
              type: "false" as const,
              relation: {
                type: "manyToMany" as const,
                model: "VehicleBody",
              },
            },
          ] as const,
          faker: {
            fields: {
              "name": "vehicle.model",
            }
          }
        }
      },
      {
        name: "Vehicle",
        modelNamePlural: "Vehicles",
        service: vehiclesModuleService,
        dependencies: [
          "VehicleMake",
          "VehicleModel",
        ],
        count: quantity * 2,
        config: {
          fields: [
            {
              name: "make",
              type: "false" as const,
              relation: {
                type: "belongsTo" as const,
                model: "VehicleMake",
                mappedBy: "vehicles",
              },
            },
            {
              name: "model",
              type: "false" as const,
              relation: {
                type: "belongsTo" as const,
                model: "VehicleModel",
                mappedBy: "vehicles",
              },
            },
            {
              name: "series",
              type: "false" as const,
              relation: {
                type: "hasMany" as const,
                model: "VehicleSeries",
                mappedBy: "vehicle",
              },
            },
          ] as const,
          faker: {
            fields: {
              "name": "vehicle.model",
              "type": "vehicle.type",
              "manufacturer": "vehicle.manufacturer",
              "vin": "vehicle.vin",
              "color": "vehicle.color",
            }
          }
        }
      },
      {
        name: "VehicleSeries",
        modelNamePlural: "VehicleSeries",
        service: vehiclesModuleService,
        dependencies: [
          "Vehicle",
          "VehicleModel",
        ],
        count: quantity * 2,
        config: {
          fields: [
            {
              name: "start_year",
              type: "false" as const,
            },
            {
              name: "end_year",
              type: "false" as const,
            },
            {
              name: "vehicle",
              type: "false" as const,
              relation: {
                type: "belongsTo" as const,
                model: "Vehicle",
                mappedBy: "series",
              },
            },
            {
              name: "model",
              type: "false" as const,
              relation: {
                type: "belongsTo" as const,
                model: "VehicleModel",
                mappedBy: "series",
              },
            },
          ] as const,
          faker: {
            fields: {
              "start_year": "number.int({ min: 1950, max: 2020 })",
              "end_year": "number.int({ min: 2021, max: 2024 })",
            }
          }
        }
      },
    ];

    // Create records for each model in dependency order
    for (const model of vehicleModels) {
      console.log(`\nCreating ${model.count} ${model.name} records...`);
      
      for (let i = 0; i < model.count; i++) {
        // Generate data for the record
        const data: Record<string, any> = {};
        
        for (const field of model.config.fields as unknown as Field[]) {
          if ('relation' in field && field.relation) {
            if (field.relation.type === "belongsTo") {
              // Get a random related record ID
              const moduleService = field.relation.model.toLowerCase().includes('vehicle') 
                ? vehiclesModuleService 
                : null;
              
              if (!moduleService) {
                console.warn(`No module service found for model ${field.relation.model}`);
                continue;
              }

              const relatedRecords = await moduleService[`list${field.relation.model}s`](
                {},  // Empty filter object
                { 
                  take: 1,
                  select: ['id']
                }
              );
              
              if (relatedRecords.length > 0) {
                data[`${field.name}_id`] = relatedRecords[0].id;
              }
            }
          } else {
            // Generate data using faker
            const fakerMethod = 
              model.config.faker.fields[field.name] || 
              {
                text: "lorem.word",
                number: "number.int({ min: 1, max: 100 })",
                boolean: "datatype.boolean",
                date: "date.recent"
              }[field.type] || "lorem.word";
            
            // Evaluate faker method
            const [namespace, method] = fakerMethod.split(".");
            if (namespace === 'number' && method.startsWith('int')) {
              const argsMatch = method.match(/\{(.+)\}/);
              if (argsMatch) {
                const options = argsMatch[1].split(',').reduce((obj, pair) => {
                  const [key, value] = pair.trim().split(':').map(s => s.trim());
                  obj[key] = Number(value);
                  return obj;
                }, {} as Record<string, number>);
                data[field.name] = faker.number.int(options);
              } else {
                data[field.name] = faker.number.int();
              }
            } else {
              const methodName = method.split('(')[0];
              data[field.name] = faker[namespace][methodName]();
            }
          }
        }

        // Create the record using the module service with the current model name
        const record = await vehiclesModuleService[`create${model.modelNamePlural}`](data);
        console.log(`Created ${model.name} ${i + 1}/${model.count}`);
      }
    }
    console.log("\nSeeding Wipers module...");
    
    // Sort models by dependency level
    const wiperModels = [
      {
        name: "Wiper",
        modelNamePlural: "Wipers",
        service: wipersModuleService,
        dependencies: [
        ],
        count: quantity * 2,
        config: {
          fields: [
            {
              name: "name",
              type: "false" as const,
            },
            {
              name: "code",
              type: "false" as const,
            },
            {
              name: "kits",
              type: "false" as const,
              relation: {
                type: "hasMany" as const,
                model: "WiperKit",
                mappedBy: "wiper",
              },
            },
          ] as const,
          faker: {
            fields: {
              "name": "commerce.productName",
              "code": "string.alphanumeric(10)",
            }
          }
        }
      },
      {
        name: "WiperKit",
        modelNamePlural: "WiperKits",
        service: wipersModuleService,
        dependencies: [
          "Wiper",
        ],
        count: quantity * 2,
        config: {
          fields: [
            {
              name: "name",
              type: "false" as const,
            },
            {
              name: "code",
              type: "false" as const,
            },
            {
              name: "wiper",
              type: "false" as const,
              relation: {
                type: "belongsTo" as const,
                model: "Wiper",
                mappedBy: "kits",
              },
            },
          ] as const,
          faker: {
            fields: {
              "name": "commerce.productName",
              "code": "string.alphanumeric(12)",
            }
          }
        }
      },
      {
        name: "WiperLength",
        modelNamePlural: "WiperLengths",
        service: wipersModuleService,
        dependencies: [
        ],
        count: quantity * 2,
        config: {
          fields: [
            {
              name: "value",
              type: "false" as const,
            },
            {
              name: "unit",
              type: "false" as const,
            },
          ] as const,
          faker: {
            fields: {
              "value": "number.int({ min: 300, max: 800 })",
              "unit": "science.unit().symbol",
            }
          }
        }
      },
      {
        name: "WiperConnector",
        modelNamePlural: "WiperConnectors",
        service: wipersModuleService,
        dependencies: [
        ],
        count: quantity * 2,
        config: {
          fields: [
            {
              name: "name",
              type: "false" as const,
            },
            {
              name: "code",
              type: "false" as const,
            },
            {
              name: "type",
              type: "false" as const,
            },
            {
              name: "media_url",
              type: "false" as const,
            },
            {
              name: "arms",
              type: "false" as const,
              relation: {
                type: "hasMany" as const,
                model: "WiperArm",
                mappedBy: "connector",
              },
            },
          ] as const,
          faker: {
            fields: {
              "name": "commerce.productName",
              "code": "string.alphanumeric(8)",
              "type": "word.sample([&#x27;image&#x27;, &#x27;video&#x27;])",
            }
          }
        }
      },
      {
        name: "WiperArm",
        modelNamePlural: "WiperArms",
        service: wipersModuleService,
        dependencies: [
          "WiperConnector",
        ],
        count: quantity * 2,
        config: {
          fields: [
            {
              name: "name",
              type: "false" as const,
            },
            {
              name: "code",
              type: "false" as const,
            },
            {
              name: "connector",
              type: "false" as const,
              relation: {
                type: "belongsTo" as const,
                model: "WiperConnector",
                mappedBy: "arms",
              },
            },
          ] as const,
          faker: {
            fields: {
              "name": "commerce.productName",
              "code": "string.alphanumeric(8)",
            }
          }
        }
      },
    ];

    // Create records for each model in dependency order
    for (const model of wiperModels) {
      console.log(`\nCreating ${model.count} ${model.name} records...`);
      
      for (let i = 0; i < model.count; i++) {
        // Generate data for the record
        const data: Record<string, any> = {};
        
        for (const field of model.config.fields as unknown as Field[]) {
          if ('relation' in field && field.relation) {
            if (field.relation.type === "belongsTo") {
              // Get a random related record ID
              const moduleService = field.relation.model.toLowerCase().includes('wiper') 
                ? wipersModuleService 
                : null;
              
              if (!moduleService) {
                console.warn(`No module service found for model ${field.relation.model}`);
                continue;
              }

              const relatedRecords = await moduleService[`list${field.relation.model}s`](
                {},  // Empty filter object
                { 
                  take: 1,
                  select: ['id']
                }
              );
              
              if (relatedRecords.length > 0) {
                data[`${field.name}_id`] = relatedRecords[0].id;
              }
            }
          } else {
            // Generate data using faker
            const fakerMethod = 
              model.config.faker.fields[field.name] || 
              {
                text: "lorem.word",
                number: "number.int({ min: 1, max: 100 })",
                boolean: "datatype.boolean",
                date: "date.recent"
              }[field.type] || "lorem.word";
            
            // Evaluate faker method
            const [namespace, method] = fakerMethod.split(".");
            if (namespace === 'number' && method.startsWith('int')) {
              const argsMatch = method.match(/\{(.+)\}/);
              if (argsMatch) {
                const options = argsMatch[1].split(',').reduce((obj, pair) => {
                  const [key, value] = pair.trim().split(':').map(s => s.trim());
                  obj[key] = Number(value);
                  return obj;
                }, {} as Record<string, number>);
                data[field.name] = faker.number.int(options);
              } else {
                data[field.name] = faker.number.int();
              }
            } else {
              const methodName = method.split('(')[0];
              data[field.name] = faker[namespace][methodName]();
            }
          }
        }

        // Create the record using the module service with the current model name
        const record = await wipersModuleService[`create${model.modelNamePlural}`](data);
        console.log(`Created ${model.name} ${i + 1}/${model.count}`);
      }
    }
    console.log("\nSeeding Fitments module...");
    
    // Sort models by dependency level
    const fitmentModels = [
      {
        name: "Fitment",
        modelNamePlural: "Fitments",
        service: fitmentsModuleService,
        dependencies: [
        ],
        count: quantity * 2,
        config: {
          fields: [
            {
              name: "code",
              type: "false" as const,
            },
          ] as const,
          faker: {
            fields: {
              "code": "string.alphanumeric(10)",
            }
          }
        }
      },
    ];

    // Create records for each model in dependency order
    for (const model of fitmentModels) {
      console.log(`\nCreating ${model.count} ${model.name} records...`);
      
      for (let i = 0; i < model.count; i++) {
        // Generate data for the record
        const data: Record<string, any> = {};
        
        for (const field of model.config.fields as unknown as Field[]) {
          if ('relation' in field && field.relation) {
            if (field.relation.type === "belongsTo") {
              // Get a random related record ID
              const moduleService = field.relation.model.toLowerCase().includes('fitment') 
                ? fitmentsModuleService 
                : null;
              
              if (!moduleService) {
                console.warn(`No module service found for model ${field.relation.model}`);
                continue;
              }

              const relatedRecords = await moduleService[`list${field.relation.model}s`](
                {},  // Empty filter object
                { 
                  take: 1,
                  select: ['id']
                }
              );
              
              if (relatedRecords.length > 0) {
                data[`${field.name}_id`] = relatedRecords[0].id;
              }
            }
          } else {
            // Generate data using faker
            const fakerMethod = 
              model.config.faker.fields[field.name] || 
              {
                text: "lorem.word",
                number: "number.int({ min: 1, max: 100 })",
                boolean: "datatype.boolean",
                date: "date.recent"
              }[field.type] || "lorem.word";
            
            // Evaluate faker method
            const [namespace, method] = fakerMethod.split(".");
            if (namespace === 'number' && method.startsWith('int')) {
              const argsMatch = method.match(/\{(.+)\}/);
              if (argsMatch) {
                const options = argsMatch[1].split(',').reduce((obj, pair) => {
                  const [key, value] = pair.trim().split(':').map(s => s.trim());
                  obj[key] = Number(value);
                  return obj;
                }, {} as Record<string, number>);
                data[field.name] = faker.number.int(options);
              } else {
                data[field.name] = faker.number.int();
              }
            } else {
              const methodName = method.split('(')[0];
              data[field.name] = faker[namespace][methodName]();
            }
          }
        }

        // Create the record using the module service with the current model name
        const record = await fitmentsModuleService[`create${model.modelNamePlural}`](data);
        console.log(`Created ${model.name} ${i + 1}/${model.count}`);
      }
    }

    const endTime = Date.now();
    console.log(`\nSeed completed in ${(endTime - startTime) / 1000}s`);

  } catch (error) {
    console.error("Error during seed process:", error);
    throw error;
  }
} 