import {useEffect, useMemo, useState} from 'react'
import {useAccount} from '../accounts'
import validator from '../../lib/validator'
import Logger from '@plebbit/plebbit-logger'
const log = Logger('plebbit-react-hooks:feeds:hooks')
import assert from 'assert'
import {Feed, Feeds, UseBufferedFeedsOptions, UseBufferedFeedsResult, UseFeedOptions, UseFeedResult, CommentsFilter} from '../../types'
import useFeedsStore from '../../stores/feeds'
import shallow from 'zustand/shallow'

/**
 * @param subplebbitAddresses - The addresses of the subplebbits, e.g. ['memes.eth', '12D3KooW...']
 * @param sortType - The sorting algo for the feed: 'hot' | 'new' | 'active' | 'topHour' | 'topDay' | 'topWeek' | 'topMonth' | 'topYear' | 'topAll' | 'controversialHour' | 'controversialDay' | 'controversialWeek' | 'controversialMonth' | 'controversialYear' | 'controversialAll'
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useFeed(options?: UseFeedOptions): UseFeedResult {
  assert(!options || typeof options === 'object', `useFeed options argument '${options}' not an object`)
  let {subplebbitAddresses, sortType, accountName, postsPerPage, filter, newerThan} = options || {}
  sortType = getSortType(sortType, newerThan)

  validator.validateUseFeedArguments(subplebbitAddresses, sortType, accountName, postsPerPage, filter, newerThan)
  const account = useAccount({accountName})
  const addFeedToStore = useFeedsStore((state) => state.addFeedToStore)
  const incrementFeedPageNumber = useFeedsStore((state) => state.incrementFeedPageNumber)
  const resetFeed = useFeedsStore((state) => state.resetFeed)
  const uniqueSubplebbitAddresses = useUniqueSorted(subplebbitAddresses)
  const feedName = useFeedName(account?.id, sortType, uniqueSubplebbitAddresses, postsPerPage, filter, newerThan)
  const [errors, setErrors] = useState<Error[]>([])
  const subplebbitAddressesWithNewerPosts = useFeedsStore((state) => state.feedsSubplebbitAddressesWithNewerPosts[feedName])

  // add feed to store
  useEffect(() => {
    if (!uniqueSubplebbitAddresses?.length || !account) {
      return
    }
    const isBufferedFeed = false
    addFeedToStore(feedName, uniqueSubplebbitAddresses, sortType, account, isBufferedFeed, postsPerPage, filter, newerThan).catch((error: unknown) =>
      log.error('useFeed addFeedToStore error', {feedName, error})
    )
  }, [feedName])

  const feed = useFeedsStore((state) => state.loadedFeeds[feedName || ''])
  const updatedFeed = useFeedsStore((state) => state.updatedFeeds[feedName || ''])
  let hasMore = useFeedsStore((state) => state.feedsHaveMore[feedName || ''])
  // if the feed is not yet defined, then it has more
  if (!feedName || typeof hasMore !== 'boolean') {
    hasMore = true
  }
  // if the feed is not yet defined, but no subplebbit addresses, doesn't have more
  if (!subplebbitAddresses?.length) {
    hasMore = false
  }

  const loadMore = async () => {
    try {
      if (!uniqueSubplebbitAddresses || !account) {
        throw Error('useFeed cannot load more feed not initalized yet')
      }
      incrementFeedPageNumber(feedName)
    } catch (e: any) {
      // wait 100 ms so infinite scroll doesn't spam this function
      await new Promise((r) => setTimeout(r, 50))
      setErrors([...errors, e])
    }
  }

  const reset = async () => {
    try {
      if (!uniqueSubplebbitAddresses || !account) {
        throw Error('useFeed cannot reset feed not initalized yet')
      }
      resetFeed(feedName)
    } catch (e: any) {
      // wait 100 ms so infinite scroll doesn't spam this function
      await new Promise((r) => setTimeout(r, 50))
      setErrors([...errors, e])
    }
  }

  if (account && subplebbitAddresses?.length) {
    log('useFeed', {
      feedLength: feed?.length || 0,
      hasMore,
      subplebbitAddresses,
      sortType,
      account,
      feedsStoreOptions: useFeedsStore.getState().feedsOptions,
      feedsStore: useFeedsStore.getState(),
    })
  }

  const state = !hasMore ? 'succeeded' : 'fetching-ipns'

  return useMemo(
    () => ({
      feed: feed || [],
      updatedFeed: updatedFeed || [],
      hasMore,
      subplebbitAddressesWithNewerPosts: subplebbitAddressesWithNewerPosts || [],
      loadMore,
      reset,
      state,
      error: errors[errors.length - 1],
      errors,
    }),
    [feed, updatedFeed, feedName, hasMore, errors, subplebbitAddressesWithNewerPosts]
  )
}

/**
 * Use useBufferedFeeds to buffer multiple feeds in the background so what when
 * they are called by useFeed later, they are already preloaded.
 *
 * @param feedOptions - The options of the feed
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useBufferedFeeds(options?: UseBufferedFeedsOptions): UseBufferedFeedsResult {
  assert(!options || typeof options === 'object', `useBufferedFeeds options argument '${options}' not an object`)
  const {feedsOptions, accountName} = options || {}
  validator.validateUseBufferedFeedsArguments(feedsOptions, accountName)
  const account = useAccount({accountName})
  const addFeedToStore = useFeedsStore((state) => state.addFeedToStore)

  // do a bunch of calculations to get feedsOptionsFlattened and feedNames
  const {subplebbitAddressesArrays, sortTypes, postsPerPages, filters, newerThans} = useMemo(() => {
    const subplebbitAddressesArrays = []
    const sortTypes = []
    const postsPerPages = []
    const filters = []
    const newerThans = []
    for (const feedOptions of feedsOptions || []) {
      subplebbitAddressesArrays.push(feedOptions.subplebbitAddresses || [])
      sortTypes.push(getSortType(feedOptions.sortType, feedOptions.newerThan))
      postsPerPages.push(feedOptions.postsPerPage)
      filters.push(feedOptions.filter)
      newerThans.push(feedOptions.newerThan)
    }
    return {subplebbitAddressesArrays, sortTypes, postsPerPages, filters, newerThans}
  }, [feedsOptions])
  const uniqueSubplebbitAddressesArrays = useUniqueSortedArrays(subplebbitAddressesArrays)
  const feedNames = useFeedNames(account?.id, sortTypes, uniqueSubplebbitAddressesArrays, postsPerPages, filters, newerThans)

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

  const state = 'fetching-ipns'

  return useMemo(
    () => ({
      bufferedFeeds: bufferedFeedsArray,
      state,
      error: undefined,
      errors: [],
    }),
    [bufferedFeedsArray, feedsOptions]
  )
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

function useFeedName(accountId: string, sortType: string, uniqueSubplebbitAddresses: string[], postsPerPage?: number, filter?: CommentsFilter, newerThan?: number) {
  return useMemo(() => {
    return accountId + '-' + sortType + '-' + uniqueSubplebbitAddresses + '-' + postsPerPage + '-' + filter?.key + '-' + newerThan
  }, [accountId, sortType, uniqueSubplebbitAddresses, postsPerPage, filter?.key, newerThan])
}

function useFeedNames(
  accountId: string,
  sortTypes: (string | undefined)[],
  uniqueSubplebbitAddressesArrays: string[][],
  postsPerPages: (number | undefined)[],
  filters: (CommentsFilter | undefined)[],
  newerThans: (number | undefined)[]
) {
  return useMemo(() => {
    const feedNames = []
    for (const [i] of sortTypes.entries()) {
      feedNames.push(
        accountId + '-' + (sortTypes[i] || 'hot') + '-' + uniqueSubplebbitAddressesArrays[i] + '-' + postsPerPages[i] + '-' + filters[i]?.key + '-' + newerThans[i]
      )
    }
    return feedNames
  }, [accountId, sortTypes, uniqueSubplebbitAddressesArrays, postsPerPages, filters, newerThans])
}

const getSortType = (sortType?: string, newerThan?: number) => {
  if (!sortType) {
    sortType = 'hot'
  } else if (newerThan && (sortType === 'topAll' || sortType === 'controversialAll')) {
    let time: string | undefined
    if (newerThan <= 60 * 60 * 24) {
      time = 'Day'
    } else if (newerThan <= 60 * 60 * 24 * 7) {
      time = 'Week'
    } else if (newerThan <= 60 * 60 * 24 * 31) {
      time = 'Month'
    } else if (newerThan <= 60 * 60 * 24 * 365) {
      time = 'Year'
    }
    if (time) {
      if (sortType === 'topAll') {
        sortType = `top${time}`
      } else if (sortType === 'controversialAll') {
        sortType = `controversial${time}`
      }
    }
  }
  return sortType
}
