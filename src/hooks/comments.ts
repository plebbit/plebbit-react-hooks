import { useEffect, useMemo, useState, useContext } from 'react'
import {useAccount} from './accounts'
import { CommentsContext } from '../providers/CommentsProvider'
import PlebbitJs from '../lib/plebbit-js'
import validator from '../lib/validator'
import Debug from 'debug'
const debug = Debug('plebbitreacthooks:hooks:comments')
import assert from 'assert'

/**
 * @param commentCid - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, return
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
      commentsContext.commentsActions.addCommentToContext(commentCid, account.plebbit)
    }
  }, [commentCid, account])

  debug('useComment', {commentsContext: commentsContext.comments, comment, account})
  return comment
}
