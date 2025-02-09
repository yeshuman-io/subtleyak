import { mergeRoutes } from '../utils/route-merge';

// Test cases for route merging
const existingRoutes = [
  {
    matcher: "/admin/vehicles/makes",
    method: "GET",
    middlewares: [
      {
        name: "validateAndTransformQuery",
        args: ["GetVehiclesSchema", { defaults: ["id", "name"], isList: true }]
      }
    ]
  },
  {
    matcher: "/admin/vehicles/makes/:id",
    method: "POST",
    middlewares: [
      {
        name: "validateAndTransformBody",
        args: ["PostAdminUpdateVehicleMake"]
      }
    ]
  },
  {
    matcher: "/admin/vehicles",
    method: "POST",
    middlewares: [
      {
        name: "unlessPath",
        args: [/.*\/(models|makes|bodies)/, {
          name: "validateAndTransformBody",
          args: ["PostAdminCreateVehicle"]
        }]
      }
    ]
  }
];

const newRoutes = [
  {
    matcher: "/admin/wipers",
    method: "GET", 
    middlewares: [
      {
        name: "validateAndTransformQuery",
        args: ["GetWipersSchema", { defaults: ["id", "name"], isList: true }]
      }
    ]
  },
  {
    matcher: "/admin/vehicles/makes",  // Duplicate route with different config
    method: "GET",
    middlewares: [
      {
        name: "validateAndTransformQuery",
        args: ["GetVehiclesSchema", { defaults: ["id", "name", "models"], isList: true }]
      }
    ]
  }
];

// Test 1: Basic merge with duplicates
console.log("\nTest 1: Basic merge with duplicates");
console.log(JSON.stringify(mergeRoutes(existingRoutes, newRoutes), null, 2));

// Test 2: Empty existing routes
console.log("\nTest 2: Empty existing routes");
console.log(JSON.stringify(mergeRoutes([], newRoutes), null, 2));

// Test 3: Empty new routes
console.log("\nTest 3: Empty new routes");
console.log(JSON.stringify(mergeRoutes(existingRoutes, []), null, 2));

// Test 4: Routes with different methods but same path
const routesWithDifferentMethods = [
  {
    matcher: "/admin/vehicles/makes",
    method: "POST",
    middlewares: [
      {
        name: "validateAndTransformBody",
        args: ["PostAdminCreateVehicleMake"]
      }
    ]
  }
];

console.log("\nTest 4: Routes with different methods");
console.log(JSON.stringify(mergeRoutes(existingRoutes, routesWithDifferentMethods), null, 2));

// Test 5: Complex nested routes with params
const complexRoutes = [
  {
    matcher: "/admin/vehicles/makes/:make_id/models",
    method: "GET",
    middlewares: [
      {
        name: "validateAndTransformQuery",
        args: ["GetVehicleModelsSchema", { defaults: ["id", "name"], isList: true }]
      }
    ]
  },
  {
    matcher: "/admin/vehicles/makes/:make_id/models/:model_id",
    method: "GET",
    middlewares: [
      {
        name: "validateAndTransformQuery",
        args: ["GetVehicleModelSchema"]
      }
    ]
  }
];

console.log("\nTest 5: Complex nested routes");
console.log(JSON.stringify(mergeRoutes(existingRoutes, complexRoutes), null, 2));

// Test 6: Routes with unlessPath middleware
const unlessPathRoutes = [
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
  },
  {
    matcher: "/admin/wipers/kits",
    method: "POST",
    middlewares: [
      {
        name: "validateAndTransformBody",
        args: ["PostAdminCreateWiperKit"]
      }
    ]
  }
];

console.log("\nTest 6: Routes with unlessPath middleware");
console.log(JSON.stringify(mergeRoutes(existingRoutes, unlessPathRoutes), null, 2));

// Test 7: Multiple middleware in single route
const multiMiddlewareRoutes = [
  {
    matcher: "/admin/vehicles/makes/:id",
    method: "POST",
    middlewares: [
      {
        name: "validateAndTransformQuery",
        args: ["GetVehicleMakeSchema"]
      },
      {
        name: "validateAndTransformBody",
        args: ["PostAdminUpdateVehicleMake"]
      }
    ]
  }
];

console.log("\nTest 7: Multiple middleware in single route");
console.log(JSON.stringify(mergeRoutes(existingRoutes, multiMiddlewareRoutes), null, 2));

// Test 8: Merging routes from multiple modules
const moduleARoutes = [
  {
    matcher: "/admin/module-a",
    method: "GET",
    middlewares: [
      {
        name: "validateAndTransformQuery",
        args: ["GetModuleASchema", { defaults: ["id"], isList: true }]
      }
    ]
  }
];

const moduleBRoutes = [
  {
    matcher: "/admin/module-b",
    method: "GET",
    middlewares: [
      {
        name: "validateAndTransformQuery",
        args: ["GetModuleBSchema", { defaults: ["id"], isList: true }]
      }
    ]
  }
];

console.log("\nTest 8: Multiple module merge");
const mergedAB = mergeRoutes(moduleARoutes, moduleBRoutes);
console.log(JSON.stringify(mergeRoutes(mergedAB, existingRoutes), null, 2)); 