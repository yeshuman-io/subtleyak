import type { Config } from '@jest/types';
import path from 'path';

const config: Config.InitialOptions = {
  rootDir: path.join(__dirname, '../..'),
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      useESM: true
    }],
    '^.+\\.hbs$': 'jest-transform-stub'
  },
  testEnvironment: 'node',
  roots: [
    '<rootDir>/scripts/tests',
    '<rootDir>/scripts/templates'
  ],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@templates/(.*)': '<rootDir>/scripts/templates/$1',
    '^@utils/(.*)': '<rootDir>/scripts/utils/$1',
    '\\.hbs$': 'jest-transform-stub'
  },
  setupFilesAfterEnv: ['<rootDir>/scripts/tests/setup.ts'],
  verbose: true,
  testTimeout: 10000,
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'hbs'],
  transformIgnorePatterns: [
    'node_modules/(?!(glob)/)'
  ],
  watchPathIgnorePatterns: [],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ]
};

export default config; 