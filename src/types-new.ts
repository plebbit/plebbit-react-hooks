/**
 * Public interface
 */

export interface Options {
  accountName?: string
  onError?(error: Error): void
}

export interface Result {
  state: string
  error: Error | undefined
  errors: Error[]
}

// TODO
// useAccount(options): result
export interface UseAccountOptions extends Options {}
export interface UseAccountResult extends Result, Account {}

// TODO
// useAccounts(options)
export interface UseAccountsOptions extends Options {}
export interface UseAccountsResult extends Result {
  accounts: Account[]
}

// TODO
// useAccountComments(): result
export interface UseAccountCommentsOptions extends Options {
  filter?: AccountPublicationsFilter
}
export interface UseAccountCommentsResult extends Result {
  accountComments: AccountComment[]
}

// TODO
// useAccountVotes(options): result
export interface UseAccountVotesOptions extends Options {
  filter?: AccountPublicationsFilter
}
export interface UseAccountVotesResult extends Result {
  accountVotes: number[]
}

// TODO
// useAccountVote(options): result
export interface UseAccountVoteOptions extends Options {
  commentCid?: string
}
export interface UseAccountVotesResult extends Result {
  vote: number
}

// TODO
// useAccountNotifications(options): result
export interface UseAccountNotificationsOptions extends Options {}
export interface UseAccountNotificationsResult extends Result {
  notifications: Notification[]
  markAsRead(): Promise<void>
}

// useAccountSubplebbits(options): result
export interface UseAccountSubplebbitsOptions extends Options {}
export interface UseAccountSubplebbitsResult extends Result {
  accountSubplebbits: AccountSubplebbit[]
}

// useComment(options): result
export interface UseCommentOptions extends Options {
  commentCid?: string
}
export interface UseCommentResult extends Result, Comment {}

// useComments(options): result
export interface UseCommentsOptions extends Options {
  commentCids?: string[]
}
export interface UseCommentsResult extends Result {
  comments: (Comment | undefined)[]
}

// useCommentThumbnailUrl(options): result
// export interface UseCommentThumbnailUrlOptions extends Options {
//   comment?: Comment
// }
// export interface UseCommentThumbnailUrlResult extends Result {
//   thumnbailUrl: string | undefined
// }

// useSubplebbit(options): result
export interface UseSubplebbitOptions extends Options {
  subplebbitAddress?: string
}
export interface UseSubplebbitResult extends Result, Subplebbit {}

// useSubplebbits(options): result
export interface UseSubplebbitsOptions extends Options {
  subplebbitAddresses?: string[]
}
export interface UseSubplebbitsResult extends Result {
  subplebbits: (Subplebbit | undefined)[]
}

export interface UseSubplebbitMetricsOptions extends Options {
  subplebbitAddress?: string
}
export interface UseSubplebbitMetricsResult extends Result, SubplebbitMetrics {}

// useResolvedSubplebbitAddress(options): result
export interface UseResolvedSubplebbitAddressOptions extends Options {
  subplebbitAddress: string | undefined
  cache?: boolean
}
export interface UseResolvedSubplebbitAddressResult extends Result {
  resolvedAddress: string | undefined
}

// useFeed(options): result
export interface UseFeedOptions extends Options {
  subplebbitAddresses: string[]
  sortType?: string
}
export interface UseFeedResult extends Result {
  feed: Comment[]
  hasMore: boolean
  loadMore(): Promise<void>
}

// useBufferedFeeds(options): result
export interface UseBufferedFeedsOptions extends Options {
  feedsOptions?: UseFeedOptions[]
}
export interface UseBufferedFeedsResult extends Result {
  bufferedFeeds: Comment[][]
}

// useAuthorComments(options): result
// export interface UseAuthorCommentsOptions extends Options {
//   authorAddress?: string
// }
// export interface UseAuthorCommentsResult extends Result {
//   authorComments: Comment[]
// }

// useReplies(options): result
// export interface UseRepliesOptions extends Options {
//   commentCid?: string
//   nested?: boolean
// }
// export interface UseRepliesResult extends Result {
//   replies: Comment[]
//   hasMore(): Promise<void>
//   loadMore(): Promise<void>
// }

// useResolvedAuthorAddress(options): result
export interface UseResolvedAuthorAddressOptions extends Options {
  author?: Author
  cache?: boolean
}
export interface UseResolvedAuthorAddressResult extends Result {
  resolvedAddress: string | undefined
}

// useAuthorAvatarImageUrl(options): result
export interface UseAuthorAvatarImageUrlOptions extends Options {
  author?: Author
}
export interface UseAuthorAvatarImageUrlResult extends Result {
  imageUrl: string | undefined
}

// useCreateAccount(options): result
// export interface UseCreateAccountOptions extends Options {}
// export interface UseCreateAccountResult extends Result {
//   createAccount(): Promise<void>
//   createdAccount: Account | undefined
// }

// useDeleteAccount(options): result
// export interface UseDeleteAccountOptions extends Options {}
// export interface UseDeleteAccountResult extends Result {
//   deleteAccount(): Promise<void>
//   deletedAccount: Account | undefined
// }

// useSetAccount(options): result
// export interface UseSetAccountOptions extends Options {
//   account?: Account
// }
// export interface UseSetAccountResult extends Result {
//   setAccount(): Promise<void>
//   account: Account | undefined
// }

// useSetActiveAccount(options): result
// export interface UseSetActiveAccountOptions extends Options {
//   activeAccount?: string
// }
// export interface UseSetActiveAccountResult extends Result {
//   setActiveAccount(): Promise<void>
//   activeAccount: string | undefined
// }

// useSetAccountsOrder(options): result
// export interface UseSetAccountsOrderOptions extends Options {
//   accountsOrder?: string[]
// }
// export interface UseSetAccountsOrderResult extends Result {
//   setAccountsOrder(): Promise<void>
//   accountsOrder: string[]
// }

// useImportAccount(options): result
// export interface UseImportAccountOptions extends Options {
//   account?: string
// }
// export interface UseImportAccountResult extends Result {
//   importAccount(): Promise<void>
//   importedAccount: Account | undefined
// }

// useExportAccount(options): result
// export interface UseExportAccountOptions extends Options {}
// export interface UseExportAccountResult extends Result {
//   exportAccount(): Promise<void>
//   exportedAccount: string | undefined
// }

// usePublishComment(options): result
export interface UsePublishCommentOptions extends Options {
  onChallenge?(challenge: Challenge, comment?: Comment): Promise<void>
  onChallengeVerification?(challengeVerification: ChallengeVerification, comment?: Comment): Promise<void>
  [publishOption: string]: any
}
export interface UsePublishCommentResult extends Result {
  publishComment(): Promise<void>
  publishChallengeAnswers(challengeAnswers: string[]): Promise<void>
  index: number | undefined
  challenge: Challenge | undefined
  challengeVerification: ChallengeVerification | undefined
}

// usePublishVote(options): result
export interface UsePublishVoteOptions extends Options {
  onChallenge?(challenge: Challenge, comment?: Comment): Promise<void>
  onChallengeVerification?(challengeVerification: ChallengeVerification, comment?: Comment): Promise<void>
  [publishOption: string]: any
}
export interface UsePublishVoteResult extends Result {
  publishVote(): Promise<void>
  publishChallengeAnswers(challengeAnswers: string[]): Promise<void>
  challenge: Challenge | undefined
  challengeVerification: ChallengeVerification | undefined
}

// usePublishCommentEdit(options): result
export interface UsePublishCommentEditOptions extends Options {
  onChallenge?(challenge: Challenge, comment?: Comment): Promise<void>
  onChallengeVerification?(challengeVerification: ChallengeVerification, comment?: Comment): Promise<void>
  [publishOption: string]: any
}
export interface UsePublishCommentEditResult extends Result {
  publishCommentEdit(): Promise<void>
  publishChallengeAnswers(challengeAnswers: string[]): Promise<void>
  challenge: Challenge | undefined
  challengeVerification: ChallengeVerification | undefined
}

// usePublishSubplebbitEdit(options): result
export interface UsePublishSubplebbitEditOptions extends Options {
  subplebbitAddress?: string
  onChallenge?(challenge: Challenge, comment?: Comment): Promise<void>
  onChallengeVerification?(challengeVerification: ChallengeVerification, comment?: Comment): Promise<void>
  [publishOption: string]: any
}
export interface UsePublishSubplebbitEditResult extends Result {
  publishSubplebbitEdit(): Promise<void>
  publishChallengeAnswers(challengeAnswers: string[]): Promise<void>
  challenge: Challenge | undefined
  challengeVerification: ChallengeVerification | undefined
}

// useCreateSubplebbit(options): result
export interface UseCreateSubplebbitOptions extends Options {
  [createSubplebbitOption: string]: any
}
export interface UseCreateSubplebbitResult extends Result {
  createSubplebbit(): Promise<void>
  createdSubplebbit: Subplebbit | undefined
}

// useDeleteSubplebbit(options): result
// export interface UseDeleteSubplebbitOptions extends Options {
//   subplebbitAddress?: string
// }
// export interface UseDeleteSubplebbitResult extends Result {
//   deleteSubplebbit(): Promise<void>
//   deletedSubplebbit: Subplebbit | undefined
// }

// useSubscribe(options): result
export interface UseSubscribeOptions extends Options {
  subplebbitAddress?: string
  multisubAddress?: string
  authorAddress?: string
}
export interface UseSubscribeResult extends Result {
  subscribe(): Promise<void>
  unsubscribe(): Promise<void>
  subscribed: boolean | undefined
}

// useBlock(options): result
export interface UseBlockOptions extends Options {
  address?: string
}
export interface UseBlockResult extends Result {
  block(): Promise<void>
  unblock(): Promise<void>
  blocked: boolean | undefined
}

// useNotify(options): result
// export interface UseNotifyOptions extends Options {
//   subplebbitAddress?: string
//   multisubAddress?: string
//   authorAddress?: string
//   commentCid?: string
// }
// export interface UseNotifySubplebbitResult extends Result {
//   notify(): Promise<void>
//   unnotify(): Promise<void>
//   notifying: boolean | undefined
// }

// useLimitAddress(options): result
// export interface UseLimitOptions extends Options {
//   address?: string
// }
// export interface UseLimitResult extends Result {
//   limit(): Promise<void>
//   unlimit(): Promise<void>
//   limited: number | undefined
// }

// useHide(options): result
// export interface UseHideOptions extends Options {
//   commentCid?: string
// }
// export interface UseHideResult extends Result {
//   hide(): Promise<void>
//   unhide(): Promise<void>
//   hidden: boolean | undefined
// }

// useSave(options): result
// export interface UseSaveOptions extends Options {
//   commentCid?: string
// }
// export interface UseSaveResult extends Result {
//   save(): Promise<void>
//   unsave(): Promise<void>
//   saved: boolean | undefined
// }

// useDeleteComment(options): result
// export interface UseDeleteCommentOptions extends Options {
//   commentCid?: string
//   accountCommentIndex?: number
// }
// export interface UseDeleteCommentResult extends Result {
//   deleteComment(): Promise<void>
//   undeleteComment(): Promise<void>
//   deletedComment: Comment | undefined
// }

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
export type Vote = {[key: string]: any}
export type CommentEdit = {[key: string]: any}
export type SubplebbitEdit = {[key: string]: any}
export type Subplebbit = {[key: string]: any}
export type SubplebbitMetrics = {[key: string]: any}
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
 * Other
 */
export type BlockchainProvider = {
  chainId?: number
  url?: string
}
export type BlockchainProviders = {[chainTicker: string]: BlockchainProvider}
