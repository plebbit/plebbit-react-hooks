// custom environment with IPFS API in global scope
const { getPlaywrightEnv } = require('jest-playwright-preset')
const PlaywrightEnvironment = getPlaywrightEnv()
const { expect } = require('@playwright/test')
const { matchers } = require('expect-playwright')
const { Date, console, Promise, setTimeout } = require('window-or-global')

expect.extend(matchers)

class TestEnvironment extends PlaywrightEnvironment {
  async setup () {
    await super.setup()

    // define globals that should be available in tests
    this.global.reactAppUrl = global.__REACT_APP_URL__
    const {reactAppUrl, page} = this.global

    page.setDefaultTimeout(30 * 1000)
    await page.setViewportSize({ width: 800, height: 600 })
  }
}

module.exports = TestEnvironment
