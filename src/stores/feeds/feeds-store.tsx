import React, {useState, useEffect, useMemo} from 'react'
import useSubplebbitsStore from '../subplebbits'
import assert from 'assert'
import localForageLru from '../../lib/localforage-lru'
import Debug from 'debug'
const debug = Debug('plebbit-react-hooks:stores:feeds')
import {Props, Feed, Feeds, Subplebbits, Account, Accounts, SubplebbitPage, SubplebbitsPages, SubplebbitsPagesInfo, SubplebbitsPostsInfo, FeedsOptions} from '../../types'
import createStore from 'zustand'

// reddit loads approximately 25 posts per page
// while infinite scrolling
const postsPerPage = 25

// reset all event listeners in between tests
export const listeners: any = []

type FeedsState = {
  feedsOptions: FeedsOptions
  bufferedFeeds: Feeds
  loadedFeeds: Feeds
  addFeedToStore: Function
  incrementFeedPageNumber: Function
}

const useFeedsStore = createStore<FeedsState>((setState: Function, getState: Function) => ({
  feedsOptions: {},
  bufferedFeeds: {},
  loadedFeeds: {},

  async addFeedToStore(feedName: string, subplebbitAddresses: string[], sortType: string, account: Account, isBufferedFeed?: boolean) {
    const {feedsOptions} = getState()
    // feed is in store already, do nothing
    // if the feed already exist but is at page 1, reset it to page 1
    if (feedsOptions[feedName] && feedsOptions[feedName].pageNumber !== 0) {
      return
    }
    // to add a buffered feed, add a feed with pageNumber 0
    const feedOptions = {subplebbitAddresses, sortType, account, pageNumber: isBufferedFeed === true ? 0 : 1}
    debug('feedsActions.addFeedToStore', feedOptions)
    setState(({feedsOptions}: any) => {
      // make sure to never overwrite a feed already added
      if (feedsOptions[feedName]) {
        return {}
      }
      return {feedsOptions: {...feedsOptions, [feedName]: feedOptions}}
    })
  },

  async incrementFeedPageNumber(feedName: string) {
    const {feedsOptions, loadedFeeds} = getState()
    assert(feedsOptions[feedName], `feedsActions.incrementFeedPageNumber feed name '${feedName}' does not exist in feeds store`)
    debug('feedsActions.incrementFeedPageNumber', {feedName})

    assert(
      feedsOptions[feedName].pageNumber * postsPerPage <= loadedFeeds[feedName].length,
      `feedsActions.incrementFeedPageNumber cannot increment feed page number before current page has loaded`
    )
    setState(({feedsOptions, loadedFeeds}: any) => {
      // don't increment page number before the current page has loaded
      if (feedsOptions[feedName].pageNumber * postsPerPage > loadedFeeds[feedName].length) {
        return {}
      }
      const feedOptions = {
        ...feedsOptions[feedName],
        pageNumber: feedsOptions[feedName].pageNumber + 1,
      }
      return {feedsOptions: {...feedsOptions, [feedName]: feedOptions}}
    })
  },
}))

// reset store in between tests
const originalState = useFeedsStore.getState()
// async function because some stores have async init
export const resetFeedsStore = async () => {
  // remove all event listeners
  listeners.forEach((listener: any) => listener.removeAllListeners())
  // destroy all component subscriptions to the store
  useFeedsStore.destroy()
  // restore original state
  useFeedsStore.setState(originalState)
}

export default useFeedsStore
