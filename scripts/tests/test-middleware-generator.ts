import { generateMiddleware, parseExistingMiddleware } from '../utils/middleware-generator';

// Test existing middleware content
const existingContent = `// This file is auto-generated and will be overwritten by subsequent generations
// Manual changes should be made to the generator templates instead

import { z } from "zod";
import { defineMiddlewares, validateAndTransformQuery } from "@medusajs/framework/http";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";

export const GetVehiclesSchema = createFindParams();
export const GetVehicleModelsSchema = createFindParams().extend({
  make_id: z.string().optional()
});

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/vehicles/makes",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetVehiclesSchema, {
          defaults: ["id", "name"],
          isList: true
        })
      ]
    }
  ]
});`;

// New config to merge
const newConfig = {
  routes: [
    {
      matcher: "/admin/wipers",
      method: "GET",
      middlewares: [
        {
          name: "validateAndTransformQuery",
          args: ["GetWipersSchema", { defaults: ["id", "name"], isList: true }]
        }
      ]
    }
  ],
  schemas: {
    imports: [
      'import { z } from "zod"',
      'import { createFindParams } from "@medusajs/medusa/api/utils/validators"'
    ],
    schemas: [
      {
        name: "GetWipersSchema",
        definition: "createFindParams()"
      }
    ]
  }
};

// Test 1: Parse existing content
console.log("\nTest 1: Parse existing content");
const parsed = parseExistingMiddleware(existingContent);
console.log(JSON.stringify(parsed, null, 2));

// Test 2: Generate merged content
console.log("\nTest 2: Generate merged content");
const generated = generateMiddleware(parsed, newConfig);
console.log(generated);

// Test 3: Parse and regenerate should be idempotent
console.log("\nTest 3: Parse and regenerate should be idempotent");
const reparsed = parseExistingMiddleware(generated);
const regenerated = generateMiddleware(reparsed, {
  routes: [],
  schemas: { imports: [], schemas: [] }
});
console.log(regenerated);

// Test 4: Complex merge with unlessPath
const complexConfig = {
  routes: [
    {
      matcher: "/admin/wipers",
      method: "POST",
      middlewares: [
        {
          name: "unlessPath",
          args: [/.*\/kits/, {
            name: "validateAndTransformBody",
            args: ["PostAdminCreateWiper"]
          }]
        }
      ]
    }
  ],
  schemas: {
    imports: [
      'import { PostAdminCreateWiper } from "./admin/wipers/validators"'
    ],
    schemas: []
  }
};

console.log("\nTest 4: Complex merge with unlessPath");
console.log(generateMiddleware(parsed, complexConfig)); 