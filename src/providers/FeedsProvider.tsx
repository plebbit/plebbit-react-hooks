import React, { useState, useEffect, useContext, useMemo } from 'react'
import {SubplebbitsContext} from './SubplebbitsProvider'
import validator from '../lib/validator'
import assert from 'assert'
import Debug from 'debug'
const debug = Debug('plebbitreacthooks:providers:feedsprovider')
import {Props, Feed, Feeds, Account} from '../types'

type FeedsContext = any

export const FeedsContext = React.createContext<FeedsContext | undefined>(undefined)

export default function FeedsProvider(props: Props): JSX.Element | null {
  const [feedsOptions, setFeedsOptions] = useState({})

  const subplebbits = useSubplebbits(feedsOptions)
  const feeds = useFeeds(feedsOptions, subplebbits)

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

  debug({ feedsContext: feeds, feedsOptions, subplebbits })
  return <FeedsContext.Provider value={feedsContext}>{props.children}</FeedsContext.Provider>
}

function useFeeds(feedsOptions: any, subplebbits: any) {
  return useMemo(() => {
    const feeds: any = {}
    for (const feedName in feedsOptions) {
      const {subplebbitAddresses, sortedBy} = feedsOptions[feedName]
      const feedPosts = []
      for (const subplebbitAddress of subplebbitAddresses) {
        const subplebbit = subplebbits[subplebbitAddress]
        const sortedPosts = subplebbit?.sortedPosts?.[sortedBy]?.comments
        if (!subplebbit || !sortedPosts) {
          continue
        }
        for (const post of sortedPosts) {
          feedPosts.push(post)
        }
      }
      feeds[feedName] = feedPosts
    }
    return feeds
  }, [feedsOptions, subplebbits])
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

  debug('FeedsProvider useSubplebbits', { subplebbitsContext: subplebbitsContext.subplebbits })
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
