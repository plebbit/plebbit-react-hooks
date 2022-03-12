import { act, renderHook } from '@testing-library/react-hooks'
import testUtils from '../lib/test-utils'
import { useFeed } from '../index'
import PlebbitProvider from '../providers/PlebbitProvider'
import localForageLru from '../lib/localforage-lru'
import localForage from 'localforage'
import PlebbitJsMock, { mockPlebbitJs, Plebbit, Subplebbit } from '../lib/plebbit-js/plebbit-js-mock'
mockPlebbitJs(PlebbitJsMock)

const deleteDatabases = () => Promise.all([
  localForage.createInstance({ name: 'accountsMetadata' }).clear(),
  localForage.createInstance({ name: 'accounts' }).clear(),
  localForageLru.createInstance({ name: 'subplebbits' }).clear(),
  localForageLru.createInstance({ name: 'comments' }).clear()
])

describe('feeds', () => {
  beforeAll(() => {
    testUtils.silenceUpdateUnmountedComponentWarning()
  })
  afterAll(() => {
    testUtils.restoreAll()
  })

  describe('get feed sorted by default', () => {
    // reddit infinite scrolling posts per pages are 25
    const postsPerPage = 25

    let rendered: any
    beforeEach(async () => {
      // @ts-ignore
      rendered = renderHook<any, any>((props: any) => useFeed(props?.subplebbitAddresses, props?.sortType, props?.accountName), { wrapper: PlebbitProvider })
      // wait for account to init
      await rendered.waitForNextUpdate()
    })
    afterEach(async () => {
      await deleteDatabases()
    })

    test('get feed with no arguments', async () => {
      expect(rendered.result.current.feed).toBe(undefined)
      expect(typeof rendered.result.current.hasMore).toBe('boolean')
      expect(typeof rendered.result.current.loadMore).toBe('function')
    })

    test('get feed page 1 with 1 subplebbit ', async () => {
      // get feed with 1 sub
      rendered.rerender({subplebbitAddresses: ['subplebbit address 1']})
      // initial state
      expect(typeof rendered.result.current.hasMore).toBe('boolean')
      expect(typeof rendered.result.current.loadMore).toBe('function')

      // wait for feed array to render
      try {await rendered.waitFor(() => Array.isArray(rendered.result.current.feed))} catch (e) {console.error(e)}
      expect(rendered.result.current.feed).toEqual([])

      // wait for posts to be added, should get full first page
      await rendered.waitFor(() => rendered.result.current.feed.length > 0)
      expect(rendered.result.current.feed[0].cid).toBe('subplebbit address 1 - subplebbit address 1 sorted posts cid hot - sorted comment cid 1')
      expect(rendered.result.current.feed.length).toBe(postsPerPage)

      // get feed again from database, only wait for 1 render because subplebbit is stored in db
      const rendered2 = renderHook<any, any>(() => useFeed(['subplebbit address 1']), { wrapper: PlebbitProvider })
      expect(rendered2.result.current.feed).toBe(undefined)
      // only wait for 1 render because subplebbit is stored in db
      try {await rendered2.waitForNextUpdate()} catch (e) {console.error(e)}
      expect(rendered.result.current.feed[0].cid).toBe('subplebbit address 1 - subplebbit address 1 sorted posts cid hot - sorted comment cid 1')
      expect(rendered.result.current.feed.length).toBe(postsPerPage)
    })

    test('get feed and scroll to multiple pages', async () => {
      // get feed with 1 sub
      rendered.rerender({subplebbitAddresses: ['subplebbit address 1']})
      let pages = 20
      let currentPage = 1
      while (currentPage++ < pages) {
        // load 25 more posts
        act(() => {
          rendered.result.current.loadMore()
        })
        try {await rendered.waitFor(() => rendered.result.current.feed?.length >= postsPerPage * currentPage)}
        catch (e) {console.error(e)}
        expect(rendered.result.current.feed.length).toBe(postsPerPage * currentPage)
      }
    })

    test('get multiple subplebbits sorted by new', async () => {
      // get feed with 3 subs sorted by new
      rendered.rerender({subplebbitAddresses: ['subplebbit address 1', 'subplebbit address 2', 'subplebbit address 3'], sortType: 'new'})
      // initial state
      expect(typeof rendered.result.current.hasMore).toBe('boolean')
      expect(typeof rendered.result.current.loadMore).toBe('function')

      // wait for feed array to render
      try {await rendered.waitFor(() => Array.isArray(rendered.result.current.feed))} catch (e) {console.error(e)}
      expect(rendered.result.current.feed).toEqual([])

      // wait for posts to be added
      try {await rendered.waitFor(() => rendered.result.current.feed.length === postsPerPage)} catch (e) {console.error(e)}
      expect(rendered.result.current.feed.length).toBe(postsPerPage)
      // the first page should only give 1 sub because it renders before the other subs are loaded
      // which means the timestamps will be 100, 99, 98, etc
      console.log(rendered.result.current.feed)
      expect(rendered.result.current.feed[0].timestamp).toBe(100)
      expect(rendered.result.current.feed[1].timestamp).toBe(99)
      expect(rendered.result.current.feed[2].timestamp).toBe(98)

      return

      act(() => {
        rendered.result.current.loadMore()
      })
      try {await rendered.waitFor(() => rendered.result.current.feed.length === postsPerPage * 2)} catch (e) {console.error(e)}
      // console.log(rendered.result.current.feed)
      // the first post of the second page should the newest post from sub 2 or 3
      // which have a timestamp of 100
      console.log(rendered.result.current.feed)
      expect(rendered.result.current.feed[postsPerPage].timestamp).toBe(100)

      // scroll many pages
      const pagesToScroll = 40
      let page = 3
      while (page < pagesToScroll) {
        act(() => {
          rendered.result.current.loadMore()
        })
        try {await rendered.waitFor(() => rendered.result.current.feed?.length >= postsPerPage * page)} catch (e) {console.error(e)}
        page++
      }
      console.log(rendered.result.current.feed.length)
      // for (const post of rendered.result.current.feed) {
      //   console.log(post)
      // }
    })

    test.todo(`get feed sorted by hot, don't call subplebbit.getSortedPosts() because already included`)

    test.todo('get feed sorted by top')

    test.todo('get feed using a different account')

    test.todo('get feed and scroll to multiple pages')

    test.todo('get feed and scroll to multiple pages, multiple subplebbits with different page sizes')

    test.todo(`fail to get feed sorted by something that doesn't exist`)

    test.todo(`scroll to end of feed, hasMore becomes false`)

    test.todo(`subplebbits finish loading with 0 posts, hasMore becomes false, but only after finished loading`)

    test.todo(`buffered feeds can fetched multiple subs before delivering the first page`)
  })
})
