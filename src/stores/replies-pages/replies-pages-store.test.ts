import {act, renderHook} from '@testing-library/react-hooks'
import testUtils from '../../lib/test-utils'
import useRepliesPagesStore, {resetRepliesPagesDatabaseAndStore} from './replies-pages-store'
import {RepliesPage} from '../../types'
import EventEmitter from 'events'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

class MockPages {
  subplebbitAddress: string
  pageCids: {[pageCid: string]: string}
  pages: {[sortType: string]: RepliesPage}
  constructor({subplebbitAddress}: any) {
    this.subplebbitAddress = subplebbitAddress
    this.pageCids = {
      new: `${subplebbitAddress} new page cid`,
    }
    const bestPageCid = `${subplebbitAddress} best page cid`
    this.pages = {
      best: {
        nextCid: bestPageCid + ' - next page cid',
        comments: this.getPageMockComments(bestPageCid),
      },
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

  getPageMockComments(pageCid: string) {
    const commentCount = 100
    let index = 0
    const comments: any[] = []
    while (index++ < commentCount) {
      comments.push({
        timestamp: index,
        cid: pageCid + ' comment cid ' + index,
        subplebbitAddress: this.subplebbitAddress,
        updatedAt: index,
      })
    }
    return comments
  }

  async validatePage(page: any) {}
}

class MockSubplebbit extends EventEmitter {
  address: string
  posts: MockPages
  constructor({address}: any) {
    super()
    this.address = address
    this.posts = new MockPages({subplebbitAddress: address})
  }
}

class MockComment extends EventEmitter {
  cid: string
  replies: MockPages
  constructor({cid}: any) {
    super()
    this.cid = cid
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
  },
}

describe('replies pages store', () => {
  beforeAll(() => {
    testUtils.silenceReactWarnings()
  })
  afterAll(async () => {
    testUtils.restoreAll()
  })

  let rendered: any, waitFor: any
  beforeEach(async () => {
    rendered = renderHook<any, any>(() => useRepliesPagesStore())
    waitFor = testUtils.createWaitFor(rendered)
  })

  afterEach(async () => {
    await resetRepliesPagesDatabaseAndStore()
  })

  test('initial store', async () => {
    expect(rendered.result.current.repliesPages).toEqual({})
    expect(typeof rendered.result.current.addNextRepliesPageToStore).toBe('function')
  })

  test('add next pages from comment.replies.pageCids', async () => {
    const mockComment = await mockAccount.plebbit.createComment({cid: 'comment cid 1'})
    // in the mock, sortType 'new' is only on replies.pageCids
    const sortType = 'new'
    const commentCid1FirstPageCid = mockComment.replies.pageCids[sortType]

    act(() => {
      rendered.result.current.addNextRepliesPageToStore(mockComment, sortType, mockAccount)
    })

    // wait for first page to be defined
    await waitFor(() => rendered.result.current.repliesPages[commentCid1FirstPageCid].nextCid === commentCid1FirstPageCid + ' - next page cid')
    expect(rendered.result.current.repliesPages[commentCid1FirstPageCid].nextCid).toBe(commentCid1FirstPageCid + ' - next page cid')
    expect(rendered.result.current.repliesPages[commentCid1FirstPageCid].comments.length).toBe(100)

    // comments are individually stored in comments store
    const firstCommentCid = rendered.result.current.repliesPages[commentCid1FirstPageCid].comments[0].cid
    expect(rendered.result.current.comments[firstCommentCid].cid).toBe(firstCommentCid)
    expect(Object.keys(rendered.result.current.comments).length).toBe(100)

    act(() => {
      rendered.result.current.addNextRepliesPageToStore(mockComment, sortType, mockAccount)
    })

    // wait for second page to be defined
    const commentCid1SecondPageCid = `${commentCid1FirstPageCid} - next page cid`
    await waitFor(() => rendered.result.current.repliesPages[commentCid1SecondPageCid].nextCid === commentCid1SecondPageCid + ' - next page cid')
    expect(rendered.result.current.repliesPages[commentCid1SecondPageCid].nextCid).toBe(commentCid1SecondPageCid + ' - next page cid')
    expect(rendered.result.current.repliesPages[commentCid1SecondPageCid].comments.length).toBe(100)

    // no more pages
    const getPage = MockPages.prototype.getPage
    MockPages.prototype.getPage = async (pageCid) => ({comments: [], nextCid: undefined})

    act(() => {
      rendered.result.current.addNextRepliesPageToStore(mockComment, sortType, mockAccount)
    })

    // wait for third page to be defined
    const commentCid1ThirdPageCid = `${commentCid1SecondPageCid} - next page cid`
    await waitFor(() => rendered.result.current.repliesPages[commentCid1ThirdPageCid].nextCid === undefined)
    expect(rendered.result.current.repliesPages[commentCid1ThirdPageCid].nextCid).toBe(undefined)
    expect(rendered.result.current.repliesPages[commentCid1ThirdPageCid].comments.length).toBe(0)

    // adding a next page when no more pages does nothing
    const previousRepliesPagesFetchedCount = Object.keys(rendered.result.current.repliesPages).length
    act(() => {
      rendered.result.current.addNextRepliesPageToStore(mockComment, sortType, mockAccount)
    })
    await expect(rendered.waitFor(() => Object.keys(rendered.result.current.repliesPages).length > previousRepliesPagesFetchedCount)).rejects.toThrow(
      'Timed out in waitFor after 1000ms.'
    )
    expect(Object.keys(rendered.result.current.repliesPages).length).toBe(previousRepliesPagesFetchedCount)

    // restore mock
    MockPages.prototype.getPage = getPage
  })

  test('add next pages from comment.replies.pages', async () => {
    const mockComment = await mockAccount.plebbit.createComment({cid: 'comment cid 1'})
    // in the mock, sortType 'best' is only on replies.pages
    const sortType = 'best'
    const commentCid1FirstPageCid = mockComment.replies.pages[sortType].nextCid

    act(() => {
      rendered.result.current.addNextRepliesPageToStore(mockComment, sortType, mockAccount)
    })

    // wait for first page to be defined
    await waitFor(() => rendered.result.current.repliesPages[commentCid1FirstPageCid].nextCid === commentCid1FirstPageCid + ' - next page cid')
    expect(rendered.result.current.repliesPages[commentCid1FirstPageCid].nextCid).toBe(commentCid1FirstPageCid + ' - next page cid')
    expect(rendered.result.current.repliesPages[commentCid1FirstPageCid].comments.length).toBe(100)

    act(() => {
      rendered.result.current.addNextRepliesPageToStore(mockComment, sortType, mockAccount)
    })

    // wait for second page to be defined
    const commentCid1SecondPageCid = `${commentCid1FirstPageCid} - next page cid`
    await waitFor(() => rendered.result.current.repliesPages[commentCid1SecondPageCid].nextCid === commentCid1SecondPageCid + ' - next page cid')
    expect(rendered.result.current.repliesPages[commentCid1SecondPageCid].nextCid).toBe(commentCid1SecondPageCid + ' - next page cid')
    expect(rendered.result.current.repliesPages[commentCid1SecondPageCid].comments.length).toBe(100)

    // no more pages
    const getPage = MockPages.prototype.getPage
    MockPages.prototype.getPage = async (pageCid) => ({comments: [], nextCid: undefined})

    act(() => {
      rendered.result.current.addNextRepliesPageToStore(mockComment, sortType, mockAccount)
    })

    // wait for third page to be defined
    const commentCid1ThirdPageCid = `${commentCid1SecondPageCid} - next page cid`
    await waitFor(() => rendered.result.current.repliesPages[commentCid1ThirdPageCid].nextCid === undefined)
    expect(rendered.result.current.repliesPages[commentCid1ThirdPageCid].nextCid).toBe(undefined)
    expect(rendered.result.current.repliesPages[commentCid1ThirdPageCid].comments.length).toBe(0)

    // adding a next page when no more pages does nothing
    const previousRepliesPagesFetchedCount = Object.keys(rendered.result.current.repliesPages).length
    act(() => {
      rendered.result.current.addNextRepliesPageToStore(mockComment, sortType, mockAccount)
    })
    await expect(rendered.waitFor(() => Object.keys(rendered.result.current.repliesPages).length > previousRepliesPagesFetchedCount)).rejects.toThrow(
      'Timed out in waitFor after 1000ms.'
    )
    expect(Object.keys(rendered.result.current.repliesPages).length).toBe(previousRepliesPagesFetchedCount)

    // restore mock
    MockPages.prototype.getPage = getPage
  })
})
