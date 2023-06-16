import { AuthorCommentsOptions, Comment } from '../../types';
export declare const commentsPerPage = 25;
export declare const commentBufferSize = 50;
export type AuthorsCommentsState = {
    options: {
        [authorCommentsName: string]: AuthorCommentsOptions;
    };
    loadedComments: {
        [authorCommentsName: string]: Comment[];
    };
    hasMoreBufferedComments: {
        [authorCommentsName: string]: boolean;
    };
    bufferedCommentCids: {
        [authorAddress: string]: Set<string>;
    };
    nextCommentCidsToFetch: {
        [authorAddress: string]: string | undefined;
    };
    shouldFetchNextComment: {
        [authorAddress: string]: boolean;
    };
    lastCommentCids: {
        [authorAddress: string]: string | undefined;
    };
    addAuthorCommentsToStore: Function;
    setNextCommentCidsToFetch: Function;
    incrementPageNumber: Function;
    addBufferedCommentCid: Function;
    updateLoadedComments: Function;
    setLastCommentCid: Function;
};
declare const authorsCommentsStore: import("zustand").UseBoundStore<import("zustand").StoreApi<AuthorsCommentsState>>;
export declare const resetAuthorsCommentsStore: () => Promise<void>;
export declare const resetAuthorsCommentsDatabaseAndStore: () => Promise<void>;
export default authorsCommentsStore;
