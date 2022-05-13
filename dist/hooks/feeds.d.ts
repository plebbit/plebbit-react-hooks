import { Feed, UseBufferedFeedOptions } from '../types';
/**
 * @param subplebbitAddresses - The addresses of the subplebbits, e.g. ['memes.eth', 'Qm...']
 * @param sortType - The sorting algo for the feed: 'hot' | 'new' | 'topHour'| 'topDay' | 'topWeek' | 'topMonth' | 'topYear' | 'topAll'
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export declare function useFeed(subplebbitAddresses?: string[], sortType?: string, accountName?: string): {
    feed: any;
    hasMore: any;
    loadMore: () => void;
};
/**
 * Use useBufferedFeeds to buffer multiple feeds in the background so what when
 * they are called by useFeed later, they are already preloaded.
 *
 * @param feedOptions - The options of the feed
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export declare function useBufferedFeeds(feedsOptions?: UseBufferedFeedOptions[], accountName?: string): Feed[];
