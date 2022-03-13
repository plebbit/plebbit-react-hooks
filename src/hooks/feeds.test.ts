import { act, renderHook } from '@testing-library/react-hooks'
import testUtils from '../lib/test-utils'
import { useFeed } from '../index'
import PlebbitProvider from '../providers/PlebbitProvider'
import localForageLru from '../lib/localforage-lru'
import localForage from 'localforage'
import PlebbitJsMock, { mockPlebbitJs, Plebbit, Subplebbit, simulateLoadingTime } from '../lib/plebbit-js/plebbit-js-mock'
mockPlebbitJs(PlebbitJsMock)

const deleteDatabases = () => Promise.all([
  localForage.createInstance({ name: 'accountsMetadata' }).clear(),
  localForage.createInstance({ name: 'accounts' }).clear(),
  localForageLru.createInstance({ name: 'subplebbits' }).clear(),
  localForageLru.createInstance({ name: 'comments' }).clear()
])

describe('feeds', () => {
  beforeAll(() => {
    // some feeds tests are flaky
    // jest.retryTimes(5)
    testUtils.silenceUpdateUnmountedComponentWarning()
  })
  afterAll(() => {
    // jest.retryTimes(0)
    testUtils.restoreAll()
  })

  describe('get feed sorted by default', () => {
    // reddit infinite scrolling posts per pages are 25
    const postsPerPage = 25
    let rendered: any

    const scrollOnePage = async () => {
      const nextFeedLength = (rendered.result.current.feed?.length || 0) + postsPerPage
      act(() => {rendered.result.current.loadMore()})
      try {await rendered.waitFor(() => rendered.result.current.feed?.length >= nextFeedLength)} catch (e) {console.error('scrollOnePage failed:', e)}
    }

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
      expect(rendered.result.current.feed[0].cid).toBe('subplebbit address 1 sorted posts cid hot comment cid 1')
      expect(rendered.result.current.feed.length).toBe(postsPerPage)

      // get feed again from database, only wait for 1 render because subplebbit is stored in db
      const rendered2 = renderHook<any, any>(() => useFeed(['subplebbit address 1']), { wrapper: PlebbitProvider })
      expect(rendered2.result.current.feed).toBe(undefined)
      // only wait for 1 render because subplebbit is stored in db
      try {await rendered2.waitForNextUpdate()} catch (e) {console.error(e)}
      expect(rendered.result.current.feed[0].cid).toBe('subplebbit address 1 sorted posts cid hot comment cid 1')
      expect(rendered.result.current.feed.length).toBe(postsPerPage)
    })

    test('get feed with 1 subplebbit and scroll to multiple pages', async () => {
      // get feed with 1 sub
      rendered.rerender({subplebbitAddresses: ['subplebbit address 1']})
      let pages = 20
      let currentPage = 1
      while (currentPage++ < pages) {
        // load 25 more posts
        act(() => {rendered.result.current.loadMore()})
        try {await rendered.waitFor(() => rendered.result.current.feed?.length >= postsPerPage * currentPage)} catch (e) {console.error(e)}
        expect(rendered.result.current.feed.length).toBe(postsPerPage * currentPage)
      }
    })

    test('get feed with 1 subplebbit sorted by new and scroll to multiple pages', async () => {
      let getSortedPostsCalledTimes = 0
      const getSortedPosts = Subplebbit.prototype.getSortedPosts
      Subplebbit.prototype.getSortedPosts = async function (sortedPostsCid: string) {
        await simulateLoadingTime()
        const sortedComments: any = {
          nextSortedCommentsCid: 'next sorted comments cid ' + (getSortedPostsCalledTimes + 1), 
          comments: []
        }
        const postCount = 100
        let index = 0
        let commentStartIndex = getSortedPostsCalledTimes * postCount
        while (index++ < postCount) {
          sortedComments.comments.push({
            timestamp: commentStartIndex + index,
            cid: sortedPostsCid + ' comment cid ' + (commentStartIndex + index), 
            subplebbitAddress: this.address
          })
        }
        getSortedPostsCalledTimes++
        return sortedComments
      }

      // get feed with 1 sub sorted by new page 1
      rendered.rerender({subplebbitAddresses: ['subplebbit address 1'], sortType: 'new'})
      try {await rendered.waitFor(() => rendered.result.current.feed?.length >= postsPerPage)} catch (e) {console.error(e)}
      expect(rendered.result.current.feed[0].timestamp).toBe(100)
      expect(rendered.result.current.feed[1].timestamp).toBe(99)
      expect(rendered.result.current.feed[2].timestamp).toBe(98)
      expect(rendered.result.current.feed[0].cid).toBe('subplebbit address 1 sorted posts cid new comment cid 100')
      expect(rendered.result.current.feed[1].cid).toBe('subplebbit address 1 sorted posts cid new comment cid 99')
      expect(rendered.result.current.feed[2].cid).toBe('subplebbit address 1 sorted posts cid new comment cid 98')

      // at this point the buffered feed has gotten 1 subplebbit page 
      expect(getSortedPostsCalledTimes).toBe(1)

      // get page 2
      await scrollOnePage()
      expect(rendered.result.current.feed[postsPerPage].timestamp).toBe(75)
      expect(rendered.result.current.feed[postsPerPage].cid).toBe('subplebbit address 1 sorted posts cid new comment cid 75')

      // ad this point the buffered feed is length 50, we can wait for getSortedPosts to be called again
      // refill the buffer
      try {await rendered.waitFor(() => getSortedPostsCalledTimes === 2)} catch (e) {console.error(e)}
      expect(getSortedPostsCalledTimes).toBe(2)

      // get page 3 and 4, it should show new posts from the recalculated buffer
      await scrollOnePage()
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].timestamp).toBe(200)
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].cid).toBe('next sorted comments cid 1 comment cid 200')
      await scrollOnePage()
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].timestamp).toBe(175)
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].cid).toBe('next sorted comments cid 1 comment cid 175')

      // scroll 2 more times to get to buffered feeds length 50 and trigger a new buffer refill
      await scrollOnePage()
      await scrollOnePage()
      try {await rendered.waitFor(() => getSortedPostsCalledTimes === 3)} catch (e) {console.error(e)}
      expect(getSortedPostsCalledTimes).toBe(3)

      // next pages should have recalculated buffered feed that starts at 300
      await scrollOnePage()
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].timestamp).toBe(300)
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].cid).toBe('next sorted comments cid 2 comment cid 300')
      await scrollOnePage()
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].timestamp).toBe(275)
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].cid).toBe('next sorted comments cid 2 comment cid 275')
    
      Subplebbit.prototype.getSortedPosts = getSortedPosts
    })

    test.skip('get multiple subplebbits sorted by new', async () => {
      // // get feed with 3 subs sorted by new
      // rendered.rerender({subplebbitAddresses: ['subplebbit address 1', 'subplebbit address 2', 'subplebbit address 3'], sortType: 'new'})
      // // initial state
      // expect(typeof rendered.result.current.hasMore).toBe('boolean')
      // expect(typeof rendered.result.current.loadMore).toBe('function')

      // // wait for feed array to render
      // try {await rendered.waitFor(() => Array.isArray(rendered.result.current.feed))} catch (e) {console.error(e)}
      // expect(rendered.result.current.feed).toEqual([])

      // // wait for posts to be added
      // try {await rendered.waitFor(() => rendered.result.current.feed.length === postsPerPage)} catch (e) {console.error(e)}
      // expect(rendered.result.current.feed.length).toBe(postsPerPage)
      // // the first page should only give 1 sub because it renders before the other subs are loaded
      // // which means the timestamps will be 100, 99, 98, etc
      // // console.log(rendered.result.current.feed)
      // expect(rendered.result.current.feed[0].timestamp).toBe(100)
      // expect(rendered.result.current.feed[1].timestamp).toBe(99)
      // expect(rendered.result.current.feed[2].timestamp).toBe(98)
      // expect(rendered.result.current.feed[0].subplebbitAddress).toBe('subplebbit address 1')
      // expect(rendered.result.current.feed[1].subplebbitAddress).toBe('subplebbit address 1')
      // expect(rendered.result.current.feed[2].subplebbitAddress).toBe('subplebbit address 1')

      // act(() => {
      //   rendered.result.current.loadMore()
      // })
      // try {await rendered.waitFor(() => rendered.result.current.feed.length === postsPerPage * 2)} catch (e) {console.error(e)}
      // // console.log(rendered.result.current.feed)
      // // the first post of the second page should the newest post from sub 2 or 3
      // // which have a timestamp of 100
      // // console.log(rendered.result.current.feed)
      // expect(rendered.result.current.feed[postsPerPage].timestamp).toBe(100)
      // expect(rendered.result.current.feed[postsPerPage].subplebbitAddress).toMatch(/subplebbit address (2|3)/)

      // // mock new subplebbit page to get comment cids and timestamps starting with 100 instead of 0
      // Subplebbit.prototype.sortedPostsIndexToGet = (index) => index + 100

      // // get new feed pages until a new getSortedPosts is called
      // let getSortedPostsCalled = false
      // const getSortedPosts = Subplebbit.prototype.getSortedPosts
      // Subplebbit.prototype.getSortedPosts = function (sortedPostsCid) {
      //   getSortedPostsCalled = true
      //   return getSortedPosts(sortedPostsCid)
      // }

      // // scroll until subplebbits need to fetch a new page
      // let page = 3
      // while (true) {
      //   if (getSortedPostsCalled) {
      //     break
      //   }
      //   // scroll
      //   act(() => {rendered.result.current.loadMore()})
      //   try {await rendered.waitFor(() => rendered.result.current.feed?.length >= postsPerPage * page)} catch (e) {console.error(e)}
      //   page++
      // }
      // for (const post of rendered.result.current.feed) {
      //   console.log(post)
      // }
      // console.log(rendered.result.current.feed.length)
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
