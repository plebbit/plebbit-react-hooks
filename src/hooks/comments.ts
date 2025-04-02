import {useEffect, useState, useMemo} from 'react'
import {useAccount} from './accounts'
import validator from '../lib/validator'
import Logger from '@plebbit/plebbit-logger'
const log = Logger('plebbit-react-hooks:comments:hooks')
const repliesLog = Logger('plebbit-react-hooks:replies:hooks')
import assert from 'assert'
import {
  Comment,
  UseCommentsOptions,
  UseCommentsResult,
  UseCommentOptions,
  UseCommentResult,
  UseRepliesOptions,
  UseRepliesResult,
  CommentsFilter,
  UseValidateCommentOptions,
  UseValidateCommentResult,
} from '../types'
import useCommentsStore from '../stores/comments'
import useAccountsStore from '../stores/accounts'
import useRepliesStore, {RepliesState} from '../stores/replies'
import {commentIsValid} from '../lib/utils'
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
  let {comment, sortType, accountName, flat, accountComments, repliesPerPage, filter} = options || {}
  if (!sortType) {
    sortType = 'best'
  }
  if (flat === undefined || flat === null) {
    flat = false
  }
  if (accountComments === undefined || accountComments === null) {
    accountComments = true
  }

  validator.validateUseRepliesArguments(comment?.cid, sortType, accountName, flat, accountComments, repliesPerPage, filter)
  const account = useAccount({accountName})
  const addFeedToStoreOrUpdateComment = useRepliesStore((state: RepliesState) => state.addFeedToStoreOrUpdateComment)
  const incrementFeedPageNumber = useRepliesStore((state: RepliesState) => state.incrementFeedPageNumber)
  const resetFeed = useRepliesStore((state: RepliesState) => state.resetFeed)
  const repliesFeedName = useRepliesFeedName(account?.id, comment?.cid, sortType, flat, accountComments, repliesPerPage, filter)
  const [errors, setErrors] = useState<Error[]>([])

  // add replies to store
  useEffect(() => {
    if (!comment?.cid || !account || !comment) {
      return
    }
    addFeedToStoreOrUpdateComment(repliesFeedName, comment, sortType, account, flat, accountComments, repliesPerPage, filter).catch((error: unknown) =>
      repliesLog.error('useReplies addFeedToStoreOrUpdateComment error', {repliesFeedName, error})
    )
  }, [repliesFeedName, comment])

  const replies = useRepliesStore((state: RepliesState) => state.loadedFeeds[repliesFeedName || ''])
  const bufferedReplies = useRepliesStore((state: RepliesState) => state.bufferedFeeds[repliesFeedName || ''])
  const updatedReplies = useRepliesStore((state: RepliesState) => state.updatedFeeds[repliesFeedName || ''])
  let hasMore = useRepliesStore((state: RepliesState) => state.feedsHaveMore[repliesFeedName || ''])
  // if the replies is not yet defined, then it has more
  if (!repliesFeedName || typeof hasMore !== 'boolean') {
    hasMore = true
  }
  // if the replies is not yet defined, but no comment, doesn't have more
  if (!comment) {
    hasMore = false
  }

  const loadMore = async () => {
    try {
      if (!comment?.cid || !account) {
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
      if (!comment?.cid || !account) {
        throw Error('useReplies cannot reset replies not initalized yet')
      }
      resetFeed(repliesFeedName)
    } catch (e: any) {
      // wait 100 ms so infinite scroll doesn't spam this function
      await new Promise((r) => setTimeout(r, 50))
      setErrors([...errors, e])
    }
  }

  if (account && comment?.cid) {
    repliesLog('useReplies', {
      repliesLength: replies?.length || 0,
      hasMore,
      commentCid: comment.cid,
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
      bufferedReplies: bufferedReplies || [],
      updatedReplies: updatedReplies || [],
      hasMore,
      loadMore,
      reset,
      state,
      error: errors[errors.length - 1],
      errors,
    }),
    [replies, bufferedReplies, updatedReplies, repliesFeedName, hasMore, errors]
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

export function useValidateComment(options?: UseValidateCommentOptions): UseValidateCommentResult {
  assert(!options || typeof options === 'object', `useValidateComment options argument '${options}' not an object`)
  let {comment, validateReplies} = options || {}
  if (validateReplies === undefined || validateReplies === null) {
    validateReplies = true
  }
  const [validated, setValidated] = useState<boolean | undefined>()
  const [errors, setErrors] = useState([])

  useEffect(() => {
    if (!comment) {
      setValidated(undefined)
      return
    }
    // don't automatically block subplebbit because what subplebbit it comes from
    // a malicious subplebbit could try to block other subplebbits, etc
    const blockSubplebbit = false
    commentIsValid(comment, {validateReplies, blockSubplebbit}).then((validated) => setValidated(validated))
  }, [comment, validateReplies])

  let state = 'initializing'
  if (validated === true) {
    state = 'succeeded'
  }
  if (validated === false) {
    state = 'failed'
  }

  // start valid at true always because most of the time the value will be true and we dont want to cause a rerender
  let valid = true
  if (validated == false) {
    valid = false
  }
  // if comment isn't defined, it would be confusing for valid to be true
  if (!comment) {
    valid = false
  }

  return useMemo(
    () => ({
      valid,
      state,
      error: errors[errors.length - 1],
      errors,
    }),
    [valid, state]
  )
}
