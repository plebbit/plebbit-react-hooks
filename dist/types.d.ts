import React from 'react';
/**
 * TODO: define these undefined types
 */
export declare type Account = any;
export declare type AccountsActions = any;
export declare type PublishCommentOptions = any;
export declare type PublishVoteOptions = any;
export declare type PublishCommentEditOptions = any;
export declare type Challenge = any;
export declare type ChallengeVerification = any;
export declare type CreateCommentOptions = any;
export declare type CreateSubplebbitOptions = any;
export declare type CreateVoteOptions = any;
export declare type Comment = any;
export declare type Subplebbit = any;
export declare type AccountNotification = any;
/**
 * Subplebbits and comments provider
 */
export declare type Subplebbits = {
    [subplebbitAddress: string]: Subplebbit;
};
export declare type Comments = {
    [commendCid: string]: Comment;
};
/**
 * Accounts provider
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
    role: 'onwer' | 'admin' | 'moderator';
    autoStart?: boolean;
};
/**
 * Feeds provider
 */
export declare type Feed = Comment[];
export declare type Feeds = {
    [feedName: string]: Feed;
};
export declare type FeedOptions = {
    subplebbitAddresses: string[];
    sortType: string;
    account: Account;
    pageNumber: number;
};
export declare type FeedsOptions = {
    [feedName: string]: FeedOptions;
};
export declare type SubplebbitPostsInfo = {
    firstPageCid: string;
    account: Account;
    subplebbitAddress: string;
    sortType: string;
    bufferedPostCount: number;
};
export declare type SubplebbitsPostsInfo = {
    [infoName: string]: SubplebbitPostsInfo;
};
export declare type SubplebbitPageInfo = {
    pageCid: string;
    page?: SubplebbitPage;
    account: Account;
    subplebbitAddress: string;
    sortType: string;
};
export declare type SubplebbitsPagesInfo = {
    [infoName: string]: SubplebbitPageInfo;
};
export declare type SubplebbitPage = {
    nextCid: string;
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
 * Utils
 */
export declare type Props = {
    children?: React.ReactChild;
};
