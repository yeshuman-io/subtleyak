import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import { format } from 'prettier';

export interface RouteDefinition {
  matcher: string;
  method: string;
  middlewares: MiddlewareDefinition[];
}

export interface MiddlewareDefinition {
  name: string;
  args: any[];
}

export class MiddlewareManager {
  private ast: t.File;
  private importDeclarations: Map<string, Set<string>> = new Map();
  private routes: Map<string, t.ObjectExpression> = new Map();
  private schemaDefinitions: Map<string, t.VariableDeclaration | t.ExportNamedDeclaration> = new Map();

  constructor(existingContent?: string) {
    if (existingContent) {
      this.ast = parse(existingContent, {
        sourceType: 'module',
        plugins: ['typescript']
      });
      this.extractExistingContent();
    } else {
      this.ast = parse('', { sourceType: 'module', plugins: ['typescript'] });
    }
  }

  private extractExistingContent() {
    traverse(this.ast, {
      ImportDeclaration: (path) => {
        const source = path.node.source.value;
        const specifiers = new Set(
          path.node.specifiers.map(spec => 
            t.isImportSpecifier(spec) ? spec.imported.name : spec.local.name
          )
        );
        this.importDeclarations.set(source, specifiers);
      },

      VariableDeclaration: (path) => {
        // Extract schema definitions
        if (path.node.declarations.length === 1) {
          const decl = path.node.declarations[0];
          if (t.isIdentifier(decl.id) && decl.id.name.endsWith('Schema')) {
            this.schemaDefinitions.set(decl.id.name, path.node);
          }
        }
      },

      CallExpression: (path) => {
        if (
          t.isIdentifier(path.node.callee) && 
          path.node.callee.name === 'defineMiddlewares'
        ) {
          const arg = path.node.arguments[0];
          if (t.isObjectExpression(arg)) {
            const routesProp = arg.properties.find(p => 
              t.isObjectProperty(p) && 
              t.isIdentifier(p.key) && 
              p.key.name === 'routes'
            ) as t.ObjectProperty | undefined;

            if (routesProp && t.isArrayExpression(routesProp.value)) {
              routesProp.value.elements.forEach(elem => {
                if (t.isObjectExpression(elem)) {
                  const matcher = this.getPropertyValue(elem, 'matcher');
                  const method = this.getPropertyValue(elem, 'method');
                  if (matcher && method) {
                    this.routes.set(`${method}:${matcher}`, elem);
                  }
                }
              });
            }
          }
        }
      }
    });
  }

  private getPropertyValue(obj: t.ObjectExpression, key: string): string | null {
    const prop = obj.properties.find(p => {
      if (!t.isObjectProperty(p)) return false;
      if (!t.isIdentifier(p.key)) return false;
      return p.key.name === key;
    }) as t.ObjectProperty | undefined;

    if (prop && t.isStringLiteral(prop.value)) {
      return prop.value.value;
    }
    return null;
  }

  addImport(source: string, name: string) {
    if (!this.importDeclarations.has(source)) {
      this.importDeclarations.set(source, new Set());
    }
    this.importDeclarations.get(source)!.add(name);
  }

  addRoute(route: RouteDefinition) {
    const routeAst = t.objectExpression([
      t.objectProperty(
        t.identifier('matcher'),
        t.stringLiteral(route.matcher)
      ),
      t.objectProperty(
        t.identifier('method'),
        t.stringLiteral(route.method)
      ),
      t.objectProperty(
        t.identifier('middlewares'),
        t.arrayExpression(
          route.middlewares.map(m => 
            t.objectExpression([
              t.objectProperty(
                t.identifier('name'),
                t.stringLiteral(m.name)
              ),
              t.objectProperty(
                t.identifier('args'),
                Array.isArray(m.args) 
                  ? t.arrayExpression(m.args.map(arg => this.valueToAst(arg)))
                  : this.valueToAst(m.args)
              )
            ])
          )
        )
      )
    ]);

    const key = `${route.method}:${route.matcher}`;
    this.routes.set(key, routeAst);
  }

  private valueToAst(value: any): t.Expression {
    if (value && typeof value === 'object' && 'type' in value && value.type === 'identifier') {
      return t.identifier(value.value);
    }
    if (typeof value === 'string') {
      if (value.includes('.')) {
        // Handle dotted paths as member expressions
        const parts = value.split('.');
        return parts.reduce((acc, part, idx) => {
          if (idx === 0) return t.identifier(part);
          return t.memberExpression(acc, t.identifier(part));
        }, undefined as any);
      }
      return t.stringLiteral(value);
    }
    if (typeof value === 'number') {
      return t.numericLiteral(value);
    }
    if (typeof value === 'boolean') {
      return t.booleanLiteral(value);
    }
    if (Array.isArray(value)) {
      return t.arrayExpression(value.map(v => this.valueToAst(v)));
    }
    if (value === null) {
      return t.nullLiteral();
    }
    if (typeof value === 'object') {
      return t.objectExpression(
        Object.entries(value).map(([k, v]) =>
          t.objectProperty(
            t.identifier(k),
            this.valueToAst(v)
          )
        )
      );
    }
    // For undefined or function references, use identifier
    if (typeof value === 'undefined') {
      return t.identifier('undefined');
    }
    return t.identifier(String(value));
  }

  private sortRoutes(): t.ObjectExpression[] {
    return Array.from(this.routes.values())
      .sort((a, b) => {
        const aMatch = this.getPropertyValue(a, 'matcher')!;
        const bMatch = this.getPropertyValue(b, 'matcher')!;
        const aMethod = this.getPropertyValue(a, 'method')!;
        const bMethod = this.getPropertyValue(b, 'method')!;

        // GET routes first
        if (aMethod !== bMethod) {
          return aMethod === 'GET' ? -1 : 1;
        }

        // More specific routes first (more segments)
        const aDepth = (aMatch.match(/\//g) || []).length;
        const bDepth = (bMatch.match(/\//g) || []).length;
        if (aDepth !== bDepth) {
          return bDepth - aDepth;
        }

        // Then by path params
        const aParams = (aMatch.match(/:/g) || []).length;
        const bParams = (bMatch.match(/:/g) || []).length;
        if (aParams !== bParams) {
          return bParams - aParams;
        }

        // Finally alphabetically
        return aMatch.localeCompare(bMatch);
      });
  }

  generateAst(): t.File {
    // Generate imports
    const imports = Array.from(this.importDeclarations.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([source, names]) => 
        t.importDeclaration(
          Array.from(names).sort().map(name =>
            t.importSpecifier(
              t.identifier(name),
              t.identifier(name)
            )
          ),
          t.stringLiteral(source)
        )
      );

    // Generate schema definitions
    const schemas = Array.from(this.schemaDefinitions.values());

    // Generate middleware definition
    const middlewaresDef = t.exportDefaultDeclaration(
      t.callExpression(
        t.identifier('defineMiddlewares'),
        [
          t.objectExpression([
            t.objectProperty(
              t.identifier('routes'),
              t.arrayExpression(this.sortRoutes())
            )
          ])
        ]
      )
    );

    const program = t.program([...imports, ...schemas, middlewaresDef]);
    
    // Add file comment
    const commentText = [
      'This file is auto-generated and will be overwritten by subsequent generations',
      'Manual changes should be made to the generator templates instead'
    ].join('\n');
    
    if (imports.length > 0) {
      t.addComment(imports[0], 'leading', commentText);
    } else {
      t.addComment(middlewaresDef, 'leading', commentText);
    }

    return t.file(program);
  }

  async generateFile(): Promise<string> {
    const ast = this.generateAst();
    const { code } = generate(ast, {
      retainLines: true,
      compact: false,
      comments: true
    });

    return format(code, {
      parser: 'typescript',
      singleQuote: true,
      trailingComma: 'es5',
    });
  }

  // Add method to add schema definitions
  addSchemaDefinition(name: string, expression: t.Expression, shouldExport: boolean = false) {
    const declaration = t.variableDeclaration('const', [
      t.variableDeclarator(t.identifier(name), expression)
    ]);
    
    if (shouldExport) {
      const exportDecl = t.exportNamedDeclaration(declaration);
      this.schemaDefinitions.set(name, exportDecl);
    } else {
      this.schemaDefinitions.set(name, declaration);
    }
  }
} 