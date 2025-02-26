<!-- 
THIS FILE IS MARKED FOR DELETION
Information from this file has been incorporated into module-generator-spec.md and module-generator-recommendations.md
-->

# Medusa Module Generator v2

A powerful code generator for creating consistent Medusa modules with models, services, API routes, and admin UI components.

## Directory Structure

```
scripts/module-generator/
├── src/
│   ├── generate-v2.ts         # Core generator implementation
│   └── utils/                 # Utility functions
├── configs/
│   ├── production-modules.ts  # Production module configurations
│   └── test-modules.ts       # Test module configurations
├── tests/
│   ├── generator.test.ts     # Test suite
│   ├── test-utils.ts        # Test utilities
│   ├── setup.ts            # Test setup
│   └── jest.config.ts      # Jest configuration
└── templates/              # Handlebars templates
    └── src/
        ├── modules/        # Backend module templates
        │   └── [module.plural]/
        │       ├── models/
        │       │   └── [model.name].hbs
        │       ├── service.hbs
        │       └── index.hbs
        ├── api/           # API route templates
        │   └── admin/
        │       └── [module.plural]/
        │           └── [model.plural]/
        │               ├── route.hbs
        │               ├── [id]/route.hbs
        │               └── validators.hbs
        └── admin/         # Admin UI templates
            └── routes/
                └── [module.plural]/
                    └── [model.plural]/
                        ├── page.hbs
                        ├── create/
                        │   └── [model.name]-create.hbs
                        └── edit/
                            └── [model.name]-edit.hbs

```

## Module Configuration

Define your module using TypeScript configurations:

```typescript
type ModuleConfig = {
  moduleName: string;  // kebab-case module name
  /**
   * The name of the primary model for this module (in kebab-case).
   * This model is special - it will:
   * 1. Be treated as the root model for the module
   * 2. Have simplified routing (e.g., /admin/vehicles instead of /admin/vehicles/vehicles)
   * 3. Be registered as the main service for the module
   * 4. Must match one of the model names defined in the models array
   */
  moduleModelName: string;
  singular: string;    // Singular display name
  plural: string;      // Plural display name
  models: ModelConfig[];
};

type ModelConfig = {
  name: string;        // kebab-case model name
  singular: string;    // Singular display name
  plural: string;      // Plural display name
  isParent?: boolean;  // Mark as parent model
  parent?: {           // Configure child model
    model: string;     // Parent model name
    routePrefix: string; // URL path structure
  };
  fields: ModelField[];
};

type ModelField = {
  name: string;
  type: "text" | "number" | "boolean" | "date";
  chainables?: Array<{
    name: "nullable" | "unique" | "index" | "primaryKey";
    args?: Array<string | number | boolean>;
  }>;
  validation?: {
    min?: number;
    max?: number;
    email?: boolean;
    regex?: string;
    required?: boolean;
  };
  relation?: {
    type: "belongsTo" | "hasMany" | "manyToMany";
    model: string;
    mappedBy?: string;
    through?: string;
  };
};
```

## Generated Output Structure

```
src/
├── modules/[module]/
│   ├── models/
│   │   └── [model].ts        # Model definitions
│   ├── service.ts           # Service registration
│   └── index.ts            # Module registration
├── api/admin/[module]/
│   └── [model]/
│       ├── route.ts        # List/Create endpoints
│       ├── [id]/route.ts   # Get/Update/Delete endpoints
│       └── validators.ts   # Request/Response schemas
└── admin/routes/[module]/
    └── [model]/
        ├── page.tsx        # List page
        ├── create/
        │   └── [model]-create.tsx  # Create form
        └── edit/
            └── [model]-edit.tsx    # Edit form
```

## Usage

### Development

```bash
# Generate modules
npm run src:generate

# Generate modules with debug output
npm run src:generate:debug

# Generate modules with watch mode
npm run src:generate:watch

# Run tests with watch mode
npm run test:generate:watch

# Run tests once
npm run test:generate

# Run tests with preserved output
npm run test:generate:keep

# Run tests quietly (AI friendly; run these in Cursor AI composer sessions to keep output minimal and to reduce context window)
npm run test:generate:quiet

# Run a single test
npm run test:generate:single -- -t "test name"
```

IMPORTANT FOR AI COMPOSER SESSION TESTING:

- Run `npm run test:generate:quiet` to keep output minimal and to reduce context window.
- THEN run individual failing tests and repair one-by-one until all tests pass.
- OPTIONALLY run `npm run test:generate:quiet:fileonly` to produce a list of failing tests that can be reffered to in the AI composer session in order to not need to re-run all tests AND to reduce the context window.

### Generating Modules

1. Create a module configuration:

```typescript
// configs/my-module.ts
export const MY_MODULE: ModuleConfig = {
  moduleName: "products",
  moduleModelName: "product", // Name of the main model
  singular: "product",
  plural: "products",
  models: [
    {
      name: "product",
      singular: "product",
      plural: "products",
      fields: [
        {
          name: "title",
          type: "text",
          chainables: [{ name: "unique" }],
          validation: { required: true }
        },
        {
          name: "category",
          type: "text",
          relation: {
            type: "belongsTo",
            model: "Category",
            mappedBy: "products"
          }
        }
      ]
    }
  ]
};

/**
 * Export all module configurations
 */
export const MODULES = {
  products: MY_MODULE,
  // Add more modules here
} as const;

export type ModuleName = keyof typeof MODULES;
```

## Key Features

### Parent-Child Relationships

```typescript
{
  models: [
    {
      name: "category",
      isParent: true,
      // ...
    },
    {
      name: "product",
      parent: {
        model: "Category",
        routePrefix: "categories/products"
      },
      // ...
    }
  ]
}
```

### Many-to-Many Relationships

```typescript
{
  fields: [
    {
      name: "tags",
      type: "text",
      relation: {
        type: "manyToMany",
        model: "Tag",
        through: "product_tags",
        mappedBy: "products"
      }
    }
  ]
}
```

### Field Validation

```typescript
{
  fields: [
    {
      name: "email",
      type: "text",
      validation: {
        required: true,
        email: true
      }
    },
    {
      name: "age",
      type: "number",
      validation: {
        min: 0,
        max: 150
      }
    }
  ]
}
```

### Database Constraints

```typescript
{
  fields: [
    {
      name: "code",
      type: "text",
      chainables: [
        { name: "unique" },
        { name: "index", args: ["asc"] }
      ]
    }
  ]
}
```

## Template Helpers

The generator includes several Handlebars helpers for template generation:

### Case Conversion
- `toPascalCase`: Convert to PascalCase
- `toSnakeCase`: Convert to snake_case
- `toKebabCase`: Convert to kebab-case
- `toCamelCase`: Convert to camelCase

### JSX Helpers
- `jsx-if`: Conditional rendering
- `jsx-expr`: Expression interpolation
- `jsx-ternary`: Ternary expressions
- `reactComponent`: React component wrapper

### Property Access
- `propAccess`: Safe property access with optional template literal mode

## Testing

The generator includes a comprehensive test suite covering:

1. Template System
   - Template file validation
   - Template syntax validation
   - Handlebars helpers

2. Module Generation
   - File structure
   - Model fields and relations
   - Parent-child routing
   - Import generation

3. Code Generation
   - Field chainables
   - Relation options
   - Many-to-many relationships
   - Validator schemas

## Contributing

1. Write tests for new features
2. Ensure all tests pass
3. Follow existing code style
4. Update documentation as needed