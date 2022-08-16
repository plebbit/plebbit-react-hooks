import {act, renderHook} from '@testing-library/react-hooks'
import testUtils from '../../lib/test-utils'
import useFeedsStore from './feeds-store'
import {SubplebbitPage} from '../../types'

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

class MockSubplebbit {
  address: string
  posts: MockPages
  constructor({address}: any) {
    this.address = address
    this.posts = new MockPages({subplebbitAddress: address})
  }
}

const mockAccount: any = {
  id: 'mock account id',
  plebbit: {
    createSubplebbit: async ({address}: any) => new MockSubplebbit({address}),
  },
}

describe('useFeedsStore', () => {
  beforeAll(() => {
    testUtils.silenceReactWarnings()
  })
  afterAll(async () => {
    testUtils.restoreAll()
    try {
      await testUtils.resetDatabasesAndStores()
    } catch (e) {}
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

  // test('add next pages', async () => {

  // })
})
