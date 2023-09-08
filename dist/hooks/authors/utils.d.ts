import { CommentsFilter } from '../../types';
export declare const useAuthorCommentsName: (accountId?: string, authorAddress?: string, filter?: CommentsFilter | undefined) => string;
export declare const usePlebbitAddress: (publicKeyBase64: string) => string | undefined;
