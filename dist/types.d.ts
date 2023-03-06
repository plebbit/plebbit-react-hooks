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
export interface UseSubplebbitMetricsOptions extends Options {
    subplebbitAddress?: string;
}
export interface UseSubplebbitMetricsResult extends Result, SubplebbitMetrics {
}
export interface UseResolvedSubplebbitAddressOptions extends Options {
    subplebbitAddress: string | undefined;
    cache?: boolean;
}
export interface UseResolvedSubplebbitAddressResult extends Result {
    resolvedAddress: string | undefined;
    chainProvider: BlockchainProvider | undefined;
}
export interface UseFeedOptions extends Options {
    subplebbitAddresses: string[];
    sortType?: string;
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
export interface UseResolvedAuthorAddressOptions extends Options {
    author?: Author;
    cache?: boolean;
}
export interface UseResolvedAuthorAddressResult extends Result {
    resolvedAddress: string | undefined;
    chainProvider: BlockchainProvider | undefined;
}
export interface UseAuthorAvatarOptions extends Options {
    author?: Author;
}
export interface UseAuthorAvatarResult extends Result {
    imageUrl: string | undefined;
    metadataUrl: string | undefined;
    chainProvider: BlockchainProvider | undefined;
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
export declare type Account = {
    [key: string]: any;
};
export declare type AccountsActions = {
    [key: string]: any;
};
export declare type PublishCommentOptions = {
    [key: string]: any;
};
export declare type PublishVoteOptions = {
    [key: string]: any;
};
export declare type PublishCommentEditOptions = {
    [key: string]: any;
};
export declare type PublishSubplebbitEditOptions = {
    [key: string]: any;
};
export declare type Challenge = {
    [key: string]: any;
};
export declare type ChallengeVerification = {
    [key: string]: any;
};
export declare type CreateCommentOptions = {
    [key: string]: any;
};
export declare type CreateSubplebbitOptions = {
    [key: string]: any;
};
export declare type CreateVoteOptions = {
    [key: string]: any;
};
export declare type Comment = {
    [key: string]: any;
};
export declare type Vote = {
    [key: string]: any;
};
export declare type CommentEdit = {
    [key: string]: any;
};
export declare type SubplebbitEdit = {
    [key: string]: any;
};
export declare type Subplebbit = {
    [key: string]: any;
};
export declare type SubplebbitMetrics = {
    [key: string]: any;
};
export declare type Notification = {
    [key: string]: any;
};
export declare type Nft = {
    [key: string]: any;
};
export declare type Author = {
    [key: string]: any;
};
/**
 * Subplebbits and comments store
 */
export declare type Subplebbits = {
    [subplebbitAddress: string]: Subplebbit;
};
export declare type Comments = {
    [commentCid: string]: Comment;
};
/**
 * Accounts store
 */
export declare type Accounts = {
    [accountId: string]: Account;
};
export declare type AccountNamesToAccountIds = {
    [accountName: string]: string;
};
export interface AccountComment extends Comment {
    index: number;
    accountId: string;
}
export declare type AccountComments = AccountComment[];
export declare type AccountsComments = {
    [accountId: string]: AccountComments;
};
export declare type CommentCidsToAccountsComments = {
    [commentCid: string]: {
        accountId: string;
        accountCommentIndex: number;
    };
};
export interface AccountCommentReply extends Comment {
    markedAsRead: boolean;
}
export declare type AccountCommentsReplies = {
    [replyCid: string]: AccountCommentReply;
};
export declare type AccountsCommentsReplies = {
    [accountId: string]: AccountCommentsReplies;
};
export declare type AccountsNotifications = {
    [accountId: string]: Notification[];
};
export declare type Role = {
    role: 'owner' | 'admin' | 'moderator';
};
export declare type AccountSubplebbit = {
    role: Role;
    autoStart?: boolean;
};
export declare type AccountsVotes = {
    [accountId: string]: AccountVotes;
};
export declare type AccountVotes = {
    [commentCid: string]: AccountVote;
};
export declare type AccountVote = {
    [publishOption: string]: any;
};
export declare type AccountsEdits = {
    [accountId: string]: AccountEdits;
};
export declare type AccountEdits = {
    [commentCidOrSubplebbitAddress: string]: AccountEdit[];
};
export declare type AccountEdit = {
    [publishOption: string]: any;
};
/**
 * Feeds store
 */
export declare type Feed = Comment[];
export declare type Feeds = {
    [feedName: string]: Feed;
};
export declare type FeedOptions = {
    subplebbitAddresses: string[];
    sortType: string;
    accountId: string;
    pageNumber: number;
};
export declare type FeedsOptions = {
    [feedName: string]: FeedOptions;
};
export declare type FeedSubplebbitsPostCounts = {
    [subplebbitAddress: string]: number;
};
export declare type FeedsSubplebbitsPostCounts = {
    [feedName: string]: FeedSubplebbitsPostCounts;
};
export declare type SubplebbitPage = {
    nextCid?: string;
    comments: Comment[];
};
export declare type SubplebbitsPages = {
    [pageCid: string]: SubplebbitPage;
};
/**
 * Accounts hooks
 */
export declare type AccountPublicationsFilter = {
    subplebbitAddresses?: string[];
    postCids?: string[];
    commentCids?: string[];
    parentCids?: string[];
    hasParentCid?: boolean;
};
/**
 * Other
 */
export declare type BlockchainProvider = {
    chainId?: number;
    url?: string;
};
export declare type BlockchainProviders = {
    [chainTicker: string]: BlockchainProvider;
};
