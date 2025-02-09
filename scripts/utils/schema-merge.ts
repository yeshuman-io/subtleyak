type Schema = {
  name: string;
  definition: string;
};

type SchemaSet = {
  imports: string[];
  schemas: Schema[];
};

/**
 * Helper to find schema dependencies in a definition
 */
function findSchemaDependencies(definition: string, allSchemas: Schema[]): string[] {
  return allSchemas
    .map(s => s.name)
    .filter(name => definition.includes(name));
}

/**
 * Helper to sort schemas based on dependencies
 */
function sortSchemasByDependencies(schemas: Schema[]): Schema[] {
  const result: Schema[] = [];
  const visited = new Set<string>();
  
  function visit(schema: Schema) {
    if (visited.has(schema.name)) return;
    
    const deps = findSchemaDependencies(schema.definition, schemas);
    deps.forEach(dep => {
      const depSchema = schemas.find(s => s.name === dep);
      if (depSchema && !visited.has(dep)) {
        visit(depSchema);
      }
    });
    
    visited.add(schema.name);
    result.push(schema);
  }
  
  schemas.forEach(visit);
  return result;
}

/**
 * Merges two sets of schemas with the following rules:
 * 1. Imports are deduplicated
 * 2. If schema names conflict, newer definition takes precedence
 * 3. Schemas are ordered by dependencies
 * 4. Framework imports come first
 */
export function mergeSchemas(existing: SchemaSet, newSchemas: SchemaSet): SchemaSet {
  // Combine and deduplicate imports
  const importSet = new Set([...existing.imports, ...newSchemas.imports]);
  
  // Sort imports - framework imports first
  const sortedImports = Array.from(importSet).sort((a, b) => {
    const aIsFramework = a.includes('@medusajs/') || a.includes('zod');
    const bIsFramework = b.includes('@medusajs/') || b.includes('zod');
    if (aIsFramework !== bIsFramework) {
      return aIsFramework ? -1 : 1;
    }
    return a.localeCompare(b);
  });
  
  // Combine schemas, with new schemas overriding existing ones
  const schemaMap = new Map<string, Schema>();
  
  // Add existing schemas
  existing.schemas.forEach(schema => {
    schemaMap.set(schema.name, schema);
  });
  
  // Override/add new schemas
  newSchemas.schemas.forEach(schema => {
    schemaMap.set(schema.name, schema);
  });
  
  // Convert to array and sort by dependencies
  const allSchemas = sortSchemasByDependencies(Array.from(schemaMap.values()));
  
  return {
    imports: sortedImports,
    schemas: allSchemas
  };
} 