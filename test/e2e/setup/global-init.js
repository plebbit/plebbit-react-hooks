const { setup: setupDevServer } = require('jest-process-manager')
const getPort = require('get-port')
const path = require('path')
const { console } = require('window-or-global')
const fetch = require('node-fetch')

// port on which static HTTP server exposes the webui from build/ directory
// for use in E2E tests

module.exports = async function globalSetup (globalConfig) {
  const reactAppPort = await getPort()
  const webpackConfigPath = path.join(__dirname, 'webpack.config.js')
  // http server with webui build
  await setupDevServer({
    command: `yarn webpack:dev --config ${webpackConfigPath} --port ${reactAppPort}`,
    launchTimeout: 60000,
    port: reactAppPort,
    debug: process.env.DEBUG === 'true'
  })
  // fetch the page in order to wait until webpack compile is finished
  await fetch(`http://localhost:${reactAppPort}/`)
 
  global.__REACT_APP_URL__ = `http://localhost:${reactAppPort}/`
}
