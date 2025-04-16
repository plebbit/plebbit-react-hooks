import assert from 'assert'
import Logger from '@plebbit/plebbit-logger'
const log = Logger('plebbit-react-hooks:replies:stores')
import {Feed, Feeds, Comment, Comments, Account, RepliesFeedOptions, RepliesFeedsOptions, RepliesPage, CommentsFilter} from '../../types'
import createStore from 'zustand'
import localForageLru from '../../lib/localforage-lru'
import accountsStore from '../accounts'
import repliesCommentsStore from './replies-comments-store'
import repliesPagesStore from '../replies-pages'
import {
  getFeedsCommentsFirstPageCids,
  getLoadedFeeds,
  getBufferedFeedsWithoutLoadedFeeds,
  getUpdatedFeeds,
  getFeedsReplyCounts,
  getFeedsHaveMore,
  feedsCommentsChanged,
  getFeedsComments,
  getFeedsCommentsLoadedCount,
  getFeedsCommentsRepliesPagesFirstUpdatedAts,
  getFilteredSortedFeeds,
  getSortTypeFromComment,
} from './utils'

// reddit loads approximately 25 posts per page
// while infinite scrolling
export const defaultRepliesPerPage = 25

// keep large buffer because fetching cids is slow
export const commentRepliesLeftBeforeNextPage = 50

export type RepliesState = {
  feedsOptions: RepliesFeedsOptions
  bufferedFeeds: Feeds
  loadedFeeds: Feeds
  updatedFeeds: Feeds
  bufferedFeedsReplyCounts: {[feedName: string]: number}
  feedsHaveMore: {[feedName: string]: boolean}
  addFeedToStoreOrUpdateComment: Function
  incrementFeedPageNumber: Function
  resetFeed: Function
  updateFeeds: Function
}

export const feedOptionsToFeedName = (feedOptions: Partial<RepliesFeedOptions>) =>
  feedOptions?.accountId +
  '-' +
  feedOptions?.commentCid +
  '-' +
  feedOptions?.sortType +
  '-' +
  feedOptions?.flat +
  '-' +
  feedOptions?.accountComments +
  '-' +
  feedOptions?.repliesPerPage +
  '-' +
  feedOptions?.filter?.key

// don't updateFeeds more than once per updateFeedsMinIntervalTime
let updateFeedsPending = false
const updateFeedsMinIntervalTime = 100

const repliesStore = createStore<RepliesState>((setState: Function, getState: Function) => ({
  feedsOptions: {},
  bufferedFeeds: {},
  loadedFeeds: {},
  updatedFeeds: {},
  bufferedFeedsReplyCounts: {},
  feedsHaveMore: {},

  addFeedsToStore(feedOptionsArray: RepliesFeedOptions[]) {
    const {feedsOptions: previousFeedsOptions} = getState()
    const newFeedsOptions: RepliesFeedsOptions = {}

    // get all newFeedsOptions
    for (let feedOptions of feedOptionsArray) {
      const feedName = feedOptionsToFeedName(feedOptions)
      // feed is in store already, do nothing
      // if the feed already exist but is at page 0, reset it to page 1
      if (previousFeedsOptions[feedName] && previousFeedsOptions[feedName].pageNumber !== 0) {
        continue
      }

      // set default feed options
      feedOptions = {...feedOptions}
      if (feedOptions.flat === undefined || feedOptions.flat === null) {
        feedOptions.flat = false
      }
      if (feedOptions.accountComments === undefined || feedOptions.accountComments === null) {
        feedOptions.accountComments = true
      }
      feedOptions.repliesPerPage = feedOptions.repliesPerPage || defaultRepliesPerPage

      // to add a buffered feed, add a feed with pageNumber 0
      feedOptions.pageNumber = 1
      newFeedsOptions[feedName] = feedOptions
      log('repliesStore.addFeedToStore', feedOptions)

      // TODO: these subscribe functions get triggered 100s of times for nothing
      // they either need to be tailored with an argument related to the feed options, or only triggered once

      // subscribe to comments store changes
      repliesCommentsStore.subscribe(updateFeedsOnFeedsCommentsChange)

      // subscribe to bufferedFeedsReplyCounts change
      repliesStore.subscribe(addRepliesPagesOnLowBufferedFeedsReplyCounts)

      // subscribe to replies pages store changes
      repliesPagesStore.subscribe(updateFeedsOnFeedsRepliesPagesChange)
    }

    // set new feedsOptions state
    let feedsChanged = false
    setState(({feedsOptions}: RepliesState) => {
      for (const feedName in newFeedsOptions) {
        // make sure to never overwrite a feed already added
        if (feedsOptions[feedName] && feedsOptions[feedName].pageNumber !== 0) {
          delete newFeedsOptions[feedName]
        }
      }
      if (!Object.keys(newFeedsOptions).length) {
        return {}
      }
      feedsChanged = true
      return {feedsOptions: {...feedsOptions, ...newFeedsOptions}}
    })
    return feedsChanged
  },

  async addFeedToStoreOrUpdateComment(comment: Comment, feedOptions: RepliesFeedOptions) {
    // validate options
    assert(comment && comment.cid && typeof comment.cid === 'string', `repliesStore.addFeedToStoreOrUpdateComment comment.cid '${comment?.cid}' invalid`)
    assert(
      feedOptions.commentCid && typeof feedOptions.commentCid === 'string',
      `repliesStore.addFeedToStoreOrUpdateComment feedOptions.commentCid '${feedOptions.commentCid}' invalid`
    )
    assert(
      feedOptions.sortType && typeof feedOptions.sortType === 'string',
      `repliesStore.addFeedToStoreOrUpdateComment feedOptions.sortType '${feedOptions.sortType}' invalid`
    )
    const account = accountsStore.getState().accounts[feedOptions.accountId]
    assert(typeof account?.plebbit?.getSubplebbit === 'function', `repliesStore.addFeedToStoreOrUpdateComment feedOptions.accountId '${feedOptions.accountId}' invalid`)
    assert(
      !feedOptions.repliesPerPage || typeof feedOptions.repliesPerPage === 'number',
      `repliesStore.addFeedToStoreOrUpdateComment feedOptions.repliesPerPage '${feedOptions.repliesPerPage}' invalid`
    )
    assert(
      !feedOptions.filter || typeof feedOptions.filter?.filter === 'function',
      `repliesStore.addFeedToStoreOrUpdateComment feedOptions.filter.filter '${feedOptions.filter?.filter}' invalid`
    )
    assert(
      !feedOptions.filter || typeof feedOptions.filter?.key === 'string',
      `repliesStore.addFeedToStoreOrUpdateComment feedOptions.filter.key '${feedOptions.filter?.key}' invalid`
    )

    // if replies feed isn't in store yet, add it
    const commentsToAddToStoreOrUpdate = [comment]
    const feedsToAddToStore = [feedOptions]

    // if children replies feed arent in store yet, add them
    const addRepliesFeedsToStoreRecursively = (comment: Comment) => {
      // TODO: should we add all sort types, or only feedOptions.sortType?
      for (const sortType in comment.replies?.pages) {
        for (const reply of comment.replies.pages[sortType].comments || []) {
          // reply has no replies, so doesn't need a feed
          if (Object.keys(reply?.replies?.pages || {}).length + Object.keys(reply?.replies?.pageCids || {}).length === 0) {
            continue
          }
          commentsToAddToStoreOrUpdate.push(reply)
          feedsToAddToStore.push({...feedOptions, commentCid: reply?.cid})
          addRepliesFeedsToStoreRecursively(reply)
        }
      }
    }
    addRepliesFeedsToStoreRecursively(comment)

    // add comments to store
    repliesCommentsStore.getState().addCommentsToStoreOrUpdateComments(commentsToAddToStoreOrUpdate)

    // add feeds to store and update feeds
    const {addFeedsToStore, updateFeeds} = getState()
    const feedsChanged = addFeedsToStore(feedsToAddToStore)
    if (feedsChanged) {
      updateFeeds()
    }
  },

  incrementFeedPageNumber(feedName: string) {
    const {feedsOptions, loadedFeeds, updateFeeds} = getState()
    assert(feedsOptions[feedName], `repliesStore.incrementFeedPageNumber feed name '${feedName}' does not exist in feeds store`)
    log('repliesStore.incrementFeedPageNumber', {feedName})

    assert(
      feedsOptions[feedName].pageNumber * feedsOptions[feedName].repliesPerPage <= loadedFeeds[feedName].length,
      `repliesStore.incrementFeedPageNumber cannot increment feed page number before current page has loaded`
    )
    setState(({feedsOptions, loadedFeeds}: any) => {
      // don't increment page number before the current page has loaded
      if (feedsOptions[feedName].pageNumber * feedsOptions[feedName].repliesPerPage > loadedFeeds[feedName].length) {
        return {}
      }
      const feedOptions = {
        ...feedsOptions[feedName],
        pageNumber: feedsOptions[feedName].pageNumber + 1,
      }
      return {feedsOptions: {...feedsOptions, [feedName]: feedOptions}}
    })

    // do not update feed at the same time as increment a page number or it might cause
    // a race condition, rather schedule a feed update
    updateFeeds()
  },

  resetFeed(feedName: string) {
    const {feedsOptions, updateFeeds} = getState()
    assert(feedsOptions[feedName], `repliesStore.resetFeed feed name '${feedName}' does not exist in feeds store`)
    assert(feedsOptions[feedName].pageNumber >= 1, `repliesStore.resetFeed cannot reset feed page number '${feedsOptions[feedName].pageNumber}' lower than 1`)
    log('repliesStore.resetFeed', {feedName})

    setState(({feedsOptions, loadedFeeds, updatedFeeds}: any) => {
      const feedOptions = {
        ...feedsOptions[feedName],
        pageNumber: 1,
      }
      return {
        feedsOptions: {...feedsOptions, [feedName]: feedOptions},
        loadedFeeds: {...loadedFeeds, [feedName]: []},
        updatedFeeds: {...updatedFeeds, [feedName]: []},
      }
    })

    updateFeeds()
  },

  // recalculate all feeds using new comments.replies.pages, repliesPagesStore and page numbers
  updateFeeds() {
    if (updateFeedsPending) {
      return
    }
    updateFeedsPending = true

    // don't update feeds more than once per updateFeedsMinIntervalTime
    const timeUntilNextUpdate = Date.now() % updateFeedsMinIntervalTime

    setTimeout(async () => {
      // allow a new update to be scheduled as soon as updateFeedsMinIntervalTime elapses
      updateFeedsPending = false

      // get state from all stores
      const previousState = getState()
      const {feedsOptions} = previousState
      const {comments} = repliesCommentsStore.getState()
      const {repliesPages} = repliesPagesStore.getState()
      const {accounts} = accountsStore.getState()

      // calculate new feeds
      const filteredSortedFeeds = getFilteredSortedFeeds(feedsOptions, comments, repliesPages, accounts)
      const bufferedFeedsWithoutPreviousLoadedFeeds = getBufferedFeedsWithoutLoadedFeeds(filteredSortedFeeds, previousState.loadedFeeds)
      const loadedFeeds = await getLoadedFeeds(feedsOptions, previousState.loadedFeeds, bufferedFeedsWithoutPreviousLoadedFeeds, accounts)
      // after loaded feeds are caculated, remove new loaded feeds (again) from buffered feeds
      const bufferedFeeds = getBufferedFeedsWithoutLoadedFeeds(bufferedFeedsWithoutPreviousLoadedFeeds, loadedFeeds)
      const bufferedFeedsReplyCounts = getFeedsReplyCounts(feedsOptions, bufferedFeeds)
      const feedsHaveMore = getFeedsHaveMore(feedsOptions, bufferedFeeds, comments, repliesPages, accounts)
      const updatedFeeds = await getUpdatedFeeds(feedsOptions, filteredSortedFeeds, previousState.updatedFeeds, loadedFeeds, accounts)

      // set new feeds
      setState((state: any) => ({bufferedFeeds, loadedFeeds, bufferedFeedsReplyCounts, updatedFeeds, feedsHaveMore}))
      log.trace('repliesStore.updateFeeds', {
        feedsOptions,
        bufferedFeeds,
        loadedFeeds,
        bufferedFeedsReplyCounts,
        updatedFeeds,
        feedsHaveMore,
        comments,
        repliesPages,
      })
    }, timeUntilNextUpdate)
  },
}))

let previousRepliesPages: {[pageCid: string]: RepliesPage} = {}
const updateFeedsOnFeedsRepliesPagesChange = (repliesPagesStoreState: any) => {
  const {repliesPages} = repliesPagesStoreState

  // no changes, do nothing
  if (repliesPages === previousRepliesPages) {
    return
  }
  previousRepliesPages = repliesPages

  // currently only the feeds use repliesPagesStore, so any change must
  // trigger a feed update, if in the future another hook uses the repliesPagesStore
  // we should check if the replies pages changed are actually used by the feeds before
  // triggering an update
  repliesStore.getState().updateFeeds()
}

let previousBufferedFeedsReplyCountsPageCids: string[] = []
let previousBufferedFeedsComments = new Map<string, Comments>()
let previousBufferedFeedsReplyCounts: {[feedName: string]: number} = {}
const addRepliesPagesOnLowBufferedFeedsReplyCounts = (repliesStoreState: any) => {
  const {bufferedFeedsReplyCounts, feedsOptions} = repliesStore.getState()
  const {comments} = repliesCommentsStore.getState()

  // if feeds comments have changed, we must try adding them even if buffered replies counts haven't changed
  const bufferedFeedsComments = getFeedsComments(feedsOptions, comments)
  const _feedsCommentsChanged = feedsCommentsChanged(previousBufferedFeedsComments, bufferedFeedsComments)
  const bufferedFeedsReplyCountsChanged = previousBufferedFeedsReplyCounts !== bufferedFeedsReplyCounts

  // if feeds comments havent changed and buffered replies counts also havent changed, do nothing
  if (!_feedsCommentsChanged && !bufferedFeedsReplyCountsChanged) {
    return
  }
  previousBufferedFeedsComments = bufferedFeedsComments
  previousBufferedFeedsReplyCounts = bufferedFeedsReplyCounts

  // in case feeds comments changed, but the first page cids haven't
  const bufferedFeedsReplyCountsPageCids = getFeedsCommentsFirstPageCids(bufferedFeedsComments)
  const bufferedFeedsReplyCountsPageCidsChanged = bufferedFeedsReplyCountsPageCids.toString() !== previousBufferedFeedsReplyCountsPageCids.toString()
  if (!bufferedFeedsReplyCountsPageCidsChanged && !bufferedFeedsReplyCountsChanged) {
    return
  }
  previousBufferedFeedsReplyCountsPageCids = bufferedFeedsReplyCountsPageCids

  const {addNextRepliesPageToStore} = repliesPagesStore.getState()
  const {accounts} = accountsStore.getState()

  // bufferedFeedsReplyCounts have changed, check if any of them are low
  for (const feedName in bufferedFeedsReplyCounts) {
    const account = accounts[feedsOptions[feedName].accountId]
    const feedReplyCount = bufferedFeedsReplyCounts[feedName]
    let sortType = feedsOptions[feedName].sortType
    const commentCid = feedsOptions[feedName].commentCid

    // TODO: maybe skip if comment subplebbit address, comment cid or comment author is blocked?

    // comment hasn't loaded yet
    if (!comments[commentCid]) {
      continue
    }

    sortType = getSortTypeFromComment(comments[commentCid], feedsOptions[feedName])

    // comment replies count is low, fetch next replies page
    if (feedReplyCount <= commentRepliesLeftBeforeNextPage) {
      addNextRepliesPageToStore(comments[commentCid], sortType, account).catch((error: unknown) =>
        log.error('repliesStore repliesPagesStore.addNextRepliesPageToStore error', {commentCid, comment: comments[commentCid], sortType, error})
      )
    }
  }
}

let previousFeedsCommentsFirstPageCids: string[] = []
let previousFeedsComments: Map<string, Comments> = new Map()
let previousFeedsCommentsLoadedCount = 0
let previousFeedsCommentsRepliesPagesFirstUpdatedAts = ''
const updateFeedsOnFeedsCommentsChange = (repliesCommentsStoreState: any) => {
  const {comments} = repliesCommentsStoreState
  const {feedsOptions, updateFeeds} = repliesStore.getState()

  // feeds comments haven't changed, do nothing
  const feedsComments = getFeedsComments(feedsOptions, comments)
  if (!feedsCommentsChanged(previousFeedsComments, feedsComments)) {
    return
  }
  previousFeedsComments = feedsComments

  // decide if feeds comments have changed by looking at all feeds comments page cids
  // (in case that a comment changed, but its first page cid didn't)
  const feedsCommentsFirstPageCids = getFeedsCommentsFirstPageCids(feedsComments)

  // first page cids haven't changed, do nothing
  if (feedsCommentsFirstPageCids.toString() === previousFeedsCommentsFirstPageCids.toString()) {
    // if no new feed comments have loaded, do nothing
    // in case a comment loads with no first page cid and first pages cids don't change, need to trigger hasMore update
    const feedsCommentsLoadedCount = getFeedsCommentsLoadedCount(feedsComments)
    if (feedsCommentsLoadedCount === previousFeedsCommentsLoadedCount) {
      // if comment.replies.pages haven't changed, do nothing
      const feedsCommentsRepliesPagesFirstUpdatedAts = getFeedsCommentsRepliesPagesFirstUpdatedAts(feedsComments)
      if (feedsCommentsRepliesPagesFirstUpdatedAts === previousFeedsCommentsRepliesPagesFirstUpdatedAts) {
        return
      }

      previousFeedsCommentsRepliesPagesFirstUpdatedAts = feedsCommentsRepliesPagesFirstUpdatedAts
    }
    previousFeedsCommentsLoadedCount = feedsCommentsLoadedCount
  }

  // feeds comments have changed, update feeds
  previousFeedsCommentsFirstPageCids = feedsCommentsFirstPageCids
  updateFeeds()
}

// reset store in between tests
const originalState = repliesStore.getState()
// async function because some stores have async init
export const resetRepliesStore = async () => {
  previousBufferedFeedsReplyCounts = {}
  previousBufferedFeedsReplyCountsPageCids = []
  previousBufferedFeedsComments = new Map()
  previousFeedsCommentsFirstPageCids = []
  previousFeedsComments = new Map()
  previousFeedsCommentsLoadedCount = 0
  previousFeedsCommentsRepliesPagesFirstUpdatedAts = ''
  previousRepliesPages = {}
  updateFeedsPending = false
  // destroy all component subscriptions to the store
  repliesStore.destroy()
  // restore original state
  repliesStore.setState(originalState)
  repliesCommentsStore.setState({...repliesCommentsStore.getState(), comments: {}})
}

// reset database and store in between tests
export const resetRepliesDatabaseAndStore = async () => {
  await localForageLru.createInstance({name: 'repliesPages'}).clear()
  await resetRepliesStore()
}

export default repliesStore
