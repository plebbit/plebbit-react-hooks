export declare const generateDefaultAccount: () => Promise<{
    id: string;
    name: string;
    author: {
        displayName: null;
        address: string;
    };
    signer: {};
    plebbit: void;
    plebbitOptions: {
        ipfsGatewayUrl: string;
        ipfsApiUrl: string;
    };
    subscriptions: never[];
    blockedAddresses: {};
}>;
declare const accountGenerator: {
    generateDefaultAccount: () => Promise<{
        id: string;
        name: string;
        author: {
            displayName: null;
            address: string;
        };
        signer: {};
        plebbit: void;
        plebbitOptions: {
            ipfsGatewayUrl: string;
            ipfsApiUrl: string;
        };
        subscriptions: never[];
        blockedAddresses: {};
    }>;
};
export default accountGenerator;
