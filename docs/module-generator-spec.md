# Medusa Module Generator Specification

## Table of Contents
- [Overview](#overview)
- [Core Concepts](#core-concepts)
  - [Module](#module)
  - [Model](#model)
  - [Field](#field)
  - [Relationship](#relationship)
- [Architecture](#architecture)
  - [Directory Structure](#directory-structure)
  - [File Generation Process](#file-generation-process)
  - [Template System](#template-system)
- [Configuration](#configuration)
  - [Module Configuration](#module-configuration)
  - [Model Configuration](#model-configuration)
  - [Field Configuration](#field-configuration)
  - [Faker Configuration](#faker-configuration)
- [Generated Output](#generated-output)
  - [Backend Files](#backend-files)
  - [API Routes](#api-routes)
  - [Admin UI Components](#admin-ui-components)
  - [Workflow Files](#workflow-files)
  - [Seed Files](#seed-files)
- [Command Reference](#command-reference)
  - [Generation Commands](#generation-commands)
  - [Testing Commands](#testing-commands)
- [Handlebars Helpers](#handlebars-helpers)
  - [Case Conversion Helpers](#case-conversion-helpers)
  - [Comparison Helpers](#comparison-helpers)
  - [JSX/React Helpers](#jsxreact-helpers)
  - [Model/Module Relationship Helpers](#modulemodel-relationship-helpers)
  - [Data Manipulation Helpers](#data-manipulation-helpers)
  - [Faker/Seeding Helpers](#fakerseeding-helpers)
  - [Debug Helpers](#debug-helpers)
- [Usage Patterns](#usage-patterns)
  - [Basic Module Generation](#basic-module-generation)
  - [Parent-Child Relationships](#parent-child-relationships)
  - [Many-to-Many Relationships](#many-to-many-relationships)
  - [Field Validation](#field-validation)
  - [Database Constraints](#database-constraints)
- [Testing](#testing)
  - [Test Utilities](#test-utilities)
  - [Test Coverage](#test-coverage)
- [Appendix](#appendix)
  - [Example Configurations](#example-configurations)
  - [Common Patterns](#common-patterns)

## Overview

The Medusa Module Generator is a template-based code generation system designed to create consistent, well-structured modules for Medusa applications. It uses Handlebars templates to generate all necessary files for a complete module, including models, services, API routes, and admin UI components.

The generator aims to solve several key challenges:

1. **Consistency**: Ensuring all modules follow the same patterns and conventions
2. **Productivity**: Reducing the time required to create new features
3. **Maintainability**: Making it easier to update and extend existing modules
4. **Completeness**: Generating all required files for a fully functional feature

For a typical project with 4 modules containing 4-6 models each, the generator manages approximately 300 files, making manual creation and maintenance impractical.

## Core Concepts

### Module

A module is both a namespace and a model. For example, a "vehicles" module:

- Acts as a namespace containing related models (e.g., makes, models)
- Is itself a model with its own fields and CRUD operations
- Has its own admin UI pages and API endpoints
- Groups related functionality under a common path (`/vehicles/*`)

### Model

A model belongs to a module and represents a specific entity type. For example, in the vehicles module:

- `vehicle-make` is a model for managing vehicle manufacturers
- Has its own database table, fields, and relationships
- Gets its own admin UI pages and API endpoints
- Lives under its module's namespace (`/vehicles/makes/*`)

### Field

A field is a property on a model that stores data:

- Basic types: string, number, boolean, date
- Can be required or optional
- Can define relationships between models
- Maps to database columns and form inputs

### Relationship

A connection between models:

- `belongsTo`: One-to-one (e.g., make belongs to vehicle)
- `hasMany`: One-to-many (e.g., vehicle has many makes)
- `manyToMany`: Many-to-many (requires through table)
- Uses `inverse` to define the other side of the relationship

## Architecture

### Directory Structure

The generator follows a structured approach with templates mirroring the output file structure:

```
scripts/module-generator/
├── src/
│   ├── generate-v2.ts         # Core generator implementation
│   └── utils/                 # Utility functions
├── configs/
│   ├── production-modules.ts  # Production module configurations
│   └── test-modules.ts        # Test module configurations
├── tests/
│   ├── generator.test.ts      # Test suite
│   └── test-utils.ts          # Test utilities
└── templates/                 # Handlebars templates
    └── src/
        ├── modules/           # Backend module templates
        │   └── [module.plural]/
        │       ├── models/
        │       │   └── [model.name].hbs
        │       ├── service.hbs
        │       └── index.hbs
        ├── api/               # API route templates
        │   └── admin/
        │       └── [module.plural]/
        │           ├── route.hbs
        │           ├── [id]/route.hbs
        │           ├── validators.hbs
        │           └── [model.plural]/
        │               ├── route.hbs
        │               ├── [id]/route.hbs
        │               └── validators.hbs
        ├── admin/             # Admin UI templates
        │   └── routes/
        │       └── [module.plural]/
        │           ├── page.hbs
        │           ├── create/
        │           │   └── [module.singular]-create.hbs
        │           ├── edit/
        │           │   └── [module.singular]-edit.hbs
        │           └── [model.plural]/
        │               ├── page.hbs
        │               ├── create/
        │               │   └── [model.name]-create.hbs
        │               └── edit/
        │                   └── [model.name]-edit.hbs
        └── workflows/         # Workflow templates
            └── [module.plural]/
                ├── create-[model.name].hbs
                ├── update-[model.name].hbs
                └── delete-[model.name].hbs
```

### File Generation Process

The generator follows these steps:

1. **Load Configuration**: Parse module and model configurations
2. **Load Templates**: Read all Handlebars templates
3. **Process Templates**: Apply configurations to templates
4. **Generate Files**: Write processed templates to the file system
5. **Apply Formatting**: Format generated files with Prettier

The process can be run in "dry run" mode to preview changes without writing files.

### Template System

The generator uses Handlebars as its templating engine, with a rich set of custom helpers to handle:

- Case conversion (PascalCase, camelCase, etc.)
- JSX/React component generation
- Relationship mapping
- Field processing
- Conditional logic

Templates are organized to mirror the output file structure, making it easy to understand and maintain.

## Configuration

### Module Configuration

The `ModuleConfig` type defines the structure of a module:

```typescript
type ModuleConfig = {
  moduleName: string;      // kebab-case module name (e.g., "vehicles")
  moduleModelName: string; // PascalCase name of the main model (e.g., "Vehicle")
  singular: string;        // Singular form for UI/routes (e.g., "vehicle")
  plural: string;          // Plural form for UI/routes (e.g., "vehicles")
  faker?: FakerMapping;    // Optional faker configuration for seeding
  models: ModelConfig[];   // Array of models in this module
};
```

### Model Configuration

The `ModelConfig` type defines the structure of a model:

```typescript
type ModelConfig = {
  name: string;              // kebab-case model name (e.g., "vehicle-make")
  modelName: string;         // PascalCase singular name (e.g., "VehicleMake")
  modelNamePlural: string;   // PascalCase plural name (e.g., "VehicleMakes")
  singular: string;          // Singular form for UI/routes (e.g., "make")
  plural: string;            // Plural form for UI/routes (e.g., "makes")
  icon?: string;             // Optional icon name for UI
  isParent?: boolean;        // Is this a parent model?
  parent?: {                 // Parent model configuration (for child models)
    model: string;           // Parent model name
    routePrefix: string;     // Route prefix for this child model
  };
  faker?: FakerMapping;      // Model-specific faker configuration
  fields: ModelField[];      // Array of fields for this model
};
```

### Field Configuration

The `ModelField` type defines the structure of a field:

```typescript
type ModelField = {
  name: string;       // Field name in snake_case (e.g., "created_at")
  type: "string" | "number" | "boolean" | "date" | "text";  // Field data type
  required?: boolean; // Is this field required?
  relation?: {        // Relationship configuration (if this is a relation field)
    type: "belongsTo" | "hasMany" | "manyToMany";  // Relationship type
    model: string;    // Related model name in PascalCase
    mappedBy?: string; // Field name on the related model for the inverse relation
    through?: string;  // Through table name for many-to-many relations
    inverse?: string;  // Inverse relation name
    pivotTable?: string; // Alternative to through for many-to-many
    joinColumn?: string; // Join column for relations
    inverseJoinColumn?: string; // Inverse join column for relations
  };
  default?: any;      // Default value for the field
};
```

### Faker Configuration

The `FakerMapping` type defines how to generate fake data for seeding:

```typescript
type FakerMapping = {
  fields?: Record<string, string>;  // Field name to faker method mapping
  defaults?: Record<string, string>; // Type to faker method mapping
};
```

## Generated Output

For each module, the generator creates a comprehensive set of files:

### Backend Files

Per module (2 files):
- `src/modules/[module]/service.ts` - Service registration
- `src/modules/[module]/index.ts` - Module registration

Per model (1 file):
- `src/modules/[module]/models/[model].ts` - Model definition

### API Routes

Per module (4 files):
- `src/api/admin/[module]/route.ts` - List/Create endpoints for module
- `src/api/admin/[module]/[id]/route.ts` - Get/Update/Delete endpoints for module
- `src/api/admin/[module]/validators.ts` - Request/Response schemas for module
- `src/api/admin/[module]/middlewares.ts` - Middleware functions for module

Per model (4 files):
- `src/api/admin/[module]/[model]/route.ts` - List/Create endpoints for model
- `src/api/admin/[module]/[model]/[id]/route.ts` - Get/Update/Delete endpoints for model
- `src/api/admin/[module]/[model]/validators.ts` - Request/Response schemas for model
- `src/api/admin/[module]/[model]/middlewares.ts` - Middleware functions for model

### Admin UI Components

Per module (3 files):
- `src/admin/routes/[module]/page.tsx` - List page for module
- `src/admin/routes/[module]/create/[module]-create.tsx` - Create form for module
- `src/admin/routes/[module]/edit/[module]-edit.tsx` - Edit form for module

Per model (3 files):
- `src/admin/routes/[module]/[model]/page.tsx` - List page for model
- `src/admin/routes/[module]/[model]/create/[model]-create.tsx` - Create form for model
- `src/admin/routes/[module]/[model]/edit/[model]-edit.tsx` - Edit form for model

### Workflow Files

Per model (3 files):
- `src/workflows/[module]/create-[model].ts` - Create workflow
- `src/workflows/[module]/update-[model].ts` - Update workflow
- `src/workflows/[module]/delete-[model].ts` - Delete workflow

### Seed Files

Per application (1 file):
- `src/scripts/seed.ts` - Database seeding script for populating the database with test data

The seed file is generated from the `seed.hbs` template and is responsible for:

1. **Importing necessary dependencies**:
   - Models and types from admin/types
   - Module services from each module
   - Faker library for generating realistic test data

2. **Defining seed quantities**:
   - Constants for main module records (e.g., `VEHICLE_COUNT = 10`)
   - Constants for related model records (e.g., `VEHICLE_MAKES_PER_VEHICLE = 2`)

3. **Dependency-aware record generation**:
   - Models are sorted by dependency level to ensure related records exist before being referenced
   - Records with relationships are populated with references to existing records
   - Many-to-many relationships are handled with appropriate join tables

4. **Faker integration**:
   - Field values are generated using appropriate faker methods based on field type
   - Custom faker methods can be specified in the model configuration
   - Default faker methods are provided for common field types:
     - text: `faker.lorem.word`
     - number: `faker.number.int({ min: 1, max: 100 })`
     - boolean: `faker.datatype.boolean`
     - date: `faker.date.recent`

5. **Error handling and logging**:
   - Comprehensive error logging during the seed process
   - Progress reporting for each model and record
   - Performance timing for the entire seed operation

The seed file can be executed directly to populate the database or imported and used programmatically in testing environments.

Example usage:
```typescript
// Direct execution
npm run seed

// Programmatic usage in tests
import seed from './scripts/seed';
import { container } from './container';

beforeAll(async () => {
  await seed({ container }, 5); // Seed with 5 records per model
});
```

## Command Reference

The module generator includes a comprehensive set of commands for generating modules, testing, and debugging. These commands are defined in the `package.json` file.

### Generation Commands

- `npm run src:generate` - Generate modules based on configurations in `production-modules.ts`
- `npm run src:generate:debug` - Generate modules with debug output enabled
- `npm run src:generate:dry-run` - Perform a dry run of generation (preview changes without writing files)
- `npm run src:generate:watch` - Watch for changes to module configurations and regenerate automatically

Example usage:
```bash
# Generate all modules defined in production-modules.ts
npm run src:generate

# Generate modules with detailed debugging information
npm run src:generate:debug

# Preview what would be generated without writing any files
npm run src:generate:dry-run
```

### Testing Commands

- `npm run test:generate` - Run all module generator tests
- `npm run test:generate:watch` - Run tests and watch for changes
- `npm run test:generate:watchAll` - Watch and rerun all tests when changes are detected
- `npm run test:generate:coverage` - Run tests with code coverage reporting
- `npm run test:generate:keep` - Run tests without cleaning up test output files
- `npm run test:generate:quiet` - Run tests with minimal output (useful for CI environments)
- `npm run test:generate:single -- -t "test name"` - Run a single test by name

For AI-assisted development sessions:
- `npm run test:generate:quiet` - Minimizes output to reduce context window
- `npm run test:generate:quiet:fileonly` - Produces a list of failing tests without full output

Example usage:
```bash
# Run all tests
npm run test:generate

# Run tests in watch mode (rerun on changes)
npm run test:generate:watch

# Run a specific test
npm run test:generate:single -- -t "should generate model files in correct locations"

# Run tests while preserving output files for inspection
npm run test:generate:keep
```

These commands provide a complete workflow for developing, testing, and maintaining the module generator.

## Handlebars Helpers

The generator includes a rich set of Handlebars helpers to simplify template creation:

### Case Conversion Helpers

- `toPascalCase`: Converts to PascalCase (e.g., "hello-world" → "HelloWorld")
- `toSnakeCase`: Converts to snake_case (e.g., "helloWorld" → "hello_world")
- `toTitleCase`: Converts to Title Case (e.g., "hello-world" → "Hello World")
- `toLowerCase`: Converts to lowercase
- `toCamelCase`: Converts to camelCase (e.g., "hello-world" → "helloWorld")
- `toKebabCase`: Converts to kebab-case (e.g., "helloWorld" → "hello-world")
- `toSentenceCase`: Converts to Sentence case with spaces
- `toUpperCase`: Converts to UPPERCASE

### Comparison Helpers

- `eq`: Equality check (a === b)
- `type`: Type check (value === type)
- `gt`: Greater than check (a > b)
- `and`: Logical AND (a && b)
- `not`: Logical NOT (!a)
- `includes`: String includes check

### JSX/React Helpers

- `reactComponent`: Processes content for React components
- `jsx-if`: Conditional rendering in JSX
- `jsx-each`: List rendering in JSX
- `jsx-ternary`: Ternary expressions in JSX
- `jsx-expr`: Raw JSX expressions

### Model/Module Relationship Helpers

- `isModuleModel`: Checks if a model is the main module model
- `getRoutePath`: Generates route paths based on model/module relationship
- `getModelImportPath`: Generates import paths
- `processField`: Processes field definitions for models
- `hasRelations`: Checks if fields have relations of a specific type
- `modelHasDependencies`: Checks if a model has dependencies
- `modelHasOnlyIndependentDependencies`: Checks dependency relationships
- `getDependencyLevel`: Calculates dependency depth level
- `sortModelsByDependencyLevel`: Sorts models by dependency level
- `findModelPlural`: Finds a model's plural form by relation
- `findModel`: Finds a model by relation

### Data Manipulation Helpers

- `propAccess`: Property access with template literal support
- `concat`: Concatenates strings
- `split`: Splits strings
- `last`: Gets last element of array
- `find`: Finds an item in an array by key/value

### Faker/Seeding Helpers

- `getFakerMethod`: Gets appropriate faker method for a field
- `getCountString`: Generates count string for seed data

### Debug Helpers

- `debug`: Outputs context for debugging

## Usage Patterns

### Basic Module Generation

```typescript
// Define a basic module with a single model
const BASIC_MODULE: ModuleConfig = {
  moduleName: "products",
  moduleModelName: "Product",
  singular: "product",
  plural: "products",
  models: [
    {
      name: "product",
      modelName: "Product",
      modelNamePlural: "Products",
      singular: "product",
      plural: "products",
      fields: [
    { 
      name: "name",
          type: "text",
      required: true 
    },
    {
          name: "description",
          type: "text"
        },
        {
          name: "price",
          type: "number",
          required: true
        }
      ]
    }
  ]
};

// Generate the module
await generateModule(BASIC_MODULE);
```

### Parent-Child Relationships

```typescript
// Define a module with parent-child relationship
const PARENT_CHILD_MODULE: ModuleConfig = {
  moduleName: "categories",
  moduleModelName: "Category",
  singular: "category",
  plural: "categories",
  models: [
    {
      name: "category",
      modelName: "Category",
      modelNamePlural: "Categories",
      singular: "category",
      plural: "categories",
      isParent: true,
      fields: [
        {
          name: "name",
          type: "text",
          required: true
        },
        {
          name: "products",
          type: "text",
          relation: {
            type: "hasMany",
            model: "Product",
            mappedBy: "category"
          }
        }
      ]
    },
    {
      name: "product",
      modelName: "Product",
      modelNamePlural: "Products",
      singular: "product",
      plural: "products",
      parent: {
        model: "Category",
        routePrefix: "categories/products"
      },
      fields: [
        {
          name: "name",
          type: "text",
          required: true
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
```

### Many-to-Many Relationships

```typescript
// Define a module with many-to-many relationship
const MANY_TO_MANY_MODULE: ModuleConfig = {
  moduleName: "products",
  moduleModelName: "Product",
  singular: "product",
  plural: "products",
  models: [
    {
      name: "product",
      modelName: "Product",
      modelNamePlural: "Products",
      singular: "product",
      plural: "products",
      fields: [
        {
          name: "name",
          type: "text",
          required: true
        },
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
    },
    {
      name: "tag",
      modelName: "Tag",
      modelNamePlural: "Tags",
      singular: "tag",
      plural: "tags",
      fields: [
        {
          name: "name",
          type: "text",
          required: true
        },
        {
          name: "products",
          type: "text",
          relation: {
            type: "manyToMany",
            model: "Product",
            through: "product_tags",
            mappedBy: "tags"
          }
        }
      ]
    }
  ]
};
``` 

### Field Validation

Field validation is handled through the `required` property and can be extended with additional validation rules in the templates.

### Database Constraints

Database constraints are defined through the field configuration and processed by the templates to generate appropriate model definitions.

## Testing

The generator includes a comprehensive test suite to ensure correct functionality:

### Test Utilities

- `TestUtils.cleanTestDir()`: Cleans the test output directory
- `TestUtils.fileExists(path)`: Checks if a file exists
- `TestUtils.readGeneratedFile(path)`: Reads a generated file
- `TestUtils.getAllFiles(dir)`: Gets all files in a directory

### Test Coverage

The test suite covers:

1. **Template System**
   - Template file existence
   - Template syntax validation
   - Handlebars helpers functionality

2. **Module Generation**
   - File structure generation
   - Field type handling
   - Middleware generation

3. **Dry Run Mode**
   - No file creation during dry runs
   - FileChange object structure
   - Comparison with actual generation

4. **Middleware Template Data**
   - Correct data passing to templates
   - Multi-module data handling

## Appendix

### Example Configurations

See the `configs/production-modules.ts` file for complete examples of module configurations used in production.

### Common Patterns

1. **Module with Multiple Models**:
   - Define the main module model
   - Add related models with appropriate relationships

2. **Hierarchical Data**:
   - Use parent-child relationships
   - Configure proper route prefixes

3. **Complex Relationships**:
   - Use belongsTo/hasMany for one-to-many
   - Use manyToMany with through tables for many-to-many
   - Configure inverse relationships for bidirectional access 