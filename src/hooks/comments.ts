import {useEffect, useState, useMemo} from 'react'
import {useAccount} from './accounts'
import validator from '../lib/validator'
import Logger from '@plebbit/plebbit-logger'
const log = Logger('plebbit-react-hooks:comments:hooks')
import assert from 'assert'
import {Comment, UseCommentsOptions, UseCommentsResult, UseCommentOptions, UseCommentResult, UseRepliesOptions, UseRepliesResult, CommentsFilter} from '../types'
import useCommentsStore from '../stores/comments'
import useAccountsStore from '../stores/accounts'
import useRepliesStore, {RepliesState} from '../stores/replies'
import useSubplebbitsPagesStore from '../stores/subplebbits-pages'
import useRepliesPagesStore from '../stores/replies-pages'
import shallow from 'zustand/shallow'

/**
 * @param commentCid - The IPFS CID of the comment to get
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useComment(options?: UseCommentOptions): UseCommentResult {
  assert(!options || typeof options === 'object', `useComment options argument '${options}' not an object`)
  const {commentCid, accountName, onlyIfCached} = options || {}
  const account = useAccount({accountName})
  const commentFromStore = useCommentsStore((state: any) => state.comments[commentCid || ''])
  const addCommentToStore = useCommentsStore((state: any) => state.addCommentToStore)
  const subplebbitsPagesComment = useSubplebbitsPagesStore((state: any) => state.comments[commentCid || ''])
  const repliesPagesComment = useRepliesPagesStore((state: any) => state.comments[commentCid || ''])
  const errors = useCommentsStore((state: any) => state.errors[commentCid || ''])

  // get account comment of the cid if any
  const accountCommentInfo = useAccountsStore((state: any) => state.commentCidsToAccountsComments[commentCid || ''])
  const accountComment = useAccountsStore((state: any) => state.accountsComments[accountCommentInfo?.accountId || '']?.[Number(accountCommentInfo?.accountCommentIndex)])

  useEffect(() => {
    if (!commentCid || !account) {
      return
    }
    validator.validateUseCommentArguments(commentCid, account)
    if (!commentFromStore && !onlyIfCached) {
      // if comment isn't already in store, add it
      addCommentToStore(commentCid, account).catch((error: unknown) => log.error('useComment addCommentToStore error', {commentCid, error}))
    }
  }, [commentCid, account?.id, onlyIfCached])

  let comment = commentFromStore

  // if comment from subplebbit pages is more recent, use it instead
  if (commentCid && (subplebbitsPagesComment?.updatedAt || 0) > (comment?.updatedAt || 0)) {
    comment = subplebbitsPagesComment
    // TODO: subplebbit pages comments aren't auto validated, need to validate
  }

  // if comment from replies pages is more recent, use it instead
  if (commentCid && (repliesPagesComment?.updatedAt || 0) > (comment?.updatedAt || 0)) {
    comment = repliesPagesComment
    // TODO: replies pages comments aren't auto validated, need to validate
  }

  // if comment is still not defined, but account comment is, use account comment
  // check `comment.timestamp` instead of `comment` in case comment exists but in a loading state
  const commentFromStoreNotLoaded = !comment?.timestamp
  if (commentCid && commentFromStoreNotLoaded && accountComment) {
    comment = accountComment
  }

  let state = comment?.updatingState || 'initializing'
  // force 'fetching-ipns' even if could be something else, so the frontend can use
  // the correct loading skeleton
  if (comment?.timestamp) {
    state = 'fetching-update-ipns'
  }
  // force succeeded even if the commment is fecthing a new update
  if (comment?.updatedAt) {
    state = 'succeeded'
  }

  // force succeeded if the comment is newer than 5 minutes, no need to display loading skeleton if comment was just created
  let replyCount = comment?.replyCount
  if (comment?.replyCount === undefined && comment?.timestamp && comment?.timestamp > Date.now() / 1000 - 5 * 60) {
    state = 'succeeded'
    // set replyCount because some frontend are likely to check if replyCount === undefined to show a loading skeleton
    replyCount = 0
  }

  if (account && commentCid) {
    log('useComment', {
      commentCid,
      comment,
      replyCount,
      state,
      commentFromStore,
      subplebbitsPagesComment,
      repliesPagesComment,
      accountComment,
      commentsStore: useCommentsStore.getState().comments,
      account,
      onlyIfCached,
    })
  }

  return useMemo(
    () => ({
      ...comment,
      replyCount,
      state,
      error: errors?.[errors.length - 1],
      errors: errors || [],
    }),
    [comment, commentCid, errors]
  )
}

/**
 * @param commentCids - The IPFS CIDs of the comments to get
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useComments(options?: UseCommentsOptions): UseCommentsResult {
  assert(!options || typeof options === 'object', `useComments options argument '${options}' not an object`)
  const {commentCids, accountName, onlyIfCached} = options || {}
  const account = useAccount({accountName})
  const commentsStoreComments: (Comment | undefined)[] = useCommentsStore(
    (state: any) => (commentCids || []).map((commentCid) => state.comments[commentCid || '']),
    shallow
  )
  const subplebbitsPagesComments: (Comment | undefined)[] = useSubplebbitsPagesStore(
    (state: any) => (commentCids || []).map((commentCid) => state.comments[commentCid || '']),
    shallow
  )

  const addCommentToStore = useCommentsStore((state: any) => state.addCommentToStore)

  useEffect(() => {
    if (!commentCids || !account) {
      return
    }
    validator.validateUseCommentsArguments(commentCids, account)
    if (onlyIfCached) {
      return
    }
    const uniqueCommentCids = new Set(commentCids)
    for (const commentCid of uniqueCommentCids) {
      addCommentToStore(commentCid, account).catch((error: unknown) => log.error('useComments addCommentToStore error', {commentCid, error}))
    }
  }, [commentCids?.toString(), account?.id, onlyIfCached])

  if (account && commentCids?.length) {
    log('useComments', {commentCids, commentsStoreComments, commentsStore: useCommentsStore.getState().comments, account})
  }

  // if comment from subplebbit pages is more recent, use it instead
  const comments = useMemo(() => {
    const comments = [...commentsStoreComments]
    for (const i in comments) {
      if ((subplebbitsPagesComments[i]?.updatedAt || 0) > (comments[i]?.updatedAt || 0)) {
        comments[i] = subplebbitsPagesComments[i]
      }
    }
    return comments
  }, [commentsStoreComments, subplebbitsPagesComments])

  // succeed if no comments are undefined
  const state = comments.indexOf(undefined) === -1 ? 'succeeded' : 'fetching-ipfs'

  return useMemo(
    () => ({
      comments,
      state,
      error: undefined,
      errors: [],
    }),
    [comments, commentCids?.toString()]
  )
}

export function useReplies(options?: UseRepliesOptions): UseRepliesResult {
  assert(!options || typeof options === 'object', `useReplies options argument '${options}' not an object`)
  let {commentCid, sortType, accountName, flat, accountComments, repliesPerPage, filter} = options || {}
  if (!sortType) {
    sortType = 'best'
  }
  if (flat === undefined || flat === null) {
    flat = false
  }
  if (accountComments === undefined || accountComments === null) {
    accountComments = true
  }

  validator.validateUseRepliesArguments(commentCid, sortType, accountName, flat, accountComments, repliesPerPage, filter)
  const account = useAccount({accountName})
  const addFeedToStore = useRepliesStore((state: RepliesState) => state.addFeedToStore)
  const incrementFeedPageNumber = useRepliesStore((state: RepliesState) => state.incrementFeedPageNumber)
  const resetFeed = useRepliesStore((state: RepliesState) => state.resetFeed)
  const repliesFeedName = useRepliesFeedName(account?.id, commentCid, sortType, flat, accountComments, repliesPerPage, filter)
  const [errors, setErrors] = useState<Error[]>([])

  // add replies to store
  useEffect(() => {
    if (!commentCid || !account) {
      return
    }
    addFeedToStore(repliesFeedName, commentCid, sortType, account, flat, accountComments, repliesPerPage, filter).catch((error: unknown) =>
      log.error('useReplies addFeedToStore error', {repliesFeedName, error})
    )
  }, [repliesFeedName])

  const replies = useRepliesStore((state: RepliesState) => state.loadedFeeds[repliesFeedName || ''])
  let hasMore = useRepliesStore((state: RepliesState) => state.feedsHaveMore[repliesFeedName || ''])
  // if the replies is not yet defined, then it has more
  if (!repliesFeedName || typeof hasMore !== 'boolean') {
    hasMore = true
  }
  // if the replies is not yet defined, but no comment cid, doesn't have more
  if (!commentCid) {
    hasMore = false
  }

  const loadMore = async () => {
    try {
      if (!commentCid || !account) {
        throw Error('useReplies cannot load more replies not initalized yet')
      }
      incrementFeedPageNumber(repliesFeedName)
    } catch (e: any) {
      // wait 100 ms so infinite scroll doesn't spam this function
      await new Promise((r) => setTimeout(r, 50))
      setErrors([...errors, e])
    }
  }

  const reset = async () => {
    try {
      if (!commentCid || !account) {
        throw Error('useReplies cannot reset replies not initalized yet')
      }
      resetFeed(repliesFeedName)
    } catch (e: any) {
      // wait 100 ms so infinite scroll doesn't spam this function
      await new Promise((r) => setTimeout(r, 50))
      setErrors([...errors, e])
    }
  }

  if (account && commentCid) {
    log('useReplies', {
      repliesLength: replies?.length || 0,
      hasMore,
      commentCid,
      sortType,
      account,
      repliesStoreOptions: useRepliesStore.getState().feedsOptions,
      repliesStore: useRepliesStore.getState(),
    })
  }

  const state = !hasMore ? 'succeeded' : 'fetching'

  return useMemo(
    () => ({
      replies: replies || [],
      hasMore,
      loadMore,
      reset,
      state,
      error: errors[errors.length - 1],
      errors,
    }),
    [replies, repliesFeedName, hasMore, errors]
  )
}

function useRepliesFeedName(
  accountId: string,
  commentCid: string | undefined,
  sortType: string,
  flat?: boolean,
  accountComments?: boolean,
  repliesPerPage?: number,
  filter?: CommentsFilter
) {
  return useMemo(() => {
    return accountId + '-' + commentCid + '-' + sortType + '-' + flat + '-' + accountComments + '-' + repliesPerPage + '-' + filter?.key
  }, [accountId, commentCid, sortType, flat, accountComments, repliesPerPage, filter?.key])
}
