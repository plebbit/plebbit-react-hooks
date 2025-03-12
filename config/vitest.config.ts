/// <reference types="vitest" />
import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    server: {
      deps: {
        inline: true,
      },
    },
    alias: {
      // mock plebbit-js with random package or parsing errors
      '@plebbit/plebbit-js/dist/browser/index': 'react',
    },
    root: 'src/',
    setupFiles: ['../config/vitest.setup.js'],
  },
})
