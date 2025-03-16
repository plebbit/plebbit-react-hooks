import { Feeds, RepliesFeedOptions, RepliesFeedsOptions, Comment, Comments, Account, Accounts, RepliesPages } from '../../types';
/**
 * Calculate the feeds from all the loaded replies pages, filter and sort them
 */
export declare const getFilteredSortedFeeds: (feedsOptions: RepliesFeedsOptions, comments: Comments, repliesPages: RepliesPages, accounts: Accounts) => Feeds;
export declare const getLoadedFeeds: (feedsOptions: RepliesFeedsOptions, loadedFeeds: Feeds, bufferedFeeds: Feeds, accounts: Accounts) => Promise<Feeds>;
export declare const getBufferedFeedsWithoutLoadedFeeds: (bufferedFeeds: Feeds, loadedFeeds: Feeds) => Feeds;
export declare const getUpdatedFeeds: (feedsOptions: RepliesFeedsOptions, filteredSortedFeeds: Feeds, updatedFeeds: Feeds, loadedFeeds: Feeds, accounts: Accounts) => Promise<Feeds>;
export declare const getFeedsReplyCounts: (feedsOptions: RepliesFeedsOptions, feeds: Feeds) => {
    [feedName: string]: number;
};
/**
 * Get which feeds have more replies, i.e. have not reached the final page of all comments
 */
export declare const getFeedsHaveMore: (feedsOptions: RepliesFeedsOptions, bufferedFeeds: Feeds, comments: Comments, repliesPages: RepliesPages, accounts: Accounts) => {
    [feedName: string]: boolean;
};
export declare const getFeedsComments: (feedsOptions: RepliesFeedsOptions, comments: Comments) => Map<string, Comment>;
export declare const feedsCommentsChanged: (previousFeedsComments: Map<string, Comment>, feedsComments: Map<string, Comment>) => boolean;
export declare const getFeedsCommentsFirstPageCids: (feedsComments: Map<string, Comment>) => string[];
export declare const getFeedsCommentsRepliesPagesFirstUpdatedAts: (feedsComments: Map<string, Comment>) => string;
export declare const getFeedsCommentsLoadedCount: (feedsComments: Map<string, Comment>) => number;
export declare const getSortTypeFromComment: (comment: Comment, feedOptions: RepliesFeedOptions) => string;
export declare const replyIsValid: (reply: Comment, account: Account) => Promise<boolean>;
