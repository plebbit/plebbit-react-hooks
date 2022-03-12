import { useEffect, useMemo, useState, useContext } from 'react'
import { useAccount } from './accounts'
import { FeedsContext } from '../providers/FeedsProvider'
import validator from '../lib/validator'
import Debug from 'debug'
const debug = Debug('plebbitreacthooks:hooks:feeds')
import assert from 'assert'

function useUniqueSorted(strings?: string[]) {
  return useMemo(() => {
    if (!strings) {
      return
    }
    return [...new Set(strings.sort())]
  }, [strings])
}

function useStringified(obj?: any) {
  return useMemo(() => {
    if (obj === undefined) {
      return
    }
    return JSON.stringify(obj)
  }, [obj])
}

/**
 * @param subplebbitAddresses - The addresses of the subplebbits, e.g. ['memes.eth', 'Qm...']
 * @param sortType - The sorting algo for the feed: 'hot' | 'new' | 'topHour'| 'topDay' | 'topWeek' | 'topMonth' | 'topYear' | 'topAll'
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useFeed(subplebbitAddresses?: string[], sortType = 'hot', accountName?: string) {
  const account = useAccount(accountName)
  const feedsContext = useContext(FeedsContext)

  const uniqueSubplebbitAddresses = useUniqueSorted(subplebbitAddresses)
  const feedName = useStringified([account?.id, sortType, uniqueSubplebbitAddresses])
  const feed = feedName && feedsContext.loadedFeeds[feedName]

  useEffect(() => {
    if (!uniqueSubplebbitAddresses || !account) {
      return
    }
    if (!feed) {
      // if feed isn't already in context, add it
      feedsContext.feedsActions.addFeedToContext(feedName, uniqueSubplebbitAddresses, sortType, account)
    }
  }, [feedName, uniqueSubplebbitAddresses, account])

  const hasMore = true
  const loadMore = () => {
    if (!uniqueSubplebbitAddresses || !account) {
      return
    }
    feedsContext.feedsActions.incrementFeedPageNumber(feedName)
  }

  debug('useFeed', { feedsContext: feedsContext.loadedFeeds, feed, hasMore })
  return {feed, hasMore, loadMore}
}

type FeedOptions = {
  subplebbitAddresses: string[]
  sortType?: string
}

/**
 * Use useBufferedFeeds to buffer multiple feeds in the background so what when
 * they are called by useFeed later, they are already preloaded.
 * 
 * @param feedOptions - The options of the feed
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useBufferedFeeds(feedsOptions?: FeedOptions[], accountName?: string) {

}
