import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { expect } from '@jest/globals';
import type { ModuleConfig, ModelConfig } from '../src/generate-v2.js';

export class TestUtils {
  static readonly TEST_OUTPUT_DIR = '.test-output';

  static async cleanTestDir(): Promise<void> {
    try {
      await fs.rm(this.TEST_OUTPUT_DIR, { recursive: true, force: true });
    } catch (error) {
      // Ignore if directory doesn't exist
    }
    
    // Create directory unless explicitly in dry run mode
    if (!process.env.DRY_RUN) {
      await fs.mkdir(this.TEST_OUTPUT_DIR, { recursive: true });
    }
  }

  static async fileExists(relativePath: string): Promise<boolean> {
    try {
      await fs.access(path.resolve(process.cwd(), relativePath));
      return true;
    } catch {
      return false;
    }
  }

  static async readGeneratedFile(relativePath: string): Promise<string> {
    return fs.readFile(path.resolve(process.cwd(), relativePath), 'utf-8');
  }

  static async getTemplateFiles(templateDir: string): Promise<string[]> {
    return glob('**/*.hbs', { 
      cwd: templateDir,
      absolute: true
    });
  }

  static async getGeneratedFiles(outputDir: string): Promise<string[]> {
    return glob('**/*.*', { 
      cwd: outputDir,
      absolute: false, // Return relative paths
      ignore: ['**/*.map', '**/*.d.ts'] // Ignore source maps and declaration files
    });
  }

  static async getAllFiles(dir: string): Promise<string[]> {
    return glob('**/*.*', { 
      cwd: dir,
      absolute: false, // Return relative paths
      ignore: ['**/*.map', '**/*.d.ts'] // Ignore source maps and declaration files
    });
  }

  // New helper methods for module/model paths
  static getModuleModelPath(module: ModuleConfig, baseDir: string = ''): string {
    return path.join(baseDir, 'src/modules', module.plural, `${module.moduleName}.ts`);
  }

  static getModelPath(module: ModuleConfig, model: ModelConfig, baseDir: string = ''): string {
    return path.join(baseDir, 'src/modules', module.plural, 'models', `${model.name}.ts`);
  }

  static getRoutePath(module: ModuleConfig, model: ModelConfig): string {
    return model.name === module.moduleName ? module.plural : `${module.plural}/${model.plural}`;
  }

  static getApiRoutePaths(module: ModuleConfig, model: ModelConfig, baseDir: string = ''): string[] {
    const routePath = this.getRoutePath(module, model);
    return [
      path.join(baseDir, 'src/api/admin', routePath, 'route.ts'),
      path.join(baseDir, 'src/api/admin', routePath, '[id]', 'route.ts'),
      path.join(baseDir, 'src/api/admin', routePath, 'validators.ts')
    ];
  }

  static getAdminRoutePaths(module: ModuleConfig, model: ModelConfig, baseDir: string = ''): string[] {
    const routePath = this.getRoutePath(module, model);
    return [
      path.join(baseDir, 'src/admin/routes', routePath, 'page.tsx'),
      path.join(baseDir, 'src/admin/routes', routePath, 'create', `${model.name}-create.tsx`),
      path.join(baseDir, 'src/admin/routes', routePath, 'edit', `${model.name}-edit.tsx`)
    ];
  }

  static async verifyGeneratedFiles(module: ModuleConfig, baseDir: string = '.test-output'): Promise<void> {
    // Module's own model
    const moduleModel: ModelConfig = {
      name: module.moduleName,
      singular: module.singular,
      plural: module.plural,
      fields: module.fields
    };

    // Check module model files
    const moduleModelPath = this.getModuleModelPath(module, baseDir);
    expect(await this.fileExists(moduleModelPath)).toBe(true);

    // Check module routes
    const moduleApiRoutes = this.getApiRoutePaths(module, moduleModel, baseDir);
    const moduleAdminRoutes = this.getAdminRoutePaths(module, moduleModel, baseDir);

    for (const route of [...moduleApiRoutes, ...moduleAdminRoutes]) {
      expect(await this.fileExists(route)).toBe(true);
    }

    // Check each model's files
    for (const model of module.models) {
      // Model file
      const modelPath = this.getModelPath(module, model, baseDir);
      expect(await this.fileExists(modelPath)).toBe(true);

      // Routes
      const apiRoutes = this.getApiRoutePaths(module, model, baseDir);
      const adminRoutes = this.getAdminRoutePaths(module, model, baseDir);

      for (const route of [...apiRoutes, ...adminRoutes]) {
        expect(await this.fileExists(route)).toBe(true);
      }
    }

    // Check module service and index
    const serviceFile = path.join(baseDir, 'src/modules', module.plural, 'service.ts');
    const indexFile = path.join(baseDir, 'src/modules', module.plural, 'index.ts');
    expect(await this.fileExists(serviceFile)).toBe(true);
    expect(await this.fileExists(indexFile)).toBe(true);
  }
} 