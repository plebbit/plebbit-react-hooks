import React, { useState, useEffect, useContext, useMemo } from 'react'
import { AccountsContext } from '../accounts-provider'
import { SubplebbitsContext } from '../subplebbits-provider'
import validator from '../../lib/validator'
import feedSorter from './feed-sorter'
import assert from 'assert'
import localForageLru from '../../lib/localforage-lru'
import utils from '../../lib/utils'
import Debug from 'debug'
const debug = Debug('plebbitreacthooks:providers:feedsprovider')
import {
  Props,
  Feed,
  Feeds,
  Subplebbits,
  Account,
  Accounts,
  SubplebbitPage,
  SubplebbitsPages,
  SubplebbitsPagesInfo,
  SubplebbitsPostsInfo,
  FeedsOptions,
} from '../../types'

const subplebbitsPagesDatabase = localForageLru.createInstance({ name: 'subplebbitsPages', size: 500 })

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

  // fetch subplebbits, subplebbits pages and next subplebbit pages whenever bufferedFeeds gets too low
  const subplebbits = useSubplebbits(feedsOptions)
  const subplebbitsPostsInfo = useSubplebbitsPostsInfo(feedsOptions, subplebbits, bufferedFeeds)
  const subplebbitsPages = useSubplebbitsPages(subplebbitsPostsInfo, subplebbits)
  const calculatedBufferedFeeds = useCalculatedBufferedFeeds(
    feedsOptions,
    subplebbitsPostsInfo,
    subplebbitsPages,
    loadedFeeds
  )
  const feedsHaveMore = useFeedsHaveMore(feedsOptions, subplebbits, subplebbitsPages, bufferedFeeds)

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
      const { pageNumber } = feedsOptions[feedName]
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
    setLoadedFeeds((previousLoadedFeeds) => {
      const newLoadedFeeds: Feeds = {}
      for (const feedName in loadedFeedsMissingPosts) {
        newLoadedFeeds[feedName] = [...(previousLoadedFeeds[feedName] || []), ...loadedFeedsMissingPosts[feedName]]
      }
      return { ...previousLoadedFeeds, ...newLoadedFeeds }
    })
  }, [bufferedFeeds, feedsOptions])

  const feedsActions: { [key: string]: Function } = {}

  feedsActions.addFeedToContext = (
    feedName: string,
    subplebbitAddresses: string[],
    sortType: string,
    account: Account,
    isBufferedFeed?: boolean
  ) => {
    // feed is in context already, do nothing
    // if the feed already exist but is at page 1, reset it to page 1
    if (feedsOptions[feedName] && feedsOptions[feedName].pageNumber !== 0) {
      return
    }
    // to add a buffered feed, add a feed with pageNumber 0
    const feedOptions = { subplebbitAddresses, sortType, account, pageNumber: isBufferedFeed === true ? 0 : 1 }
    debug('feedsActions.addFeedToContext', feedOptions)
    setFeedsOptions((previousFeedsOptions) => {
      // make sure to never overwrite a feed already added
      if (previousFeedsOptions[feedName]) {
        return previousFeedsOptions
      }
      return { ...previousFeedsOptions, [feedName]: feedOptions }
    })
  }

  feedsActions.incrementFeedPageNumber = (feedName: string) => {
    assert(
      feedsOptions[feedName],
      `feedsActions.incrementFeedPageNumber feed name '${feedName}' does not exist in FeedsContext`
    )
    debug('feedsActions.incrementFeedPageNumber', { feedName })
    setFeedsOptions((previousFeedsOptions) => {
      assert(
        previousFeedsOptions[feedName].pageNumber * postsPerPage <= loadedFeeds[feedName].length,
        `feedsActions.incrementFeedPageNumber cannot increment feed page number before current page has loaded`
      )
      const feedOptions = {
        ...previousFeedsOptions[feedName],
        pageNumber: previousFeedsOptions[feedName].pageNumber + 1,
      }
      return { ...previousFeedsOptions, [feedName]: feedOptions }
    })
  }

  if (!props.children) {
    return null
  }

  const feedsContext: FeedsContext = {
    bufferedFeeds,
    loadedFeeds,
    feedsActions,
    feedsHaveMore,
  }

  // debug util
  const bufferedFeedsLengths = useFeedsLengths(bufferedFeeds)
  const loadedFeedsLengths = useFeedsLengths(loadedFeeds)
  debug({
    feedsOptions,
    feedsHaveMore,
    subplebbitsPostsInfo,
    subplebbitsPages,
    bufferedFeedsLengths,
    loadedFeedsLengths,
  })
  return <FeedsContext.Provider value={feedsContext}>{props.children}</FeedsContext.Provider>
}

/**
 * Debug util
 */
function useFeedsLengths(feeds: Feeds) {
  return useMemo(() => {
    const feedsLengths: { [key: string]: number } = {}
    for (const feedName in feeds) {
      if (feeds[feedName]) {
        feedsLengths[feedName] = feeds[feedName].length || 0
      }
    }
    return feedsLengths
  }, [feeds])
}

/**
 * List of which feeds have more posts, i.e. have no reached the final page of all subs
 */
function useFeedsHaveMore(
  feedsOptions: FeedsOptions,
  subplebbits: Subplebbits,
  subplebbitsPages: SubplebbitsPages,
  bufferedFeeds: Feeds
) {
  return useMemo(() => {
    const feedsHaveMore: { [key: string]: boolean } = {}
    feedsLoop: for (const feedName in feedsOptions) {
      // if the feed still has buffered posts, then it still has more
      if (bufferedFeeds[feedName]?.length) {
        feedsHaveMore[feedName] = true
        continue
      }

      const { subplebbitAddresses, sortType } = feedsOptions[feedName]
      for (const subplebbitAddress of subplebbitAddresses) {
        const subplebbit = subplebbits[subplebbitAddress]
        // if at least 1 subplebbit hasn't loaded yet, then the feed still has more
        if (!subplebbit) {
          feedsHaveMore[feedName] = true
          continue feedsLoop
        }
        const firstPageCid = subplebbit.posts?.pageCids?.[sortType]
        // TODO: if a loaded subplebbit doesn't have a first page, it's unclear what we should do
        // should we try to use another sort type by default, like 'hot', or should we just ignore it?
        // 'continue' to ignore it for now
        if (!firstPageCid) {
          continue
        }
        const pages = getSubplebbitPages(firstPageCid, subplebbitsPages)
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
  }, [feedsOptions, bufferedFeeds, subplebbits, subplebbitsPages])
}

/**
 * Calculate the final buffered feeds from all the loaded subplebbit pages, sort them,
 * and remove the posts already loaded in loadedFeeds
 */
function useCalculatedBufferedFeeds(
  feedsOptions: FeedsOptions,
  subplebbitsPostsInfo: SubplebbitsPostsInfo,
  subplebbitsPages: SubplebbitsPages,
  loadedFeeds: Feeds
) {
  return useMemo(() => {
    // contruct a list of posts already loaded to remove them from buffered feeds
    const loadedFeedsPosts: { [key: string]: Set<string> } = {}
    for (const feedName in loadedFeeds) {
      loadedFeedsPosts[feedName] = new Set()
      for (const post of loadedFeeds[feedName]) {
        loadedFeedsPosts[feedName].add(post.cid)
      }
    }

    // calculate each feed
    let newBufferedFeeds: Feeds = {}
    for (const feedName in feedsOptions) {
      const { subplebbitAddresses, sortType, account } = feedsOptions[feedName]

      // find all fetched posts
      const bufferedFeedPosts = []

      // start by finding all pageCids
      for (const subplebbitAddress of subplebbitAddresses) {
        for (const infoName in subplebbitsPostsInfo) {
          const info = subplebbitsPostsInfo[infoName]
          if (info.sortType !== sortType) {
            continue
          }
          if (info.subplebbitAddress !== subplebbitAddress) {
            continue
          }

          // found an info that matches the sub address and sort type
          // get all the pages for it from subplebbitsPages
          const subplebbitPages = getSubplebbitPages(
            info.firstPageCid,
            subplebbitsPages
          )

          // add each comment from each page, do not filter at this stage, filter after sorting
          for (const subplebbitPage of subplebbitPages) {
            if (subplebbitPage?.comments) {
              bufferedFeedPosts.push(...subplebbitPage.comments)
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
  }, [feedsOptions, subplebbitsPages, loadedFeeds])
}

/**
 * Use the `SubplebbitPostsInfo` objects to fetch the first page of all subplebbit/sorts
 * if the `SubplebbitPostsInfo.bufferedPostCount` gets too low, start fetching the next page.
 * Once a next page is added, it is never removed.
 */
function useSubplebbitsPages(subplebbitsPostsInfo: SubplebbitsPostsInfo, subplebbits: Subplebbits) {
  const accountsContext = useContext(AccountsContext)
  const [subplebbitsPages, setSubplebbitsPages] = useState<SubplebbitsPages>({})

  // set the info necessary to fetch each page recursively
  // if bufferedPostCount is less than subplebbitPostsLeftBeforeNextPage
  const subplebbitsPagesInfo = useMemo(() => {
    const newSubplebbitsPagesInfo: SubplebbitsPagesInfo = {}
    for (const infoName in subplebbitsPostsInfo) {
      const { firstPageCid, account, subplebbitAddress, sortType, bufferedPostCount } =
        subplebbitsPostsInfo[infoName]
      // add first page
      const subplebbitFirstPageInfo = {
        pageCid: firstPageCid,
        account,
        subplebbitAddress,
        sortType,
        // add preloaded subplebbit page if any
        page: subplebbits?.[subplebbitAddress]?.posts?.pages?.[sortType],
      }
      newSubplebbitsPagesInfo[firstPageCid + infoName] = subplebbitFirstPageInfo

      // add all next pages if needed and if available
      if (bufferedPostCount <= subplebbitPostsLeftBeforeNextPage) {
        const subplebbitPages = getSubplebbitPages(firstPageCid, subplebbitsPages)
        for (const page of subplebbitPages) {
          if (page.nextCid) {
            const subplebbitNextPageInfo = {
              pageCid: page.nextCid,
              account,
              subplebbitAddress,
              sortType,
            }
            newSubplebbitsPagesInfo[page.nextCid + infoName] = subplebbitNextPageInfo
          }
        }
      }
    }
    return newSubplebbitsPagesInfo
  }, [subplebbitsPostsInfo, subplebbitsPages])

  // fetch subplebbit pages if needed
  // once a page is added, it's never removed
  useEffect(() => {
    for (const infoName in subplebbitsPagesInfo) {
      const { pageCid, account, subplebbitAddress, page } = subplebbitsPagesInfo[infoName]
      // page already fetched or fetching
      if (subplebbitsPages[pageCid] || getSubplebbitPagePending[account.id + pageCid]) {
        continue
      }

      // the subplebbit page was already preloaded in the subplebbit IPNS record
      if (page) {
        setSubplebbitsPages((previousSubplebbitsPages) => ({
          ...previousSubplebbitsPages,
          [pageCid]: page,
        }))
        continue
      }

      ;(async () => {
        // subplebbit page is cached
        const cachedSubplebbitPage = await subplebbitsPagesDatabase.getItem(pageCid)
        if (cachedSubplebbitPage) {
          setSubplebbitsPages((previousSubplebbitsPages) => ({
            ...previousSubplebbitsPages,
            [pageCid]: cachedSubplebbitPage,
          }))
          return
        }

        getSubplebbitPagePending[account.id + pageCid] = true
        const subplebbit = account.plebbit.createSubplebbit({ address: subplebbitAddress })
        const fetchedSubplebbitPage = await subplebbit.posts.getPage(pageCid)
        await subplebbitsPagesDatabase.setItem(pageCid, fetchedSubplebbitPage)
        debug('FeedsProvider useSubplebbitsPages subplebbit.posts.getPage', {
          pageCid,
          infoName,
          subplebbitPage: {
            nextCid: fetchedSubplebbitPage.nextCid,
            commentsLength: fetchedSubplebbitPage.comments.length,
            subplebbitsPostsInfo,
          },
        })
        setSubplebbitsPages((previousSubplebbitsPages) => ({
          ...previousSubplebbitsPages,
          [pageCid]: fetchedSubplebbitPage,
        }))
        getSubplebbitPagePending[account.id + pageCid] = false

        // when publishing a comment, you don't yet know its CID
        // so when a new comment is fetched, check to see if it's your own
        // comment, and if yes, add the CID to your account comments database
        if (accountsContext?.addCidToAccountComment) {
          const flattenedReplies = utils.flattenCommentsPages(fetchedSubplebbitPage)
          for (const comment of flattenedReplies) {
            accountsContext.addCidToAccountComment(comment)
          }
        }
      })()
    }
  }, [subplebbitsPagesInfo])

  return subplebbitsPages
}
const getSubplebbitPagePending: { [key: string]: boolean } = {}

/**
 * Util function to gather in an array all loaded `SubplebbitPage` pages of a subplebbit/sort
 * using `SubplebbitPage.nextCid`
 */
const getSubplebbitPages = (firstPageCid: string, subplebbitsPages: SubplebbitsPages) => {
  const pages: SubplebbitPage[] = []
  const firstPage = subplebbitsPages[firstPageCid]
  if (!firstPage) {
    return pages
  }
  pages.push(firstPage)
  while (true) {
    const nextCid = pages[pages.length - 1]?.nextCid
    const subplebbitPage = subplebbitsPages[nextCid]
    if (!subplebbitPage) {
      return pages
    }
    pages.push(subplebbitPage)
  }
}

/**
 * Generate a list of `SubplebbitPostsInfo` objects which contain the information required
 * to initiate fetching the pages of each subplebbit/sort/account/feed
 */
function useSubplebbitsPostsInfo(feedsOptions: FeedsOptions, subplebbits: Subplebbits, bufferedFeeds: Feeds) {
  const bufferedFeedsSubplebbitsPostCounts = useBufferedFeedsSubplebbitsPostCounts(feedsOptions, bufferedFeeds)
  return useMemo(() => {
    const subplebbitsPostsInfo: SubplebbitsPostsInfo = {}
    for (const feedName in feedsOptions) {
      const { subplebbitAddresses, sortType, account } = feedsOptions[feedName]
      for (const subplebbitAddress of subplebbitAddresses) {
        const subplebbit = subplebbits[subplebbitAddress]
        const pageCid = subplebbit?.posts?.pageCids?.[sortType]
        if (!pageCid) {
          continue
        }
        const subplebbitPostsInfo = {
          firstPageCid: pageCid,
          account,
          subplebbitAddress,
          sortType,
          bufferedPostCount: bufferedFeedsSubplebbitsPostCounts[feedName]?.[subplebbitAddress] || 0,
        }
        subplebbitsPostsInfo[account.id + subplebbitAddress + sortType] = subplebbitPostsInfo
      }
    }
    return subplebbitsPostsInfo
    // don't use bufferedFeeds to rerender, only rerender on feedOptions.pageNumber change, or subplebbit.posts.pageCids change
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

  debug('FeedsProvider useSubplebbits', { subplebbitsContext: subplebbitsContext.subplebbits })
  return subplebbits
}

/**
 * Util function of useSubplebbits to not rerender unnecessarily
 */
function useUniqueSortedSubplebbitAddressesAndAccounts(feedsOptions: FeedsOptions): [string, string][] {
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
    const uniqueSorted: string[] = uniqueSortedStrings.map((string) => JSON.parse(string))
    return uniqueSorted.map(([subplebbitAddress, accountId]) => [subplebbitAddress, accounts[accountId]])
  }, [feedsOptions])
}
