#### useStateString example

```js
import { useMemo } from 'react'
import { useClientsStates } from '@plebbit/plebbit-react-hooks'

const clientHosts = {}
const getClientHost = (clientUrl) => {
  if (!clientHosts[clientUrl]) {
    try {
      clientHosts[clientUrl] = new URL(clientUrl).hostname || clientUrl
    } catch (e) {
      clientHosts[clientUrl] = clientUrl
    }
  }
  return clientHosts[clientUrl]
}

const useStateString = (commentOrSubplebbit) => {
  const { states } = useClientsStates({ comment: commentOrSubplebbit })
  return useMemo(() => {
    let stateString = ''
    for (const state in states) {
      const clientUrls = states[state]
      const clientHosts = clientUrls.map((clientUrl) => getClientHost(clientUrl))

      // if there are no valid hosts, skip this state
      if (clientHosts.length === 0) {
        continue
      }

      // separate 2 different states using ' '
      if (stateString) {
        stateString += ', '
      }

      // e.g. 'fetching IPFS from cloudflare-ipfs.com, ipfs.io'
      const formattedState = state.replaceAll('-', ' ').replace('ipfs', 'IPFS').replace('ipns', 'IPNS')
      stateString += `${formattedState} from ${clientHosts.join(', ')}`
    }

    // fallback to comment or subplebbit state when possible
    if (!stateString && commentOrSubplebbit?.state !== 'succeeded') {
      if (commentOrSubplebbit?.publishingState && commentOrSubplebbit?.publishingState !== 'stopped' && commentOrSubplebbit?.publishingState !== 'succeeded') {
        stateString = commentOrSubplebbit.publishingState
      } else if (commentOrSubplebbit?.updatingState !== 'stopped' && commentOrSubplebbit?.updatingState !== 'succeeded') {
        stateString = commentOrSubplebbit.updatingState
      }
      if (stateString) {
        stateString = stateString.replaceAll('-', ' ').replace('ipfs', 'IPFS').replace('ipns', 'IPNS')
      }
    }

    // capitalize first letter
    if (stateString) {
      stateString = stateString.charAt(0).toUpperCase() + stateString.slice(1)
    }

    // if string is empty, return undefined instead
    return stateString === '' ? undefined : stateString
  }, [states, commentOrSubplebbit])
}

export default useStateString
```

#### Get subplebbit with state string

```js
const subplebbit = useSubplebbit({subplebbitAddress})
const stateString = useStateString(subplebbit)
const errorString = useMemo(() => {
  if (subplebbit?.state === 'failed') {
    let errorString = 'Failed fetching subplebbit'
    if (subplebbit.error) {
      errorString += `: ${error.toString().slice(0, 300)}`
    }
    return errorString
  }
}, [subplebbit?.state])

if (stateString) {
  console.log(stateString)
}
if (errorString) {
  console.log(errorString)
}
```

#### Publish comment with state string

```js
const {index} = usePublishComment(publishCommentOptions)
const accountComment = useAccountComment({commentIndex: index})
const {publishingState, error} = accountComment
const stateString = useStateString(accountComment)
const errorString = useMemo(() => {
  if (publishingState === 'failed') {
    let errorString = 'Failed publishing comment'
    if (error) {
      errorString += `: ${error.toString().slice(0, 300)}`
    }
    return errorString
  }
}, [publishingState])

if (stateString) {
  console.log(stateString)
}
if (errorString) {
  console.log(errorString)
}
```

#### useFeedStateString example

```js
import { useMemo } from 'react'
import { useSubplebbit, useSubplebbitsStates } from '@plebbit/plebbit-react-hooks'

const clientHosts = {}
const getClientHost = (clientUrl) => {
  if (!clientHosts[clientUrl]) {
    try {
      clientHosts[clientUrl] = new URL(clientUrl).hostname || clientUrl
    } catch (e) {
      clientHosts[clientUrl] = clientUrl
    }
  }
  return clientHosts[clientUrl]
}

const useFeedStateString = (subplebbitAddresses) => {
  // single subplebbit feed state string
  const subplebbitAddress = subplebbitAddresses?.length === 1 ? subplebbitAddresses[0] : undefined
  const subplebbit = useSubplebbit({ subplebbitAddress })
  const singleSubplebbitFeedStateString = useStateString(subplebbit)

  // multiple subplebbit feed state string
  const { states } = useSubplebbitsStates({ subplebbitAddresses })

  const multipleSubplebbitsFeedStateString = useMemo(() => {
    if (subplebbitAddress) {
      return
    }

    // e.g. Resolving 2 addresses from infura.io, fetching 2 IPNS, 1 IPFS from cloudflare-ipfs.com, ipfs.io
    let stateString = ''

    if (states['resolving-address']) {
      const { subplebbitAddresses, clientUrls } = states['resolving-address']
      if (subplebbitAddresses.length && clientUrls.length) {
        stateString += `resolving ${subplebbitAddresses.length} ${subplebbitAddresses.length === 1 ? 'address' : 'addresses'} from ${clientUrls
          .map(getClientHost)
          .join(', ')}`
      }
    }

    // find all page client and sub addresses
    const pagesStatesClientHosts = new Set()
    const pagesStatesSubplebbitAddresses = new Set()
    for (const state in states) {
      if (state.match('page')) {
        states[state].clientUrls.forEach((clientUrl) => pagesStatesClientHosts.add(getClientHost(clientUrl)))
        states[state].subplebbitAddresses.forEach((subplebbitAddress) => pagesStatesSubplebbitAddresses.add(subplebbitAddress))
      }
    }

    if (states['fetching-ipns'] || states['fetching-ipfs'] || pagesStatesSubplebbitAddresses.size) {
      // separate 2 different states using ', '
      if (stateString) {
        stateString += ', '
      }

      // find all client urls
      const clientHosts = new Set([...pagesStatesClientHosts])
      states['fetching-ipns']?.clientUrls.forEach((clientUrl) => clientHosts.add(getClientHost(clientUrl)))
      states['fetching-ipfs']?.clientUrls.forEach((clientUrl) => clientHosts.add(getClientHost(clientUrl)))

      if (clientHosts.size) {
        stateString += 'fetching '
        if (states['fetching-ipns']) {
          stateString += `${states['fetching-ipns'].subplebbitAddresses.length} IPNS`
        }
        if (states['fetching-ipfs']) {
          if (states['fetching-ipns']) {
            stateString += ', '
          }
          stateString += `${states['fetching-ipfs'].subplebbitAddresses.length} IPFS`
        }
        if (pagesStatesSubplebbitAddresses.size) {
          if (states['fetching-ipns'] || states['fetching-ipfs']) {
            stateString += ', '
          }
          stateString += `${pagesStatesSubplebbitAddresses.size} ${pagesStatesSubplebbitAddresses.size === 1 ? 'page' : 'pages'}`
        }
        stateString += ` from ${[...clientHosts].join(', ')}`
      }
    }

    // capitalize first letter
    stateString = stateString.charAt(0).toUpperCase() + stateString.slice(1)

    // if string is empty, return undefined instead
    return stateString === '' ? undefined : stateString
  }, [states, subplebbitAddress])

  if (singleSubplebbitFeedStateString) {
    return singleSubplebbitFeedStateString
  }
  return multipleSubplebbitsFeedStateString
}

export default useFeedStateString
```

#### Get feed with single sub with state string

```js
const subplebbitAddress = 'memes.eth'
const {feed, hasMore, loadMore} = useFeed({subplebbitAddresses: [subplebbitAddress], sortType: 'topAll'})
const subplebbit = useSubplebbit({subplebbitAddress})
const stateString = useFeedStateString(subplebbitAddresses)
const errorString = useMemo(() => {
  if (subplebbit?.state === 'failed') {
    let errorString = 'Failed fetching subplebbit'
    if (subplebbit.error) {
      errorString += `: ${error.toString().slice(0, 300)}`
    }
    return errorString
  }
}, [subplebbit?.state])

if (stateString) {
  console.log(stateString)
}
if (errorString) {
  console.log(errorString)
}

```

#### Get feed with multiple subs with state string

```js
const subplebbitAddresses = ['memes.eth', '12D3KooW...', '12D3KooW...']
const {feed, hasMore, loadMore} = useFeed({subplebbitAddresses, sortType: 'topAll'})
const {subplebbits} = useSubplebbits({subplebbitAddresses})
const stateString = useFeedStateString(subplebbitAddresses)

const errorString = useMemo(() => {
  // only show error string if all subplebbits updating state are failed
  for (const subplebbit of subplebbits) {
    if (subplebbit.updatingState !== 'failed') {
      return
    }
  }
  // only show the first error found because not possible to show all of them
  for (const subplebbit of subplebbits) {
    if (subplebbit.error) {
      return `Failed fetching subplebbit: ${error.toString().slice(0, 300)}`
    }
  }
}, [subplebbits])

if (stateString) {
  console.log(stateString)
}
if (errorString) {
  console.log(errorString)
}
```

#### Get a comment clients states

```js
const comment = useComment({commentCid})

// fetching from gateways
for (const ipfsGatewayUrl in comment.clients.ipfsGateways) {
  const ipfsGateway = comment.clients.ipfsGateways[ipfsGatewayUrl]
  if (ipfsGateway.state === 'fetching-ipfs') {
    console.log(`Fetching IPFS from ${ipfsGatewayUrl}`)
  }
  if (ipfsGateway.state === 'fetching-ipns-update') {
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
  if (ipfsClient.state === 'fetching-ipns-update') {
    console.log(`Fetching IPNS from ${ipfsClient.peers.length} peers`)
  }
  if (ipfsClient.state === 'succeeded') {
    console.log(`Fetched comment from ${ipfsClient.peers.length} peers`)
  }
}
```

#### Get a subplebbit clients states

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

#### Publish a comment with clients states

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

#### Get IPFS and other clients stats

```js
const {ipfsGateways, ipfsClients, pubsubClients, chainProviders} = useClientsStats()

for (const ipfsGatewayUrl in ipfsGateways) {
  const ipfsGateway = ipfsGateways[ipfsGatewayUrl]
  console.log('IPFS gateway URL:', ipfsGatewayUrl)

  console.log('Total downloaded:', ipfsGateway.totalIn)
  console.log('Total uploaded:', ipfsGateway.totalOut)
  console.log('Session downloaded:', ipfsGateway.sessionTotalIn)
  console.log('Session uploaded:', ipfsGateway.sessionTotalOut)

  console.log('Succeeded IPFS:', ipfsGateway.succeededIpfsCount)
  console.log('Failed IPFS:', ipfsGateway.failedIpfsCount)
  console.log('Succeeded IPFS averate time:', ipfsGateway.succeededIpfsAverageTime)
  console.log('Succeeded IPFS median time:', ipfsGateway.succeededIpfsMedianTime)

  console.log('Session succeeded IPFS:', ipfsGateway.sessionSucceededIpfsCount)
  console.log('Session failed IPFS:', ipfsGateway.sessionFailedIpfsCount)
  console.log('Session succeeded IPFS averate time:', ipfsGateway.sessionSucceededIpfsAverageTime)
  console.log('Session succeeded IPFS median time:', ipfsGateway.sessionSucceededIpfsMedianTime)

  console.log('Succeeded IPNS:', ipfsGateway.succeededIpnsCount)
  console.log('Failed IPNS:', ipfsGateway.failedIpnsCount)
  console.log('Succeeded IPNS averate time:', ipfsGateway.succeededIpnsAverageTime)
  console.log('Succeeded IPNS median time:', ipfsGateway.succeededIpnsMedianTime)

  console.log('Session succeeded IPNS:', ipfsGateway.sessionSucceededIpnsCount)
  console.log('Session failed IPNS:', ipfsGateway.sessionFailedIpnsCount)
  console.log('Session succeeded IPNS averate time:', ipfsGateway.sessionSucceededIpnsAverageTime)
  console.log('Session succeeded IPNS median time:', ipfsGateway.sessionSucceededIpnsMedianTime)

  for (const subplebbitAddress in ipfsGateway.subplebbits) {
    const subplebbit = ipfsGateway.subplebbits[subplebbitAddress]
    console.log('Subplebbit:', subplebbitAddress)

    console.log('Succeeded subplebbit updates:', subplebbit.succeededSubplebbitUpdateCount)
    console.log('Failed subplebbit updates:', subplebbit.failedSubplebbitUpdateCount)
    console.log('Succeeded subplebbit updates average time:', subplebbit.succeededSubplebbitUpdateAverageTime)
    console.log('Succeeded subplebbit updates median time:', subplebbit.succeededSubplebbitUpdateMedianTime)

    console.log('Session succeeded subplebbit updates:', subplebbit.sessionSucceededSubplebbitUpdateCount)
    console.log('Session failed subplebbit updates:', subplebbit.sessionFailedSubplebbitUpdateCount)
    console.log('Session succeeded subplebbit updates average time:', subplebbit.sessionSucceededSubplebbitUpdateAverageTime)
    console.log('Session succeeded subplebbit updates median time:', subplebbit.sessionSucceededSubplebbitUpdateMedianTime)

    console.log('Succeeded subplebbit pages:', subplebbit.succeededSubplebbitPageCount)
    console.log('Failed subplebbit pages:', subplebbit.failedSubplebbitPageCount)
    console.log('Succeeded subplebbit pages average time:', subplebbit.succeededSubplebbitPageAverageTime)
    console.log('Succeeded subplebbit pages median time:', subplebbit.succeededSubplebbitPageMedianTime)

    console.log('Session succeeded subplebbit pages:', subplebbit.sessionSucceededSubplebbitPageCount)
    console.log('Session failed subplebbit pages:', subplebbit.sessionFailedSubplebbitPageCount)
    console.log('Session succeeded subplebbit pages average time:', subplebbit.sessionSucceededSubplebbitPageAverageTime)
    console.log('Session succeeded subplebbit pages median time:', subplebbit.sessionSucceededSubplebbitPageMedianTime)

    console.log('Succeeded comments:', subplebbit.succeededCommentCount)
    console.log('Failed comments:', subplebbit.failedCommentCount)
    console.log('Succeeded comments average time:', subplebbit.succeededCommentAverageTime)
    console.log('Succeeded comments median time:', subplebbit.succeededCommentMedianTime)

    console.log('Session succeeded comments:', subplebbit.sessionSucceededCommentCount)
    console.log('Session failed comments:', subplebbit.sessionFailedCommentCount)
    console.log('Session succeeded comments average time:', subplebbit.sessionSucceededCommentAverageTime)
    console.log('Session succeeded comments median time:', subplebbit.sessionSucceededCommentMedianTime)

    console.log('Succeeded comment updates:', subplebbit.succeededCommentUpdateCount)
    console.log('Failed comment updates:', subplebbit.failedCommentUpdateCount)
    console.log('Succeeded comment updates average time:', subplebbit.succeededCommentUpdateAverageTime)
    console.log('Succeeded comment updates median time:', subplebbit.succeededCommentUpdateMedianTime)

    console.log('Session succeeded comment updates:', subplebbit.sessionSucceededCommentUpdateCount)
    console.log('Session failed comment updates:', subplebbit.sessionFailedCommentUpdateCount)
    console.log('Session succeeded comment updates average time:', subplebbit.sessionSucceededCommentUpdateAverageTime)
    console.log('Session succeeded comment updates median time:', subplebbit.sessionSucceededCommentUpdateMedianTime)
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
  console.log('Succeeded IPFS averate time:', ipfsClient.succeededIpfsAverageTime)
  console.log('Succeeded IPFS median time:', ipfsClient.succeededIpfsMedianTime)

  console.log('Session succeeded IPFS:', ipfsClient.sessionSucceededIpfsCount)
  console.log('Session failed IPFS:', ipfsClient.sessionFailedIpfsCount)
  console.log('Session succeeded IPFS averate time:', ipfsClient.sessionSucceededIpfsAverageTime)
  console.log('Session succeeded IPFS median time:', ipfsClient.sessionSucceededIpfsMedianTime)

  console.log('Succeeded IPNS:', ipfsClient.succeededIpnsCount)
  console.log('Failed IPNS:', ipfsClient.failedIpnsCount)
  console.log('Succeeded IPNS averate time:', ipfsClient.succeededIpnsAverageTime)
  console.log('Succeeded IPNS median time:', ipfsClient.succeededIpnsMedianTime)

  console.log('Session succeeded IPNS:', ipfsClient.sessionSucceededIpnsCount)
  console.log('Session failed IPNS:', ipfsClient.sessionFailedIpnsCount)
  console.log('Session succeeded IPNS averate time:', ipfsClient.sessionSucceededIpnsAverageTime)
  console.log('Session succeeded IPNS median time:', ipfsClient.sessionSucceededIpnsMedianTime)

  for (const subplebbitAddress in ipfsClient.subplebbits) {
    const subplebbit = ipfsClient.subplebbits[subplebbitAddress]
    console.log('Subplebbit:', subplebbitAddress)

    console.log('Succeeded subplebbit updates:', subplebbit.succeededSubplebbitUpdateCount)
    console.log('Failed subplebbit updates:', subplebbit.failedSubplebbitUpdateCount)
    console.log('Succeeded subplebbit updates average time:', subplebbit.succeededSubplebbitUpdateAverageTime)
    console.log('Succeeded subplebbit updates median time:', subplebbit.succeededSubplebbitUpdateMedianTime)

    console.log('Session succeeded subplebbit updates:', subplebbit.sessionSucceededSubplebbitUpdateCount)
    console.log('Session failed subplebbit updates:', subplebbit.sessionFailedSubplebbitUpdateCount)
    console.log('Session succeeded subplebbit updates average time:', subplebbit.sessionSucceededSubplebbitUpdateAverageTime)
    console.log('Session succeeded subplebbit updates median time:', subplebbit.sessionSucceededSubplebbitUpdateMedianTime)

    console.log('Succeeded subplebbit pages:', subplebbit.succeededSubplebbitPageCount)
    console.log('Failed subplebbit pages:', subplebbit.failedSubplebbitPageCount)
    console.log('Succeeded subplebbit pages average time:', subplebbit.succeededSubplebbitPageAverageTime)
    console.log('Succeeded subplebbit pages median time:', subplebbit.succeededSubplebbitPageMedianTime)

    console.log('Session succeeded subplebbit pages:', subplebbit.sessionSucceededSubplebbitPageCount)
    console.log('Session failed subplebbit pages:', subplebbit.sessionFailedSubplebbitPageCount)
    console.log('Session succeeded subplebbit pages average time:', subplebbit.sessionSucceededSubplebbitPageAverageTime)
    console.log('Session succeeded subplebbit pages median time:', subplebbit.sessionSucceededSubplebbitPageMedianTime)

    console.log('Succeeded comments:', subplebbit.succeededCommentCount)
    console.log('Failed comments:', subplebbit.failedCommentCount)
    console.log('Succeeded comments average time:', subplebbit.succeededCommentAverageTime)
    console.log('Succeeded comments median time:', subplebbit.succeededCommentMedianTime)

    console.log('Session succeeded comments:', subplebbit.sessionSucceededCommentCount)
    console.log('Session failed comments:', subplebbit.sessionFailedCommentCount)
    console.log('Session succeeded comments average time:', subplebbit.sessionSucceededCommentAverageTime)
    console.log('Session succeeded comments median time:', subplebbit.sessionSucceededCommentMedianTime)

    console.log('Succeeded comment updates:', subplebbit.succeededCommentUpdateCount)
    console.log('Failed comment updates:', subplebbit.failedCommentUpdateCount)
    console.log('Succeeded comment updates average time:', subplebbit.succeededCommentUpdateAverageTime)
    console.log('Succeeded comment updates median time:', subplebbit.succeededCommentUpdateMedianTime)

    console.log('Session succeeded comment updates:', subplebbit.sessionSucceededCommentUpdateCount)
    console.log('Session failed comment updates:', subplebbit.sessionFailedCommentUpdateCount)
    console.log('Session succeeded comment updates average time:', subplebbit.sessionSucceededCommentUpdateAverageTime)
    console.log('Session succeeded comment updates median time:', subplebbit.sessionSucceededCommentUpdateMedianTime)
  }
}

for (const pubsubClientUrl in pubsubClients) {
  const pubsubClient = pubsubClients[pubsubClientUrl]
  console.log('Pubsub Client URL:', pubsubClientUrl)
  console.log('Connected peers:', pubsubClient.peers.length)

  console.log('Total downloaded:', pubsubClient.totalIn)
  console.log('Total uploaded:', pubsubClient.totalOut)
  console.log('Download rate:', pubsubClient.rateIn)
  console.log('Upload rate:', pubsubClient.rateOut)

  console.log('Session downloaded:', pubsubClient.sessionTotalIn)
  console.log('Session uploaded:', pubsubClient.sessionTotalOut)
  console.log('Session download rate:', pubsubClient.sessionRateIn)
  console.log('Session upload rate:', pubsubClient.sessionRateOut)

  console.log('Succeeded challenge request messages:', pubsubClient.succeededChallengeRequestMessageCount)
  console.log('Failed challenge request messages:', pubsubClient.failedChallengeRequestMessageCount)
  console.log('Succeeded challenge request messages average time:', pubsubClient.succeededChallengeRequestMessageAverageTime)
  console.log('Succeeded challenge request messages median time:', pubsubClient.succeededChallengeRequestMessageMedianTime)

  console.log('Succeeded challenge answer messages:', pubsubClient.succeededChallengeAnswerMessageCount)
  console.log('Failed challenge answer messages:', pubsubClient.failedChallengeAnswerMessageCount)
  console.log('Succeeded challenge answer messages average time:', pubsubClient.succeededChallengeAnswerMessageAverageTime)
  console.log('Succeeded challenge answer messages median time:', pubsubClient.succeededChallengeAnswerMessageMedianTime)

  console.log('Session succeeded challenge request messages:', pubsubClient.sessionSucceededChallengeRequestMessageCount)
  console.log('Session failed challenge request messages:', pubsubClient.sessionFailedChallengeRequestMessageCount)
  console.log('Session succeeded challenge request messages average time:', pubsubClient.sessionSucceededChallengeRequestMessageAverageTime)
  console.log('Session succeeded challenge request messages median time:', pubsubClient.sessionSucceededChallengeRequestMessageMedianTime)

  console.log('Session succeeded challenge answer messages:', pubsubClient.sessionSucceededChallengeAnswerMessageCount)
  console.log('Session failed challenge answer messages:', pubsubClient.sessionFailedChallengeAnswerMessageCount)
  console.log('Session succeeded challenge answer messages average time:', pubsubClient.sessionSucceededChallengeAnswerMessageAverageTime)
  console.log('Session succeeded challenge answer messages median time:', pubsubClient.sessionSucceededChallengeAnswerMessageMedianTime)

  for (const subplebbitAddress in pubsubClient.subplebbits) {
    const subplebbit = pubsubClient.subplebbits[subplebbitAddress]
    console.log('Subplebbit:', subplebbitAddress)

    console.log('Succeeded challenge request messages:', subplebbit.succeededChallengeRequestMessageCount)
    console.log('Failed challenge request messages:', subplebbit.failedChallengeRequestMessageCount)
    console.log('Succeeded challenge request messages average time:', subplebbit.succeededChallengeRequestMessageAverageTime)
    console.log('Succeeded challenge request messages median time:', subplebbit.succeededChallengeRequestMessageMedianTime)

    console.log('Succeeded challenge answer messages:', subplebbit.succeededChallengeAnswerMessageCount)
    console.log('Failed challenge answer messages:', subplebbit.failedChallengeAnswerMessageCount)
    console.log('Succeeded challenge answer messages average time:', subplebbit.succeededChallengeAnswerMessageAverageTime)
    console.log('Succeeded challenge answer messages median time:', subplebbit.succeededChallengeAnswerMessageMedianTime)

    console.log('Session succeeded challenge request messages:', subplebbit.sessionSucceededChallengeRequestMessageCount)
    console.log('Session failed challenge request messages:', subplebbit.sessionFailedChallengeRequestMessageCount)
    console.log('Session succeeded challenge request messages average time:', subplebbit.sessionSucceededChallengeRequestMessageAverageTime)
    console.log('Session succeeded challenge request messages median time:', subplebbit.sessionSucceededChallengeRequestMessageMedianTime)

    console.log('Session succeeded challenge answer messages:', subplebbit.sessionSucceededChallengeAnswerMessageCount)
    console.log('Session failed challenge answer messages:', subplebbit.sessionFailedChallengeAnswerMessageCount)
    console.log('Session succeeded challenge answer messages average time:', subplebbit.sessionSucceededChallengeAnswerMessageAverageTime)
    console.log('Session succeeded challenge answer messages median time:', subplebbit.sessionSucceededChallengeAnswerMessageMedianTime)
  }
}

for (const chainProviderUrl in chainProviders) {
  const chainProvider = chainProviders[chainProviderUrl]
  console.log('Chain provider URL:', chainProviderUrl)
}
```
