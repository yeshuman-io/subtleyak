import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';
import { rimraf } from 'rimraf';
import { beforeAll, afterAll } from '@jest/globals';

// Test utilities
export class TestUtils {
  static readonly TEST_OUTPUT_DIR = path.join(process.cwd(), '.test-output');

  static async createTempDir(): Promise<void> {
    if (existsSync(this.TEST_OUTPUT_DIR)) {
      await rimraf(this.TEST_OUTPUT_DIR);
    }
    await fs.mkdir(this.TEST_OUTPUT_DIR, { recursive: true });
  }

  static async cleanupTempDir(): Promise<void> {
    if (existsSync(this.TEST_OUTPUT_DIR)) {
      await rimraf(this.TEST_OUTPUT_DIR);
    }
  }

  static async readGeneratedFile(relativePath: string): Promise<string> {
    const fullPath = path.join(this.TEST_OUTPUT_DIR, relativePath);
    return fs.readFile(fullPath, 'utf-8');
  }

  static async fileExists(relativePath: string): Promise<boolean> {
    const fullPath = path.join(this.TEST_OUTPUT_DIR, relativePath);
    return existsSync(fullPath);
  }
}

// Global setup
beforeAll(async () => {
  await TestUtils.createTempDir();
}, 30000); // Increase timeout for setup

// Global teardown
afterAll(async () => {
  if (!process.env.KEEP_TEST_OUTPUT) {
    await TestUtils.cleanupTempDir();
  }
}, 30000); // Increase timeout for cleanup 