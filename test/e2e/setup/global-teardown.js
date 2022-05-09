const { teardown: teardownDevServer } = require('jest-process-manager')

module.exports = async function globalTeardown (globalConfig) {
  const teardown = []
  teardown.push(teardownDevServer())
  await Promise.all(teardown)
}
