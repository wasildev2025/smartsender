import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

// Backend tests run in plain node, no JSDOM. We don't have any tests that
// require Next.js routing — the unit suites target lib/ helpers directly.
// Integration tests against a real Supabase would need a separate config
// with env-backed credentials; that's a follow-up.
export default defineConfig({
  plugins: [tsconfigPaths()],
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
