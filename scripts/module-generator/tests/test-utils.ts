import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

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
    return glob('**/*.ts', { 
      cwd: outputDir,
      absolute: false // Return relative paths
    });
  }

  static async getAllFiles(dir: string): Promise<string[]> {
    return glob('**/*.*', { 
      cwd: dir,
      absolute: false, // Return relative paths
      ignore: ['**/*.map', '**/*.d.ts'] // Ignore source maps and declaration files
    });
  }
} 