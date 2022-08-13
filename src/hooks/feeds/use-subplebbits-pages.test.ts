import {act, renderHook} from '@testing-library/react-hooks'
import testUtils from '../../lib/test-utils'
import useSubplebbitsPages from './use-subplebbits-pages'
import {SubplebbitPostsInfo} from '../../types'

interface MockSubplebbitPostsInfo extends SubplebbitPostsInfo {
  account: any
}
// infoName = accountId + subplebbitAddress + sortType
type MockSubplebbitsPostsInfo = {[infoName: string]: MockSubplebbitPostsInfo}

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

describe('useSubplebbitsPages', () => {
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
    // @ts-ignore
    rendered = renderHook<any, any>((props: any) => useSubplebbitsPages(props.subplebbitsPostsInfo, props.subplebbits))
    waitFor = testUtils.createWaitFor(rendered)
  })

  test('undefined props', async () => {
    const subplebbitsPostsInfo = undefined
    const subplebbits = undefined
    rendered.rerender({subplebbitsPostsInfo, subplebbits})
    expect(rendered.result.current).toEqual({})
  })

  test('empty props', async () => {
    const subplebbitsPostsInfo = {}
    const subplebbits = {}
    rendered.rerender({subplebbitsPostsInfo, subplebbits})
    expect(rendered.result.current).toEqual({})
  })

  test('subplebbitsPostsInfo gets a new entry', async () => {
    const subplebbitsPostsInfo: MockSubplebbitsPostsInfo = {}

    // new subplebbitsPostsInfo entry
    const subplebbitAddress1FirstPageCid = 'subplebbit address 1 new page cid'
    subplebbitsPostsInfo[`${mockAccount.id} - subplebbit address 1 - new`] = {
      firstPageCid: subplebbitAddress1FirstPageCid,
      account: mockAccount,
      subplebbitAddress: 'subplebbit address 1',
      sortType: 'new',
      bufferedPostCount: 0,
    }
    const subplebbits = {}
    rendered.rerender({subplebbitsPostsInfo, subplebbits})

    // wait for first page to be defined
    await waitFor(() => rendered.result.current[subplebbitAddress1FirstPageCid].nextCid === subplebbitAddress1FirstPageCid + ' - next page cid')

    expect(rendered.result.current[subplebbitAddress1FirstPageCid].nextCid).toBe(subplebbitAddress1FirstPageCid + ' - next page cid')
    expect(rendered.result.current[subplebbitAddress1FirstPageCid].comments.length).toBe(100)
  })

  // test('gets a subplebbit second page', async () => {

  // })
})
