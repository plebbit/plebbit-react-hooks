import {useEffect, useMemo, useState, useContext} from 'react'
import {useAccount} from '../accounts'
import {FeedsContext} from '../../providers/feeds-provider'
import validator from '../../lib/validator'
import Debug from 'debug'
const debug = Debug('plebbit-react-hooks:hooks:feeds')
import assert from 'assert'
import {Feed, UseBufferedFeedOptions} from '../../types'

/**
 * @param subplebbitAddresses - The addresses of the subplebbits, e.g. ['memes.eth', 'Qm...']
 * @param sortType - The sorting algo for the feed: 'hot' | 'new' | 'topHour'| 'topDay' | 'topWeek' | 'topMonth' | 'topYear' | 'topAll'
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useFeed(subplebbitAddresses?: string[], sortType = 'hot', accountName?: string) {
  validator.validateUseFeedArguments(subplebbitAddresses, sortType, accountName)
  const account = useAccount(accountName)
  const feedsContext = useContext(FeedsContext)

  const [uniqueSubplebbitAddresses] = useUniqueSorted([subplebbitAddresses])
  const [feedName] = useStringified([[account?.id, sortType, uniqueSubplebbitAddresses]])
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

  let hasMore = feedName && feedsContext.feedsHaveMore[feedName]
  // if the feed is not yet defined, then it has more
  if (!feedName || typeof feedsContext.feedsHaveMore[feedName] !== 'boolean') {
    hasMore = true
  }

  const loadMore = () => {
    if (!uniqueSubplebbitAddresses || !account) {
      throw Error('useFeed cannot load more feed not initalized yet')
    }
    feedsContext.feedsActions.incrementFeedPageNumber(feedName)
  }

  debug('useFeed', {feed, hasMore})
  return {feed, hasMore, loadMore}
}

/**
 * Use useBufferedFeeds to buffer multiple feeds in the background so what when
 * they are called by useFeed later, they are already preloaded.
 *
 * @param feedOptions - The options of the feed
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useBufferedFeeds(feedsOptions: UseBufferedFeedOptions[] = [], accountName?: string) {
  validator.validateUseBufferedFeedsArguments(feedsOptions, accountName)
  const account = useAccount(accountName)
  const feedsContext = useContext(FeedsContext)

  // do a bunch of calculations to get feedsOptionsFlattened and feedNames
  const subplebbitAddressesArrays = []
  const sortTypes = []
  for (const feedOptions of feedsOptions) {
    subplebbitAddressesArrays.push(feedOptions.subplebbitAddresses)
    sortTypes.push(feedOptions.sortType)
  }
  const uniqueSubplebbitAddressesArrays = useUniqueSorted(subplebbitAddressesArrays)
  const feedsOptionsFlattened: any = []
  for (const i in feedsOptions) {
    feedsOptionsFlattened[i] = [account?.id, sortTypes[i] || 'hot', uniqueSubplebbitAddressesArrays[i]]
  }
  const feedNames = useStringified(feedsOptionsFlattened)

  // only give to the user the buffered feeds he requested
  const bufferedFeeds: Feed[] = []
  for (const feedName of feedNames) {
    bufferedFeeds.push(feedsContext.bufferedFeeds[feedName || ''] || [])
  }

  useEffect(() => {
    for (const i in feedsOptionsFlattened) {
      const [accountId, sortType, uniqueSubplebbitAddresses] = feedsOptionsFlattened[Number(i)]
      validator.validateFeedSortType(sortType)
      const feedName = feedNames[Number(i)]
      if (!uniqueSubplebbitAddresses || !account) {
        return
      }
      if (!feedsContext.bufferedFeeds[feedName || '']) {
        const isBufferedFeed = true
        feedsContext.feedsActions.addFeedToContext(feedName, uniqueSubplebbitAddresses, sortType, account, isBufferedFeed)
      }
    }
  }, [feedNames])

  debug('useBufferedFeeds', {bufferedFeeds})
  return bufferedFeeds
}

/**
 * Util to find unique and sorted subplebbit addresses for multiple feed options
 */
function useUniqueSorted(stringsArrays?: (string[] | undefined)[]) {
  return useMemo(() => {
    const uniqueSorted = []
    for (const stringsArray of stringsArrays || []) {
      if (!stringsArray) {
        uniqueSorted.push(undefined)
      } else {
        uniqueSorted.push([...new Set(stringsArray.sort())])
      }
    }
    return uniqueSorted
  }, [stringsArrays])
}

/**
 * Util to stringify multiple objects or return undefineds
 */
function useStringified(objs?: any[]) {
  return useMemo(() => {
    const stringified = []
    for (const obj of objs || []) {
      if (obj === undefined) {
        stringified.push(undefined)
      } else {
        stringified.push(JSON.stringify(obj))
      }
    }
    return stringified
  }, [objs])
}
