export declare const generateDefaultAccount: () => Promise<{
    id: string;
    name: string;
    author: {
        displayName: null;
        address: any;
    };
    signer: any;
    plebbit: any;
    plebbitOptions: {
        ipfsGatewayUrl: string;
        ipfsHttpClientOptions: undefined;
        pubsubHttpClientOptions: string;
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
            address: any;
        };
        signer: any;
        plebbit: any;
        plebbitOptions: {
            ipfsGatewayUrl: string;
            ipfsHttpClientOptions: undefined;
            pubsubHttpClientOptions: string;
        };
        subscriptions: never[];
        blockedAddresses: {};
    }>;
};
export default accountGenerator;
