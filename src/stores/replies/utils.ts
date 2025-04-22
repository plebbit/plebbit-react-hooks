import assert from 'assert'
import {Feed, Feeds, RepliesFeedOptions, RepliesFeedsOptions, Comment, Comments, Account, Accounts, RepliesPage, RepliesPages} from '../../types'
import {getRepliesPages, getRepliesFirstPageCid} from '../replies-pages'
import repliesSorter from '../feeds/feed-sorter'
import {flattenCommentsPages, commentIsValid} from '../../lib/utils'
import Logger from '@plebbit/plebbit-logger'
const log = Logger('plebbit-react-hooks:replies:stores')

/**
 * Calculate the feeds from all the loaded replies pages, filter and sort them
 */
export const getFilteredSortedFeeds = (feedsOptions: RepliesFeedsOptions, comments: Comments, repliesPages: RepliesPages, accounts: Accounts) => {
  // calculate each feed
  let feeds: Feeds = {}
  for (const feedName in feedsOptions) {
    let {commentCid, sortType, accountId, filter, flat} = feedsOptions[feedName]

    // find all fetched replies
    let bufferedFeedReplies = []
    const comment = comments[commentCid]

    sortType = getSortTypeFromComment(comment, feedsOptions[feedName])

    // comment has loaded and cache not expired
    if (comment) {
      // use comment preloaded replies if any
      const preloadedReplies = comment.replies?.pages?.[sortType]?.comments
      if (preloadedReplies) {
        for (const reply of preloadedReplies) {
          // replies are manually validated, could have fake subplebbitAddress
          if (reply.subplebbitAddress !== comment.subplebbitAddress) {
            break
          }
          bufferedFeedReplies.push(reply)
        }
      }

      // add all replies from comment replies pages
      const _repliesPages = getRepliesPages(comment, sortType, repliesPages)
      for (const repliesPage of _repliesPages) {
        if (repliesPage?.comments) {
          for (const reply of repliesPage.comments) {
            // replies are manually validated, could have fake subplebbitAddress
            if (reply.subplebbitAddress !== comment.subplebbitAddress) {
              break
            }
            bufferedFeedReplies.push(reply)
          }
        }
      }
    }

    if (flat) {
      bufferedFeedReplies = flattenCommentsPages({comments: bufferedFeedReplies})
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

      filteredSortedBufferedFeedReplies.push(reply)
    }

    feeds[feedName] = filteredSortedBufferedFeedReplies
  }
  return feeds
}

export const getLoadedFeeds = async (feedsOptions: RepliesFeedsOptions, loadedFeeds: Feeds, bufferedFeeds: Feeds, accounts: Accounts) => {
  const loadedFeedsMissingReplies: Feeds = {}
  for (const feedName in feedsOptions) {
    const {pageNumber, repliesPerPage} = feedsOptions[feedName]
    const loadedFeedReplyCount = pageNumber * repliesPerPage
    const currentLoadedFeed = loadedFeeds[feedName] || []
    const missingRepliesCount = loadedFeedReplyCount - currentLoadedFeed.length

    // get new replies from buffered feed
    const bufferedFeed = bufferedFeeds[feedName] || []

    const missingReplies = []
    for (const reply of bufferedFeed) {
      if (missingReplies.length === missingRepliesCount) {
        break
      }
      // verify signature
      if (!(await commentIsValid(reply))) {
        continue
      }
      missingReplies.push(reply)
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
    let bufferedFeedReplyChanged = false
    for (const [i, reply] of bufferedFeeds[feedName].entries()) {
      if (loadedFeedsReplies[feedName]?.has(reply.cid)) {
        continue
      }
      newBufferedFeeds[feedName].push(reply)
      if (
        !bufferedFeedReplyChanged &&
        (newBufferedFeeds[feedName][i]?.cid !== bufferedFeeds[feedName][i]?.cid ||
          (newBufferedFeeds[feedName][i]?.updatedAt || 0) > (bufferedFeeds[feedName][i]?.updatedAt || 0))
      ) {
        bufferedFeedReplyChanged = true
      }
    }
    if (!bufferedFeedReplyChanged && newBufferedFeeds[feedName].length === bufferedFeeds[feedName].length) {
      newBufferedFeeds[feedName] = bufferedFeeds[feedName]
    }
  }
  return newBufferedFeeds
}

export const getUpdatedFeeds = async (feedsOptions: RepliesFeedsOptions, filteredSortedFeeds: Feeds, updatedFeeds: Feeds, loadedFeeds: Feeds, accounts: Accounts) => {
  // contruct a list of replies already loaded to remove them from buffered feeds
  const updatedFeedsReplies: {[feedName: string]: {[replyCid: string]: any}} = {}
  for (const feedName in updatedFeeds) {
    updatedFeedsReplies[feedName] = {}
    for (const [index, updatedReply] of updatedFeeds[feedName].entries()) {
      updatedFeedsReplies[feedName][updatedReply.cid] = {index, updatedReply}
    }
  }

  const newUpdatedFeeds: Feeds = {...updatedFeeds}
  for (const feedName in filteredSortedFeeds) {
    const updatedFeed = [...(updatedFeeds[feedName] || [])]
    const onlyHasNewReplies = updatedFeed.length === 0
    let updatedFeedChanged = false

    // add new replies from loadedFeed replies
    while (updatedFeed.length < loadedFeeds[feedName].length) {
      updatedFeed[updatedFeed.length] = loadedFeeds[feedName][updatedFeed.length]
      updatedFeedChanged = true
    }

    // add updated replies from filteredSortedFeed
    if (!onlyHasNewReplies) {
      for (const reply of filteredSortedFeeds[feedName]) {
        if (updatedFeedsReplies[feedName]?.[reply.cid]) {
          const {index, updatedReply} = updatedFeedsReplies[feedName][reply.cid]
          if ((reply.updatedAt || 0) > (updatedReply.updatedAt || 0) && (await commentIsValid(reply))) {
            updatedFeed[index] = reply
            updatedFeedChanged = true
          }
        }
      }
    }

    if (updatedFeedChanged) {
      newUpdatedFeeds[feedName] = updatedFeed
    }
  }
  return newUpdatedFeeds
}

// find how many replies are in each comments in a buffereds feeds
// NOTE: not useful, could use feed.length, copied over from useFeed and easier to keep it
export const getFeedsReplyCounts = (feedsOptions: RepliesFeedsOptions, feeds: Feeds) => {
  const feedsReplyCounts: {[feedName: string]: number} = {}
  for (const feedName in feedsOptions) {
    feedsReplyCounts[feedName] = feeds[feedName]?.length || 0
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

    let {commentCid, sortType, accountId} = feedsOptions[feedName]

    // TODO: maybe skip if comment cid is blocked?

    const comment = comments[commentCid]
    // if at least comment hasn't loaded yet, then the feed still has more
    if (!comment?.updatedAt) {
      feedsHaveMore[feedName] = true
      continue
    }

    sortType = getSortTypeFromComment(comment, feedsOptions[feedName])

    const firstPageCid = getRepliesFirstPageCid(comment, sortType)
    // TODO: if a loaded comment doesn't have a first page, it's unclear what we should do
    // should we try to use another sort type by default, like 'best', or should we just ignore it?
    // 'continue' to ignore it for now
    if (!firstPageCid) {
      feedsHaveMore[feedName] = false
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

// get all comments replies pages first reply updatedAts, use to check if a commentsStore change should trigger updateFeeds
export const getFeedsCommentsRepliesPagesFirstUpdatedAts = (feedsComments: Map<string, Comment>): string => {
  let feedsCommentsRepliesPagesFirstUpdatedAts = ''
  for (const comment of feedsComments.values()) {
    for (const page of Object.values<RepliesPage>(comment?.replies?.pages || {})) {
      if (page?.comments?.[0]?.updatedAt) {
        feedsCommentsRepliesPagesFirstUpdatedAts += page.comments[0].cid + page.comments[0].updatedAt
      }
    }
  }
  return feedsCommentsRepliesPagesFirstUpdatedAts
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

// selected sort type could be missing from comment, or not optimized
export const getSortTypeFromComment = (comment: Comment, feedOptions: RepliesFeedOptions) => {
  let {sortType, flat} = feedOptions

  if (!comment) {
    return sortType
  }

  // 'topAll' and 'best' are similar enough to be used interchangeably
  if (sortType === 'best' && !comment.replies?.pages?.best && !comment.replies?.pageCids?.best && (comment.replies?.pages?.topAll || comment.replies?.pageCids?.topAll)) {
    sortType = 'topAll'
  } else if (
    sortType === 'topAll' &&
    !comment.replies?.pages?.topAll &&
    !comment.replies?.pageCids?.topAll &&
    (comment.replies?.pages?.best || comment.replies?.pageCids?.best)
  ) {
    sortType = 'best'
  }

  // if 'new' sort type and flat: true, use 'newFlat'
  else if (sortType === 'new' && flat && (comment.replies?.pages?.newFlat || comment.replies?.pageCids?.newFlat)) {
    sortType = 'newFlat'
  }
  // if 'old' sort type and flat: true, use 'oldFlat'
  else if (sortType === 'old' && flat && (comment.replies?.pages?.oldFlat || comment.replies?.pageCids?.oldFlat)) {
    sortType = 'oldFlat'
  }

  // if 'newFlat' is missing, use 'new'
  else if (
    sortType === 'newFlat' &&
    !comment.replies?.pages?.newFlat &&
    !comment.replies?.pageCids?.newFlat &&
    (comment.replies?.pages?.new || comment.replies?.pageCids?.new)
  ) {
    sortType = 'new'
  }
  // if 'oldFlat' is missing, use 'old'
  else if (
    sortType === 'oldFlat' &&
    !comment.replies?.pages?.oldFlat &&
    !comment.replies?.pageCids?.oldFlat &&
    (comment.replies?.pages?.old || comment.replies?.pageCids?.old)
  ) {
    sortType = 'old'
  }

  // TODO: if sort type doesn't exist on comment, maybe use first existing?
  // else if (!comment.replies?.pages?.[sortType] && !comment.replies?.pageCids?.[sortType]) {
  //   const firstPageSortType = comment.replies?.pages && Object.keys(comment.replies.pages)[0]
  //   if (firstPageSortType) {
  //     sortType = firstPageSortType
  //   }
  //   else {
  //     const firstPageCidSortType = comment.replies?.pageCids && Object.keys(comment.replies.pageCids)[0]
  //     if (firstPageCidSortType) {
  //       sortType = firstPageCidSortType
  //     }
  //   }
  // }
  return sortType
}
