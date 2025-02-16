import { generateModules, type FileChange } from './generate-v2.js';
import { MODULES } from '../configs/production-modules.js';
import chalk from 'chalk';

function printModuleSummary(moduleConfigs) {
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

function printGeneratedFiles(files: FileChange[]) {
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

async function main() {
  console.log(chalk.bold('🚀 Starting module generation'));
  console.log(chalk.gray('Mode:', process.env.DRY_RUN === '1' ? 'Dry Run' : 'Production'));

  const moduleConfigs = Object.values(MODULES);
  printModuleSummary(moduleConfigs);

  console.log(chalk.bold('⚙️  Generating files...'));
  const generatedFiles = await generateModules(moduleConfigs, { 
    dryRun: process.env.DRY_RUN === '1' 
  });

  printGeneratedFiles(generatedFiles);
  console.log(chalk.bold('\n✅ Generation complete!\n'));
}

main().catch(error => {
  console.error(chalk.red('\n❌ Error:'), error);
  process.exit(1);
}); 