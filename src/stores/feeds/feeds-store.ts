import assert from 'assert'
import Debug from 'debug'
const debug = Debug('plebbit-react-hooks:stores:feeds')
import {Feed, Feeds, Subplebbits, Account, FeedsOptions, SubplebbitPage, FeedsSubplebbitsPostCounts} from '../../types'
import createStore from 'zustand'
import localForageLru from '../../lib/localforage-lru'
import accountsStore from '../accounts'
import subplebbitsStore from '../subplebbits'
import subplebbitsPagesStore from '../subplebbits-pages'
import {
  getFeedsSubplebbitsFirstPageCids,
  getBufferedFeeds,
  getLoadedFeeds,
  getBufferedFeedsWithoutLoadedFeeds,
  getFeedsSubplebbitsPostCounts,
  getFeedsHaveMore,
} from './utils'

// reddit loads approximately 25 posts per page
// while infinite scrolling
export const postsPerPage = 25

// keep large buffer because fetching cids is slow
export const subplebbitPostsLeftBeforeNextPage = 50

// reset all event listeners in between tests
export const listeners: any = []

type FeedsState = {
  feedsOptions: FeedsOptions
  bufferedFeeds: Feeds
  loadedFeeds: Feeds
  bufferedFeedsSubplebbitsPostCounts: FeedsSubplebbitsPostCounts
  feedsHaveMore: {[feedName: string]: boolean}
  addFeedToStore: Function
  incrementFeedPageNumber: Function
  updateFeeds: Function
}

// don't updateFeeds more than once per updateFeedsMinIntervalTime
let updateFeedsPending = false
const updateFeedsMinIntervalTime = 50

const useFeedsStore = createStore<FeedsState>((setState: Function, getState: Function) => ({
  feedsOptions: {},
  bufferedFeeds: {},
  loadedFeeds: {},
  bufferedFeedsSubplebbitsPostCounts: {},
  feedsHaveMore: {},

  async addFeedToStore(feedName: string, subplebbitAddresses: string[], sortType: string, account: Account, isBufferedFeed?: boolean) {
    assert(feedName && typeof feedName === 'string', `feedsStore.addFeedToStore feedName '${feedName}' invalid`)
    assert(Array.isArray(subplebbitAddresses), `addFeedToStore.addFeedToStore subplebbitAddresses '${subplebbitAddresses}' invalid`)
    assert(sortType && typeof sortType === 'string', `addFeedToStore.addFeedToStore sortType '${sortType}' invalid`)
    assert(typeof account?.plebbit?.getSubplebbit === 'function', `addFeedToStore.addFeedToStore account '${account}' invalid`)
    assert(
      typeof isBufferedFeed === 'boolean' || isBufferedFeed === undefined || isBufferedFeed === null,
      `addFeedToStore.addFeedToStore isBufferedFeed '${isBufferedFeed}' invalid`
    )

    const {feedsOptions} = getState()
    // feed is in store already, do nothing
    // if the feed already exist but is at page 1, reset it to page 1
    if (feedsOptions[feedName] && feedsOptions[feedName].pageNumber !== 0) {
      return
    }
    // to add a buffered feed, add a feed with pageNumber 0
    const feedOptions = {subplebbitAddresses, sortType, account, pageNumber: isBufferedFeed === true ? 0 : 1}
    debug('feedsActions.addFeedToStore', feedOptions)
    setState(({feedsOptions}: any) => {
      // make sure to never overwrite a feed already added
      if (feedsOptions[feedName]) {
        return {}
      }
      return {feedsOptions: {...feedsOptions, [feedName]: feedOptions}}
    })

    addSubplebbitsToSubplebbitsStore(subplebbitAddresses, account)

    // subscribe to subplebbits store changes
    subplebbitsStore.subscribe(updateFeedsOnFeedsSubplebbitsChange)

    // subscribe to bufferedFeedsSubplebbitsPostCounts change
    useFeedsStore.subscribe(addSubplebbitsPagesOnLowBufferedFeedsSubplebbitsPostCounts)

    // subscribe to subplebbits pages store changes
    subplebbitsPagesStore.subscribe(updateFeedsOnFeedsSubplebbitsPagesChange)

    // subscribe to page number change

    // subscribe to accounts store change (for blocked addresses)
  },

  async incrementFeedPageNumber(feedName: string) {
    const {feedsOptions, loadedFeeds} = getState()
    assert(feedsOptions[feedName], `feedsActions.incrementFeedPageNumber feed name '${feedName}' does not exist in feeds store`)
    debug('feedsActions.incrementFeedPageNumber', {feedName})

    assert(
      feedsOptions[feedName].pageNumber * postsPerPage <= loadedFeeds[feedName].length,
      `feedsActions.incrementFeedPageNumber cannot increment feed page number before current page has loaded`
    )
    setState(({feedsOptions, loadedFeeds}: any) => {
      // don't increment page number before the current page has loaded
      if (feedsOptions[feedName].pageNumber * postsPerPage > loadedFeeds[feedName].length) {
        return {}
      }
      const feedOptions = {
        ...feedsOptions[feedName],
        pageNumber: feedsOptions[feedName].pageNumber + 1,
      }
      return {feedsOptions: {...feedsOptions, [feedName]: feedOptions}}
    })
  },

  // recalculate all feeds using new subplebbits.post.pages, subplebbitsPagesStore and page numbers
  updateFeeds() {
    if (updateFeedsPending) {
      return
    }
    updateFeedsPending = true

    // don't update feeds more than once per updateFeedsMinIntervalTime
    const timeUntilNextUpdate = Date.now() % updateFeedsMinIntervalTime

    setTimeout(() => {
      // allow a new update to be scheduled as soon as updateFeedsMinIntervalTime elapses
      updateFeedsPending = false

      // get state from all stores
      const previousState = getState()
      const {feedsOptions} = previousState
      const {subplebbits} = subplebbitsStore.getState()
      const {subplebbitsPages} = subplebbitsPagesStore.getState()
      const {accounts} = accountsStore.getState()

      // calculate new feeds
      const bufferedFeedsWithLoadedFeeds = getBufferedFeeds(feedsOptions, previousState.loadedFeeds, subplebbits, subplebbitsPages, accounts)
      const loadedFeeds = getLoadedFeeds(feedsOptions, previousState.loadedFeeds, bufferedFeedsWithLoadedFeeds)
      // after loaded feeds are caculated, remove loaded feeds again from buffered feeds
      const bufferedFeeds = getBufferedFeedsWithoutLoadedFeeds(bufferedFeedsWithLoadedFeeds, loadedFeeds)
      const bufferedFeedsSubplebbitsPostCounts = getFeedsSubplebbitsPostCounts(feedsOptions, bufferedFeeds)
      const feedsHaveMore = getFeedsHaveMore(feedsOptions, subplebbits, subplebbitsPages, bufferedFeeds)
      // set new feeds
      setState((state: any) => ({bufferedFeeds, loadedFeeds, bufferedFeedsSubplebbitsPostCounts, feedsHaveMore}))
      debug('feedsStore.updateFeeds', {bufferedFeeds, loadedFeeds, bufferedFeedsSubplebbitsPostCounts, feedsHaveMore})
    }, timeUntilNextUpdate)
  },
}))

let previousSubplebbitsPageCids: string[] = []
const updateFeedsOnFeedsSubplebbitsPagesChange = (subplebbitsPagesStoreState: any) => {
  const {subplebbitsPages} = subplebbitsPagesStoreState
  const subplebbitsPageCids = Object.keys(subplebbitsPages).sort()

  // no changes, do nothing
  if (subplebbitsPageCids.toString() === previousSubplebbitsPageCids.toString()) {
    return
  }
  previousSubplebbitsPageCids = subplebbitsPageCids

  // currently only the feeds use subplebbitsPagesStore, so any change must
  // trigger a feed update, if in the future another hook uses the subplebbitsPagesStore
  // we should check if the subplebbits pages changed are actually used by the feeds before
  // triggering an update
  useFeedsStore.getState().updateFeeds()
}

let previousBufferedFeedsSubplebbitsPostCounts: string | undefined
const addSubplebbitsPagesOnLowBufferedFeedsSubplebbitsPostCounts = (feedsStoreState: any) => {
  const {bufferedFeedsSubplebbitsPostCounts, feedsOptions} = useFeedsStore.getState()

  // bufferedFeedsSubplebbitsPostCounts haven't changed, do nothing
  const bufferedFeedsSubplebbitsPostCountsStringified = JSON.stringify(bufferedFeedsSubplebbitsPostCounts)
  if (bufferedFeedsSubplebbitsPostCountsStringified === previousBufferedFeedsSubplebbitsPostCounts) {
    return
  }
  previousBufferedFeedsSubplebbitsPostCounts = bufferedFeedsSubplebbitsPostCountsStringified

  const {subplebbits} = subplebbitsStore.getState()
  const {addNextSubplebbitPageToStore} = subplebbitsPagesStore.getState()

  // bufferedFeedsSubplebbitsPostCounts have changed, check if any of them are low
  for (const feedName in bufferedFeedsSubplebbitsPostCounts) {
    const subplebbitsPostCounts = bufferedFeedsSubplebbitsPostCounts[feedName]
    const sortType = feedsOptions[feedName].sortType
    for (const subplebbitAddress in subplebbitsPostCounts) {
      // subplebbit post count is low, fetch next subplebbit page
      if (subplebbitsPostCounts[subplebbitAddress] <= subplebbitPostsLeftBeforeNextPage) {
        addNextSubplebbitPageToStore(subplebbits[subplebbitAddress], sortType, feedsOptions[feedName].account).catch((error: unknown) =>
          console.error('feedsStore subplebbitsActions.addNextSubplebbitPageToStore error', {subplebbitAddress, sortType, error})
        )
      }
    }
  }
}

let previousFeedsSubplebbitsFirstPageCids: string[] = []
const updateFeedsOnFeedsSubplebbitsChange = (subplebbitsStoreState: any) => {
  const {subplebbits} = subplebbitsStoreState
  const {feedsOptions, updateFeeds} = useFeedsStore.getState()

  // decide if feeds subplebbits have changed by looking at all feeds subplebbits page cids
  const feedsSubplebbitsFirstPageCids = getFeedsSubplebbitsFirstPageCids(feedsOptions, subplebbits)

  // feeds subplebbits haven't changed, do nothing
  if (feedsSubplebbitsFirstPageCids.toString() === previousFeedsSubplebbitsFirstPageCids.toString()) {
    return
  }

  // feeds subplebbits have changed, update feeds
  previousFeedsSubplebbitsFirstPageCids = feedsSubplebbitsFirstPageCids
  updateFeeds()
}

const addSubplebbitsToSubplebbitsStore = (subplebbitAddresses: string[], account: Account) => {
  const addSubplebbitToStore = subplebbitsStore.getState().addSubplebbitToStore
  for (const subplebbitAddress of subplebbitAddresses) {
    addSubplebbitToStore(subplebbitAddress, account).catch((error: unknown) =>
      console.error('feedsStore subplebbitsActions.addSubplebbitToStore error', {subplebbitAddress, error})
    )
  }
}

// reset store in between tests
const originalState = useFeedsStore.getState()
// async function because some stores have async init
export const resetFeedsStore = async () => {
  previousBufferedFeedsSubplebbitsPostCounts = undefined
  previousFeedsSubplebbitsFirstPageCids = []
  previousSubplebbitsPageCids = []
  updateFeedsPending = false
  // remove all event listeners
  listeners.forEach((listener: any) => listener.removeAllListeners())
  // destroy all component subscriptions to the store
  useFeedsStore.destroy()
  // restore original state
  useFeedsStore.setState(originalState)
}

// reset database and store in between tests
export const resetFeedsDatabaseAndStore = async () => {
  await localForageLru.createInstance({name: 'subplebbitsPages'}).clear()
  await resetFeedsStore()
}

export default useFeedsStore
