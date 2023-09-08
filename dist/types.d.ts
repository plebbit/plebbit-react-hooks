/**
 * Public interface
 */
export interface Options {
    accountName?: string;
    onError?(error: Error): void;
}
export interface Result {
    state: string;
    error: Error | undefined;
    errors: Error[];
}
export interface UseAccountOptions extends Options {
}
export interface UseAccountResult extends Result, Account {
}
export interface UseAccountsOptions extends Options {
}
export interface UseAccountsResult extends Result {
    accounts: Account[];
}
export interface UseAccountCommentsOptions extends Options {
    filter?: AccountPublicationsFilter;
}
export interface UseAccountCommentsResult extends Result {
    accountComments: AccountComment[];
}
export interface UseAccountCommentOptions extends Options {
    commentIndex?: number;
}
export interface UseAccountCommentResult extends Result, AccountComment {
}
export interface UseAccountVotesOptions extends Options {
    filter?: AccountPublicationsFilter;
}
export interface UseAccountVotesResult extends Result {
    accountVotes: AccountVote[];
}
export interface UseAccountVoteOptions extends Options {
    commentCid?: string;
}
export interface UseAccountVoteResult extends Result, AccountVote {
    commentCid: string | undefined;
    vote: number | undefined;
}
export interface UseAccountEditsOptions extends Options {
    filter?: AccountPublicationsFilter;
}
export interface UseAccountEditsResult extends Result {
    accountEdits: AccountEdit[];
}
export interface UseNotificationsOptions extends Options {
}
export interface UseNotificationsResult extends Result {
    notifications: Notification[];
    markAsRead(): Promise<void>;
}
export interface UseAccountSubplebbitsOptions extends Options {
}
export interface UseAccountSubplebbitsResult extends Result {
    accountSubplebbits: AccountSubplebbit[];
}
export interface UsePubsubSubscribeOptions extends Options {
    subplebbitAddress?: string;
}
export interface UsePubsubSubscribeResult extends Result {
}
export interface UseCommentOptions extends Options {
    commentCid?: string;
}
export interface UseCommentResult extends Result, Comment {
}
export interface UseCommentsOptions extends Options {
    commentCids?: string[];
}
export interface UseCommentsResult extends Result {
    comments: (Comment | undefined)[];
}
export interface UseEditedCommentOptions extends Options {
    comment?: Comment;
}
export interface UseEditedCommentResult extends Result {
    editedComment: Comment | undefined;
    succeededEdits: {
        [succeededEditPropertyName: string]: any;
    };
    pendingEdits: {
        [pendingEditPropertyName: string]: any;
    };
    failedEdits: {
        [failedEditPropertyName: string]: any;
    };
}
export interface UseSubplebbitOptions extends Options {
    subplebbitAddress?: string;
}
export interface UseSubplebbitResult extends Result, Subplebbit {
}
export interface UseSubplebbitsOptions extends Options {
    subplebbitAddresses?: string[];
}
export interface UseSubplebbitsResult extends Result {
    subplebbits: (Subplebbit | undefined)[];
}
export interface UseSubplebbitStatsOptions extends Options {
    subplebbitAddress?: string;
}
export interface UseSubplebbitStatsResult extends Result, SubplebbitStats {
}
export interface UseResolvedSubplebbitAddressOptions extends Options {
    subplebbitAddress: string | undefined;
    cache?: boolean;
}
export interface UseResolvedSubplebbitAddressResult extends Result {
    resolvedAddress: string | undefined;
    chainProvider: ChainProvider | undefined;
}
export interface UseFeedOptions extends Options {
    subplebbitAddresses: string[];
    sortType?: string;
    postsPerPage?: number;
    filter?: CommentsFilter;
}
export interface UseFeedResult extends Result {
    feed: Comment[];
    hasMore: boolean;
    loadMore(): Promise<void>;
}
export interface UseBufferedFeedsOptions extends Options {
    feedsOptions?: UseFeedOptions[];
}
export interface UseBufferedFeedsResult extends Result {
    bufferedFeeds: Comment[][];
}
export interface UseAuthorOptions extends Options {
    authorAddress?: string;
    commentCid?: string;
}
export interface UseAuthorResult extends Result {
    author: Author | undefined;
}
export interface UseAuthorCommentsOptions extends Options {
    authorAddress?: string;
    commentCid?: string;
    filter?: CommentsFilter;
}
export interface UseAuthorCommentsResult extends Result {
    authorComments: (Comment | undefined)[];
    lastCommentCid: string | undefined;
    hasMore: boolean;
    loadMore(): Promise<void>;
}
export interface UseResolvedAuthorAddressOptions extends Options {
    author?: Author;
    cache?: boolean;
}
export interface UseResolvedAuthorAddressResult extends Result {
    resolvedAddress: string | undefined;
    chainProvider: ChainProvider | undefined;
}
export interface UseAuthorAvatarOptions extends Options {
    author?: Author;
}
export interface UseAuthorAvatarResult extends Result {
    imageUrl: string | undefined;
    metadataUrl: string | undefined;
    chainProvider: ChainProvider | undefined;
}
export interface UseAuthorAddressOptions extends Options {
    comment?: Comment;
}
export interface UseAuthorAddressResult extends Result {
    authorAddress: string | undefined;
    shortAuthorAddress: string | undefined;
}
export interface UsePublishCommentOptions extends Options {
    onChallenge?(challenge: Challenge, comment?: Comment): Promise<void>;
    onChallengeVerification?(challengeVerification: ChallengeVerification, comment?: Comment): Promise<void>;
    [publishOption: string]: any;
}
export interface UsePublishCommentResult extends Result {
    index: number | undefined;
    challenge: Challenge | undefined;
    challengeVerification: ChallengeVerification | undefined;
    publishComment(): Promise<void>;
    publishChallengeAnswers(challengeAnswers: string[]): Promise<void>;
}
export interface UsePublishVoteOptions extends Options {
    onChallenge?(challenge: Challenge, comment?: Comment): Promise<void>;
    onChallengeVerification?(challengeVerification: ChallengeVerification, comment?: Comment): Promise<void>;
    [publishOption: string]: any;
}
export interface UsePublishVoteResult extends Result {
    challenge: Challenge | undefined;
    challengeVerification: ChallengeVerification | undefined;
    publishVote(): Promise<void>;
    publishChallengeAnswers(challengeAnswers: string[]): Promise<void>;
}
export interface UsePublishCommentEditOptions extends Options {
    onChallenge?(challenge: Challenge, comment?: Comment): Promise<void>;
    onChallengeVerification?(challengeVerification: ChallengeVerification, comment?: Comment): Promise<void>;
    [publishOption: string]: any;
}
export interface UsePublishCommentEditResult extends Result {
    challenge: Challenge | undefined;
    challengeVerification: ChallengeVerification | undefined;
    publishCommentEdit(): Promise<void>;
    publishChallengeAnswers(challengeAnswers: string[]): Promise<void>;
}
export interface UsePublishSubplebbitEditOptions extends Options {
    subplebbitAddress?: string;
    onChallenge?(challenge: Challenge, comment?: Comment): Promise<void>;
    onChallengeVerification?(challengeVerification: ChallengeVerification, comment?: Comment): Promise<void>;
    [publishOption: string]: any;
}
export interface UsePublishSubplebbitEditResult extends Result {
    challenge: Challenge | undefined;
    challengeVerification: ChallengeVerification | undefined;
    publishSubplebbitEdit(): Promise<void>;
    publishChallengeAnswers(challengeAnswers: string[]): Promise<void>;
}
export interface UseCreateSubplebbitOptions extends Options {
    [createSubplebbitOption: string]: any;
}
export interface UseCreateSubplebbitResult extends Result {
    createdSubplebbit: Subplebbit | undefined;
    createSubplebbit(): Promise<void>;
}
export interface UseSubscribeOptions extends Options {
    subplebbitAddress?: string;
    multisubAddress?: string;
    authorAddress?: string;
}
export interface UseSubscribeResult extends Result {
    subscribed: boolean | undefined;
    subscribe(): Promise<void>;
    unsubscribe(): Promise<void>;
}
export interface UseBlockOptions extends Options {
    address?: string;
    cid?: string;
}
export interface UseBlockResult extends Result {
    blocked: boolean | undefined;
    block(): Promise<void>;
    unblock(): Promise<void>;
}
/**
 * TODO: define these types more in depth, most are already defined in:
 * https://github.com/plebbit/plebbit-js or
 * https://github.com/plebbit/plebbit-react-hooks/blob/master/docs/schema.md
 */
export type Account = {
    [key: string]: any;
};
export type AccountsActions = {
    [key: string]: any;
};
export type PublishCommentOptions = {
    [key: string]: any;
};
export type PublishVoteOptions = {
    [key: string]: any;
};
export type PublishCommentEditOptions = {
    [key: string]: any;
};
export type PublishSubplebbitEditOptions = {
    [key: string]: any;
};
export type Challenge = {
    [key: string]: any;
};
export type ChallengeVerification = {
    [key: string]: any;
};
export type CreateCommentOptions = {
    [key: string]: any;
};
export type CreateSubplebbitOptions = {
    [key: string]: any;
};
export type CreateVoteOptions = {
    [key: string]: any;
};
export type Comment = {
    [key: string]: any;
};
export type Vote = {
    [key: string]: any;
};
export type CommentEdit = {
    [key: string]: any;
};
export type SubplebbitEdit = {
    [key: string]: any;
};
export type Subplebbit = {
    [key: string]: any;
};
export type SubplebbitStats = {
    [key: string]: any;
};
export type Notification = {
    [key: string]: any;
};
export type Nft = {
    [key: string]: any;
};
export type Author = {
    [key: string]: any;
};
/**
 * Subplebbits and comments store
 */
export type Subplebbits = {
    [subplebbitAddress: string]: Subplebbit;
};
export type Comments = {
    [commentCid: string]: Comment;
};
/**
 * Accounts store
 */
export type Accounts = {
    [accountId: string]: Account;
};
export type AccountNamesToAccountIds = {
    [accountName: string]: string;
};
export interface AccountComment extends Comment {
    index: number;
    accountId: string;
}
export type AccountComments = AccountComment[];
export type AccountsComments = {
    [accountId: string]: AccountComments;
};
export type CommentCidsToAccountsComments = {
    [commentCid: string]: {
        accountId: string;
        accountCommentIndex: number;
    };
};
export interface AccountCommentReply extends Comment {
    markedAsRead: boolean;
}
export type AccountCommentsReplies = {
    [replyCid: string]: AccountCommentReply;
};
export type AccountsCommentsReplies = {
    [accountId: string]: AccountCommentsReplies;
};
export type AccountsNotifications = {
    [accountId: string]: Notification[];
};
export type Role = {
    role: 'owner' | 'admin' | 'moderator';
};
export type AccountSubplebbit = {
    role: Role;
    autoStart?: boolean;
};
export type AccountsVotes = {
    [accountId: string]: AccountVotes;
};
export type AccountVotes = {
    [commentCid: string]: AccountVote;
};
export type AccountVote = {
    [publishOption: string]: any;
};
export type AccountsEdits = {
    [accountId: string]: AccountEdits;
};
export type AccountEdits = {
    [commentCidOrSubplebbitAddress: string]: AccountEdit[];
};
export type AccountEdit = {
    [publishOption: string]: any;
};
export type AccountPublicationsFilter = (publication: AccountComment | AccountVote | AccountEdit) => Boolean;
/**
 * Feeds store
 */
export type Feed = Comment[];
export type Feeds = {
    [feedName: string]: Feed;
};
export type FeedOptions = {
    subplebbitAddresses: string[];
    sortType: string;
    accountId: string;
    pageNumber: number;
    postsPerPage: number;
    filter: CommentsFilter;
};
export type FeedsOptions = {
    [feedName: string]: FeedOptions;
};
export type FeedSubplebbitsPostCounts = {
    [subplebbitAddress: string]: number;
};
export type FeedsSubplebbitsPostCounts = {
    [feedName: string]: FeedSubplebbitsPostCounts;
};
export type SubplebbitPage = {
    nextCid?: string;
    comments: Comment[];
};
export type SubplebbitsPages = {
    [pageCid: string]: SubplebbitPage;
};
export type CommentsFilter = (comment: Comment) => Boolean;
/**
 * Authors comments store
 */
export type AuthorsComments = {
    [authorCommentsName: string]: Comment[];
};
export type AuthorCommentsOptions = {
    authorAddress: string;
    pageNumber: number;
    filter?: CommentsFilter;
    accountId: string;
};
export type AuthorsCommentsOptions = {
    [authorCommentsName: string]: FeedOptions;
};
/**
 * Other
 */
export type ChainProvider = {
    chainId?: number;
    urls?: string[];
};
export type ChainProviders = {
    [chainTicker: string]: ChainProvider;
};
