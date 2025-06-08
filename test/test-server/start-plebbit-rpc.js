const path = require('path')
const assert = require('assert')
const tcpPortUsed = require('tcp-port-used')
const getTmpFolderPath = require('tempy').directory
const plebbitDataPath = getTmpFolderPath()

const startPlebbitRpc = async ({port, ipfsApiPort, pubsubApiPort}) => {
  assert(typeof port === 'number', `startPlebbitRpc port '${port}' not a number`)
  assert(typeof ipfsApiPort === 'number', `startPlebbitRpc ipfsApiPort '${ipfsApiPort}' not a number`)
  assert(typeof pubsubApiPort === 'number', `startPlebbitRpc pubsubApiPort '${pubsubApiPort}' not a number`)

  const plebbitOptions = {
    dataPath: plebbitDataPath,
    kuboRpcClientsOptions: [`http://127.0.0.1:${ipfsApiPort}/api/v0`],
    pubsubKuboRpcClientsOptions: [`http://127.0.0.1:${pubsubApiPort}/api/v0`],
    httpRoutersOptions: [],
    resolveAuthorAddresses: false,
    validatePages: false,
  }

  console.log('plebbit rpc: starting...')
  const {default: PlebbitRpc} = await import('@plebbit/plebbit-js/rpc')
  const plebbitWebSocketServer = await PlebbitRpc.PlebbitWsServer({port, plebbitOptions})
  plebbitWebSocketServer.ws.on('connection', (socket, request) => {
    console.log('plebbit rpc: new connection')
    console.log('new plebbit json-rpc websocket client connection')
    // debug raw JSON RPC messages in console
    socket.on('message', (message) => console.log(`plebbit rpc: ${message.toString()}`))
  })

  await tcpPortUsed.waitUntilUsed(port)
  console.log(`plebbit rpc: listening on port ${port}`)
}

module.exports = startPlebbitRpc
