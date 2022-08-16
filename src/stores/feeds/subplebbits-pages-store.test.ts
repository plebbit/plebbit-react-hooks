import {act, renderHook} from '@testing-library/react-hooks'
import testUtils from '../../lib/test-utils'
import _useSubplebbitsPagesStore from './subplebbits-pages-store'

// store must be wrapped in a hook to use in tests
const useSubplebbitsPagesStore = () => {
  // @ts-ignore
  const store = _useSubplebbitsPagesStore()
  return store
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

class MockPages {
  subplebbitAddress: string
  constructor({subplebbitAddress}: any) {
    this.subplebbitAddress = subplebbitAddress
  }

  async getPage(pageCid: string) {
    await sleep(200)
    const page = {
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

describe('subplebbitsPagesStore', () => {
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
    rendered = renderHook<any, any>(() => {
      const store = useSubplebbitsPagesStore()
      return store
    })
    waitFor = testUtils.createWaitFor(rendered)
  })

  test('initial store', async () => {
    expect(rendered.result.current.subplebbitsPages).toEqual({})
    expect(typeof rendered.result.current.addNextSubplebbitPageToStore).toBe('function')
  })

  // test('empty subplebbitsPostsInfo', async () => {
  //   const subplebbitsPostsInfo = {}
  //   rendered.rerender(subplebbitsPostsInfo)
  //   expect(rendered.result.current).toEqual({})
  // })

  // test('subplebbitsPostsInfo gets a new entry', async () => {
  //   const subplebbitsPostsInfo: MockSubplebbitsPostsInfo = {}

  //   // new subplebbitsPostsInfo entry
  //   const subplebbitAddress1FirstPageCid = 'subplebbit address 1 new page cid'
  //   subplebbitsPostsInfo[`${mockAccount.id} - subplebbit address 1 - new`] = {
  //     firstPageCid: subplebbitAddress1FirstPageCid,
  //     account: mockAccount,
  //     subplebbitAddress: 'subplebbit address 1',
  //     sortType: 'new',
  //     bufferedPostCount: 0,
  //   }
  //   rendered.rerender(subplebbitsPostsInfo)

  //   // wait for first page to be defined
  //   await waitFor(() => rendered.result.current[subplebbitAddress1FirstPageCid].nextCid === subplebbitAddress1FirstPageCid + ' - next page cid')
  //   expect(rendered.result.current[subplebbitAddress1FirstPageCid].nextCid).toBe(subplebbitAddress1FirstPageCid + ' - next page cid')
  //   expect(rendered.result.current[subplebbitAddress1FirstPageCid].comments.length).toBe(100)

  //   // change buffered post count to stop the infinite get next page loop
  //   subplebbitsPostsInfo[`${mockAccount.id} - subplebbit address 1 - new`].bufferedPostCount = 100
  //   rendered.rerender(subplebbitsPostsInfo)

  //   // waiting for more subplebbit pages to be fetched should fail because
  //   // the infinite fetch loop is stopped after bufferedPostCount is set above threshold
  //   await expect(rendered.waitFor(() => Object.keys(rendered.result.current).length > 3)).rejects.toThrow('Timed out in waitFor after 1000ms.')
  //   expect(Object.keys(rendered.result.current).length).toBeLessThan(3)

  //   // the first page is still defined
  //   expect(rendered.result.current[subplebbitAddress1FirstPageCid].nextCid).toBe(subplebbitAddress1FirstPageCid + ' - next page cid')
  //   expect(rendered.result.current[subplebbitAddress1FirstPageCid].comments.length).toBe(100)

  //   // bufferedPostCount gets below threshold again
  //   let previousSubplebbitPagesFetchedCount = Object.keys(rendered.result.current).length
  //   subplebbitsPostsInfo[`${mockAccount.id} - subplebbit address 1 - new`].bufferedPostCount = 5
  //   rendered.rerender(subplebbitsPostsInfo)

  //   // wait for new pages to be fetched
  //   await waitFor(() => Object.keys(rendered.result.current).length > previousSubplebbitPagesFetchedCount)
  //   expect(Object.keys(rendered.result.current).length).toBeGreaterThan(previousSubplebbitPagesFetchedCount)

  //   // stop the inifite fetch loop again
  //   previousSubplebbitPagesFetchedCount = Object.keys(rendered.result.current).length
  //   subplebbitsPostsInfo[`${mockAccount.id} - subplebbit address 1 - new`].bufferedPostCount = 100
  //   rendered.rerender(subplebbitsPostsInfo)
  //   // add +1 because a page maybe have been fetched while changing the bufferedPostCount
  //   await expect(rendered.waitFor(() => Object.keys(rendered.result.current).length > previousSubplebbitPagesFetchedCount + 1)).rejects.toThrow(
  //     'Timed out in waitFor after 1000ms.'
  //   )
  //   expect(Object.keys(rendered.result.current).length).toBe(previousSubplebbitPagesFetchedCount + 1)
  // })
})
