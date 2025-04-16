import {act, renderHook} from '@testing-library/react-hooks'
import testUtils from '../../lib/test-utils'
import useRepliesStore, {defaultRepliesPerPage as repliesPerPage, feedOptionsToFeedName} from './replies-store'
import {RepliesPage} from '../../types'
import repliesCommentsStore from './replies-comments-store'
import repliesPagesStore from '../replies-pages'
import EventEmitter from 'events'
import accountsStore from '../accounts'
import {setPlebbitJs} from '../..'
import PlebbitJsMock from '../../lib/plebbit-js/plebbit-js-mock'

const getPageCommentCount = 100

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
    const page: RepliesPage = {
      nextCid: pageCid + ' - next page cid',
      comments: this.getPageMockComments(pageCid),
    }
    return page
  }

  async validatePage(page: any) {}

  getPageMockComments(pageCid: string) {
    let index = 0
    const comments: any[] = []
    while (index++ < getPageCommentCount) {
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
  async update() {}
}

class MockComment extends EventEmitter {
  cid: string
  replies: MockPages
  postCid: string
  subplebbitAddress: string
  constructor({cid}: any) {
    super()
    this.cid = cid
    this.postCid = 'post cid'
    this.subplebbitAddress = `${cid} subplebbit address`
    this.replies = new MockPages({subplebbitAddress: this.subplebbitAddress})
  }
  async update() {}
}

const mockAccount: any = {
  id: 'mock account id',
  plebbit: {
    createSubplebbit: async ({address}: any) => new MockSubplebbit({address}),
    createComment: async ({cid}: any) => new MockComment({cid}),
    getSubplebbit: async (subplebbitAddress: string) => new MockSubplebbit({address: subplebbitAddress}),
    subplebbits: [],
  },
  blockedAddresses: {},
  blockedCids: {},
}

describe('replies store', () => {
  let accountsStoreGetState = accountsStore.getState
  beforeAll(() => {
    // set plebbit-js mock
    setPlebbitJs(PlebbitJsMock)

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
    rendered = renderHook<any, any>(() => useRepliesStore())
    waitFor = testUtils.createWaitFor(rendered)
  })

  test('initial store', async () => {
    expect(rendered.result.current.feedsOptions).toEqual({})
    expect(rendered.result.current.bufferedFeeds).toEqual({})
    expect(rendered.result.current.bufferedFeedsReplyCounts).toEqual({})
    expect(rendered.result.current.loadedFeeds).toEqual({})
    expect(rendered.result.current.updatedFeeds).toEqual({})
    expect(typeof rendered.result.current.addFeedToStore).toBe('function')
    expect(typeof rendered.result.current.addFeedToStoreOrUpdateComment).toBe('function')
    expect(typeof rendered.result.current.incrementFeedPageNumber).toBe('function')
    expect(typeof rendered.result.current.updateFeeds).toBe('function')
  })

  test('add feed, increment page', async () => {
    const commentCid = 'comment cid 1'
    const sortType = 'new'
    const feedOptions = {sortType, commentCid, accountId: mockAccount.id}
    const feedName = feedOptionsToFeedName(feedOptions)
    const comment = new MockComment({cid: commentCid})

    act(() => {
      rendered.result.current.addFeedToStoreOrUpdateComment(comment, feedOptions)
    })

    // wait for feed to be added
    await waitFor(() => rendered.result.current.feedsOptions[feedName])
    expect(rendered.result.current.feedsOptions[feedName].pageNumber).toBe(1)
    expect(rendered.result.current.feedsOptions[feedName].sortType).toBe(sortType)
    expect(rendered.result.current.feedsOptions[feedName].commentCid).toEqual(commentCid)
    expect(rendered.result.current.feedsOptions[feedName].accountId).toEqual(mockAccount.id)

    // wait for feed to load
    await waitFor(() => rendered.result.current.loadedFeeds[feedName]?.length > 0)

    // comment was added to comments store
    expect(repliesCommentsStore.getState().comments[commentCid]).not.toBe(undefined)

    // feeds become defined
    expect(rendered.result.current.bufferedFeeds[feedName]).not.toBe(undefined)
    expect(rendered.result.current.loadedFeeds[feedName]).not.toBe(undefined)
    expect(rendered.result.current.updatedFeeds[feedName]?.length).toBe(rendered.result.current.loadedFeeds[feedName].length)
    expect(rendered.result.current.bufferedFeedsReplyCounts[feedName]).not.toBe(undefined)
    expect(rendered.result.current.feedsHaveMore[feedName]).toBe(true)

    // replies pages fetch 1 page
    expect(Object.keys(repliesPagesStore.getState().repliesPages).length).toBe(1)
    // buffered feed has 1 page
    expect(rendered.result.current.bufferedFeeds[feedName].length).toBe(getPageCommentCount - repliesPerPage)
    expect(rendered.result.current.bufferedFeedsReplyCounts[feedName]).toBe(getPageCommentCount - repliesPerPage)
    expect(rendered.result.current.feedsHaveMore[feedName]).toBe(true)

    // loaded feed has 1 page
    expect(rendered.result.current.loadedFeeds[feedName].length).toBe(repliesPerPage)
    expect(rendered.result.current.updatedFeeds[feedName].length).toBe(rendered.result.current.loadedFeeds[feedName].length)

    // increment page
    act(() => {
      rendered.result.current.incrementFeedPageNumber(feedName)
    })

    // wait for new page
    await waitFor(() => rendered.result.current.loadedFeeds[feedName].length >= repliesPerPage * 2)
    // page was incremented
    expect(rendered.result.current.feedsOptions[feedName].pageNumber).toBe(2)
    // feed options are unchanged
    expect(rendered.result.current.feedsOptions[feedName].sortType).toBe(sortType)
    expect(rendered.result.current.feedsOptions[feedName].commentCid).toEqual(commentCid)
    // loaded feed has correct post counts
    expect(rendered.result.current.loadedFeeds[feedName].length).toBe(repliesPerPage * 2)
    expect(rendered.result.current.updatedFeeds[feedName].length).toBe(rendered.result.current.loadedFeeds[feedName].length)
    // buffered feed has 1 page less
    const bufferedFeedRepliesCount = getPageCommentCount - repliesPerPage * 2
    expect(rendered.result.current.bufferedFeeds[feedName].length).toBe(bufferedFeedRepliesCount)
    expect(rendered.result.current.bufferedFeedsReplyCounts[feedName]).toBe(bufferedFeedRepliesCount)
    expect(rendered.result.current.feedsHaveMore[feedName]).toBe(true)

    // bufferedFeedsReplyCounts now too low (50), wait for buffered feeds to fetch next page
    await waitFor(() => rendered.result.current.bufferedFeeds[feedName].length > bufferedFeedRepliesCount)
    expect(rendered.result.current.bufferedFeeds[feedName].length).toBe(bufferedFeedRepliesCount + getPageCommentCount)
    expect(rendered.result.current.bufferedFeedsReplyCounts[feedName]).toBe(bufferedFeedRepliesCount + getPageCommentCount)
    expect(rendered.result.current.feedsHaveMore[feedName]).toBe(true)

    // save replies pages count to make sure they don't change
    const repliesPagesCount = Object.keys(repliesPagesStore.getState().repliesPages).length
  })
})
