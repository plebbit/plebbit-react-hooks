/**
 * TODO: define these types more in depth
 */
export type Account = {[key: string]: any}
export type AccountsActions = {[key: string]: any}
export type PublishCommentOptions = {[key: string]: any}
export type PublishVoteOptions = {[key: string]: any}
export type PublishCommentEditOptions = {[key: string]: any}
export type PublishSubplebbitEditOptions = {[key: string]: any}
export type Challenge = {[key: string]: any}
export type ChallengeVerification = {[key: string]: any}
export type CreateCommentOptions = {[key: string]: any}
export type CreateSubplebbitOptions = {[key: string]: any}
export type CreateVoteOptions = {[key: string]: any}
export type Comment = {[key: string]: any}
export type Subplebbit = {[key: string]: any}
export type AccountNotification = {[key: string]: any}
export type Nft = {[key: string]: any}
export type Author = {[key: string]: any}

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
export type Role = {
  role: 'owner' | 'admin' | 'moderator'
}
export type AccountSubplebbit = {
  role: Role
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
  nextCid?: string
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
