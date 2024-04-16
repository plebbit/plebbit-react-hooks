import { Nft, ChainProviders, Author } from '../../types';
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
export declare const setAuthorAvatarsWhitelistedTokenAddresses: (tokenAddresses: string[]) => void;
export declare function useAuthorAvatarIsWhitelisted(nft?: Nft): any;
export declare const verifyAuthorAvatarSignature: (nft: Nft, authorAddress: string, chainProviders: ChainProviders) => Promise<boolean>;
