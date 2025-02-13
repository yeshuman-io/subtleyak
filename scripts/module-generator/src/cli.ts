import { generateModule } from './generate-v2';
import { MODULES } from '../configs/production-modules';

async function main() {
  console.log('Debug: Starting CLI');
  console.log('Debug: DRY_RUN =', process.env.DRY_RUN);
  console.log('Debug: DEBUG =', process.env.DEBUG);
  console.log('\n');

  for (const moduleConfig of Object.values(MODULES)) {
    await generateModule(moduleConfig, { dryRun: process.env.DRY_RUN === '1' });
  }
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
}); 