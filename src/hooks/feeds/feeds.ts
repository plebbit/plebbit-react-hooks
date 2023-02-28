import {useEffect, useMemo, useState} from 'react'
import {useAccount} from '../accounts'
import validator from '../../lib/validator'
import Logger from '@plebbit/plebbit-logger'
const log = Logger('plebbit-react-hooks:hooks:feeds')
import assert from 'assert'
import {Feed, Feeds, UseBufferedFeedOptions} from '../../types'
import useFeedsStore from '../../stores/feeds'
import shallow from 'zustand/shallow'

/**
 * @param subplebbitAddresses - The addresses of the subplebbits, e.g. ['memes.eth', 'Qm...']
 * @param sortType - The sorting algo for the feed: 'hot' | 'new' | 'active' | 'topHour' | 'topDay' | 'topWeek' | 'topMonth' | 'topYear' | 'topAll' | 'controversialHour' | 'controversialDay' | 'controversialWeek' | 'controversialMonth' | 'controversialYear' | 'controversialAll'
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useFeed(subplebbitAddresses?: string[], sortType = 'hot', accountName?: string) {
  validator.validateUseFeedArguments(subplebbitAddresses, sortType, accountName)
  const account = useAccount(accountName)
  const addFeedToStore = useFeedsStore((state) => state.addFeedToStore)
  const incrementFeedPageNumber = useFeedsStore((state) => state.incrementFeedPageNumber)

  const uniqueSubplebbitAddresses = useUniqueSorted(subplebbitAddresses)
  const feedName = useFeedName(account?.id, sortType, uniqueSubplebbitAddresses)

  // add feed to store
  useEffect(() => {
    if (!uniqueSubplebbitAddresses || !account) {
      return
    }
    addFeedToStore(feedName, uniqueSubplebbitAddresses, sortType, account).catch((error: unknown) => log.error('useFeed addFeedToStore error', {feedName, error}))
  }, [feedName /*, uniqueSubplebbitAddresses?.toString(), sortType, account?.id*/])

  const loadedFeed = useFeedsStore((state) => state.loadedFeeds[feedName || ''])
  let hasMore = useFeedsStore((state) => state.feedsHaveMore[feedName || ''])
  // if the feed is not yet defined, then it has more
  if (!feedName || typeof hasMore !== 'boolean') {
    hasMore = true
  }

  const loadMore = () => {
    if (!uniqueSubplebbitAddresses || !account) {
      throw Error('useFeed cannot load more feed not initalized yet')
    }
    incrementFeedPageNumber(feedName)
  }

  const feed = useMemo(() => loadedFeed || [], [loadedFeed])
  if (account && subplebbitAddresses?.length) {
    log('useFeed', {
      feed: feed.length,
      hasMore,
      subplebbitAddresses,
      sortType,
      account,
      feedsStoreOptions: useFeedsStore.getState().feedsOptions,
      feedsStore: useFeedsStore.getState(),
    })
  }
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
  const addFeedToStore = useFeedsStore((state) => state.addFeedToStore)

  // do a bunch of calculations to get feedsOptionsFlattened and feedNames
  const {subplebbitAddressesArrays, sortTypes} = useMemo(() => {
    const subplebbitAddressesArrays = []
    const sortTypes = []
    for (const feedOptions of feedsOptions) {
      subplebbitAddressesArrays.push(feedOptions.subplebbitAddresses || [])
      sortTypes.push(feedOptions.sortType)
    }
    return {subplebbitAddressesArrays, sortTypes}
  }, [feedsOptions])
  const uniqueSubplebbitAddressesArrays = useUniqueSortedArrays(subplebbitAddressesArrays)
  const feedNames = useFeedNames(account?.id, sortTypes, uniqueSubplebbitAddressesArrays)

  const bufferedFeeds = useFeedsStore((state) => {
    const bufferedFeeds: Feeds = {}
    for (const feedName of feedNames) {
      if (!feedName) {
        continue
      }
      bufferedFeeds[feedName] = state.bufferedFeeds[feedName]
    }
    return bufferedFeeds
  }, shallow)

  // add feed to store
  useEffect(() => {
    for (const [i] of uniqueSubplebbitAddressesArrays.entries()) {
      const sortType = sortTypes[i] || 'hot'
      const uniqueSubplebbitAddresses = uniqueSubplebbitAddressesArrays[i]
      validator.validateFeedSortType(sortType)
      const feedName = feedNames[i]
      if (!uniqueSubplebbitAddresses || !account) {
        return
      }
      if (!bufferedFeeds[feedName || '']) {
        const isBufferedFeed = true
        addFeedToStore(feedName, uniqueSubplebbitAddresses, sortType, account, isBufferedFeed).catch((error: unknown) =>
          log.error('useBufferedFeeds addFeedToStore error', {feedName, error})
        )
      }
    }
  }, [feedNames])

  // only give to the user the buffered feeds he requested
  const bufferedFeedsArray: Feed[] = useMemo(() => {
    const bufferedFeedsArray: Feed[] = []
    for (const feedName of feedNames) {
      bufferedFeedsArray.push(bufferedFeeds[feedName || ''] || [])
    }
    return bufferedFeedsArray
  }, [bufferedFeeds, feedNames])

  if (account && feedsOptions?.length) {
    log('useBufferedFeeds', {
      bufferedFeeds,
      feedsOptions,
      account,
      accountName,
      feedsStoreOptions: useFeedsStore.getState().feedsOptions,
      feedsStore: useFeedsStore.getState(),
    })
  }
  return bufferedFeedsArray
}

/**
 * Util to find unique and sorted subplebbit addresses for multiple feed options
 */
function useUniqueSortedArrays(stringsArrays?: string[][]) {
  return useMemo(() => {
    const uniqueSorted: string[][] = []
    for (const stringsArray of stringsArrays || []) {
      uniqueSorted.push([...new Set(stringsArray.sort())])
    }
    return uniqueSorted
  }, [stringsArrays])
}

function useUniqueSorted(stringsArray?: string[]) {
  return useMemo(() => {
    if (!stringsArray) {
      return []
    }
    return [...new Set(stringsArray.sort())]
  }, [stringsArray])
}

function useFeedName(accountId: string, sortType: string, uniqueSubplebbitAddresses: string[]) {
  return useMemo(() => {
    return JSON.stringify([accountId, sortType, uniqueSubplebbitAddresses])
  }, [accountId, sortType, uniqueSubplebbitAddresses])
}

function useFeedNames(accountId: string, sortTypes: (string | undefined)[], uniqueSubplebbitAddressesArrays: string[][]) {
  return useMemo(() => {
    const feedNames = []
    for (const [i] of uniqueSubplebbitAddressesArrays.entries()) {
      feedNames.push(JSON.stringify([accountId, sortTypes[i] || 'hot', uniqueSubplebbitAddressesArrays[i]]))
    }
    return feedNames
  }, [accountId, sortTypes, uniqueSubplebbitAddressesArrays])
}
