type Middleware = {
  name: string;
  args: any[];
};

type Route = {
  matcher: string;
  method: string;
  middlewares: Middleware[];
};

/**
 * Helper to safely stringify RegExp objects
 */
function stringifyRegExp(obj: any): any {
  if (obj instanceof RegExp) {
    return obj.toString();
  }
  if (Array.isArray(obj)) {
    return obj.map(stringifyRegExp);
  }
  if (typeof obj === 'object' && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, stringifyRegExp(v)])
    );
  }
  return obj;
}

/**
 * Helper to count path segments
 */
function countPathSegments(path: string): number {
  return path.split('/').filter(Boolean).length;
}

/**
 * Helper to count path parameters
 */
function countPathParams(path: string): number {
  return path.split('/').filter(s => s.startsWith(':')).length;
}

/**
 * Merges two sets of routes with the following rules:
 * 1. If a route with same matcher + method exists, newer config takes precedence
 * 2. Routes are grouped by method (GET, POST, etc)
 * 3. Within each method group, more specific routes come first:
 *    - Routes with more segments come before routes with fewer segments
 *    - For routes with same segments, static routes come before parameterized ones
 *    - For routes with same parameterization, longer paths come first
 */
export function mergeRoutes(existingRoutes: Route[], newRoutes: Route[]): Route[] {
  // Combine routes, with new routes overriding existing ones with same matcher + method
  const routeMap = new Map<string, Route>();
  
  // Helper to create unique key for route
  const getRouteKey = (route: Route) => `${route.method}:${route.matcher}`;
  
  // Helper to process route before storing
  const processRoute = (route: Route): Route => ({
    ...route,
    middlewares: route.middlewares.map(mw => ({
      ...mw,
      args: mw.args.map(arg => stringifyRegExp(arg))
    }))
  });
  
  // Add existing routes to map
  existingRoutes.forEach(route => {
    routeMap.set(getRouteKey(route), processRoute(route));
  });
  
  // Override/add new routes
  newRoutes.forEach(route => {
    routeMap.set(getRouteKey(route), processRoute(route));
  });

  // Convert back to array and sort
  const allRoutes = Array.from(routeMap.values());
  
  // Sort routes:
  // 1. Group by method
  // 2. Within each group, sort by specificity
  return allRoutes.sort((a, b) => {
    // First sort by method (GET before POST)
    if (a.method !== b.method) {
      return a.method.localeCompare(b.method);
    }
    
    // Then sort by number of path segments (more segments = more specific)
    const aSegments = countPathSegments(a.matcher);
    const bSegments = countPathSegments(b.matcher);
    if (aSegments !== bSegments) {
      return bSegments - aSegments;
    }
    
    // Then sort by number of parameters (fewer params = more specific)
    const aParams = countPathParams(a.matcher);
    const bParams = countPathParams(b.matcher);
    if (aParams !== bParams) {
      return aParams - bParams;
    }
    
    // Finally sort by path length
    return b.matcher.length - a.matcher.length;
  });
} 