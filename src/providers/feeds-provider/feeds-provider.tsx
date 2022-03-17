import React, { useState, useEffect, useContext, useMemo } from 'react'
import {SubplebbitsContext} from '../subplebbits-provider'
import validator from '../../lib/validator'
import feedSorter from './feed-sorter'
import assert from 'assert'
import localForageLru from '../../lib/localforage-lru'
import Debug from 'debug'
const debug = Debug('plebbitreacthooks:providers:feedsprovider')
import {Props, Feed, Feeds, Subplebbits, Account, Accounts, SortedPostsPages, SortedPostsPagesInfo, FeedsSortedPostsInfo, FeedsOptions, SortedComments} from '../../types'

const sortedPostsDatabase = localForageLru.createInstance({ name: 'sortedPosts', size: 500 })

type FeedsContext = any

// reddit loads approximately 25 posts per page
// while infinite scrolling
const postsPerPage = 25
// keep large buffer because fetching cids is slow
const subplebbitPostsLeftBeforeNextPage = 50

export const FeedsContext = React.createContext<FeedsContext | undefined>(undefined)

export default function FeedsProvider(props: Props): JSX.Element | null {
  const [feedsOptions, setFeedsOptions] = useState<FeedsOptions>({})
  const [bufferedFeeds, setBufferedFeeds] = useState<Feeds>({})
  const [loadedFeeds, setLoadedFeeds] = useState<Feeds>({})

  // fetch subplebbits, sorted posts and next pages whenever bufferedFeeds gets too low
  const subplebbits = useSubplebbits(feedsOptions)
  const feedsSortedPostsInfo = useFeedsSortedPostsInfo(feedsOptions, subplebbits, bufferedFeeds)
  const sortedPostsPages = useSortedPostsPages(feedsSortedPostsInfo, subplebbits)
  const calculatedBufferedFeeds = useCalculatedBufferedFeeds(feedsOptions, feedsSortedPostsInfo, sortedPostsPages, loadedFeeds)
  const feedsHaveMore = useFeedsHaveMore(feedsOptions, subplebbits, sortedPostsPages, bufferedFeeds)

  // handle buffered feeds
  useEffect(() => {
    // don't rerender if there are no feeds
    if (Object.keys(calculatedBufferedFeeds).length === 0) {
      return
    }
    setBufferedFeeds(calculatedBufferedFeeds)
  }, [calculatedBufferedFeeds])

  // handle loaded feeds
  useEffect(() => {
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
    // don't rerender if there are no missing posts
    if (Object.keys(loadedFeedsMissingPosts).length === 0) {
      return
    }
    setLoadedFeeds(previousLoadedFeeds => {
      const newLoadedFeeds: Feeds = {}
      for (const feedName in loadedFeedsMissingPosts) {
        newLoadedFeeds[feedName] = [...previousLoadedFeeds[feedName] || [], ...loadedFeedsMissingPosts[feedName]]
      }
      return {...previousLoadedFeeds, ...newLoadedFeeds}
    })
  }, [bufferedFeeds, feedsOptions])

  const feedsActions: {[key: string]: Function} = {}

  feedsActions.addFeedToContext = (feedName: string, subplebbitAddresses: string[], sortType: string, account: Account, isBufferedFeed?: boolean) => {
    // feed is in context already, do nothing
    // if the feed already exist but is at page 1, reset it to page 1
    if (feedsOptions[feedName] && feedsOptions[feedName].pageNumber !== 0) {
      return
    }
    // to add a buffered feed, add a feed with pageNumber 0
    const feedOptions = {subplebbitAddresses, sortType, account, pageNumber: isBufferedFeed === true ? 0 : 1}
    debug('feedsActions.addFeedToContext', feedOptions)
    setFeedsOptions(previousFeedsOptions => {
      // make sure to never overwrite a feed already added
      if (previousFeedsOptions[feedName]) {
        return previousFeedsOptions
      }
      return {...previousFeedsOptions, [feedName]: feedOptions}
    })
  }

  feedsActions.incrementFeedPageNumber = (feedName: string) => {
    assert(feedsOptions[feedName], `feedsActions.incrementFeedPageNumber feed name '${feedName}' does not exist in FeedsContext`)
    // assert(feedsOptions[feedName].pageNumber * postsPerPage <= loadedFeeds[feedName].length, `feedsActions.incrementFeedPageNumber cannot increment feed page number before current page has loaded`)
    debug('feedsActions.incrementFeedPageNumber', {feedName})
    setFeedsOptions(previousFeedsOptions => {
      assert(previousFeedsOptions[feedName].pageNumber * postsPerPage <= loadedFeeds[feedName].length, `feedsActions.incrementFeedPageNumber cannot increment feed page number before current page has loaded`)
      const feedOptions = {...previousFeedsOptions[feedName], pageNumber: previousFeedsOptions[feedName].pageNumber + 1}
      return {...previousFeedsOptions, [feedName]: feedOptions}
    })
  }

  if (!props.children) {
    return null
  }

  const feedsContext: FeedsContext = {
    bufferedFeeds,
    loadedFeeds,
    feedsActions,
    feedsHaveMore
  }

  // debug util
  const bufferedFeedsLengths = useFeedsLengths(bufferedFeeds)
  const loadedFeedsLengths = useFeedsLengths(loadedFeeds)
  debug({ feedsOptions, feedsHaveMore, feedsSortedPostsInfo, sortedPostsPages, bufferedFeedsLengths, loadedFeedsLengths })
  return <FeedsContext.Provider value={feedsContext}>{props.children}</FeedsContext.Provider>
}

/**
 * Debug util
 */
function useFeedsLengths(feeds: Feeds) {
  return useMemo(() => {
    const feedsLengths: {[key: string]: number} = {}
    for (const feedName in feeds) {
      if (feeds[feedName]) {
        feedsLengths[feedName] = feeds[feedName].length || 0
      }
    }
    return feedsLengths
  }, [feeds])
}

/**
 * Generate a list of `feedSortedPostsInfo` objects which contain the information required
 * to initiate fetching the pages of each subplebbit/sort/account/feed
 */
function useFeedsHaveMore(feedsOptions: FeedsOptions, subplebbits: Subplebbits, sortedPostsPages: SortedPostsPages, bufferedFeeds: Feeds) {
  return useMemo(() => {
    const feedsHaveMore: {[key: string]: boolean} = {}
    feedsLoop: for (const feedName in feedsOptions) {
      // if the feed still has buffered posts, then it still has more
      if (bufferedFeeds[feedName]?.length) {
        feedsHaveMore[feedName] = true
        continue
      }

      const {subplebbitAddresses, sortType} = feedsOptions[feedName]
      for (const subplebbitAddress of subplebbitAddresses) {
        const subplebbit = subplebbits[subplebbitAddress]
        // if at least 1 subplebbit hasn't loaded yet, then the feed still has more
        if (!subplebbit) {
          feedsHaveMore[feedName] = true
          continue feedsLoop
        }
        const firstPageSortedPostsCid = subplebbit.sortedPostsCids?.[sortType]
        // TODO: if a loaded subplebbit doesn't have a first page, it's unclear what we should do
        // should we try to use another sort type by default, like 'hot', or should we just ignore it?
        // 'continue' to ignore it for now
        if (!firstPageSortedPostsCid) {
          continue
        }
        const pages = getSubplebbitSortedPostsPages(firstPageSortedPostsCid, sortedPostsPages)
        // if first page isn't loaded yet, then the feed still has more
        if (!pages.length) {
          feedsHaveMore[feedName] = true
          continue feedsLoop
        }
        const lastPage = pages[pages.length - 1]
        if (lastPage.nextSortedCommentsCid) {
          feedsHaveMore[feedName] = true
          continue feedsLoop
        }
      }

      // if buffered feeds are empty and no last page of any subplebbit has a next page, then has more is false
      feedsHaveMore[feedName] = false
    }
    return feedsHaveMore
  }, [feedsOptions, bufferedFeeds, subplebbits, sortedPostsPages])
}

/**
 * Calculate the final buffered feeds from all the loaded sorted posts pages, sort them, 
 * and remove the posts already loaded in loadedFeeds
 */
function useCalculatedBufferedFeeds(feedsOptions: FeedsOptions, feedsSortedPostsInfo: FeedsSortedPostsInfo, sortedPostsPages: SortedPostsPages, loadedFeeds: Feeds) {
  return useMemo(() => {
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

      // start by finding all sortedPostsCids
      for (const subplebbitAddress of subplebbitAddresses) {
        for (const infoName in feedsSortedPostsInfo) {
          const info = feedsSortedPostsInfo[infoName]
          if (info.sortType !== sortType) {
            continue
          }
          if (info.subplebbitAddress !== subplebbitAddress) {
            continue
          }

          // found an info that matches the sub address and sorted by
          // get all the pages for it from sortedPostsPages
          const subplebbitSortedPostsPages = getSubplebbitSortedPostsPages(info.firstPageSortedPostsCid, sortedPostsPages)

          // add each comment from each page, do not filter at this stage, filter after sorting
          for (const sortedPostsPage of subplebbitSortedPostsPages) {
            if (sortedPostsPage?.comments) {
              bufferedFeedPosts.push(...sortedPostsPage.comments)
            }
          }
        }
      }

      // sort the feed before filtering to get more accurate results
      const sortedBufferedFeedPosts = feedSorter.sort(sortType, bufferedFeedPosts)

      // filter the feed
      const filteredSortedBufferedFeedPosts = []
      for (const post of sortedBufferedFeedPosts) {
        // don't add posts already loaded in loaded feeds
        if (loadedFeedsPosts[feedName].has(post.cid)) {
          continue
        }

        // TODO: filter blocked addresses
        // if (account.blockedAddresses[post.subplebbitAddress] || account.blockedAddresses[post.author.address]) {
        //   continue
        // }

        filteredSortedBufferedFeedPosts.push(post)
      }

      newBufferedFeeds[feedName] = filteredSortedBufferedFeedPosts
    }
    return newBufferedFeeds
  }, [feedsOptions, sortedPostsPages, loadedFeeds])
}

/**
 * Use the `feedSortedPostsInfo` objects to fetch the first page of all subplebbit/sorts
 * if the `feedSortedPostsInfo.bufferedPostCount` gets too low, start fetching the next page.
 * Once a next page is added, it is never removed.
 */
function useSortedPostsPages(feedsSortedPostsInfo: FeedsSortedPostsInfo, subplebbits: Subplebbits) {
  const [sortedPostsPages, setSortedPostsPages] = useState<SortedPostsPages>({})

  // set the info necessary to fetch each page recursively
  // if bufferedPostCount is less than subplebbitPostsLeftBeforeNextPage
  const sortedPostsPagesInfo = useMemo(() => {
    const newSortedPostsPagesInfo: SortedPostsPagesInfo = {}
    for (const infoName in feedsSortedPostsInfo) {
      const {firstPageSortedPostsCid, account, subplebbitAddress, sortType, bufferedPostCount} = feedsSortedPostsInfo[infoName]
      // add first page
      const sortedPostsFirstPageInfo = {sortedPostsCid: firstPageSortedPostsCid, account, subplebbitAddress, sortType,
        // add preloaded sorted posts if any
        sortedPosts: subplebbits?.[subplebbitAddress]?.sortedPosts?.[sortType]
      }
      newSortedPostsPagesInfo[firstPageSortedPostsCid + infoName] = sortedPostsFirstPageInfo

      // add all next pages if needed and if available
      if (bufferedPostCount <= subplebbitPostsLeftBeforeNextPage) {
        const subplebbitPages = getSubplebbitSortedPostsPages(firstPageSortedPostsCid, sortedPostsPages)
        for (const page of subplebbitPages) {
          if (page.nextSortedCommentsCid) {
            const sortedPostsNextPageInfo = {sortedPostsCid: page.nextSortedCommentsCid, account, subplebbitAddress, sortType}
            newSortedPostsPagesInfo[page.nextSortedCommentsCid + infoName] = sortedPostsNextPageInfo
          }
        }
      }
    }
    return newSortedPostsPagesInfo
  }, [feedsSortedPostsInfo, sortedPostsPages])

  // fetch sorted posts pages if needed
  // once a page is added, it's never removed
  useEffect(() => {
    for (const infoName in sortedPostsPagesInfo) {
      const {sortedPostsCid, account, subplebbitAddress, sortedPosts} = sortedPostsPagesInfo[infoName]
      // sorted posts already fetched or fetching
      if (sortedPostsPages[sortedPostsCid] || getSortedPostsPending[account.id + sortedPostsCid]) {
        continue
      }

      // the sorted posts page was already preloaded in the subplebbit IPNS record
      if (sortedPosts) {
        setSortedPostsPages(previousSortedPostsPages => ({...previousSortedPostsPages, [sortedPostsCid]: sortedPosts}))
        continue
      }

      ;(async () => {
        // sorted posts page is cached
        const cachedSortedPostsPage = await sortedPostsDatabase.getItem(sortedPostsCid)
        if (cachedSortedPostsPage) {
          setSortedPostsPages(previousSortedPostsPages => ({...previousSortedPostsPages, [sortedPostsCid]: cachedSortedPostsPage}))
          return
        }

        getSortedPostsPending[account.id + sortedPostsCid] = true
        const subplebbit = account.plebbit.createSubplebbit({address: subplebbitAddress})
        const fetchedSortedPostsPage = await subplebbit.getSortedPosts(sortedPostsCid)
        await sortedPostsDatabase.setItem(sortedPostsCid, fetchedSortedPostsPage)
        debug('FeedsProvider useSortedPostsPages subplebbit.getSortedPosts', {sortedPostsCid, infoName, sortedPosts: {nextSortedCommentsCid: fetchedSortedPostsPage.nextSortedCommentsCid, commentsLength: fetchedSortedPostsPage.comments.length, feedsSortedPostsInfo}})
        setSortedPostsPages(previousSortedPostsPages => ({...previousSortedPostsPages, [sortedPostsCid]: fetchedSortedPostsPage}))
        getSortedPostsPending[account.id + sortedPostsCid] = false
      })()
    }
  }, [sortedPostsPagesInfo])

  return sortedPostsPages
}
const getSortedPostsPending: {[key:string]: boolean} = {}

/**
 * Util function to gather in an array all loaded `SortedComments` pages of a subplebbit/sort 
 * using `SortedComments.nextSortedCommentsCid`
 */
const getSubplebbitSortedPostsPages = (firstPageSortedPostsCid: string, sortedPostsPages: SortedPostsPages) => {
  const pages: SortedComments[] = []
  const firstPage = sortedPostsPages[firstPageSortedPostsCid]
  if (!firstPage) {
    return pages
  }
  pages.push(firstPage)
  while (true) {
    const nextSortedCommentsCid = pages[pages.length - 1]?.nextSortedCommentsCid
    const sortedPostsPage = sortedPostsPages[nextSortedCommentsCid]
    if (!sortedPostsPage) {
      return pages
    }
    pages.push(sortedPostsPage)
  }
}

/**
 * Generate a list of `feedSortedPostsInfo` objects which contain the information required
 * to initiate fetching the pages of each subplebbit/sort/account/feed
 */
function useFeedsSortedPostsInfo(feedsOptions: FeedsOptions, subplebbits: Subplebbits, bufferedFeeds: Feeds) {
  const bufferedFeedsSubplebbitsPostCounts = useBufferedFeedsSubplebbitsPostCounts(feedsOptions, bufferedFeeds)
  return useMemo(() => {
    const feedsSortedPostsInfo: FeedsSortedPostsInfo = {}
    for (const feedName in feedsOptions) {
      const {subplebbitAddresses, sortType, account} = feedsOptions[feedName]
      for (const subplebbitAddress of subplebbitAddresses) {
        const subplebbit = subplebbits[subplebbitAddress]
        const sortedPostsCid = subplebbit?.sortedPostsCids?.[sortType]
        if (!sortedPostsCid) {
          continue
        }
        const feedSortedPostsInfo = {
          firstPageSortedPostsCid: sortedPostsCid,
          account, 
          subplebbitAddress, 
          sortType,
          bufferedPostCount: bufferedFeedsSubplebbitsPostCounts[feedName][subplebbitAddress]
        }
        feedsSortedPostsInfo[account.id + subplebbitAddress + sortType] = feedSortedPostsInfo
      }
    }
    return feedsSortedPostsInfo
    // don't use bufferedFeeds to rerender, only rerender on feedOptions.pageNumber change, or subplebbit.sortedPostsCids change
  }, [feedsOptions, subplebbits])
}

/**
 * This convoluted hook is required to keep track of how many posts are left buffered in each subplebbit,
 * each sort, and each feed. If the amount gets too low, a new page can be fetched in advance.
 */
function useBufferedFeedsSubplebbitsPostCounts(feedsOptions: FeedsOptions, bufferedFeeds: Feeds) {
  return useMemo(() => {
    const feedsSubplebbitsPostCounts: any = {}
    for (const feedName in feedsOptions) {
      feedsSubplebbitsPostCounts[feedName] = {}
      for (const subplebbitAddress of feedsOptions[feedName].subplebbitAddresses) {
        feedsSubplebbitsPostCounts[feedName][subplebbitAddress] = 0
      }
      for (const comment of bufferedFeeds[feedName]) {
        feedsSubplebbitsPostCounts[feedName][comment.subplebbitAddress]++
      }
    }
    return feedsSubplebbitsPostCounts
  }, [bufferedFeeds])
}

/**
 * Add subplebbits to SubplebbitsContext as they are needed, and return them as an object
 */
function useSubplebbits(feedsOptions: FeedsOptions) {
  const subplebbitAddressesAndAccounts = useUniqueSortedSubplebbitAddressesAndAccounts(feedsOptions)
  const subplebbitsContext = useContext(SubplebbitsContext)
  const subplebbits: Subplebbits = {}
  for (const [subplebbitAddress] of subplebbitAddressesAndAccounts) {
    subplebbits[subplebbitAddress] = subplebbitsContext.subplebbits[subplebbitAddress]
  }

  useEffect(() => {
    for (const [subplebbitAddress, account] of subplebbitAddressesAndAccounts) {
      // if subplebbit isn't already in context, add it
      if (!subplebbitsContext.subplebbits[subplebbitAddress]) {
        subplebbitsContext.subplebbitsActions.addSubplebbitToContext(subplebbitAddress, account)
      }
    }
  }, [subplebbitAddressesAndAccounts])

  // debug('FeedsProvider useSubplebbits', { subplebbitsContext: subplebbitsContext.subplebbits })
  return subplebbits
}

/**
 * Util function of useSubplebbits to not rerender unnecessarily 
 */
function useUniqueSortedSubplebbitAddressesAndAccounts(feedsOptions: FeedsOptions): [string, string][]{
  return useMemo(() => {
    const accounts: Accounts = {}
    const subplebbitAddressesAndAccountsStrings: string[] = []
    for (const feedName in feedsOptions) {
      const feedOptions = feedsOptions[feedName]
      accounts[feedOptions.account.id] = feedOptions.account
      for (const subplebbitAddress of feedOptions.subplebbitAddresses) {
        subplebbitAddressesAndAccountsStrings.push(JSON.stringify([subplebbitAddress, feedOptions.account.id]))
      }
    }
    const uniqueSortedStrings: string[] = [...new Set(subplebbitAddressesAndAccountsStrings.sort())]
    const uniqueSorted: string[] = uniqueSortedStrings.map(string => JSON.parse(string))
    return uniqueSorted.map(([subplebbitAddress, accountId]) => [subplebbitAddress, accounts[accountId]])
  }, [feedsOptions])
}
