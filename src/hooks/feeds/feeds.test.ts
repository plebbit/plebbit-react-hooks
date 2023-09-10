import {act, renderHook} from '@testing-library/react-hooks'
import testUtils from '../../lib/test-utils'
import {Comment} from '../../types'
import {useFeed, useBufferedFeeds, useAccount, useSubplebbit, setPlebbitJs} from '../..'
import * as accountsActions from '../../stores/accounts/accounts-actions'
import localForageLru from '../../lib/localforage-lru'
import localForage from 'localforage'
import feedsStore, {defaultPostsPerPage as postsPerPage} from '../../stores/feeds'
import PlebbitJsMock, {Plebbit, Subplebbit, Pages, simulateLoadingTime} from '../../lib/plebbit-js/plebbit-js-mock'
setPlebbitJs(PlebbitJsMock)

describe('feeds', () => {
  beforeAll(() => {
    testUtils.silenceReactWarnings()
  })
  afterAll(() => {
    testUtils.restoreAll()
  })

  describe('get feed', () => {
    let rendered: any, waitFor: any

    const scrollOnePage = async () => {
      const nextFeedLength = (rendered.result.current.feed?.length || 0) + postsPerPage
      await act(async () => {
        await rendered.result.current.loadMore()
      })

      try {
        await rendered.waitFor(() => rendered.result.current.feed?.length >= nextFeedLength)
      } catch (e) {
        // console.error('scrollOnePage failed:', e)
      }
    }

    beforeEach(async () => {
      // @ts-ignore
      rendered = renderHook<any, any>((props: any) => useFeed(props))
      waitFor = testUtils.createWaitFor(rendered)
    })

    afterEach(async () => {
      await testUtils.resetDatabasesAndStores()
    })

    test('get feed with no arguments', async () => {
      expect(rendered.result.current.feed).toEqual([])
      expect(typeof rendered.result.current.hasMore).toBe('boolean')
      expect(rendered.result.current.hasMore).toBe(false)
      expect(typeof rendered.result.current.loadMore).toBe('function')
    })

    test('not yet loaded feed hasMore true', async () => {
      expect(rendered.result.current.hasMore).toBe(false)
      rendered.rerender({subplebbitAddresses: ['subplebbit address 1']})
      expect(rendered.result.current.hasMore).toBe(true)
    })

    test('get feed page 1 with 1 subplebbit sorted by default (hot)', async () => {
      // get feed with 1 sub
      rendered.rerender({subplebbitAddresses: ['subplebbit address 1']})
      // initial state
      expect(typeof rendered.result.current.hasMore).toBe('boolean')
      expect(typeof rendered.result.current.loadMore).toBe('function')

      // wait for feed array to render
      await waitFor(() => Array.isArray(rendered.result.current.feed))
      expect(rendered.result.current.feed).toEqual([])

      // wait for posts to be added, should get full first page
      await waitFor(() => rendered.result.current.feed.length > 0)
      // NOTE: the 'hot' sort type uses timestamps and bugs out with timestamp '1-100' so this is why we get cid 1
      // with low upvote count first
      expect(rendered.result.current.feed[0].cid).toBe('subplebbit address 1 page cid hot comment cid 1')
      expect(rendered.result.current.feed.length).toBe(postsPerPage)

      // reset stores to force using the db
      await testUtils.resetStores()

      // get feed again from database, only wait for 1 render because subplebbit is stored in db
      const rendered2 = renderHook<any, any>(() => useFeed({subplebbitAddresses: ['subplebbit address 1']}))
      expect(rendered2.result.current.feed).toEqual([])

      // only wait for 1 render because subplebbit is stored in db
      await waitFor(() => rendered2.result.current.feed[0].cid)
      expect(rendered2.result.current.feed[0].cid).toBe('subplebbit address 1 page cid hot comment cid 1')
      expect(rendered2.result.current.feed.length).toBe(postsPerPage)
    })

    test('get feed with custom posts per page', async () => {
      const customPostsPerPage = 10
      rendered.rerender({subplebbitAddresses: ['subplebbit address 1'], postsPerPage: customPostsPerPage})

      // wait for feed array to render
      await waitFor(() => Array.isArray(rendered.result.current.feed))
      expect(rendered.result.current.feed).toEqual([])

      // wait for posts to be added, should get full first page
      await waitFor(() => rendered.result.current.feed.length > 0)
      expect(rendered.result.current.feed.length).toBe(customPostsPerPage)

      // load page 2
      await act(async () => {
        await rendered.result.current.loadMore()
      })
      await waitFor(() => rendered.result.current.feed.length === customPostsPerPage * 2)
      expect(rendered.result.current.feed.length).toBe(customPostsPerPage * 2)
    })

    test('change subplebbit addresses and sort type', async () => {
      rendered.rerender({subplebbitAddresses: ['subplebbit address 1'], sortType: 'hot'})
      await waitFor(() => !!rendered.result.current.feed[0].cid.match(/subplebbit address 1/))
      expect(rendered.result.current.feed[0].cid).toMatch(/subplebbit address 1/)
      expect(rendered.result.current.feed.length).toBe(postsPerPage)

      // change subplebbit addresses
      rendered.rerender({subplebbitAddresses: ['subplebbit address 2', 'subplebbit address 3'], sortType: 'hot'})
      await waitFor(() => !!rendered.result.current.feed[0].cid.match(/subplebbit address (2|3)/))

      expect(rendered.result.current.feed[0].cid).toMatch(/subplebbit address (2|3)/)
      // the 'hot' sort type should give timestamp 1 with the current mock
      expect(rendered.result.current.feed[0].timestamp).toBe(1)
      expect(rendered.result.current.feed.length).toBe(postsPerPage)

      // change sort type
      rendered.rerender({subplebbitAddresses: ['subplebbit address 2', 'subplebbit address 3'], sortType: 'new'})
      await waitFor(() => !!rendered.result.current.feed[0].cid.match(/subplebbit address (2|3)/))

      expect(rendered.result.current.feed[0].cid).toMatch(/subplebbit address (2|3)/)
      // the 'new' sort type should give timestamp higher than 99 with the current mock
      expect(rendered.result.current.feed[0].timestamp).toBeGreaterThan(99)
      expect(rendered.result.current.feed.length).toBe(postsPerPage)

      // change subplebbit addresses and sort type
      rendered.rerender({subplebbitAddresses: ['subplebbit address 4', 'subplebbit address 5'], sortType: 'topAll'})
      await waitFor(() => !!rendered.result.current.feed[0].cid.match(/subplebbit address (4|5)/))

      expect(rendered.result.current.feed[0].cid).toMatch(/subplebbit address (4|5)/)
      expect(rendered.result.current.feed.length).toBe(postsPerPage)

      // change sort type active
      rendered.rerender({subplebbitAddresses: ['subplebbit address 2', 'subplebbit address 3'], sortType: 'active'})
      await waitFor(() => !!rendered.result.current.feed[0].cid.match(/subplebbit address (2|3)/))

      expect(rendered.result.current.feed[0].cid).toMatch(/subplebbit address (2|3)/)
      // the 'new' sort type should give timestamp higher than 99 with the current mock
      expect(rendered.result.current.feed[0].timestamp).toBeGreaterThan(99)
      expect(rendered.result.current.feed.length).toBe(postsPerPage)
    })

    test('get feed with 1 subplebbit and scroll to multiple pages', async () => {
      // get feed with 1 sub
      rendered.rerender({subplebbitAddresses: ['subplebbit address 1']})
      // wait for posts to be added, should get full first page
      await waitFor(() => rendered.result.current.feed.length > 0)

      let pages = 20
      let currentPage = 1
      while (currentPage++ < pages) {
        // load 25 more posts
        await act(async () => {
          await rendered.result.current.loadMore()
        })
        await waitFor(() => rendered.result.current.feed?.length >= postsPerPage * currentPage)
        expect(rendered.result.current.feed.length).toBe(postsPerPage * currentPage)
      }
    })

    test('get feed with 1 subplebbit sorted by new and scroll to multiple pages', async () => {
      let getPageCalledTimes = 0
      const getPage = Pages.prototype.getPage
      Pages.prototype.getPage = async function (pageCid: string) {
        // without the extra simulated load time the hooks will fetch multiple pages in advance instead of just 1
        await simulateLoadingTime()
        const page: any = {
          nextCid: this.subplebbit.address + ' next page cid ' + (getPageCalledTimes + 1),
          comments: [],
        }
        const postCount = 100
        let index = 0
        let commentStartIndex = getPageCalledTimes * postCount
        while (index++ < postCount) {
          page.comments.push({
            timestamp: commentStartIndex + index,
            cid: pageCid + ' comment cid ' + (commentStartIndex + index),
            subplebbitAddress: this.subplebbit.address,
          })
        }
        getPageCalledTimes++
        return page
      }

      // get feed with 1 sub sorted by new page 1
      rendered.rerender({subplebbitAddresses: ['subplebbit address 1'], sortType: 'new'})
      await waitFor(() => rendered.result.current.feed?.length >= postsPerPage)

      expect(rendered.result.current.feed[0].timestamp).toBe(100)
      expect(rendered.result.current.feed[1].timestamp).toBe(99)
      expect(rendered.result.current.feed[2].timestamp).toBe(98)
      expect(rendered.result.current.feed[0].cid).toBe('subplebbit address 1 page cid new comment cid 100')
      expect(rendered.result.current.feed[1].cid).toBe('subplebbit address 1 page cid new comment cid 99')
      expect(rendered.result.current.feed[2].cid).toBe('subplebbit address 1 page cid new comment cid 98')

      // at this point the buffered feed has gotten 1 subplebbit page
      expect(getPageCalledTimes).toBe(1)

      // get page 2
      await scrollOnePage()
      expect(rendered.result.current.feed[postsPerPage].timestamp).toBe(75)
      expect(rendered.result.current.feed[postsPerPage].cid).toBe('subplebbit address 1 page cid new comment cid 75')

      // ad this point the buffered feed is length 50, we can wait for getPage to be called again
      // refill the buffer
      await waitFor(() => getPageCalledTimes === 2)

      expect(getPageCalledTimes).toBe(2)

      // get page 3 and 4, it should show new posts from the recalculated buffer
      await scrollOnePage()
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].timestamp).toBe(200)
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].cid).toBe('subplebbit address 1 next page cid 1 comment cid 200')
      await scrollOnePage()
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].timestamp).toBe(175)
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].cid).toBe('subplebbit address 1 next page cid 1 comment cid 175')

      // scroll 2 more times to get to buffered feeds length 50 and trigger a new buffer refill
      await scrollOnePage()
      await scrollOnePage()

      await waitFor(() => getPageCalledTimes === 3)
      expect(getPageCalledTimes).toBe(3)

      // next pages should have recalculated buffered feed that starts at 300
      await scrollOnePage()
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].timestamp).toBe(300)
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].cid).toBe('subplebbit address 1 next page cid 2 comment cid 300')
      await scrollOnePage()
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].timestamp).toBe(275)
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].cid).toBe('subplebbit address 1 next page cid 2 comment cid 275')

      // restore mock
      Pages.prototype.getPage = getPage
    })

    test('get multiple subplebbits sorted by new and scroll to multiple pages', async () => {
      const getPageCalledTimes = {
        'subplebbit address 1': 0,
        'subplebbit address 2': 0,
        'subplebbit address 3': 0,
      }
      const getPage = Pages.prototype.getPage
      Pages.prototype.getPage = async function (pageCid: string) {
        // without the extra simulated load time the hooks will fetch multiple pages in advance instead of just 1
        await simulateLoadingTime()
        await simulateLoadingTime()
        const page: any = {
          // @ts-ignore
          nextCid: this.subplebbit.address + ' next page cid ' + (getPageCalledTimes[this.subplebbit.address] + 1),
          comments: [],
        }
        const postCount = 100
        let index = 0
        // @ts-ignore
        let commentStartIndex = getPageCalledTimes[this.subplebbit.address] * postCount
        while (index++ < postCount) {
          page.comments.push({
            timestamp: commentStartIndex + index,
            cid: pageCid + ' comment cid ' + (commentStartIndex + index),
            subplebbitAddress: this.subplebbit.address,
          })
        }
        // @ts-ignore
        getPageCalledTimes[this.subplebbit.address]++
        return page
      }

      // get feed with 3 sub sorted by new page 1
      rendered.rerender({
        subplebbitAddresses: ['subplebbit address 1', 'subplebbit address 2', 'subplebbit address 3'],
        sortType: 'new',
      })
      await waitFor(() => rendered.result.current.feed?.length >= postsPerPage)

      expect(rendered.result.current.feed.length).toBe(postsPerPage)
      expect(rendered.result.current.feed[0].timestamp).toBe(100)
      expect(rendered.result.current.feed[1].timestamp).toBe(100)
      expect(rendered.result.current.feed[2].timestamp).toBe(100)
      expect(rendered.result.current.feed[0].cid).toBe('subplebbit address 1 page cid new comment cid 100')
      expect(rendered.result.current.feed[1].cid).toBe('subplebbit address 2 page cid new comment cid 100')
      expect(rendered.result.current.feed[2].cid).toBe('subplebbit address 3 page cid new comment cid 100')

      // at this point the buffered feed has gotten page 1 from all subs
      await waitFor(
        () => getPageCalledTimes['subplebbit address 1'] === 1 && getPageCalledTimes['subplebbit address 2'] === 1 && getPageCalledTimes['subplebbit address 3'] === 1
      )

      expect(getPageCalledTimes['subplebbit address 1']).toBe(1)
      expect(getPageCalledTimes['subplebbit address 2']).toBe(1)
      expect(getPageCalledTimes['subplebbit address 3']).toBe(1)

      // get page 2, the first posts of page 2
      await scrollOnePage()
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].timestamp).toBe(92)
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage + 1].timestamp).toBe(92)
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].cid).toBe('subplebbit address 2 page cid new comment cid 92')
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage + 1].cid).toBe('subplebbit address 3 page cid new comment cid 92')

      // scroll until the next buffered feed that needs to be refilled
      await scrollOnePage()
      await scrollOnePage()
      await scrollOnePage()
      await scrollOnePage()

      // at this point the buffered feed has gotten page 2 from all subs
      await waitFor(
        () => getPageCalledTimes['subplebbit address 1'] === 2 && getPageCalledTimes['subplebbit address 2'] === 2 && getPageCalledTimes['subplebbit address 3'] === 2
      )
      expect(getPageCalledTimes['subplebbit address 1']).toBe(2)
      expect(getPageCalledTimes['subplebbit address 2']).toBe(2)
      expect(getPageCalledTimes['subplebbit address 3']).toBe(2)

      // get next page, the first posts should all be cids 200 from the buffered feed
      await scrollOnePage()
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].timestamp).toBe(200)
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage + 1].timestamp).toBe(200)
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage + 2].timestamp).toBe(200)
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].cid).toBe('subplebbit address 1 next page cid 1 comment cid 200')
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage + 1].cid).toBe('subplebbit address 2 next page cid 1 comment cid 200')
      expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage + 2].cid).toBe('subplebbit address 3 next page cid 1 comment cid 200')

      // restore mock
      Pages.prototype.getPage = getPage
    })

    test('get multiple subplebbits with filter and scroll to multiple pages', async () => {
      // filter only comment cids that contain a '5'
      const filter = (comment: Comment) => !!comment.cid.match('5')
      rendered.rerender({
        subplebbitAddresses: ['subplebbit address 1', 'subplebbit address 2', 'subplebbit address 3'],
        filter,
      })
      await waitFor(() => rendered.result.current.feed?.length >= postsPerPage)

      expect(rendered.result.current.feed.length).toBe(postsPerPage)
      expect(rendered.result.current.feed[0].cid).toBe('subplebbit address 1 page cid hot comment cid 5')
      expect(rendered.result.current.feed[1].cid).toBe('subplebbit address 2 page cid hot comment cid 5')
      expect(rendered.result.current.feed[2].cid).toBe('subplebbit address 3 page cid hot comment cid 5')

      // scroll until the next buffered feed that needs to be refilled
      await scrollOnePage()
      await scrollOnePage()
      await scrollOnePage()
      await scrollOnePage()

      expect(rendered.result.current.feed.length).toBe(postsPerPage * 5)
      for (const post of rendered.result.current.feed) {
        expect(filter(post)).toBe(true)
      }

      // make sure adding a new filter function creates a new feed (if the function isn't the same function)
      expect(Object.keys(feedsStore.getState().feedsOptions).length).toBe(1)
      const filter2 = (comment: Comment) => !!comment.cid.match('5')
      rendered.rerender({
        subplebbitAddresses: ['subplebbit address 1', 'subplebbit address 2', 'subplebbit address 3'],
        filter: filter2,
      })
      expect(Object.keys(feedsStore.getState().feedsOptions).length).toBe(2)

      // make sure adding the same filter functiom doesnt create a new feed
      rendered.rerender({
        subplebbitAddresses: ['subplebbit address 1', 'subplebbit address 2', 'subplebbit address 3'],
        filter,
      })
      expect(Object.keys(feedsStore.getState().feedsOptions).length).toBe(2)
    })

    test('get feed page 1 and 2 with multiple subplebbits sorted by topAll', async () => {
      // use buffered feeds to be able to wait until the buffered feeds have updated before loading page 2
      rendered = renderHook<any, any>((props: any) => {
        const feed = useFeed(props)
        const {bufferedFeeds} = useBufferedFeeds({
          feedsOptions: [{subplebbitAddresses: props?.subplebbitAddresses, sortType: props?.sortType}],
          accountName: props?.accountName,
        })
        return {...feed, bufferedFeed: bufferedFeeds[0]}
      })

      // get feed with 1 sub
      rendered.rerender({
        subplebbitAddresses: ['subplebbit address 1', 'subplebbit address 2', 'subplebbit address 3'],
        sortType: 'topAll',
      })
      // initial state
      expect(typeof rendered.result.current.hasMore).toBe('boolean')
      expect(typeof rendered.result.current.loadMore).toBe('function')

      // wait for feed array to render
      await waitFor(() => Array.isArray(rendered.result.current.feed))
      expect(rendered.result.current.feed).toEqual([])

      // wait for posts to be added, should get full first page
      await waitFor(() => rendered.result.current.feed.length > 0)
      expect(rendered.result.current.feed.length).toBe(postsPerPage)
      expect(rendered.result.current.feed[0].cid).toBe('subplebbit address 1 page cid topAll comment cid 100')
      expect(rendered.result.current.feed[1].cid).toBe('subplebbit address 2 page cid topAll comment cid 100')
      expect(rendered.result.current.feed[2].cid).toBe('subplebbit address 3 page cid topAll comment cid 100')
      expect(rendered.result.current.feed[0].upvoteCount).toBe(100)
      expect(rendered.result.current.feed[1].upvoteCount).toBe(100)
      expect(rendered.result.current.feed[2].upvoteCount).toBe(100)

      // wait until buffered feeds have sub 2 and 3 loaded
      let bufferedFeedString
      await waitFor(() => {
        bufferedFeedString = JSON.stringify(rendered.result.current.bufferedFeed)
        return Boolean(bufferedFeedString.match('subplebbit address 2') && bufferedFeedString.match('subplebbit address 3'))
      })

      expect(bufferedFeedString).toMatch('subplebbit address 2')
      expect(bufferedFeedString).toMatch('subplebbit address 3')

      // the second page first posts should be sub 2 and 3 with the highest upvotes
      await scrollOnePage()
      expect(rendered.result.current.feed[postsPerPage].cid).toMatch(/subplebbit address (2|3) page cid topAll comment cid 92/)
      expect(rendered.result.current.feed[postsPerPage + 1].cid).toMatch(/subplebbit address (2|3) page cid topAll comment cid 92/)
      expect(rendered.result.current.feed[postsPerPage].upvoteCount).toBeGreaterThan(91)
      expect(rendered.result.current.feed[postsPerPage + 1].upvoteCount).toBeGreaterThan(91)
    })

    test(`useBufferedFeeds can fetch multiple subs in the background before delivering the first page`, async () => {
      const rendered = renderHook<any, any>(() =>
        useBufferedFeeds({
          feedsOptions: [
            {
              subplebbitAddresses: ['subplebbit address 1', 'subplebbit address 2', 'subplebbit address 3'],
              sortType: 'new',
            },
            {
              subplebbitAddresses: ['subplebbit address 4', 'subplebbit address 5', 'subplebbit address 6'],
              sortType: 'topAll',
            },
            {subplebbitAddresses: ['subplebbit address 7', 'subplebbit address 8', 'subplebbit address 9']},
          ],
        })
      )

      // should get empty arrays after first render
      expect(rendered.result.current.bufferedFeeds).toEqual([[], [], []])

      // should eventually buffer posts for all feeds
      await waitFor(
        () =>
          rendered.result.current.bufferedFeeds[0].length > 299 &&
          rendered.result.current.bufferedFeeds[1].length > 299 &&
          rendered.result.current.bufferedFeeds[2].length > 299
      )

      expect(rendered.result.current.bufferedFeeds[0].length).toBeGreaterThan(299)
      expect(rendered.result.current.bufferedFeeds[1].length).toBeGreaterThan(299)
      expect(rendered.result.current.bufferedFeeds[2].length).toBeGreaterThan(299)
    })

    test('get feed using a different account', async () => {
      rendered = renderHook<any, any>((props: any) => {
        const feed = useFeed(props)
        const {createAccount} = accountsActions
        return {...feed, createAccount}
      })

      // wait for createAccount to render
      await waitFor(() => typeof rendered.result.current.createAccount === 'function')
      expect(typeof rendered.result.current.createAccount).toBe('function')

      // create account
      await act(async () => {
        await rendered.result.current.createAccount('custom name')
      })

      rendered.rerender({subplebbitAddresses: ['subplebbit address 1'], sortType: 'new', accountName: 'custom name'})
      expect(typeof rendered.result.current.hasMore).toBe('boolean')
      expect(typeof rendered.result.current.loadMore).toBe('function')

      // wait for feed array to render
      await waitFor(() => Array.isArray(rendered.result.current.feed))
      expect(rendered.result.current.feed).toEqual([])

      // wait for posts to be added, should get full first page
      await waitFor(() => rendered.result.current.feed.length > 0)
      expect(typeof rendered.result.current.feed[0].cid).toBe('string')
      expect(rendered.result.current.feed.length).toBe(postsPerPage)
    })

    test('get feed and change active account', async () => {
      const newActiveAccountName = 'new active account'
      rendered = renderHook<any, any>((props: any) => {
        const feed = useFeed(props)
        const account = useAccount()
        const [bufferedFeed] = useBufferedFeeds(props && {feedsOptions: [props], accountName: newActiveAccountName}).bufferedFeeds
        return {...feed, ...accountsActions, account, bufferedFeed}
      })
      rendered.rerender({subplebbitAddresses: ['subplebbit address 1'], sortType: 'new'})

      // wait for posts to be added, should get full first page
      await waitFor(() => rendered.result.current.feed.length > 0)
      expect(typeof rendered.result.current.feed[0].cid).toBe('string')
      expect(rendered.result.current.feed.length).toBe(postsPerPage)

      // create account and set active account
      await act(async () => {
        await rendered.result.current.createAccount(newActiveAccountName)
        await rendered.result.current.setActiveAccount(newActiveAccountName)
      })

      // wait for account change
      await waitFor(() => rendered.result.current.account.name === newActiveAccountName)
      expect(rendered.result.current.account.name).toBe(newActiveAccountName)

      // wait for buffered feed of new active account to have some posts
      await waitFor(() => rendered.result.current.bufferedFeed.length > 0)
      expect(typeof rendered.result.current.bufferedFeed[0].cid).toBe('string')
      expect(rendered.result.current.bufferedFeed.length).toBeGreaterThan(postsPerPage)

      // TODO: the test below deosn't work and not sure why, need to investigate,
      // it will probably cause critical UI bug when switching accounts

      // wait for posts to be added, should get full first page
      await waitFor(() => rendered.result.current.feed.length > 0)
      expect(typeof rendered.result.current.feed[0].cid).toBe('string')
      expect(rendered.result.current.feed.length).toBe(postsPerPage)
    })

    test(`fail to get feed sorted by sort type that doesn't exist`, async () => {
      rendered.rerender({
        subplebbitAddresses: ['subplebbit address 1', 'subplebbit address 2', 'subplebbit address 3'],
        sortType: `doesnt exist`,
      })
      expect(rendered.result.error?.message).toMatch(`useFeed sortType argument 'doesnt exist' invalid`)

      // one of the buffered feed has a sort type that doesn't exist
      const rendered2 = renderHook<any, any>(() =>
        useBufferedFeeds({
          feedsOptions: [
            {
              subplebbitAddresses: ['subplebbit address 1', 'subplebbit address 2', 'subplebbit address 3'],
              sortType: 'new',
            },
            {
              subplebbitAddresses: ['subplebbit address 4', 'subplebbit address 5', 'subplebbit address 6'],
              sortType: `doesnt exist`,
            },
            {subplebbitAddresses: ['subplebbit address 7', 'subplebbit address 8', 'subplebbit address 9']},
          ],
        })
      )

      await waitFor(() => rendered2.result.error?.message)
      expect(rendered2.result.error?.message).toMatch(`useBufferedFeeds feedOptions.sortType argument 'doesnt exist' invalid`)
    })

    describe('getPage only has 1 page', () => {
      const getPage = Pages.prototype.getPage

      beforeEach(() => {
        // mock getPage to only give 1 or 2 pages
        Pages.prototype.getPage = async function (pageCid: string) {
          // without the extra simulated load time the hooks will fetch multiple pages in advance instead of just 1
          await simulateLoadingTime()
          await simulateLoadingTime()
          const page: any = {nextCid: undefined, comments: []}
          const postCount = 100
          let index = 0
          while (index++ < postCount) {
            page.comments.push({
              timestamp: index,
              cid: pageCid + ' comment cid ' + index,
              subplebbitAddress: this.subplebbit.address,
            })
          }
          return page
        }
      })

      afterEach(() => {
        Pages.prototype.getPage = getPage
      })

      test(`1 subplebbit, scroll to end of feed, hasMore becomes false`, async () => {
        rendered.rerender({subplebbitAddresses: ['subplebbit address 1'], sortType: 'new'})
        // hasMore should be true before the feed is loaded
        expect(rendered.result.current.hasMore).toBe(true)
        expect(typeof rendered.result.current.loadMore).toBe('function')

        // wait for feed array to render
        await waitFor(() => Array.isArray(rendered.result.current.feed))
        expect(rendered.result.current.feed).toEqual([])
        // hasMore should be true before the feed is loaded
        expect(rendered.result.current.hasMore).toBe(true)

        await waitFor(() => rendered.result.current.feed.length > 0)

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
        await waitFor(() => rendered.result.current.hasMore === false)
        expect(rendered.result.current.hasMore).toBe(false)
        expect(rendered.result.current.feed.length).toBe(postsPerPage * 4)
      })

      test(`multiple subplebbits, scroll to end of feed, hasMore becomes false`, async () => {
        rendered.rerender({
          subplebbitAddresses: ['subplebbit address 1', 'subplebbit address 2', 'subplebbit address 3'],
          sortType: 'new',
        })
        // hasMore should be true before the feed is loaded
        expect(rendered.result.current.hasMore).toBe(true)
        expect(typeof rendered.result.current.loadMore).toBe('function')

        // wait for feed array to render
        await waitFor(() => Array.isArray(rendered.result.current.feed))

        expect(rendered.result.current.feed).toEqual([])
        // hasMore should be true before the feed is loaded
        expect(rendered.result.current.hasMore).toBe(true)

        await waitFor(() => rendered.result.current.feed.length > 0)

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
        await waitFor(() => rendered.result.current.feed.length > 0)

        // increment page manually because loadMore can't work that fast
        const {incrementFeedPageNumber, feedsOptions} = feedsStore.getState()
        const feedName = Object.keys(feedsOptions)[0]

        expect(rendered.result.current.feed.length).toBe(postsPerPage)
        expect(typeof rendered.result.current.loadMore).toBe('function')
        await act(async () => {
          // should have an error here because we load a page before the previous one finishes loading
          // use a large loop to try to catch the error because depending on timing it doesn't always trigger
          await expect(async () => {
            let attempts = 10000
            while (attempts--) {
              await simulateLoadingTime()
              incrementFeedPageNumber(feedName)
              incrementFeedPageNumber(feedName)
              incrementFeedPageNumber(feedName)
            }
          }).rejects.toThrow('feedsActions.incrementFeedPageNumber cannot increment feed page number before current page has loaded')
        })
      })
    })

    describe('getPage never gets called', () => {
      const getPage = Pages.prototype.getPage

      beforeEach(() => {
        Pages.prototype.getPage = async function (pageCid: string) {
          // it can get called with a next cid to fetch the second page
          if (!pageCid.match('next')) {
            throw Error(`subplebbit.getPage() was called with argument '${pageCid}', should not get called at all on first page of sort type 'hot'`)
          }
          return {nextCid: undefined, comments: []}
        }
      })

      afterEach(() => {
        Pages.prototype.getPage = getPage
      })

      test(`get feed sorted by hot, don't call subplebbit.getPage() because already included in IPNS record`, async () => {
        rendered.rerender({subplebbitAddresses: ['subplebbit address 1'], sortType: 'hot'})
        await waitFor(() => rendered.result.current.feed?.length >= postsPerPage)
        expect(rendered.result.current.feed?.length).toBe(postsPerPage)
      })
    })

    test(`subplebbit updates while we are scrolling`, async () => {
      const update = Subplebbit.prototype.update
      // mock the update method to be able to have access to the updating subplebbit instances
      const subplebbits: any = []
      Subplebbit.prototype.update = function () {
        subplebbits.push(this)
        return update.bind(this)()
      }

      rendered = renderHook<any, any>((props: any) => {
        const feed = useFeed(props)
        const {bufferedFeeds} = useBufferedFeeds({
          feedsOptions: [{subplebbitAddresses: props?.subplebbitAddresses, sortType: props?.sortType}],
          accountName: props?.accountName,
        })
        return {...feed, bufferedFeed: bufferedFeeds[0]}
      })
      waitFor = testUtils.createWaitFor(rendered)

      // get feed with 1 sub
      rendered.rerender({subplebbitAddresses: ['subplebbit address 1'], sortType: 'topAll'})
      await waitFor(() => rendered.result.current.feed.length > 0)

      // the first page of loaded and buffered feeds should have laoded
      expect(rendered.result.current.feed.length).toBe(postsPerPage)
      expect(rendered.result.current.bufferedFeed.length).toBeGreaterThan(postsPerPage)
      // at this point only one subplebbit should have updated a single time
      expect(subplebbits.length).toBe(1)
      const [subplebbit] = subplebbits

      act(() => {
        // update the page cids and send a subplebbit update event and wait for buffered feeds to change
        subplebbits[0].posts.pageCids = {
          hot: 'updated page cid hot',
          topAll: 'updated page cid topAll',
          new: 'updated page cid new',
        }
        subplebbit.emit('update', subplebbit)
      })

      // wait for the buffered feed to empty (because of the update), then to refill with updated page
      // more testing in production will have to be done to figure out if emptying the buffered feed while waiting
      // for new posts causes problems.
      await waitFor(() => rendered.result.current.bufferedFeed[0].cid === 'updated page cid topAll comment cid 100')
      expect(rendered.result.current.bufferedFeed[0].cid).toBe('updated page cid topAll comment cid 100')

      Subplebbit.prototype.update = update
    })

    describe('getPage only gets called once per pageCid', () => {
      const getPage = Pages.prototype.getPage

      beforeEach(() => {
        const usedPageCids: any = {}
        Pages.prototype.getPage = async function (pageCid: string) {
          if (usedPageCids[pageCid]) {
            throw Error(`subplebbit.getPage() already called with argument '${pageCid}'`)
          }
          usedPageCids[pageCid] = true
          return getPage.bind(this)(pageCid)
        }
      })

      afterEach(() => {
        Pages.prototype.getPage = getPage
      })

      test(`store page pages in database`, async () => {
        rendered.rerender({subplebbitAddresses: ['subplebbit address 1'], sortType: 'new'})
        await waitFor(() => rendered.result.current.feed?.length >= postsPerPage)

        expect(rendered.result.current.feed?.length).toBe(postsPerPage)

        // reset stores to force using the db
        await testUtils.resetStores()

        // render with a fresh empty store to test database persistance
        const rendered2 = renderHook<any, any>(() => useFeed({subplebbitAddresses: ['subplebbit address 1'], sortType: 'new'}))
        await waitFor(() => rendered2.result.current.feed?.length >= postsPerPage)
        expect(rendered2.result.current.feed?.length).toBe(postsPerPage)
      })
    })

    test(`feed doesn't contain blocked addresses`, async () => {
      const expectFeedToHaveSubplebbitAddresses = (feed: any[], subplebbitAddresses: string[]) => {
        for (const subplebbitAddress of subplebbitAddresses) {
          // feed posts are missing a subplebbitAddress expected in `subplebbitAddresses` argument
          const feedSubplebbitAddresses = feed.map((feedPost) => feedPost.subplebbitAddress)
          expect(feedSubplebbitAddresses).toContain(subplebbitAddress)
          // feed posts contain a subplebbitAddress not expected in `subplebbitAddresses` argument
          for (const feedPost of feed) {
            expect(subplebbitAddresses).toContain(feedPost.subplebbitAddress)
          }
        }
        return true
      }
      const expectFeedToHaveAuthorAddresses = (feed: any[], authorAddress: string) => {
        const authorAddresses = feed.map((comment) => comment?.author?.address)
        expect(authorAddresses).toContain(authorAddress)
        return true
      }
      const expectFeedNotToHaveAuthorAddresses = (feed: any[], authorAddress: string) => {
        const authorAddresses = feed.map((comment) => comment?.author?.address)
        expect(authorAddresses).not.toContain(authorAddress)
        return true
      }

      const rendered = renderHook<any, any>((props: any) => {
        const [bufferedFeed] = useBufferedFeeds({feedsOptions: [{subplebbitAddresses: props?.subplebbitAddresses, sortType: 'new'}]}).bufferedFeeds
        const {blockAddress, unblockAddress} = accountsActions
        const account = useAccount()
        return {bufferedFeed, blockAddress, unblockAddress, account}
      })
      const waitFor = testUtils.createWaitFor(rendered)
      await waitFor(() => typeof rendered.result.current.blockAddress === 'function')

      const blockedSubplebbitAddress = 'blocked.eth'
      const unblockedSubplebbitAddress = 'unblocked-address.eth'
      const blockedAuthorAddress = `${blockedSubplebbitAddress} page cid new author address 1`

      // render feed before blocking
      rendered.rerender({subplebbitAddresses: [unblockedSubplebbitAddress, blockedSubplebbitAddress]})
      // wait until feed contains both blocked and unblocked addresses
      await waitFor(() => rendered.result.current.bufferedFeed.length > 0)
      expectFeedToHaveSubplebbitAddresses(rendered.result.current.bufferedFeed, [blockedSubplebbitAddress, unblockedSubplebbitAddress])

      // block subplebbit address
      await act(async () => {
        await rendered.result.current.blockAddress(blockedSubplebbitAddress)
      })
      await waitFor(
        () =>
          Object.keys(rendered.result.current.account.blockedAddresses).length === 1 &&
          expectFeedToHaveSubplebbitAddresses(rendered.result.current.bufferedFeed, [unblockedSubplebbitAddress])
      )
      expectFeedToHaveSubplebbitAddresses(rendered.result.current.bufferedFeed, [unblockedSubplebbitAddress])

      // unblock subplebbit address
      await act(async () => {
        await rendered.result.current.unblockAddress(blockedSubplebbitAddress)
      })
      await waitFor(
        () =>
          Object.keys(rendered.result.current.account.blockedAddresses).length === 0 &&
          expectFeedToHaveSubplebbitAddresses(rendered.result.current.bufferedFeed, [blockedSubplebbitAddress, unblockedSubplebbitAddress])
      )
      expectFeedToHaveSubplebbitAddresses(rendered.result.current.bufferedFeed, [blockedSubplebbitAddress, unblockedSubplebbitAddress])

      // feed has blocked author address before blocking
      expectFeedToHaveAuthorAddresses(rendered.result.current.bufferedFeed, blockedAuthorAddress)

      // block author address
      await act(async () => {
        await rendered.result.current.blockAddress(blockedAuthorAddress)
      })
      await waitFor(
        () =>
          Object.keys(rendered.result.current.account.blockedAddresses).length === 1 &&
          expectFeedNotToHaveAuthorAddresses(rendered.result.current.bufferedFeed, blockedAuthorAddress)
      )
      // feed doesnt have blocked author address
      expect(rendered.result.current.account.blockedAddresses[blockedAuthorAddress]).toBe(true)
      expectFeedNotToHaveAuthorAddresses(rendered.result.current.bufferedFeed, blockedAuthorAddress)
    })

    test(`feed doesn't contain blocked cids`, async () => {
      const expectFeedToHaveCid = (feed: any[], cid: string) => {
        const cids = feed.map((comment) => comment?.cid)
        expect(cids).toContain(cid)
        return true
      }
      const expectFeedNotToHaveCid = (feed: any[], cid: string) => {
        const cids = feed.map((comment) => comment?.cid)
        expect(cids).not.toContain(cid)
        return true
      }

      const rendered = renderHook<any, any>((props: any) => {
        const [bufferedFeed] = useBufferedFeeds({feedsOptions: [{subplebbitAddresses: props?.subplebbitAddresses, sortType: 'new'}]}).bufferedFeeds
        const {blockCid, unblockCid} = accountsActions
        const account = useAccount()
        return {bufferedFeed, blockCid, unblockCid, account}
      })
      const waitFor = testUtils.createWaitFor(rendered)
      await waitFor(() => typeof rendered.result.current.blockCid === 'function')

      // render feed before blocking
      rendered.rerender({subplebbitAddresses: ['subplebbit address 1']})
      // wait until feed contains both blocked and unblocked addresses
      await waitFor(() => rendered.result.current.bufferedFeed.length > 0)
      const blockedCid = rendered.result.current.bufferedFeed[0].cid
      expect(typeof blockedCid).toBe('string')
      expectFeedToHaveCid(rendered.result.current.bufferedFeed, blockedCid)

      // block cid
      await act(async () => {
        await rendered.result.current.blockCid(blockedCid)
      })
      await waitFor(
        () => Object.keys(rendered.result.current.account.blockedCids).length === 1 && expectFeedNotToHaveCid(rendered.result.current.bufferedFeed, blockedCid)
      )
      expect(Object.keys(rendered.result.current.account.blockedCids).length).toBe(1)
      expectFeedNotToHaveCid(rendered.result.current.bufferedFeed, blockedCid)

      // unblock cid
      await act(async () => {
        await rendered.result.current.unblockCid(blockedCid)
      })

      // NOTE: feeds won't update on cid unblock events, another event must cause the feed to update
      // it seems preferable to causing unnecessary rerenders every time an unused block event occurs

      // cause another feed update to fix the edge case
      rendered.rerender({subplebbitAddresses: ['subplebbit address 1', 'subplebbit address 2']})

      await waitFor(() => Object.keys(rendered.result.current.account.blockedCids).length === 0 && expectFeedToHaveCid(rendered.result.current.bufferedFeed, blockedCid))
      expect(Object.keys(rendered.result.current.account.blockedCids).length).toBe(0)
      expectFeedToHaveCid(rendered.result.current.bufferedFeed, blockedCid)
    })

    test(`empty subplebbit.post hasMore is false`, async () => {
      const update = Subplebbit.prototype.update
      const updatedAt = Math.floor(Date.now() / 1000)
      const emptyPosts: any = {pages: {}, pageCids: {}}
      Subplebbit.prototype.update = async function () {
        await simulateLoadingTime()
        this.updatedAt = updatedAt
        this.posts = emptyPosts
        this.emit('update', this)
      }

      rendered = renderHook<any, any>((props: any) => {
        const feed = useFeed(props)
        const subplebbit = useSubplebbit({subplebbitAddress: props?.subplebbitAddresses?.[0]})
        return {feed, subplebbit}
      })
      waitFor = testUtils.createWaitFor(rendered)

      // get feed with 1 sub with no posts
      rendered.rerender({subplebbitAddresses: ['subplebbit address 1']})
      expect(rendered.result.current.feed.hasMore).toBe(true)

      await waitFor(() => rendered.result.current.feed.hasMore === false)
      expect(rendered.result.current.feed.hasMore).toBe(false)
      expect(rendered.result.current.feed.feed.length).toBe(0)

      Subplebbit.prototype.update = update
    })

    // TODO: not implemented
    // at the moment a comment already inside a loaded feed will ignore all updates from future pages
    test.todo(`if an updated subplebbit page gives a comment already in a loaded feed, replace it with the newest version with updated votes/replies`)

    // TODO: not implemented
    test.todo(`don't let a malicious sub owner display older posts in top hour/day/week/month/year`)

    // already implemented but no tests for it because difficult to test
    test.todo(`subplebbits finish loading with 0 posts, hasMore becomes false, but only after finished loading`)
  })
})
