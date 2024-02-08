const offlineIpfs = {
  apiPort: 6345,
  gatewayPort: 12051,
  args: '--offline',
}

const pubsubIpfs = {
  apiPort: 4023,
  gatewayPort: 11205,
  args: '--enable-pubsub-experiment',
}

const plebbitRpc = {
  port: 48392,
}

export {offlineIpfs, pubsubIpfs, plebbitRpc}
