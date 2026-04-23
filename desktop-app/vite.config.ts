import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    electron({
      main: {
        entry: 'electron/main.ts',
        vite: {
          build: {
            rollupOptions: {
              external: ['whatsapp-web.js', 'bufferutil', 'utf-8-validate'],
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
})
