import { act, renderHook } from '@testing-library/react-hooks'
import testUtils from '../lib/test-utils'
import { useFeed, useBufferedFeeds, useAccountsActions } from '../index'
import PlebbitProvider from '../providers/plebbit-provider'
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

  describe('get feed', () => {
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
      try {await rendered.waitForNextUpdate()} catch (e) {console.error('feeds: get feed: beforeEach: rendered.waitForNextUpdate() failed:', e)}
    })

    afterEach(async () => {
      await deleteDatabases()
    })

    test('get feed with no arguments', async () => {
      expect(rendered.result.current.feed).toBe(undefined)
      expect(typeof rendered.result.current.hasMore).toBe('boolean')
      expect(typeof rendered.result.current.loadMore).toBe('function')
    })

    test('get feed page 1 with 1 subplebbit sorted by default (hot)', async () => {
      // get feed with 1 sub
      rendered.rerender({subplebbitAddresses: ['subplebbit address 1']})
      // initial state
      expect(typeof rendered.result.current.hasMore).toBe('boolean')
      expect(typeof rendered.result.current.loadMore).toBe('function')

      // wait for feed array to render
      try {await rendered.waitFor(() => Array.isArray(rendered.result.current.feed))} catch (e) {console.error(e)}
      expect(rendered.result.current.feed).toEqual([])

      // wait for posts to be added, should get full first page
      try {await rendered.waitFor(() => rendered.result.current.feed.length > 0)} catch (e) {console.error(e)}
      // NOTE: the 'hot' sort type uses timestamps and bugs out with timestamp '1-100' so this is why we get cid 1
      // with low upvote count first
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
      // wait for posts to be added, should get full first page
      try {await rendered.waitFor(() => rendered.result.current.feed.length > 0)} catch (e) {console.error(e)}

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
      expect(rendered.result.current.feed.length).toBe(postsPerPage)
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

    // getting feeds with multiple subs in them sometimes gets them in the wrong order because
    // of react renders concurrency so retry a few times if it fails
    describe('retry on fail', () => {
      beforeAll(() => {jest.retryTimes(3)})
      afterAll(() => {jest.retryTimes(0)})
      test('get feed page 1 and 2 with multiple subplebbits sorted by topAll', async () => {
        // use buffered feeds to be able to wait until the buffered feeds have updated before loading page 2
        rendered = renderHook<any, any>((props: any) => {
          const feed = useFeed(props?.subplebbitAddresses, props?.sortType, props?.accountName)
          const bufferedFeeds = useBufferedFeeds([{subplebbitAddresses: props?.subplebbitAddresses, sortType: props?.sortType}], props?.accountName)
          return {...feed, bufferedFeed: bufferedFeeds[0]}
        }, { wrapper: PlebbitProvider })

        // get feed with 1 sub
        rendered.rerender({subplebbitAddresses: ['subplebbit address 1', 'subplebbit address 2', 'subplebbit address 3'], sortType: 'topAll'})
        // initial state
        expect(typeof rendered.result.current.hasMore).toBe('boolean')
        expect(typeof rendered.result.current.loadMore).toBe('function')

        // wait for feed array to render
        try {await rendered.waitFor(() => Array.isArray(rendered.result.current.feed))} catch (e) {console.error(e)}
        expect(rendered.result.current.feed).toEqual([])

        // wait for posts to be added, should get full first page
        // the first page should only have subplebbit 1 since it loads immediately after loading 1 sub
        try {await rendered.waitFor(() => rendered.result.current.feed.length > 0)} catch (e) {console.error(e)}
        expect(rendered.result.current.feed.length).toBe(postsPerPage)
        expect(rendered.result.current.feed[0].cid).toBe('subplebbit address 1 sorted posts cid topAll comment cid 100')
        expect(rendered.result.current.feed[1].cid).toBe('subplebbit address 1 sorted posts cid topAll comment cid 99')
        expect(rendered.result.current.feed[2].cid).toBe('subplebbit address 1 sorted posts cid topAll comment cid 98')
        expect(rendered.result.current.feed[0].upvoteCount).toBe(100)
        expect(rendered.result.current.feed[1].upvoteCount).toBe(99)
        expect(rendered.result.current.feed[2].upvoteCount).toBe(98)

        // wait until buffered feeds have sub 2 and 3 loaded
        let bufferedFeedString
        try {await rendered.waitFor(() => {
          bufferedFeedString = JSON.stringify(rendered.result.current.bufferedFeed)
          return Boolean(bufferedFeedString.match('subplebbit address 2') && bufferedFeedString.match('subplebbit address 3'))
        })} catch (e) {console.error(e)}
        expect(bufferedFeedString).toMatch('subplebbit address 2')
        expect(bufferedFeedString).toMatch('subplebbit address 3')

        // the second page first posts should be sub 2 and 3 with the highest upvotes
        await scrollOnePage()
        expect(rendered.result.current.feed[postsPerPage].cid).toMatch(/subplebbit address (2|3) sorted posts cid topAll comment cid 100/)
        expect(rendered.result.current.feed[postsPerPage+1].cid).toMatch(/subplebbit address (2|3) sorted posts cid topAll comment cid 100/)
        expect(rendered.result.current.feed[postsPerPage].upvoteCount).toBe(100)
        expect(rendered.result.current.feed[postsPerPage+1].upvoteCount).toBe(100)
      })
    })

    test(`useBufferedFeeds can fetch multiple subs in the background before delivering the first page`, async () => {
      const rendered = renderHook<any, any>(() => 
        useBufferedFeeds([
          {subplebbitAddresses: ['subplebbit address 1', 'subplebbit address 2', 'subplebbit address 3'], sortType: 'new'},
          {subplebbitAddresses: ['subplebbit address 4', 'subplebbit address 5', 'subplebbit address 6'], sortType: 'topAll'},
          {subplebbitAddresses: ['subplebbit address 7', 'subplebbit address 8', 'subplebbit address 9']}
        ]), { wrapper: PlebbitProvider })

      // should get empty arrays after 1 render
      try {await rendered.waitForNextUpdate()} catch (e) {console.error(e)}
      expect(rendered.result.current).toEqual([[],[],[]])

      // should eventually buffer posts for all feeds
      try {await rendered.waitFor(() => rendered.result.current[0].length > 299
        && rendered.result.current[1].length > 299
        && rendered.result.current[2].length > 299
      )} catch (e) {console.error(e)}
      expect(rendered.result.current[0].length).toBeGreaterThan(299)
      expect(rendered.result.current[1].length).toBeGreaterThan(299)
      expect(rendered.result.current[2].length).toBeGreaterThan(299)
    })

    test('get feed using a different account', async () => {
      rendered = renderHook<any, any>((props: any) => {
        const feed = useFeed(props?.subplebbitAddresses, props?.sortType, props?.accountName)
        const { createAccount } = useAccountsActions()
        return {...feed, createAccount}
      }, { wrapper: PlebbitProvider })

      // wait for createAccount to render
      expect(rendered.result.current.createAccount).toBe(undefined)
      try {await rendered.waitForNextUpdate()} catch (e) {console.error(e)}
      expect(typeof rendered.result.current.createAccount).toBe('function')

      // create account
      await act(async () => {
        await rendered.result.current.createAccount('custom name')
      })

      rendered.rerender({subplebbitAddresses: ['subplebbit address 1'], sortType: 'new', accountName: 'custom name'})
      expect(typeof rendered.result.current.hasMore).toBe('boolean')
      expect(typeof rendered.result.current.loadMore).toBe('function')

      // wait for feed array to render
      try {await rendered.waitFor(() => Array.isArray(rendered.result.current.feed))} catch (e) {console.error(e)}
      expect(rendered.result.current.feed).toEqual([])

      // wait for posts to be added, should get full first page
      try {await rendered.waitFor(() => rendered.result.current.feed.length > 0)} catch (e) {console.error(e)}
      expect(typeof rendered.result.current.feed[0].cid).toBe('string')
      expect(rendered.result.current.feed.length).toBe(postsPerPage)
    })

    test(`fail to get feed sorted by sort type that doesn't exist`, async () => {
      rendered.rerender({subplebbitAddresses: ['subplebbit address 1', 'subplebbit address 2', 'subplebbit address 3'], sortType: `doesnt exist`})
      expect(rendered.result.error?.message).toMatch(`invalid feed sort type 'doesnt exist'`)

      // one of the buffered feed has a sort type that doesn't exist
      rendered = renderHook<any, any>(() => 
        useBufferedFeeds([
          {subplebbitAddresses: ['subplebbit address 1', 'subplebbit address 2', 'subplebbit address 3'], sortType: 'new'},
          {subplebbitAddresses: ['subplebbit address 4', 'subplebbit address 5', 'subplebbit address 6'], sortType: `doesnt exist`},
          {subplebbitAddresses: ['subplebbit address 7', 'subplebbit address 8', 'subplebbit address 9']}
        ]), { wrapper: PlebbitProvider })
      try {await rendered.waitForNextUpdate()} catch (e) {console.error(e)}
      expect(rendered.result.error?.message).toMatch(`invalid feed sort type 'doesnt exist'`)
    })

    describe('getSortedPosts only has 1 page', () => {
      const getSortedPosts = Subplebbit.prototype.getSortedPosts
      beforeEach(() => {
        // mock getSortedPosts to only give 1 or 2 pages
        Subplebbit.prototype.getSortedPosts = async function (sortedPostsCid: string) {
          // without the extra simulated load time the hooks will fetch multiple pages in advance instead of just 1
          await simulateLoadingTime()
          await simulateLoadingTime()
          const sortedComments: any = {nextSortedCommentsCid: null, comments: []}
          const postCount = 100
          let index = 0
          while (index++ < postCount) {
            sortedComments.comments.push({timestamp: index, cid: sortedPostsCid + ' comment cid ' + index, subplebbitAddress: this.address})
          }
          return sortedComments
        }
      })
      afterEach(() => {
        Subplebbit.prototype.getSortedPosts = getSortedPosts
      })
      test(`1 subplebbit, scroll to end of feed, hasMore becomes false`, async () => {
        rendered.rerender({subplebbitAddresses: ['subplebbit address 1'], sortType: 'new'})
        // hasMore should be true before the feed is loaded
        expect(rendered.result.current.hasMore).toBe(true)
        expect(typeof rendered.result.current.loadMore).toBe('function')

        // wait for feed array to render
        try {await rendered.waitFor(() => Array.isArray(rendered.result.current.feed))} catch (e) {console.error(e)}
        expect(rendered.result.current.feed).toEqual([])
        // hasMore should be true before the feed is loaded
        expect(rendered.result.current.hasMore).toBe(true)

        try {await rendered.waitFor(() => rendered.result.current.feed.length > 0)} catch (e) {console.error(e)}
        // hasMore should be true because there are still buffered feeds
        expect(rendered.result.current.hasMore).toBe(true)
        expect(rendered.result.current.feed.length).toBe(postsPerPage)

        await scrollOnePage()
        // hasMore should be true because there are still buffered feeds
        expect(rendered.result.current.hasMore).toBe(true)
        expect(rendered.result.current.feed.length).toBe(postsPerPage * 2)

        await scrollOnePage()
        // hasMore should be true because there are still buffered feeds
        expect(rendered.result.current.hasMore).toBe(true)
        expect(rendered.result.current.feed.length).toBe(postsPerPage * 3)

        await scrollOnePage()
        // there are no bufferedFeed and pages left so hasMore should be false
        expect(rendered.result.current.hasMore).toBe(false)
        expect(rendered.result.current.feed.length).toBe(postsPerPage * 4)
      })

      test(`multiple subplebbits, scroll to end of feed, hasMore becomes false`, async () => {
        rendered.rerender({subplebbitAddresses: ['subplebbit address 1', 'subplebbit address 2', 'subplebbit address 3'], sortType: 'new'})
        // hasMore should be true before the feed is loaded
        expect(rendered.result.current.hasMore).toBe(true)
        expect(typeof rendered.result.current.loadMore).toBe('function')

        // wait for feed array to render
        try {await rendered.waitFor(() => Array.isArray(rendered.result.current.feed))} catch (e) {console.error(e)}
        expect(rendered.result.current.feed).toEqual([])
        // hasMore should be true before the feed is loaded
        expect(rendered.result.current.hasMore).toBe(true)

        try {await rendered.waitFor(() => rendered.result.current.feed.length > 0)} catch (e) {console.error(e)}
        // hasMore should be true because there are still buffered feeds
        expect(rendered.result.current.hasMore).toBe(true)
        expect(rendered.result.current.feed.length).toBe(postsPerPage)

        await scrollOnePage()
        // hasMore should be true because there are still buffered feeds
        expect(rendered.result.current.hasMore).toBe(true)
        expect(rendered.result.current.feed.length).toBe(postsPerPage * 2)

        // scroll to end of all pages
        await scrollOnePage()
        await scrollOnePage()
        await scrollOnePage()
        await scrollOnePage()
        await scrollOnePage()
        await scrollOnePage()
        expect(rendered.result.current.hasMore).toBe(true)
        expect(rendered.result.current.feed.length).toBe(postsPerPage * 8)
        await scrollOnePage()
        await scrollOnePage()
        await scrollOnePage()
        await scrollOnePage()
        // there are no bufferedFeed and pages left so hasMore should be false
        expect(rendered.result.current.hasMore).toBe(false)
        expect(rendered.result.current.feed.length).toBe(postsPerPage * 12)
      })

      test(`don't increment page number if loaded feed hasn't increased yet`, async () => {
        rendered.rerender({subplebbitAddresses: ['subplebbit address 1']})
        try {await rendered.waitFor(() => rendered.result.current.feed.length > 0)} catch (e) {console.error(e)}
        expect(rendered.result.current.feed.length).toBe(postsPerPage)
        expect(typeof rendered.result.current.loadMore).toBe('function')
        await act(async () => {
          // should have an error here because we load a page before the previous one finishes loading
          // use a large loop to try to catch the error because depending on timing it doesn't always trigger
          await expect(async () => {
            let attempts = 10000
            while(attempts) {
              await simulateLoadingTime()
              rendered.result.current.loadMore()
              rendered.result.current.loadMore()
              rendered.result.current.loadMore()
            }
          }).rejects.toThrow('feedsActions.incrementFeedPageNumber cannot increment feed page number before current page has loaded')
        })
      })
    })

    describe('getSortedPosts never gets called', () => {
      const getSortedPosts = Subplebbit.prototype.getSortedPosts
      beforeEach(() => {
        Subplebbit.prototype.getSortedPosts = async function (sortedPostsCid: string) {
          // it can get called with a next cid to fetch the second page
          if (!sortedPostsCid.match('next')) {
            throw Error(`subplebbit.getSortedPosts() was called with argument '${sortedPostsCid}', should not get called at all on first page of sort type 'hot'`)
          }
          return {nextSortedCommentsCid: null, comments: []}
        }
      })
      afterEach(() => {
        Subplebbit.prototype.getSortedPosts = getSortedPosts
      })
      test(`get feed sorted by hot, don't call subplebbit.getSortedPosts() because already included in IPNS record`, async () => {
        rendered.rerender({subplebbitAddresses: ['subplebbit address 1'], sortType: 'hot'})
        try {await rendered.waitFor(() => rendered.result.current.feed?.length >= postsPerPage)} catch (e) {console.error(e)}
        expect(rendered.result.current.feed?.length).toBe(postsPerPage)
      })
    })

    test.todo(`subplebbit updates while we are scrolling`)

    test.todo(`store sorted posts pages in database`)

    test.todo(`don't let a malicious sub owner display older posts in top hour/day/week/month/year`)

    // already implemented but no tests for it because difficult to test
    test.todo(`subplebbits finish loading with 0 posts, hasMore becomes false, but only after finished loading`)
  })
})
