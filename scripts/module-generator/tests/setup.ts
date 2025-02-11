import { beforeAll, afterAll } from '@jest/globals';
import { TestUtils } from './test-utils';

beforeAll(async () => {
  await TestUtils.cleanTestDir();
});

afterAll(async () => {
  if (!process.env.KEEP_TEST_OUTPUT) {
    await TestUtils.cleanTestDir();
  }
}); 