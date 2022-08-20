import {act, renderHook} from '@testing-library/react-hooks'
import testUtils from '../../lib/test-utils'
import useFeedsStore, {postsPerPage} from './feeds-store'
import {SubplebbitPage} from '../../types'
import subplebbitsStore from '../subplebbits'
import subplebbitsPagesStore from '../subplebbits-pages'
import EventEmitter from 'events'
import accountsStore from '../accounts'

const subplebbitGetPageCommentCount = 100

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
    let index = 0
    const comments: any[] = []
    while (index++ < subplebbitGetPageCommentCount) {
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
  blockedAddresses: {},
}

describe('feeds store', () => {
  let accountsStoreGetState = accountsStore.getState
  beforeAll(() => {
    testUtils.silenceReactWarnings()

    // mock accountsStore
    // @ts-ignore
    accountsStore.getState = () => ({
      accounts: {[mockAccount.id]: mockAccount},
      accountsActionsInternal: {addCidToAccountComment: async (comment: any) => {}},
    })
  })
  afterAll(async () => {
    // restore accountsStore
    // @ts-ignore
    accountsStoreGetState.getState = accountsStoreGetState

    testUtils.restoreAll()

    // error when resetting accounts store, not sure why
    try {
      await testUtils.resetDatabasesAndStores()
    } catch (e) {
      // console.error(e)
    }
  })

  let rendered: any, waitFor: any
  beforeEach(async () => {
    rendered = renderHook<any, any>(() => useFeedsStore())
    waitFor = testUtils.createWaitFor(rendered)
  })

  test('initial store', async () => {
    expect(rendered.result.current.feedsOptions).toEqual({})
    expect(rendered.result.current.bufferedFeeds).toEqual({})
    expect(rendered.result.current.bufferedFeedsSubplebbitsPostCounts).toEqual({})
    expect(rendered.result.current.loadedFeeds).toEqual({})
    expect(typeof rendered.result.current.addFeedToStore).toBe('function')
    expect(typeof rendered.result.current.incrementFeedPageNumber).toBe('function')
    expect(typeof rendered.result.current.updateFeeds).toBe('function')
  })

  test('add feed, increment page, block address', async () => {
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
    // feeds become defined
    expect(rendered.result.current.bufferedFeeds[feedName]).not.toBe(undefined)
    expect(rendered.result.current.loadedFeeds[feedName]).not.toBe(undefined)
    expect(rendered.result.current.bufferedFeedsSubplebbitsPostCounts[feedName]).not.toBe(undefined)
    expect(rendered.result.current.feedsHaveMore[feedName]).toBe(true)
    // subplebbits pages fetch 1 page
    expect(Object.keys(subplebbitsPagesStore.getState().subplebbitsPages).length).toBe(1)
    // buffered feed has 1 page
    expect(rendered.result.current.bufferedFeeds[feedName].length).toBe(subplebbitGetPageCommentCount - postsPerPage)
    expect(rendered.result.current.bufferedFeedsSubplebbitsPostCounts[feedName][subplebbitAddresses[0]]).toBe(subplebbitGetPageCommentCount - postsPerPage)
    expect(rendered.result.current.feedsHaveMore[feedName]).toBe(true)
    // loaded feed has 1 page
    expect(rendered.result.current.loadedFeeds[feedName].length).toBe(postsPerPage)

    // increment page
    act(() => {
      rendered.result.current.incrementFeedPageNumber(feedName)
    })

    // wait for new page
    await waitFor(() => rendered.result.current.loadedFeeds[feedName].length >= postsPerPage * 2)
    // page was incremented
    expect(rendered.result.current.feedsOptions[feedName].pageNumber).toBe(2)
    // feed options are unchanged
    expect(rendered.result.current.feedsOptions[feedName].sortType).toBe(sortType)
    expect(rendered.result.current.feedsOptions[feedName].subplebbitAddresses).toEqual(subplebbitAddresses)
    // loaded feed has correct post counts
    expect(rendered.result.current.loadedFeeds[feedName].length).toBe(postsPerPage * 2)
    // buffered feed has 1 page less
    const bufferedFeedPostCount = subplebbitGetPageCommentCount - postsPerPage * 2
    expect(rendered.result.current.bufferedFeeds[feedName].length).toBe(bufferedFeedPostCount)
    expect(rendered.result.current.bufferedFeedsSubplebbitsPostCounts[feedName][subplebbitAddresses[0]]).toBe(bufferedFeedPostCount)
    expect(rendered.result.current.feedsHaveMore[feedName]).toBe(true)

    // bufferedFeedsSubplebbitsPostCounts now too low (50), wait for buffered feeds to fetch next page
    await waitFor(() => rendered.result.current.bufferedFeeds[feedName].length > bufferedFeedPostCount)
    expect(rendered.result.current.bufferedFeeds[feedName].length).toBe(bufferedFeedPostCount + subplebbitGetPageCommentCount)
    expect(rendered.result.current.bufferedFeedsSubplebbitsPostCounts[feedName][subplebbitAddresses[0]]).toBe(bufferedFeedPostCount + subplebbitGetPageCommentCount)
    expect(rendered.result.current.feedsHaveMore[feedName]).toBe(true)

    // save subplebbits pages count to make sure they don't change
    const subplebbitsPagesCount = Object.keys(subplebbitsPagesStore.getState().subplebbitsPages).length

    // account blocks the subplebbit address
    const newMockAccount = {...mockAccount, blockedAddresses: {[subplebbitAddresses[0]]: true}}
    // @ts-ignore
    accountsStore.getState = () => ({
      accounts: {[mockAccount.id]: newMockAccount},
      accountsActionsInternal: {addCidToAccountComment: async (comment: any) => {}},
    })
    accountsStore.setState(() => ({
      accounts: {[mockAccount.id]: newMockAccount},
    }))

    // wait for bufferedFeed to go to 0 because the only address is blocked
    await waitFor(() => rendered.result.current.bufferedFeeds[feedName].length === 0)
    expect(rendered.result.current.bufferedFeeds[feedName].length).toBe(0)
    expect(rendered.result.current.bufferedFeedsSubplebbitsPostCounts[feedName][subplebbitAddresses[0]]).toBe(0)
    expect(rendered.result.current.feedsHaveMore[feedName]).toBe(false)
    // loaded feed is unaffected
    expect(rendered.result.current.loadedFeeds[feedName].length).toBe(postsPerPage * 2)

    // make sure no more subplebbits pages get added for the blocked address
    await expect(rendered.waitFor(() => Object.keys(subplebbitsPagesStore.getState().subplebbitsPages).length > subplebbitsPagesCount)).rejects.toThrow(
      'Timed out in waitFor after 1000ms.'
    )
    expect(Object.keys(subplebbitsPagesStore.getState().subplebbitsPages).length).toBe(subplebbitsPagesCount)
  })
})
