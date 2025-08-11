import path from 'path'
import assert from 'assert'
import tcpPortUsed from 'tcp-port-used'
import PlebbitRpc from '@plebbit/plebbit-js/rpc'
import {directory as getTmpFolderPath} from 'tempy'
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
  const plebbitWebSocketServer = await PlebbitRpc.PlebbitWsServer({port, plebbitOptions})
  plebbitWebSocketServer.ws.on('connection', (socket, request) => {
    console.log('plebbit rpc: new connection')
    console.log('new plebbit json-rpc websocket client connection')
    // debug raw JSON RPC messages in console
    socket.on('message', (message) => console.log(`plebbit rpc: ${message.toString()}`))
  })
  // NOTE: don't subscribe to plebbitWebSocketServer.on('error'), no errors should be emitted during tests

  await tcpPortUsed.waitUntilUsed(port)
  console.log(`plebbit rpc: listening on port ${port}`)
}

export default startPlebbitRpc
