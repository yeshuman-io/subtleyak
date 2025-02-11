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
API Route Generation including:
- CRUD endpoint templates
- Request/Response types
- Route handlers with local validators
- Integration with existing model layer
- Validation middleware using Zod schemas

Key patterns:
- Each route directory has its own `validators.ts` file
- Route files import from local `"./validators"`
- Child routes follow same pattern in nested directories
- Validators use Zod for request/response schemas

Previous work completed:
- Model definitions
- Field types and relations
- Service registration
- Module index files

## Development & Testing (v2)
- User will run tests in watch mode in separate terminal:
  ```bash
  npm run test:generate:keep:watchAll
  ```

- AI should use quiet test runner to avoid context pollution:
  ```bash
  npm run test:generate:quiet
  ```
  This command outputs only test failures in a compact format.

- AI to observe available test commands in package.json with the prefix `test:generate` for their use.

- AI will be given YOLO permissions to run any appropriate commands to work on iterations of tasks and should observe test results and resulting .test-output directory

## Progress Notes - JSX Template Handling

### Current Status (Session Summary)

1. **Initial Problem**
- Failing tests in module generator
- Focus on JSX Template Handling and related test failures
- Issues with Handlebars template parsing and Prettier formatting

2. **Key Changes Made**
- Fixed state variable naming in page template (`editing{{ModelName}}` → `editing`)
- Modified `formatOutput` function for JSX/TSX support:
  ```typescript
  parser: content.includes('jsx') || content.includes('tsx') ? 'typescript-react' : 'typescript'
  ```

3. **Current Issues**
- Test failures with `SyntaxError: Identifier expected` in various components
- Prettier formatting challenges with JSX/TSX content

4. **Next Steps**
1. Template Syntax Review:
   - Model relations templates
   - Service generation templates
   - Field generation templates
   - Validator generation templates
   - API route templates
   - Admin UI templates

2. Alternative Approaches:
   - Consider bypassing Prettier for JSX/TSX files
   - Add pre-processing step for Handlebars templates
   - Review JSX helper functions

3. Focus Areas:
   - Model relation generation
   - Field type handling
   - TypeScript/React code validation
   - Service file generation

4. Testing Strategy:
   - Run tests in smaller batches
   - Add granular test cases
   - Improve error reporting

### Testing Commands
```bash
# Full test suite
npm run test:generate

# Watch mode for development
npm run test:generate:watch

# Keep test output and watch
npm run test:generate:keep:watchAll

# Quiet mode (minimal output)
npm run test:generate:quiet

# File-only output
npm run test:generate:quiet:fileonly
```