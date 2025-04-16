import { Feeds, RepliesFeedOptions, RepliesFeedsOptions } from '../../types';
export declare const defaultRepliesPerPage = 25;
export declare const commentRepliesLeftBeforeNextPage = 50;
export type RepliesState = {
    feedsOptions: RepliesFeedsOptions;
    bufferedFeeds: Feeds;
    loadedFeeds: Feeds;
    updatedFeeds: Feeds;
    bufferedFeedsReplyCounts: {
        [feedName: string]: number;
    };
    feedsHaveMore: {
        [feedName: string]: boolean;
    };
    addFeedToStoreOrUpdateComment: Function;
    incrementFeedPageNumber: Function;
    resetFeed: Function;
    updateFeeds: Function;
};
export declare const feedOptionsToFeedName: (feedOptions: Partial<RepliesFeedOptions>) => string;
declare const repliesStore: import("zustand").UseBoundStore<import("zustand").StoreApi<RepliesState>>;
export declare const resetRepliesStore: () => Promise<void>;
export declare const resetRepliesDatabaseAndStore: () => Promise<void>;
export default repliesStore;
