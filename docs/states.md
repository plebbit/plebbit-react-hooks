#### Get a comment states

```js
const comment = useComment({commentCid})

// fetching from gateways
for (const ipfsGatewayUrl in comment.clients.ipfsGateways) {
  const ipfsGateway = comment.clients.ipfsGateways[ipfsGatewayUrl]
  if (ipfsGateway.state === 'fetching-ipfs') {
    console.log(`Fetching IPFS from ${ipfsGatewayUrl}`)
  }
  if (ipfsGateway.state === 'fetching-ipns') {
    console.log(`Fetching IPNS from ${ipfsGatewayUrl}`)
  }
  if (ipfsGateway.state === 'succeeded') {
    console.log(`Fetched comment from ${ipfsGatewayUrl}`)
  }
}

// fetching from ipfs clients
for (const ipfsClientUrl in comment.clients.ipfsClients) {
  const ipfsClient = comment.clients.ipfsClients[ipfsClientUrl]
  if (ipfsClient.state === 'fetching-ipfs') {
    console.log(`Fetching IPFS from ${ipfsClient.peers.length} peers`)
  }
  if (ipfsClient.state === 'fetching-ipns') {
    console.log(`Fetching IPNS from ${ipfsClient.peers.length} peers`)
  }
  if (ipfsClient.state === 'succeeded') {
    console.log(`Fetched comment from ${ipfsClient.peers.length} peers`)
  }
}
```

#### Get a subplebbit states

```js
const subplebbit = useSubplebbit({subplebbitAddress})

// resolving subplebbit address from chain providers
for (const chainProviderUrl in subplebbit.clients.chainProviders) {
  const chainProvider = subplebbit.clients.chainProviders[chainProviderUrl]
  if (chainProvider.state === 'resolving-address') {
    console.log(`Resolving subplebbit address from ${chainProviderUrl}`)
  }
}

// fetching from gateways
for (const ipfsGatewayUrl in subplebbit.clients.ipfsGateways) {
  const ipfsGateway = subplebbit.clients.ipfsGateways[ipfsGatewayUrl]
  if (ipfsGateway.state === 'fetching-ipns') {
    console.log(`Fetching IPNS from ${ipfsGatewayUrl}`)
  }
  if (ipfsGateway.state === 'fetching-page-ipfs') {
    console.log(`Fetching page IPFS from ${ipfsGatewayUrl}`)
  }
  if (ipfsGateway.state === 'succeeded') {
    console.log(`Fetched subplebbit from ${ipfsGatewayUrl}`)
  }
}

// fetching from ipfs clients
for (const ipfsClientUrl in subplebbit.clients.ipfsClients) {
  const ipfsClient = subplebbit.clients.ipfsClients[ipfsClientUrl]
  if (ipfsClient.state === 'fetching-ipns') {
    console.log(`Fetching IPNS from ${ipfsClient.peers.length} peers`)
  }
  if (ipfsClient.state === 'fetching-ipfs') {
    console.log(`Fetching IPFS from ${ipfsClient.peers.length} peers`)
  }
  if (ipfsClient.state === 'fetching-page-ipfs') {
    console.log(`Fetching page IPFS from ${ipfsClient.peers.length} peers`)
  }
  if (ipfsClient.state === 'succeeded') {
    console.log(`Fetched subplebbit from ${ipfsClient.peers.length} peers`)
  }
}
```

#### Publish a comment with states

```js
const publishCommentOptions = {
  content: 'hello',
  title: 'hello',
  subplebbitAddress: '12D3KooW...',
  onChallenge,
  onChallengeVerification,
  onError
}

const {clients, publishComment} = usePublishComment(publishCommentOptions)

// start publishing
await publishComment()

// resolving subplebbit address from chain providers
for (const chainProviderUrl in clients.chainProviders) {
  const chainProvider = clients.chainProviders[chainProviderUrl]
  if (chainProvider.state === 'resolving-address') {
    console.log(`Resolving subplebbit address from ${chainProviderUrl}`)
  }
}

// fetching from gateways
for (const ipfsGatewayUrl in clients.ipfsGateways) {
  const ipfsGateway = clients.ipfsGateways[ipfsGatewayUrl]
  if (ipfsGateway.state === 'fetching-subplebbit-ipns') {
    console.log(`Fetching subplebbit IPNS from ${ipfsGatewayUrl}`)
  }
}

// publishing from pubsub client
for (const pubsubClientUrl in clients.pubsubClients) {
  const pubsubClient = clients.pubsubClients[pubsubClientUrl]
  if (pubsubClient.state === 'publishing-challenge-request') {
    console.log(`Publishing challenge request using ${pubsubClientUrl}`)
  }
  if (pubsubClient.state === 'waiting-challenge') {
    console.log(`Waiting for challenge from ${pubsubClientUrl}`)
  }
  if (pubsubClient.state === 'publishing-challenge-answer') {
    console.log(`Publishing challenge answer using ${pubsubClientUrl}`)
  }
  if (pubsubClient.state === 'waiting-challenge-verification') {
    console.log(`Waiting for challenge verification from ${pubsubClientUrl}`)
  }
  if (pubsubClient.state === 'succeeded') {
    console.log(`Published comment using ${pubsubClientUrl}`)
  }
}

// fetching and publishing from ipfs client
for (const ipfsClientUrl in clients.ipfsClients) {
  const ipfsClient = clients.ipfsClients[ipfsClientUrl]
  if (ipfsClient.state === 'fetching-subplebbit-ipns') {
    console.log(`Fetching subplebbit IPNS from ${ipfsClient.peers.length} peers`)
  }
  if (ipfsClient.state === 'fetching-subplebbit-ipfs') {
    console.log(`Fetching subplebbit IPFS from ${ipfsClient.peers.length} peers`)
  }
  if (ipfsClient.state === 'publishing-challenge-request') {
    console.log(`Publishing challenge request to ${ipfsClient.peers.length} peers`)
  }
  if (ipfsClient.state === 'waiting-challenge') {
    console.log(`Waiting for challenge from ${ipfsClient.peers.length} peers`)
  }
  if (ipfsClient.state === 'publishing-challenge-answer') {
    console.log(`Publishing challenge answer to ${ipfsClient.peers.length} peers`)
  }
  if (ipfsClient.state === 'waiting-challenge-verification') {
    console.log(`Waiting for challenge verification from ${ipfsClient.peers.length} peers`)
  }
  if (ipfsClient.state === 'succeeded') {
    console.log(`Published comment to ${ipfsClient.peers.length} peers`)
  }
}
```

#### Get IPFS and plebbit stats

```js
const {ipfsGateways, ipfsClients, pubsubClients, chainProviders} = useStats()

for (const ipfsGatewayUrl in ipfsGateways) {
  const ipfsGateway = ipfsGateways[ipfsGatewayUrl]
  console.log('IPFS gateway URL:', ipfsGatewayUrl)
  console.log('Total downloaded:', ipfsGateway.totalIn)
  console.log('Total uploaded:', ipfsGateway.totalOut)
  console.log('All time download rate:', ipfsGateway.rateIn)
  console.log('All time Upload rate:', ipfsGateway.rateOut)
  console.log('Session downloaded:', ipfsGateway.sessionTotalIn)
  console.log('Session uploaded:', ipfsGateway.sessionTotalOut)
  console.log('Session download rate:', ipfsGateway.sessionRateIn)
  console.log('Session upload rate:', ipfsGateway.sessionRateOut)
  console.log('Succeeded IPFS:', ipfsClient.succeededIpfsCount)
  console.log('Failed IPFS:', ipfsClient.failedIpfsCount)
  console.log('Succeeded IPNS:', ipfsClient.succeededIpnsCount)
  console.log('Failed IPNS:', ipfsClient.failedIpnsCount)
  for (const subplebbitAddress in ipfsGateway.subplebbits) {
    const subplebbit = ipfsGateway.subplebbits[subplebbitAddress]
    console.log('Subplebbit:', subplebbitAddress)
    console.log('Succeeded subplebbit updates:', subplebbit.succeededSubplebbitUpdateCount)
    console.log('Failed subplebbit updates:', subplebbit.failedSubplebbitUpdateCount)
    console.log('Succeeded subplebbit pages:', subplebbit.succeededSubplebbitPageCount)
    console.log('Failed subplebbit pages:', subplebbit.failedSubplebbitPageCount)
    console.log('Succeeded comments:', subplebbit.succeededCommentCount)
    console.log('Failed comments:', subplebbit.failedCommentCount)
    console.log('Succeeded comment updates:', subplebbit.succeededCommentUpdateCount)
    console.log('Failed comment updates:', subplebbit.failedCommentUpdateCount)
  }
}

for (const ipfsClientUrl in ipfsClients) {
  const ipfsClient = ipfsClients[ipfsClientUrl]
  console.log('IPFS Client URL:', ipfsClientUrl)
  console.log('Connected peers:', ipfsClient.peers.length) // IPFS peers https://docs.ipfs.tech/reference/kubo/rpc/#api-v0-swarm-peers
  console.log('Total downloaded:', ipfsClient.totalIn) // IPFS stats https://docs.ipfs.tech/reference/kubo/rpc/#api-v0-stats-bw
  console.log('Total uploaded:', ipfsClient.totalOut)
  console.log('Download rate:', ipfsClient.rateIn)
  console.log('Upload rate:', ipfsClient.rateOut)
  console.log('Session downloaded:', ipfsClient.sessionTotalIn)
  console.log('Session uploaded:', ipfsClient.sessionTotalOut)
  console.log('Session download rate:', ipfsClient.sessionRateIn)
  console.log('Session upload rate:', ipfsClient.sessionRateOut)
  console.log('Succeeded IPFS:', ipfsClient.succeededIpfsCount)
  console.log('Failed IPFS:', ipfsClient.failedIpfsCount)
  console.log('Succeeded IPNS:', ipfsClient.succeededIpnsCount)
  console.log('Failed IPNS:', ipfsClient.failedIpnsCount)
  for (const subplebbitAddress in ipfsClient.subplebbits) {
    const subplebbit = ipfsClient.subplebbits[subplebbitAddress]
    console.log('Subplebbit:', subplebbitAddress)
    console.log('Succeeded subplebbit updates:', subplebbit.succeededSubplebbitUpdateCount)
    console.log('Failed subplebbit updates:', subplebbit.failedSubplebbitUpdateCount)
    console.log('Succeeded subplebbit pages:', subplebbit.succeededSubplebbitPageCount)
    console.log('Failed subplebbit pages:', subplebbit.failedSubplebbitPageCount)
    console.log('Succeeded comments:', subplebbit.succeededCommentCount)
    console.log('Failed comments:', subplebbit.failedCommentCount)
    console.log('Succeeded comment updates:', subplebbit.succeededCommentUpdateCount)
    console.log('Failed comment updates:', subplebbit.failedCommentUpdateCount)
  }
}

for (const pubsubClientUrl in pubsubClients) {
  const pubsubClient = pubsubClients[pubsubClientUrl]
  console.log('Pubsub Client URL:', pubsubClientUrl)
  console.log('Connected peers:', pubsubClientUrl.peers.length)
  console.log('Total downloaded:', pubsubClientUrl.totalIn)
  console.log('Total uploaded:', pubsubClientUrl.totalOut)
  console.log('Download rate:', pubsubClientUrl.rateIn)
  console.log('Upload rate:', pubsubClientUrl.rateOut)
  console.log('Session downloaded:', pubsubClientUrl.sessionTotalIn)
  console.log('Session uploaded:', pubsubClientUrl.sessionTotalOut)
  console.log('Session download rate:', pubsubClientUrl.sessionRateIn)
  console.log('Session upload rate:', pubsubClientUrl.sessionRateOut)
  console.log('Succeeded challenge request messages:', pubsubClientUrl.succeededChallengeRequestMessageCount)
  console.log('Failed challenge request messages:', pubsubClientUrl.failedChallengeRequestMessageCount)
  console.log('Succeeded challenge answer messages:', pubsubClientUrl.succeededChallengeAnswerMessageCount)
  console.log('Failed challenge answer messages:', pubsubClientUrl.failedChallengeAnswerMessageCount)
  for (const subplebbitAddress in pubsubClient.subplebbits) {
    const subplebbit = pubsubClient.subplebbits[subplebbitAddress]
    console.log('Subplebbit:', subplebbitAddress)
    console.log('Succeeded challenge request messages:', subplebbit.succeededChallengeRequestMessageCount)
    console.log('Failed challenge request messages:', subplebbit.failedChallengeRequestMessageCount)
    console.log('Succeeded challenge answer messages:', subplebbit.succeededChallengeAnswerMessageCount)
    console.log('Failed challenge answer messages:', subplebbit.failedChallengeAnswerMessageCount)
  }
}

for (const chainProviderUrl in chainProviders) {
  const chainProvider = chainProviders[chainProviderUrl]
  console.log('Chain provider URL:', chainProviderUrl)
}
```
