/**
 * TODO: define these undefined types
 */
export type Account = any
export type AccountsActions = any
export type PublishCommentOptions = any
export type PublishVoteOptions = any
export type PublishCommentEditOptions = any
export type PublishSubplebbitEditOptions = any
export type Challenge = any
export type ChallengeVerification = any
export type CreateCommentOptions = any
export type CreateSubplebbitOptions = any
export type CreateVoteOptions = any
export type Comment = any
export type Subplebbit = any
export type AccountNotification = any
export type Nft = any
export type Author = any

/**
 * Subplebbits and comments store
 */
export type Subplebbits = {[subplebbitAddress: string]: Subplebbit}
export type Comments = {[commendCid: string]: Comment}

/**
 * Accounts store
 */
export type Accounts = {[accountId: string]: Account}
export type AccountNamesToAccountIds = {[accountName: string]: string}
export interface AccountComment extends Comment {
  index: number
  accountId: string
}
export type AccountComments = AccountComment[]
export type AccountsComments = {[accountId: string]: AccountComments}
export interface AccountCommentReply extends Comment {
  markedAsRead: boolean
}
export type AccountCommentsReplies = {[replyCid: string]: AccountCommentReply}
export type AccountsCommentsReplies = {[accountId: string]: AccountCommentsReplies}
export type AccountNotifications = AccountNotification[]
export type AccountsNotifications = {[accountId: string]: AccountNotifications}
export type AccountSubplebbit = {
  role: 'owner' | 'admin' | 'moderator'
  autoStart?: boolean
}

/**
 * Feeds store
 */
export type Feed = Comment[]
export type Feeds = {[feedName: string]: Feed}
export type FeedOptions = {
  subplebbitAddresses: string[]
  sortType: string
  accountId: string
  pageNumber: number
}
export type FeedsOptions = {[feedName: string]: FeedOptions}
export type FeedSubplebbitsPostCounts = {[subplebbitAddress: string]: number}
export type FeedsSubplebbitsPostCounts = {[feedName: string]: FeedSubplebbitsPostCounts}
export type SubplebbitPage = {
  nextCid: string | null
  comments: Comment[]
}
export type SubplebbitsPages = {[pageCid: string]: SubplebbitPage}

/**
 * Accounts hooks
 */
export type UseAccountCommentsFilter = {
  subplebbitAddresses?: string[]
  postCids?: string[]
  commentCids?: string[]
  parentCids?: string[]
  hasParentCid?: boolean
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

/**
 * Other
 */
export type BlockchainProvider = {
  chainId?: number
  url?: string
}
export type BlockchainProviders = {[chainTicker: string]: BlockchainProvider}
