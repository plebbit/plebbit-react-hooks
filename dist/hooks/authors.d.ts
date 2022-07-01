import { Nft, BlockchainProviders, Author } from '../types';
/**
 * @param author - The Author object to resolve the avatar image URL of.
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export declare function useAuthorAvatarImageUrl(author?: Author, accountName?: string): undefined;
/**
 * @param nft - The NFT object to resolve the image URL of.
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export declare function useNftImageUrl(nft?: Nft, accountName?: string): undefined;
export declare function useVerifiedAuthorAvatarSignature(author?: Author, accountName?: string): boolean | undefined;
export declare const verifyAuthorAvatarSignature: (nft: Nft, authorAddress: string, blockchainProviders: BlockchainProviders) => Promise<any>;
export declare const getNftImageUrl: (nft: Nft, ipfsGatewayUrl: string, blockchainProviders: BlockchainProviders) => Promise<any>;
/**
 * @param authorAddress - The author address to resolve to a public key, e.g. 'john.eth' resolves to 'Qm...'.
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export declare function useResolvedAuthorAddress(authorAddress?: string, accountName?: string): string | undefined;
export declare const resolveAuthorAddress: (authorAddress: string, blockchainProviders: BlockchainProviders) => Promise<any>;
