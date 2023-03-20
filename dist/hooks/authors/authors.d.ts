import { ChainProviders, UseAuthorOptions, UseAuthorResult, UseAuthorCommentsOptions, UseAuthorCommentsResult, UseAuthorAvatarOptions, UseAuthorAvatarResult, UseResolvedAuthorAddressOptions, UseResolvedAuthorAddressResult } from '../../types';
/**
 * @param authorAddress - The address of the author
 * @param commentCid - The last known comment cid of the author (not possible to get an author without providing at least 1 comment cid)
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export declare function useAuthorComments(options?: UseAuthorCommentsOptions): UseAuthorCommentsResult;
/**
 * @param authorAddress - The address of the author
 * @param commentCid - The last known comment cid of the author (not possible to get an author without providing at least 1 comment cid)
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export declare function useAuthor(options?: UseAuthorOptions): UseAuthorResult;
/**
 * @param author - The Author object to resolve the avatar image URL of.
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export declare function useAuthorAvatar(options?: UseAuthorAvatarOptions): UseAuthorAvatarResult;
/**
 * @param author - The author address to resolve to a public key, e.g. 'john.eth' resolves to 'Qm...'.
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export declare function useResolvedAuthorAddress(options?: UseResolvedAuthorAddressOptions): UseResolvedAuthorAddressResult;
export declare const resolveAuthorAddress: (authorAddress: string, chainProviders: ChainProviders, cache?: boolean | undefined) => Promise<any>;
