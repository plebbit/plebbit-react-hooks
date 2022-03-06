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

export const CommentsContext = React.createContext<CommentsContext | undefined>(undefined)

export default function CommentsProvider(props: Props): JSX.Element | null {
  const [comments, setComments] = useState<Comments>({})

  const commentsActions: any = {}

  commentsActions.addComment = async () => {

  }

  commentsActions.getComment = async () => {
    
  }

  if (!props.children) {
    return null
  }

  const commentsContext: CommentsContext = {
    comments,
    commentsActions
  }

  debug(commentsContext)
  return <CommentsContext.Provider value={commentsContext}>{props.children}</AccountsContext.Provider>
}
