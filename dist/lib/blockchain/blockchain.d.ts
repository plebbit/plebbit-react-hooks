import { Nft, BlockchainProviders } from '../../types';
export declare const getNftImageUrl: (nft: Nft, ipfsGatewayUrl: string, blockchainProviders: BlockchainProviders) => Promise<any>;
export declare const resolveEnsTxtRecord: (ensName: string, txtRecordName: string, blockchainProviders: BlockchainProviders) => Promise<any>;
export declare const getBlockchainProvider: (chainTicker: string, blockchainProviders: BlockchainProviders) => any;
declare const _default: {
    getNftImageUrl: (nft: any, ipfsGatewayUrl: string, blockchainProviders: BlockchainProviders) => Promise<any>;
    resolveEnsTxtRecord: (ensName: string, txtRecordName: string, blockchainProviders: BlockchainProviders) => Promise<any>;
    getBlockchainProvider: (chainTicker: string, blockchainProviders: BlockchainProviders) => any;
};
export default _default;
