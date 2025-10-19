import assert from 'assert'
import Logger from '@plebbit/plebbit-logger'
const log = Logger('plebbit-react-hooks:feeds:stores')
import {
  Feed,
  Feeds,
  Subplebbit,
  Subplebbits,
  Account,
  FeedsOptions,
  SubplebbitPage,
  FeedsSubplebbitsPostCounts,
  CommentsFilter,
  FeedOptionsAccountComments,
  Comment,
} from '../../types'
import createStore from 'zustand'
import localForageLru from '../../lib/localforage-lru'
import {subplebbitPostsCacheExpired} from '../../lib/utils'
import accountsStore from '../accounts'
import subplebbitsStore from '../subplebbits'
import subplebbitsPagesStore from '../subplebbits-pages'
import {
  getFeedsSubplebbitsFirstPageCids,
  getLoadedFeeds,
  getUpdatedFeeds,
  getBufferedFeedsWithoutLoadedFeeds,
  getFeedsSubplebbitsPostCounts,
  getFeedsHaveMore,
  getAccountsBlockedAddresses,
  feedsHaveChangedBlockedAddresses,
  accountsBlockedAddressesChanged,
  getAccountsBlockedCids,
  feedsHaveChangedBlockedCids,
  accountsBlockedCidsChanged,
  feedsSubplebbitsChanged,
  getFeedsSubplebbits,
  getFeedsSubplebbitsLoadedCount,
  getFeedsSubplebbitsPostsPagesFirstUpdatedAts,
  getFilteredSortedFeeds,
  getFeedsSubplebbitAddressesWithNewerPosts,
} from './utils'

// reddit loads approximately 25 posts per page
// while infinite scrolling
export const defaultPostsPerPage = 25

// keep large buffer because fetching cids is slow
export const subplebbitPostsLeftBeforeNextPage = 50

export type FeedsState = {
  feedsOptions: FeedsOptions
  bufferedFeeds: Feeds
  loadedFeeds: Feeds
  updatedFeeds: Feeds
  bufferedFeedsSubplebbitsPostCounts: FeedsSubplebbitsPostCounts
  feedsHaveMore: {[feedName: string]: boolean}
  feedsSubplebbitAddressesWithNewerPosts: {[feedName: string]: string[]}
  addFeedToStore: Function
  incrementFeedPageNumber: Function
  resetFeed: Function
  updateFeeds: Function
}

// don't updateFeeds more than once per updateFeedsMinIntervalTime
let updateFeedsPending = false
const updateFeedsMinIntervalTime = 100

const feedsStore = createStore<FeedsState>((setState: Function, getState: Function) => ({
  feedsOptions: {},
  bufferedFeeds: {},
  loadedFeeds: {},
  updatedFeeds: {},
  bufferedFeedsSubplebbitsPostCounts: {},
  feedsHaveMore: {},
  feedsSubplebbitAddressesWithNewerPosts: {},

  async addFeedToStore(
    feedName: string,
    subplebbitAddresses: string[],
    sortType: string,
    account: Account,
    isBufferedFeed?: boolean,
    postsPerPage?: number,
    filter?: CommentsFilter,
    newerThan?: number,
    accountComments?: FeedOptionsAccountComments,
    modQueue?: string[]
  ) {
    // init here because must be called after async accounts store finished initializing
    initializeFeedsStore()

    assert(feedName && typeof feedName === 'string', `feedsStore.addFeedToStore feedName '${feedName}' invalid`)
    assert(Array.isArray(subplebbitAddresses), `addFeedToStore.addFeedToStore subplebbitAddresses '${subplebbitAddresses}' invalid`)
    assert(sortType && typeof sortType === 'string', `addFeedToStore.addFeedToStore sortType '${sortType}' invalid`)
    assert(typeof account?.plebbit?.getSubplebbit === 'function', `addFeedToStore.addFeedToStore account '${account}' invalid`)
    assert(
      typeof isBufferedFeed === 'boolean' || isBufferedFeed === undefined || isBufferedFeed === null,
      `addFeedToStore.addFeedToStore isBufferedFeed '${isBufferedFeed}' invalid`
    )
    assert(!filter || typeof filter?.filter === 'function', `addFeedToStore.addFeedToStore filter.filter '${filter?.filter}' invalid`)
    assert(!filter || typeof filter?.key === 'string', `addFeedToStore.addFeedToStore filter.key '${filter?.key}' invalid`)
    assert(!newerThan || typeof newerThan === 'number', `addFeedToStore.addFeedToStore newerThan '${newerThan}' invalid`)
    postsPerPage = postsPerPage || defaultPostsPerPage
    assert(typeof postsPerPage === 'number', `addFeedToStore.addFeedToStore postsPerPage '${postsPerPage}' invalid`)
    assert(
      !accountComments || typeof accountComments?.newerThan === 'number',
      `addFeedToStore.addFeedToStore accountComments.newerThan '${accountComments?.newerThan}' invalid`
    )
    assert(!modQueue || Array.isArray(modQueue), `addFeedToStore.addFeedToStore modQueue '${modQueue}' invalid`)

    const {feedsOptions, updateFeeds} = getState()
    // feed is in store already, do nothing
    // if the feed already exist but is at page 0, reset it to page 1
    if (feedsOptions[feedName] && feedsOptions[feedName].pageNumber !== 0) {
      return
    }
    // to add a buffered feed, add a feed with pageNumber 0
    const feedOptions = {
      subplebbitAddresses,
      sortType,
      accountId: account.id,
      pageNumber: isBufferedFeed === true ? 0 : 1,
      postsPerPage,
      newerThan,
      filter,
      accountComments,
      // TODO: allow multiple modQueue at once, fow now only use first in array
      modQueue,
    }
    log('feedsActions.addFeedToStore', feedOptions)
    setState(({feedsOptions}: any) => {
      // make sure to never overwrite a feed already added
      if (feedsOptions[feedName] && feedsOptions[feedName].pageNumber !== 0) {
        throw Error(`feedsActions.addFeedToStore feed '${feedName}' already added`)
      }
      return {feedsOptions: {...feedsOptions, [feedName]: feedOptions}}
    })

    addSubplebbitsToSubplebbitsStore(subplebbitAddresses, account)

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
      feedsOptions[feedName].pageNumber * feedsOptions[feedName].postsPerPage <= loadedFeeds[feedName].length,
      `feedsActions.incrementFeedPageNumber cannot increment feed page number before current page has loaded`
    )
    setState(({feedsOptions, loadedFeeds}: any) => {
      // don't increment page number before the current page has loaded
      if (feedsOptions[feedName].pageNumber * feedsOptions[feedName].postsPerPage > loadedFeeds[feedName].length) {
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

  resetFeed(feedName: string) {
    const {feedsOptions, updateFeeds} = getState()
    assert(feedsOptions[feedName], `feedsActions.resetFeed feed name '${feedName}' does not exist in feeds store`)
    assert(feedsOptions[feedName].pageNumber >= 1, `feedsActions.resetFeed cannot reset feed page number '${feedsOptions[feedName].pageNumber}' lower than 1`)
    log('feedsActions.resetFeed', {feedName})

    setState(({feedsOptions, loadedFeeds, updatedFeeds}: any) => {
      const feedOptions = {
        ...feedsOptions[feedName],
        pageNumber: 1,
      }
      return {
        feedsOptions: {...feedsOptions, [feedName]: feedOptions},
        loadedFeeds: {...loadedFeeds, [feedName]: []},
        updatedFeeds: {...updatedFeeds, [feedName]: []},
      }
    })

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

    setTimeout(async () => {
      // get state from all stores
      const previousState = getState()
      const {feedsOptions} = previousState
      const {subplebbits} = subplebbitsStore.getState()
      const {subplebbitsPages} = subplebbitsPagesStore.getState()
      const {accounts} = accountsStore.getState()

      // calculate new feeds
      const filteredSortedFeeds = getFilteredSortedFeeds(feedsOptions, subplebbits, subplebbitsPages, accounts)
      const bufferedFeedsWithoutPreviousLoadedFeeds = getBufferedFeedsWithoutLoadedFeeds(filteredSortedFeeds, previousState.loadedFeeds)
      const loadedFeeds = await getLoadedFeeds(feedsOptions, previousState.loadedFeeds, bufferedFeedsWithoutPreviousLoadedFeeds, accounts)
      // after loaded feeds are caculated, remove new loaded feeds (again) from buffered feeds
      const bufferedFeeds = getBufferedFeedsWithoutLoadedFeeds(bufferedFeedsWithoutPreviousLoadedFeeds, loadedFeeds)
      const bufferedFeedsSubplebbitsPostCounts = getFeedsSubplebbitsPostCounts(feedsOptions, bufferedFeeds)
      const feedsHaveMore = getFeedsHaveMore(feedsOptions, bufferedFeeds, subplebbits, subplebbitsPages, accounts)
      const feedsSubplebbitAddressesWithNewerPosts = getFeedsSubplebbitAddressesWithNewerPosts(
        filteredSortedFeeds,
        loadedFeeds,
        previousState.feedsSubplebbitAddressesWithNewerPosts
      )
      const updatedFeeds = await getUpdatedFeeds(feedsOptions, filteredSortedFeeds, previousState.updatedFeeds, loadedFeeds, accounts)

      // set new feeds
      setState((state: any) => ({bufferedFeeds, loadedFeeds, updatedFeeds, bufferedFeedsSubplebbitsPostCounts, feedsHaveMore, feedsSubplebbitAddressesWithNewerPosts}))
      log.trace('feedsStore.updateFeeds', {
        feedsOptions,
        bufferedFeeds,
        loadedFeeds,
        updatedFeeds,
        bufferedFeedsSubplebbitsPostCounts,
        feedsHaveMore,
        subplebbits,
        subplebbitsPages,
        feedsSubplebbitAddressesWithNewerPosts,
      })

      // TODO: if updateFeeds was called while updateFeedsPending = true, maybe we should recall updateFeeds here
      updateFeedsPending = false
    }, timeUntilNextUpdate)
  },
}))

let feedsStoreInitialized = false
const initializeFeedsStore = async () => {
  if (feedsStoreInitialized) {
    return
  }
  // TODO: optimize subscriptions e.g. updateFeedsOnFeedsSubplebbitsChange(subplebbits)
  // subscribe to subplebbits store changes
  subplebbitsStore.subscribe(updateFeedsOnFeedsSubplebbitsChange)
  // subscribe to bufferedFeedsSubplebbitsPostCounts change
  feedsStore.subscribe(addSubplebbitsPagesOnLowBufferedFeedsSubplebbitsPostCounts)
  // subscribe to subplebbits pages store changes
  subplebbitsPagesStore.subscribe(updateFeedsOnFeedsSubplebbitsPagesChange)
  // subscribe to accounts store change (for blocked addresses)
  accountsStore.subscribe(updateFeedsOnAccountsBlockedAddressesChange)
  // subscribe to accounts store change (for blocked cids)
  accountsStore.subscribe(updateFeedsOnAccountsBlockedCidsChange)
  // subscribe to accounts store changes (for account comments)
  accountsStore.subscribe(updateFeedsOnAccountsCommentsChange)
}

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
  // NOTE: because of this, if an author address is unblocked, feeds won't update until some other event causes a feed update
  if (!_feedsHaveChangedBlockedAddresses) {
    return
  }

  updateFeeds()
}

let previousBlockedCids: string[] = []
let previousAccountsBlockedCids: {[cid: string]: boolean}[] = []
const updateFeedsOnAccountsBlockedCidsChange = (accountsStoreState: any) => {
  const {accounts} = accountsStoreState

  // blocked cids haven't changed, do nothing
  const accountsBlockedCids = []
  for (const i in accounts) {
    accountsBlockedCids.push(accounts[i].blockedCids)
  }
  if (!accountsBlockedCidsChanged(previousAccountsBlockedCids, accountsBlockedCids)) {
    return
  }
  previousAccountsBlockedCids = accountsBlockedCids

  const blockedCids = getAccountsBlockedCids(accounts)

  // blocked cids haven't changed, do nothing
  if (blockedCids.toString() === previousBlockedCids.toString()) {
    return
  }

  const {feedsOptions, updateFeeds, bufferedFeeds} = feedsStore.getState()
  const _feedsHaveChangedBlockedCids = feedsHaveChangedBlockedCids(feedsOptions, bufferedFeeds, blockedCids, previousBlockedCids)
  previousBlockedCids = blockedCids

  // if changed blocked cids arent used in the feeds, do nothing
  // NOTE: because of this, if a cid is unblocked, feeds won't update until some other event causes a feed update
  if (!_feedsHaveChangedBlockedCids) {
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

let previousBufferedFeedsSubplebbitsPostCountsPageCids: string[] = []
let previousBufferedFeedsSubplebbits = new Map<string, Subplebbit>()
let previousBufferedFeedsSubplebbitsPostCounts: FeedsSubplebbitsPostCounts = {}
const addSubplebbitsPagesOnLowBufferedFeedsSubplebbitsPostCounts = (feedsStoreState: any) => {
  const {bufferedFeedsSubplebbitsPostCounts, feedsOptions} = feedsStore.getState()
  const {subplebbits} = subplebbitsStore.getState()

  // if feeds subplebbits have changed, we must try adding them even if buffered posts counts haven't changed
  const bufferedFeedsSubplebbits = getFeedsSubplebbits(feedsOptions, subplebbits)
  const _feedsSubplebbitsChanged = feedsSubplebbitsChanged(previousBufferedFeedsSubplebbits, bufferedFeedsSubplebbits)
  const bufferedFeedsSubplebbitsPostCountsChanged = previousBufferedFeedsSubplebbitsPostCounts !== bufferedFeedsSubplebbitsPostCounts

  // if feeds subplebbits havent changed and buffered posts counts also havent changed, do nothing
  if (!_feedsSubplebbitsChanged && !bufferedFeedsSubplebbitsPostCountsChanged) {
    return
  }
  previousBufferedFeedsSubplebbits = bufferedFeedsSubplebbits
  previousBufferedFeedsSubplebbitsPostCounts = bufferedFeedsSubplebbitsPostCounts

  // in case feeds subplebbit changed, but the first page cids haven't
  const bufferedFeedsSubplebbitsPostCountsPageCids = getFeedsSubplebbitsFirstPageCids(bufferedFeedsSubplebbits)
  const bufferedFeedsSubplebbitsPostCountsPageCidsChanged =
    bufferedFeedsSubplebbitsPostCountsPageCids.toString() !== previousBufferedFeedsSubplebbitsPostCountsPageCids.toString()
  if (!bufferedFeedsSubplebbitsPostCountsPageCidsChanged && !bufferedFeedsSubplebbitsPostCountsChanged) {
    return
  }
  previousBufferedFeedsSubplebbitsPostCountsPageCids = bufferedFeedsSubplebbitsPostCountsPageCids

  const {addNextSubplebbitPageToStore} = subplebbitsPagesStore.getState()
  const {accounts} = accountsStore.getState()

  // bufferedFeedsSubplebbitsPostCounts have changed, check if any of them are low
  for (const feedName in bufferedFeedsSubplebbitsPostCounts) {
    const account = accounts[feedsOptions[feedName].accountId]
    const subplebbitsPostCounts = bufferedFeedsSubplebbitsPostCounts[feedName]
    const {sortType, modQueue} = feedsOptions[feedName]
    for (const subplebbitAddress in subplebbitsPostCounts) {
      // don't fetch more pages if subplebbit address is blocked
      if (account?.blockedAddresses[subplebbitAddress]) {
        continue
      }

      // subplebbit hasn't loaded yet
      if (!subplebbits[subplebbitAddress]) {
        continue
      }

      // if subplebbit posts cache is expired, don't use, wait for next subplebbit update
      if (subplebbitPostsCacheExpired(subplebbits[subplebbitAddress])) {
        continue
      }

      // subplebbit post count is low, fetch next subplebbit page
      if (subplebbitsPostCounts[subplebbitAddress] <= subplebbitPostsLeftBeforeNextPage) {
        addNextSubplebbitPageToStore(subplebbits[subplebbitAddress], sortType, account, modQueue).catch((error: unknown) =>
          log.error('feedsStore subplebbitsActions.addNextSubplebbitPageToStore error', {subplebbitAddress, subplebbit: subplebbits[subplebbitAddress], sortType, error})
        )
      }
    }
  }
}

let previousFeedsSubplebbitsFirstPageCids: string[] = []
let previousFeedsSubplebbits: Map<string, Subplebbit> = new Map()
let previousFeedsSubplebbitsLoadedCount = 0
let previousFeedsSubplebbitsPostsPagesFirstUpdatedAts = ''
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
    // if no new feed subplebbits have loaded, do nothing
    // in case a sub loads with no first page cid and first pages cids don't change, need to trigger hasMore update
    const feedsSubplebbitsLoadedCount = getFeedsSubplebbitsLoadedCount(feedsSubplebbits)
    if (feedsSubplebbitsLoadedCount === previousFeedsSubplebbitsLoadedCount) {
      // if subplebbit.posts.pages haven't changed, do nothing
      const feedsSubplebbitsPostsPagesFirstUpdatedAts = getFeedsSubplebbitsPostsPagesFirstUpdatedAts(feedsSubplebbits)
      if (feedsSubplebbitsPostsPagesFirstUpdatedAts === previousFeedsSubplebbitsPostsPagesFirstUpdatedAts) {
        return
      }

      previousFeedsSubplebbitsPostsPagesFirstUpdatedAts = feedsSubplebbitsPostsPagesFirstUpdatedAts
    }
    previousFeedsSubplebbitsLoadedCount = feedsSubplebbitsLoadedCount
  }

  // feeds subplebbits have changed, update feeds
  previousFeedsSubplebbitsFirstPageCids = feedsSubplebbitsFirstPageCids
  updateFeeds()
}

let previousAccountsCommentsCount = 0
let previousAccountsCommentsCids = ''
const updateFeedsOnAccountsCommentsChange = (accountsStoreState: any) => {
  const {accountsComments} = accountsStoreState
  const accountsCommentsCount = Object.values(accountsComments as Comment[][]).reduce((count, accountComments) => count + accountComments.length, 0)

  // no changes, do nothing
  if (accountsCommentsCount === previousAccountsCommentsCount) {
    // if cids haven't changed (account comments receive cids after pending), do nothing
    const accountsCommentsCids = Object.values(accountsComments as Comment[][]).reduce(
      (cids, accountComments) => cids + String(accountComments.map((comment) => comment.cid || '')),
      ''
    )
    if (accountsCommentsCids === previousAccountsCommentsCids) {
      return
    }
    previousAccountsCommentsCids = accountsCommentsCids
  }
  previousAccountsCommentsCount = accountsCommentsCount

  // TODO: only update the feeds that are relevant to the new accountComment.parentCid/postCid
  feedsStore.getState().updateFeeds()
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
  previousBufferedFeedsSubplebbitsPostCounts = {}
  previousBufferedFeedsSubplebbitsPostCountsPageCids = []
  previousBufferedFeedsSubplebbits = new Map()
  previousBlockedAddresses = []
  previousAccountsBlockedAddresses = []
  previousBlockedCids = []
  previousAccountsBlockedCids = []
  previousFeedsSubplebbitsFirstPageCids = []
  previousFeedsSubplebbits = new Map()
  previousFeedsSubplebbitsLoadedCount = 0
  previousFeedsSubplebbitsPostsPagesFirstUpdatedAts = ''
  previousSubplebbitsPages = {}
  previousAccountsCommentsCount = 0
  previousAccountsCommentsCids = ''
  updateFeedsPending = false
  // destroy all component subscriptions to the store
  feedsStore.destroy()
  // restore original state
  feedsStore.setState(originalState)
  feedsStoreInitialized = false
}

// reset database and store in between tests
export const resetFeedsDatabaseAndStore = async () => {
  await localForageLru.createInstance({name: 'plebbitReactHooks-subplebbitsPages'}).clear()
  await resetFeedsStore()
}

export default feedsStore
