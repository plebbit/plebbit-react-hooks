import assert from 'assert'
import {Feed, Feeds, RepliesFeedOptions, RepliesFeedsOptions, Comment, Comments, Account, Accounts, RepliesPage, RepliesPages} from '../../types'
import {getRepliesPages, getRepliesFirstPageCid} from '../replies-pages'
import repliesSorter from '../feeds/feed-sorter'
import {commentRepliesCacheExpired} from '../../lib/utils'

/**
 * Calculate the feeds from all the loaded replies pages, filter and sort them
 */
const validReplies: {[replyCid: string]: boolean} = {}
export const getFilteredSortedFeeds = async (feedsOptions: RepliesFeedsOptions, comments: Comments, repliesPages: RepliesPages, accounts: Accounts) => {
  // calculate each feed
  let feeds: Feeds = {}
  for (const feedName in feedsOptions) {
    const {commentCid, sortType, accountId, filter} = feedsOptions[feedName]

    // find all fetched replies
    const bufferedFeedReplies = []
    const comment = comments[commentCid]
    // TODO: implement comment.fetchedAt
    const _commentRepliesCacheExpired = false // commentRepliesCacheExpired(comment) && window.navigator.onLine

    // comment has loaded and cache not expired
    if (comment && !_commentRepliesCacheExpired) {
      // use comment preloaded replies if any
      const preloadedReplies = comment.replies?.pages?.[sortType]?.comments
      if (preloadedReplies) {
        bufferedFeedReplies.push(...preloadedReplies)
      }

      // add all replies from comment replies pages
      const _repliesPages = getRepliesPages(comment, sortType, repliesPages)
      for (const repliesPage of _repliesPages) {
        if (repliesPage?.comments) {
          bufferedFeedReplies.push(...repliesPage.comments)
        }
      }
    }

    // sort the feed before filtering to get more accurate results
    const sortedBufferedFeedReplies = repliesSorter.sort(sortType, bufferedFeedReplies)

    // filter the feed
    const filteredSortedBufferedFeedReplies = []
    for (const reply of sortedBufferedFeedReplies) {
      // TODO: maybe skip if comment subplebbit address, comment cid or comment author is blocked?

      // feedOptions filter function
      if (filter && !filter.filter(reply)) {
        continue
      }

      // TODO: switch this to before adding loaded feeds
      // validate reply schema and signature
      if (validReplies[reply.cid] === false) {
        continue
      }
      if (validReplies[reply.cid] !== true) {
        // TODO: cache createSubplebbit using utils.validatePage(page, subplebbitAddress)
        const comment = await accounts[accountId]?.plebbit.createComment({cid: reply.cid, postCid: reply.postCid})
        if (comment) {
          try {
            await comment.replies.validatePage({comments: [reply]})
            validReplies[reply.cid] = true
          } catch (e) {
            validReplies[reply.cid] = false
            continue
          }
        }
      }

      filteredSortedBufferedFeedReplies.push(reply)
    }

    feeds[feedName] = filteredSortedBufferedFeedReplies
  }
  return feeds
}

export const getLoadedFeeds = (feedsOptions: RepliesFeedsOptions, loadedFeeds: Feeds, bufferedFeeds: Feeds) => {
  const loadedFeedsMissingReplies: Feeds = {}
  for (const feedName in feedsOptions) {
    const {pageNumber, repliesPerPage} = feedsOptions[feedName]
    const loadedFeedReplyCount = pageNumber * repliesPerPage
    const currentLoadedFeed = loadedFeeds[feedName] || []
    const missingRepliesCount = loadedFeedReplyCount - currentLoadedFeed.length

    // get new replies from buffered feed
    const bufferedFeed = bufferedFeeds[feedName] || []
    const missingReplies = [...bufferedFeed]
    if (missingReplies.length > missingRepliesCount) {
      missingReplies.length = missingRepliesCount
    }

    // TODO: update replies in already loaded feeds with new votes and reply counts

    // the current loaded feed already exist and doesn't need new replies
    if (missingReplies.length === 0 && loadedFeeds[feedName]) {
      continue
    }
    loadedFeedsMissingReplies[feedName] = missingReplies
  }
  // do nothing if there are no missing replies
  if (Object.keys(loadedFeedsMissingReplies).length === 0) {
    return loadedFeeds
  }
  const newLoadedFeeds: Feeds = {}
  for (const feedName in loadedFeedsMissingReplies) {
    newLoadedFeeds[feedName] = [...(loadedFeeds[feedName] || []), ...loadedFeedsMissingReplies[feedName]]
  }
  return {...loadedFeeds, ...newLoadedFeeds}
}

export const getBufferedFeedsWithoutLoadedFeeds = (bufferedFeeds: Feeds, loadedFeeds: Feeds) => {
  // contruct a list of replies already loaded to remove them from buffered feeds
  const loadedFeedsReplies: {[key: string]: Set<string>} = {}
  for (const feedName in loadedFeeds) {
    loadedFeedsReplies[feedName] = new Set()
    for (const reply of loadedFeeds[feedName]) {
      loadedFeedsReplies[feedName].add(reply.cid)
    }
  }

  const newBufferedFeeds: Feeds = {}
  for (const feedName in bufferedFeeds) {
    newBufferedFeeds[feedName] = []
    for (const reply of bufferedFeeds[feedName]) {
      if (loadedFeedsReplies[feedName]?.has(reply.cid)) {
        continue
      }
      newBufferedFeeds[feedName].push(reply)
    }
  }
  return newBufferedFeeds
}

// find how many replies are left in each comments in a buffereds feeds
export const getFeedsReplyCounts = (feedsOptions: RepliesFeedsOptions, feeds: Feeds) => {
  const feedsReplyCounts: {[feedName: string]: number} = {}
  for (const feedName in feedsOptions) {
    const commentCid = feedsOptions[feedName].commentCid
    feedsReplyCounts[feedName] = 0
    for (const comment of feeds[feedName] || []) {
      feedsReplyCounts[feedName]++
    }
  }
  return feedsReplyCounts
}

/**
 * Get which feeds have more replies, i.e. have not reached the final page of all comments
 */
export const getFeedsHaveMore = (feedsOptions: RepliesFeedsOptions, bufferedFeeds: Feeds, comments: Comments, repliesPages: RepliesPages, accounts: Accounts) => {
  const feedsHaveMore: {[feedName: string]: boolean} = {}
  for (const feedName in feedsOptions) {
    // if the feed still has buffered replies, then it still has more
    if (bufferedFeeds[feedName]?.length) {
      feedsHaveMore[feedName] = true
      continue
    }

    const {commentCid, sortType, accountId} = feedsOptions[feedName]

    // TODO: maybe skip if comment cid is blocked?

    const comment = comments[commentCid]
    // if at least comment hasn't loaded yet, then the feed still has more
    if (!comment?.updatedAt) {
      feedsHaveMore[feedName] = true
      continue
    }

    // TODO: implement comment.fetchedAt
    // if comment replies cache expired, then the feed still has more
    // if (commentRepliesCacheExpired(comment)) {
    //   feedsHaveMore[feedName] = true
    //   continue
    // }

    const firstPageCid = getRepliesFirstPageCid(comment, sortType)
    // TODO: if a loaded comment doesn't have a first page, it's unclear what we should do
    // should we try to use another sort type by default, like 'best', or should we just ignore it?
    // 'continue' to ignore it for now
    if (!firstPageCid) {
      continue
    }
    const pages = getRepliesPages(comment, sortType, repliesPages)
    // if first page isn't loaded yet, then the feed still has more
    if (!pages.length) {
      feedsHaveMore[feedName] = true
      continue
    }
    const lastPage = pages[pages.length - 1]
    if (lastPage.nextCid) {
      feedsHaveMore[feedName] = true
      continue
    }

    // if buffered feeds are empty and no last page of any comment has a next page, then has more is false
    feedsHaveMore[feedName] = false
  }
  return feedsHaveMore
}

// get a partial updateFeeds after a page increment
export const getFeedAfterIncrementPageNumber = (
  feedName: string,
  feedOptions: RepliesFeedOptions,
  bufferedFeed: Feed,
  loadedFeed: Feed,
  comments: Comments,
  repliesPages: RepliesPages,
  accounts: Accounts
) => {
  // transform arguments into objects
  const feedsOptions = {[feedName]: feedOptions}
  const bufferedFeedsWithLoadedFeeds = {[feedName]: bufferedFeed}
  const previousLoadedFeeds = {[feedName]: loadedFeed}

  // calculate values
  const loadedFeeds = getLoadedFeeds(feedsOptions, previousLoadedFeeds, bufferedFeedsWithLoadedFeeds)
  // after loaded feeds are caculated, remove loaded feeds again from buffered feeds
  const bufferedFeeds = getBufferedFeedsWithoutLoadedFeeds(bufferedFeedsWithLoadedFeeds, loadedFeeds)
  const bufferedFeedsReplyCounts = getFeedsReplyCounts(feedsOptions, bufferedFeeds)
  const feedsHaveMore = getFeedsHaveMore(feedsOptions, bufferedFeeds, comments, repliesPages, accounts)

  // transform values back into single properties
  return {
    bufferedFeed: bufferedFeeds[feedName],
    loadedFeed: loadedFeeds[feedName],
    bufferedFeedReplyCounts: bufferedFeedsReplyCounts[feedName],
    feedHasMore: feedsHaveMore[feedName],
  }
}

// get all comments replies pages cids of all feeds, use to check if a commentsStore change should trigger updateFeeds
export const getFeedsComments = (feedsOptions: RepliesFeedsOptions, comments: Comments) => {
  const feedsComments = new Map<string, Comment>()
  for (const feedName in feedsOptions) {
    feedsComments.set(feedsOptions[feedName].commentCid, comments[feedsOptions[feedName].commentCid])
  }
  return feedsComments
}

export const feedsCommentsChanged = (previousFeedsComments: Map<string, Comment>, feedsComments: Map<string, Comment>) => {
  if (previousFeedsComments.size !== feedsComments.size) {
    return true
  }
  for (let commentCid of previousFeedsComments.keys()) {
    // check if the object is still the same
    if (previousFeedsComments.get(commentCid) !== feedsComments.get(commentCid)) {
      return true
    }
  }
  return false
}

// get all comments replies pages cids of all feeds, use to check if a commentsStore change should trigger updateFeeds
export const getFeedsCommentsFirstPageCids = (feedsComments: Map<string, Comment>): string[] => {
  // find all the feeds comments first page cids
  const feedsCommentsFirstPageCids = new Set<string>()
  for (const comment of feedsComments.values()) {
    if (!comment?.replies) {
      continue
    }

    // check pages
    if (comment.replies.pages) {
      for (const page of Object.values<RepliesPage>(comment.replies.pages)) {
        if (page?.nextCid) {
          feedsCommentsFirstPageCids.add(page?.nextCid)
        }
      }
    }

    // check pageCids
    if (comment.replies.pageCids) {
      for (const pageCid of Object.values<string>(comment.replies.pageCids)) {
        if (pageCid) {
          feedsCommentsFirstPageCids.add(pageCid)
        }
      }
    }
  }

  return [...feedsCommentsFirstPageCids].sort()
}

// get number of feeds comments that are loaded
export const getFeedsCommentsLoadedCount = (feedsComments: Map<string, Comment>): number => {
  let count = 0
  for (const comment of feedsComments.values()) {
    if (comment?.updatedAt) {
      count++
    }
  }
  return count
}
