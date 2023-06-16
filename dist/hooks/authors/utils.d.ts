import { Comment, AuthorCommentsFilter } from '../../types';
export declare const useAuthorLastCommentCid: (authorAddress?: string, comments?: (Comment | undefined)[], accountName?: string) => any;
export declare const useAuthorCommentsName: (accountId?: string, authorAddress?: string, filter?: AuthorCommentsFilter | undefined) => string;
export declare const usePlebbitAddress: (publicKeyBase64: string) => string | undefined;
