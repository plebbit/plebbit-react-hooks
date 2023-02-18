import assert from 'assert'
import {
  Feed,
  Feeds,
  FeedOptions,
  FeedsOptions,
  Subplebbit,
  Subplebbits,
  Account,
  Accounts,
  SubplebbitPage,
  SubplebbitsPages,
  FeedsSubplebbitsPostCounts,
} from '../../types'
import {getSubplebbitPages, getSubplebbitFirstPageCid} from '../subplebbits-pages'
import feedSorter from './feed-sorter'
import {postsPerPage} from './feeds-store'

/**
 * Calculate the final buffered feeds from all the loaded subplebbit pages, sort them,
 * and remove the posts already loaded in loadedFeeds
 */
export const getBufferedFeeds = (feedsOptions: FeedsOptions, loadedFeeds: Feeds, subplebbits: Subplebbits, subplebbitsPages: SubplebbitsPages, accounts: Accounts) => {
  // contruct a list of posts already loaded to remove them from buffered feeds
  const loadedFeedsPosts: {[key: string]: Set<string>} = {}
  for (const feedName in loadedFeeds) {
    loadedFeedsPosts[feedName] = new Set()
    for (const post of loadedFeeds[feedName]) {
      loadedFeedsPosts[feedName].add(post.cid)
    }
  }

  // calculate each feed
  let newBufferedFeeds: Feeds = {}
  for (const feedName in feedsOptions) {
    const {subplebbitAddresses, sortType, accountId} = feedsOptions[feedName]

    // find all fetched posts
    const bufferedFeedPosts = []

    // add each comment from each page, do not filter at this stage, filter after sorting
    for (const subplebbitAddress of subplebbitAddresses) {
      // subplebbit hasn't loaded yet
      if (!subplebbits[subplebbitAddress]) {
        continue
      }

      // use subplebbit preloaded posts if any
      const preloadedPosts = subplebbits[subplebbitAddress].posts?.pages?.[sortType]?.comments
      if (preloadedPosts) {
        bufferedFeedPosts.push(...preloadedPosts)
      }

      // add all posts from subplebbit pages
      const subplebbitPages = getSubplebbitPages(subplebbits[subplebbitAddress], sortType, subplebbitsPages)
      for (const subplebbitPage of subplebbitPages) {
        if (subplebbitPage?.comments) {
          bufferedFeedPosts.push(...subplebbitPage.comments)
        }
      }
    }

    // sort the feed before filtering to get more accurate results
    const sortedBufferedFeedPosts = feedSorter.sort(sortType, bufferedFeedPosts)

    // filter the feed
    const filteredSortedBufferedFeedPosts = []
    for (const post of sortedBufferedFeedPosts) {
      // don't add posts already loaded in loaded feeds
      if (loadedFeedsPosts[feedName]?.has(post.cid)) {
        continue
      }

      if (accounts[accountId].blockedAddresses[post.subplebbitAddress] || (post.author?.address && accounts[accountId].blockedAddresses[post.author.address])) {
        continue
      }

      // if a feed has more than 1 sub, don't include pinned posts
      // TODO: add test to check if pinned are filtered
      if (post.pinned && subplebbitAddresses.length > 1) {
        continue
      }

      filteredSortedBufferedFeedPosts.push(post)
    }

    newBufferedFeeds[feedName] = filteredSortedBufferedFeedPosts
  }
  return newBufferedFeeds
}

export const getLoadedFeeds = (feedsOptions: FeedsOptions, loadedFeeds: Feeds, bufferedFeeds: Feeds) => {
  const loadedFeedsMissingPosts: Feeds = {}
  for (const feedName in feedsOptions) {
    const {pageNumber} = feedsOptions[feedName]
    const loadedFeedPostCount = pageNumber * postsPerPage
    const currentLoadedFeed = loadedFeeds[feedName] || []
    const missingPostsCount = loadedFeedPostCount - currentLoadedFeed.length

    // get new posts from buffered feed
    const bufferedFeed = bufferedFeeds[feedName] || []
    const missingPosts = [...bufferedFeed]
    if (missingPosts.length > missingPostsCount) {
      missingPosts.length = missingPostsCount
    }

    // TODO: update posts in already loaded feeds with new votes and reply counts

    // the current loaded feed already exist and doesn't need new posts
    if (missingPosts.length === 0 && loadedFeeds[feedName]) {
      continue
    }
    loadedFeedsMissingPosts[feedName] = missingPosts
  }
  // do nothing if there are no missing posts
  if (Object.keys(loadedFeedsMissingPosts).length === 0) {
    return loadedFeeds
  }
  const newLoadedFeeds: Feeds = {}
  for (const feedName in loadedFeedsMissingPosts) {
    newLoadedFeeds[feedName] = [...(loadedFeeds[feedName] || []), ...loadedFeedsMissingPosts[feedName]]
  }
  return {...loadedFeeds, ...newLoadedFeeds}
}

export const getBufferedFeedsWithoutLoadedFeeds = (bufferedFeeds: Feeds, loadedFeeds: Feeds) => {
  // contruct a list of posts already loaded to remove them from buffered feeds
  const loadedFeedsPosts: {[key: string]: Set<string>} = {}
  for (const feedName in loadedFeeds) {
    loadedFeedsPosts[feedName] = new Set()
    for (const post of loadedFeeds[feedName]) {
      loadedFeedsPosts[feedName].add(post.cid)
    }
  }

  const newBufferedFeeds: Feeds = {}
  for (const feedName in bufferedFeeds) {
    newBufferedFeeds[feedName] = []
    for (const post of bufferedFeeds[feedName]) {
      if (loadedFeedsPosts[feedName]?.has(post.cid)) {
        continue
      }
      newBufferedFeeds[feedName].push(post)
    }
  }
  return newBufferedFeeds
}

// find how many posts are left in each subplebbits in a buffereds feeds
export const getFeedsSubplebbitsPostCounts = (feedsOptions: FeedsOptions, feeds: Feeds) => {
  const feedsSubplebbitsPostCounts: FeedsSubplebbitsPostCounts = {}
  for (const feedName in feedsOptions) {
    feedsSubplebbitsPostCounts[feedName] = {}
    for (const subplebbitAddress of feedsOptions[feedName].subplebbitAddresses) {
      feedsSubplebbitsPostCounts[feedName][subplebbitAddress] = 0
    }
    for (const comment of feeds[feedName] || []) {
      feedsSubplebbitsPostCounts[feedName][comment.subplebbitAddress]++
    }
  }
  return feedsSubplebbitsPostCounts
}

/**
 * Get which feeds have more posts, i.e. have no reached the final page of all subs
 */
export const getFeedsHaveMore = (feedsOptions: FeedsOptions, bufferedFeeds: Feeds, subplebbits: Subplebbits, subplebbitsPages: SubplebbitsPages, accounts: Accounts) => {
  const feedsHaveMore: {[feedName: string]: boolean} = {}
  feedsLoop: for (const feedName in feedsOptions) {
    // if the feed still has buffered posts, then it still has more
    if (bufferedFeeds[feedName]?.length) {
      feedsHaveMore[feedName] = true
      continue feedsLoop
    }

    const {subplebbitAddresses, sortType, accountId} = feedsOptions[feedName]
    subplebbitAddressesLoop: for (const subplebbitAddress of subplebbitAddresses) {
      // don't consider the sub if the address is blocked
      if (accounts[accountId].blockedAddresses[subplebbitAddress]) {
        continue subplebbitAddressesLoop
      }

      const subplebbit = subplebbits[subplebbitAddress]
      // if at least 1 subplebbit hasn't loaded yet, then the feed still has more
      if (!subplebbit) {
        feedsHaveMore[feedName] = true
        continue feedsLoop
      }
      const firstPageCid = getSubplebbitFirstPageCid(subplebbit, sortType)
      // TODO: if a loaded subplebbit doesn't have a first page, it's unclear what we should do
      // should we try to use another sort type by default, like 'hot', or should we just ignore it?
      // 'continue' to ignore it for now
      if (!firstPageCid) {
        continue subplebbitAddressesLoop
      }
      const pages = getSubplebbitPages(subplebbit, sortType, subplebbitsPages)
      // if first page isn't loaded yet, then the feed still has more
      if (!pages.length) {
        feedsHaveMore[feedName] = true
        continue feedsLoop
      }
      const lastPage = pages[pages.length - 1]
      if (lastPage.nextCid) {
        feedsHaveMore[feedName] = true
        continue feedsLoop
      }
    }

    // if buffered feeds are empty and no last page of any subplebbit has a next page, then has more is false
    feedsHaveMore[feedName] = false
  }
  return feedsHaveMore
}

// get a partial updateFeeds after a page increment
export const getFeedAfterIncrementPageNumber = (
  feedName: string,
  feedOptions: FeedOptions,
  bufferedFeed: Feed,
  loadedFeed: Feed,
  subplebbits: Subplebbits,
  subplebbitsPages: SubplebbitsPages,
  accounts: Accounts
) => {
  // transform arguments into objects
  const feedsOptions = {[feedName]: feedOptions}
  const bufferedFeedsWithLoadedFeeds = {[feedName]: bufferedFeed}
  const previousLoadedFeeds = {[feedName]: loadedFeed}

  // calculate values
  const loadedFeeds = getLoadedFeeds(feedsOptions, previousLoadedFeeds, bufferedFeedsWithLoadedFeeds)
  // after loaded feeds are caculated, remove loaded feeds again from buffered feeds
  const bufferedFeeds = getBufferedFeedsWithoutLoadedFeeds(bufferedFeedsWithLoadedFeeds, loadedFeeds)
  const bufferedFeedsSubplebbitsPostCounts = getFeedsSubplebbitsPostCounts(feedsOptions, bufferedFeeds)
  const feedsHaveMore = getFeedsHaveMore(feedsOptions, bufferedFeeds, subplebbits, subplebbitsPages, accounts)

  // transform values back into single properties
  return {
    bufferedFeed: bufferedFeeds[feedName],
    loadedFeed: loadedFeeds[feedName],
    bufferedFeedSubplebbitsPostCounts: bufferedFeedsSubplebbitsPostCounts[feedName],
    feedHasMore: feedsHaveMore[feedName],
  }
}

// get all subplebbits pages cids of all feeds, use to check if a subplebbitsStore change should trigger updateFeeds
export const getFeedsSubplebbits = (feedsOptions: FeedsOptions, subplebbits: Subplebbits) => {
  // find all feeds subplebbits
  const feedsSubplebbitAddresses = new Set<string>()
  Object.keys(feedsOptions).forEach((i) => feedsOptions[i].subplebbitAddresses.forEach((a) => feedsSubplebbitAddresses.add(a)))

  // use map for performance increase when checking size
  const feedsSubplebbits = new Map<string, Subplebbit>()
  for (const subplebbitAddress of feedsSubplebbitAddresses) {
    feedsSubplebbits.set(subplebbitAddress, subplebbits[subplebbitAddress])
  }
  return feedsSubplebbits
}

export const feedsSubplebbitsChanged = (previousFeedsSubplebbits: Map<string, Subplebbit>, feedsSubplebbits: Map<string, Subplebbit>) => {
  if (previousFeedsSubplebbits.size !== feedsSubplebbits.size) {
    return true
  }
  for (let subplebbitAddress of previousFeedsSubplebbits.keys()) {
    // check if the object is still the same
    if (previousFeedsSubplebbits.get(subplebbitAddress) !== feedsSubplebbits.get(subplebbitAddress)) {
      return true
    }
  }
  return false
}

// get all subplebbits pages cids of all feeds, use to check if a subplebbitsStore change should trigger updateFeeds
export const getFeedsSubplebbitsFirstPageCids = (feedsSubplebbits: Map<string, Subplebbit>): string[] => {
  // find all the feeds subplebbits first page cids
  const feedsSubplebbitsFirstPageCids = new Set<string>()
  for (const subplebbit of feedsSubplebbits.values()) {
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

export const getAccountsBlockedAddresses = (accounts: Accounts) => {
  const blockedAddressesSet = new Set<string>()
  for (const {blockedAddresses} of Object.values(accounts)) {
    for (const address in blockedAddresses) {
      if (blockedAddresses[address]) {
        blockedAddressesSet.add(address)
      }
    }
  }
  return [...blockedAddressesSet].sort()
}

export const accountsBlockedAddressesChanged = (
  previousAccountsBlockedAddresses: {[address: string]: boolean}[],
  accountsBlockedAddresses: {[address: string]: boolean}[]
) => {
  if (previousAccountsBlockedAddresses.length !== accountsBlockedAddresses.length) {
    return true
  }
  for (const i in previousAccountsBlockedAddresses) {
    // check if the object is still the same
    if (previousAccountsBlockedAddresses[i] !== accountsBlockedAddresses[i]) {
      return true
    }
  }
  return false
}

export const feedsHaveChangedBlockedAddresses = (feedsOptions: FeedsOptions, bufferedFeeds: Feeds, blockedAddresses: string[], previousBlockedAddresses: string[]) => {
  // find the difference between current and previous blocked addresses
  const changedBlockedAddresses = blockedAddresses
    .filter((x) => !previousBlockedAddresses.includes(x))
    .concat(previousBlockedAddresses.filter((x) => !blockedAddresses.includes(x)))

  // if changed blocked addresses arent used in the feeds, do nothing
  const feedsSubplebbitAddresses = new Set<string>()
  Object.keys(feedsOptions).forEach((i) => feedsOptions[i].subplebbitAddresses.forEach((a) => feedsSubplebbitAddresses.add(a)))
  for (const address of changedBlockedAddresses) {
    // a changed address is used in the feed, update feeds
    if (feedsSubplebbitAddresses.has(address)) {
      return true
    }
  }

  // feeds posts author addresses have a changed blocked address
  const changedBlockedAddressesSet = new Set(changedBlockedAddresses)
  for (const feedName in bufferedFeeds) {
    for (const post of bufferedFeeds[feedName] || []) {
      if (post?.author?.address && changedBlockedAddressesSet.has(post.author.address)) {
        return true
      }
    }
  }

  return false
}
