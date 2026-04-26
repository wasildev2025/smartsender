import { defineConfig } from 'vitest/config'

// Tests run in plain node. Anything from electron/* that imports the real
// `electron` runtime is mocked per-test (see electron/__tests__/*.test.ts).
// We deliberately do NOT pull in vite-plugin-electron here — these are pure
// unit tests, no bundling required.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['electron/__tests__/**/*.test.ts'],
    globals: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['electron/**'],
      exclude: ['**/*.d.ts', '**/__tests__/**'],
    },
  },
})
