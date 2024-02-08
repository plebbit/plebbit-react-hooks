import PlebbitWsServer from '@plebbit/plebbit-js/dist/node/rpc/src/index.js?'
import path from 'path'
import assert from 'assert'
import tcpPortUsed from 'tcp-port-used'

const startPlebbitRpc = async ({port, ipfsApiPort, pubsubApiPort}) => {
  assert(typeof port === 'number', `startPlebbitRpc port '${port}' not a number`)
  assert(typeof ipfsApiPort === 'number', `startPlebbitRpc ipfsApiPort '${ipfsApiPort}' not a number`)
  assert(typeof pubsubApiPort === 'number', `startPlebbitRpc pubsubApiPort '${pubsubApiPort}' not a number`)

  const rootPath = process.cwd()
  const plebbitOptions = {
    dataPath: path.join(rootPath, '.plebbit', 'rpc'),
    ipfsHttpClientsOptions: [`http://127.0.0.1:${ipfsApiPort}/api/v0`],
    pubsubHttpClientsOptions: [`http://127.0.0.1:${pubsubApiPort}/api/v0`],
  }

  console.log('plebbit rpc: starting...')
  const plebbitWebSocketServer = await PlebbitWsServer.PlebbitWsServer({port, plebbitOptions})
  plebbitWebSocketServer.ws.on('connection', (socket, request) => {
    console.log('plebbit rpc: new connection')
    console.log('new plebbit json-rpc websocket client connection')
    // debug raw JSON RPC messages in console
    socket.on('message', (message) => console.log(`plebbit rpc: ${message.toString()}`))
  })

  await tcpPortUsed.waitUntilUsed(port)
  console.log(`plebbit rpc: listening on port ${port}`)
}

export default startPlebbitRpc
