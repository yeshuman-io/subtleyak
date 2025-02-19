# Model Seeding Specification

## Problem Overview

We need to automatically generate test data for any collection of models in our system. The seeding process must handle model dependencies and generate appropriate test data for each field.

## Command Line Interface

```bash
# Basic usage (creates 10 of each model)
npx medusa exec src/scripts/seed.ts

# Specify quantity
npx medusa exec src/scripts/seed.ts --quantity 5

# Show detailed output
npx medusa exec src/scripts/seed.ts --verbose

# Combined usage
npx medusa exec src/scripts/seed.ts --quantity 3 --verbose
```

### CLI Arguments

1. `--quantity <number>`
   - Optional
   - Default: 10
   - Controls how many of each model to create
   - Example: `--quantity 5` creates 5 of each model

2. `--verbose`
   - Optional
   - Default: false
   - When enabled:
     - Shows each record as it's created
     - Displays relation mappings
     - Reports timing information
     - Outputs dependency resolution order

## Input Sources

1. Model Definitions (`@production-modules.ts`)
   - Module configurations
   - Model relationships
   - Field definitions and types
   - Required vs optional fields
   - Types imported from `src/admin/types`

2. Faker Mappings
   ```typescript
   // Types imported from src/admin/types
   import { FakerMapping, ModuleConfig, ModelField } from "../admin/types";
   
   type FakerMapping = {
     // Model-specific field mappings
     fields?: {
       [fieldName: string]: string;  // field -> faker method
     };
     // Module-level default mappings
     defaults?: {
       [fieldType: string]: string;  // type -> faker method
     };
   };
   
   // Example structure (no specific methods shown)
   const moduleConfig = {
     moduleName: string;
     models: Array<{
       name: string;
       fields: Array<{
         name: string;
         type: "string" | "number" | "boolean" | "date" | "text";
         required?: boolean;
         relation?: {
           type: "belongsTo" | "hasMany" | "manyToMany";
           model: string;
         };
       }>;
       faker?: FakerMapping;  // Model-specific faker methods
     }>;
     faker?: FakerMapping;    // Module-level faker defaults
   };
   ```

3. Faker Resolution Order
   1. Check model-specific field mapping
   2. Check module-level type defaults
   3. Fall back to type-based defaults
   ```typescript
   const defaultTypeMap = {
     text: "lorem.word",
     number: "number.int({ min: 1, max: 100 })",
     boolean: "datatype.boolean",
     date: "date.recent"
   };
   ```

## Key Requirements

1. Model Dependencies
   - Models can depend on other models through relations
   - Models must be created in correct dependency order
   - All required relations must be satisfied
   - Optional relations should be randomly populated

2. Data Generation
   - Each field type needs appropriate test data
   - Data should be realistic for the field's purpose
   - Custom field types should use configured faker methods
   - Generated data should be valid for the field's constraints

3. Module Handling
   - Each module manages its own models
   - Models from different modules can relate to each other
   - Each module has its own service for model creation
   - Global quantity setting controls data volume

## Constraints

1. Dependencies
   - No circular dependencies allowed
   - All required relations must exist
   - Parent models must be created before children

2. Data
   - Must be valid for field type
   - Must meet any field constraints
   - Should be deterministic if seeded with same key
   - Should be unique where required

3. Performance
   - Models should be created in parallel where possible
   - Related models must be created sequentially
   - Should handle large numbers of records
   - Should report progress during long operations

## Success Criteria

1. Functionality
   - All models created successfully
   - All relations valid
   - All data appropriate for field types
   - No dependency violations

2. Usability
   - Clear progress reporting
   - Helpful error messages
   - Easy to configure
   - Predictable results

3. Reliability
   - Handles errors gracefully
   - Reports issues clearly
   - Maintains data consistency
   - Supports different model sets

## Out of Scope

1. Data Cleanup
   - Removing test data
   - Managing data versions
   - Archiving old data

2. Data Validation
   - Complex validation rules
   - Business logic validation
   - Cross-field validation

3. Production Data
   - Migration of real data
   - Sensitive data handling
   - Data anonymization

## Future Features

### Selective Seeding

1. `--modules <moduleName...>`
   - Optional
   - Accepts one or more module names
   - Only seeds specified modules
   ```bash
   # Seed single module
   npx medusa exec src/scripts/seed.ts --modules inventory
   
   # Seed multiple modules
   npx medusa exec src/scripts/seed.ts --modules inventory shipping
   ```

2. `--models <moduleModel...>`
   - Optional
   - Format: `<moduleName>.<modelName>`
   - Only seeds specified models
   - Automatically includes required dependencies
   ```bash
   # Seed single model
   npx medusa exec src/scripts/seed.ts --models inventory.product
   
   # Seed multiple models
   npx medusa exec src/scripts/seed.ts --models inventory.product shipping.carrier
   
   # Combine with quantity
   npx medusa exec src/scripts/seed.ts --models inventory.product --quantity 5
   ```

### Implementation Considerations

1. Dependency Resolution
   - When using --models, must identify and create required parent models
   - Need to maintain correct creation order
   - Handle cross-module dependencies

2. Validation
   - Verify module names exist
   - Verify model names exist in specified modules
   - Check for circular dependencies

3. Error Handling
   - Clear error messages for invalid module/model names
   - Explain missing dependencies if needed
   - Suggest valid options on error 