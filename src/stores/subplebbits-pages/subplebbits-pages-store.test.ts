import {act, renderHook} from '@testing-library/react-hooks'
import testUtils from '../../lib/test-utils'
import useSubplebbitsPagesStore, {resetSubplebbitsPagesDatabaseAndStore} from './subplebbits-pages-store'
import {SubplebbitPage} from '../../types'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

class MockPages {
  subplebbitAddress: string
  pageCids: {[pageCid: string]: string}
  pages: {[sortType: string]: SubplebbitPage}
  constructor({subplebbitAddress}: any) {
    this.subplebbitAddress = subplebbitAddress
    this.pageCids = {
      new: `${subplebbitAddress} new page cid`,
    }
    const hotPageCid = `${subplebbitAddress} hot page cid`
    this.pages = {
      hot: {
        nextCid: hotPageCid + ' - next page cid',
        comments: this.getPageMockComments(hotPageCid),
      },
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

describe('subplebbits pages store', () => {
  beforeAll(() => {
    testUtils.silenceReactWarnings()
  })
  afterAll(async () => {
    testUtils.restoreAll()
  })

  let rendered: any, waitFor: any
  beforeEach(async () => {
    rendered = renderHook<any, any>(() => useSubplebbitsPagesStore())
    waitFor = testUtils.createWaitFor(rendered)
  })

  afterEach(async () => {
    await resetSubplebbitsPagesDatabaseAndStore()
  })

  test('initial store', async () => {
    expect(rendered.result.current.subplebbitsPages).toEqual({})
    expect(typeof rendered.result.current.addNextSubplebbitPageToStore).toBe('function')
  })

  test('add next pages from subplebbit.posts.pageCids', async () => {
    const mockSubplebbit = await mockAccount.plebbit.createSubplebbit({address: 'subplebbit address 1'})
    // in the mock, sortType 'new' is only on subplebbit.pageCids
    const sortType = 'new'
    const subplebbitAddress1FirstPageCid = mockSubplebbit.posts.pageCids[sortType]

    act(() => {
      rendered.result.current.addNextSubplebbitPageToStore(mockSubplebbit, sortType, mockAccount)
    })

    // wait for first page to be defined
    await waitFor(() => rendered.result.current.subplebbitsPages[subplebbitAddress1FirstPageCid].nextCid === subplebbitAddress1FirstPageCid + ' - next page cid')
    expect(rendered.result.current.subplebbitsPages[subplebbitAddress1FirstPageCid].nextCid).toBe(subplebbitAddress1FirstPageCid + ' - next page cid')
    expect(rendered.result.current.subplebbitsPages[subplebbitAddress1FirstPageCid].comments.length).toBe(100)

    act(() => {
      rendered.result.current.addNextSubplebbitPageToStore(mockSubplebbit, sortType, mockAccount)
    })

    // wait for second page to be defined
    const subplebbitAddress1SecondPageCid = `${subplebbitAddress1FirstPageCid} - next page cid`
    await waitFor(() => rendered.result.current.subplebbitsPages[subplebbitAddress1SecondPageCid].nextCid === subplebbitAddress1SecondPageCid + ' - next page cid')
    expect(rendered.result.current.subplebbitsPages[subplebbitAddress1SecondPageCid].nextCid).toBe(subplebbitAddress1SecondPageCid + ' - next page cid')
    expect(rendered.result.current.subplebbitsPages[subplebbitAddress1SecondPageCid].comments.length).toBe(100)

    // no more pages
    const getPage = MockPages.prototype.getPage
    MockPages.prototype.getPage = async (pageCid) => ({comments: [], nextCid: undefined})

    act(() => {
      rendered.result.current.addNextSubplebbitPageToStore(mockSubplebbit, sortType, mockAccount)
    })

    // wait for third page to be defined
    const subplebbitAddress1ThirdPageCid = `${subplebbitAddress1SecondPageCid} - next page cid`
    await waitFor(() => rendered.result.current.subplebbitsPages[subplebbitAddress1ThirdPageCid].nextCid === undefined)
    expect(rendered.result.current.subplebbitsPages[subplebbitAddress1ThirdPageCid].nextCid).toBe(undefined)
    expect(rendered.result.current.subplebbitsPages[subplebbitAddress1ThirdPageCid].comments.length).toBe(0)

    // adding a next page when no more pages does nothing
    const previousSubplebbitPagesFetchedCount = Object.keys(rendered.result.current.subplebbitsPages).length
    act(() => {
      rendered.result.current.addNextSubplebbitPageToStore(mockSubplebbit, sortType, mockAccount)
    })
    await expect(rendered.waitFor(() => Object.keys(rendered.result.current.subplebbitsPages).length > previousSubplebbitPagesFetchedCount)).rejects.toThrow(
      'Timed out in waitFor after 1000ms.'
    )
    expect(Object.keys(rendered.result.current.subplebbitsPages).length).toBe(previousSubplebbitPagesFetchedCount)

    // restore mock
    MockPages.prototype.getPage = getPage
  })

  test('add next pages from subplebbit.posts.pages', async () => {
    const mockSubplebbit = await mockAccount.plebbit.createSubplebbit({address: 'subplebbit address 1'})
    // in the mock, sortType 'hot' is only on subplebbit.pages
    const sortType = 'hot'
    const subplebbitAddress1FirstPageCid = mockSubplebbit.posts.pages[sortType].nextCid

    act(() => {
      rendered.result.current.addNextSubplebbitPageToStore(mockSubplebbit, sortType, mockAccount)
    })

    // wait for first page to be defined
    await waitFor(() => rendered.result.current.subplebbitsPages[subplebbitAddress1FirstPageCid].nextCid === subplebbitAddress1FirstPageCid + ' - next page cid')
    expect(rendered.result.current.subplebbitsPages[subplebbitAddress1FirstPageCid].nextCid).toBe(subplebbitAddress1FirstPageCid + ' - next page cid')
    expect(rendered.result.current.subplebbitsPages[subplebbitAddress1FirstPageCid].comments.length).toBe(100)

    act(() => {
      rendered.result.current.addNextSubplebbitPageToStore(mockSubplebbit, sortType, mockAccount)
    })

    // wait for second page to be defined
    const subplebbitAddress1SecondPageCid = `${subplebbitAddress1FirstPageCid} - next page cid`
    await waitFor(() => rendered.result.current.subplebbitsPages[subplebbitAddress1SecondPageCid].nextCid === subplebbitAddress1SecondPageCid + ' - next page cid')
    expect(rendered.result.current.subplebbitsPages[subplebbitAddress1SecondPageCid].nextCid).toBe(subplebbitAddress1SecondPageCid + ' - next page cid')
    expect(rendered.result.current.subplebbitsPages[subplebbitAddress1SecondPageCid].comments.length).toBe(100)

    // no more pages
    const getPage = MockPages.prototype.getPage
    MockPages.prototype.getPage = async (pageCid) => ({comments: [], nextCid: undefined})

    act(() => {
      rendered.result.current.addNextSubplebbitPageToStore(mockSubplebbit, sortType, mockAccount)
    })

    // wait for third page to be defined
    const subplebbitAddress1ThirdPageCid = `${subplebbitAddress1SecondPageCid} - next page cid`
    await waitFor(() => rendered.result.current.subplebbitsPages[subplebbitAddress1ThirdPageCid].nextCid === undefined)
    expect(rendered.result.current.subplebbitsPages[subplebbitAddress1ThirdPageCid].nextCid).toBe(undefined)
    expect(rendered.result.current.subplebbitsPages[subplebbitAddress1ThirdPageCid].comments.length).toBe(0)

    // adding a next page when no more pages does nothing
    const previousSubplebbitPagesFetchedCount = Object.keys(rendered.result.current.subplebbitsPages).length
    act(() => {
      rendered.result.current.addNextSubplebbitPageToStore(mockSubplebbit, sortType, mockAccount)
    })
    await expect(rendered.waitFor(() => Object.keys(rendered.result.current.subplebbitsPages).length > previousSubplebbitPagesFetchedCount)).rejects.toThrow(
      'Timed out in waitFor after 1000ms.'
    )
    expect(Object.keys(rendered.result.current.subplebbitsPages).length).toBe(previousSubplebbitPagesFetchedCount)

    // restore mock
    MockPages.prototype.getPage = getPage
  })
})
