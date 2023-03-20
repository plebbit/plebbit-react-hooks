import { AccountPublicationsFilter, Comment, Comments, AuthorCommentsFilter } from '../../types';
export declare const getUpdatedLoadedAndBufferedComments: (loadedComments: Comment[], bufferedComments: Comment[], pageNumber: number, filter: AccountPublicationsFilter | undefined, comments: Comments) => {
    loadedComments: Comment[];
    bufferedComments: Comment[];
};
export declare const getUpdatedBufferedComments: (loadedComments: Comment[], bufferedComments: Comment[], filter: AccountPublicationsFilter | undefined, comments: Comments) => Comment[];
export declare const filterAuthorComments: (authorComments: Comment[], filter: AuthorCommentsFilter) => Comment[];
export declare const getNextCommentCidToFetchNotFetched: (nextCommentCidToFetch: string | undefined) => string | undefined;
export declare const toSizes: (obj: {
    [key: string]: any;
}) => {
    [key: string]: number;
};
