import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'

// Build-time license key injection.
//
// The Ed25519 public key used to verify license tokens MUST be present in the
// binary at build time. Reading it from process.env at runtime would fail in a
// packaged Electron build, where build-time env vars are not preserved.
//
// Required for `npm run release`:
//   SS_LICENSE_PUBLIC_KEY  — PEM-encoded Ed25519 public key
//   SS_API_URL             — license backend origin (defaults to prod URL)
//
// For local `npm run dev` we fall back to a well-known dev key so the app
// still boots; the runtime guard in electron/license.ts refuses to start a
// packaged build that ships this placeholder.
const DEV_PLACEHOLDER_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEATNJphCxaR8S7gukdfvs0WNaCFndQswyq/Ld2ggtDuK4=
-----END PUBLIC KEY-----`

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const licensePublicKey = env.SS_LICENSE_PUBLIC_KEY || process.env.SS_LICENSE_PUBLIC_KEY || DEV_PLACEHOLDER_KEY
  const apiUrl = env.SS_API_URL || process.env.SS_API_URL || 'https://smartsender.vercel.app'

  // SS_RELEASE is set by the `release` npm script (electron-builder pipeline).
  // Plain `npm run build` and CI builds are allowed to use the dev placeholder
  // — the runtime guard in license.ts still refuses to start a packaged binary
  // that ships the placeholder, so this is just a faster fail at release time.
  const isReleaseBuild = process.env.SS_RELEASE === '1' || env.SS_RELEASE === '1'

  if (isReleaseBuild && licensePublicKey === DEV_PLACEHOLDER_KEY) {
    throw new Error(
      'SS_LICENSE_PUBLIC_KEY is not set for release build. Refusing to ship the dev placeholder.',
    )
  }

  const defineForMain = {
    __SS_LICENSE_PUBLIC_KEY__: JSON.stringify(licensePublicKey),
    __SS_API_URL__: JSON.stringify(apiUrl),
    __SS_LICENSE_KEY_IS_PLACEHOLDER__: JSON.stringify(licensePublicKey === DEV_PLACEHOLDER_KEY),
  }

  return {
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main.ts',
        vite: {
          define: defineForMain,
          build: {
            rollupOptions: {
              external: ['whatsapp-web.js', 'bufferutil', 'utf-8-validate', 'jose', 'chrome-paths'],
            },
          },
        },
      },
      preload: {
        input: 'electron/preload.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              output: {
                format: 'cjs',
                entryFileNames: 'preload.cjs',
              },
            },
          },
        },
      },
    }),
  ],
  base: './', // important for electron
  }
})
