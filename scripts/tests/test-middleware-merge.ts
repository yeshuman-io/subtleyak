import { MiddlewareManager } from '../utils/middleware-manager';
import fs from 'fs/promises';
import path from 'path';
import assert from 'assert';

async function testMerging() {
  console.log('Running middleware merge tests...\n');

  // Test 1: Verify existing content preservation
  console.log('Test 1: Verify existing content preservation');
  const existingContent = await fs.readFile(path.join(process.cwd(), 'src/api/middlewares.ts'), 'utf-8');
  
  const manager = new MiddlewareManager(existingContent);
  const initialContent = await manager.generateFile();
  
  // Write initial parse result
  const initialPath = path.join(__dirname, 'test-middleware-initial.ts');
  await fs.writeFile(initialPath, initialContent, 'utf-8');
  console.log('\nWrote initial parse result to:', initialPath);
  
  // Verify existing routes
  const existingRoutes = [
    '/admin/wipers/kits',
    '/admin/wipers',
    '/admin/wipers/kits/:id',
    '/admin/wipers/:id'
  ];
  
  console.log('\nVerifying existing routes are preserved:');
  for (const route of existingRoutes) {
    const found = initialContent.includes(route);
    console.log(`${route}: ${found ? 'Found' : 'Missing'}`);
    assert(found, `Existing route ${route} not preserved in initial parse`);
  }

  // Verify existing imports
  const expectedImports = [
    '@medusajs/framework/http',
    '@medusajs/medusa/api/utils/validators',
    'zod',
    './admin/wipers/kits/validators',
    './admin/wipers/validators'
  ];

  console.log('\nVerifying existing imports are preserved:');
  for (const imp of expectedImports) {
    const found = initialContent.includes(imp);
    console.log(`${imp}: ${found ? 'Found' : 'Missing'}`);
    assert(found, `Existing import ${imp} not preserved in initial parse`);
  }

  // Test 2: Add new module (Vehicle Series)
  console.log('\nTest 2: Add new module (Vehicle Series)');
  
  // Add imports
  manager.addImport('@medusajs/framework/http', 'validateAndTransformQuery');
  manager.addImport('./admin/vehicles/series/validators', 'PostAdminCreateVehicleSeries');
  manager.addImport('./admin/vehicles/series/validators', 'PostAdminUpdateVehicleSeries');

  // Add routes
  manager.addRoute({
    matcher: '/admin/vehicles/series',
    method: 'GET',
    middlewares: [{
      name: 'validateAndTransformQuery',
      args: ['GetVehicleSeriesSchema', {
        defaults: ['id', 'name', 'code'],
        relations: [],
        isList: true
      }]
    }]
  });

  manager.addRoute({
    matcher: '/admin/vehicles/series',
    method: 'POST',
    middlewares: [{
      name: 'validateAndTransformBody',
      args: ['PostAdminCreateVehicleSeries']
    }]
  });

  manager.addRoute({
    matcher: '/admin/vehicles/series/:id',
    method: 'POST',
    middlewares: [{
      name: 'validateAndTransformBody',
      args: ['PostAdminUpdateVehicleSeries']
    }]
  });

  // Generate first merge
  const firstMergeContent = await manager.generateFile();
  
  // Write first merge result
  const firstMergePath = path.join(__dirname, 'test-middleware-first-merge.ts');
  await fs.writeFile(firstMergePath, firstMergeContent, 'utf-8');
  console.log('\nWrote first merge result to:', firstMergePath);

  // Test 3: Add another module (Vehicle Models)
  console.log('\nTest 3: Add another module (Vehicle Models)');
  
  // Create new manager with previous content
  const manager2 = new MiddlewareManager(firstMergeContent);

  // Add new imports
  manager2.addImport('./admin/vehicles/models/validators', 'PostAdminCreateVehicleModel');
  manager2.addImport('./admin/vehicles/models/validators', 'PostAdminUpdateVehicleModel');

  // Add new routes
  manager2.addRoute({
    matcher: '/admin/vehicles/models',
    method: 'GET',
    middlewares: [{
      name: 'validateAndTransformQuery',
      args: ['GetVehicleModelsSchema', {
        defaults: ['id', 'name', 'make_id'],
        relations: ['make'],
        isList: true
      }]
    }]
  });

  manager2.addRoute({
    matcher: '/admin/vehicles/models',
    method: 'POST',
    middlewares: [{
      name: 'validateAndTransformBody',
      args: ['PostAdminCreateVehicleModel']
    }]
  });

  // Add the :id route
  manager2.addRoute({
    matcher: '/admin/vehicles/models/:id',
    method: 'POST',
    middlewares: [{
      name: 'validateAndTransformBody',
      args: ['PostAdminUpdateVehicleModel']
    }]
  });

  // Generate second merge
  const secondMergeContent = await manager2.generateFile();
  
  // Write second merge result
  const secondMergePath = path.join(__dirname, 'test-middleware-second-merge.ts');
  await fs.writeFile(secondMergePath, secondMergeContent, 'utf-8');
  console.log('\nWrote second merge result to:', secondMergePath);

  // Test 4: Verify all content after multiple merges
  console.log('\nTest 4: Verify all content after multiple merges');

  // Verify all routes present
  const allRoutes = [
    ...existingRoutes,
    '/admin/vehicles/series',
    '/admin/vehicles/series/:id',
    '/admin/vehicles/models',
    '/admin/vehicles/models/:id'
  ];

  console.log('\nVerifying all routes are present:');
  for (const route of allRoutes) {
    const found = secondMergeContent.includes(route);
    console.log(`${route}: ${found ? 'Found' : 'Missing'}`);
    assert(found, `Route ${route} not found in final output`);
  }

  // Verify all imports present
  const allImports = [
    ...expectedImports,
    './admin/vehicles/series/validators',
    './admin/vehicles/models/validators'
  ];

  console.log('\nVerifying all imports are present:');
  for (const imp of allImports) {
    const found = secondMergeContent.includes(imp);
    console.log(`${imp}: ${found ? 'Found' : 'Missing'}`);
    assert(found, `Import ${imp} not found in final output`);
  }

  // Test 5: Verify route ordering
  console.log('\nTest 5: Verify route ordering');
  
  // GET routes should come first
  const getIndex = secondMergeContent.indexOf("method: 'GET'");
  const postIndex = secondMergeContent.indexOf("method: 'POST'");
  assert(getIndex < postIndex, 'GET routes should come before POST routes');

  // More specific routes should come first within each method
  const kitsIndex = secondMergeContent.indexOf('/admin/wipers/kits');
  const wipersIndex = secondMergeContent.indexOf('/admin/wipers', kitsIndex + 1);
  assert(kitsIndex < wipersIndex, 'More specific routes should come first');

  // Routes with IDs should come after their list counterparts
  const seriesListIndex = secondMergeContent.indexOf('/admin/vehicles/series');
  const seriesIdIndex = secondMergeContent.indexOf('/admin/vehicles/series/:id');
  assert(seriesListIndex < seriesIdIndex, 'List routes should come before ID routes');

  // Test 6: Verify complex middleware args
  console.log('\nTest 6: Verify complex middleware args');
  
  // Check for complex objects in query params
  const modelQueryConfig = `{
              defaults: ['id', 'name', 'make_id'],
              relations: ['make'],
              isList: true,
            }`.replace(/\s+/g, '');
  
  const normalizedContent = secondMergeContent.replace(/\s+/g, '');
  
  assert(
    normalizedContent.includes(modelQueryConfig),
    'Complex query configuration not preserved'
  );

  console.log('\nAll tests passed!');
}

testMerging().catch(console.error); 