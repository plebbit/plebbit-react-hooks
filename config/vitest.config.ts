/// <reference types="vitest" />
import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    server: {
      deps: {
        inline: true,
      }
    },
    alias: {
      "@solana/web3.js": "@solana/web3.js/lib/index.browser.esm.js"
    },
    root: 'src/',
    setupFiles: ['../config/vitest.setup.js'],
  },
})
