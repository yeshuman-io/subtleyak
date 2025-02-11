import { spawn } from 'child_process';
import path from 'path';

// Start Jest watcher
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

// Start template watcher
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

  process.on('SIGTERM', () => {
    console.log('\nShutting down watchers...');
    processes.forEach(proc => proc.kill());
    process.exit(0);
  });
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const configPath = args[0];

  if (!configPath) {
    console.error('Please provide a config file path');
    process.exit(1);
  }

  console.log('Starting watchers...');
  
  // Start both watchers
  const jest = startJestWatcher();
  const watcher = startTemplateWatcher(configPath);
  
  // Setup cleanup
  setupCleanup(jest, watcher);
  
  console.log('\nWatchers started! Press Ctrl+C to stop.');
}

// Run if called directly
if (process.argv[1] === __filename) {
  main().catch(err => {
    console.error('Failed to start watchers:', err);
    process.exit(1);
  });
} 