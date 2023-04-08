import { Subplebbit, SubplebbitPage, SubplebbitsPages, Comments } from '../../types';
export declare const listeners: any;
export declare type SubplebbitsPagesState = {
    subplebbitsPages: SubplebbitsPages;
    comments: Comments;
    addNextSubplebbitPageToStore: Function;
    addSubplebbitPageCommentsToStore: Function;
};
declare const subplebbitsPagesStore: import("zustand").UseBoundStore<import("zustand").StoreApi<SubplebbitsPagesState>>;
/**
 * Util function to get all pages in the store for a
 * specific subplebbit+sortType using `SubplebbitPage.nextCid`
 */
export declare const getSubplebbitPages: (subplebbit: Subplebbit, sortType: string, subplebbitsPages: SubplebbitsPages) => SubplebbitPage[];
export declare const getSubplebbitFirstPageCid: (subplebbit: Subplebbit, sortType: string) => any;
export declare const resetSubplebbitsPagesStore: () => Promise<void>;
export declare const resetSubplebbitsPagesDatabaseAndStore: () => Promise<void>;
export default subplebbitsPagesStore;
