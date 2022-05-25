import { AccountSubplebbit } from '../../types';
export declare const getDefaultPlebbitOptions: () => any;
export declare const generateDefaultAccount: () => Promise<{
    id: string;
    name: string;
    author: {
        displayName: null;
        address: string | undefined;
    };
    signer: import("@plebbit/plebbit-js/dist/node/signer").Signer;
    plebbitOptions: any;
    plebbit: import("@plebbit/plebbit-js/dist/node/plebbit").Plebbit;
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
        plebbitOptions: any;
        plebbit: import("@plebbit/plebbit-js/dist/node/plebbit").Plebbit;
        subscriptions: never[];
        blockedAddresses: {};
        subplebbits: {
            [subplebbitAddress: string]: AccountSubplebbit;
        };
    }>;
    getDefaultPlebbitOptions: () => any;
};
export default accountGenerator;
