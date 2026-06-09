import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    // CLI black-box tests spawn node against dist/ and templates are scanned
    // from disk, so tests are independent of each other but some are slow.
    testTimeout: 30_000,
  },
});
