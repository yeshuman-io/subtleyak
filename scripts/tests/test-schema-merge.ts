import { mergeSchemas } from '../utils/schema-merge';

// Test cases for schema merging
const existingSchemas = {
  imports: [
    'import { z } from "zod"',
    'import { createFindParams } from "@medusajs/medusa/api/utils/validators"'
  ],
  schemas: [
    {
      name: 'GetVehiclesSchema',
      definition: 'createFindParams()'
    },
    {
      name: 'GetVehicleModelsSchema',
      definition: 'createFindParams().extend({ make_id: z.string().optional() })'
    }
  ]
};

const newSchemas = {
  imports: [
    'import { z } from "zod"',
    'import { createFindParams } from "@medusajs/medusa/api/utils/validators"',
    'import { PostAdminCreateWiper } from "./admin/wipers/validators"'
  ],
  schemas: [
    {
      name: 'GetWipersSchema',
      definition: 'createFindParams()'
    },
    {
      name: 'GetWiperKitsSchema',
      definition: 'createFindParams().extend({ wiper_id: z.string().optional() })'
    }
  ]
};

// Test 1: Basic merge
console.log("\\nTest 1: Basic merge");
console.log(JSON.stringify(mergeSchemas(existingSchemas, newSchemas), null, 2));

// Test 2: Empty existing schemas
console.log("\\nTest 2: Empty existing schemas");
console.log(JSON.stringify(mergeSchemas({
  imports: [],
  schemas: []
}, newSchemas), null, 2));

// Test 3: Empty new schemas
console.log("\\nTest 3: Empty new schemas");
console.log(JSON.stringify(mergeSchemas(existingSchemas, {
  imports: [],
  schemas: []
}), null, 2));

// Test 4: Schema with dependencies
const schemasWithDeps = {
  imports: [
    'import { z } from "zod"',
    'import { Vehicle } from "./models/vehicle"'
  ],
  schemas: [
    {
      name: 'VehicleSchema',
      definition: 'z.object({ id: z.string(), make: z.string(), model: z.string() })'
    },
    {
      name: 'GetVehicleResponseSchema',
      definition: 'z.object({ vehicle: VehicleSchema })'
    }
  ]
};

console.log("\\nTest 4: Schemas with dependencies");
console.log(JSON.stringify(mergeSchemas(existingSchemas, schemasWithDeps), null, 2));

// Test 5: Conflicting schema names
const conflictingSchemas = {
  imports: ['import { z } from "zod"'],
  schemas: [
    {
      name: 'GetVehiclesSchema',  // Same name as existing
      definition: 'createFindParams().extend({ type: z.string() })'
    }
  ]
};

console.log("\\nTest 5: Conflicting schema names");
console.log(JSON.stringify(mergeSchemas(existingSchemas, conflictingSchemas), null, 2));

// Test 6: Complex schema extensions
const complexSchemas = {
  imports: ['import { z } from "zod"'],
  schemas: [
    {
      name: 'BaseSchema',
      definition: 'z.object({ id: z.string() })'
    },
    {
      name: 'ExtendedSchema',
      definition: 'BaseSchema.extend({ name: z.string() })'
    },
    {
      name: 'FurtherExtendedSchema',
      definition: 'ExtendedSchema.extend({ description: z.string().optional() })'
    }
  ]
};

console.log("\\nTest 6: Complex schema extensions");
console.log(JSON.stringify(mergeSchemas(existingSchemas, complexSchemas), null, 2)); 