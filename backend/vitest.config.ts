import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

// Backend tests run in plain node, no JSDOM. We don't have any tests that
// require Next.js routing — the unit suites target lib/ helpers directly.
//
// We resolve the `@/*` path alias manually rather than via vite-tsconfig-paths
// because that plugin is ESM-only and backend's vitest.config.ts is loaded
// as CJS (no "type": "module" in package.json).
const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    globals: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/lib/**', 'src/app/api/**'],
      exclude: ['**/*.d.ts', '**/node_modules/**'],
    },
  },
})
