import React, { useState, useEffect } from 'react'
import validator from '../lib/validator'
import assert from 'assert'
import localForage from 'localforage'
const commentsDatabase = localForage.createInstance({ name: 'comments' })
import Debug from 'debug'
const debug = Debug('plebbitreacthooks:providers:commentsprovider')

type Props = { children?: React.ReactChild }
type Comment = any
type Comments = {[key: string]: Comment}
type CommentsContext = any
type Plebbit = any

const getCommentFromDatabase = async (commentId: string, plebbit: Plebbit) => {
  const commentData = await commentsDatabase.getItem(commentId)
  if (!commentData) {
    return
  }
  const comment = plebbit.createComment(commentData)
  return comment
}

const clone = (obj: any) => JSON.parse(JSON.stringify(obj))

export const CommentsContext = React.createContext<CommentsContext | undefined>(undefined)

export default function CommentsProvider(props: Props): JSX.Element | null {
  const [comments, setComments] = useState<Comments>({})

  const commentsActions: any = {}

  commentsActions.addCommentToContext = async (commentId: string, plebbit: Plebbit) => {
    // comment is in context already, do nothing
    let comment: Comment | undefined = comments[commentId]
    if (comment) {
      return
    }

    // try to find comment in database
    comment = await getCommentFromDatabase(commentId, plebbit)

    // comment not in database, fetch from plebbit-js
    if (!comment) {
      comment = await plebbit.getComment(commentId)
      await commentsDatabase.setItem(commentId, comment)
    }
    debug('commentsActions.addComment', {commentId, comment, plebbit})
    setComments(previousComments => ({...previousComments, [commentId]: clone(comment)}))

    // the comment is still missing up to date mutable data like upvotes, edits, replies, etc
    comment.on('update', async (updatedComment: Comment) => {
      await commentsDatabase.setItem(commentId, updatedComment)
      debug('commentsContext comment update', {commentId, comment, plebbit})
      setComments(previousComments => ({...previousComments, [commentId]: clone(updatedComment)}))
    })
  }

  if (!props.children) {
    return null
  }

  const commentsContext: CommentsContext = {
    comments,
    commentsActions
  }

  debug({commentsContext: comments})
  return <CommentsContext.Provider value={commentsContext}>{props.children}</CommentsContext.Provider>
}
