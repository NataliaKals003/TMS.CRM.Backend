/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    coverage: {
      include: ['lambdas/**', 'lib/**', 'models/**'],
      exclude: ['lambdas/support/knexMigration.ts', 'lib/tms.crm.backend-stack.ts'],
      provider: 'v8',
    },
    globals: true,
    globalSetup: ['tests/globalSetup.ts'],
    include: ['tests/**/*.{test,spec}.ts'],
  },
});
