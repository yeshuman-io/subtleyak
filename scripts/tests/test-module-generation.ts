import { MiddlewareManager } from '../utils/middleware-manager';
import fs from 'fs/promises';
import path from 'path';

type ModelField = {
  name: string;
  type: "string" | "number" | "boolean" | "date";
  required?: boolean;
  relation?: {
    type: "belongsTo" | "hasMany" | "manyToMany";
    model: string;
    inverse?: string;
  };
};

type ModelConfig = {
  name: string;
  singular: string;
  plural: string;
  isParent?: boolean;
  parent?: {
    model: string;
    routePrefix: string;
  };
  fields: ModelField[];
};

type ModuleConfig = {
  name: string;
  plural: string;
  models: ModelConfig[];
};

async function testModuleGeneration() {
  // Test module configuration
  const moduleConfig: ModuleConfig = {
    name: 'vehicle',
    plural: 'vehicles',
    models: [
      // Parent model
      {
        name: 'vehicle',
        singular: 'vehicle',
        plural: 'vehicles',
        isParent: true,
        fields: [
          { name: 'name', type: 'string', required: true },
          { name: 'code', type: 'string', required: true },
          { 
            name: 'models',
            type: 'string',
            relation: {
              type: 'hasMany',
              model: 'VehicleModel',
              inverse: 'vehicle'
            }
          }
        ]
      },
      // Child model
      {
        name: 'vehicle-model',
        singular: 'model',
        plural: 'models',
        parent: {
          model: 'Vehicle',
          routePrefix: 'vehicles/models'
        },
        fields: [
          { name: 'name', type: 'string', required: true },
          { name: 'code', type: 'string', required: true },
          { 
            name: 'make',
            type: 'string',
            relation: {
              type: 'belongsTo',
              model: 'Make'
            }
          },
          {
            name: 'vehicle',
            type: 'string',
            relation: {
              type: 'belongsTo',
              model: 'Vehicle',
              inverse: 'models'
            }
          }
        ]
      }
    ]
  };

  // Create some existing content to test merging
  const existingContent = `
// This file is auto-generated and will be overwritten by subsequent generations
// Manual changes should be made to the generator templates instead

import { createFindParams } from "@medusajs/medusa/api/utils/validators";
import { defineMiddlewares, validateAndTransformQuery, validateAndTransformBody } from "@medusajs/framework/http";
import { z } from "zod";
import { PostAdminCreateMake, PostAdminUpdateMake } from "./admin/vehicles/makes/validators";

export const GetMakeSchema = createFindParams();

export default defineMiddlewares({
  routes: [
    // GET routes
    {
      matcher: "/admin/vehicles/makes",
      method: "GET",
      middlewares: [validateAndTransformQuery(GetMakeSchema, { defaults: ['id', 'name'], isList: true })]
    },
    // CREATE routes
    {
      matcher: "/admin/vehicles/makes",
      method: "POST",
      middlewares: [validateAndTransformBody(PostAdminCreateMake)]
    },
    // UPDATE routes
    {
      matcher: "/admin/vehicles/makes/:id",
      method: "POST",
      middlewares: [validateAndTransformBody(PostAdminUpdateMake)]
    }
  ]
});`;

  // Initialize middleware manager with existing content
  const manager = new MiddlewareManager(existingContent);

  // Add framework imports
  manager.addImport('@medusajs/framework/http', 'validateAndTransformQuery');
  manager.addImport('@medusajs/framework/http', 'validateAndTransformBody');
  manager.addImport('@medusajs/framework/http', 'defineMiddlewares');
  manager.addImport('@medusajs/medusa/api/utils/validators', 'createFindParams');

  // Add validator imports and routes for each model
  for (const model of moduleConfig.models) {
    const modelName = model.name.replace(/-/g, '');
    const className = modelName.charAt(0).toUpperCase() + modelName.slice(1);
    
    manager.addImport(
      `./admin/${model.parent?.routePrefix || moduleConfig.plural}/validators`,
      `PostAdminCreate${className}`
    );
    manager.addImport(
      `./admin/${model.parent?.routePrefix || moduleConfig.plural}/validators`,
      `PostAdminUpdate${className}`
    );

    // Add schema
    const schemaName = `Get${className}Schema`;
    const schemaDefinition = model.fields.find(f => f.relation?.model === 'Make')
      ? 'createFindParams().extend({ make_id: z.string().optional() })'
      : 'createFindParams()';
    
    manager.addSchema(schemaName, schemaDefinition);

    // Add routes
    const routePrefix = model.parent?.routePrefix || moduleConfig.plural;

    // GET route
    manager.addRoute({
      matcher: `/admin/${routePrefix}`,
      method: 'GET',
      middlewares: [{
        name: 'validateAndTransformQuery',
        args: [
          schemaName,
          {
            defaults: ['id', ...model.fields.map(f => f.name)],
            select: ['id', ...model.fields.map(f => f.name)],
            relations: model.fields.filter(f => f.relation).map(f => f.name),
            isList: true
          }
        ]
      }]
    });

    // CREATE route
    manager.addRoute({
      matcher: `/admin/${routePrefix}`,
      method: 'POST',
      middlewares: [{
        name: 'validateAndTransformBody',
        args: [`PostAdminCreate${className}`]
      }]
    });

    // UPDATE route
    manager.addRoute({
      matcher: `/admin/${routePrefix}/:id`,
      method: 'POST',
      middlewares: [{
        name: 'validateAndTransformBody',
        args: [`PostAdminUpdate${className}`]
      }]
    });
  }

  // Generate and write the middleware file
  const content = await manager.generateFile();
  const middlewarePath = path.join(process.cwd(), 'src/api/middlewares.ts');
  await fs.writeFile(middlewarePath, content, 'utf-8');
  
  console.log('Generated middleware file:');
  console.log(content);
}

testModuleGeneration().catch(console.error); 