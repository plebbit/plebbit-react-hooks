/// <reference types="vitest" />
import {defineConfig} from 'vitest/config'

const config = {
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
      '@plebbit/plebbit-js': 'react',
    },
    root: 'src/',
    setupFiles: ['../config/vitest.setup.js'],
  },
}

// handle plebbit-js-mock-content.donttest.ts
const mockContentTestPath = 'src/lib/plebbit-js/plebbit-js-mock-content.donttest.ts'
if (process.argv.includes(mockContentTestPath)) {
  config.test.include = ['../' + mockContentTestPath]
}

export default defineConfig(config)
