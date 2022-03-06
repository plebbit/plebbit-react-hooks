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

export const CommentsContext = React.createContext<CommentsContext | undefined>(undefined)

export default function CommentsProvider(props: Props): JSX.Element | null {
  const [comments, setComments] = useState<Comments>({})

  const commentsActions: any = {}

  commentsActions.addComment = async () => {

  }

  commentsActions.getComment = async (commentId: string, plebbit: Plebbit) => {
    let comment: Comment | undefined = comments[commentId]
    // comment is in context already
    if (comment) {
      return comment
    }
    comment = await commentsDatabase.getItem(commentId)
    if (!comment) {
      // comment not in database, get it from plebbit-js
      comment = await plebbit.getComment(commentId)
    }    
    setComments({...comments, [commentId]: comment})
    debug('commentsActions.getComment', {commentId, comment, plebbit})
    return comment
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
