import React, { useState, useEffect, useContext, useMemo } from 'react'
import {SubplebbitsContext} from './SubplebbitsProvider'
import validator from '../lib/validator'
import assert from 'assert'
import Debug from 'debug'
const debug = Debug('plebbitreacthooks:providers:feedsprovider')
import {Props, Feed, Feeds, Account} from '../types'

type FeedsContext = any

// reddit loads approximately 25 posts per page
// while infinite scrolling
const postsPerPage = 25
// keep large buffer because fetching cids is slow
const subplebbitPostsLeftBeforeNextPage = 50

export const FeedsContext = React.createContext<FeedsContext | undefined>(undefined)

export default function FeedsProvider(props: Props): JSX.Element | null {
  const [feedsOptions, setFeedsOptions] = useState({})
  const [feeds, setFeeds] = useState({})

  // fetch subplebbits, sorted posts and next pages whenever feeds buffer gets too low
  const subplebbits = useSubplebbits(feedsOptions)
  const feedsSortedPostsInfo = useFeedsSortedPostsInfo(feedsOptions, subplebbits, feeds)
  const feedsSortedPostsPages = useFeedsSortedPostsPages(feedsSortedPostsInfo)
  const paginatedFeeds = usePaginatedFeeds(feedsOptions, feeds)
  updateFeeds(feedsOptions, feedsSortedPostsInfo, feedsSortedPostsPages, setFeeds)

  const feedsActions: any = {}

  feedsActions.addFeedToContext = (feedName: string, subplebbitAddresses: string[], sortedBy: string, account: Account) => {
    // feed is in context already, do nothing
    // @ts-ignore
    if (feedsOptions[feedName]) {
      return
    }
    const feedOptions = {subplebbitAddresses, sortedBy, account, pageNumber: 1}
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
    feeds,
    paginatedFeeds,
    feedsActions,
  }

  debug({ feedsContext: feeds, paginatedFeeds, feedsOptions, feedsSortedPostsInfo, feedsSortedPostsPages })
  return <FeedsContext.Provider value={feedsContext}>{props.children}</FeedsContext.Provider>
}

// calculate feeds, paginatedFeeds is same as feeds but only contains posts up to feedOptions.pageNumber
function updateFeeds(feedsOptions: any, feedsSortedPostsInfo: any, feedsSortedPostsPages: any, setFeeds: Function) {
  return useMemo(() => {
    const newFeeds: any = {}
    for (const feedName in feedsOptions) {
      // @ts-ignore
      const {subplebbitAddresses, sortedBy} = feedsOptions[feedName]

      // find all fetched posts
      const feedPosts = []

      // start by finding all sortedPostsCids
      for (const subplebbitAddress of subplebbitAddresses) {
        for (const infoName in feedsSortedPostsInfo) {
          const info = feedsSortedPostsInfo[infoName]
          if (info.sortedBy !== sortedBy) {
            continue
          }
          if (info.subplebbitAddress !== subplebbitAddress) {
            continue
          }

          // found an info that matches the sub address and sorted by
          // get all the pages for it from feedsSortedPostsPages
          const sortedPostsPages = getAllSortedPostsPages(info.firstPageSortedPostsCid, feedsSortedPostsPages)

          // add each comment from each page
          for (const sortedPostsPage of sortedPostsPages) {
            for (let comment of sortedPostsPage?.comments || []) {
              if (comment.subplebbitAddress !== subplebbitAddress) {
                // in case plebbit-js forgets to validate comment.subplebbitAddress in getSortedComments()
                // debug(`FeedsProvider comment.subplebbitAddress '${comment.subplebbitAddress}' !== '${subplebbitAddress}', plebbit-js should validate this`)
                // forced to override here even if it could be malicious because too difficult to mock plebbit.getSortedComments() for tests in plebbit-mock
                // TODO: fix this when plebbit-js api changes
                comment = {...comment, subplebbitAddress}
              }
              feedPosts.push(comment)
            }
          }
        }
      }
      newFeeds[feedName] = feedPosts
    }
    setFeeds(newFeeds)
  }, [feedsOptions, feedsSortedPostsPages])
}

function useFeedsSortedPostsPages(feedsSortedPostsInfo: any) {
  const [sortedPostsPages, setSortedPostsPages] = useState({})

  // set the info necessary to fetch each page recursively
  // if feedPostsLeftCount is less than subplebbitPostsLeftBeforeNextPage
  const sortedPostsPagesInfo = useMemo(() => {
    const newSortedPostsPagesInfo: any = {}
    for (const infoName in feedsSortedPostsInfo) {
      const {firstPageSortedPostsCid, account, subplebbitAddress, sortedBy, feedPostsLeftCount} = feedsSortedPostsInfo[infoName]
      // add first page
      const sortedPostsFirstPageInfo = {sortedPostsCid: firstPageSortedPostsCid, account, subplebbitAddress, sortedBy}
      newSortedPostsPagesInfo[firstPageSortedPostsCid + infoName] = sortedPostsFirstPageInfo

      // add all next pages if needed and if available
      if (feedPostsLeftCount <= subplebbitPostsLeftBeforeNextPage) {
        const allPages = getAllSortedPostsPages(firstPageSortedPostsCid, sortedPostsPages)
        for (const page of allPages) {
          if (page.nextSortedCommentsCid) {
            const sortedPostsNextPageInfo = {sortedPostsCid: page.nextSortedCommentsCid, account, subplebbitAddress, sortedBy}
            newSortedPostsPagesInfo[page.nextSortedCommentsCid + infoName] = sortedPostsNextPageInfo
          }
        }
      }
    }
    return newSortedPostsPagesInfo
  }, [feedsSortedPostsInfo, sortedPostsPages])

  // fetch sorted posts pages if needed
  const pending: any = {}
  useEffect(() => {
    for (const infoName in sortedPostsPagesInfo) {
      // @ts-ignore
      const {sortedPostsCid, account} = sortedPostsPagesInfo[infoName]
      // sorted posts already fetched or fetching
      // @ts-ignore
      if (sortedPostsPages[sortedPostsCid] || pending[account.id + sortedPostsCid]) {
        continue
      }

      pending[account.id + sortedPostsCid] = true
      // @ts-ignore
      account.plebbit.getSortedComments(sortedPostsCid).then((fetchedSortedPostsPage) => {
        debug('FeedsProvider useFeedsSortedPostsPages getSortedComments', {sortedPostsCid, infoName, fetchedSortedPostsPage})
        setSortedPostsPages(previousSortedPostsPages => ({...previousSortedPostsPages, [sortedPostsCid]: fetchedSortedPostsPage}))
        pending[account.id + sortedPostsCid] = false
      })
    }
  }, [sortedPostsPagesInfo])

  return sortedPostsPages
}

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

function useFeedsSortedPostsInfo(feedsOptions: any, subplebbits: any, feeds: any) {
  const feedsSubplebbitsPostsLeftCounts = useFeedsSubplebbitsPostsLeftCounts(feedsOptions, feeds)
  return useMemo(() => {
    const feedsSortedPostsInfo: any = {}
    for (const feedName in feedsOptions) {
      const {subplebbitAddresses, sortedBy, account} = feedsOptions[feedName]
      for (const subplebbitAddress of subplebbitAddresses) {
        const subplebbit = subplebbits[subplebbitAddress]
        const sortedPostsCid = subplebbit?.sortedPostsCids?.[sortedBy]
        if (!sortedPostsCid) {
          continue
        }
        const feedSortedPostsInfo = {
          firstPageSortedPostsCid: sortedPostsCid,
          account, 
          subplebbitAddress, 
          sortedBy,
          feedPostsLeftCount: feedsSubplebbitsPostsLeftCounts?.[feedName]?.[subplebbitAddress]
        }
        feedsSortedPostsInfo[account.id + subplebbitAddress + sortedBy] = feedSortedPostsInfo
      }
    }
    return feedsSortedPostsInfo
  }, [feedsOptions, subplebbits])
}

function useFeedsSubplebbitsPostsLeftCounts(feedsOptions: any, feeds: any) {
  const paginatedFeeds = usePaginatedFeeds(feedsOptions, feeds) // same as feeds but only contains posts up to feedOptions.pageNumber
  const feedsSubplebbitsPostCounts = useFeedsSubplebbitsPostCounts(feeds)
  const paginatedFeedsSubbplebbitsPostCounts = useFeedsSubplebbitsPostCounts(paginatedFeeds)
  return useMemo(() => {
    const feedsSubplebbitsPostsLeftCounts: any = {}
    for (const feedName in feedsSubplebbitsPostCounts) {
      for (const subplebbitAddress in feedsSubplebbitsPostCounts[feedName]) {
        const postsLeftCount = feedsSubplebbitsPostCounts[feedName][subplebbitAddress] - paginatedFeedsSubbplebbitsPostCounts[feedName][subplebbitAddress]
        if (!feedsSubplebbitsPostsLeftCounts[feedName]) {
          feedsSubplebbitsPostsLeftCounts[feedName] = {}
        }
        feedsSubplebbitsPostsLeftCounts[feedName][subplebbitAddress] = postsLeftCount
      }
    }
    return feedsSubplebbitsPostsLeftCounts
  }, [feedsSubplebbitsPostCounts, paginatedFeedsSubbplebbitsPostCounts])
}

function useFeedsSubplebbitsPostCounts(feeds: any) {
  return useMemo(() => {
    const feedsSubplebbitsPostCounts: any = {}
    for (const feedName in feeds) {
      const subplebbitsPostCounts: any = {}
      for (const comment of feeds[feedName]) {
        if (!subplebbitsPostCounts[comment.subplebbitAddress]) {
          subplebbitsPostCounts[comment.subplebbitAddress] = 0
        }
        subplebbitsPostCounts[comment.subplebbitAddress]++
      }
      feedsSubplebbitsPostCounts[feedName] = subplebbitsPostCounts
    }
    return feedsSubplebbitsPostCounts
  }, [feeds])
}

// same as feeds but only contains posts up to feedOptions.pageNumber
function usePaginatedFeeds(feedsOptions: any, feeds: any) {
  return useMemo(() => {
    const paginatedFeeds: any = {}
    for (const feedName in feedsOptions) {
      if (!feeds[feedName]) {
        continue
      }
      const {pageNumber} = feedsOptions[feedName]

      // only deliver the current page
      const paginatedFeedPosts = [...feeds[feedName]]
      const pagePostCount = pageNumber * postsPerPage
      if (paginatedFeedPosts.length > pagePostCount) {
        paginatedFeedPosts.length = pagePostCount
      }
      paginatedFeeds[feedName] = paginatedFeedPosts
    }
    return paginatedFeeds
  }, [feeds, feedsOptions])
}

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
