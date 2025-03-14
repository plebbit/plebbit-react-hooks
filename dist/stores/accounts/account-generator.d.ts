import { AccountSubplebbit } from '../../types';
export declare const overwritePlebbitOptions: {
    resolveAuthorAddresses: boolean;
    validatePages: boolean;
};
export declare const getDefaultPlebbitOptions: () => any;
export declare const defaultMediaIpfsGatewayUrl: any;
export declare const generateDefaultAccount: () => Promise<{
    id: string;
    version: number;
    name: string;
    author: {
        address: any;
    };
    signer: any;
    plebbitOptions: any;
    plebbit: any;
    subscriptions: never[];
    blockedAddresses: {};
    blockedCids: {};
    subplebbits: {
        [subplebbitAddress: string]: AccountSubplebbit;
    };
    mediaIpfsGatewayUrl: any;
}>;
declare const accountGenerator: {
    generateDefaultAccount: () => Promise<{
        id: string;
        version: number;
        name: string;
        author: {
            address: any;
        };
        signer: any;
        plebbitOptions: any;
        plebbit: any;
        subscriptions: never[];
        blockedAddresses: {};
        blockedCids: {};
        subplebbits: {
            [subplebbitAddress: string]: AccountSubplebbit;
        };
        mediaIpfsGatewayUrl: any;
    }>;
    getDefaultPlebbitOptions: () => any;
};
export default accountGenerator;
