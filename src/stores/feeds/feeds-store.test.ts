import {act, renderHook} from '@testing-library/react-hooks'
import testUtils from '../../lib/test-utils'
import useFeedsStore from './feeds-store'
import {SubplebbitPage} from '../../types'
import subplebbitsStore from '../subplebbits'
import EventEmitter from 'events'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

class MockPages {
  subplebbitAddress: string
  pageCids: {[pageCid: string]: string}
  constructor({subplebbitAddress}: any) {
    this.subplebbitAddress = subplebbitAddress
    this.pageCids = {
      new: `${subplebbitAddress} new page cid`,
    }
  }

  async getPage(pageCid: string) {
    await sleep(200)
    const page: SubplebbitPage = {
      nextCid: pageCid + ' - next page cid',
      comments: this.getPageMockComments(pageCid),
    }
    return page
  }

  getPageMockComments(pageCid: string) {
    const commentCount = 100
    let index = 0
    const comments: any[] = []
    while (index++ < commentCount) {
      comments.push({
        timestamp: index,
        cid: pageCid + ' comment cid ' + index,
        subplebbitAddress: this.subplebbitAddress,
      })
    }
    return comments
  }
}

class MockSubplebbit extends EventEmitter {
  address: string
  posts: MockPages
  constructor({address}: any) {
    super()
    this.address = address
    this.posts = new MockPages({subplebbitAddress: address})
  }
  update() {}
}

const mockAccount: any = {
  id: 'mock account id',
  plebbit: {
    createSubplebbit: async ({address}: any) => new MockSubplebbit({address}),
    getSubplebbit: async (subplebbitAddress: string) => new MockSubplebbit({address: subplebbitAddress}),
    listSubplebbits: async () => [],
  },
}

describe('useFeedsStore', () => {
  beforeAll(() => {
    testUtils.silenceReactWarnings()
  })
  afterAll(async () => {
    testUtils.restoreAll()
    await testUtils.resetDatabasesAndStores()
  })

  let rendered: any, waitFor: any
  beforeEach(async () => {
    rendered = renderHook<any, any>(() => useFeedsStore())
    waitFor = testUtils.createWaitFor(rendered)
  })

  test('initial store', async () => {
    expect(rendered.result.current.feedsOptions).toEqual({})
    expect(rendered.result.current.bufferedFeeds).toEqual({})
    expect(rendered.result.current.bufferedPostsCounts).toEqual({})
    expect(rendered.result.current.loadedFeeds).toEqual({})
    expect(typeof rendered.result.current.addFeedToStore).toBe('function')
    expect(typeof rendered.result.current.incrementFeedPageNumber).toBe('function')
    expect(typeof rendered.result.current.updateFeeds).toBe('function')
  })

  test.only('add feed', async () => {
    const subplebbitAddresses = ['subplebbit address 1']
    const sortType = 'new'
    const feedName = JSON.stringify([mockAccount?.id, sortType, subplebbitAddresses])

    act(() => {
      rendered.result.current.addFeedToStore(feedName, subplebbitAddresses, sortType, mockAccount)
    })

    // wait for feed to be added
    await waitFor(() => rendered.result.current.feedsOptions[feedName])
    expect(rendered.result.current.feedsOptions[feedName].pageNumber).toBe(1)
    expect(rendered.result.current.feedsOptions[feedName].sortType).toBe(sortType)
    expect(rendered.result.current.feedsOptions[feedName].subplebbitAddresses).toEqual(subplebbitAddresses)

    // wait for feed to load
    await waitFor(() => rendered.result.current.loadedFeeds[feedName].length > 0)
    // subplebbit was added to subplebbits store
    expect(subplebbitsStore.getState().subplebbits[subplebbitAddresses[0]]).not.toBe(undefined)
    console.log(subplebbitsStore.getState().subplebbits)
    console.log(rendered.result.current)
  })
})
