const debug = !!process.env.DEBUG
const ci = process.env.TRAVIS === 'true' || process.env.CI === 'true'

// TODO: figure out what options to use
module.exports = {
  launchOptions: {
    headless: (!debug || ci), // show browser window when in debug mode
    args: ['--auto-open-devtools-for-tabs']
  }
}
