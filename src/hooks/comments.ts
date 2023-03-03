import {useEffect, useState, useMemo} from 'react'
import {useAccount} from './accounts'
import validator from '../lib/validator'
import Logger from '@plebbit/plebbit-logger'
const log = Logger('plebbit-react-hooks:hooks:comments')
import assert from 'assert'
import {Comment, UseCommentsOptions, UseCommentsResult, UseCommentOptions, UseCommentResult} from '../types'
import useCommentsStore from '../stores/comments'
import useAccountsStore from '../stores/accounts'
import useSubplebbitsPagesStore from '../stores/subplebbits-pages'
import shallow from 'zustand/shallow'

/**
 * @param commentCid - The IPFS CID of the comment to get
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useComment(options?: UseCommentOptions): UseCommentResult {
  const {commentCid, accountName} = options || {}
  const account = useAccount({accountName})
  let comment = useCommentsStore((state: any) => state.comments[commentCid || ''])
  const addCommentToStore = useCommentsStore((state: any) => state.addCommentToStore)
  const subplebbitsPagesComment = useSubplebbitsPagesStore((state: any) => state.comments[commentCid || ''])

  // get account comment of the cid if any
  const accountCommentInfo = useAccountsStore((state: any) => state.commentCidsToAccountsComments[commentCid || ''])
  const accountComment = useAccountsStore((state: any) => state.accountsComments[accountCommentInfo?.accountId || '']?.[Number(accountCommentInfo?.accountCommentIndex)])

  useEffect(() => {
    if (!commentCid || !account) {
      return
    }
    validator.validateUseCommentArguments(commentCid, account)
    if (!comment) {
      // if comment isn't already in store, add it
      addCommentToStore(commentCid, account).catch((error: unknown) => log.error('useComment addCommentToStore error', {commentCid, error}))
    }
  }, [commentCid, account?.id])

  if (account && commentCid) {
    log('useComment', {commentCid, comment, commentsStore: useCommentsStore.getState().comments, account})
  }

  // if comment from subplebbit pages is more recent, use it instead
  if (commentCid && (subplebbitsPagesComment?.updatedAt || 0) > (comment?.updatedAt || 0)) {
    comment = subplebbitsPagesComment
  }

  // if comment is still not defined, but account comment is, use account comment
  // check `comment.timestamp` instead of `comment` in case comment exists but in a loading state
  if (commentCid && !comment?.timestamp && accountComment) {
    comment = accountComment
  }

  const state = comment ? 'succeeded' : 'fetching-ipfs'

  return useMemo(
    () => ({
      ...comment,
      state,
      error: undefined,
      errors: [],
    }),
    [comment, commentCid]
  )
}

/**
 * @param commentCids - The IPFS CIDs of the comments to get
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useComments(options?: UseCommentsOptions): UseCommentsResult {
  const {commentCids, accountName} = options || {}
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
    const uniqueCommentCids = new Set(commentCids)
    for (const commentCid of uniqueCommentCids) {
      addCommentToStore(commentCid, account).catch((error: unknown) => log.error('useComments addCommentToStore error', {commentCid, error}))
    }
  }, [commentCids?.toString(), account?.id])

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
