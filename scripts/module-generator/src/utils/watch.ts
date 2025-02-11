import * as chokidar from 'chokidar';
import * as path from 'path';
import debounce from 'lodash/debounce';
import { generateModule } from './generate-v2';
import type { ModuleConfig } from './generate-v2';

export type WatchOptions = {
  templatesDir: string;
  outputDir: string;
  debounceMs?: number;
  onError?: (error: Error) => void;
};

const DEFAULT_OPTIONS: WatchOptions = {
  templatesDir: path.join(process.cwd(), 'scripts/templates'),
  outputDir: path.join(process.cwd(), 'src'),
  debounceMs: 300
};

export async function watchTemplates(
  moduleConfig: ModuleConfig,
  options: Partial<WatchOptions> = {}
): Promise<() => void> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { templatesDir, debounceMs, onError } = opts;

  // Define patterns to watch
  const patterns = [
    // Module templates
    path.join(templatesDir, 'src/modules/[module.plural]/**/*.hbs'),
    // API templates
    path.join(templatesDir, 'src/api/admin/**/*.hbs'),
    // Admin UI templates
    path.join(templatesDir, 'src/admin/routes/**/*.hbs'),
    // Workflow templates
    path.join(templatesDir, 'src/workflows/**/*.hbs')
  ];

  // Create watcher
  const watcher = chokidar.watch(patterns, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true
  });

  // Debounced regeneration function
  const regenerate = debounce(async () => {
    console.log('Template change detected, regenerating...');
    try {
      await generateModule(moduleConfig, { testMode: false });
      console.log('Regeneration complete');
    } catch (error) {
      console.error('Regeneration failed:', error);
      onError?.(error as Error);
    }
  }, debounceMs);

  // Setup event handlers
  watcher
    .on('add', path => {
      console.log(`Template added: ${path}`);
      regenerate();
    })
    .on('change', path => {
      console.log(`Template changed: ${path}`);
      regenerate();
    })
    .on('unlink', path => {
      console.log(`Template removed: ${path}`);
      regenerate();
    })
    .on('error', error => {
      console.error('Watch error:', error);
      onError?.(error);
    });

  // Return cleanup function
  return () => {
    watcher.close();
  };
}

// Multi-module watch function
export async function watchAll(
  moduleConfigs: ModuleConfig[],
  options: Partial<WatchOptions> = {}
): Promise<() => void> {
  const cleanupFns = await Promise.all(
    moduleConfigs.map(config => watchTemplates(config, options))
  );

  return () => {
    cleanupFns.forEach(cleanup => cleanup());
  };
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const configPath = args[0];

  if (!configPath) {
    console.error('Please provide a config file path');
    process.exit(1);
  }

  import(path.resolve(configPath))
    .then(({ config }) => {
      console.log('Starting template watch mode...');
      return watchTemplates(config);
    })
    .catch(err => {
      console.error('Watch failed:', err);
      process.exit(1);
    });
} 