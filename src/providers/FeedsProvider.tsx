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

export const FeedsContext = React.createContext<FeedsContext | undefined>(undefined)

export default function FeedsProvider(props: Props): JSX.Element | null {
  const [feedsOptions, setFeedsOptions] = useState({})

  const subplebbits = useSubplebbits(feedsOptions)
  const sortedPostsInfo = useSortedPostsInfo(feedsOptions, subplebbits)
  const sortedPosts = useSortedPosts(sortedPostsInfo)
  const feeds = useFeeds(feedsOptions, sortedPostsInfo, sortedPosts)

  const feedsActions: any = {}

  feedsActions.addFeedToContext = async (feedName: string, subplebbitAddresses: string[], sortedBy: string, account: Account) => {
    // feed is in context already, do nothing
    // @ts-ignore
    if (feedsOptions[feedName]) {
      return
    }
    const feedOptions = {subplebbitAddresses, sortedBy, account}
    debug('feedsActions.addFeedToContext', feedOptions)
    setFeedsOptions(previousFeedsOptions => ({...previousFeedsOptions, [feedName]: feedOptions}))
  }

  if (!props.children) {
    return null
  }

  const feedsContext: FeedsContext = {
    feeds,
    feedsActions,
  }

  debug({ feedsContext: feeds, feedsOptions, sortedPostsInfo, sortedPosts })
  return <FeedsContext.Provider value={feedsContext}>{props.children}</FeedsContext.Provider>
}

function useSortedPosts(sortedPostsInfo: any) {
  const [sortedPosts, setSortedPosts] = useState({})

  const pending: any = {}

  useEffect(() => {
    for (const sortedPostsCid in sortedPostsInfo) {
      const account = sortedPostsInfo[sortedPostsCid].account
      // sorted posts already fetched or fetching
      // @ts-ignore
      if (sortedPosts[sortedPostsCid] || pending[account.id + sortedPostsCid]) {
        continue
      }

      pending[account.id + sortedPostsCid] = true
      // @ts-ignore
      account.plebbit.getSortedComments(sortedPostsCid).then((fetchedSortedPosts) => {
        setSortedPosts(previousSortedPosts => ({...previousSortedPosts, [sortedPostsCid]: fetchedSortedPosts}))
        pending[account.id + sortedPostsCid] = false
      })
    }
  }, [sortedPostsInfo])

  return sortedPosts
}

function useSortedPostsInfo(feedsOptions: any, subplebbits: any) {
  return useMemo(() => {
    const sortedPostsInfo: any = {}
    for (const feedName in feedsOptions) {
      const {subplebbitAddresses, sortedBy, account} = feedsOptions[feedName]
      for (const subplebbitAddress of subplebbitAddresses) {
        const subplebbit = subplebbits[subplebbitAddress]
        const sortedPostsCid = subplebbit?.sortedPostsCids?.[sortedBy]
        if (sortedPostsCid) {
          sortedPostsInfo[sortedPostsCid] = {
            sortedPostsCid, 
            account, 
            subplebbitAddress, 
            sortedBy
          }
        }
      }
    }
    return sortedPostsInfo
  }, [feedsOptions, subplebbits])
}

function useFeeds(feedsOptions: any, sortedPostsInfo: any, sortedPosts: any) {
  return useMemo(() => {
    const feeds: any = {}
    for (const feedName in feedsOptions) {
      const {subplebbitAddresses, sortedBy} = feedsOptions[feedName]

      // find all sorted posts cids that match the subplebbit addresses and sorted by
      const sortedPostsCids = []
      for (const subplebbitAddress of subplebbitAddresses) {
        for (const sortedPostsCid in sortedPostsInfo) {
          const info = sortedPostsInfo[sortedPostsCid]
          if (info.sortedBy !== sortedBy) {
            continue
          }
          if (info.subplebbitAddress !== subplebbitAddress) {
            continue
          }
          sortedPostsCids.push(sortedPostsCid)
        }
      }

      // find all fetched posts
      const feedPosts = []
      for (const sortedPostsCid of sortedPostsCids) {
        if (sortedPosts[sortedPostsCid]?.comments) {
          feedPosts.push(...sortedPosts[sortedPostsCid].comments)
        }
      }

      // only deliver the current page
      if (feedPosts.length > postsPerPage) {
        feedPosts.length = postsPerPage
      }
      feeds[feedName] = feedPosts
    }
    return feeds
  }, [feedsOptions, sortedPostsInfo, sortedPosts])
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
