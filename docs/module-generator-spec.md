# Medusa Module Generator Specification

## Overview
A template-based code generation system for Medusa modules using Handlebars templates that mirror the output file structure, with support for watching and automatic regeneration.

## Introduction

The module generator is designed to manage the complexity of creating and maintaining a large number of interconnected files. For a typical project with 4 modules containing 4-6 models each, the generator manages approximately 252 files:

Per model (12 files):
1. Model definition:
   - `src/modules/[module]/models/[model].ts`

2. API endpoints:
   - `src/api/admin/[module]/[model]/route.ts`
   - `src/api/admin/[module]/[model]/[id]/route.ts`

3. Admin UI:
   - `src/admin/routes/[module]/[model]/page.tsx`
   - `src/admin/routes/[module]/[model]/create/[model]-create.tsx`
   - `src/admin/routes/[module]/[model]/edit/[model]-edit.tsx`

4. Workflows:
   - `src/workflows/create-[model].ts`
   - `src/workflows/update-[model].ts`

5. Tests:
   - `integration-tests/http/[module]/[model].spec.ts`
   - `integration-tests/http/[module]/[model]-workflows.spec.ts`
   - `integration-tests/http/[module]/__fixtures__/[model].json`

6. Seed data:
   - `scripts/seed/[module]/seed-[model].ts`

Per module shared files (3 files):
- `src/modules/[module]/service.ts`
- `src/modules/[module]/index.ts`
- `src/api/admin/[module]/validators.ts`

Total calculation:
```
4 modules × (
  3 shared files + 
  (5 models average × 12 files per model)
) = 
4 × (3 + 60) = 
4 × 63 = 
252 total files
```

This scale of file management makes automation essential for:
1. Maintaining consistency across files
2. Quickly updating patterns and structures
3. Reducing human error
4. Streamlining maintenance
5. Accelerating development

## Directory Structure

```
scripts/
├── templates/                    # Handlebars templates mirroring output structure
│   ├── src/
│   │   ├── modules/
│   │   │   └── [module.plural]/           # Uses config.plural (e.g. "wipers")
│   │   │       ├── models/
│   │   │       │   ├── [model.singular].hbs    # Uses model.singular for parent (e.g. "wiper")
│   │   │       │   └── [model.name].hbs        # Uses model.name for child (e.g. "wiper-kit")
│   │   │       ├── service.hbs
│   │   │       └── index.hbs
│   │   ├── api/
│   │   │   └── admin/
│   │   │       └── [module.plural]/
│   │   │           ├── [model.plural]/          # Parent routes using model.plural
│   │   │           │   ├── validators.hbs
│   │   │           │   ├── route.hbs
│   │   │           │   └── [id]/
│   │   │           │       └── route.hbs
│   │   │           └── [parent.routePrefix]/    # Child routes using parent.routePrefix
│   │   │               ├── validators.hbs
│   │   │               ├── route.hbs
│   │   │               └── [id]/
│   │   │                   └── route.hbs
│   │   ├── admin/
│   │   │   └── routes/
│   │   │       └── [module.plural]/
│   │   │           ├── [model.plural]/          # Parent UI using model.plural
│   │   │           │   ├── page.hbs
│   │   │           │   ├── create/
│   │   │           │   │   └── [model.singular]-create.hbs
│   │   │           │   └── edit/
│   │   │           │       └── [model.singular]-edit.hbs
│   │   │           └── [parent.routePrefix]/    # Child UI using parent.routePrefix
│   │   │               ├── page.hbs
│   │   │               ├── create/
│   │   │               │   └── [model.name]-create.hbs
│   │   │               └── edit/
│   │   │                   └── [model.name]-edit.hbs
│   │   └── workflows/
│   │       ├── create-[model.singular].hbs      # Parent workflows using singular
│   │       ├── update-[model.singular].hbs
│   │       ├── create-[model.name].hbs          # Child workflows using name
│   │       └── update-[model.name].hbs
│   ├── integration-tests/
│   │   └── http/
│   │       ├── [module.plural]/                 # Module directory using plural
│   │       │   ├── [model.plural].spec.hbs          # Parent tests using plural (e.g. "wipers")
│   │       │   ├── [parent.routePrefix:/-].spec.hbs # Child tests using routePrefix with hyphens (e.g. "wipers-kits")
│   │       │   ├── [model.plural]-workflows.spec.hbs
│   │       │   └── [parent.routePrefix:/-]-workflows.spec.hbs
│   │       └── __fixtures__/
│   │           └── [module.plural]/
│   │               ├── [model.plural].json          # Parent fixtures using plural
│   │               └── [parent.routePrefix:/-].json # Child fixtures using routePrefix with hyphens
│   └── scripts/
│       └── seed/
│           └── [module.plural]/
│               ├── seed-[model.plural].hbs         # Parent seed using plural
│               └── seed-[parent.routePrefix:/-].hbs # Child seed using routePrefix with hyphens
├── types/                       # Type definitions for the generator system
│   ├── config.ts               # Core configuration types (ModuleConfig, ModelConfig, etc.)
│   └── templates.ts            # Template system types
├── utils/                      # Shared utilities
│   ├── template-helpers.ts     # Handlebars helpers
│   └── path-utils.ts          # Path manipulation utilities
├── generate-module.ts          # Core generation logic
├── watch.ts                    # Template watching functionality
├── watch-all.ts               # Multi-module watch orchestrator
└── modules/                    # Concrete module configurations
    ├── generate-wiper.ts       # Example: Wiper module configuration
    └── generate-vehicle-series.ts # Example: Vehicle series configuration
```

For example, given this wiper config:
```typescript
const config = {
  moduleName: "wipers",     // Module name in plural form, used for directory structure
  singular: "wiper",        // Singular form of the module name
  plural: "wipers",         // Plural form of the module name (same as moduleName)
  models: [
    {
      name: "wiper",        // Parent model name matches module singular
      singular: "wiper",    // Singular form for UI/routes
      plural: "wipers",     // Plural form for UI/routes
      isParent: true,       // Indicates this is the parent model for the module
      fields: [/* ... */]
    },
    {
      name: "wiper-kit",    // Child model prefixed with module singular
      singular: "kit",      // Singular form for UI/routes
      plural: "kits",       // Plural form for UI/routes
      parent: {
        model: "Wiper",     // References the parent model
        routePrefix: "wipers/kits"  // Used for API routes and file paths
      },
      fields: [/* ... */]
    }
  ]
};
```

The module configuration determines:
1. Module directory: `src/modules/wipers/` (from moduleName)
2. Parent model name: Should be prefixed with module singular ("wiper" for wipers)
3. Child model naming: Should be prefixed with module singular ("wiper-kit" for wipers)
4. Route structure:
   - Parent routes: `/admin/wipers/` (from moduleName)
   - Child routes: `/admin/wipers/kits/` (from parent.routePrefix)
5. Generated files:
   ```
   src/modules/wipers/                     # Module directory (from config.plural)
   ├── models/
   │   ├── wiper.ts                        # Parent model (from model.name)
   │   └── wiper-kit.ts                    # Child model (from model.name)
   ├── service.ts                          # Module service
   └── index.ts                            # Module entry

   src/api/admin/wipers/                   # API routes (from config.plural)
   ├── route.ts                            # Parent routes
   └── kits/                              # Child routes (from parent.routePrefix)
       └── route.ts

   integration-tests/http/wipers/          # Tests (from config.plural)
   ├── wipers.spec.ts                      # Parent tests (from model.plural)
   └── wipers-kits.spec.ts                # Child tests (from parent.routePrefix)
   ```

And for a vehicle module with makes and models:
```typescript
const config = {
  moduleName: "vehicles",   // Module name in plural form
  singular: "vehicle",      // Singular form of the module name
  plural: "vehicles",       // Plural form of the module name
  models: [
    {
      name: "vehicle-make", // Parent model prefixed with module singular
      singular: "make",
      plural: "makes",
      isParent: true,
      fields: [/* ... */]
    },
    {
      name: "vehicle-model", // Child model prefixed with module singular
      singular: "model",
      plural: "models",
      parent: {
        model: "VehicleMake",
        routePrefix: "makes/models"
      },
      fields: [/* ... */]
    }
  ]
};
```

This produces:
```
src/modules/vehicles/                    # From config.plural
├── models/
│   ├── vehicle-make.ts                  # Parent model (from model.name)
│   └── vehicle-model.ts                 # Child model (from model.name)
└── ...

src/api/admin/vehicles/                  # From config.plural
├── makes/                              # From parent model.plural
│   └── route.ts
└── makes/models/                       # From parent.routePrefix
    └── route.ts

integration-tests/http/vehicles/         # From config.plural
├── makes.spec.ts                       # Parent tests
└── makes-models.spec.ts                # Child tests
```

## Core Types

### Module Configuration
```typescript
type ModuleConfig = {
  name: string;                 // Module name in kebab-case
  plural: string;              // Plural form for routes/directories
  models: ModelConfig[];       // Models in this module
  watch?: {
    enabled?: boolean;         // Enable watch mode
    patterns?: string[];       // Template patterns to watch
    onRegenerate?: () => Promise<void>; // Post-regeneration hook
  };
};

type ModelConfig = {
  name: string;                // Model name in kebab-case
  singular: string;            // Singular form for UI/routes
  plural: string;              // Plural form for UI/routes
  isParent?: boolean;         // Is this a parent model?
  parent?: {                  // Parent model configuration
    model: string;            // Parent model name
    routePrefix: string;      // Route prefix for nested routes
  };
  fields: ModelField[];       // Model fields
};

type ModelField = {
  name: string;               // Field name in snake_case
  type: "string" | "number" | "boolean" | "date";
  required?: boolean;         // Is this field required?
  relation?: {               // Relation configuration
    type: "belongsTo" | "hasMany" | "manyToMany";
    model: string;           // Related model name
    inverse?: string;        // Inverse relation name
  };
};
```

## Template System

### Handlebars Helpers
```typescript
// Template Helpers
Handlebars.registerHelper({
  // Case conversion helpers
  toPascalCase: (str: string) => str.split('-')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join(''),
  
  toSnakeCase: (str: string) => str.replace(/-/g, '_')
    .toLowerCase(),
  
  toCamelCase: (str: string) => str.replace(/-([a-z])/g, 
    g => g[1].toUpperCase()),

  // Path helpers
  relativePath: (from: string, to: string) => path
    .relative(path.dirname(from), to)
    .replace(/\\/g, '/'),

  // Type helpers
  modelType: (field: ModelField) => {
    if (field.relation) return field.relation.model;
    return field.type;
  },

  // Relation helpers
  isRelation: (field: ModelField) => !!field.relation,
  relationPath: (field: ModelField) => 
    toKebabCase(field.relation!.model).toLowerCase()
});
```

### Template Loading
```typescript
async function loadTemplate(
  templatePath: string
): Promise<HandlebarsTemplateDelegate> {
  const fullPath = path.join(TEMPLATES_DIR, templatePath);
  const content = await fs.readFile(fullPath, 'utf-8');
  return Handlebars.compile(content);
}

async function generateFromTemplate(
  templatePath: string,
  outputPath: string,
  data: any,
  replacements: Record<string, string>
): Promise<string> {
  const template = await loadTemplate(templatePath);
  const content = template(data);
  return formatOutput(content);
}
```

## Watch System

For detailed information about the watch system implementation, current status, and planned improvements, see [Watch System Documentation](./watch-system.md).

### Watch Configuration
```typescript
type WatchOptions = {
  templatesDir: string;      // Templates root directory
  outputDir: string;         // Output root directory
  debounceMs?: number;      // Debounce time for regeneration
  onError?: (error: Error) => void; // Error handler
};
```

### Watch Modes
1. **Single Module Watch**
   ```typescript
   // Watch single module
   watchTemplates(moduleConfig, {
     templatesDir: 'scripts/templates',
     outputDir: 'src'
   });
   ```

2. **Multi-Module Watch**
   ```typescript
   // Watch all modules
   watchAll([wiperConfig, vehicleSeriesConfig], {
     templatesDir: 'scripts/templates',
     outputDir: 'src'
   });
   ```

### Regeneration Pipeline
1. Template Change Detection
2. Debounced Regeneration Trigger
3. Template Compilation
4. File Generation
5. Post-Processing (formatting)
6. Custom Hooks
7. Error Handling

## CLI Interface

### Commands
```bash
# Generate single module
npx ts-node scripts/generate-wiper.ts

# Generate with dry run
npx ts-node scripts/generate-wiper.ts --dry-run

# Watch single module
npx ts-node scripts/generate-wiper.ts --watch

# Watch all modules
npx ts-node scripts/watch-all.ts
```

### Options
- `--dry-run`: Show changes without writing files
- `--watch`: Enable watch mode
- `--verbose`: Enable detailed logging
- `--templates-dir`: Custom templates directory
- `--output-dir`: Custom output directory

## Module Configuration Example
```typescript
export const wiperConfig: ModuleConfig = {
  name: "wiper",
  plural: "wipers",
  models: [
    {
      name: "wiper",
      singular: "wiper",
      plural: "wipers",
      isParent: true,
      fields: [
        { 
          name: "name", 
          type: "string",
          required: true 
        },
        { 
          name: "kits",
          type: "string",
          relation: {
            type: "hasMany",
            model: "WiperKit",
            inverse: "wiper"
          }
        }
      ]
    }
  ],
  watch: {
    enabled: true,
    patterns: [
      'src/modules/[module]/models/*.hbs',
      'src/api/admin/[module]/**/*.hbs'
    ],
    onRegenerate: async () => {
      console.log('Wiper module regenerated');
    }
  }
};
```

## Post-Generation Hooks

Post-generation hooks are functions that run after files are generated to perform additional processing, validation, or side effects. These hooks ensure generated code meets quality standards and integrates properly with the existing codebase.

### Available Hooks

1. **Code Formatting**
```typescript
async function formatOutput(
  content: string
): Promise<string> {
  const config = await prettier.resolveConfig(process.cwd());
  return prettier.format(content, {
    ...config,
    parser: 'typescript'
  });
}
```
- Formats generated code using Prettier
- Maintains consistent code style
- Configurable through project's prettier settings
- Runs automatically on all generated files

2. **TypeScript Validation**
```typescript
async function validateGenerated(
  outputPath: string
): Promise<boolean> {
  try {
    await import(outputPath);
    return true;
  } catch (error) {
    return false;
  }
}
```
- Validates TypeScript compilation
- Catches syntax errors early
- Ensures type safety
- Prevents invalid code generation

3. **Import Resolution**
```typescript
async function validateImports(
  content: string,
  filePath: string
): Promise<boolean> {
  const imports = extractImports(content);
  return Promise.all(
    imports.map(imp => resolveImport(imp, filePath))
  ).then(() => true)
  .catch(() => false);
}
```
- Verifies all imports exist
- Checks import path validity
- Prevents broken dependencies
- Supports relative and absolute imports

4. **Custom Module Hooks**
```typescript
type ModuleHooks = {
  beforeGenerate?: () => Promise<void>;
  afterGenerate?: (files: GeneratedFile[]) => Promise<void>;
  onError?: (error: Error) => Promise<void>;
};

interface GeneratedFile {
  path: string;
  content: string;
  type: 'create' | 'modify' | 'delete';
}
```
- Configurable per module
- Run before/after generation
- Handle errors gracefully
- Access to generated files

### Hook Configuration

Hooks can be configured at multiple levels:

1. **Global Level**
```typescript
const globalHooks = {
  formatting: true,
  typeCheck: true,
  importValidation: true,
  customHooks: []
};
```

2. **Module Level**
```typescript
export const wiperConfig: ModuleConfig = {
  // ... other config ...
  hooks: {
    beforeGenerate: async () => {
      await cleanupOldFiles();
    },
    afterGenerate: async (files) => {
      await updateIndexFiles(files);
      await regenerateDocs();
    },
    onError: async (error) => {
      await notifySlack(error);
    }
  }
};
```

3. **Template Level**
```typescript
// In template metadata
{
  "hooks": {
    "skipFormatting": false,
    "requiresTypeCheck": true,
    "customTransform": "scripts/transforms/api-route.js"
  }
}
```

### Hook Execution Pipeline

1. **Pre-Generation Phase**
   - Run `beforeGenerate` hooks
   - Clean up temporary files
   - Prepare output directories

2. **Generation Phase**
   - Generate file content
   - Apply template-specific transforms
   - Format code (if enabled)

3. **Validation Phase**
   - TypeScript validation
   - Import checking
   - Custom validations

4. **Post-Generation Phase**
   - Run `afterGenerate` hooks
   - Update index files
   - Regenerate documentation

5. **Error Handling**
   - Catch and log errors
   - Run error hooks
   - Cleanup on failure

### Best Practices

1. **Hook Performance**
   - Make hooks async when possible
   - Use debouncing for watch mode
   - Cache expensive operations

2. **Error Handling**
   - Provide meaningful error messages
   - Include file context in errors
   - Support partial recovery

3. **Modularity**
   - Keep hooks focused and small
   - Make hooks composable
   - Allow hook configuration

4. **Testing**
   - Unit test individual hooks
   - Integration test hook chains
   - Mock expensive operations

## Error Handling
- Template syntax errors
- File system errors
- Validation errors
- Watch system errors
- Custom hook errors

## Future Enhancements
1. Template inheritance/composition
2. Incremental generation
3. Custom template processors
4. Generated code testing
5. Migration generation
6. Documentation generation
7. Template validation
8. Interactive CLI
9. VSCode extension 

## Test Runner System

```
scripts/
├── tests/                      # Test suite organization
│   ├── __fixtures__/          # Test fixtures and mock data
│   │   ├── configs/           # Sample module configurations
│   │   │   ├── wiper.ts
│   │   │   └── vehicle.ts
│   │   ├── templates/         # Test template files
│   │   └── expected/          # Expected generation outputs
│   ├── __snapshots__/         # Jest snapshots for generated files
│   ├── unit/                  # Unit tests by component
│   │   ├── middleware/        # Middleware-related tests
│   │   │   ├── generator.test.ts
│   │   │   ├── manager.test.ts
│   │   │   └── merge.test.ts
│   │   ├── templates/         # Template system tests
│   │   │   ├── helpers.test.ts
│   │   │   └── loader.test.ts
│   │   └── utils/             # Utility function tests
│   │       ├── path.test.ts
│   │       └── validation.test.ts
│   ├── integration/           # Integration tests
│   │   ├── generation/        # Full generation tests
│   │   │   ├── wiper.test.ts
│   │   │   └── vehicle.test.ts
│   │   └── watch/            # Watch mode tests
│   │       ├── single.test.ts
│   │       └── multi.test.ts
│   └── setup/                 # Test environment setup
│       ├── jest.setup.ts      # Jest configuration
│       └── test-utils.ts      # Common test utilities
```

### Test Configuration
```typescript
// jest.config.ts
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/scripts/tests/setup/jest.setup.ts'],
  testMatch: [
    '<rootDir>/scripts/tests/**/*.test.ts'
  ],
  moduleNameMapper: {
    '^@templates/(.*)': '<rootDir>/scripts/templates/$1',
    '^@utils/(.*)': '<rootDir>/scripts/utils/$1'
  }
};
```

### Test Utilities
```typescript
// test-utils.ts
export class TestRunner {
  // Template testing helpers
  static async compileTemplate(name: string, context: any) {
    // Compile and return template result
  }

  // File system helpers
  static async createTempModule(config: ModuleConfig) {
    // Set up temporary test directory
  }

  static async cleanupTempModule() {
    // Clean up after tests
  }

  // Snapshot helpers
  static async compareWithSnapshot(generated: GeneratedFile[]) {
    // Compare with stored snapshots
  }

  // Middleware testing helpers
  static createMiddlewareContext() {
    // Create isolated middleware test context
  }
}

// Custom test matchers
expect.extend({
  toMatchGeneratedStructure(received: GeneratedFile[], expected: string[]) {
    // Compare generated file structure
  },
  toHaveValidImports(content: string) {
    // Validate import statements
  }
});
```

### Example Tests
```typescript
// integration/generation/wiper.test.ts
import { TestRunner } from '../../setup/test-utils';
import { wiperConfig } from '../../__fixtures__/configs/wiper';

describe('Wiper Module Generation', () => {
  beforeEach(async () => {
    await TestRunner.createTempModule(wiperConfig);
  });

  afterEach(async () => {
    await TestRunner.cleanupTempModule();
  });

  test('generates complete module structure', async () => {
    const generated = await generateModule(wiperConfig);
    expect(generated).toMatchGeneratedStructure([
      'src/modules/wipers/models/wiper.ts',
      'src/modules/wipers/models/wiper-kit.ts',
      // ... expected files
    ]);
  });

  test('generates valid TypeScript files', async () => {
    const generated = await generateModule(wiperConfig);
    for (const file of generated) {
      expect(file.content).toHaveValidImports();
      expect(file.content).toTypeCheck();
    }
  });
});
```

### Running Tests
```bash
# Run all tests
npm test

# Run specific test suite
npm test middleware

# Run with coverage
npm test --coverage

# Update snapshots
npm test -u

# Watch mode
npm test --watch
```

This test runner system provides:
1. Organized test structure (unit, integration)
2. Fixture management
3. Snapshot testing for generated files
4. Custom matchers for validation
5. Isolated test environments
6. Helper utilities for common operations
7. Coverage reporting
8. Watch mode for development 

### Development Workflow

For active development, run Jest in watch mode in a separate terminal:

```bash
# Terminal 1: Watch templates and regenerate
npm run generate:watch

# Terminal 2: Watch tests
npm run test:generate:watch
```

Configure the scripts in package.json:
```json
{
  "scripts": {
    "generate:watch": "ts-node scripts/watch-all.ts",
    "test:generate": "jest --config=scripts/tests/jest.config.ts",
    "test:generate:watch": "jest --config=scripts/tests/jest.config.ts --watch",
    "test:generate:watchAll": "jest --config=scripts/tests/jest.config.ts --watchAll",
    "test:generate:coverage": "jest --config=scripts/tests/jest.config.ts --coverage"
  }
}
```

Jest watch mode features:
- Press `a` to run all tests
- Press `f` to run only failed tests
- Press `p` to filter by filename pattern
- Press `t` to filter by test name
- Press `u` to update snapshots
- Press `i` to update failing snapshots interactively
- Press `q` to quit watch mode

This setup allows you to:
1. Make changes to templates or generator code
2. See immediate test feedback in watch mode
3. Update snapshots as needed
4. Focus on specific test suites or files
5. Quickly iterate on failing tests 

## Required Patterns
```typescript
// Model Definition
const Model = model.define("model_name", {
  id: model.id().primaryKey(),
  // Fields + Relations
})

// Type Definition
export type ModelType = {
  id: string;
  // Fields
  // Timestamps added by Medusa automatically:
  // created_at: string;
  // updated_at: string;
  // deleted_at: string | null;
}

// List Response
export type ListModelTypeRes = {
  items: ModelType[];
  count: number;
  limit: number;
  offset: number;
}
``` 