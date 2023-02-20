/**
 * Public options
 */

export interface Options {
  accountName?: string
  onError?: Function
}

export interface Result {
  state: string
  error: Error | undefined
  errors: Error[]
}

// useAccount(options): result
export interface UseAccountOptions extends Options {}
export interface UseAccountResult extends Result, Account {}

// useAccounts(options)
export interface UseAccountsOptions extends Options {}
export interface UseAccountsResult extends Result {
  accounts: Account[]
}

// useAccounts(): result
export interface UseAccountCommentsOptions extends Options {
  filter?: AccountPublicationsFilter
}
export interface UseAccountCommentsResult extends Result {
  accountComments: AccountComment[]
}

// useAccountVotes(options): result
export interface UseAccountVotesOptions extends Options {
  filter?: AccountPublicationsFilter
}
export interface UseAccountVotesResult extends Result {
  accountVotes: number[]
}

// useAccountVote(options): result
export interface UseAccountVoteOptions extends Options {
  commentCid?: string
}
export interface UseAccountVotesResult extends Result {
  vote: number
}

// useAccountNotifications(options): result
export interface UseAccountNotificationsOptions extends Options {}
export interface UseAccountNotificationsResult extends Result {
  notifications: Notification[]
  markAsRead: Function
}

// useAccountSubplebbits(options): result
export interface UseAccountSubplebbitsOptions extends Options {}
export interface UseAccountSubplebbitsResult extends Result {
  notifications: Notification[]
  markAsRead: Function
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
  comments: Comment[]
}

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
  subplebbits: Comment[]
}

// useSubplebbitMetrics(options): result
export interface UseSubplebbitMetricsOptions extends Options {
  subplebbitAddress?: string
}
export interface UseSubplebbitsMetricsResult extends Result, SubplebbitMetrics {}

// useResolvedSubplebbitAddress(options): result
export interface UseResolvedSubplebbitAddressOptions extends Options {
  subplebbitAddress: string
}
export interface UseResolvedSubplebbitAddressResult extends Result {
  resolvedAddress: string
}

// useFeed(options): result
export interface UseFeedOptions extends Options {
  subplebbitAddresses: string[]
  sortType?: string
}
export interface UseFeedResult extends Result {
  feed: Comment[]
  hasMore: Function
  loadMore: Function
}

// useBufferedFeeds(options): result
export interface UseBufferedFeedsOptions extends Options {
  feedsOptions?: UseFeedOptions[]
}
export interface UseBufferedFeedsResult extends Result {
  bufferedFeeds: Comment[][]
}

// useAuthorComments(options): result
export interface UseAuthorCommentsOptions extends Options {
  authorAddress?: string
}
export interface UseAuthorCommentsResult extends Result {
  authorComments: Comment[]
}

// useReplies(options): result
export interface UseRepliesOptions extends Options {
  commentCid?: string
  nested?: boolean
}
export interface UseRepliesResult extends Result {
  replies: Comment[]
  hasMore: Function
  loadMore: Function
}

// useResolvedAuthorAddress(options): result
export interface UseResolvedAuthorAddressOptions extends Options {
  author?: Author
}
export interface UseResolvedAuthorAddressResult extends Result {
  resolvedAddress: string
}

// useAuthorAvatarImageUrl(options): result
export interface UseAuthorAvatarImageUrlOptions extends Options {
  author?: Author
}
export interface UseAuthorAvatarImageUrlResult extends Result {
  imageUrl: string
}

// useCreateAccount(options): result
export interface UseCreateAccountOptions extends Options {}
export interface UseCreateAccountResult extends Result {
  createAccount: Function
  createdAccount: Account | undefined
}

// useDeleteAccount(options): result
export interface UseDeleteAccountOptions extends Options {}
export interface UseDeleteAccountResult extends Result {
  deleteAccount: Function
}

// useSetAccount(options): result
export interface UseSetAccountOptions extends Options {
  account?: Account
}
export interface UseSetAccountResult extends Result {
  setAccount: Function
  account: Account
}

// useSetActiveAccount(options): result
export interface UseSetActiveAccountOptions extends Options {}
export interface UseSetActiveAccountResult extends Result {
  setActiveAccount: Function
  activeAccount: Account
}

// useSetAccountsOrder(options): result
export interface UseSetAccountsOrderOptions extends Options {
  accountNames?: string[]
}
export interface UseSetAccountsOrderResult extends Result {
  setAccountsOrder: Function
  accountNames: string[]
}

// useImportAccount(options): result
export interface UseImportAccountOptions extends Options {
  account?: string
}
export interface UseImportAccountResult extends Result {
  importAccount: Function
  importedAccount: Account
}

// useExportAccount(options): result
export interface UseExportAccountOptions extends Options {}
export interface UseExportAccountResult extends Result {
  exportAccount: Function
  exportedAccount: string
}

// usePublishComment(options): result
export interface UsePublishCommentOptions extends Options {
  onChallenge?: Function
  onChallengeVerification?: Function
  // ...other publish options
}
export interface UsePublishCommentResult extends Result {
  publishComment: Function
  publishChallengeAnswers: Function
  index: number
  challenge: challengeMessage
  challengeVerification: ChallengeVerificationMessage
}

// usePublishVote(options): result
export interface UsePublishVoteOptions extends Options {
  onChallenge?: Function
  onChallengeVerification?: Function
  // ...other publish options
}
export interface UsePublishVoteResult extends Result {
  publishVote: Function
  publishChallengeAnswers: Function
  challenge: challengeMessage
  challengeVerification: ChallengeVerificationMessage
}

// usePublishCommentEdit(options): result
export interface UsePublishCommentEditOptions extends Options {
  onChallenge?: Function
  onChallengeVerification?: Function
  // ...other publish options
}
export interface UsePublishCommentEditResult extends Result {
  publishCommentEdit: Function
  publishChallengeAnswers: Function
  challenge: challengeMessage
  challengeVerification: ChallengeVerificationMessage
}

// usePublishSubplebbitEdit(options): result
export interface UsePublishSubplebbitEditOptions extends Options {
  subplebbitAddress?: string
  onChallenge?: Function
  onChallengeVerification?: Function
  // ...other publish options
}
export interface UsePublishSubplebbitEditResult extends Result {
  publishSubplebbitEdit: Function
  publishChallengeAnswers: Function
  challenge: challengeMessage
  challengeVerification: ChallengeVerificationMessage
}

// useCreateSubplebbit(options): result
export interface UseCreateSubplebbitOptions extends Options {
  subplebbitAddress?: string
}
export interface UseCreateSubplebbitResult extends Result {
  createSubplebbit: Function
  createdSubplebbit: Subplebbit
}

// useDeleteSubplebbit(options): result
export interface UseDeleteSubplebbitOptions extends Options {
  subplebbitAddress?: string
}
export interface UseDeleteSubplebbitResult extends Result {
  deleteSubplebbit: Function
  deletedSubplebbit: Subplebbit
}

// useSubscribe(options): result
export interface UseSubscribeOptions extends Options {
  subplebbitAddress?: string
}
export interface UseSubscribeResult extends Result {
  subscribe: Function
  unsubscribe: Function
  subscribed: boolean
}

// useSubscribeMultisub(options): result
export interface UseSubscribeMultisubOptions extends Options {
  multisubAddress?: string
}
export interface UseSubscribeMultisubResult extends Result {
  subscribe: Function
  unsubscribe: Function
  subscribed: boolean
}

// useFollow(options): result
export interface UseFollowOptions extends Options {
  authorAddress?: string
}
export interface UseFollowResult extends Result {
  follow: Function
  unfollow: Function
  following: boolean
}

// useBlock(options): result
export interface UseBlockOptions extends Options {
  address?: sting
}
export interface UseBlockResult extends Result {
  block: Function
  unblock: Function
  blocked: boolean
}

// useLimit(options): result
export interface UseLimitOptions extends Options {
  address?: sting
}
export interface UseLimitResult extends Result {
  limit: Function
  unlimit: Function
  limited: boolean
}

// useHide(options): result
export interface UseHideOptions extends Options {
  commentCid?: sting
}
export interface UseHideResult extends Result {
  hide: Function
  unhide: Function
  hidden: boolean
}

// useSave(options): result
export interface UseSaveOptions extends Options {
  commentCid?: string
}
export interface UseSaveResult extends Result {
  save: Function
  unsave: Function
  saved: boolean
}

// useDeleteComment(options): result
export interface UseDeleteCommentOptions extends Options {
  commentCid?: string
  commentIndex?: number
}
export interface UseDeleteCommentResult extends Result {
  deleteComment: Function
  undeleteComment: Function
  deletedComment: Comment
}

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
