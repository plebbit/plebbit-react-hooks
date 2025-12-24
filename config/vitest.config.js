import {defineConfig} from 'vitest/config'
import path from 'path'

const config = {
  test: {
    // silence sourcemap warnings
    sourcemap: false,

    globals: true,
    environment: 'jsdom',
    reporter: ['default', 'json'],
    outputFile: './.vitest-reports/tests.json',
    server: {deps: {inline: true}},
    alias: {
      // mock plebbit-js because it throws in jsdom
      '@plebbit/plebbit-js': path.resolve(__dirname, 'vitest-empty-alias.js'),
    },
    root: 'src/',
    setupFiles: [path.resolve(__dirname, 'vitest.setup.js')],
  },
}

// handle plebbit-js-mock-content.donttest.ts
const mockContentTestPath = 'src/lib/plebbit-js/plebbit-js-mock-content.donttest.ts'
if (process.argv.includes(mockContentTestPath)) {
  config.test.include = ['../' + mockContentTestPath]
}

export default defineConfig(config)
