import { Feed, Feeds, FeedOptions, FeedsOptions, Subplebbit, Subplebbits, Accounts, SubplebbitsPages, FeedsSubplebbitsPostCounts } from '../../types';
/**
 * Calculate the feeds from all the loaded subplebbit pages, filter and sort them
 */
export declare const getFilteredSortedFeeds: (feedsOptions: FeedsOptions, subplebbits: Subplebbits, subplebbitsPages: SubplebbitsPages, accounts: Accounts) => Feeds;
export declare const getLoadedFeeds: (feedsOptions: FeedsOptions, loadedFeeds: Feeds, bufferedFeeds: Feeds) => Feeds;
export declare const getBufferedFeedsWithoutLoadedFeeds: (bufferedFeeds: Feeds, loadedFeeds: Feeds) => Feeds;
export declare const getFeedsSubplebbitAddressesWithNewerPosts: (filteredSortedFeeds: Feeds, loadedFeeds: Feeds, previousFeedsSubplebbitAddressesWithNewerPosts: {
    [feedName: string]: string[];
}) => {
    [feedName: string]: string[];
};
export declare const getFeedsSubplebbitsPostCounts: (feedsOptions: FeedsOptions, feeds: Feeds) => FeedsSubplebbitsPostCounts;
/**
 * Get which feeds have more posts, i.e. have no reached the final page of all subs
 */
export declare const getFeedsHaveMore: (feedsOptions: FeedsOptions, bufferedFeeds: Feeds, subplebbits: Subplebbits, subplebbitsPages: SubplebbitsPages, accounts: Accounts) => {
    [feedName: string]: boolean;
};
export declare const getFeedAfterIncrementPageNumber: (feedName: string, feedOptions: FeedOptions, bufferedFeed: Feed, loadedFeed: Feed, subplebbits: Subplebbits, subplebbitsPages: SubplebbitsPages, accounts: Accounts) => {
    bufferedFeed: Feed;
    loadedFeed: Feed;
    bufferedFeedSubplebbitsPostCounts: import("../../types").FeedSubplebbitsPostCounts;
    feedHasMore: boolean;
};
export declare const getFeedsSubplebbits: (feedsOptions: FeedsOptions, subplebbits: Subplebbits) => Map<string, Subplebbit>;
export declare const feedsSubplebbitsChanged: (previousFeedsSubplebbits: Map<string, Subplebbit>, feedsSubplebbits: Map<string, Subplebbit>) => boolean;
export declare const getFeedsSubplebbitsFirstPageCids: (feedsSubplebbits: Map<string, Subplebbit>) => string[];
export declare const getFeedsSubplebbitsLoadedCount: (feedsSubplebbits: Map<string, Subplebbit>) => number;
export declare const getAccountsBlockedAddresses: (accounts: Accounts) => string[];
export declare const accountsBlockedAddressesChanged: (previousAccountsBlockedAddresses: {
    [address: string]: boolean;
}[], accountsBlockedAddresses: {
    [address: string]: boolean;
}[]) => boolean;
export declare const feedsHaveChangedBlockedAddresses: (feedsOptions: FeedsOptions, bufferedFeeds: Feeds, blockedAddresses: string[], previousBlockedAddresses: string[]) => boolean;
export declare const getAccountsBlockedCids: (accounts: Accounts) => string[];
export declare const accountsBlockedCidsChanged: (previousAccountsBlockedCids: {
    [address: string]: boolean;
}[], accountsBlockedCids: {
    [address: string]: boolean;
}[]) => boolean;
export declare const feedsHaveChangedBlockedCids: (feedsOptions: FeedsOptions, bufferedFeeds: Feeds, blockedCids: string[], previousBlockedCids: string[]) => boolean;
