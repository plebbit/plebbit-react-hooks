import { Feeds, FeedsOptions } from '../../types';
export declare const listeners: any;
declare type FeedsState = {
    feedsOptions: FeedsOptions;
    bufferedFeeds: Feeds;
    loadedFeeds: Feeds;
    addFeedToStore: Function;
    incrementFeedPageNumber: Function;
};
declare const useFeedsStore: import("zustand").UseBoundStore<import("zustand").StoreApi<FeedsState>>;
export declare const resetFeedsStore: () => Promise<void>;
export declare const resetFeedsDatabaseAndStore: () => Promise<void>;
export default useFeedsStore;
