// Note: the commented out types are TODO functionalities to implement

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

// useAccount(options): result
export interface UseAccountOptions extends Options {}
export interface UseAccountResult extends Result, Account {}

// useAccounts(options): result
export interface UseAccountsOptions extends Options {}
export interface UseAccountsResult extends Result {
  accounts: Account[]
}

// useAccountComments(options): result
export interface UseAccountCommentsOptions extends Options {
  filter?: AccountPublicationsFilter
}
export interface UseAccountCommentsResult extends Result {
  accountComments: AccountComment[]
}

// useAccountComment(options): result
export interface UseAccountCommentOptions extends Options {
  commentIndex?: number
}
export interface UseAccountCommentResult extends Result, AccountComment {}

// useAccountVotes(options): result
export interface UseAccountVotesOptions extends Options {
  filter?: AccountPublicationsFilter
}
export interface UseAccountVotesResult extends Result {
  accountVotes: AccountVote[]
}

// useAccountVote(options): result
export interface UseAccountVoteOptions extends Options {
  commentCid?: string
}
export interface UseAccountVoteResult extends Result, AccountVote {
  commentCid: string | undefined
  vote: number | undefined
}

// useAccountEdits(options): result
export interface UseAccountEditsOptions extends Options {
  filter?: AccountPublicationsFilter
}
export interface UseAccountEditsResult extends Result {
  accountEdits: AccountEdit[]
}

// useNotifications(options): result
export interface UseNotificationsOptions extends Options {}
export interface UseNotificationsResult extends Result {
  notifications: Notification[]
  markAsRead(): Promise<void>
}

// useAccountSubplebbits(options): result
export interface UseAccountSubplebbitsOptions extends Options {
  onlyIfCached?: boolean
}
export interface UseAccountSubplebbitsResult extends Result {
  accountSubplebbits: AccountSubplebbit[]
}

// usePubsubSubscribe(options): result
export interface UsePubsubSubscribeOptions extends Options {
  subplebbitAddress?: string
}
export interface UsePubsubSubscribeResult extends Result {}

// useComment(options): result
export interface UseCommentOptions extends Options {
  commentCid?: string
  onlyIfCached?: boolean
}
export interface UseCommentResult extends Result, Comment {}

// useComments(options): result
export interface UseCommentsOptions extends Options {
  commentCids?: string[]
  onlyIfCached?: boolean
}
export interface UseCommentsResult extends Result {
  // TODO: remove | undefined, that shouldn't happen when comments have comment.state
  comments: (Comment | undefined)[]
}

// useValidateComment(options): result
export interface UseValidateCommentOptions extends Options {
  comment?: Comment
  validateReplies?: boolean
}
export interface UseValidateCommentResult extends Result {
  valid: boolean
}

// useCommentThumbnailUrl(options): result
// export interface UseCommentThumbnailUrlOptions extends Options {
//   comment?: Comment
// }
// export interface UseCommentThumbnailUrlResult extends Result {
//   thumnbailUrl: string | undefined
// }

// useReplies(options): result
export interface UseRepliesOptions extends Options {
  comment?: Comment
  sortType?: string
  repliesPerPage?: number
  flat?: boolean
  accountComments?: boolean
  filter?: CommentsFilter
}
export interface UseRepliesResult extends Result {
  replies: Comment[]
  hasMore: boolean
  loadMore(): Promise<void>
}
export type UseRepliesOptionsAccountComments = {
  newerThan?: number
  append?: boolean
}

// useEditedComment(options): result
export interface UseEditedCommentOptions extends Options {
  comment?: Comment
}
export interface UseEditedCommentResult extends Result {
  // editedComment only contains the succeeded and pending props, failed props aren't added
  editedComment: Comment | undefined
  succeededEdits: {[succeededEditPropertyName: string]: any}
  pendingEdits: {[pendingEditPropertyName: string]: any}
  failedEdits: {[failedEditPropertyName: string]: any}
  // state: 'initializing' | 'unedited' | 'succeeded' | 'pending' | 'failed'
}

// useSubplebbit(options): result
export interface UseSubplebbitOptions extends Options {
  subplebbitAddress?: string
  onlyIfCached?: boolean
}
export interface UseSubplebbitResult extends Result, Subplebbit {}

// useSubplebbits(options): result
export interface UseSubplebbitsOptions extends Options {
  subplebbitAddresses?: string[]
  onlyIfCached?: boolean
}
export interface UseSubplebbitsResult extends Result {
  subplebbits: (Subplebbit | undefined)[]
}

// useSubplebbitStats(options): result
export interface UseSubplebbitStatsOptions extends Options {
  subplebbitAddress?: string
  onlyIfCached?: boolean
}
export interface UseSubplebbitStatsResult extends Result, SubplebbitStats {}

// useResolvedSubplebbitAddress(options): result
export interface UseResolvedSubplebbitAddressOptions extends Options {
  subplebbitAddress: string | undefined
  cache?: boolean
}
export interface UseResolvedSubplebbitAddressResult extends Result {
  resolvedAddress: string | undefined
  chainProvider: ChainProvider | undefined
}

// useFeed(options): result
export interface UseFeedOptions extends Options {
  subplebbitAddresses: string[]
  sortType?: string
  postsPerPage?: number
  newerThan?: number
  filter?: CommentsFilter
}
export interface UseFeedResult extends Result {
  feed: Comment[]
  hasMore: boolean
  loadMore(): Promise<void>
  subplebbitAddressesWithNewerPosts: string[]
  reset(): Promise<void>
}

// useBufferedFeeds(options): result
export interface UseBufferedFeedsOptions extends Options {
  feedsOptions?: UseFeedOptions[]
}
export interface UseBufferedFeedsResult extends Result {
  bufferedFeeds: Comment[][]
}

// useAuthor(options): result
export interface UseAuthorOptions extends Options {
  authorAddress?: string
  // the last known comment cid of this author (required, can't fetch author from author address alone)
  commentCid?: string
}
export interface UseAuthorResult extends Result {
  author: Author | undefined
}

// useAuthorComments(options): result
export interface UseAuthorCommentsOptions extends Options {
  authorAddress?: string
  // the last known comment cid of this author (required, can't fetch author comment from author address alone)
  commentCid?: string
  // TODO: add filter
  filter?: CommentsFilter
}
export interface UseAuthorCommentsResult extends Result {
  // TODO: remove | undefined, that shouldn't happen when comments have comment.state
  authorComments: (Comment | undefined)[]
  lastCommentCid: string | undefined
  hasMore: boolean
  loadMore(): Promise<void>
}

// useResolvedAuthorAddress(options): result
export interface UseResolvedAuthorAddressOptions extends Options {
  author?: Author
  cache?: boolean
}
export interface UseResolvedAuthorAddressResult extends Result {
  resolvedAddress: string | undefined
  chainProvider: ChainProvider | undefined
}

// useAuthorAvatar(options): result
export interface UseAuthorAvatarOptions extends Options {
  author?: Author
}
export interface UseAuthorAvatarResult extends Result {
  imageUrl: string | undefined
  metadataUrl: string | undefined
  chainProvider: ChainProvider | undefined
}

// useAuthorAddress(options): result
export interface UseAuthorAddressOptions extends Options {
  comment?: Comment
}
export interface UseAuthorAddressResult extends Result {
  authorAddress: string | undefined
  shortAuthorAddress: string | undefined
  authorAddressChanged: boolean
}

// useCreateAccount(options): result
// export interface UseCreateAccountOptions extends Options {}
// export interface UseCreateAccountResult extends Result {
//   createdAccount: Account | undefined
//   createAccount(): Promise<void>
// }

// useDeleteAccount(options): result
// export interface UseDeleteAccountOptions extends Options {}
// export interface UseDeleteAccountResult extends Result {
//   deletedAccount: Account | undefined
//   deleteAccount(): Promise<void>
// }

// useSetAccount(options): result
// export interface UseSetAccountOptions extends Options {
//   account?: Account
// }
// export interface UseSetAccountResult extends Result {
//   account: Account | undefined
//   setAccount(): Promise<void>
// }

// useSetActiveAccount(options): result
// export interface UseSetActiveAccountOptions extends Options {
//   activeAccount?: string
// }
// export interface UseSetActiveAccountResult extends Result {
//   activeAccount: string | undefined
//   setActiveAccount(): Promise<void>
// }

// useSetAccountsOrder(options): result
// export interface UseSetAccountsOrderOptions extends Options {
//   accountsOrder?: string[]
// }
// export interface UseSetAccountsOrderResult extends Result {
//   accountsOrder: string[]
//   setAccountsOrder(): Promise<void>
// }

// useImportAccount(options): result
// export interface UseImportAccountOptions extends Options {
//   account?: string
// }
// export interface UseImportAccountResult extends Result {
//   importedAccount: Account | undefined
//   importAccount(): Promise<void>
// }

// useExportAccount(options): result
// export interface UseExportAccountOptions extends Options {}
// export interface UseExportAccountResult extends Result {
//   exportedAccount: string | undefined
//   exportAccount(): Promise<void>
// }

// usePublishComment(options): result
export interface UsePublishCommentOptions extends Options {
  onChallenge?(challenge: Challenge, comment?: Comment): Promise<void>
  onChallengeVerification?(challengeVerification: ChallengeVerification, comment?: Comment): Promise<void>
  [publishOption: string]: any
}
export interface UsePublishCommentResult extends Result {
  index: number | undefined
  challenge: Challenge | undefined
  challengeVerification: ChallengeVerification | undefined
  publishComment(): Promise<void>
  publishChallengeAnswers(challengeAnswers: string[]): Promise<void>
}

// usePublishVote(options): result
export interface UsePublishVoteOptions extends Options {
  onChallenge?(challenge: Challenge, comment?: Comment): Promise<void>
  onChallengeVerification?(challengeVerification: ChallengeVerification, comment?: Comment): Promise<void>
  [publishOption: string]: any
}
export interface UsePublishVoteResult extends Result {
  challenge: Challenge | undefined
  challengeVerification: ChallengeVerification | undefined
  publishVote(): Promise<void>
  publishChallengeAnswers(challengeAnswers: string[]): Promise<void>
}

// usePublishCommentEdit(options): result
export interface UsePublishCommentEditOptions extends Options {
  onChallenge?(challenge: Challenge, comment?: Comment): Promise<void>
  onChallengeVerification?(challengeVerification: ChallengeVerification, comment?: Comment): Promise<void>
  [publishOption: string]: any
}
export interface UsePublishCommentEditResult extends Result {
  challenge: Challenge | undefined
  challengeVerification: ChallengeVerification | undefined
  publishCommentEdit(): Promise<void>
  publishChallengeAnswers(challengeAnswers: string[]): Promise<void>
}

// usePublishCommentModeration(options): result
export interface UsePublishCommentModerationOptions extends Options {
  onChallenge?(challenge: Challenge, comment?: Comment): Promise<void>
  onChallengeVerification?(challengeVerification: ChallengeVerification, comment?: Comment): Promise<void>
  [publishOption: string]: any
}
export interface UsePublishCommentModerationResult extends Result {
  challenge: Challenge | undefined
  challengeVerification: ChallengeVerification | undefined
  publishCommentModeration(): Promise<void>
  publishChallengeAnswers(challengeAnswers: string[]): Promise<void>
}

// usePublishSubplebbitEdit(options): result
export interface UsePublishSubplebbitEditOptions extends Options {
  subplebbitAddress?: string
  onChallenge?(challenge: Challenge, comment?: Comment): Promise<void>
  onChallengeVerification?(challengeVerification: ChallengeVerification, comment?: Comment): Promise<void>
  [publishOption: string]: any
}
export interface UsePublishSubplebbitEditResult extends Result {
  challenge: Challenge | undefined
  challengeVerification: ChallengeVerification | undefined
  publishSubplebbitEdit(): Promise<void>
  publishChallengeAnswers(challengeAnswers: string[]): Promise<void>
}

// useCreateSubplebbit(options): result
export interface UseCreateSubplebbitOptions extends Options {
  [createSubplebbitOption: string]: any
}
export interface UseCreateSubplebbitResult extends Result {
  createdSubplebbit: Subplebbit | undefined
  createSubplebbit(): Promise<void>
}

// useDeleteSubplebbit(options): result
// export interface UseDeleteSubplebbitOptions extends Options {
//   subplebbitAddress?: string
// }
// export interface UseDeleteSubplebbitResult extends Result {
//   deletedSubplebbit: Subplebbit | undefined
//   deleteSubplebbit(): Promise<void>
// }

// useSubscribe(options): result
export interface UseSubscribeOptions extends Options {
  subplebbitAddress?: string
  multisubAddress?: string
  authorAddress?: string
}
export interface UseSubscribeResult extends Result {
  subscribed: boolean | undefined
  subscribe(): Promise<void>
  unsubscribe(): Promise<void>
}

// useBlock(options): result
export interface UseBlockOptions extends Options {
  address?: string
  cid?: string
}
export interface UseBlockResult extends Result {
  blocked: boolean | undefined
  block(): Promise<void>
  unblock(): Promise<void>
}

// useNotify(options): result
// export interface UseNotifyOptions extends Options {
//   subplebbitAddress?: string
//   multisubAddress?: string
//   authorAddress?: string
//   commentCid?: string
// }
// export interface UseNotifySubplebbitResult extends Result {
//   notifying: boolean | undefined
//   notify(): Promise<void>
//   unnotify(): Promise<void>
// }

// useLimit(options): result
// export interface UseLimitOptions extends Options {
//   address?: string
// }
// export interface UseLimitResult extends Result {
//   limited: number | undefined
//   limit(): Promise<void>
//   unlimit(): Promise<void>
// }

// useSave(options): result
// export interface UseSaveOptions extends Options {
//   commentCid?: string
// }
// export interface UseSaveResult extends Result {
//   saved: boolean | undefined
//   save(): Promise<void>
//   unsave(): Promise<void>
// }

// useDeleteComment(options): result
// export interface UseDeleteCommentOptions extends Options {
//   commentCid?: string
//   accountCommentIndex?: number
// }
// export interface UseDeleteCommentResult extends Result {
//   deletedComment: Comment | undefined
//   deleteComment(): Promise<void>
//   undeleteComment(): Promise<void>
// }

export interface UseClientsStatesOptions extends Options {
  comment?: Comment
  subplebbit?: Subplebbit
}
type ClientUrls = string[]
type Peer = string
export interface UseClientsStatesResult extends Result {
  states: {[state: string]: ClientUrls}
  peers: {[clientUrl: string]: Peer[]}
}

export interface UseSubplebbitsStatesOptions extends Options {
  subplebbitAddresses?: string[]
}
export interface UseSubplebbitsStatesResult extends Result {
  states: {[state: string]: {subplebbitAddresses: string[]; clientUrls: string[]}}
  peers: {[clientUrl: string]: Peer[]}
}

export type PlebbitRpcSettings = {[key: string]: any}
export interface UsePlebbitRpcSettingsOptions extends Options {}
export interface UsePlebbitRpcSettingsResult extends Result {
  plebbitRpcSettings: PlebbitRpcSettings | undefined
  setPlebbitRpcSettings(plebbitRpcSettings: PlebbitRpcSettings): Promise<void>
}

/**
 * TODO: define these types more in depth, most are already defined in:
 * https://github.com/plebbit/plebbit-js or
 * https://github.com/plebbit/plebbit-react-hooks/blob/master/docs/schema.md
 */
export type Account = {[key: string]: any}
export type AccountsActions = {[key: string]: any}
export type PublishCommentOptions = {[key: string]: any}
export type PublishVoteOptions = {[key: string]: any}
export type PublishCommentEditOptions = {[key: string]: any}
export type PublishCommentModerationOptions = {[key: string]: any}
export type PublishSubplebbitEditOptions = {[key: string]: any}
export type Challenge = {[key: string]: any}
export type ChallengeVerification = {[key: string]: any}
export type CreateCommentOptions = {[key: string]: any}
export type CreateSubplebbitOptions = {[key: string]: any}
export type CreateVoteOptions = {[key: string]: any}
export type Comment = {[key: string]: any}
export type Vote = {[key: string]: any}
export type CommentEdit = {[key: string]: any}
export type CommentModeration = {[key: string]: any}
export type SubplebbitEdit = {[key: string]: any}
export type Subplebbit = {[key: string]: any}
export type SubplebbitStats = {[key: string]: any}
export type Notification = {[key: string]: any}
export type Nft = {[key: string]: any}
export type Author = {[key: string]: any}

/**
 * Subplebbits and comments store
 */
export type Subplebbits = {[subplebbitAddress: string]: Subplebbit}
export type Comments = {[commentCid: string]: Comment}

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
export type CommentCidsToAccountsComments = {
  [commentCid: string]: {accountId: string; accountCommentIndex: number}
}
export interface AccountCommentReply extends Comment {
  markedAsRead: boolean
}
export type AccountCommentsReplies = {[replyCid: string]: AccountCommentReply}
export type AccountsCommentsReplies = {[accountId: string]: AccountCommentsReplies}
export type AccountsNotifications = {[accountId: string]: Notification[]}
export type Role = {
  role: 'owner' | 'admin' | 'moderator'
}
export type AccountSubplebbit = {
  role: Role
  autoStart?: boolean
}
export type AccountsVotes = {[accountId: string]: AccountVotes}
export type AccountVotes = {[commentCid: string]: AccountVote}
export type AccountVote = {
  // has all the publish options like commentCid, vote, timestamp, etc
  [publishOption: string]: any
}
export type AccountsEdits = {[accountId: string]: AccountEdits}
export type AccountEdits = {[commentCidOrSubplebbitAddress: string]: AccountEdit[]}
export type AccountEdit = {
  // has all the publish options like commentCid, vote, timestamp, etc (both comment edits and subplebbit edits)
  [publishOption: string]: any
}
export type AccountPublicationsFilter = (publication: AccountComment | AccountVote | AccountEdit) => Boolean

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
  postsPerPage: number
  filter: CommentsFilter
  newerThan?: number
}
export type FeedsOptions = {[feedName: string]: FeedOptions}
export type FeedSubplebbitsPostCounts = {[subplebbitAddress: string]: number}
export type FeedsSubplebbitsPostCounts = {[feedName: string]: FeedSubplebbitsPostCounts}
export type SubplebbitPage = {
  nextCid?: string
  comments: Comment[]
}
export type SubplebbitsPages = {[pageCid: string]: SubplebbitPage}
export type CommentsFilter = {
  filter(comment: Comment): Boolean
  key: string
}

/**
 * Replies store
 */
export type RepliesFeedOptions = {
  commentCid: string
  sortType: string
  accountId: string
  pageNumber: number
  repliesPerPage: number
  flat?: boolean
  accountComments?: boolean
  filter?: CommentsFilter
}
export type RepliesFeedsOptions = {[feedName: string]: RepliesFeedOptions}
export type RepliesPage = SubplebbitPage
export type RepliesPages = {[pageCid: string]: RepliesPage}

/**
 * Authors comments store
 */
// authorCommentsName is a string used a key to represent authorAddress + filter + accountId
export type AuthorsComments = {[authorCommentsName: string]: Comment[]}
export type AuthorCommentsOptions = {
  authorAddress: string
  pageNumber: number
  filter?: CommentsFilter
  accountId: string
}
export type AuthorsCommentsOptions = {[authorCommentsName: string]: FeedOptions}

/**
 * Other
 */
export type ChainProvider = {
  chainId?: number
  urls?: string[]
}
export type ChainProviders = {[chainTicker: string]: ChainProvider}
