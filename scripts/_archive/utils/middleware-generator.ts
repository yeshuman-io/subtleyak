// Types
export type Route = {
  matcher: string;
  method: string;
  middlewares: Middleware[];
};

export type Middleware = {
  name: string;
  args: any[];
};

export type Schema = {
  name: string;
  definition: string;
};

export type SchemaConfig = {
  imports: string[];
  schemas: Schema[];
};

export type MiddlewareConfig = {
  routes: Route[];
  schemas: SchemaConfig;
};

/**
 * Generates the complete middleware.ts file content by merging routes and schemas
 */
export function generateMiddleware(existing: MiddlewareConfig, newConfig: MiddlewareConfig): string {
  // Merge schemas first
  const mergedSchemas = mergeSchemas(existing.schemas, newConfig.schemas);
  
  // Then merge routes, preserving order and removing duplicates
  const mergedRoutes = mergeRoutes(existing.routes, newConfig.routes)
    .sort((a: Route, b: Route) => {
      // Sort by method first
      if (a.method !== b.method) {
        return a.method === 'GET' ? -1 : 1;
      }
      // Then by specificity (more specific routes first)
      const aSpecificity = (a.matcher.match(/\//g) || []).length;
      const bSpecificity = (b.matcher.match(/\//g) || []).length;
      if (aSpecificity !== bSpecificity) {
        return bSpecificity - aSpecificity;
      }
      // Finally alphabetically
      return a.matcher.localeCompare(b.matcher);
    });

  // Group routes by type
  const getRoutes = mergedRoutes.filter(r => r.method === 'GET');
  const createRoutes = mergedRoutes.filter(r => r.method === 'POST' && !r.matcher.includes('/:id'));
  const updateRoutes = mergedRoutes.filter(r => r.method === 'POST' && r.matcher.includes('/:id'));

  const routeGroups = [
    getRoutes.length > 0 ? `    // GET routes - specific first\n    ${getRoutes.map(stringifyRoute).join(',\n    ')}` : '',
    createRoutes.length > 0 ? `    // CREATE routes - specific first\n    ${createRoutes.map(stringifyRoute).join(',\n    ')}` : '',
    updateRoutes.length > 0 ? `    // UPDATE routes - specific first\n    ${updateRoutes.map(stringifyRoute).join(',\n    ')}` : ''
  ].filter(Boolean);

  return `// This file is auto-generated and will be overwritten by subsequent generations
// Manual changes should be made to the generator templates instead

${mergedSchemas.imports.map(normalizeImport).join('\n')}

${mergedSchemas.schemas.map(s => `export const ${s.name} = ${s.definition};`).join('\n')}

export default defineMiddlewares({
  routes: [
${routeGroups.join(',\n\n')}
  ],
});`;
}

/**
 * Helper to normalize import statements
 */
function normalizeImport(importStr: string): string {
  // Remove trailing semicolon and whitespace
  importStr = importStr.trim().replace(/;$/, '');
  
  // Ensure consistent quotes
  importStr = importStr.replace(/['"]/g, '"');
  
  // Add semicolon
  return importStr + ';';
}

/**
 * Helper to stringify a route object into its code representation
 */
function stringifyRoute(route: Route): string {
  const middlewares = route.middlewares.map(m => stringifyMiddleware(m)).join(', ');
  return `{
      matcher: "${route.matcher}",
      method: "${route.method}",
      middlewares: [${middlewares}]
    }`;
}

/**
 * Helper to stringify a middleware object into its code representation
 */
function stringifyMiddleware(middleware: Middleware): string {
  const args = middleware.args.map(arg => {
    if (arg instanceof RegExp) {
      return arg.toString();
    }
    if (typeof arg === 'string') {
      // If it looks like a variable name, return as is
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(arg)) {
        return arg;
      }
      // If it's a JSON object string, try to parse and re-stringify
      if (arg.startsWith('{')) {
        try {
          const obj = Function(`return ${arg}`)();
          return stringifyObject(obj);
        } catch (e) {
          // If parsing fails, try to clean up the string
          return arg.replace(/\s+/g, ' ')
            .replace(/{\s+/g, '{')
            .replace(/\s+}/g, '}')
            .replace(/\[\s+/g, '[')
            .replace(/\s+\]/g, ']')
            .replace(/\s*,\s*/g, ', ')
            .replace(/\[\s*"([^"]+)"\s*\]/g, "['$1']")
            .replace(/\[\s*'([^']+)'\s*\]/g, "['$1']")
            .replace(/\[\s*([^,\]]+)\s*\]/g, "['$1']")
            .replace(/\[\s*([^,\]]+)\s*,\s*([^,\]]+)\s*\]/g, "['$1', '$2']")
            .replace(/}(?!\s*[,}])/g, '},')
            .replace(/,\s*$/g, '')
            .replace(/}\s*$/g, '}');
        }
      }
      // Otherwise quote it
      return `"${arg}"`;
    }
    if (typeof arg === 'object' && arg !== null) {
      if ('name' in arg && 'args' in arg) {
        // It's a nested middleware
        return stringifyMiddleware(arg as Middleware);
      }
      return stringifyObject(arg);
    }
    return String(arg);
  });
  
  return `${middleware.name}(${args.join(', ')})`;
}

function stringifyObject(obj: any): string {
  if (Array.isArray(obj)) {
    return `[${obj.map(item => {
      if (typeof item === 'string') {
        return `'${item}'`;
      }
      return stringifyObject(item);
    }).join(', ')}]`;
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const entries = Object.entries(obj).map(([key, value]) => {
      if (typeof value === 'string') {
        return `${key}: '${value}'`;
      }
      if (Array.isArray(value)) {
        return `${key}: ${stringifyObject(value)}`;
      }
      if (typeof value === 'object' && value !== null) {
        return `${key}: ${stringifyObject(value)}`;
      }
      return `${key}: ${value}`;
    });
    return `{${entries.join(', ')}}`;
  }
  
  return String(obj);
}

/**
 * Helper to parse existing middleware.ts file content
 */
export function parseExistingMiddleware(content: string): MiddlewareConfig {
  // Extract imports
  const imports = (content.match(/import.*?;/g) || [])
    .map(imp => imp.trim());
  
  // Extract schemas
  const schemas: Schema[] = [];
  const schemaMatches = content.match(/export const (\w+)\s*=\s*([^;]+);/g) || [];
  schemaMatches.forEach(match => {
    const [_, name, definition] = match.match(/export const (\w+)\s*=\s*([^;]+);/) || [];
    if (name && definition) {
      schemas.push({ name, definition: definition.trim() });
    }
  });
  
  // Extract routes
  const routes: Route[] = [];
  const routeSection = content.match(/routes:\s*\[([\s\S]*?)\s*\]\s*\}/)?.[1] || '';
  
  // Split route section into individual route objects
  const routeBlocks = routeSection.split(/},?\s*(?={)/)
    .map(block => block.trim().replace(/}$/, ''))
    .filter(block => block.includes('matcher'));
  
  for (const block of routeBlocks) {
    try {
      // Extract route properties
      const matcherMatch = block.match(/matcher:\s*"([^"]+)"/);
      const methodMatch = block.match(/method:\s*"([^"]+)"/);
      const middlewaresMatch = block.match(/middlewares:\s*\[([\s\S]*?)(?=\s*\])/);
      
      if (!matcherMatch || !methodMatch || !middlewaresMatch) continue;
      
      const [_, matcher] = matcherMatch;
      const [__, method] = methodMatch;
      const [___, middlewaresStr] = middlewaresMatch;
      
      // Parse middlewares
      const middlewares: Middleware[] = [];
      let currentMiddleware = '';
      let depth = 0;
      let inString = false;
      let stringChar = '';
      let escaped = false;
      let inObject = false;
      let objectDepth = 0;
      
      for (let i = 0; i < middlewaresStr.length; i++) {
        const char = middlewaresStr[i];
        
        // Handle escaping
        if (char === '\\' && !escaped) {
          escaped = true;
          currentMiddleware += char;
          continue;
        }
        
        // Handle string boundaries
        if ((char === '"' || char === "'") && !escaped) {
          if (!inString) {
            inString = true;
            stringChar = char;
          } else if (char === stringChar) {
            inString = false;
            stringChar = '';
          }
        }
        
        // Only count depth when not in a string
        if (!inString) {
          if (char === '(' || char === '[') {
            depth++;
          } else if (char === ')' || char === ']') {
            depth--;
          } else if (char === '{') {
            if (!inObject) {
              inObject = true;
            }
            objectDepth++;
          } else if (char === '}') {
            objectDepth--;
            if (objectDepth === 0) {
              inObject = false;
            }
          }
        }
        
        // Add character to current middleware
        currentMiddleware += char;
        
        // Handle middleware boundaries
        if (depth === 0 && !inString && !inObject) {
          if (char === ')' || char === ',') {
            const middleware = parseMiddleware(currentMiddleware.trim());
            if (middleware) {
              middlewares.push(middleware);
            }
            currentMiddleware = '';
          }
        }
        
        escaped = false;
      }
      
      // Add any remaining middleware
      if (currentMiddleware.trim()) {
        const middleware = parseMiddleware(currentMiddleware.trim());
        if (middleware) {
          middlewares.push(middleware);
        }
      }
      
      if (middlewares.length > 0) {
        routes.push({ matcher, method, middlewares });
      }
    } catch (e) {
      console.warn('Failed to parse route block:', block);
    }
  }
  
  return {
    routes,
    schemas: {
      imports,
      schemas
    }
  };
}

/**
 * Helper to parse a middleware function call
 */
function parseMiddleware(str: string): Middleware | null {
  const match = str.match(/^(\w+)\(([\s\S]*)/);
  if (!match) return null;
  
  const [_, name, rest] = match;
  const argsStr = rest.slice(0, -1); // Remove trailing )
  
  // Special handling for unlessPath
  if (name === 'unlessPath') {
    const [pattern, innerMiddleware] = splitArgs(argsStr);
    if (!pattern || !innerMiddleware) return null;
    
    const inner = parseMiddleware(innerMiddleware.trim());
    if (!inner) return null;
    
    return {
      name,
      args: [
        // Parse regex pattern
        pattern.trim().startsWith('/') ? new RegExp(pattern.slice(1, -1)) : pattern,
        inner
      ]
    };
  }
  
  // Handle normal middleware
  return {
    name,
    args: parseArgs(argsStr)
  };
}

/**
 * Helper to split function arguments
 */
function splitArgs(str: string): string[] {
  const args: string[] = [];
  let current = '';
  let depth = 0;
  let inString = false;
  let stringChar = '';
  let escaped = false;
  let inObject = false;
  let objectDepth = 0;
  
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    
    // Handle escaping
    if (char === '\\' && !escaped) {
      escaped = true;
      current += char;
      continue;
    }
    
    // Handle string boundaries
    if ((char === '"' || char === "'") && !escaped) {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
        stringChar = '';
      }
    }
    
    // Only count depth when not in a string
    if (!inString) {
      if (char === '(' || char === '[') {
        depth++;
      } else if (char === ')' || char === ']') {
        depth--;
      } else if (char === '{') {
        if (!inObject) {
          inObject = true;
        }
        objectDepth++;
      } else if (char === '}') {
        objectDepth--;
        if (objectDepth === 0) {
          inObject = false;
        }
      }
    }
    
    // Add character to current argument
    current += char;
    
    // Handle argument boundaries
    if (depth === 0 && !inString && !inObject && char === ',') {
      args.push(current.slice(0, -1).trim());
      current = '';
    }
    
    escaped = false;
  }
  
  if (current.trim()) {
    args.push(current.trim());
  }
  
  return args;
}

/**
 * Helper to parse function arguments
 */
function parseArgs(argsStr: string): any[] {
  return splitArgs(argsStr).map(arg => {
    const trimmed = arg.trim();
    
    // If it looks like a variable name, return as is
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed)) {
      return trimmed;
    }
    
    try {
      // Try to evaluate the argument
      const evaluated = Function(`return ${trimmed}`)();
      
      // If it's a string that looks like an object, try to parse it
      if (typeof evaluated === 'string' && evaluated.startsWith('{')) {
        try {
          // Convert single quotes to double quotes and ensure proper nesting
          const normalized = evaluated
            .replace(/'/g, '"')
            // Add quotes around property names
            .replace(/(\w+):/g, '"$1":')
            // Handle arrays with single quotes
            .replace(/\[([^\]]*)\]/g, (match, content) => {
              const items = content.split(/,\s*/)
                .map(s => s.trim())
                .map(s => s.replace(/^['"]|['"]$/g, ''))
                .map(s => `"${s}"`);
              return `[${items.join(',')}]`;
            })
            // Ensure proper object closure
            .replace(/}(?!\s*[,}])/g, '},')
            .replace(/,\s*$/g, '')
            .replace(/}\s*$/g, '}');
          return JSON.parse(normalized);
        } catch (e) {
          return evaluated;
        }
      }
      
      return evaluated;
    } catch (e) {
      // If evaluation fails, try to clean up the string
      if (trimmed.startsWith('{')) {
        try {
          // Convert single quotes to double quotes and ensure proper nesting
          const normalized = trimmed
            .replace(/'/g, '"')
            // Add quotes around property names
            .replace(/(\w+):/g, '"$1":')
            // Handle arrays with single quotes
            .replace(/\[([^\]]*)\]/g, (match, content) => {
              const items = content.split(/,\s*/)
                .map(s => s.trim())
                .map(s => s.replace(/^['"]|['"]$/g, ''))
                .map(s => `"${s}"`);
              return `[${items.join(',')}]`;
            })
            // Ensure proper object closure
            .replace(/}(?!\s*[,}])/g, '},')
            .replace(/,\s*$/g, '')
            .replace(/}\s*$/g, '}');
          return JSON.parse(normalized);
        } catch (e) {
          return trimmed;
        }
      }
      return trimmed;
    }
  });
}

/**
 * Helper to merge routes, removing duplicates
 */
function mergeRoutes(existing: Route[], newRoutes: Route[]): Route[] {
  const merged = [...existing];
  const seen = new Set(existing.map(r => `${r.method}:${r.matcher}`));
  
  for (const route of newRoutes) {
    const key = `${route.method}:${route.matcher}`;
    if (!seen.has(key)) {
      merged.push(route);
      seen.add(key);
    }
  }
  
  return merged;
}

/**
 * Helper to merge schemas
 */
function mergeSchemas(existing: SchemaConfig, newSchemas: SchemaConfig): SchemaConfig {
  // Deduplicate imports while maintaining order
  const importSet = new Set<string>();
  const imports = [...existing.imports, ...newSchemas.imports]
    .map(normalizeImport)
    .filter(imp => {
      if (importSet.has(imp)) return false;
      importSet.add(imp);
      return true;
    })
    .sort((a, b) => {
      // Sort framework imports first
      const aIsFramework = a.includes('@medusajs/') || a.includes('zod');
      const bIsFramework = b.includes('@medusajs/') || b.includes('zod');
      if (aIsFramework !== bIsFramework) {
        return aIsFramework ? -1 : 1;
      }
      return a.localeCompare(b);
    });

  // Deduplicate schemas
  const schemas = [...existing.schemas];
  const seen = new Set(existing.schemas.map(s => s.name));
  
  for (const schema of newSchemas.schemas) {
    if (!seen.has(schema.name)) {
      schemas.push(schema);
      seen.add(schema.name);
    }
  }
  
  return { imports, schemas };
} 