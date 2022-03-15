import React from 'react'

export type Props = { children?: React.ReactChild }
export type AccountNamesToAccountIds = { [key: string]: string }
export type Comments = { [key: string]: Comment }
export type Accounts = { [key: string]: Account }

export interface AccountComment extends Comment {
  index: number,
  accountId: string
}
export type AccountComments = AccountComment[]
export type AccountsComments = { [key: string]: AccountComments }
export type Subplebbits = {[key: string]: Subplebbit}
export type Feeds = {[key: string]: Feed}

// TODO: define these types
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
export type Subplebbit = any
export type Feed = any

/**
 * Feeds provider
 */
export type FeedOptions = {
  subplebbitAddresses: string[],
  sortType: string
  account: Account
  pageNumber: number
}
export type FeedsOptions = {[key: string]: FeedOptions}
export type FeedSortedPostsInfo = {
  firstPageSortedPostsCid: string
  account: Account
  subplebbitAddress: string
  sortType: string
  bufferedPostCount: number
}
export type FeedsSortedPostsInfo = {[key: string]: FeedSortedPostsInfo}
export type SortedPostsPageInfo = {
  sortedPostsCid: string
  account: Account
  subplebbitAddress: string
  sortType: string
}
export type SortedPostsPagesInfo = {[key: string]: SortedPostsPageInfo}
export type SortedComments = {
  nextSortedCommentsCid: string,
  comments: Comment[]
}
export type SortedPostsPages = {[key: string]: SortedComments}

/**
 * Accounts hooks
 */
 export type UseAccountCommentsFilter = {
  subplebbitAddresses?: string[]
  postCids?: string[]
  commentCids?: string[]
  parentCommentCids?: string[]
  hasParentCommentCid?: boolean
}
export type UseAccountCommentsOptions = {
  accountName?: string
  filter?: UseAccountCommentsFilter
}

/**
 * Feeds hooks
 */
export type UseBufferedFeedOptions = {
  subplebbitAddresses: string[]
  sortType?: string
}
