import {defineConfig} from 'vitest/config'
import {viteCommonjs} from '@originjs/vite-plugin-commonjs'

const isCi = !!process.env.CI
const isFirefox = process.argv.includes('--firefox')

export default defineConfig({
  plugins: [viteCommonjs()],
  resolve: {
    alias: {
      'node-fetch': '/config/node-fetch-browser-shim.js',
    },
  },
  test: {
    globals: true,
    poolOptions: {
      threads: {singleThread: true},
    },
    include: ['test/browser-e2e/**/*.test.js', 'test/browser-plebbit-js-mock/**/*.test.js', 'test/browser-plebbit-js-mock-content/**/*.test.js'],
    exclude: ['test/electron-e2e/**'],
    setupFiles: ['./config/vitest-e2e.setup.js'],
    testTimeout: isCi ? 300_000 : 600_000,
    browser: {
      enabled: true,
      provider: 'playwright',
      instances: [
        {
          browser: isFirefox ? 'firefox' : 'chromium',
          headless: !!(process.env.CI || process.env.HEADLESS),
        },
      ],
    },
    server: {deps: {inline: true}},
  },
  define: {
    'process.env.DEBUG': JSON.stringify(process.env.DEBUG || ''),
  },
})
