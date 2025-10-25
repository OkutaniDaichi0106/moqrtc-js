import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Tests in this repo import from 'vitest' explicitly, so globals are disabled
    globals: false,
    // Use jsdom to provide DOM globals (document, HTMLElement) for DOM-related tests
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
  resolve: {
    alias: {
      // Provide a lightweight local stub for the external package used throughout the repo
      '@okutanidaichi/moqt': '/src/test-stubs/moqt.ts',
    },
  },
});
