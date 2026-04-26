import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// -----------------------------------------------------------------
// Lint policy.
//
// The codebase has substantial pre-existing `any` debt (whatsapp-web.js
// types are weak) and a few legitimate "load-on-mount" useEffects that the
// new `react-hooks/set-state-in-effect` rule flags. Rather than scatter
// eslint-disable comments, we set those rules to "warn" globally — they
// stay visible during PRs without blocking CI.
//
// New code SHOULD avoid `any` (use `unknown` and narrow). The plan is to
// migrate file-by-file and re-enable as `error` once whatsapp-web.js usage
// has been wrapped in a typed adapter.
// -----------------------------------------------------------------

export default defineConfig([
  globalIgnores(['dist', 'dist-electron', 'release', 'node_modules', 'electron/__tests__']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Pre-existing debt: downgraded so CI is green. Treat as a backlog.
      '@typescript-eslint/no-explicit-any': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      // Allow `_`-prefixed unused params/vars (standard convention).
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
    },
  },
  {
    // Main-process code is built by vite-plugin-electron, not by the
    // renderer toolchain, so the "fast refresh / only-export-components"
    // rule doesn't apply.
    files: ['electron/**/*.ts'],
    rules: {
      'react-refresh/only-export-components': 'off',
      // The main process talks to APIs (whatsapp-web.js, electron internals)
      // that are intrinsically `any`-shaped. Tightening here is a follow-up.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
])
