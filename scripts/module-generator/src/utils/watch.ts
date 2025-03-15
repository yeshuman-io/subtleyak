import * as chokidar from 'chokidar';
import * as path from 'path';
import debounce from 'lodash/debounce';
import type { ModuleConfig } from '../generate-v2.js';
import { main as cliMain } from '../cli.js';
import chalk from 'chalk';

export type WatchOptions = {
  templatesDir: string;
  outputDir: string;
  debounceMs?: number;
  onError?: (error: Error) => void;
  configPath?: string;
};

const DEFAULT_OPTIONS: WatchOptions = {
  templatesDir: path.join(process.cwd(), 'scripts/module-generator/templates'),
  outputDir: path.join(process.cwd(), 'src'),
  debounceMs: 300
};

export async function watch(
  options: Partial<WatchOptions> = {}
): Promise<() => void> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { templatesDir, debounceMs, onError, configPath } = opts;

  if (!configPath) {
    throw new Error('No config path provided');
  }

  console.log('Templates directory:', templatesDir);

  // Define patterns to watch
  const patterns = [
    // Watch all template files recursively
    path.join(templatesDir, '**', '*.hbs')
  ];

  console.log('Watching patterns:', patterns);

  // Create watcher
  const watcher = chokidar.watch(patterns, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true // Don't trigger events for existing files
  });

  // Debounced regeneration function
  const regenerate = debounce(async () => {
    try {
      // Get all module configs from the imported config
      const imported = await import(path.resolve(configPath));
      const config = imported.default || imported;
      const modules = Object.values(config.MODULES) as ModuleConfig[];
      
      await cliMain(modules);
    } catch (error) {
      console.error(chalk.red('\n❌ Error:'), error);
      onError?.(error as Error);
    }
  }, debounceMs);

  // Setup event handlers
  watcher
    .on('ready', () => {
      console.log('Initial scan complete. Ready for changes.');
    })
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
  return () => watcher.close();
}

// Main function
async function main() {
  const configPath = process.argv[2];

  if (!configPath) {
    console.error('Please provide a config file path');
    process.exit(1);
  }

  console.log('Loading config from:', configPath);
  
  try {
    const cleanup = await watch({ configPath });
    
    // Keep the process alive
    process.stdin.resume();

    // Handle cleanup on exit
    process.on('SIGINT', () => {
      console.log('\nReceived SIGINT. Cleaning up...');
      cleanup();
      process.exit(0);
    });

    process.on('exit', () => {
      console.log('\nCleaning up...');
      cleanup();
    });
  } catch (err) {
    console.error('Watch failed:', err);
    process.exit(1);
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
} 