import { Comment, AuthorCommentsFilter } from '../../types';
export declare const useAuthorLastCommentCid: (authorAddress?: string | undefined, comments?: (Comment | undefined)[] | undefined, accountName?: string | undefined) => any;
export declare const useAuthorCommentsName: (accountId?: string | undefined, authorAddress?: string | undefined, filter?: AuthorCommentsFilter | undefined) => string;
