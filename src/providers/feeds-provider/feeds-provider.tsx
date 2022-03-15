import React, { useState, useEffect, useContext, useMemo } from 'react'
import {SubplebbitsContext} from '../subplebbits-provider'
import validator from '../../lib/validator'
import feedSorter from './feed-sorter'
import assert from 'assert'
import Debug from 'debug'
const debug = Debug('plebbitreacthooks:providers:feedsprovider')
import {Props, Feed, Feeds, Account} from '../../types'

type FeedsContext = any

// reddit loads approximately 25 posts per page
// while infinite scrolling
const postsPerPage = 25
// keep large buffer because fetching cids is slow
const subplebbitPostsLeftBeforeNextPage = 50

export const FeedsContext = React.createContext<FeedsContext | undefined>(undefined)

export default function FeedsProvider(props: Props): JSX.Element | null {
  const [feedsOptions, setFeedsOptions] = useState({})
  const [bufferedFeeds, setBufferedFeeds] = useState({})
  const [loadedFeeds, setLoadedFeeds] = useState({})

  // fetch subplebbits, sorted posts and next pages whenever bufferedFeeds gets too low
  const subplebbits = useSubplebbits(feedsOptions)
  const feedsSortedPostsInfo = useFeedsSortedPostsInfo(feedsOptions, subplebbits, bufferedFeeds)
  const feedsSortedPostsPages = useFeedsSortedPostsPages(feedsSortedPostsInfo)
  const calculatedBufferedFeeds = useCalculatedBufferedFeeds(feedsOptions, feedsSortedPostsInfo, feedsSortedPostsPages, loadedFeeds)

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
    const loadedFeedsMissingPosts: any = {}
    for (const feedName in feedsOptions) {
      // @ts-ignore
      const {pageNumber} = feedsOptions[feedName]
      const loadedFeedPostCount = pageNumber * postsPerPage
      // @ts-ignore
      const currentLoadedFeed = loadedFeeds[feedName] || []
      const missingPostsCount = loadedFeedPostCount - currentLoadedFeed.length

      // get new posts from buffered feed
      // @ts-ignore
      const bufferedFeed = bufferedFeeds[feedName] || []
      const missingPosts = [...bufferedFeed]
      if (missingPosts.length > missingPostsCount) {
        missingPosts.length = missingPostsCount
      }

      // the current loaded feed already exist and doesn't need new posts
      // @ts-ignore
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
      const newLoadedFeeds: any = {}
      for (const feedName in loadedFeedsMissingPosts) {
        // @ts-ignore
        newLoadedFeeds[feedName] = [...previousLoadedFeeds[feedName] || [], ...loadedFeedsMissingPosts[feedName]]
      }
      return {...previousLoadedFeeds, ...newLoadedFeeds}
    })
  }, [bufferedFeeds, feedsOptions])

  const feedsActions: any = {}

  feedsActions.addFeedToContext = (feedName: string, subplebbitAddresses: string[], sortType: string, account: Account, isBufferedFeed?: boolean) => {
    // feed is in context already, do nothing
    // if the feed already exist but is at page 1, reset it to page 1
    // @ts-ignore
    if (feedsOptions[feedName] && feedsOptions[feedName].page !== 0) {
      return
    }
    // to add a buffered feed, add a feed with pageNumber 0
    const feedOptions = {subplebbitAddresses, sortType, account, pageNumber: isBufferedFeed === true ? 0 : 1}
    debug('feedsActions.addFeedToContext', feedOptions)
    setFeedsOptions(previousFeedsOptions => ({...previousFeedsOptions, [feedName]: feedOptions}))
  }

  feedsActions.incrementFeedPageNumber = async (feedName: string) => {
    // @ts-ignore
    assert(feedsOptions[feedName], `feedsActions.incrementFeedPageNumber feed name '${feedName}' does not exist in FeedsContext`)
    debug('feedsActions.incrementFeedPageNumber', {feedName})
    setFeedsOptions(previousFeedsOptions => {
      // @ts-ignore
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
  }

  const bufferedFeedsLengths: any = {}
  const loadedFeedsLengths: any = {}
  // @ts-ignore
  for (const feedName in feedsOptions) {
    // @ts-ignore
    bufferedFeedsLengths[feedName] = bufferedFeeds[feedName]?.length
    // @ts-ignore
    loadedFeedsLengths[feedName] = loadedFeeds[feedName]?.length
  }

  // debug({ feedsOptions, feedsSortedPostsInfo, feedsSortedPostsPages, subplebbits, bufferedFeeds, loadedFeeds })
  debug({ feedsOptions, feedsSortedPostsInfo, feedsSortedPostsPages, bufferedFeedsLengths, loadedFeedsLengths })
  return <FeedsContext.Provider value={feedsContext}>{props.children}</FeedsContext.Provider>
}

/**
 * Calculate the final buffered feeds from all the loaded sorted posts pages, sort them, 
 * and remove the posts already loaded in loadedFeeds
 */
function useCalculatedBufferedFeeds(feedsOptions: any, feedsSortedPostsInfo: any, feedsSortedPostsPages: any, loadedFeeds: any) {
  return useMemo(() => {
    // contruct a list of posts already loaded to remove them from buffered feeds
    const loadedFeedsPosts: any = {}
    for (const feedName in loadedFeeds) {
      loadedFeedsPosts[feedName] = new Set()
      for (const post of loadedFeeds[feedName]) {
        loadedFeedsPosts[feedName].add(post.cid)
      }
    }

    // calculate each feed
    let newBufferedFeeds: any = {}
    for (const feedName in feedsOptions) {
      // @ts-ignore
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
          // get all the pages for it from feedsSortedPostsPages
          const sortedPostsPages = getAllSortedPostsPages(info.firstPageSortedPostsCid, feedsSortedPostsPages)

          // add each comment from each page, do not filter at this stage, filter after sorting
          for (const sortedPostsPage of sortedPostsPages) {
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
  }, [feedsOptions, feedsSortedPostsPages, loadedFeeds])
}

/**
 * Use the `feedSortedPostsInfo` objects to fetch the first page of all subplebbit/sorts
 * if the `feedSortedPostsInfo.bufferedPostCount` gets too low, start fetching the next page.
 * Once a next page is added, it is never removed.
 */
function useFeedsSortedPostsPages(feedsSortedPostsInfo: any) {
  const [sortedPostsPages, setSortedPostsPages] = useState({})

  // set the info necessary to fetch each page recursively
  // if bufferedPostCount is less than subplebbitPostsLeftBeforeNextPage
  const sortedPostsPagesInfo = useMemo(() => {
    const newSortedPostsPagesInfo: any = {}
    for (const infoName in feedsSortedPostsInfo) {
      const {firstPageSortedPostsCid, account, subplebbitAddress, sortType, bufferedPostCount} = feedsSortedPostsInfo[infoName]
      // add first page
      const sortedPostsFirstPageInfo = {sortedPostsCid: firstPageSortedPostsCid, account, subplebbitAddress, sortType}
      newSortedPostsPagesInfo[firstPageSortedPostsCid + infoName] = sortedPostsFirstPageInfo

      // add all next pages if needed and if available
      if (bufferedPostCount <= subplebbitPostsLeftBeforeNextPage) {
        const allPages = getAllSortedPostsPages(firstPageSortedPostsCid, sortedPostsPages)
        for (const page of allPages) {
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
      // @ts-ignore
      const {sortedPostsCid, account, subplebbitAddress} = sortedPostsPagesInfo[infoName]
      // sorted posts already fetched or fetching
      // @ts-ignore
      if (sortedPostsPages[sortedPostsCid] || getSortedPostsPending[account.id + sortedPostsCid]) {
        continue
      }

      getSortedPostsPending[account.id + sortedPostsCid] = true
      const subplebbit = account.plebbit.createSubplebbit({address: subplebbitAddress})
      // @ts-ignore
      subplebbit.getSortedPosts(sortedPostsCid).then((fetchedSortedPostsPage) => {
        debug('FeedsProvider useFeedsSortedPostsPages subplebbit.getSortedPosts', {sortedPostsCid, infoName, sortedPosts: {nextSortedCommentsCid: fetchedSortedPostsPage.nextSortedCommentsCid, commentsLength: fetchedSortedPostsPage.comments.length, feedsSortedPostsInfo}})
        setSortedPostsPages(previousSortedPostsPages => ({...previousSortedPostsPages, [sortedPostsCid]: fetchedSortedPostsPage}))
        getSortedPostsPending[account.id + sortedPostsCid] = false
      })
    }
  }, [sortedPostsPagesInfo])

  return sortedPostsPages
}
const getSortedPostsPending: any = {}

/**
 * Util function to gather in an array all loaded `SortedComments` pages of a subplebbit/sort 
 * using `SortedComments.nextSortedCommentsCid`
 */
const getAllSortedPostsPages = (firstPageSortedPostsCid: string, feedsSortedPostsPages: any) => {
  const pages: any = []
  const firstPage = feedsSortedPostsPages[firstPageSortedPostsCid]
  if (!firstPage) {
    return pages
  }
  pages.push(firstPage)
  while (true) {
    const nextSortedCommentsCid = pages[pages.length - 1]?.nextSortedCommentsCid
    const sortedPostsPage = feedsSortedPostsPages[nextSortedCommentsCid]
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
function useFeedsSortedPostsInfo(feedsOptions: any, subplebbits: any, bufferedFeeds: any) {
  const bufferedFeedsSubplebbitsPostCounts = useBufferedFeedsSubplebbitsPostCounts(feedsOptions, bufferedFeeds)
  return useMemo(() => {
    const feedsSortedPostsInfo: any = {}
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
function useBufferedFeedsSubplebbitsPostCounts(feedsOptions: any, bufferedFeeds: any) {
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
function useSubplebbits(feedsOptions: any) {
  const subplebbitAddressesAndAccounts = useUniqueSortedSubplebbitAddressesAndAccounts(feedsOptions)
  const subplebbitsContext = useContext(SubplebbitsContext)
  const subplebbits: any = {}
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
function useUniqueSortedSubplebbitAddressesAndAccounts(feedsOptions: any) {
  return useMemo(() => {
    const accounts: any = {}
    const subplebbitAddressesAndAccountsStrings = []
    for (const feedName in feedsOptions) {
      const feedOptions = feedsOptions[feedName]
      accounts[feedOptions.account.id] = feedOptions.account
      for (const subplebbitAddress of feedOptions.subplebbitAddresses) {
        subplebbitAddressesAndAccountsStrings.push(JSON.stringify([subplebbitAddress, feedOptions.account.id]))
      }
    }
    const uniqueSortedStrings = [...new Set(subplebbitAddressesAndAccountsStrings.sort())]
    const uniqueSorted = uniqueSortedStrings.map(string => JSON.parse(string))
    return uniqueSorted.map(([subplebbitAddress, accountId]) => [subplebbitAddress, accounts[accountId]])
  }, [feedsOptions])
}
