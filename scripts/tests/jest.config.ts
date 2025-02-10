import type { Config } from '@jest/types';
import path from 'path';

const config: Config.InitialOptions = {
  rootDir: path.join(__dirname, '../..'),
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      useESM: true
    }]
  },
  testEnvironment: 'node',
  roots: ['<rootDir>/scripts/tests'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@templates/(.*)': '<rootDir>/scripts/templates/$1',
    '^@utils/(.*)': '<rootDir>/scripts/utils/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/scripts/tests/setup.ts'],
  verbose: true,
  testTimeout: 10000,
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transformIgnorePatterns: [
    'node_modules/(?!(glob)/)'
  ]
};

export default config; 