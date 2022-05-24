// script to start IPFS and plebbit-js for testing

const {exec, execSync} = require('child_process')
const getTmpFolderPath = require('tempy').directory
const ipfsPath = require('go-ipfs').path()
const assert = require('assert')

const startIpfs = ({apiPort, gatewayPort, args = ''} = {}) => {
  assert.equal(typeof apiPort, 'number')
  assert.equal(typeof gatewayPort, 'number')

  const ipfsDataPath = getTmpFolderPath()
  const plebbitDataPath = getTmpFolderPath()
  // init ipfs binary
  try {
    execSync(`IPFS_PATH=${ipfsDataPath} ${ipfsPath} init`, {stdio: 'inherit'})
  } catch (e) {}

  // allow * origin on ipfs api to bypass cors browser error
  // very insecure do not do this in production
  execSync(`IPFS_PATH=${ipfsDataPath} ${ipfsPath} config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'`, {stdio: 'inherit'})

  // set ports
  execSync(`IPFS_PATH=${ipfsDataPath} ${ipfsPath} config Addresses.API /ip4/127.0.0.1/tcp/${apiPort}`, {stdio: 'inherit'})
  execSync(`IPFS_PATH=${ipfsDataPath} ${ipfsPath} config Addresses.Gateway /ip4/127.0.0.1/tcp/${gatewayPort}`, {stdio: 'inherit'})

  // start ipfs daemon
  const ipfsProcess = exec(`IPFS_PATH=${ipfsDataPath} ${ipfsPath} daemon ${args}`)
  console.log(`IPFS_PATH=${ipfsDataPath} ${ipfsPath} daemon ${args} process started with pid ${ipfsProcess.pid}`)
  ipfsProcess.stderr.on('data', console.error)
  ipfsProcess.stdin.on('data', console.log)
  ipfsProcess.stdout.on('data', console.log)
  ipfsProcess.on('error', console.error)
  ipfsProcess.on('exit', () => {
    console.error(`ipfs process with pid ${ipfsProcess.pid} exited`)
    process.exit(1)
  })
  process.on('exit', () => {
    exec(`kill ${ipfsProcess.pid + 1}`)
  })

  const ipfsDaemonIsReady = () =>
    new Promise((resolve) => {
      ipfsProcess.stdout.on('data', (data) => {
        if (data.match('Daemon is ready')) {
          resolve()
        }
      })
    })

  return ipfsDaemonIsReady()
}

module.exports = startIpfs
