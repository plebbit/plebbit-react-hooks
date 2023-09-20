import {act, renderHook} from '@testing-library/react-hooks'
import testUtils from '../lib/test-utils'
import {useComment, useSubplebbit, useFeed, setPlebbitJs, useClientsStates} from '..'
import commentsStore from '../stores/comments'
import subplebbitsPagesStore from '../stores/subplebbits-pages'
import utils from '../lib/utils'
import EventEmitter from 'events'
import PlebbitJsMock, {Plebbit} from '../lib/plebbit-js/plebbit-js-mock'
setPlebbitJs(PlebbitJsMock)

const ipfsGatewayUrl1 = 'https://ipfsgateway1.com'
const ipfsGatewayUrl2 = 'https://ipfsgateway2.com'
const ipfsGatewayUrl3 = 'https://ipfsgateway3.com'
const ipfsClientUrl1 = 'https://ipfsclient1.com'
const ipfsClientUrl2 = 'https://ipfsclient2.com'
const ipfsClientUrl3 = 'https://ipfsclient3.com'
const pubsubClientUrl1 = 'https://pubsubclient1.com'
const pubsubClientUrl2 = 'https://pubsubclient2.com'
const pubsubClientUrl3 = 'https://pubsubclient3.com'
const plebbitRpcClientUrl1 = 'https://plebbitrpcclienturl1.com'
const plebbitRpcClientUrl2 = 'https://plebbitrpcclienturl2.com'
const plebbitRpcClientUrl3 = 'https://plebbitrpcclienturl3.com'
const ethChainProviderUrl1 = 'https://ethchainprovider1.com'
const ethChainProviderUrl2 = 'https://ethchainprovider2.com'
const ethChainProviderUrl3 = 'https://ethchainprovider3.com'
const timestamp = Math.floor(Date.now() / 1000) - 60 * 60
const updatedAt = Math.floor(Date.now() / 1000)

const simulateLoadingTime = (ms: number) => new Promise((r) => setTimeout(r, ms))

const changeClientsStates = (clients: any, clientType: string, clientUrls: string[], state: string, sortType?: string) => {
  for (const clientUrl of clientUrls) {
    if (clientType === 'chainProviders') {
      clients[clientType]['eth'][clientUrl].state = state
      clients[clientType]['eth'][clientUrl].emit('statechange', state)
    } else if (sortType) {
      clients[clientType][sortType][clientUrl].state = state
      clients[clientType][sortType][clientUrl].emit('statechange', state)
    } else {
      clients[clientType][clientUrl].state = state
      clients[clientType][clientUrl].emit('statechange', state)
    }
  }
}

class Client extends EventEmitter {
  state = 'stopped'
}

class Comment extends EventEmitter {
  clients: any = {
    ipfsGateways: {[ipfsGatewayUrl1]: new Client(), [ipfsGatewayUrl2]: new Client(), [ipfsGatewayUrl3]: new Client()},
    ipfsClients: {[ipfsClientUrl1]: new Client(), [ipfsClientUrl2]: new Client(), [ipfsClientUrl3]: new Client()},
    pubsubClients: {[pubsubClientUrl1]: new Client(), [pubsubClientUrl2]: new Client(), [pubsubClientUrl3]: new Client()},
    plebbitRpcClients: {[plebbitRpcClientUrl1]: new Client(), [plebbitRpcClientUrl2]: new Client(), [plebbitRpcClientUrl3]: new Client()},
    chainProviders: {eth: {[ethChainProviderUrl1]: new Client(), [ethChainProviderUrl2]: new Client(), [ethChainProviderUrl3]: new Client()}},
  }
  cid: string
  timestamp?: number
  updatedAt?: number
  constructor({cid}: any) {
    super()
    this.cid = cid
  }

  async update() {
    ;(async () => {
      // set states fetching comment ipfs
      changeClientsStates(this.clients, 'ipfsGateways', [ipfsGatewayUrl1, ipfsGatewayUrl2], 'fetching-ipfs')
      changeClientsStates(this.clients, 'ipfsClients', [ipfsClientUrl1, ipfsClientUrl2], 'fetching-ipfs')
      changeClientsStates(this.clients, 'plebbitRpcClients', [plebbitRpcClientUrl1, plebbitRpcClientUrl2], 'fetching-ipfs')
      await simulateLoadingTime(20)

      // fetched comment ipfs
      this.timestamp = timestamp
      this.emit('update', this)
      await simulateLoadingTime(20)

      // set states fetching comment update
      changeClientsStates(this.clients, 'ipfsGateways', [ipfsGatewayUrl1, ipfsGatewayUrl2], 'fetching-ipns')
      changeClientsStates(this.clients, 'ipfsClients', [ipfsClientUrl1, ipfsClientUrl2], 'fetching-ipns')
      changeClientsStates(this.clients, 'plebbitRpcClients', [plebbitRpcClientUrl1, plebbitRpcClientUrl2], 'fetching-ipns')
      await simulateLoadingTime(20)

      // set states resolving subplebbit address
      changeClientsStates(this.clients, 'ipfsGateways', [ipfsGatewayUrl1, ipfsGatewayUrl2], 'stopped')
      changeClientsStates(this.clients, 'ipfsClients', [ipfsClientUrl1, ipfsClientUrl2], 'stopped')
      changeClientsStates(this.clients, 'plebbitRpcClients', [plebbitRpcClientUrl1, plebbitRpcClientUrl2], 'stopped')
      changeClientsStates(this.clients, 'chainProviders', [ethChainProviderUrl1, ethChainProviderUrl2], 'resolving-address')
      await simulateLoadingTime(20)

      // set states stop resolving subplebbit address
      changeClientsStates(this.clients, 'chainProviders', [ethChainProviderUrl1, ethChainProviderUrl2], 'stopped')
      await simulateLoadingTime(20)

      // fetched comment update
      this.updatedAt = updatedAt
      this.emit('update', this)
    })()
  }
}

class Pages {
  clients: any = {
    ipfsGateways: {hot: {[ipfsGatewayUrl1]: new Client(), [ipfsGatewayUrl2]: new Client(), [ipfsGatewayUrl3]: new Client()}},
    ipfsClients: {hot: {[ipfsClientUrl1]: new Client(), [ipfsClientUrl2]: new Client(), [ipfsClientUrl3]: new Client()}},
    plebbitRpcClients: {hot: {[plebbitRpcClientUrl1]: new Client(), [plebbitRpcClientUrl2]: new Client(), [plebbitRpcClientUrl3]: new Client()}},
  }
  pages: any = {}
  pageCids = {}
  async getPage(pageCid: string) {
    await simulateLoadingTime(100)
    changeClientsStates(this.clients, 'ipfsGateways', [ipfsGatewayUrl1, ipfsGatewayUrl2], 'fetching-ipfs', 'hot')
    changeClientsStates(this.clients, 'ipfsClients', [ipfsClientUrl1, ipfsClientUrl2], 'fetching-ipfs', 'hot')
    changeClientsStates(this.clients, 'plebbitRpcClients', [plebbitRpcClientUrl1, plebbitRpcClientUrl2], 'fetching-ipfs', 'hot')
    await simulateLoadingTime(100)
    changeClientsStates(this.clients, 'ipfsGateways', [ipfsGatewayUrl1, ipfsGatewayUrl2], 'stopped', 'hot')
    changeClientsStates(this.clients, 'ipfsClients', [ipfsClientUrl1, ipfsClientUrl2], 'stopped', 'hot')
    changeClientsStates(this.clients, 'plebbitRpcClients', [plebbitRpcClientUrl1, plebbitRpcClientUrl2], 'stopped', 'hot')

    return {
      comments: [{cid: '4'}, {cid: '5'}, {cid: '6'}],
    }
  }
}

class Subplebbit extends EventEmitter {
  clients: any = {
    ipfsGateways: {[ipfsGatewayUrl1]: new Client(), [ipfsGatewayUrl2]: new Client(), [ipfsGatewayUrl3]: new Client()},
    ipfsClients: {[ipfsClientUrl1]: new Client(), [ipfsClientUrl2]: new Client(), [ipfsClientUrl3]: new Client()},
    pubsubClients: {[pubsubClientUrl1]: new Client(), [pubsubClientUrl2]: new Client(), [pubsubClientUrl3]: new Client()},
    plebbitRpcClients: {[plebbitRpcClientUrl1]: new Client(), [plebbitRpcClientUrl2]: new Client(), [plebbitRpcClientUrl3]: new Client()},
    chainProviders: {eth: {[ethChainProviderUrl1]: new Client(), [ethChainProviderUrl2]: new Client(), [ethChainProviderUrl3]: new Client()}},
  }
  posts = new Pages()
  address: string
  updatedAt?: number
  constructor({address}: any) {
    super()
    this.address = address
  }

  async update() {
    ;(async () => {
      // set states resolving subplebbit address
      changeClientsStates(this.clients, 'chainProviders', [ethChainProviderUrl1, ethChainProviderUrl2], 'resolving-address')
      await simulateLoadingTime(100)

      // set states fetching subplebbit ipns
      changeClientsStates(this.clients, 'chainProviders', [ethChainProviderUrl1, ethChainProviderUrl2], 'stopped')
      changeClientsStates(this.clients, 'ipfsGateways', [ipfsGatewayUrl1, ipfsGatewayUrl2], 'fetching-ipns')
      changeClientsStates(this.clients, 'ipfsClients', [ipfsClientUrl1, ipfsClientUrl2], 'fetching-ipns')
      changeClientsStates(this.clients, 'plebbitRpcClients', [plebbitRpcClientUrl1, plebbitRpcClientUrl2], 'fetching-ipns')
      await simulateLoadingTime(100)

      // set states stop fetching subplebbit ipns
      changeClientsStates(this.clients, 'ipfsGateways', [ipfsGatewayUrl1, ipfsGatewayUrl2], 'stopped')
      changeClientsStates(this.clients, 'ipfsClients', [ipfsClientUrl1, ipfsClientUrl2], 'stopped')
      changeClientsStates(this.clients, 'plebbitRpcClients', [plebbitRpcClientUrl1, plebbitRpcClientUrl2], 'stopped')
      await simulateLoadingTime(100)

      // fetched subplebbit ipns
      this.updatedAt = updatedAt
      this.posts.pages = {
        hot: {
          comments: [{cid: '1'}, {cid: '2'}, {cid: '3'}],
          nextCid: 'next page cid',
        },
      }
      this.emit('update', this)
    })()
  }
}

const createComment = Plebbit.prototype.createComment
const createSubplebbit = Plebbit.prototype.createSubplebbit

describe('states', () => {
  beforeAll(() => {
    // mock create to add clients states
    Plebbit.prototype.createComment = async ({cid}: any) => {
      const comment: any = new Comment({cid})
      return comment
    }
    Plebbit.prototype.createSubplebbit = async ({address}: any) => {
      const subplebbit: any = new Subplebbit({address})
      return subplebbit
    }
    testUtils.silenceReactWarnings()
  })
  afterAll(() => {
    // restore
    Plebbit.prototype.createComment = createComment
    Plebbit.prototype.createSubplebbit = createSubplebbit
    testUtils.restoreAll()
  })
  afterEach(async () => {
    await testUtils.resetDatabasesAndStores()
  })

  describe('useClientsStates', () => {
    afterEach(async () => {
      await testUtils.resetDatabasesAndStores()
    })

    test('comment', async () => {
      const rendered = renderHook<any, any>((commentCid) => {
        const comment = useComment({commentCid})
        const {states} = useClientsStates({comment})
        return {comment, states}
      })
      const waitFor = testUtils.createWaitFor(rendered)
      expect(rendered.result.current.comment.cid).toBe(undefined)
      expect(rendered.result.current.states).toEqual({})

      // initial state
      rendered.rerender('comment cid 1')
      await waitFor(() => typeof rendered.result.current.comment.cid === 'string')
      expect(rendered.result.current.comment.cid).toBe('comment cid 1')

      // states start fetching comment ipfs
      await waitFor(() => rendered.result.current.states['fetching-ipfs'].length >= 6)
      expect(rendered.result.current.states).toEqual({
        'fetching-ipfs': [
          'https://ipfsgateway1.com',
          'https://ipfsgateway2.com',
          'https://ipfsclient1.com',
          'https://ipfsclient2.com',
          'https://plebbitrpcclienturl1.com',
          'https://plebbitrpcclienturl2.com',
        ],
      })

      // wait for comment ipfs
      await waitFor(() => typeof rendered.result.current.comment.timestamp === 'number')
      expect(rendered.result.current.comment.timestamp).toBe(timestamp)

      // states start fetching comment update
      await waitFor(() => rendered.result.current.states['fetching-ipns'].length >= 6)
      expect(rendered.result.current.states).toEqual({
        'fetching-ipns': [
          'https://ipfsgateway1.com',
          'https://ipfsgateway2.com',
          'https://ipfsclient1.com',
          'https://ipfsclient2.com',
          'https://plebbitrpcclienturl1.com',
          'https://plebbitrpcclienturl2.com',
        ],
      })

      await waitFor(() => rendered.result.current.states['resolving-address'].length >= 2)
      expect(rendered.result.current.states).toEqual({
        'resolving-address': [ethChainProviderUrl1, ethChainProviderUrl2],
      })

      // wait for comment update
      await waitFor(() => typeof rendered.result.current.comment.updatedAt === 'number')
      expect(rendered.result.current.comment.updatedAt).toBe(updatedAt)
      expect(rendered.result.current.states).toEqual({})
    })

    test('subplebbit', async () => {
      const rendered = renderHook<any, any>((subplebbitAddress: string) => {
        const subplebbit = useSubplebbit({subplebbitAddress})
        const {feed, loadMore} = useFeed({subplebbitAddresses: subplebbitAddress ? [subplebbitAddress] : []})
        const {states} = useClientsStates({subplebbit})
        return {subplebbit, states, feed, loadMore}
      })
      const waitFor = testUtils.createWaitFor(rendered)
      expect(rendered.result.current.subplebbit.address).toBe(undefined)
      expect(rendered.result.current.states).toEqual({})

      // initial state
      rendered.rerender('subplebbit address 1')
      await waitFor(() => typeof rendered.result.current.subplebbit.address === 'string')
      expect(rendered.result.current.subplebbit.address).toBe('subplebbit address 1')

      // states start fetching comment ipfs
      await waitFor(() => rendered.result.current.states['resolving-address'].length >= 2)
      expect(rendered.result.current.states).toEqual({
        'resolving-address': [ethChainProviderUrl1, ethChainProviderUrl2],
      })

      // states start fetching subplebbit ipns
      await waitFor(() => rendered.result.current.states['fetching-ipns'].length >= 6)
      expect(rendered.result.current.states).toEqual({
        'fetching-ipns': [
          'https://ipfsgateway1.com',
          'https://ipfsgateway2.com',
          'https://ipfsclient1.com',
          'https://ipfsclient2.com',
          'https://plebbitrpcclienturl1.com',
          'https://plebbitrpcclienturl2.com',
        ],
      })

      // wait for subplebbit update
      await waitFor(() => typeof rendered.result.current.subplebbit.updatedAt === 'number')
      expect(rendered.result.current.subplebbit.updatedAt).toBe(updatedAt)
      expect(rendered.result.current.states).toEqual({})

      // wait for first page
      await waitFor(() => rendered.result.current.feed.length === 3)
      expect(rendered.result.current.feed.length).toEqual(3)

      // states start fetching subplebbit page
      await waitFor(() => rendered.result.current.states['fetching-ipfs-page-hot'].length >= 6)
      expect(rendered.result.current.states).toEqual({
        'fetching-ipfs-page-hot': [
          'https://ipfsgateway1.com',
          'https://ipfsgateway2.com',
          'https://ipfsclient1.com',
          'https://ipfsclient2.com',
          'https://plebbitrpcclienturl1.com',
          'https://plebbitrpcclienturl2.com',
        ],
      })

      // wait for second page
      await waitFor(() => rendered.result.current.feed.length === 6)
      expect(rendered.result.current.feed.length).toEqual(6)
      expect(rendered.result.current.states).toEqual({})
    })
  })
})
