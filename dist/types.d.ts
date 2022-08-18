/**
 * TODO: define these undefined types
 */
export declare type Account = any;
export declare type AccountsActions = any;
export declare type PublishCommentOptions = any;
export declare type PublishVoteOptions = any;
export declare type PublishCommentEditOptions = any;
export declare type PublishSubplebbitEditOptions = any;
export declare type Challenge = any;
export declare type ChallengeVerification = any;
export declare type CreateCommentOptions = any;
export declare type CreateSubplebbitOptions = any;
export declare type CreateVoteOptions = any;
export declare type Comment = any;
export declare type Subplebbit = any;
export declare type AccountNotification = any;
export declare type Nft = any;
export declare type Author = any;
/**
 * Subplebbits and comments store
 */
export declare type Subplebbits = {
    [subplebbitAddress: string]: Subplebbit;
};
export declare type Comments = {
    [commendCid: string]: Comment;
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
export interface AccountCommentReply extends Comment {
    markedAsRead: boolean;
}
export declare type AccountCommentsReplies = {
    [replyCid: string]: AccountCommentReply;
};
export declare type AccountsCommentsReplies = {
    [accountId: string]: AccountCommentsReplies;
};
export declare type AccountNotifications = AccountNotification[];
export declare type AccountsNotifications = {
    [accountId: string]: AccountNotifications;
};
export declare type AccountSubplebbit = {
    role: 'owner' | 'admin' | 'moderator';
    autoStart?: boolean;
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
    nextCid: string | null;
    comments: Comment[];
};
export declare type SubplebbitsPages = {
    [pageCid: string]: SubplebbitPage;
};
/**
 * Accounts hooks
 */
export declare type UseAccountCommentsFilter = {
    subplebbitAddresses?: string[];
    postCids?: string[];
    commentCids?: string[];
    parentCids?: string[];
    hasParentCid?: boolean;
};
export declare type UseAccountCommentsOptions = {
    accountName?: string;
    filter?: UseAccountCommentsFilter;
};
/**
 * Feeds hooks
 */
export declare type UseBufferedFeedOptions = {
    subplebbitAddresses: string[];
    sortType?: string;
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
