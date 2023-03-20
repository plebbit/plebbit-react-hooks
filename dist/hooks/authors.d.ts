import { Nft, BlockchainProviders, Author, UseAuthorAvatarOptions, UseAuthorAvatarResult, UseResolvedAuthorAddressOptions, UseResolvedAuthorAddressResult } from '../types';
/**
 * @param author - The Author object to resolve the avatar image URL of.
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export declare function useAuthorAvatar(options?: UseAuthorAvatarOptions): UseAuthorAvatarResult;
/**
 * @param nft - The NFT object to resolve the URL of.
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export declare function useNftMetadataUrl(nft?: Nft, accountName?: string): {
    metadataUrl: undefined;
    error: Error | undefined;
};
/**
 * @param nftMetadataUrl - The NFT URL to resolve the image URL of.
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export declare function useNftImageUrl(nftMetadataUrl?: string, accountName?: string): {
    imageUrl: undefined;
    error: Error | undefined;
};
export declare function useVerifiedAuthorAvatarSignature(author?: Author, accountName?: string): {
    verified: boolean | undefined;
    error: Error | undefined;
};
export declare const verifyAuthorAvatarSignature: (nft: Nft, authorAddress: string, blockchainProviders: BlockchainProviders) => Promise<boolean>;
/**
 * @param author - The author address to resolve to a public key, e.g. 'john.eth' resolves to 'Qm...'.
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export declare function useResolvedAuthorAddress(options?: UseResolvedAuthorAddressOptions): UseResolvedAuthorAddressResult;
export declare const resolveAuthorAddress: (authorAddress: string, blockchainProviders: BlockchainProviders, cache?: boolean | undefined) => Promise<any>;
