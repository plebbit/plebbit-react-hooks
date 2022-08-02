import {useEffect, useMemo, useState} from 'react'
import {useAccount} from './accounts'
import validator from '../lib/validator'
import Debug from 'debug'
const debug = Debug('plebbit-react-hooks:hooks:comments')
import assert from 'assert'
import {Comment} from '../types'
import useCommentsStore from '../stores/comments'
import shallow from 'zustand/shallow'

/**
 * @param commentCid - The IPFS CID of the comment to get
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useComment(commentCid?: string, accountName?: string) {
  const account = useAccount(accountName)
  const comment = useCommentsStore((state: any) => state.comments[commentCid || ''])
  const addCommentToStore = useCommentsStore((state: any) => state.addCommentToStore)

  useEffect(() => {
    if (!commentCid || !account) {
      return
    }
    validator.validateUseCommentArguments(commentCid, account)
    if (!comment) {
      // if comment isn't already in store, add it
      addCommentToStore(commentCid, account).catch((error: unknown) => console.error('useComment addCommentToStore error', {commentCid, error}))
    }
  }, [commentCid, account])

  debug('useComment', {commentCid, comment, commentsStore: useCommentsStore.getState().comments, account})
  return comment
}

/**
 * @param commentCids - The IPFS CIDs of the comments to get
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useComments(commentCids: string[] = [], accountName?: string) {
  const account = useAccount(accountName)
  const comments: Comment[] = useCommentsStore((state: any) => commentCids.map((commentCid) => state.comments[commentCid || '']), shallow)
  const addCommentToStore = useCommentsStore((state: any) => state.addCommentToStore)

  useEffect(() => {
    if (!commentCids || !account) {
      return
    }
    validator.validateUseCommentsArguments(commentCids, account)
    const uniqueCommentCids = new Set(commentCids)
    for (const commentCid of uniqueCommentCids) {
      addCommentToStore(commentCid, account).catch((error: unknown) => console.error('useComments addCommentToStore error', {commentCid, error}))
    }
  }, [commentCids, account])

  debug('useComments', {commentCids, comments, commentsStore: useCommentsStore.getState().comments, account})
  return comments
}
