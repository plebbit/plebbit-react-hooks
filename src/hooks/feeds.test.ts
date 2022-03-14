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
        // without the extra simulated load time the hooks will fetch multiple pages in advance instead of just 1
        await simulateLoadingTime()
        const sortedComments: any = {
          nextSortedCommentsCid: this.address + ' next sorted comments cid ' + (getSortedPostsCalledTimes + 1), 
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
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].cid).toBe('subplebbit address 1 next sorted comments cid 1 comment cid 200')
      await scrollOnePage()
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].timestamp).toBe(175)
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].cid).toBe('subplebbit address 1 next sorted comments cid 1 comment cid 175')

      // scroll 2 more times to get to buffered feeds length 50 and trigger a new buffer refill
      await scrollOnePage()
      await scrollOnePage()
      try {await rendered.waitFor(() => getSortedPostsCalledTimes === 3)} catch (e) {console.error(e)}
      expect(getSortedPostsCalledTimes).toBe(3)

      // next pages should have recalculated buffered feed that starts at 300
      await scrollOnePage()
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].timestamp).toBe(300)
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].cid).toBe('subplebbit address 1 next sorted comments cid 2 comment cid 300')
      await scrollOnePage()
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].timestamp).toBe(275)
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].cid).toBe('subplebbit address 1 next sorted comments cid 2 comment cid 275')

      // restore mock
      Subplebbit.prototype.getSortedPosts = getSortedPosts
    })

    test('get multiple subplebbits sorted by new and scroll to multiple pages', async () => {
      const getSortedPostsCalledTimes =  {
        'subplebbit address 1': 0, 'subplebbit address 2': 0, 'subplebbit address 3': 0
      }
      const getSortedPosts = Subplebbit.prototype.getSortedPosts
      Subplebbit.prototype.getSortedPosts = async function (sortedPostsCid: string) {
        // without the extra simulated load time the hooks will fetch multiple pages in advance instead of just 1
        await simulateLoadingTime()
        await simulateLoadingTime()
        const sortedComments: any = {
          // @ts-ignore
          nextSortedCommentsCid: this.address + ' next sorted comments cid ' + (getSortedPostsCalledTimes[this.address] + 1), 
          comments: []
        }
        const postCount = 100
        let index = 0
         // @ts-ignore
        let commentStartIndex = getSortedPostsCalledTimes[this.address] * postCount
        while (index++ < postCount) {
          sortedComments.comments.push({
            timestamp: commentStartIndex + index,
            cid: sortedPostsCid + ' comment cid ' + (commentStartIndex + index), 
            subplebbitAddress: this.address
          })
        }
        // @ts-ignore
        getSortedPostsCalledTimes[this.address]++
        return sortedComments
      }

      // get feed with 3 sub sorted by new page 1
      // the first page will only have posts from the very first sub fetched, sub 1
      rendered.rerender({subplebbitAddresses: ['subplebbit address 1', 'subplebbit address 2', 'subplebbit address 3'], sortType: 'new'})
      try {await rendered.waitFor(() => rendered.result.current.feed?.length >= postsPerPage)} catch (e) {console.error(e)}
      expect(rendered.result.current.feed[0].timestamp).toBe(100)
      expect(rendered.result.current.feed[1].timestamp).toBe(99)
      expect(rendered.result.current.feed[2].timestamp).toBe(98)
      expect(rendered.result.current.feed[0].cid).toBe('subplebbit address 1 sorted posts cid new comment cid 100')
      expect(rendered.result.current.feed[1].cid).toBe('subplebbit address 1 sorted posts cid new comment cid 99')
      expect(rendered.result.current.feed[2].cid).toBe('subplebbit address 1 sorted posts cid new comment cid 98')

      // at this point the buffered feed has gotten page 1 from all subs
      try {await rendered.waitFor(() => getSortedPostsCalledTimes['subplebbit address 1'] === 1
        && getSortedPostsCalledTimes['subplebbit address 2'] === 1
        && getSortedPostsCalledTimes['subplebbit address 3'] === 1
      )} catch (e) {console.error(e)}
      expect(getSortedPostsCalledTimes['subplebbit address 1']).toBe(1)
      expect(getSortedPostsCalledTimes['subplebbit address 2']).toBe(1)
      expect(getSortedPostsCalledTimes['subplebbit address 3']).toBe(1)

      // get page 2, the first posts of page 2 should be sub 1 and 2's cid 100
      await scrollOnePage()
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].timestamp).toBe(100)
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage + 1].timestamp).toBe(100)
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].cid).toBe('subplebbit address 2 sorted posts cid new comment cid 100')
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage + 1].cid).toBe('subplebbit address 3 sorted posts cid new comment cid 100')

      // scroll until the next buffered feed that needs to be refilled
      await scrollOnePage()
      await scrollOnePage()
      await scrollOnePage()
      await scrollOnePage()
      // at this point the buffered feed has gotten page 2 from all subs
      try {await rendered.waitFor(() => getSortedPostsCalledTimes['subplebbit address 1'] === 2
        && getSortedPostsCalledTimes['subplebbit address 2'] === 2
        && getSortedPostsCalledTimes['subplebbit address 3'] === 2
      )} catch (e) {console.error(e)}
      expect(getSortedPostsCalledTimes['subplebbit address 1']).toBe(2)
      expect(getSortedPostsCalledTimes['subplebbit address 2']).toBe(2)
      expect(getSortedPostsCalledTimes['subplebbit address 3']).toBe(2)

      // get next page, the first posts should all be cids 200 from the buffered feed
      await scrollOnePage()
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].timestamp).toBe(200)
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage + 1].timestamp).toBe(200)
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage + 2].timestamp).toBe(200)
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].cid).toBe('subplebbit address 1 next sorted comments cid 1 comment cid 200')
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage + 1].cid).toBe('subplebbit address 2 next sorted comments cid 1 comment cid 200')
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage + 2].cid).toBe('subplebbit address 3 next sorted comments cid 1 comment cid 200')

      // restore mock
      Subplebbit.prototype.getSortedPosts = getSortedPosts
    })

    test.todo('get multiple subplebbits sorted by top')
    test.todo('get multiple subplebbits sorted by topDay')
    test.todo('get multiple subplebbits sorted by hot')
    test.todo('get multiple subplebbits sorted by controversial')

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
