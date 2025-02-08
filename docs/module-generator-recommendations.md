# Module Generator Recommendations

This document provides recommendations for improving the Medusa module generator implementation in `scripts/module-generator/src/generate-v2.ts` and its tests in `scripts/module-generator/tests/generator.test.ts`.

## Table of Contents

- [Overview](#overview)
- [Handlebars Helper Improvements](#handlebars-helper-improvements)
  - [Consolidate Overlapping Helpers](#consolidate-overlapping-helpers)
  - [Implement Proper Pluralization](#implement-proper-pluralization)
  - [Standardize Comparison Helpers](#standardize-comparison-helpers)
  - [Improve Debug Helper](#improve-debug-helper)
  - [Enhance Relation Helpers](#enhance-relation-helpers)
- [Code Structure Improvements](#code-structure-improvements)
  - [Modularize Helper Registration](#modularize-helper-registration)
  - [Improve Error Handling](#improve-error-handling)
  - [Add Template Validation](#add-template-validation)
  - [Implement File Merging Strategy](#implement-file-merging-strategy)
  - [Refactor Core Generation Logic](#refactor-core-generation-logic)
- [Template Improvements](#template-improvements)
  - [Model Templates](#model-templates)
  - [API Route Templates](#api-route-templates)
  - [Admin UI Templates](#admin-ui-templates)
  - [Workflow Templates](#workflow-templates)
  - [Service and Infrastructure Templates](#service-and-infrastructure-templates)
  - [Type Definition Templates](#type-definition-templates)
  - [Seed Data Templates](#seed-data-templates)
- [Test Coverage Improvements](#test-coverage-improvements)
  - [Add Error Handling Tests](#add-error-handling-tests)
  - [Test Complex Relationships](#test-complex-relationships)
  - [Test File Merging](#test-file-merging)
  - [Add Performance Benchmarks](#add-performance-benchmarks)
- [Configuration Improvements](#configuration-improvements)
  - [Enhance Type Validation](#enhance-type-validation)
  - [Simplify Common Patterns](#simplify-common-patterns)
  - [Add Configuration Presets](#add-configuration-presets)
- [Implementation Roadmap](#implementation-roadmap)

## Overview

The current module generator provides a powerful template-based approach to generating Medusa modules, models, and related files. While the implementation is functional, there are several areas where improvements could enhance maintainability, performance, and reliability.

## Handlebars Helper Improvements

### Consolidate Overlapping Helpers

Several helpers have overlapping functionality that could be consolidated:

```javascript
// CURRENT: Multiple case conversion helpers
Handlebars.registerHelper("toPascalCase", (str) => { /* ... */ });
Handlebars.registerHelper("toSnakeCase", (str) => { /* ... */ });
Handlebars.registerHelper("toKebabCase", (str) => { /* ... */ });
// etc.

// RECOMMENDED: Single case conversion helper
Handlebars.registerHelper("convertCase", (str, caseType) => {
  if (!str) return "";
  
  switch(caseType) {
    case "pascal":
      return str.split(/[-_]/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join("");
    case "snake":
      return str.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
    case "kebab":
      return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
    // Add other cases
    default:
      return str;
  }
});
```

### Implement Proper Pluralization

The current `plural` and `pluralize` helpers don't implement actual pluralization logic:

```javascript
// CURRENT: Non-functional plural helper
Handlebars.registerHelper("plural", function (str) {
  if (!str) return "";
  // Basic pluralization rules commented out
});

// RECOMMENDED: Proper pluralization helper
Handlebars.registerHelper("pluralize", function (str) {
  if (!str) return "";
  
  // Common irregular plurals
  const irregulars = {
    "person": "people",
    "child": "children",
    "ox": "oxen",
    "man": "men",
    "woman": "women",
    "tooth": "teeth",
    "foot": "feet",
    "mouse": "mice",
    "goose": "geese"
  };
  
  if (irregulars[str]) return irregulars[str];
  
  // Handle common patterns
  if (str.endsWith('y') && !['ay', 'ey', 'iy', 'oy', 'uy'].some(vowel => str.endsWith(vowel))) {
    return str.slice(0, -1) + 'ies';
  }
  if (str.endsWith('s') || str.endsWith('x') || str.endsWith('z') || 
      str.endsWith('ch') || str.endsWith('sh')) {
    return str + 'es';
  }
  
  // Default case
  return str + 's';
});
```

### Standardize Comparison Helpers

Create a unified comparison helper:

```javascript
// RECOMMENDED: Unified comparison helper
Handlebars.registerHelper("compare", function (left, operator, right) {
  switch (operator) {
    case "eq":
    case "===":
      return left === right;
    case "neq":
    case "!==":
      return left !== right;
    case "lt":
    case "<":
      return left < right;
    case "gt":
    case ">":
      return left > right;
    case "lte":
    case "<=":
      return left <= right;
    case "gte":
    case ">=":
      return left >= right;
    case "and":
    case "&&":
      return left && right;
    case "or":
    case "||":
      return left || right;
    case "includes":
      return String(left).includes(right);
    default:
      throw new Error(`Unsupported operator: ${operator}`);
  }
});
```

### Improve Debug Helper

Enhance the debug helper to be more production-safe:

```javascript
// RECOMMENDED: Enhanced debug helper
Handlebars.registerHelper("debug", function (context) {
  if (process.env.NODE_ENV === "development" || process.env.DEBUG === "1") {
    const seen = new Set();
    console.log("Template Debug Context:", 
      JSON.stringify(context, (key, value) => {
        // Prevent circular references and limit depth
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) return '[Circular]';
          seen.add(value);
        }
        return value;
      }, 2)
    );
  }
  return "";
});
```

### Enhance Relation Helpers

Improve helpers for handling relationships between models:

```javascript
// RECOMMENDED: Enhanced relationship helper
Handlebars.registerHelper("getRelationConfig", function (field, options) {
  if (!field || !field.relation) {
    return '';
  }
  
  const { model, type, mappedBy, through, inverse, pivotTable, joinColumn, inverseJoinColumn } = field.relation;
  const relationConfig = [];

  // Build relation configuration with a consistent order
  if (model) relationConfig.push(`model: "${model}"`);
  if (type) relationConfig.push(`type: "${type}"`);
  if (inverse) relationConfig.push(`inverse: "${inverse}"`);
  if (mappedBy) relationConfig.push(`mappedBy: "${mappedBy}"`);
  if (through) relationConfig.push(`through: "${through}"`);
  if (pivotTable) relationConfig.push(`pivotTable: "${pivotTable}"`);
  if (joinColumn) relationConfig.push(`joinColumn: "${joinColumn}"`);
  if (inverseJoinColumn) relationConfig.push(`inverseJoinColumn: "${inverseJoinColumn}"`);

  // Format the configuration based on template needs
  if (options.hash.format === 'inline') {
    return relationConfig.join(', ');
  }
  
  if (options.hash.format === 'multiline') {
    return relationConfig.join(',\n    ');
  }
  
  // Default object format
  return `{\n    ${relationConfig.join(',\n    ')}\n  }`;
});
```

## Code Structure Improvements

### Modularize Helper Registration

Move helper registration to a separate file for better organization:

```javascript
// helpers.js
export function registerHandlebarsHelpers(Handlebars) {
  // Register all helpers here
  Handlebars.registerHelper("convertCase", ...);
  // ...
}

// generate-v2.ts
import { registerHandlebarsHelpers } from './helpers';
registerHandlebarsHelpers(Handlebars);
```

### Improve Error Handling

Add more robust error handling for template processing:

```javascript
async function processTemplate(
  templateContent: string,
  data: Record<string, any>,
  options?: {
    templatePath?: string;
    outputPath?: string;
  }
): Promise<string> {
  try {
    const compiledTemplate = Handlebars.compile(templateContent);
    return compiledTemplate(data);
  } catch (error) {
    console.error(chalk.red(`Error processing template:`, error));
    console.error(chalk.yellow(`Template path: ${options?.templatePath}`));
    console.error(chalk.yellow(`Output path: ${options?.outputPath}`));
    
    // Add more context to the error
    if (error instanceof Error) {
      error.message = `Template processing error (${options?.templatePath}): ${error.message}`;
    }
    
    throw error;
  }
}
```

### Add Template Validation

Implement template validation before processing:

```javascript
function validateTemplate(templateContent: string, templatePath: string): void {
  try {
    Handlebars.compile(templateContent);
  } catch (error) {
    throw new Error(`Invalid template at ${templatePath}: ${error.message}`);
  }
  
  // Check for common template issues
  const missingClosingTags = (templateContent.match(/{{#[^}]+}}/g) || []).length - 
                            (templateContent.match(/{{\/[^}]+}}/g) || []).length;
  
  if (missingClosingTags > 0) {
    throw new Error(`Template at ${templatePath} has ${missingClosingTags} unclosed block helpers`);
  }
}
```

### Implement File Merging Strategy

Add a strategy for merging changes into existing files:

```javascript
async function mergeChanges(filePath: string, newContent: string): Promise<string> {
  if (!existsSync(filePath)) {
    return newContent;
  }
  
  const existingContent = await fs.readFile(filePath, 'utf-8');
  
  // Simple strategy: Look for special comment markers
  if (existingContent.includes('// GENERATOR: MERGE POINT')) {
    // Split content at merge points
    const [beforeMerge, afterMerge] = existingContent.split('// GENERATOR: MERGE POINT');
    
    // Extract auto-generated parts from new content
    const generatedRegex = /\/\/ AUTO-GENERATED START([\s\S]*?)\/\/ AUTO-GENERATED END/g;
    let match;
    let generatedParts = [];
    
    while ((match = generatedRegex.exec(newContent)) !== null) {
      generatedParts.push(match[0]);
    }
    
    // Combine existing content with new generated parts
    return `${beforeMerge}// GENERATOR: MERGE POINT
${generatedParts.join('\n')}
${afterMerge}`;
  }
  
  // Default: Return new content (overwrite)
  return newContent;
}
```

### Refactor Core Generation Logic

Split the generation logic into smaller, focused functions:

```typescript
// CURRENT: Large monolithic function
async function generateModuleFiles(config: ModuleConfig, options): Promise<FileChange[]> {
  // ... 200+ lines of code
}

// RECOMMENDED: Split into focused functions
async function generateModuleFiles(config: ModuleConfig, options): Promise<FileChange[]> {
  const changes: FileChange[] = [];
  
  // Generate model files
  const modelChanges = await generateModelFiles(config, options);
  changes.push(...modelChanges);
  
  // Generate API routes
  const apiChanges = await generateApiRoutes(config, options);
  changes.push(...apiChanges);
  
  // Generate admin UI components
  const uiChanges = await generateAdminUI(config, options);
  changes.push(...uiChanges);
  
  // Generate workflow files
  const workflowChanges = await generateWorkflows(config, options);
  changes.push(...workflowChanges);
  
  // Generate module infrastructure
  const infraChanges = await generateModuleInfrastructure(config, options);
  changes.push(...infraChanges);
  
  return changes;
}
```

## Template Improvements

### Model Templates

Improve model definition templates for better consistency and maintainability:

```handlebars
{{!-- RECOMMENDED: Standard model template structure --}}
/**
 * @file {{modelName}} model
 * @description {{modelName}} model definition for the {{module.moduleName}} module
 */

import { model } from "medusa-custom-orm";
{{#if (hasRelations fields)}}
{{#each fields}}
{{#if relation}}
import { {{relation.model}} } from "{{#if (eq relation.model module.moduleModelName)}}./{{else}}./{{relation.model}}{{/if}}";
{{/if}}
{{/each}}
{{/if}}

const {{modelName}} = model.define("{{toSnakeCase modelName}}", {
  id: model.id().primaryKey(),
  
  // Basic fields
  {{#each fields}}
  {{#unless relation}}
  {{processField this}},
  {{/unless}}
  {{/each}}
  
  // Relationship fields
  {{#each fields}}
  {{#if relation}}
  {{processField this}},
  {{/if}}
  {{/each}}
  
  // Timestamps
  created_at: model.date().default(() => new Date()),
  updated_at: model.date().default(() => new Date()),
  deleted_at: model.date().nullable()
});

export default {{modelName}};

// Type definitions
export type {{modelName}}Type = {
  id: string;
  {{#each fields}}
  {{#unless relation}}
  {{name}}: {{#if (eq type "text")}}string{{else}}{{type}}{{/if}}{{#unless required}} | null{{/unless}};
  {{/unless}}
  {{/each}}
  {{#each fields}}
  {{#if relation}}
  {{#if (eq relation.type "belongsTo")}}
  {{name}}_id: string | null;
  {{name}}?: {{relation.model}}Type;
  {{/if}}
  {{#if (eq relation.type "hasMany")}}
  {{name}}?: {{relation.model}}Type[];
  {{/if}}
  {{#if (eq relation.type "manyToMany")}}
  {{name}}?: {{relation.model}}Type[];
  {{/if}}
  {{/if}}
  {{/each}}
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Create{{modelName}}Input = {
  {{#each fields}}
  {{#unless relation}}
  {{name}}{{#unless required}}?{{/unless}}: {{#if (eq type "text")}}string{{else}}{{type}}{{/if}};
  {{/unless}}
  {{/each}}
  {{#each fields}}
  {{#if relation}}
  {{#if (eq relation.type "belongsTo")}}
  {{name}}_id{{#unless required}}?{{/unless}}: string;
  {{/if}}
  {{/if}}
  {{/each}}
};

export type Update{{modelName}}Input = Partial<Create{{modelName}}Input>;
```

Issues with the current model template:
1. Import statements are not organized consistently
2. Type definitions are sometimes incomplete
3. No consistent structure for separating basic fields from relationships
4. Missing input type definitions that would be useful across the module

### API Route Templates

Enhance API route templates with better error handling and structure:

```handlebars
{{!-- RECOMMENDED: Enhanced API route template --}}
/**
 * @file {{model.modelName}} API routes
 * @description API endpoints for {{model.modelName}} CRUD operations
 */

import { NextRequest } from "next/server";
import { container } from "@medusa/di";
import { 
  {{model.singular}}Schema, 
  list{{model.modelNamePlural}}Schema,
  create{{model.modelName}}Schema, 
  update{{model.modelName}}Schema,
  {{model.modelName}}ResponseSchema,
  List{{model.modelNamePlural}}ResponseSchema
} from "./validators";

// List and create endpoints
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const queryParams = Object.fromEntries(searchParams.entries());
    
    // Get dependencies from container
    const {{model.singular}}Service = container.resolve("{{model.name}}");
    
    // Get list options from query params
    const { limit = 10, offset = 0, ...filters } = queryParams;
    
    // Retrieve entities
    const [items, count] = await {{model.singular}}Service.listAndCount(filters, {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      relations: ["{{#each model.fields}}{{#if relation}}{{name}},{{/if}}{{/each}}"],
    });
    
    // Validate response
    const validatedResponse = List{{model.modelNamePlural}}ResponseSchema.parse({
      items,
      count,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
    
    return Response.json(validatedResponse);
  } catch (error) {
    console.error(`Error retrieving {{model.plural}}:`, error);
    return Response.json(
      { error: `Failed to retrieve {{model.plural}}` },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Get dependencies from container
    const {{model.singular}}Service = container.resolve("{{model.name}}");
    
    // Validate request body
    const validatedData = create{{model.modelName}}Schema.parse(body);
    
    // Create the entity
    const result = await {{model.singular}}Service.create(validatedData);
    
    // Validate response
    const validatedResponse = {{model.modelName}}ResponseSchema.parse({
      {{model.singular}}: result
    });
    
    return Response.json(validatedResponse, { status: 201 });
  } catch (error) {
    if (error.name === "ZodError") {
      return Response.json(
        { error: "Validation error", details: error.format() },
        { status: 400 }
      );
    }
    
    console.error(`Error creating {{model.singular}}:`, error);
    return Response.json(
      { error: `Failed to create {{model.singular}}` },
      { status: 500 }
    );
  }
}
```

Issues with the current API route templates:
1. Inconsistent error handling
2. Limited request validation
3. Missing structured response validation 
4. No consistent pattern for query parameter handling
5. Limited documentation

### Admin UI Templates

Improve admin UI template with better component structure and TypeScript support:

```handlebars
{{!-- RECOMMENDED: Enhanced admin UI list page template --}}
/**
 * @file {{model.modelName}} List Page
 * @description Admin UI page for listing {{model.plural}}
 */

import React from "react";
import { PageLayout, DataTable, Button, PlusIcon, useToast } from "@medusa-ui/core";
import { useRouter } from "next/navigation";
import { fetch{{model.modelNamePlural}} } from "@admin/api/{{module.plural}}/{{model.plural}}";
import type { {{model.modelName}}Type } from "@admin/types";

export default function {{model.modelName}}ListPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);
  const [data, setData] = React.useState<{{model.modelName}}Type[]>([]);
  const [count, setCount] = React.useState(0);
  const [pagination, setPagination] = React.useState({
    limit: 10,
    offset: 0
  });

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { items, count } = await fetch{{model.modelNamePlural}}({
          limit: pagination.limit,
          offset: pagination.offset
        });
        setData(items);
        setCount(count);
      } catch (error) {
        console.error("Failed to fetch {{model.plural}}:", error);
        toast({
          variant: "error",
          title: "Error fetching {{model.plural}}",
          description: "Please try again or contact support if the issue persists."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [pagination, toast]);

  const handleCreate = () => {
    router.push("/{{module.plural}}/{{model.plural}}/create");
  };

  const handleEdit = (id: string) => {
    router.push(`/{{module.plural}}/{{model.plural}}/edit/${id}`);
  };

  const columns = [
    {{#each model.fields}}
    {{#unless relation}}
    {
      accessor: "{{name}}",
      header: "{{toTitleCase name}}"
    },
    {{/unless}}
    {{/each}}
    {
      accessor: "id",
      header: "Actions",
      cell: ({ row }) => (
        <Button variant="secondary" onClick={() => handleEdit(row.original.id)}>
          Edit
        </Button>
      )
    }
  ];

  return (
    <PageLayout>
      <PageLayout.Header>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{{model.modelNamePlural}}</h1>
          <Button 
            variant="primary" 
            onClick={handleCreate}
            LeadingIcon={PlusIcon}
          >
            Create {{model.singular}}
          </Button>
        </div>
      </PageLayout.Header>
      <PageLayout.Content>
        <DataTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          pagination={{
            count,
            limit: pagination.limit,
            offset: pagination.offset,
            setOffset: (offset) => setPagination((prev) => ({ ...prev, offset })),
            setLimit: (limit) => setPagination((prev) => ({ ...prev, limit, offset: 0 }))
          }}
        />
      </PageLayout.Content>
    </PageLayout>
  );
}
```

Form component template enhancement:

```handlebars
{{!-- RECOMMENDED: Enhanced admin UI form template --}}
/**
 * @file {{model.modelName}} Create Form
 * @description Admin UI form for creating a new {{model.singular}}
 */

import React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Form, 
  Button, 
  useToast, 
  Input, 
  Textarea, 
  Select, 
  Checkbox, 
  DatePicker 
} from "@medusa-ui/core";
import { create{{model.modelName}}Schema } from "@admin/validators/{{module.plural}}/{{model.plural}}";
import { create{{model.modelName}} } from "@admin/api/{{module.plural}}/{{model.plural}}";
import type { Create{{model.modelName}}Input } from "@admin/types";

export default function {{model.modelName}}CreateForm() {
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm<Create{{model.modelName}}Input>({
    resolver: zodResolver(create{{model.modelName}}Schema),
    defaultValues: {
      {{#each model.fields}}
      {{#unless relation}}
      {{#if default}}{{name}}: {{default}},{{/if}}
      {{/unless}}
      {{/each}}
    }
  });
  
  const onSubmit = async (data: Create{{model.modelName}}Input) => {
    try {
      await create{{model.modelName}}(data);
      toast({
        variant: "success",
        title: "{{model.singular}} created",
        description: "The {{model.singular}} has been created successfully."
      });
      router.push("/{{module.plural}}/{{model.plural}}");
    } catch (error) {
      console.error("Failed to create {{model.singular}}:", error);
      toast({
        variant: "error",
        title: "Error creating {{model.singular}}",
        description: "Please try again or contact support if the issue persists."
      });
    }
  };
  
  return (
    <Form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 gap-y-4">
        {{#each model.fields}}
        {{#unless relation}}
        <Form.Field
          control={form.control}
          name="{{name}}"
          label="{{toTitleCase name}}"
          {{#if required}}required{{/if}}
        >
          {({ field }) => (
            {{#if (eq type "text")}}
            <Input {...field} placeholder="Enter {{toTitleCase name}}" />
            {{else if (eq type "number")}}
            <Input
              {...field}
              type="number"
              placeholder="Enter {{toTitleCase name}}"
              onChange={(e) => field.onChange(Number(e.target.value))}
            />
            {{else if (eq type "boolean")}}
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
              label="{{toTitleCase name}}"
            />
            {{else if (eq type "date")}}
            <DatePicker
              date={field.value ? new Date(field.value) : undefined}
              onSelect={(date) => field.onChange(date)}
            />
            {{/if}}
          )}
        </Form.Field>
        {{/unless}}
        {{/each}}
        
        {{#each model.fields}}
        {{#if relation}}
        {{#if (eq relation.type "belongsTo")}}
        <Form.Field
          control={form.control}
          name="{{name}}_id"
          label="{{toTitleCase name}}"
          {{#if required}}required{{/if}}
        >
          {({ field }) => (
            <Select
              {...field}
              placeholder="Select {{toTitleCase name}}"
              options={async () => {
                // This would be replaced with actual API call
                return [
                  { label: "Option 1", value: "1" },
                  { label: "Option 2", value: "2" }
                ];
              }}
            />
          )}
        </Form.Field>
        {{/if}}
        {{/if}}
        {{/each}}
      </div>
      
      <div className="mt-6 flex items-center justify-end gap-x-2">
        <Button
          variant="secondary"
          onClick={() => router.push("/{{module.plural}}/{{model.plural}}")}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={form.formState.isSubmitting}>
          Create
        </Button>
      </div>
    </Form>
  );
}
```

Issues with current admin UI templates:
1. Limited TypeScript type support
2. Inconsistent form field rendering based on field types
3. Missing validation integration with form libraries
4. No structured error handling
5. Limited API integration patterns

### Workflow Templates

Improve workflow templates for better error handling and consistency:

```handlebars
{{!-- RECOMMENDED: Enhanced workflow template --}}
/**
 * @file {{model.modelName}} Create Workflow
 * @description Workflow for creating {{model.plural}}
 */

import { createStep, StepResponse, WorkflowBuilder } from "@medusa-workflows/core";
import { container } from "@medusa/di";
import type { Create{{model.modelName}}Input, {{model.modelName}}Type } from "@admin/types";

export const create{{model.modelName}}Step = createStep(
  "create-{{model.name}}-step",
  async (input: Create{{model.modelName}}Input, { container }) => {
    try {
      const service = container.resolve("{{model.name}}");
      const result = await service.create(input);
      return new StepResponse<{{model.modelName}}Type>(result, result.id);
    } catch (error) {
      console.error(`Error creating {{model.singular}}:`, error);
      throw new Error(`Failed to create {{model.singular}}: ${error.message}`);
    }
  },
  async (id: string, { container }) => {
    if (!id) return;
    try {
      const service = container.resolve("{{model.name}}");
      await service.delete(id);
    } catch (error) {
      console.error(`Error rolling back {{model.singular}} creation:`, error);
      throw new Error(`Failed to roll back {{model.singular}} creation: ${error.message}`);
    }
  }
);

export const create{{model.modelName}}Workflow = new WorkflowBuilder()
  .addStep(create{{model.modelName}}Step)
  {{#each model.fields}}
  {{#if relation}}
  {{#if (eq relation.type "hasMany")}}
  .addStep((input, context) => {
    // Handle hasMany relationship setup if needed
    return new StepResponse(input);
  })
  {{/if}}
  {{#if (eq relation.type "manyToMany")}}
  .addStep((input, context) => {
    // Handle manyToMany relationship setup if needed
    return new StepResponse(input);
  })
  {{/if}}
  {{/if}}
  {{/each}}
  .build();

export default create{{model.modelName}}Workflow;
```

Issues with current workflow templates:
1. Limited error handling in steps
2. No consistent pattern for relationship handling
3. Missing type safety
4. Inconsistent rollback handling

### Service and Infrastructure Templates

Enhance service templates for better consistency and error handling:

```handlebars
{{!-- RECOMMENDED: Enhanced service template --}}
/**
 * @file {{module.moduleModelName}} module service configuration
 * @description Service registrations for the {{module.moduleName}} module
 */

import { asClass, createContainer, InjectionMode } from "awilix";
import { MedusaContainer } from "@medusa/core";

// Import models
{{#each module.models}}
import {{modelName}} from "{{#if (eq name module.moduleName)}}./{{else}}./models/{{name}}{{/if}}";
{{/each}}

// Import services
{{#each module.models}}
import {{modelName}}Service from "./services/{{name}}";
{{/each}}

export default async (container: MedusaContainer): Promise<void> => {
  // Register models
  {{#each module.models}}
  container.register({
    ["{{name}}_model"]: asValue({{modelName}}),
  });
  {{/each}}

  // Register services
  {{#each module.models}}
  container.register({
    ["{{name}}"]: asClass({{modelName}}Service).singleton(),
  });
  {{/each}}
};
```

Issues with current service templates:
1. Inconsistent registration patterns
2. Missing structured error handling
3. Limited dependency injection capabilities
4. No consistent pattern for model vs. service registration

### Type Definition Templates

Improve type definition templates for better consistency and reusability:

```handlebars
{{!-- RECOMMENDED: Enhanced types template --}}
/**
 * @file Generated type definitions
 * @description Type definitions for all modules and models
 */

// Import types from all models
{{#each modules}}
{{#each models}}
import { 
  {{modelName}}Type, 
  Create{{modelName}}Input, 
  Update{{modelName}}Input 
} from "../modules/{{../plural}}/models/{{name}}";
{{/each}}
{{/each}}

// Re-export all types
{{#each modules}}
{{#each models}}
export type { 
  {{modelName}}Type, 
  Create{{modelName}}Input, 
  Update{{modelName}}Input 
};
{{/each}}
{{/each}}
```

Issues with current type definition templates:
1. Inconsistent type naming
2. Missing input/output type definitions
3. Duplicated type definitions across files
4. No consistent pattern for re-exporting types

### Seed Data Templates

The current seed template has several areas for improvement:

1. **Complex relationship handling**: The current template has limited support for circular dependencies and many-to-many relationships.
2. **Error handling**: Limited error recovery when seed data creation fails.
3. **Faker method parsing**: The current method of parsing faker methods is error-prone.
4. **Batch creation**: Records are created one at a time, which can be inefficient.
5. **Dependency tracking**: The dependency resolution could be improved.

Enhanced seed template recommendation:

```handlebars
{{!-- RECOMMENDED: Enhanced seed template --}}
/**
 * @file Database seeder
 * @description Generate test data for all modules
 */

import { faker } from "@faker-js/faker";
import { MedusaContainer } from "@medusajs/framework/types";
import { 
  {{#each modules}}
  {{#each models}}
  {{modelName}},
  {{modelName}}Type,
  {{/each}}
  {{/each}} 
} from "../admin/types";
{{#each modules}}
import { {{toUpperCase plural}}_MODULE } from "../modules/{{this.plural}}";
import {{toPascalCase plural}}ModuleService from "../modules/{{this.plural}}/service";
{{/each}}

// Constants for seeding quantities
{{#each modules}}
const {{toUpperCase singular}}_COUNT = 10;
{{#each models}}
{{#if (not (eq name ../moduleModelName))}}
const {{toUpperCase ../singular}}_{{toUpperCase plural}}_PER_{{toUpperCase ../singular}} = 2;
{{/if}}
{{/each}}
{{/each}}

// Cache for created records to handle relationships
const recordCache = new Map<string, string[]>();

// Faker method executor - safer parsing with error handling
function executeFakerMethod(fakerMethod: string): any {
  try {
    const [namespace, methodWithArgs] = fakerMethod.split(".");
    
    if (!namespace || !methodWithArgs || !faker[namespace]) {
      console.warn(`Invalid faker method: ${fakerMethod}. Using fallback.`);
      return faker.lorem.word();
    }
    
    // Handle methods with arguments
    if (methodWithArgs.includes("(")) {
      const methodName = methodWithArgs.split("(")[0];
      const argsMatch = methodWithArgs.match(/\((.+)\)/);
      
      if (!methodName || !faker[namespace][methodName]) {
        console.warn(`Invalid faker method: ${fakerMethod}. Using fallback.`);
        return faker.lorem.word();
      }
      
      // Special handling for common methods with arguments
      if (namespace === 'number' && methodName === 'int') {
        if (argsMatch) {
          try {
            // Parse the arguments object safely
            const argsString = argsMatch[1].trim();
            if (argsString.startsWith('{') && argsString.endsWith('}')) {
              const argsObj = JSON.parse(
                argsString
                  .replace(/([a-zA-Z0-9_]+):/g, '"$1":') // Convert property names to strings
                  .replace(/'/g, '"') // Replace single quotes with double quotes
              );
              return faker.number.int(argsObj);
            }
          } catch (e) {
            console.warn(`Failed to parse arguments for ${fakerMethod}. Using fallback.`);
          }
        }
        return faker.number.int();
      }
      
      // Generic handler for other methods with arguments
      return faker[namespace][methodName]();
    }
    
    // Simple methods without arguments
    return faker[namespace][methodWithArgs]();
  } catch (error) {
    console.warn(`Error executing faker method ${fakerMethod}:`, error);
    return faker.lorem.word(); // Fallback
  }
}

// Dependency resolution - improved to handle circular dependencies
function sortModelsByDependencyGraph(models: any[]): any[] {
  const visited = new Set<string>();
  const result: any[] = [];
  const temp = new Set<string>();
  
  // Build adjacency list
  const graph = new Map<string, string[]>();
  for (const model of models) {
    const dependencies = model.config.fields
      .filter(f => f.relation && f.relation.type === "belongsTo")
      .map(f => f.relation.model);
    
    graph.set(model.name, dependencies);
  }
  
  // DFS with cycle detection
  function visit(modelName: string): void {
    if (temp.has(modelName)) {
      // Circular dependency detected - we'll handle this during creation
      console.warn(`Circular dependency detected for model: ${modelName}`);
      return;
    }
    
    if (visited.has(modelName)) return;
    
    temp.add(modelName);
    
    const dependencies = graph.get(modelName) || [];
    for (const dependency of dependencies) {
      const dependencyModel = models.find(m => m.name === dependency);
      if (dependencyModel) {
        visit(dependency);
      }
    }
    
    temp.delete(modelName);
    visited.add(modelName);
    result.push(models.find(m => m.name === modelName));
  }
  
  // Start DFS from each model
  for (const model of models) {
    if (!visited.has(model.name)) {
      visit(model.name);
    }
  }
  
  return result;
}

// Batch creation for better performance
async function createModelBatch(
  model: any, 
  count: number, 
  moduleService: any, 
  existingRecords: Map<string, string[]>
): Promise<void> {
  console.log(`Creating ${count} ${model.name} records...`);
  const batchSize = 10;
  
  for (let i = 0; i < count; i += batchSize) {
    const recordsToCreate = Math.min(batchSize, count - i);
    const records = [];
    
    for (let j = 0; j < recordsToCreate; j++) {
      records.push(await generateRecord(model, moduleService, existingRecords));
    }
    
    try {
      // Create records in batch where supported
      const createdRecords = await Promise.all(records.map(data => 
        moduleService[`create${model.modelNamePlural}`](data)
      ));
      
      // Add to cache for relationship resolution
      if (!existingRecords.has(model.name)) {
        existingRecords.set(model.name, []);
      }
      
      createdRecords.forEach(record => {
        existingRecords.get(model.name)?.push(record.id);
      });
      
      console.log(`Created ${model.name} records ${i+1}-${i+recordsToCreate}/${count}`);
    } catch (error) {
      console.error(`Error creating ${model.name} records:`, error);
      // Continue with next batch rather than failing completely
    }
  }
}

// Record generation with improved relationship handling
async function generateRecord(
  model: any, 
  moduleService: any, 
  existingRecords: Map<string, string[]>
): Promise<Record<string, any>> {
  const data: Record<string, any> = {};
  
  for (const field of model.config.fields) {
    if (field.relation) {
      if (field.relation.type === "belongsTo") {
        // Get a related record ID from cache if available
        const relatedModelName = field.relation.model;
        
        if (existingRecords.has(relatedModelName) && existingRecords.get(relatedModelName)?.length) {
          const ids = existingRecords.get(relatedModelName) || [];
          if (ids.length > 0) {
            // Select a random ID
            data[`${field.name}_id`] = ids[Math.floor(Math.random() * ids.length)];
            continue;
          }
        }
        
        // Fallback to fetching if no cached IDs
        try {
          const moduleService = container.cradle[relatedModelName.toLowerCase()];
          if (moduleService) {
            const records = await moduleService.list({}, { take: 1, select: ['id'] });
            if (records.length > 0) {
              data[`${field.name}_id`] = records[0].id;
            }
          }
        } catch (error) {
          console.warn(`Failed to get related record for ${field.name}:`, error);
          // Continue without the relationship
        }
      }
      // Other relationship types handled after creation
    } else {
      // Generate data using faker
      const fakerMethod = 
        model.config.faker?.fields?.[field.name] || 
        {
          text: "lorem.word",
          number: "number.int({ min: 1, max: 100 })",
          boolean: "datatype.boolean",
          date: "date.recent"
        }[field.type] || "lorem.word";
      
      // Use safer faker method execution
      data[field.name] = executeFakerMethod(fakerMethod);
    }
  }
  
  return data;
}

// Main seed function
export default async function seed(
  { container }: { container: MedusaContainer },
  quantity: number = 10
): Promise<void> {
  console.log("Starting seed process...");
  const startTime = Date.now();
  
  try {
    {{#each modules}}
    console.log("\nSeeding {{toSentenceCase moduleName}} module...");
    
    // Get service
    const {{toCamelCase this.plural}}ModuleService = container.cradle[{{toUpperCase this.plural}}_MODULE];
    
    // Build model configurations
    const {{singular}}Models = [
      {{#each models}}
      {
        name: "{{modelName}}",
        modelNamePlural: "{{modelNamePlural}}",
        config: {
          fields: [
            {{#each fields}}
            {
              name: "{{name}}",
              type: "{{type}}" as const,
              {{#if relation}}
              relation: {
                type: "{{relation.type}}" as const,
                model: "{{relation.model}}",
                {{#if relation.mappedBy}}
                mappedBy: "{{relation.mappedBy}}",
                {{/if}}
              },
              {{/if}}
            },
            {{/each}}
          ] as const,
          faker: {
            fields: {
              {{#if faker.fields}}
              {{#each faker.fields}}
              "{{@key}}": "{{this}}",
              {{/each}}
              {{/if}}
            }
          }
        },
        count: {{#if (eq name ../moduleModelName)}}quantity{{else}}quantity * 2{{/if}}
      },
      {{/each}}
    ];

    // Sort models by dependency
    const sortedModels = sortModelsByDependencyGraph({{singular}}Models);
    
    // Create records for each model in dependency order
    for (const model of sortedModels) {
      await createModelBatch(
        model, 
        model.count, 
        {{toCamelCase this.plural}}ModuleService, 
        recordCache
      );
    }
    
    // Process many-to-many relationships after all records are created
    for (const model of sortedModels) {
      for (const field of model.config.fields) {
        if (field.relation && field.relation.type === "manyToMany") {
          await setupManyToManyRelationships(
            model,
            field,
            {{toCamelCase this.plural}}ModuleService,
            recordCache
          );
        }
      }
    }
    {{/each}}

    const endTime = Date.now();
    console.log(`\nSeed completed in ${(endTime - startTime) / 1000}s`);

  } catch (error) {
    console.error("Error during seed process:", error);
    throw error;
  }
}

// Setup many-to-many relationships
async function setupManyToManyRelationships(
  model: any,
  field: any,
  moduleService: any,
  recordCache: Map<string, string[]>
): Promise<void> {
  console.log(`Setting up many-to-many relationships for ${model.name}.${field.name}...`);
  
  // Get IDs of both sides of the relationship
  const sourceIds = recordCache.get(model.name) || [];
  const targetIds = recordCache.get(field.relation.model) || [];
  
  if (sourceIds.length === 0 || targetIds.length === 0) {
    console.warn(`Missing records for many-to-many relationship ${model.name}.${field.name}`);
    return;
  }
  
  // Setup relationships - connect each source to 1-3 random targets
  for (const sourceId of sourceIds) {
    const numRelations = Math.floor(Math.random() * 3) + 1;
    const selectedTargetIds = [...targetIds]
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.min(numRelations, targetIds.length));
    
    try {
      // This would need to match your API for connecting many-to-many relationships
      await moduleService[`connect${model.modelNamePlural}To${field.relation.model}`](
        sourceId,
        selectedTargetIds
      );
    } catch (error) {
      console.warn(`Failed to connect ${model.name} to ${field.relation.model}:`, error);
    }
  }
}

// Run seeder if executed directly
if (require.main === module) {
  const { container } = require('../container');
  seed({ container })
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}
```

Key improvements in this enhanced seed template:

1. **Safer Faker Method Execution**:
   - Robust parsing of faker methods with error handling
   - Fallback to default values when method parsing fails
   - Special handling for common methods with complex arguments

2. **Improved Dependency Resolution**:
   - Graph-based topological sorting to handle dependencies more accurately
   - Explicit detection and handling of circular dependencies
   - Clear warnings for dependency issues

3. **Batch Processing**:
   - Records are created in batches for better performance
   - Failed batch creation doesn't stop the entire process
   - Progress tracking per batch

4. **Record Caching**:
   - Created records are cached by model type for relationship resolution
   - Reduces database queries when establishing relationships
   - Improves performance for large datasets

5. **Many-to-Many Relationship Handling**:
   - Explicit step for setting up many-to-many relationships
   - Random selection of related records for realistic data
   - Error handling for relationship setup failures

6. **Comprehensive Error Handling**:
   - Graceful recovery from failures at various stages
   - Detailed error logging
   - Process continues despite non-critical errors

These improvements make the seed process more robust, more efficient, and better at handling complex data relationships while providing clear progress information and error handling.

## Test Coverage Improvements

### Add Error Handling Tests

```javascript
describe('Error Handling', () => {
  it('should handle missing templates gracefully', async () => {
    // Mock fs.readFile to throw for a specific template
    const originalReadFile = fs.readFile;
    fs.readFile = jest.fn().mockImplementation((path, options) => {
      if (path.includes('missing-template')) {
        return Promise.reject(new Error('File not found'));
      }
      return originalReadFile(path, options);
    });
    
    // Test with a config that would require the missing template
    const result = generateModule({
      ...TEST_MODULE,
      // Configure to trigger the missing template
    }, { testMode: true, dryRun: true });
    
    await expect(result).rejects.toThrow('File not found');
    
    // Restore original function
    fs.readFile = originalReadFile;
  });
  
  it('should handle invalid templates gracefully', async () => {
    // Mock fs.readFile to return invalid template content
    const originalReadFile = fs.readFile;
    fs.readFile = jest.fn().mockImplementation((path, options) => {
      if (path.includes('route.hbs')) {
        return Promise.resolve('{{#each models}}{{#if}} <!-- Missing end tags -->');
      }
      return originalReadFile(path, options);
    });
    
    // Test with a config that would use the invalid template
    const result = generateModule(TEST_MODULE, { testMode: true, dryRun: true });
    
    await expect(result).rejects.toThrow(/Invalid template|Parse error/);
    
    // Restore original function
    fs.readFile = originalReadFile;
  });
});
```

### Test Complex Relationships

```javascript
describe('Complex Relationships', () => {
  it('should handle circular dependencies correctly', async () => {
    const CIRCULAR_MODULE = {
      moduleName: 'circular',
      moduleModelName: 'CircularA',
      singular: 'circular',
      plural: 'circulars',
      models: [
        {
          name: 'circular-a',
          modelName: 'CircularA',
          modelNamePlural: 'CircularAs',
          singular: 'circularA',
          plural: 'circularAs',
          fields: [
            {
              name: 'circular_b',
              type: 'string',
              relation: {
                type: 'belongsTo',
                model: 'CircularB'
              }
            }
          ]
        },
        {
          name: 'circular-b',
          modelName: 'CircularB',
          modelNamePlural: 'CircularBs',
          singular: 'circularB',
          plural: 'circularBs',
          fields: [
            {
              name: 'circular_a',
              type: 'string',
              relation: {
                type: 'belongsTo',
                model: 'CircularA'
              }
            }
          ]
        }
      ]
    };
    
    await generateModule(CIRCULAR_MODULE, { testMode: true });
    
    // Verify files were generated correctly
    const modelAPath = path.join('.test-output', 'src/modules/circulars/models/circular-a.ts');
    const modelBPath = path.join('.test-output', 'src/modules/circulars/models/circular-b.ts');
    
    expect(await TestUtils.fileExists(modelAPath)).toBe(true);
    expect(await TestUtils.fileExists(modelBPath)).toBe(true);
    
    // Check that circular references are handled properly
    const modelAContent = await TestUtils.readGeneratedFile(modelAPath);
    const modelBContent = await TestUtils.readGeneratedFile(modelBPath);
    
    expect(modelAContent).toContain('circular_b: model.belongsTo(() => CircularB');
    expect(modelBContent).toContain('circular_a: model.belongsTo(() => CircularA');
  });

  it('should handle many-to-many relationships correctly', async () => {
    // Test configuration with many-to-many relationships
    const MANY_TO_MANY_TEST = {
      moduleName: 'products',
      moduleModelName: 'Product',
      singular: 'product',
      plural: 'products',
      models: [
        {
          name: 'product',
          modelName: 'Product',
          modelNamePlural: 'Products',
          singular: 'product',
          plural: 'products',
          fields: [
            {
              name: 'name',
              type: 'text',
              required: true
            },
            {
              name: 'tags',
              type: 'text',
              relation: {
                type: 'manyToMany',
                model: 'Tag',
                through: 'product_tags',
                mappedBy: 'products'
              }
            }
          ]
        },
        {
          name: 'tag',
          modelName: 'Tag',
          modelNamePlural: 'Tags',
          singular: 'tag',
          plural: 'tags',
          fields: [
            {
              name: 'name',
              type: 'text',
              required: true
            },
            {
              name: 'products',
              type: 'text',
              relation: {
                type: 'manyToMany',
                model: 'Product',
                through: 'product_tags',
                mappedBy: 'tags'
              }
            }
          ]
        }
      ]
    };

    await generateModule(MANY_TO_MANY_TEST, { testMode: true });
    
    // Verify the models contain correct many-to-many configuration
    const productModelPath = path.join('.test-output', 'src/modules/products/models/product.ts');
    const productModelContent = await TestUtils.readGeneratedFile(productModelPath);
    
    expect(productModelContent).toContain('tags: model.manyToMany(() => Tag, {');
    expect(productModelContent).toContain('through: "product_tags"');
    expect(productModelContent).toContain('mappedBy: "products"');
  });
});
```

### Test File Merging

```javascript
describe('File Merging', () => {
  it('should preserve existing content when merging files', async () => {
    // Create an existing file
    const testDir = path.join('.test-output', 'src/modules/tests');
    await fs.mkdir(testDir, { recursive: true });
    
    const existingFilePath = path.join(testDir, 'service.ts');
    const existingContent = `
      // CUSTOM CODE: DO NOT REMOVE
      export const customFunction = () => {
        return 'custom';
      };
      // END CUSTOM CODE
      
      // GENERATOR: MERGE POINT
    `;
    
    await fs.writeFile(existingFilePath, existingContent);
    
    // Generate module which would normally overwrite this file
    await generateModule(TEST_MODULE, { testMode: true });
    
    // Read the merged file
    const mergedContent = await TestUtils.readGeneratedFile(existingFilePath);
    
    // Verify custom code was preserved
    expect(mergedContent).toContain('// CUSTOM CODE: DO NOT REMOVE');
    expect(mergedContent).toContain('export const customFunction = () => {');
    expect(mergedContent).toContain('// END CUSTOM CODE');
    
    // Verify new content was added
    expect(mergedContent).toContain('export default');
  });
  
  it('should handle conflicting changes gracefully', async () => {
    // Create an existing file with potential conflict markers
    const testDir = path.join('.test-output', 'src/modules/tests');
    await fs.mkdir(testDir, { recursive: true });
    
    const existingFilePath = path.join(testDir, 'model.ts');
    const existingContent = `
      // AUTO-GENERATED START
      export type TestModel = {
        id: string;
        custom_field: string; // This would be overwritten in a naive merge
      };
      // AUTO-GENERATED END
    `;
    
    await fs.writeFile(existingFilePath, existingContent);
    
    // Generate module with conflicting definition
    const CONFLICTING_MODULE = {
      ...TEST_MODULE,
      models: [{
        ...TEST_MODULE.models[0],
        fields: [
          { name: 'id', type: 'string' },
          { name: 'different_field', type: 'string' }
        ]
      }]
    };
    
    await generateModule(CONFLICTING_MODULE, { testMode: true });
    
    // Read the merged file
    const mergedContent = await TestUtils.readGeneratedFile(existingFilePath);
    
    // Verify the auto-generated section was updated
    expect(mergedContent).toContain('different_field: string;');
    expect(mergedContent).not.toContain('custom_field: string;');
  });
});
```

### Add Performance Benchmarks

```javascript
describe('Performance Benchmarks', () => {
  it('should generate a simple module within performance thresholds', async () => {
    // Measure generation time
    const startTime = process.hrtime.bigint();
    
    await generateModule(TEST_MODULE, { testMode: true });
    
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1e6; // Convert to milliseconds
    
    console.log(`Generation time: ${duration}ms`);
    
    // Set a reasonable threshold (adjust based on hardware expectations)
    expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
  });
  
  it('should handle large modules efficiently', async () => {
    // Create a large module with many models and fields
    const LARGE_MODULE = {
      ...TEST_MODULE,
      models: Array(20).fill(0).map((_, i) => ({
        name: `test-model-${i}`,
        modelName: `TestModel${i}`,
        modelNamePlural: `TestModel${i}s`,
        singular: `testModel${i}`,
        plural: `testModels${i}`,
        fields: Array(15).fill(0).map((_, j) => ({
          name: `field_${j}`,
          type: 'text',
          required: j % 2 === 0
        }))
      }))
    };
    
    const startTime = process.hrtime.bigint();
    
    await generateModule(LARGE_MODULE, { testMode: true, dryRun: true });
    
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1e6; // Convert to milliseconds
    
    console.log(`Large module generation time: ${duration}ms`);
    
    // Set a reasonable threshold for large modules
    expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
  });
});
```

## Configuration Improvements

### Enhance Type Validation

Add runtime validation for module configurations:

```typescript
import { z } from 'zod';

// Define Zod schema for configuration validation
const RelationSchema = z.object({
  type: z.enum(['belongsTo', 'hasMany', 'manyToMany']),
  model: z.string(),
  mappedBy: z.string().optional(),
  through: z.string().optional(),
  inverse: z.string().optional(),
  pivotTable: z.string().optional(),
  joinColumn: z.string().optional(),
  inverseJoinColumn: z.string().optional()
});

const FieldSchema = z.object({
  name: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'date', 'text']),
  required: z.boolean().optional(),
  relation: RelationSchema.optional(),
  default: z.any().optional()
});

const ModelSchema = z.object({
  name: z.string(),
  modelName: z.string(),
  modelNamePlural: z.string(),
  singular: z.string(),
  plural: z.string(),
  icon: z.string().optional(),
  isParent: z.boolean().optional(),
  parent: z.object({
    model: z.string(),
    routePrefix: z.string()
  }).optional(),
  faker: z.record(z.any()).optional(),
  fields: z.array(FieldSchema)
});

const ModuleSchema = z.object({
  moduleName: z.string(),
  moduleModelName: z.string(),
  singular: z.string(),
  plural: z.string(),
  faker: z.record(z.any()).optional(),
  models: z.array(ModelSchema)
});

// Validate configuration before processing
function validateModuleConfig(config: ModuleConfig): void {
  try {
    ModuleSchema.parse(config);
  } catch (error) {
    console.error('Invalid module configuration:', error);
    throw new Error(`Invalid module configuration: ${error.message}`);
  }
}
```

### Simplify Common Patterns

Add helper functions for common configuration patterns:

```typescript
// Helper function to create a basic model
function createBasicModel(name: string, fields: Partial<ModelField>[]): ModelConfig {
  const singular = name;
  const plural = pluralize(name);
  const pascalName = toPascalCase(name);
  
  return {
    name,
    modelName: pascalName,
    modelNamePlural: `${pascalName}s`,
    singular,
    plural,
    fields: fields.map(field => ({
      ...field,
      type: field.type || 'text'
    }))
  };
}

// Helper function to add a belongsTo relation
function addBelongsToRelation(model: ModelConfig, targetModel: string, options?: {
  fieldName?: string;
  mappedBy?: string;
}): ModelConfig {
  const fieldName = options?.fieldName || toCamelCase(targetModel);
  
  return {
    ...model,
    fields: [
      ...model.fields,
      {
        name: fieldName,
        type: 'text',
        relation: {
          type: 'belongsTo',
          model: targetModel,
          mappedBy: options?.mappedBy
        }
      }
    ]
  };
}

// Helper function to add a hasMany relation
function addHasManyRelation(model: ModelConfig, targetModel: string, options?: {
  fieldName?: string;
  mappedBy?: string;
}): ModelConfig {
  const fieldName = options?.fieldName || `${pluralize(toCamelCase(targetModel))}`;
  
  return {
    ...model,
    fields: [
      ...model.fields,
      {
        name: fieldName,
        type: 'text',
        relation: {
          type: 'hasMany',
          model: targetModel,
          mappedBy: options?.mappedBy
        }
      }
    ]
  };
}
```

### Add Configuration Presets

Create preset configurations for common module patterns:

```typescript
// Preset for a basic CRUD module
function createCrudModule(name: string, fields: Partial<ModelField>[]): ModuleConfig {
  const singular = name;
  const plural = pluralize(name);
  const pascalName = toPascalCase(name);
  
  const model = createBasicModel(name, fields);
  
  return {
    moduleName: plural,
    moduleModelName: pascalName,
    singular,
    plural,
    models: [model]
  };
}

// Preset for a parent-child module
function createParentChildModule(
  parentName: string, 
  childName: string,
  parentFields: Partial<ModelField>[],
  childFields: Partial<ModelField>[]
): ModuleConfig {
  const parentSingular = parentName;
  const parentPlural = pluralize(parentName);
  const parentPascalName = toPascalCase(parentName);
  
  const childSingular = childName;
  const childPlural = pluralize(childName);
  const childPascalName = toPascalCase(childName);
  
  // Create parent model
  const parentModel: ModelConfig = {
    name: parentName,
    modelName: parentPascalName,
    modelNamePlural: `${parentPascalName}s`,
    singular: parentSingular,
    plural: parentPlural,
    isParent: true,
    fields: [
      ...parentFields,
      {
        name: childPlural,
        type: 'text',
        relation: {
          type: 'hasMany',
          model: childPascalName,
          mappedBy: parentSingular
        }
      }
    ]
  };
  
  // Create child model
  const childModel: ModelConfig = {
    name: childName,
    modelName: childPascalName,
    modelNamePlural: `${childPascalName}s`,
    singular: childSingular,
    plural: childPlural,
    parent: {
      model: parentPascalName,
      routePrefix: `${parentPlural}/${childPlural}`
    },
    fields: [
      ...childFields,
      {
        name: parentSingular,
        type: 'text',
        relation: {
          type: 'belongsTo',
          model: parentPascalName,
          mappedBy: childPlural
        }
      }
    ]
  };
  
  return {
    moduleName: parentPlural,
    moduleModelName: parentPascalName,
    singular: parentSingular,
    plural: parentPlural,
    models: [parentModel, childModel]
  };
}
```

## Implementation Roadmap

1. **Phase 1: Helper Refactoring**
   - Consolidate overlapping helpers
   - Implement proper pluralization
   - Add unified comparison helper
   - Improve debug helper
   - Enhance relation helpers

2. **Phase 2: Code Structure Improvements**
   - Modularize helper registration
   - Enhance error handling
   - Add template validation
   - Implement file merging strategy
   - Refactor core generation logic

3. **Phase 3: Template Improvements**
   - Standardize model templates
   - Enhance API route templates
   - Improve admin UI templates
   - Optimize workflow templates
   - Update service templates
   - Enhance seed data templates

4. **Phase 4: Test Coverage Expansion**
   - Add error handling tests
   - Test complex relationships
   - Test file merging capabilities
   - Add performance benchmarks
   - Test configuration validation

5. **Phase 5: Configuration Enhancements**
   - Add runtime type validation
   - Create helper functions for common patterns
   - Implement configuration presets
   - Add configuration documentation

6. **Phase 6: Documentation and Examples**
   - Create comprehensive documentation
   - Add example configurations
   - Document template customization options
   - Create migration guide for existing users
   - Add troubleshooting guides 