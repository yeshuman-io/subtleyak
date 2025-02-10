# Module Generator Context - Quick Start

## Key Files to Read (in this order):

1. `docs/module-generator-spec.md`
   - Overview of entire system
   - File structure and patterns
   - Required patterns and success criteria

2. `docs/progress.md`
   - Current implementation status
   - What's completed vs pending
   - Next priority items

3. `scripts/generate-v2.ts`
   - Current implementation
   - Core types and generation logic
   - Basic model generation focus

4. `scripts/tests/generator.test.ts`
   - Test coverage
   - Example configurations
   - Validation patterns

## Current Focus
Basic model generation including:
- Model definitions
- Field types and relations
- Validation rules (Zod)
- Service registration
- Module index files

Next planned work appears to be API route generation based on progress.md.

## Development & Testing (v2)
- User will run tests in watch mode in separate terminal:
  ```bash
  npm run test:generate:keep:watchAll
  ```
- AI to observe available test commands in package.json with the prefix `test:generate` for their use.

- AI will be given YOLO permissions to run any appropriate commands to work on iterations of tasks and should observe test results and resulting .test-output directory.