import { Wallet } from '../../types';
export declare const getNftImageUrl: (...args: any) => Promise<any>;
export declare const getNftMetadataUrl: (...args: any) => Promise<any>;
export declare const getNftOwnerNoCache: (nftAddress: string, nftId: string, chainTicker: string, chainProviderUrl: string, chainId: number) => Promise<any>;
export declare const getNftOwner: (...args: any) => Promise<any>;
export declare const resolveEnsTxtRecordNoCache: (ensName: string, txtRecordName: string, chainTicker: string, chainProviderUrl?: string, chainId?: number) => Promise<any>;
export declare const resolveEnsTxtRecord: (...args: any) => Promise<any>;
export declare const getEthWalletFromPlebbitPrivateKey: (privateKeyBase64: string, authorAddress: string) => Promise<{
    address: string;
    timestamp: number;
    signature: {
        signature: string;
        type: string;
    };
} | undefined>;
export declare const getEthPrivateKeyFromPlebbitPrivateKey: (privateKeyBase64: string, authorAddress: string) => Promise<string | undefined>;
export declare const getSolWalletFromPlebbitPrivateKey: (privateKeyBase64: string, authorAddress: string) => Promise<{
    address: string;
    timestamp: number;
    signature: {
        signature: string;
        type: string;
    };
} | undefined>;
export declare const getSolPrivateKeyFromPlebbitPrivateKey: (privateKeyBase64: string, authorAddress: string) => Promise<string | undefined>;
export declare const validateEthWallet: (wallet: Wallet, authorAddress: string) => Promise<void>;
export declare const validateEthWalletViem: (wallet: Wallet, authorAddress: string) => Promise<void>;
export declare const validateSolWallet: (wallet: Wallet, authorAddress: string) => Promise<void>;
declare const _default: {
    getNftOwner: (...args: any) => Promise<any>;
    getNftMetadataUrl: (...args: any) => Promise<any>;
    getNftImageUrl: (...args: any) => Promise<any>;
    resolveEnsTxtRecord: (...args: any) => Promise<any>;
    getEthWalletFromPlebbitPrivateKey: (privateKeyBase64: string, authorAddress: string) => Promise<{
        address: string;
        timestamp: number;
        signature: {
            signature: string;
            type: string;
        };
    } | undefined>;
    getSolWalletFromPlebbitPrivateKey: (privateKeyBase64: string, authorAddress: string) => Promise<{
        address: string;
        timestamp: number;
        signature: {
            signature: string;
            type: string;
        };
    } | undefined>;
    getEthPrivateKeyFromPlebbitPrivateKey: (privateKeyBase64: string, authorAddress: string) => Promise<string | undefined>;
    getSolPrivateKeyFromPlebbitPrivateKey: (privateKeyBase64: string, authorAddress: string) => Promise<string | undefined>;
    validateEthWallet: (wallet: Wallet, authorAddress: string) => Promise<void>;
    validateEthWalletViem: (wallet: Wallet, authorAddress: string) => Promise<void>;
    validateSolWallet: (wallet: Wallet, authorAddress: string) => Promise<void>;
};
export default _default;
