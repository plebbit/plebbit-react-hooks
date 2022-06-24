import {useEffect, useMemo, useState, useContext} from 'react'
import {useAccount} from './accounts'
import {CommentsContext} from '../providers/comments-provider'
import validator from '../lib/validator'
import Debug from 'debug'
const debug = Debug('plebbit-react-hooks:hooks:comments')
import assert from 'assert'
import {Comment} from '../types'

/**
 * @param commentCid - The IPFS CID of the comment to get
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useComment(commentCid?: string, accountName?: string) {
  const account = useAccount(accountName)
  const commentsContext = useContext(CommentsContext)
  const comment = commentCid && commentsContext.comments[commentCid]

  useEffect(() => {
    if (!commentCid || !account) {
      return
    }
    validator.validateUseCommentArguments(commentCid, account)
    if (!comment) {
      // if comment isn't already in context, add it
      commentsContext.commentsActions
        .addCommentToContext(commentCid, account)
        .catch((error: unknown) => debug('useComment addCommentToContext error', {commentCid, error}))
    }
  }, [commentCid, account])

  debug('useComment', {commentsContext: commentsContext.comments, comment, account})
  return comment
}

/**
 * @param commentCids - The IPFS CIDs of the comments to get
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useComments(commentCids?: string[], accountName?: string) {
  const account = useAccount(accountName)
  const commentsContext = useContext(CommentsContext)
  const comments: Comment[] = []
  for (const commentCid of commentCids || []) {
    comments.push(commentsContext.comments[commentCid])
  }

  useEffect(() => {
    if (!commentCids || !account) {
      return
    }
    validator.validateUseCommentsArguments(commentCids, account)
    const uniqueCommentCids = new Set(commentCids)
    for (const commentCid of uniqueCommentCids) {
      // if comment isn't already in context, add it
      if (!commentsContext.comments[commentCid]) {
        commentsContext.commentsActions
          .addCommentToContext(commentCid, account)
          .catch((error: unknown) => debug('useComments addCommentToContext error', {commentCid, error}))
      }
    }
  }, [commentCids, account])

  debug('useComments', {commentsContext: commentsContext.comments, comments, account})
  return comments
}
