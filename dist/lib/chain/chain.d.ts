export declare const getNftImageUrl: (...args: any) => Promise<any>;
export declare const getNftMetadataUrl: (...args: any) => Promise<any>;
export declare const getNftOwnerNoCache: (nftAddress: string, nftId: string, chainTicker: string, chainProviderUrl: string, chainId: number) => Promise<any>;
export declare const getNftOwner: (...args: any) => Promise<any>;
export declare const resolveEnsTxtRecordNoCache: (ensName: string, txtRecordName: string, chainTicker: string, chainProviderUrl?: string, chainId?: number) => Promise<any>;
export declare const resolveEnsTxtRecord: (...args: any) => Promise<any>;
declare const _default: {
    getNftOwner: (...args: any) => Promise<any>;
    getNftMetadataUrl: (...args: any) => Promise<any>;
    getNftImageUrl: (...args: any) => Promise<any>;
    resolveEnsTxtRecord: (...args: any) => Promise<any>;
};
export default _default;
