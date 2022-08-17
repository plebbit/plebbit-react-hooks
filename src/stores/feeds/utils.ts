import assert from 'assert'
import {Feed, Feeds, FeedsOptions, Subplebbits, Account, Accounts, SubplebbitPage, SubplebbitsPages, FeedsSubplebbitsPostCounts} from '../../types'
import {getSubplebbitPages} from '../subplebbits-pages'
import feedSorter from './feed-sorter'
import {postsPerPage} from './feeds-store'

/**
 * Calculate the final buffered feeds from all the loaded subplebbit pages, sort them,
 * and remove the posts already loaded in loadedFeeds
 */
export const getBufferedFeeds = (feedsOptions: FeedsOptions, loadedFeeds: Feeds, subplebbits: Subplebbits, subplebbitsPages: SubplebbitsPages, accounts: Accounts) => {
  console.log('getBufferedFeeds', {feedsOptions, loadedFeeds, subplebbits, subplebbitsPages, accounts})

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
    const {subplebbitAddresses, sortType, account} = feedsOptions[feedName]

    // find all fetched posts
    const bufferedFeedPosts = []

    // add each comment from each page, do not filter at this stage, filter after sorting
    for (const subplebbitAddress of subplebbitAddresses) {
      let firstPageCid = subplebbits[subplebbitAddress]?.posts?.pageCids?.[sortType]

      // use subplebbit preloaded posts if any
      const preloadedPosts = subplebbits[subplebbitAddress]?.posts?.pages?.[sortType]?.comments
      if (preloadedPosts) {
        bufferedFeedPosts.push(...preloadedPosts)
        const preloadedPostsNextPageCid = subplebbits[subplebbitAddress]?.posts?.pages?.[sortType]?.nextCid
        if (preloadedPostsNextPageCid) {
          firstPageCid = preloadedPostsNextPageCid
        }
      }

      // subplebbit has no first page cid
      if (!firstPageCid) {
        continue
      }

      // add all posts from subplebbit pages
      const subplebbitPages = getSubplebbitPages(firstPageCid, subplebbitsPages)

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

      // don't use feedOption 'account' because it doesn't contain updated blocked addresses
      if (accounts[account.id].blockedAddresses[post.subplebbitAddress] || (post.author?.address && accounts[account.id].blockedAddresses[post.author.address])) {
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

export const getFeedsHaveMore = () => {
  return {}
}

// function useCalculatedBufferedFeeds(
//   feedsOptions: FeedsOptions,
//   subplebbitsPostsInfo: SubplebbitsPostsInfo,
//   subplebbitsPages: SubplebbitsPages,
//   loadedFeeds: Feeds,
//   accounts: Accounts
// ) {
//   // recalculate feeds if accounts blocked addresses change
//   const accountsBlockedAddresses: {[accountId: string]: {[address: string]: boolean}} = {}
//   for (const accountId in accounts) {
//     accountsBlockedAddresses[accountId] = accounts[accountId].blockedAddresses
//   }
//   const accountsBlockedAddressesString = JSON.stringify(accountsBlockedAddresses)

//   return useMemo(() => {
//     // contruct a list of posts already loaded to remove them from buffered feeds
//     const loadedFeedsPosts: {[key: string]: Set<string>} = {}
//     for (const feedName in loadedFeeds) {
//       loadedFeedsPosts[feedName] = new Set()
//       for (const post of loadedFeeds[feedName]) {
//         loadedFeedsPosts[feedName].add(post.cid)
//       }
//     }

//     // calculate each feed
//     let newBufferedFeeds: Feeds = {}
//     for (const feedName in feedsOptions) {
//       const {subplebbitAddresses, sortType, account} = feedsOptions[feedName]

//       // find all fetched posts
//       const bufferedFeedPosts = []

//       // start by finding all pageCids
//       for (const subplebbitAddress of subplebbitAddresses) {
//         for (const infoName in subplebbitsPostsInfo) {
//           const info = subplebbitsPostsInfo[infoName]
//           if (info.sortType !== sortType) {
//             continue
//           }
//           if (info.subplebbitAddress !== subplebbitAddress) {
//             continue
//           }

//           // found an info that matches the sub address and sort type
//           // get all the pages for it from subplebbitsPages
//           const subplebbitPages = getSubplebbitPages(info.firstPageCid, subplebbitsPages)

//           // add each comment from each page, do not filter at this stage, filter after sorting
//           for (const subplebbitPage of subplebbitPages) {
//             if (subplebbitPage?.comments) {
//               bufferedFeedPosts.push(...subplebbitPage.comments)
//             }
//           }
//         }
//       }

//       // sort the feed before filtering to get more accurate results
//       const sortedBufferedFeedPosts = feedSorter.sort(sortType, bufferedFeedPosts)

//       // filter the feed
//       const filteredSortedBufferedFeedPosts = []
//       for (const post of sortedBufferedFeedPosts) {
//         // don't add posts already loaded in loaded feeds
//         if (loadedFeedsPosts[feedName]?.has(post.cid)) {
//           continue
//         }

//         // don't use feedOption 'account' because it doesn't contain updated blocked addresses
//         if (accounts[account.id].blockedAddresses[post.subplebbitAddress] || (post.author?.address && accounts[account.id].blockedAddresses[post.author.address])) {
//           continue
//         }

//         filteredSortedBufferedFeedPosts.push(post)
//       }

//       newBufferedFeeds[feedName] = filteredSortedBufferedFeedPosts
//     }
//     return newBufferedFeeds
//   }, [feedsOptions, subplebbitsPages, loadedFeeds, accountsBlockedAddressesString])
// }

// get all subplebbits pages cids of all feeds, use to check if a subplebbitsStore change should trigger updateFeeds
export const getFeedsSubplebbitsFirstPageCids = (feedsOptions: FeedsOptions, subplebbits: Subplebbits): string[] => {
  // find all feeds subplebbits
  const feedNames = Object.keys(feedsOptions)
  const feedsSubplebbitAddresses = new Set<string>()
  Object.keys(feedsOptions).forEach((i) => feedsOptions[i].subplebbitAddresses.forEach((a) => feedsSubplebbitAddresses.add(a)))

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
