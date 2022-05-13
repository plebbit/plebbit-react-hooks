import React, { useState, useEffect, useContext } from 'react'
import { AccountsContext } from './accounts-provider'
import validator from '../lib/validator'
import assert from 'assert'
import localForageLru from '../lib/localforage-lru'
const commentsDatabase = localForageLru.createInstance({ name: 'comments', size: 5000 })
import Debug from 'debug'
const debug = Debug('plebbitreacthooks:providers:commentsprovider')
import { Props, Comment, Comments, Account } from '../types'
import utils from '../lib/utils'

type CommentsContext = any

export const CommentsContext = React.createContext<CommentsContext | undefined>(undefined)

const plebbitGetCommentPending: { [key: string]: boolean } = {}

export default function CommentsProvider(props: Props): JSX.Element | null {
  const accountsContext = useContext(AccountsContext)
  const [comments, setComments] = useState<Comments>({})

  const commentsActions: { [key: string]: Function } = {}

  commentsActions.addCommentToContext = async (commentId: string, account: Account) => {
    // comment is in context already, do nothing
    let comment: Comment | undefined = comments[commentId]
    if (comment || plebbitGetCommentPending[commentId + account.id]) {
      return
    }

    // try to find comment in database
    comment = await getCommentFromDatabase(commentId, account)

    // comment not in database, fetch from plebbit-js
    if (!comment) {
      plebbitGetCommentPending[commentId + account.id] = true
      comment = await account.plebbit.getComment(commentId)
      await commentsDatabase.setItem(commentId, utils.clone(comment))
    }
    debug('commentsActions.addCommentToContext', { commentId, comment, account })
    setComments((previousComments) => ({ ...previousComments, [commentId]: utils.clone(comment) }))
    plebbitGetCommentPending[commentId + account.id] = false

    // the comment is still missing up to date mutable data like upvotes, edits, replies, etc
    comment.on('update', async (updatedComment: Comment) => {
      updatedComment = utils.clone(updatedComment)
      await commentsDatabase.setItem(commentId, updatedComment)
      debug('commentsContext comment update', { commentId, updatedComment, account })
      setComments((previousComments) => ({ ...previousComments, [commentId]: updatedComment }))
    })
    comment.update()

    // when publishing a comment, you don't yet know its CID
    // so when a new comment is fetched, check to see if it's your own
    // comment, and if yes, add the CID to your account comments database
    if (accountsContext?.addCidToAccountComment) {
      await accountsContext.addCidToAccountComment(comment)
    }
  }

  if (!props.children) {
    return null
  }

  const commentsContext: CommentsContext = {
    comments,
    commentsActions,
  }

  debug({ commentsContext: comments })
  return <CommentsContext.Provider value={commentsContext}>{props.children}</CommentsContext.Provider>
}

const getCommentFromDatabase = async (commentId: string, account: Account) => {
  const commentData: any = await commentsDatabase.getItem(commentId)
  if (!commentData) {
    return
  }
  const comment = account.plebbit.createComment(commentData)
  // add potential missing data from the database onto the comment instance
  // should not be necessary if Plebbit.createComment is implemented properly
  for (const prop in commentData) {
    if (comment[prop] === undefined || comment[prop] === null) {
      if (commentData[prop] !== undefined && commentData[prop] !== null) comment[prop] = commentData[prop]
    }
  }

  // add potential missing data from the Pages API
  comment.replies.pages = utils.merge(commentData?.replies?.pages || {}, comment?.replies?.pages || {})
  comment.replies.pageCids = utils.merge(commentData?.replies?.pageCids || {}, comment?.replies?.pageCids || {})

  // NOTE: adding missing data is probably not needed with a full implementation of plebbit-js with no bugs
  // but the plebbit mock is barely implemented
  return comment
}
