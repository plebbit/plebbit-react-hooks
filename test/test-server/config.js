export const offlineIpfs = {
  apiPort: 6345,
  gatewayPort: 12051,
  args: '--offline',
}

export const pubsubIpfs = {
  apiPort: 4023,
  gatewayPort: 11205,
  args: '--enable-pubsub-experiment',
}

export const plebbitRpc = {
  port: 48392,
}

export default {offlineIpfs, pubsubIpfs, plebbitRpc}
