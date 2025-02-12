# Medusa Module Generator Specification

## Overview
A template-based code generation system for Medusa modules using Handlebars templates that mirror the output file structure.

## Terminology

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

## Introduction

The module generator is designed to manage the complexity of creating and maintaining a large number of interconnected files. For a typical project with 4 modules containing 4-6 models each, the generator manages approximately 300 files:

Per module (15 files):
1. Module model definition:
   - `src/modules/[module]/models/[module].ts`
   - `src/api/admin/[module]/route.ts`
   - `src/api/admin/[module]/[id]/route.ts`
   - `src/admin/routes/[module]/page.tsx`
   - `src/admin/routes/[module]/create/[module]-create.tsx`
   - `src/admin/routes/[module]/edit/[module]-edit.tsx`

2. Module shared files:
   - `src/modules/[module]/service.ts`
   - `src/modules/[module]/index.ts`
   - `src/api/admin/[module]/validators.ts`

Per model within module (12 files):
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

## Directory Structure

```
scripts/
├── templates/                    # Handlebars templates mirroring output structure
│   ├── src/
│   │   ├── modules/[module]/    # Module directory
│   │   │   ├── models/         # Model definitions
│   │   │   │   ├── [module].hbs  # Module's own model
│   │   │   │   └── [model].hbs   # Models belonging to module
│   │   │   ├── service.hbs     # Module service
│   │   │   └── index.hbs       # Module entry
│   │   │
│   │   ├── api/admin/[module]/ # Module API routes
│   │   │   ├── route.hbs       # Module-level routes
│   │   │   ├── validators.hbs  # Module-level validators
│   │   │   ├── [id]/          # Module-level ID routes
│   │   │   │   └── route.hbs
│   │   │   └── [model]/       # Model-specific routes
│   │   │       ├── route.hbs
│   │   │       ├── validators.hbs
│   │   │       └── [id]/
│   │   │           └── route.hbs
│   │   │
│   │   └── admin/routes/[module]/ # Module admin UI
│   │       ├── page.hbs          # Module landing page
│   │       ├── create/           # Module-level create
│   │       │   └── [module]-create.hbs
│   │       ├── edit/            # Module-level edit
│   │       │   └── [module]-edit.hbs
│   │       └── [model]/         # Model-specific pages
│   │           ├── page.hbs
│   │           ├── create/
│   │           │   └── [model]-create.hbs
│   │           └── edit/
│   │               └── [model]-edit.hbs
```

## Core Types

### Module Configuration
```typescript
type ModuleConfig = {
  name: string;          // Module name/namespace (e.g. "vehicles")
  modelName: string;     // Module's own model name (e.g. "vehicles")
  singular: string;      // Singular form for module's UI/routes (e.g. "vehicle")
  plural: string;        // Plural form for module's UI/routes (e.g. "vehicles")
  fields: ModelField[];  // Module's own model fields
  models: ModelConfig[]; // Additional models belonging to this module
};

type ModelConfig = {
  name: string;         // Model name (e.g. "vehicle-make")
  singular: string;     // Singular form for UI/routes (e.g. "make")
  plural: string;       // Plural form for UI/routes (e.g. "makes")
  fields: ModelField[]; // Model fields
};

type ModelField = {
  name: string;               // Field name in snake_case
  type: "string" | "number" | "boolean" | "date";
  required?: boolean;         // Is this field required?
  relation?: {               // Relation configuration
    type: "belongsTo" | "hasMany" | "manyToMany";
    model: string;           // Related model name
    inverse?: string;        // Inverse relation name
    through?: string;        // Through table for many-to-many
  };
};
```

### Example Configuration
```typescript
const vehiclesModule: ModuleConfig = {
  // Module configuration - the module itself is a model
  name: "vehicles",      // Module name/namespace
  modelName: "vehicles", // Module's own model name
  singular: "vehicle",   // For module's UI/routes
  plural: "vehicles",    // For module's UI/routes
  fields: [             // Fields for the module's own model
    { 
      name: "name",
      type: "string",
      required: true 
    },
    {
      name: "makes",
      type: "string",
      relation: {
        type: "hasMany",
        model: "VehicleMake",
        inverse: "vehicle"
      }
    }
  ],

  // Additional models belonging to this module
  models: [
    {
      name: "vehicle-make",
      singular: "make",
      plural: "makes",
      fields: [
        {
          name: "name",
          type: "string",
          required: true
        },
        {
          name: "vehicle",
          type: "string", 
          relation: {
            type: "belongsTo",
            model: "Vehicle",
            inverse: "makes"
          }
        }
      ]
    }
  ]
};
``` 