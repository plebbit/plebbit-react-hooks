import assert from 'assert'
import Logger from '@plebbit/plebbit-logger'
const log = Logger('plebbit-react-hooks:stores:feeds')
import {Feed, Feeds, Subplebbit, Subplebbits, Account, FeedsOptions, SubplebbitPage, FeedsSubplebbitsPostCounts} from '../../types'
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
  getFeedAfterIncrementPageNumber,
  getAccountsBlockedAddresses,
  feedsHaveChangedBlockedAddresses,
  accountsBlockedAddressesChanged,
  feedsSubplebbitsChanged,
  getFeedsSubplebbits,
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
const updateFeedsMinIntervalTime = 100

const feedsStore = createStore<FeedsState>((setState: Function, getState: Function) => ({
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

    const {feedsOptions, updateFeeds} = getState()
    // feed is in store already, do nothing
    // if the feed already exist but is at page 1, reset it to page 1
    if (feedsOptions[feedName] && feedsOptions[feedName].pageNumber !== 0) {
      return
    }
    // to add a buffered feed, add a feed with pageNumber 0
    const feedOptions = {subplebbitAddresses, sortType, accountId: account.id, pageNumber: isBufferedFeed === true ? 0 : 1}
    log('feedsActions.addFeedToStore', feedOptions)
    setState(({feedsOptions}: any) => {
      // make sure to never overwrite a feed already added
      if (feedsOptions[feedName] && feedsOptions[feedName].pageNumber !== 0) {
        throw Error(`feedsActions.addFeedToStore feed '${feedName}' already added`)
      }
      return {feedsOptions: {...feedsOptions, [feedName]: feedOptions}}
    })

    addSubplebbitsToSubplebbitsStore(subplebbitAddresses, account)

    // subscribe to subplebbits store changes
    subplebbitsStore.subscribe(updateFeedsOnFeedsSubplebbitsChange)

    // subscribe to bufferedFeedsSubplebbitsPostCounts change
    feedsStore.subscribe(addSubplebbitsPagesOnLowBufferedFeedsSubplebbitsPostCounts)

    // subscribe to subplebbits pages store changes
    subplebbitsPagesStore.subscribe(updateFeedsOnFeedsSubplebbitsPagesChange)

    // subscribe to accounts store change (for blocked addresses)
    accountsStore.subscribe(updateFeedsOnAccountsBlockedAddressesChange)

    // update feeds right away to use the already loaded subplebbits and pages
    // if no new subplebbits are added by the feed, like for a sort type change,
    // a feed update will never be triggered, so must be triggered it manually
    updateFeeds()
  },

  incrementFeedPageNumber(feedName: string) {
    const {feedsOptions, loadedFeeds, updateFeeds} = getState()
    assert(feedsOptions[feedName], `feedsActions.incrementFeedPageNumber feed name '${feedName}' does not exist in feeds store`)
    log('feedsActions.incrementFeedPageNumber', {feedName})

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

    // do not update feed at the same time as increment a page number or it might cause
    // a race condition, rather schedule a feed update
    updateFeeds()
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
      const feedsHaveMore = getFeedsHaveMore(feedsOptions, bufferedFeeds, subplebbits, subplebbitsPages, accounts)
      // set new feeds
      setState((state: any) => ({bufferedFeeds, loadedFeeds, bufferedFeedsSubplebbitsPostCounts, feedsHaveMore}))
      log.trace('feedsStore.updateFeeds', {feedsOptions, bufferedFeeds, loadedFeeds, bufferedFeedsSubplebbitsPostCounts, feedsHaveMore, subplebbits, subplebbitsPages})
    }, timeUntilNextUpdate)
  },
}))

let previousBlockedAddresses: string[] = []
let previousAccountsBlockedAddresses: {[address: string]: boolean}[] = []
const updateFeedsOnAccountsBlockedAddressesChange = (accountsStoreState: any) => {
  const {accounts} = accountsStoreState

  // blocked addresses haven't changed, do nothing
  const accountsBlockedAddresses = []
  for (const i in accounts) {
    accountsBlockedAddresses.push(accounts[i].blockedAddresses)
  }
  if (!accountsBlockedAddressesChanged(previousAccountsBlockedAddresses, accountsBlockedAddresses)) {
    return
  }
  previousAccountsBlockedAddresses = accountsBlockedAddresses

  const blockedAddresses = getAccountsBlockedAddresses(accounts)

  // blocked addresses haven't changed, do nothing
  if (blockedAddresses.toString() === previousBlockedAddresses.toString()) {
    return
  }

  const {feedsOptions, updateFeeds, bufferedFeeds} = feedsStore.getState()
  const _feedsHaveChangedBlockedAddresses = feedsHaveChangedBlockedAddresses(feedsOptions, bufferedFeeds, blockedAddresses, previousBlockedAddresses)
  previousBlockedAddresses = blockedAddresses

  // if changed blocked addresses arent used in the feeds, do nothing
  if (!_feedsHaveChangedBlockedAddresses) {
    return
  }

  updateFeeds()
}

let previousSubplebbitsPages: {[pageCid: string]: SubplebbitPage} = {}
const updateFeedsOnFeedsSubplebbitsPagesChange = (subplebbitsPagesStoreState: any) => {
  const {subplebbitsPages} = subplebbitsPagesStoreState

  // no changes, do nothing
  if (subplebbitsPages === previousSubplebbitsPages) {
    return
  }
  previousSubplebbitsPages = subplebbitsPages

  // currently only the feeds use subplebbitsPagesStore, so any change must
  // trigger a feed update, if in the future another hook uses the subplebbitsPagesStore
  // we should check if the subplebbits pages changed are actually used by the feeds before
  // triggering an update
  feedsStore.getState().updateFeeds()
}

let previousBufferedFeedsSubplebbitsPostCounts: string | undefined
let previousBufferedFeedsSubplebbitsPostCountsPageCids: string[] = []
const addSubplebbitsPagesOnLowBufferedFeedsSubplebbitsPostCounts = (feedsStoreState: any) => {
  const {bufferedFeedsSubplebbitsPostCounts, feedsOptions} = feedsStore.getState()
  const {subplebbits} = subplebbitsStore.getState()

  // if subplebbits pages have changed, we must try adding them even if buffered posts counts haven't changed
  const feedsSubplebbits = getFeedsSubplebbits(feedsOptions, subplebbits)
  const bufferedFeedsSubplebbitsPostCountsPageCids = getFeedsSubplebbitsFirstPageCids(feedsSubplebbits)

  // bufferedFeedsSubplebbitsPostCounts haven't changed and subplebbits page cids haven't changed, do nothing
  const bufferedFeedsSubplebbitsPostCountsStringified = JSON.stringify(bufferedFeedsSubplebbitsPostCounts)
  if (
    bufferedFeedsSubplebbitsPostCountsStringified === previousBufferedFeedsSubplebbitsPostCounts &&
    bufferedFeedsSubplebbitsPostCountsPageCids.toString() === previousBufferedFeedsSubplebbitsPostCountsPageCids.toString()
  ) {
    return
  }
  previousBufferedFeedsSubplebbitsPostCounts = bufferedFeedsSubplebbitsPostCountsStringified
  previousBufferedFeedsSubplebbitsPostCountsPageCids = bufferedFeedsSubplebbitsPostCountsPageCids

  const {addNextSubplebbitPageToStore} = subplebbitsPagesStore.getState()
  const {accounts} = accountsStore.getState()

  // bufferedFeedsSubplebbitsPostCounts have changed, check if any of them are low
  for (const feedName in bufferedFeedsSubplebbitsPostCounts) {
    const account = accounts[feedsOptions[feedName].accountId]
    const subplebbitsPostCounts = bufferedFeedsSubplebbitsPostCounts[feedName]
    const sortType = feedsOptions[feedName].sortType
    for (const subplebbitAddress in subplebbitsPostCounts) {
      // don't fetch more pages if subplebbit address is blocked
      if (account.blockedAddresses[subplebbitAddress]) {
        continue
      }

      // subplebbit hasn't loaded yet
      if (!subplebbits[subplebbitAddress]) {
        continue
      }

      // subplebbit post count is low, fetch next subplebbit page
      if (subplebbitsPostCounts[subplebbitAddress] <= subplebbitPostsLeftBeforeNextPage) {
        addNextSubplebbitPageToStore(subplebbits[subplebbitAddress], sortType, account).catch((error: unknown) =>
          log.error('feedsStore subplebbitsActions.addNextSubplebbitPageToStore error', {subplebbitAddress, subplebbit: subplebbits[subplebbitAddress], sortType, error})
        )
      }
    }
  }
}

let previousFeedsSubplebbitsFirstPageCids: string[] = []
let previousFeedsSubplebbits: Map<string, Subplebbit> = new Map()
const updateFeedsOnFeedsSubplebbitsChange = (subplebbitsStoreState: any) => {
  const {subplebbits} = subplebbitsStoreState
  const {feedsOptions, updateFeeds} = feedsStore.getState()

  // feeds subplebbits haven't changed, do nothing
  const feedsSubplebbits = getFeedsSubplebbits(feedsOptions, subplebbits)
  if (!feedsSubplebbitsChanged(previousFeedsSubplebbits, feedsSubplebbits)) {
    return
  }
  previousFeedsSubplebbits = feedsSubplebbits

  // decide if feeds subplebbits have changed by looking at all feeds subplebbits page cids
  // (in case that a subplebbit changed, but its first page cid didn't)
  const feedsSubplebbitsFirstPageCids = getFeedsSubplebbitsFirstPageCids(feedsSubplebbits)

  // first page cids haven't changed, do nothing
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
      log.error('feedsStore subplebbitsActions.addSubplebbitToStore error', {subplebbitAddress, error})
    )
  }
}

// reset store in between tests
const originalState = feedsStore.getState()
// async function because some stores have async init
export const resetFeedsStore = async () => {
  previousBufferedFeedsSubplebbitsPostCounts = undefined
  previousBufferedFeedsSubplebbitsPostCountsPageCids = []
  previousBlockedAddresses = []
  previousFeedsSubplebbitsFirstPageCids = []
  previousFeedsSubplebbits = new Map()
  previousSubplebbitsPages = {}
  updateFeedsPending = false
  // remove all event listeners
  listeners.forEach((listener: any) => listener.removeAllListeners())
  // destroy all component subscriptions to the store
  feedsStore.destroy()
  // restore original state
  feedsStore.setState(originalState)
}

// reset database and store in between tests
export const resetFeedsDatabaseAndStore = async () => {
  await localForageLru.createInstance({name: 'subplebbitsPages'}).clear()
  await resetFeedsStore()
}

export default feedsStore
