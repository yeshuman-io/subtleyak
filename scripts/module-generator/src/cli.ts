import { generateModules, type FileChange } from './generate-v2.js';
import { MODULES } from '../configs/production-modules.js';
import chalk from 'chalk';

export function printModuleSummary(moduleConfigs) {
  console.log(chalk.bold('\n📦 Modules to generate:'));
  for (const config of moduleConfigs) {
    console.log(chalk.cyan(`\n${config.moduleName} module:`));
    console.log(`  Models:`);
    for (const model of config.models) {
      console.log(`    - ${model.name} (${model.fields.length} fields)`);
    }
  }
  console.log('\n');
}

export function printGeneratedFiles(files: FileChange[]) {
  console.log(chalk.bold('\n✨ Generated files:'));
  const groups = files.reduce<Record<string, string[]>>((acc, file) => {
    const type = file.path.includes('/api/') ? 'API' 
               : file.path.includes('/admin/') ? 'Admin UI'
               : file.path.includes('/modules/') ? 'Module'
               : 'Other';
    acc[type] = acc[type] || [];
    acc[type].push(file.path);
    return acc;
  }, {});

  for (const [type, paths] of Object.entries(groups)) {
    console.log(chalk.cyan(`\n${type}:`));
    for (const path of paths.sort()) {
      console.log(`  - ${path}`);
    }
  }
}

export async function main(moduleConfigs = Object.values(MODULES)) {
  console.log(chalk.bold('🚀 Starting module generation'));
  console.log(chalk.gray('Mode:', process.env.DRY_RUN === '1' ? 'Dry Run' : 'Production'));

  printModuleSummary(moduleConfigs);

  console.log(chalk.bold('⚙️  Generating files...'));
  const generatedFiles = await generateModules(moduleConfigs, { 
    dryRun: process.env.DRY_RUN === '1' 
  });

  printGeneratedFiles(generatedFiles);
  console.log(chalk.bold('\n✅ Generation complete!\n'));
}

// Only run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(chalk.red('\n❌ Error:'), error);
    process.exit(1);
  });
} 