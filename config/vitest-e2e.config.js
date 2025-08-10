import {defineConfig} from 'vitest/config'

// more time to debug when not ci
const testTimeout = process.env.CI ? 300_000 : 600_000

const headless = Boolean(process.env.CI || process.env.HEADLESS)

let browser = process.env.FIREFOX ? 'firefox' : 'chromium'
let launchOptions
if (process.env.CHROME_BIN) {
  launchOptions = {executablePath: process.env.CHROME_BIN}
}
if (process.env.FIREFOX_BIN) {
  launchOptions = {executablePath: process.env.FIREFOX_BIN}
  browser = 'firefox'
}

let include = ['test/browser-e2e/**/*.test.js']
// test the plebbit-js-mock files
// launch the mock tests separately because it sometimes wrongly mocks all files
if (process.env.MOCK) {
  include = ['test/browser-plebbit-js-mock/**/*.test.js']
}
// test the plebbit-js-mock-content files
// launch the mock tests separately because it sometimes wrongly mocks all files
if (process.env.MOCK_CONTENT) {
  include = ['test/browser-plebbit-js-mock-content/**/*.test.js']
}

export default defineConfig({
  test: {
    globals: true,
    poolOptions: {
      threads: {singleThread: true},
    },
    include,
    setupFiles: ['./config/vitest-e2e.setup.js'],
    testTimeout,
    browser: {
      enabled: true,
      provider: 'playwright',
      instances: [
        {
          browser,
          headless,
          // this doesn't seem to work, ci still has to install playwright
          launchOptions,
        },
      ],
    },
    server: {deps: {inline: true}},
  },
  define: {
    localStorageDebug: JSON.stringify(process.env.DEBUG || ''),
  },
})
