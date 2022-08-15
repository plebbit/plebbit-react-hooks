import { Subplebbits, SubplebbitsPages, SubplebbitsPostsInfo } from '../../types';
export declare const listeners: any;
/**
 * Use the `SubplebbitPostsInfo` objects to fetch the first page of all subplebbit/sorts
 * if the `SubplebbitPostsInfo.bufferedPostCount` gets too low, start fetching the next page.
 * Once a next page is added, it is never removed.
 */
export default function useSubplebbitsPages(subplebbitsPostsInfo: SubplebbitsPostsInfo, subplebbits: Subplebbits): SubplebbitsPages;
export declare const resetSubplebbitsPagesStore: () => Promise<void>;
export declare const resetSubplebbitsPagesDatabaseAndStore: () => Promise<void>;
