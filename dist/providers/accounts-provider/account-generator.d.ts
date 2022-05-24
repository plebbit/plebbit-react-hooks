import { AccountSubplebbit } from '../../types';
export declare const generateDefaultAccount: () => Promise<{
    id: string;
    name: string;
    author: {
        displayName: null;
        address: string | undefined;
    };
    signer: import("@plebbit/plebbit-js/dist/node/signer").Signer;
    plebbit: import("@plebbit/plebbit-js/dist/node/plebbit").Plebbit;
    plebbitOptions: {
        ipfsGatewayUrl: string;
        ipfsHttpClientOptions: undefined;
        pubsubHttpClientOptions: string;
    };
    subscriptions: never[];
    blockedAddresses: {};
    subplebbits: {
        [subplebbitAddress: string]: AccountSubplebbit;
    };
}>;
declare const accountGenerator: {
    generateDefaultAccount: () => Promise<{
        id: string;
        name: string;
        author: {
            displayName: null;
            address: string | undefined;
        };
        signer: import("@plebbit/plebbit-js/dist/node/signer").Signer;
        plebbit: import("@plebbit/plebbit-js/dist/node/plebbit").Plebbit;
        plebbitOptions: {
            ipfsGatewayUrl: string;
            ipfsHttpClientOptions: undefined;
            pubsubHttpClientOptions: string;
        };
        subscriptions: never[];
        blockedAddresses: {};
        subplebbits: {
            [subplebbitAddress: string]: AccountSubplebbit;
        };
    }>;
};
export default accountGenerator;
