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

module.exports = {offlineIpfs, pubsubIpfs}
