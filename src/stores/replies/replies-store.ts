import assert from 'assert'
import Logger from '@plebbit/plebbit-logger'
const log = Logger('plebbit-react-hooks:replies:stores')
import {Feed, Feeds, Comment, Comments, Account, RepliesFeedsOptions, RepliesPage, CommentsFilter} from '../../types'
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
  addFeedToStore: Function
  addFeedToStoreOrUpdateComment: Function
  incrementFeedPageNumber: Function
  resetFeed: Function
  updateFeeds: Function
}

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

  async addFeedToStore(
    feedName: string,
    commentCid: string,
    sortType: string,
    account: Account,
    flat?: boolean,
    accountComments?: boolean,
    repliesPerPage?: number,
    filter?: CommentsFilter
  ) {
    assert(feedName && typeof feedName === 'string', `repliesStore.addFeedToStore feedName '${feedName}' invalid`)
    assert(commentCid && typeof commentCid === 'string', `repliesStore.addFeedToStore commentCid '${commentCid}' invalid`)
    assert(sortType && typeof sortType === 'string', `addFeedToStore.addFeedToStore sortType '${sortType}' invalid`)
    assert(typeof account?.plebbit?.getSubplebbit === 'function', `addFeedToStore.addFeedToStore account '${account}' invalid`)
    if (flat === undefined || flat === null) {
      flat = false
    }
    if (accountComments === undefined || accountComments === null) {
      accountComments = true
    }
    repliesPerPage = repliesPerPage || defaultRepliesPerPage
    assert(typeof repliesPerPage === 'number', `addFeedToStore.addFeedToStore repliesPerPage '${repliesPerPage}' invalid`)
    assert(!filter || typeof filter?.filter === 'function', `addFeedToStore.addFeedToStore filter.filter '${filter?.filter}' invalid`)
    assert(!filter || typeof filter?.key === 'string', `addFeedToStore.addFeedToStore filter.key '${filter?.key}' invalid`)

    const {feedsOptions, updateFeeds} = getState()
    // feed is in store already, do nothing
    // if the feed already exist but is at page 0, reset it to page 1
    if (feedsOptions[feedName] && feedsOptions[feedName].pageNumber !== 0) {
      return
    }
    // to add a buffered feed, add a feed with pageNumber 0
    const feedOptions = {commentCid, sortType, accountId: account.id, pageNumber: 1, flat, accountComments, repliesPerPage, filter}
    log('repliesStore.addFeedToStore', feedOptions)
    setState(({feedsOptions}: any) => {
      // make sure to never overwrite a feed already added
      if (feedsOptions[feedName] && feedsOptions[feedName].pageNumber !== 0) {
        throw Error(`repliesStore.addFeedToStore feed '${feedName}' already added`)
      }
      return {feedsOptions: {...feedsOptions, [feedName]: feedOptions}}
    })

    // subscribe to comments store changes
    repliesCommentsStore.subscribe(updateFeedsOnFeedsCommentsChange)

    // subscribe to bufferedFeedsReplyCounts change
    repliesStore.subscribe(addRepliesPagesOnLowBufferedFeedsReplyCounts)

    // subscribe to replies pages store changes
    repliesPagesStore.subscribe(updateFeedsOnFeedsRepliesPagesChange)

    // update feeds right away to use the already loaded comments and pages
    // if no new comments are added by the feed, like for a sort type change,
    // a feed update will never be triggered, so must be triggered it manually
    updateFeeds()
  },

  async addFeedToStoreOrUpdateComment(
    feedName: string,
    comment: Comment,
    sortType: string,
    account: Account,
    flat?: boolean,
    accountComments?: boolean,
    repliesPerPage?: number,
    filter?: CommentsFilter
  ) {
    assert(feedName && typeof feedName === 'string', `repliesStore.addFeedToStoreOrUpdateComment feedName '${feedName}' invalid`)
    assert(comment && comment.cid && typeof comment.cid === 'string', `repliesStore.addFeedToStoreOrUpdateComment comment.cid '${comment?.cid}' invalid`)
    assert(sortType && typeof sortType === 'string', `repliesStore.addFeedToStoreOrUpdateComment sortType '${sortType}' invalid`)
    assert(typeof account?.plebbit?.getSubplebbit === 'function', `repliesStore.addFeedToStoreOrUpdateComment account '${account}' invalid`)

    // repliesStore don't use commentsStore to save resources by avoiding calling comment.update()
    // the repliesCommentsStore must be updated manually every time the comment argument from useReplies changes
    repliesCommentsStore.getState().addCommentToStoreOrUpdateComment(comment)

    // if replies feed isn't in store yet, add it
    const {feedsOptions, updateFeeds, addFeedToStore} = getState()
    if (!feedsOptions[feedName] || feedsOptions[feedName].pageNumber === 0) {
      addFeedToStore(feedName, comment.cid, sortType, account, flat, accountComments, repliesPerPage, filter)
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
