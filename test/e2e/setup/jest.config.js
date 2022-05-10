
process.env.JEST_PLAYWRIGHT_CONFIG = './jest-playwright.config.js'

module.exports = {
  preset: 'jest-playwright-preset',
  roots: ['<rootDir>/..'],
  testRegex: './*\\.test\\.js$',
  testEnvironment: './test-environment.js',
  testTimeout: 300 * 1000,
  globalSetup: './global-init.js',
  setupFilesAfterEnv: ['./global-after-env.js'],
  globalTeardown: './global-teardown.js'
}
