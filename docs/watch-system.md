# Watch System Implementation

## Overview
The watch system provides real-time template regeneration during development, with support for both single-module and multi-module watching. It includes debounced regeneration, error handling, and integration with Jest testing.

## Current Implementation

### Watch Configuration
```typescript
type WatchOptions = {
  templatesDir: string;      // Templates root directory
  outputDir: string;         // Output root directory
  debounceMs?: number;       // Debounce time for regeneration
  onError?: (error: Error) => void; // Error handler
};

const DEFAULT_OPTIONS: WatchOptions = {
  templatesDir: path.join(process.cwd(), 'scripts/templates'),
  outputDir: path.join(process.cwd(), 'src'),
  debounceMs: 300
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

### Current Pipeline
1. Template change detection (using chokidar)
2. Debounced regeneration trigger
3. Template compilation
4. File generation
5. Error handling

## Planned Improvements

### 1. Incremental Generation
```typescript
type FileState = {
  hash: string;
  dependencies: string[];
  lastGenerated: Date;
};

async function shouldRegenerate(
  templatePath: string,
  fileStates: Map<string, FileState>
): Promise<boolean> {
  const currentHash = await getFileHash(templatePath);
  const state = fileStates.get(templatePath);
  
  if (!state) return true;
  if (state.hash !== currentHash) return true;
  
  // Check dependencies
  for (const dep of state.dependencies) {
    if (await shouldRegenerate(dep, fileStates)) return true;
  }
  
  return false;
}
```

### 2. Template Dependency Tracking
```typescript
async function trackDependencies(
  templatePath: string,
  content: string
): Promise<string[]> {
  const deps = new Set<string>();
  
  // Track partials
  const partialMatches = content.match(/{{>\s*([^}\s]+)}}/g);
  if (partialMatches) {
    for (const match of partialMatches) {
      const partial = match.match(/{{>\s*([^}\s]+)}}/)[1];
      deps.add(resolvePartialPath(partial));
    }
  }
  
  // Track helpers
  const helperMatches = content.match(/{{#([^}\s]+)}}/g);
  if (helperMatches) {
    for (const match of helperMatches) {
      const helper = match.match(/{{#([^}\s]+)}}/)[1];
      deps.add(resolveHelperPath(helper));
    }
  }
  
  return Array.from(deps);
}
```

### 3. Improved Watch Pipeline
```typescript
async function regenerateTemplate(
  templatePath: string,
  outputPath: string,
  data: any,
  fileStates: Map<string, FileState>
): Promise<void> {
  // Before hooks
  await runBeforeHooks(templatePath);
  
  // Check if regeneration needed
  if (!await shouldRegenerate(templatePath, fileStates)) {
    console.log(`Skipping ${templatePath} - no changes`);
    return;
  }
  
  // Generate
  const content = await processTemplate(templatePath, data);
  
  // Track dependencies
  const deps = await trackDependencies(templatePath, content);
  
  // Update state
  fileStates.set(templatePath, {
    hash: await getFileHash(templatePath),
    dependencies: deps,
    lastGenerated: new Date()
  });
  
  // Write file
  await writeOutput(outputPath, content);
  
  // After hooks
  await runAfterHooks(templatePath);
}
```

### 4. Watch Patterns to Add
```typescript
const patterns = [
  // Current patterns
  'src/modules/[module.plural]/**/*.hbs',
  'src/api/admin/**/*.hbs',
  'src/admin/routes/**/*.hbs',
  'src/workflows/**/*.hbs',
  
  // New patterns to add
  'integration-tests/**/*.hbs',
  'scripts/seed/**/*.hbs',
  'src/admin/components/**/*.hbs'
];
```

### 5. Development Workflow Integration
```typescript
// In watch-all.ts
function startJestWatcher() {
  const jest = spawn('npm', ['run', 'test:generate:watchAll'], {
    stdio: 'inherit',
    shell: true
  });

  jest.on('error', (error) => {
    console.error('Jest watcher error:', error);
  });

  return jest;
}

function startTemplateWatcher(configPath: string) {
  const watcher = spawn('npx', ['ts-node', 'scripts/watch.ts', configPath], {
    stdio: 'inherit',
    shell: true
  });

  watcher.on('error', (error) => {
    console.error('Template watcher error:', error);
  });

  return watcher;
}

// Handle process cleanup
function setupCleanup(...processes: any[]) {
  process.on('SIGINT', () => {
    console.log('\nShutting down watchers...');
    processes.forEach(proc => proc.kill());
    process.exit(0);
  });
}
```

## Usage

### Basic Usage
```bash
# Watch single module
npm run watch:module scripts/modules/generate-wiper.ts

# Watch all modules
npm run watch:all
```

### Development Workflow
1. Start watchers in separate terminals:
   ```bash
   # Terminal 1: Watch templates
   npm run watch:module scripts/modules/generate-wiper.ts
   
   # Terminal 2: Watch tests
   npm run test:generate:watch
   ```

2. Edit templates and see real-time updates
3. Tests will automatically run on changes
4. Use Jest watch mode features:
   - Press `a` to run all tests
   - Press `f` to run only failed tests
   - Press `p` to filter by filename pattern
   - Press `t` to filter by test name

## Next Steps
1. Implement incremental generation
2. Add dependency tracking
3. Expand watch patterns
4. Improve error handling and recovery
5. Add hot reloading for templates
6. Better integration with Jest watch mode 