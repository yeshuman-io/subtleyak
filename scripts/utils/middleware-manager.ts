import { format } from 'prettier';
import fs from 'fs/promises';

export interface RouteDefinition {
  matcher: string;
  method: string;
  middlewares: MiddlewareDefinition[];
}

export interface MiddlewareDefinition {
  name: string;
  args: any[];
}

export interface SchemaDefinition {
  name: string;
  definition: string;
}

export class MiddlewareManager {
  private routes: RouteDefinition[] = [];
  private imports = new Map<string, Set<string>>();
  private schemas = new Map<string, string>();

  constructor(
    existingContent?: string
  ) {
    if (existingContent) {
      this.parseExisting(existingContent);
    }
  }

  private parseExisting(content: string) {
    this.imports = this.extractImports(content);
    this.schemas = this.extractSchemas(content);
    
    // Extract routes using regex
    const routesMatch = content.match(/routes:\s*\[([\s\S]*?)\s*\]\s*}/);
    if (routesMatch) {
      const routesContent = routesMatch[1];
      const routeRegex = /{[\s\S]*?matcher:\s*["']([^"']+)["'][\s\S]*?method:\s*["']([^"']+)["'][\s\S]*?middlewares:\s*\[([\s\S]*?)\][\s\S]*?}/g;
      
      let match;
      while ((match = routeRegex.exec(routesContent)) !== null) {
        const [_, matcher, method, middlewaresStr] = match;
        const middlewares = this.parseMiddlewares(middlewaresStr);
        
        if (middlewares.length > 0) {  // Only add routes with valid middlewares
          this.routes.push({
            matcher,
            method,
            middlewares
          });
        }
      }
    }
  }

  private parseMiddlewares(middlewaresStr: string): MiddlewareDefinition[] {
    const middlewares: MiddlewareDefinition[] = [];
    const middlewareRegex = /(\w+)\s*\(([\s\S]*?)\)/g;
    let match;

    while ((match = middlewareRegex.exec(middlewaresStr)) !== null) {
      const [_, name, argsStr] = match;
      
      // Handle nested middleware (like unlessPath)
      if (name === 'unlessPath') {
        const [pattern, nestedMiddleware] = this.parseUnlessPathArgs(argsStr);
        middlewares.push({
          name: 'unlessPath',
          args: [pattern, nestedMiddleware]
        });
      } else {
        // Handle regular middleware
        const args = this.parseArgs(argsStr);
        // Normalize schema names in args if they end with Schema
        const normalizedArgs = args.map(arg => {
          if (typeof arg === 'string' && arg.endsWith('Schema')) {
            return this.normalizeSchemaName(arg);
          }
          return arg;
        });
        middlewares.push({ name, args: normalizedArgs });
      }
    }

    return middlewares;
  }

  private parseUnlessPathArgs(argsStr: string): [string, MiddlewareDefinition] {
    const parts = argsStr.split(',').map(p => p.trim());
    const pattern = parts[0];
    const nestedStr = parts.slice(1).join(',');
    
    // Parse the nested middleware
    const nestedMatch = nestedStr.match(/{\s*name:\s*['"](\w+)['"],\s*args:\s*\[(.*)\]\s*}/);
    if (nestedMatch) {
      const [_, name, argsStr] = nestedMatch;
      const args = this.parseArgs(argsStr);
      return [pattern, { name, args }];
    }
    
    throw new Error('Invalid unlessPath middleware format');
  }

  private parseArgs(argsStr: string): any[] {
    return argsStr.split(',')
      .map(arg => arg.trim())
      .filter(arg => arg)
      .map(arg => {
        try {
          return JSON.parse(arg);
        } catch {
          return arg;
        }
      });
  }

  addImport(path: string, name: string) {
    const existingImports = this.imports.get(path) || new Set<string>();
    existingImports.add(name);
    this.imports.set(path, existingImports);
  }

  addSchema(name: string, definition: string) {
    const normalizedName = this.normalizeSchemaName(name);
    this.schemas.set(normalizedName, definition);
  }

  addRoute(route: RouteDefinition) {
    // Validate route structure
    this.validateRoute(route);
    
    // Check for duplicates and replace if exists
    const existingIndex = this.routes.findIndex(r => 
      r.matcher === route.matcher && r.method === route.method
    );
    
    if (existingIndex >= 0) {
      this.routes[existingIndex] = route;
    } else {
      // Add new route in correct position based on specificity
      const insertIndex = this.findInsertIndex(route);
      this.routes.splice(insertIndex >= 0 ? insertIndex : this.routes.length, 0, route);
    }
  }

  private validateRoute(route: RouteDefinition) {
    if (!route.matcher || !route.method || !Array.isArray(route.middlewares)) {
      throw new Error('Invalid route definition');
    }
  }

  private findInsertIndex(route: RouteDefinition): number {
    // Sort by specificity - more specific routes first
    // 1. Routes with path params (:id)
    // 2. Longer paths
    // 3. POST before GET
    return this.routes.findIndex(existing => {
      const newSpecificity = this.calculateSpecificity(route);
      const existingSpecificity = this.calculateSpecificity(existing);
      return newSpecificity > existingSpecificity;
    });
  }

  private calculateSpecificity(route: RouteDefinition): number {
    let score = 0;
    // More segments = higher specificity
    score += route.matcher.split('/').length * 10;
    // Path parameters decrease specificity slightly
    score -= (route.matcher.match(/:[^/]+/g) || []).length;
    // POST routes slightly more specific than GET
    score += route.method === 'POST' ? 1 : 0;
    return score;
  }

  async generateFile(): Promise<string> {
    const importSection = this.generateImports();
    
    // Generate schemas
    const schemaSection = Array.from(this.schemas.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, definition]) => `export const ${name} = ${definition};`)
      .join('\n\n');

    // Generate routes with proper grouping
    const routeGroups = this.groupRoutes();
    const routesStr = Object.entries(routeGroups)
      .map(([group, routes]) => `    // ${group}\n    ${routes.join(',\n    ')}`)
      .join(',\n\n');

    // Combine everything
    const content = `// This file is auto-generated and will be overwritten by subsequent generations
// Manual changes should be made to the generator templates instead

${importSection}

${schemaSection}

export default defineMiddlewares({
  routes: [
${routesStr}
  ],
});`;

    // Format with prettier
    return format(content, {
      parser: 'typescript',
      semi: true,
      singleQuote: true,
      trailingComma: 'es5',
    });
  }

  private groupRoutes(): Record<string, string[]> {
    const groups: Record<string, RouteDefinition[]> = {
      'GET routes - specific first': [],
      'CREATE routes - specific first': [],
      'UPDATE routes - specific first': [],
    };

    for (const route of this.routes) {
      if (route.method === 'GET') {
        groups['GET routes - specific first'].push(route);
      } else if (route.method === 'POST' && route.matcher.includes('/:id')) {
        groups['UPDATE routes - specific first'].push(route);
      } else {
        groups['CREATE routes - specific first'].push(route);
      }
    }

    // Convert routes to strings
    return Object.fromEntries(
      Object.entries(groups)
        .filter(([_, routes]) => routes.length > 0)
        .map(([group, routes]) => [
          group,
          routes.map(route => this.stringifyRoute(route))
        ])
    );
  }

  private stringifyRoute(route: RouteDefinition): string {
    const middlewares = route.middlewares
      .map(m => this.stringifyMiddleware(m))
      .join(', ');

    return `{
      matcher: "${route.matcher}",
      method: "${route.method}",
      middlewares: [${middlewares}]
    }`;
  }

  private stringifyMiddleware(middleware: MiddlewareDefinition): string {
    if (middleware.name === 'unlessPath') {
      const [pattern, nestedMiddleware] = middleware.args;
      return `unlessPath(${pattern}, ${this.stringifyMiddleware(nestedMiddleware as MiddlewareDefinition)})`;
    }

    const args = middleware.args.map(arg => {
      if (typeof arg === 'string') {
        if (arg.endsWith('Schema')) {
          // Normalize schema references
          return this.normalizeSchemaName(arg);
        }
        if (arg.includes('{') || arg.includes('(')) {
          // It's probably an object literal or function call string, return as is
          return arg;
        }
        if (!arg.startsWith('"')) {
          // It's probably a reference to a schema or other identifier
          return arg;
        }
      }
      return JSON.stringify(arg);
    }).join(', ');

    return `${middleware.name}(${args})`;
  }

  async writeFile(path: string): Promise<void> {
    const content = await this.generateFile();
    await fs.writeFile(path, content, 'utf-8');
  }

  private normalizeSchemaName(name: string | undefined | null): string {
    if (!name) return '';
    
    // Only normalize schema names (ending with Schema)
    if (!name.endsWith('Schema')) return name;
    
    // Convert to PascalCase and ensure consistent casing
    return name.replace(/([a-z])([A-Z])/g, '$1$2')
              .split(/[^a-zA-Z0-9]+/)
              .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
              .join('');
  }

  private extractSchemas(content: string): Map<string, string> {
    const schemas = new Map<string, string>();
    const schemaRegex = /export const (\w+Schema)\s*=\s*([^;]+);/g;
    let match;

    while ((match = schemaRegex.exec(content)) !== null) {
      const [_, name, definition] = match;
      const normalizedName = this.normalizeSchemaName(name);
      if (!schemas.has(normalizedName)) {
        schemas.set(normalizedName, definition.trim());
      }
    }

    return schemas;
  }

  private extractImports(content: string): Map<string, Set<string>> {
    const imports = new Map<string, Set<string>>();
    const importRegex = /import\s*{([^}]+)}\s*from\s*['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const [_, names, path] = match;
      const importNames = names.split(',')
        .map(name => name.trim())
        .filter(name => name)
        // Handle 'as' aliases and remove any kebab-case parts
        .map(name => {
          const [baseName] = name.split(' as ');
          return baseName.trim().replace(/-\w+/g, '');
        });

      const existingImports = imports.get(path) || new Set<string>();
      importNames.forEach(name => existingImports.add(name));
      imports.set(path, existingImports);
    }

    return imports;
  }

  private generateImports(): string {
    const lines: string[] = [];
    
    // Framework imports first
    const frameworkPath = '@medusajs/framework/http';
    if (this.imports.has(frameworkPath)) {
      const imports = [...new Set([...this.imports.get(frameworkPath)!])].sort();
      lines.push(`import { ${imports.join(', ')} } from '${frameworkPath}';`);
    }

    // Then validator imports
    const validatorPath = '@medusajs/medusa/api/utils/validators';
    if (this.imports.has(validatorPath)) {
      const imports = [...new Set([...this.imports.get(validatorPath)!])].sort();
      lines.push(`import { ${imports.join(', ')} } from '${validatorPath}';`);
    }

    // Then zod
    lines.push(`import { z } from 'zod';`);

    // Then all other imports, sorted by path
    const otherImports = [...this.imports.entries()]
      .filter(([path]) => !path.includes('@medusajs') && path !== 'zod')
      .sort(([a], [b]) => a.localeCompare(b));

    for (const [path, names] of otherImports) {
      // Group similar imports by their base name (ignoring case and kebab-case parts)
      const importGroups = new Map<string, Set<string>>();
      
      for (const name of names) {
        // Remove kebab-case parts for grouping
        const baseKey = name.replace(/-\w+/g, '').toLowerCase();
        const group = importGroups.get(baseKey) || new Set<string>();
        group.add(name);
        importGroups.set(baseKey, group);
      }

      // Sort and deduplicate within each group
      const sortedNames = [...importGroups.values()]
        .map(group => [...group].sort((a, b) => {
          // Sort by length first (shorter names first)
          if (a.length !== b.length) return a.length - b.length;
          // Then by case-sensitive string comparison
          return a.localeCompare(b);
        }))
        .flat();

      if (sortedNames.length > 4) {
        // Multi-line for many imports
        lines.push(`import {\n  ${sortedNames.join(',\n  ')},\n} from '${path}';`);
      } else {
        lines.push(`import { ${sortedNames.join(', ')} } from '${path}';`);
      }
    }

    return lines.join('\n');
  }
} 