import assert from 'assert'
import Debug from 'debug'
const debug = Debug('plebbit-react-hooks:stores:feeds')
import {Feed, Feeds, Subplebbits, Account, FeedsOptions, SubplebbitPage} from '../../types'
import createStore from 'zustand'
import localForageLru from '../../lib/localforage-lru'
import subplebbitsStore from '../subplebbits'

// reddit loads approximately 25 posts per page
// while infinite scrolling
const postsPerPage = 25

// reset all event listeners in between tests
export const listeners: any = []

type FeedsState = {
  feedsOptions: FeedsOptions
  bufferedFeeds: Feeds
  bufferedPostsCounts: {[subplebbitAddressAndSortType: string]: number}
  loadedFeeds: Feeds
  addFeedToStore: Function
  incrementFeedPageNumber: Function
  updateFeeds: Function
}

const useFeedsStore = createStore<FeedsState>((setState: Function, getState: Function) => ({
  feedsOptions: {},
  bufferedFeeds: {},
  bufferedPostsCounts: {},
  loadedFeeds: {},

  async addFeedToStore(feedName: string, subplebbitAddresses: string[], sortType: string, account: Account, isBufferedFeed?: boolean) {
    assert(feedName && typeof feedName === 'string', `feedsStore.addFeedToStore feedName '${feedName}' invalid`)
    assert(Array.isArray(subplebbitAddresses), `addFeedToStore.addFeedToStore subplebbitAddresses '${subplebbitAddresses}' invalid`)
    assert(sortType && typeof sortType === 'string', `addFeedToStore.addFeedToStore sortType '${sortType}' invalid`)
    assert(account?.plebbit && typeof account?.plebbit === 'object', `addFeedToStore.addFeedToStore account '${account}' invalid`)
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
    subplebbitsStore.subscribe(updateFeedsOnSubplebbitsStoreChange)

    // subscribe to subplebbits pages store changes

    // subscribe to bufferedPostsCounts change

    // subscribe to page number change
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
  updateFeeds() {},
}))

let previousFeedsSubplebbitsFirstPageCids: string[] = []
const updateFeedsOnSubplebbitsStoreChange = (subplebbitStoreState: any) => {
  const {subplebbits} = subplebbitStoreState
  const {feedsOptions, updateFeeds} = useFeedsStore.getState()

  const feedsSubplebbitsFirstPageCids = getFeedsSubplebbitsFirstPageCids(feedsOptions, subplebbits)

  // feeds subplebbits haven't changed, do nothing
  if (feedsSubplebbitsFirstPageCids.toString() === previousFeedsSubplebbitsFirstPageCids.toString()) {
    return
  }

  // feeds subplebbits have changed, update feeds
  previousFeedsSubplebbitsFirstPageCids = feedsSubplebbitsFirstPageCids
  updateFeeds()
}

const getFeedsSubplebbitsFirstPageCids = (feedsOptions: FeedsOptions, subplebbits: Subplebbits): string[] => {
  // find all feeds subplebbits
  const feedNames = Object.keys(feedsOptions)
  const feedsSubplebbitAddresses = new Set<string>()
  Object.keys(feedsOptions).forEach((i) => feedsOptions[i].subplebbitAddresses.forEach(feedsSubplebbitAddresses.add))

  // find all the feeds subplebbits first page cids
  const feedsSubplebbitsFirstPageCids = new Set<string>()
  for (const subplebbitAddress of feedsSubplebbitAddresses) {
    const subplebbit = subplebbits[subplebbitAddress]
    if (!subplebbit?.posts) {
      continue
    }

    // check pages
    if (subplebbit.posts.pages) {
      for (const page of Object.values<SubplebbitPage>(subplebbit.posts.pages)) {
        if (page?.nextCid) {
          feedsSubplebbitsFirstPageCids.add(page?.nextCid)
        }
      }
    }

    // check pageCids
    if (subplebbit.posts.pageCids) {
      for (const pageCid of Object.values<string>(subplebbit.posts.pageCids)) {
        if (pageCid) {
          feedsSubplebbitsFirstPageCids.add(pageCid)
        }
      }
    }
  }

  return [...feedsSubplebbitsFirstPageCids].sort()
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
