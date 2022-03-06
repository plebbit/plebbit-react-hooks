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
  const [comment, setComment] = useState()

  useEffect(() => {
    if (!commentCid || !account) {
      return
    }
    validator.validateUseCommentArguments(commentCid, account)
    ;(async () => {
      const comment = await commentsContext.getComment(commentCid, account.plebbit)
      setComment(comment)
    })()      
  }, [commentCid, account])

  debug('useComment', {commentsContext, comment})
  return comment
}
