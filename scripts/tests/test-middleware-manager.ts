import { MiddlewareManager } from '../utils/middleware-manager';
import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';

async function runTests() {
  console.log('Running MiddlewareManager tests...\n');

  // Test 1: Basic Route Addition
  console.log('Test 1: Basic Route Addition');
  const manager1 = new MiddlewareManager();
  manager1.addImport('@medusajs/framework/http', 'validateAndTransformQuery');
  manager1.addImport('@medusajs/framework/http', 'defineMiddlewares');
  manager1.addRoute({
    matcher: '/admin/vehicles',
    method: 'GET',
    middlewares: [{
      name: 'validateAndTransformQuery',
      args: ['GetVehiclesSchema', { defaults: ['id', 'name'], isList: true }]
    }]
  });
  console.log(await manager1.generateFile());
  console.log('\n');

  // Test 2: Schema Addition
  console.log('Test 2: Schema Addition');
  const manager2 = new MiddlewareManager();
  manager2.addImport('@medusajs/medusa/api/utils/validators', 'createFindParams');
  manager2.addSchema('GetVehiclesSchema', 'createFindParams()');
  manager2.addRoute({
    matcher: '/admin/vehicles',
    method: 'GET',
    middlewares: [{
      name: 'validateAndTransformQuery',
      args: ['GetVehiclesSchema', { defaults: ['id', 'name'], isList: true }]
    }]
  });
  console.log(await manager2.generateFile());
  console.log('\n');

  // Test 3: Route Merging
  console.log('Test 3: Route Merging');
  const existingContent = `
import { defineMiddlewares, validateAndTransformQuery } from '@medusajs/framework/http';
import { createFindParams } from '@medusajs/medusa/api/utils/validators';
import { z } from 'zod';

export const GetVehicleModelsSchema = createFindParams().extend({
  make_id: z.string().optional(),
});

export default defineMiddlewares({
  routes: [
    {
      matcher: '/admin/vehicles/models',
      method: 'GET',
      middlewares: [validateAndTransformQuery(GetVehicleModelsSchema, { defaults: ['id', 'name', 'make'], isList: true })]
    }
  ]
});`;

  const manager3 = new MiddlewareManager(existingContent);
  console.log(await manager3.generateFile());
  console.log('\n');

  // Test 4: Route Specificity Ordering
  console.log('Test 4: Route Specificity Ordering');
  const manager4 = new MiddlewareManager();
  manager4.addRoute({
    matcher: '/admin/vehicles',
    method: 'GET',
    middlewares: [{
      name: 'validateAndTransformQuery',
      args: ['GetVehiclesSchema', { defaults: ['id'], isList: true }]
    }]
  });
  manager4.addRoute({
    matcher: '/admin/vehicles/:id',
    method: 'GET',
    middlewares: [{
      name: 'validateAndTransformQuery',
      args: ['GetVehicleSchema', { defaults: ['id'] }]
    }]
  });
  manager4.addRoute({
    matcher: '/admin/vehicles/:id/models',
    method: 'GET',
    middlewares: [{
      name: 'validateAndTransformQuery',
      args: ['GetVehicleModelsSchema', { defaults: ['id'] }]
    }]
  });
  console.log(await manager4.generateFile());
  console.log('\n');

  // Test 5: Complex Middleware
  console.log('Test 5: Complex Middleware');
  const manager5 = new MiddlewareManager();
  manager5.addRoute({
    matcher: '/admin/vehicles',
    method: 'POST',
    middlewares: [{
      name: 'unlessPath',
      args: [/.*\/(models|makes)/, {
        name: 'validateAndTransformBody',
        args: ['PostAdminCreateVehicle']
      }]
    }]
  });
  console.log(await manager5.generateFile());
  console.log('\n');

  // Test 6: Write to File
  console.log('Test 6: Write to File');
  const testOutputPath = path.join(__dirname, 'test-middleware-output.ts');
  const manager6 = new MiddlewareManager();
  manager6.addRoute({
    matcher: '/admin/vehicles',
    method: 'POST',
    middlewares: [{
      name: 'unlessPath',
      args: [/.*\/(models|makes)/, {
        name: 'validateAndTransformBody',
        args: ['PostAdminCreateVehicle']
      }]
    }]
  });
  const content = await manager6.generateFile();
  await fs.writeFile(testOutputPath, content, 'utf-8');
  console.log('File written successfully:', content);
  console.log('\n');

  // Test 7: Real Middleware File
  console.log('Test 7: Real Middleware File');
  const realContent = await fs.readFile(path.join(process.cwd(), 'src/api/middlewares.ts'), 'utf-8');
  const manager7 = new MiddlewareManager(realContent);
  
  // Add a test route and schema
  manager7.addImport('@medusajs/framework/http', 'validateAndTransformQuery');
  manager7.addSchema('GetVehicleTestSchema', 'createFindParams().extend({ test: z.string().optional() })');
  manager7.addRoute({
    matcher: '/admin/vehicles/test',
    method: 'GET',
    middlewares: [{
      name: 'validateAndTransformQuery',
      args: ['GetVehiclesSchema', { defaults: ['id', 'name'], isList: true }]
    }]
  });

  const newContent = await manager7.generateFile();
  console.log(newContent);
  console.log('\n');

  // Write test output
  const testPath = path.join(__dirname, 'test-real-middleware.ts');
  await fs.writeFile(testPath, newContent, 'utf-8');
  console.log(`Wrote test file to: ${testPath}`);
}

runTests().catch(console.error); 