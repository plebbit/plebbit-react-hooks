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
export declare type CreateVoteOptions = any;
export declare type Comment = any;
export declare type Subplebbit = any;
export declare type AccountNotification = any;
/**
 * Subplebbits and comments provider
 */
export declare type Subplebbits = {
    [key: string]: Subplebbit;
};
export declare type Comments = {
    [key: string]: Comment;
};
/**
 * Accounts provider
 */
export declare type Accounts = {
    [key: string]: Account;
};
export declare type AccountNamesToAccountIds = {
    [key: string]: string;
};
export interface AccountComment extends Comment {
    index: number;
    accountId: string;
}
export declare type AccountComments = AccountComment[];
export declare type AccountsComments = {
    [key: string]: AccountComments;
};
export interface AccountCommentReply extends Comment {
    markedAsRead: boolean;
}
export declare type AccountCommentsReplies = {
    [key: string]: AccountCommentReply;
};
export declare type AccountsCommentsReplies = {
    [key: string]: AccountCommentsReplies;
};
export declare type AccountNotifications = AccountNotification[];
export declare type AccountsNotifications = {
    [key: string]: AccountNotifications;
};
/**
 * Feeds provider
 */
export declare type Feed = Comment[];
export declare type Feeds = {
    [key: string]: Feed;
};
export declare type FeedOptions = {
    subplebbitAddresses: string[];
    sortType: string;
    account: Account;
    pageNumber: number;
};
export declare type FeedsOptions = {
    [key: string]: FeedOptions;
};
export declare type FeedSortedPostsInfo = {
    firstPageSortedPostsCid: string;
    account: Account;
    subplebbitAddress: string;
    sortType: string;
    bufferedPostCount: number;
};
export declare type FeedsSortedPostsInfo = {
    [key: string]: FeedSortedPostsInfo;
};
export declare type SortedPostsPageInfo = {
    sortedPostsCid: string;
    sortedPosts?: SortedComments;
    account: Account;
    subplebbitAddress: string;
    sortType: string;
};
export declare type SortedPostsPagesInfo = {
    [key: string]: SortedPostsPageInfo;
};
export declare type SortedComments = {
    nextSortedCommentsCid: string;
    comments: Comment[];
};
export declare type SortedPostsPages = {
    [key: string]: SortedComments;
};
/**
 * Accounts hooks
 */
export declare type UseAccountCommentsFilter = {
    subplebbitAddresses?: string[];
    postCids?: string[];
    commentCids?: string[];
    parentCommentCids?: string[];
    hasParentCommentCid?: boolean;
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
