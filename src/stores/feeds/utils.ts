import assert from 'assert'
import {
  Comment,
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
import {subplebbitPostsCacheExpired, commentIsValid} from '../../lib/utils'
import Logger from '@plebbit/plebbit-logger'
const log = Logger('plebbit-react-hooks:feeds:stores')

/**
 * Calculate the feeds from all the loaded subplebbit pages, filter and sort them
 */
export const getFilteredSortedFeeds = (feedsOptions: FeedsOptions, subplebbits: Subplebbits, subplebbitsPages: SubplebbitsPages, accounts: Accounts) => {
  // calculate each feed
  let feeds: Feeds = {}
  for (const feedName in feedsOptions) {
    const {subplebbitAddresses, sortType, accountId, filter, newerThan} = feedsOptions[feedName]
    const newerThanTimestamp = newerThan ? Math.floor(Date.now() / 1000) - newerThan : undefined

    // find all fetched posts
    const bufferedFeedPosts = []

    // add each comment from each page, do not filter at this stage, filter after sorting
    for (const subplebbitAddress of subplebbitAddresses) {
      // subplebbit hasn't loaded yet
      if (!subplebbits[subplebbitAddress]) {
        continue
      }

      // if cache is expired and has internet access, don't use, wait for next subplebbit update
      if (subplebbitPostsCacheExpired(subplebbits[subplebbitAddress]) && window.navigator.onLine) {
        continue
      }

      // use subplebbit preloaded posts if any
      const preloadedPosts = subplebbits[subplebbitAddress].posts?.pages?.[sortType]?.comments
      if (preloadedPosts) {
        for (const post of preloadedPosts) {
          // posts are manually validated, could have fake subplebbitAddress
          if (post.subplebbitAddress !== subplebbitAddress) {
            break
          }
          bufferedFeedPosts.push(post)
        }
      }

      // add all posts from subplebbit pages
      const subplebbitPages = getSubplebbitPages(subplebbits[subplebbitAddress], sortType, subplebbitsPages)
      for (const subplebbitPage of subplebbitPages) {
        if (subplebbitPage?.comments) {
          for (const post of subplebbitPage.comments) {
            // posts are manually validated, could have fake subplebbitAddress
            if (post.subplebbitAddress !== subplebbitAddress) {
              break
            }
            bufferedFeedPosts.push(post)
          }
        }
      }
    }

    // sort the feed before filtering to get more accurate results
    const sortedBufferedFeedPosts = feedSorter.sort(sortType, bufferedFeedPosts)

    // filter the feed
    const filteredSortedBufferedFeedPosts = []
    for (const post of sortedBufferedFeedPosts) {
      // address is blocked
      if (accounts[accountId]?.blockedAddresses[post.subplebbitAddress] || (post.author?.address && accounts[accountId]?.blockedAddresses[post.author.address])) {
        continue
      }

      // comment cid is blocked
      if (accounts[accountId]?.blockedCids[post.cid]) {
        continue
      }

      // if a feed has more than 1 sub, don't include pinned posts
      // TODO: add test to check if pinned are filtered
      if (post.pinned && subplebbitAddresses.length > 1) {
        continue
      }

      // feedOptions filter function
      if (filter && !filter.filter(post)) {
        continue
      }

      // filter posts older than newerThan option
      if (newerThanTimestamp) {
        if (sortType === 'active') {
          if ((post.lastReplyTimestamp || post.timestamp) <= newerThanTimestamp) {
            continue
          }
        } else {
          if (post.timestamp <= newerThanTimestamp) {
            continue
          }
        }
      }

      filteredSortedBufferedFeedPosts.push(post)
    }

    feeds[feedName] = filteredSortedBufferedFeedPosts
  }
  return feeds
}

export const getLoadedFeeds = async (feedsOptions: FeedsOptions, loadedFeeds: Feeds, bufferedFeeds: Feeds, accounts: Accounts) => {
  const loadedFeedsMissingPosts: Feeds = {}
  for (const feedName in feedsOptions) {
    const {pageNumber, postsPerPage} = feedsOptions[feedName]
    const loadedFeedPostCount = pageNumber * postsPerPage
    const currentLoadedFeed = loadedFeeds[feedName] || []
    const missingPostsCount = loadedFeedPostCount - currentLoadedFeed.length

    // get new posts from buffered feed
    const bufferedFeed = bufferedFeeds[feedName] || []

    const missingPosts = []
    for (const post of bufferedFeed) {
      if (missingPosts.length === missingPostsCount) {
        break
      }
      // verify signature
      if (!(await commentIsValid(post, {validateReplies: false}))) {
        continue
      }
      missingPosts.push(post)
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
    let bufferedFeedPostChanged = false
    for (const [i, post] of bufferedFeeds[feedName].entries()) {
      if (loadedFeedsPosts[feedName]?.has(post.cid)) {
        continue
      }
      newBufferedFeeds[feedName].push(post)
      if (
        !bufferedFeedPostChanged &&
        (newBufferedFeeds[feedName][i]?.cid !== bufferedFeeds[feedName][i]?.cid ||
          (newBufferedFeeds[feedName][i]?.updatedAt || 0) > (bufferedFeeds[feedName][i]?.updatedAt || 0))
      ) {
        bufferedFeedPostChanged = true
      }
    }
    if (!bufferedFeedPostChanged && newBufferedFeeds[feedName].length === bufferedFeeds[feedName].length) {
      newBufferedFeeds[feedName] = bufferedFeeds[feedName]
    }
  }
  return newBufferedFeeds
}

export const getUpdatedFeeds = async (feedsOptions: FeedsOptions, filteredSortedFeeds: Feeds, updatedFeeds: Feeds, loadedFeeds: Feeds, accounts: Accounts) => {
  // contruct a list of posts already loaded to remove them from buffered feeds
  const updatedFeedsPosts: {[feedName: string]: {[postCid: string]: any}} = {}
  for (const feedName in updatedFeeds) {
    updatedFeedsPosts[feedName] = {}
    for (const [index, updatedPost] of updatedFeeds[feedName].entries()) {
      updatedFeedsPosts[feedName][updatedPost.cid] = {index, updatedPost}
    }
  }

  const newUpdatedFeeds: Feeds = {...updatedFeeds}
  for (const feedName in filteredSortedFeeds) {
    const updatedFeed = [...(updatedFeeds[feedName] || [])]
    const onlyHasNewPosts = updatedFeed.length === 0
    let updatedFeedChanged = false

    // add new posts from loadedFeed posts
    while (updatedFeed.length < loadedFeeds[feedName].length) {
      updatedFeed[updatedFeed.length] = loadedFeeds[feedName][updatedFeed.length]
      updatedFeedChanged = true
    }

    // add updated post from filteredSortedFeed
    if (!onlyHasNewPosts) {
      for (const post of filteredSortedFeeds[feedName]) {
        if (updatedFeedsPosts[feedName]?.[post.cid]) {
          const {index, updatedPost} = updatedFeedsPosts[feedName][post.cid]
          if ((post.updatedAt || 0) > (updatedPost.updatedAt || 0) && (await commentIsValid(post, {validateReplies: false}))) {
            updatedFeed[index] = post
            updatedFeedChanged = true
          }
        }
      }
    }

    if (updatedFeedChanged) {
      newUpdatedFeeds[feedName] = updatedFeed
    }
  }
  return newUpdatedFeeds
}

// find with subplebbits have posts newer (or ranked higher) than the loaded feeds
// can be used to display "new posts in x, y, z subs" alert, like on twitter
export const getFeedsSubplebbitAddressesWithNewerPosts = (
  filteredSortedFeeds: Feeds,
  loadedFeeds: Feeds,
  previousFeedsSubplebbitAddressesWithNewerPosts: {[feedName: string]: string[]}
) => {
  const feedsSubplebbitAddressesWithNewerPosts: {[feedName: string]: string[]} = {}
  for (const feedName in loadedFeeds) {
    const loadedFeed = loadedFeeds[feedName]
    const cidsInLoadedFeed = new Set()
    for (const post of loadedFeed) {
      cidsInLoadedFeed.add(post.cid)
    }
    const subplebbitAddressesWithNewerPostsSet = new Set<string>()
    for (const [i, post] of filteredSortedFeeds[feedName].entries()) {
      if (i >= loadedFeed.length) {
        break
      }
      // if any post in filteredSortedFeeds ranks higher than the loaded feed count, it's a newer post
      if (!cidsInLoadedFeed.has(post.cid)) {
        subplebbitAddressesWithNewerPostsSet.add(post.subplebbitAddress)
      }
    }
    const subplebbitAddressesWithNewerPosts = [...subplebbitAddressesWithNewerPostsSet]

    // don't update the array if the data is the same to avoid rerenders
    const previousSubplebbitAddressesWithNewerPosts = previousFeedsSubplebbitAddressesWithNewerPosts[feedName] || []
    if (
      subplebbitAddressesWithNewerPosts.length === previousSubplebbitAddressesWithNewerPosts.length &&
      subplebbitAddressesWithNewerPosts.toString() === previousSubplebbitAddressesWithNewerPosts.toString()
    ) {
      feedsSubplebbitAddressesWithNewerPosts[feedName] = previousFeedsSubplebbitAddressesWithNewerPosts[feedName]
    } else {
      feedsSubplebbitAddressesWithNewerPosts[feedName] = subplebbitAddressesWithNewerPosts
    }
  }
  return feedsSubplebbitAddressesWithNewerPosts
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
 * Get which feeds have more posts, i.e. have not reached the final page of all subs
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
      if (accounts[accountId]?.blockedAddresses[subplebbitAddress]) {
        continue subplebbitAddressesLoop
      }

      const subplebbit = subplebbits[subplebbitAddress]
      // if at least 1 subplebbit hasn't loaded yet, then the feed still has more
      if (!subplebbit?.updatedAt) {
        feedsHaveMore[feedName] = true
        continue feedsLoop
      }

      // if at least 1 subplebbit has posts cache expired, then the feed still has more
      if (subplebbitPostsCacheExpired(subplebbit)) {
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

// get all subplebbits posts pages first post updatedAts, use to check if a subplebbitsStore change should trigger updateFeeds
export const getFeedsSubplebbitsPostsPagesFirstUpdatedAts = (feedsSubplebbits: Map<string, Subplebbit>): string => {
  let feedsSubplebbitsPostsPagesFirstUpdatedAts = ''
  for (const subplebbit of feedsSubplebbits.values()) {
    for (const page of Object.values<SubplebbitPage>(subplebbit?.posts?.pages || {})) {
      if (page?.comments?.[0]?.updatedAt) {
        feedsSubplebbitsPostsPagesFirstUpdatedAts += page.comments[0].cid + page.comments[0].updatedAt
      }
    }
  }
  return feedsSubplebbitsPostsPagesFirstUpdatedAts
}

// get number of feeds subplebbit that are loaded
export const getFeedsSubplebbitsLoadedCount = (feedsSubplebbits: Map<string, Subplebbit>): number => {
  let count = 0
  for (const subplebbit of feedsSubplebbits.values()) {
    if (subplebbit?.updatedAt) {
      count++
    }
  }
  return count
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
  // NOTE: because of this, if an author address is unblocked, feeds won't update until some other event causes a feed update
  // it seems preferable to causing unnecessary rerenders every time an unused block event occurs
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

export const getAccountsBlockedCids = (accounts: Accounts) => {
  const blockedCidsSet = new Set<string>()
  for (const {blockedCids} of Object.values(accounts)) {
    for (const address in blockedCids) {
      if (blockedCids[address]) {
        blockedCidsSet.add(address)
      }
    }
  }
  return [...blockedCidsSet].sort()
}

export const accountsBlockedCidsChanged = (previousAccountsBlockedCids: {[address: string]: boolean}[], accountsBlockedCids: {[address: string]: boolean}[]) => {
  if (previousAccountsBlockedCids.length !== accountsBlockedCids.length) {
    return true
  }
  for (const i in previousAccountsBlockedCids) {
    // check if the object is still the same
    if (previousAccountsBlockedCids[i] !== accountsBlockedCids[i]) {
      return true
    }
  }
  return false
}

export const feedsHaveChangedBlockedCids = (feedsOptions: FeedsOptions, bufferedFeeds: Feeds, blockedCids: string[], previousBlockedCids: string[]) => {
  // find the difference between current and previous blocked addresses
  const changedBlockedCids = blockedCids.filter((x) => !previousBlockedCids.includes(x)).concat(previousBlockedCids.filter((x) => !blockedCids.includes(x)))

  // feeds posts author addresses have a changed blocked address
  // NOTE: because of this, if a cid is unblocked, feeds won't update until some other event causes a feed update
  // it seems preferable to causing unnecessary rerenders every time an unused block event occurs
  const changedBlockedCidsSet = new Set(changedBlockedCids)
  for (const feedName in bufferedFeeds) {
    for (const post of bufferedFeeds[feedName] || []) {
      if (post?.cid && changedBlockedCidsSet.has(post?.cid)) {
        return true
      }
    }
  }

  return false
}
