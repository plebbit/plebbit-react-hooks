import React from 'react'

export type Props = { children?: React.ReactChild }
export type AccountNamesToAccountIds = { [key: string]: string }
export type Comments = { [key: string]: Comment }
export type Accounts = { [key: string]: Account }
export interface AccountComment extends Comment {
  index: number,
  accountId: string
}

// TODO: define types
export type Account = any
export type AccountsActions = any
export type PublishCommentOptions = any
export type PublishVoteOptions = any
export type PublishCommentEditOptions = any
export type Challenge = any
export type ChallengeVerification = any
export type CreateCommentOptions = any
export type CreateVoteOptions = any
export type Comment = any
export type CommentsContext = any
export type Subplebbit = any
export type Subplebbits = any
export type Feed = any
export type Feeds = any
