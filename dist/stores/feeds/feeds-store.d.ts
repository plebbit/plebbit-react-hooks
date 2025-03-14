import { Feeds, FeedsOptions, FeedsSubplebbitsPostCounts } from '../../types';
export declare const defaultPostsPerPage = 25;
export declare const subplebbitPostsLeftBeforeNextPage = 50;
export declare const listeners: any;
export type FeedsState = {
    feedsOptions: FeedsOptions;
    bufferedFeeds: Feeds;
    loadedFeeds: Feeds;
    updatedFeeds: Feeds;
    bufferedFeedsSubplebbitsPostCounts: FeedsSubplebbitsPostCounts;
    feedsHaveMore: {
        [feedName: string]: boolean;
    };
    feedsSubplebbitAddressesWithNewerPosts: {
        [feedName: string]: string[];
    };
    addFeedToStore: Function;
    incrementFeedPageNumber: Function;
    resetFeed: Function;
    updateFeeds: Function;
};
declare const feedsStore: import("zustand").UseBoundStore<import("zustand").StoreApi<FeedsState>>;
export declare const resetFeedsStore: () => Promise<void>;
export declare const resetFeedsDatabaseAndStore: () => Promise<void>;
export default feedsStore;
