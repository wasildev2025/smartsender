import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Local additions:
    "node_modules/**",
    "supabase/**",      // SQL migrations are not lintable JS/TS
    "scripts/**",       // CommonJS bootstrap scripts deliberately use require()
    "scratch/**",       // throwaway dev scripts
  ]),
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // Pre-existing `any` debt in admin actions and the supabase mock used
      // by tests is significant. Downgrade for now, fix incrementally.
      // New code should still prefer `unknown` and narrow.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      }],
    },
  },
  {
    // Test files exercise mocks where structural any-ness is unavoidable
    // (the supabase fake intercepts an arbitrary chain, by design).
    files: ["tests/**/*.ts", "**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);

export default eslintConfig;
