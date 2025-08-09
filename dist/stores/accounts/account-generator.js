var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import PlebbitJs from '../../lib/plebbit-js';
import validator from '../../lib/validator';
import chain from '../../lib/chain';
// Use built-in crypto.randomUUID when available to avoid uuid package interop in test runners
const uuid = () => {
    // Browser or Node >= 16.7
    // @ts-ignore
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        // @ts-ignore
        return crypto.randomUUID();
    }
    // Fallback RFC4122 v4 generator
    // eslint-disable-next-line no-bitwise
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        // eslint-disable-next-line no-bitwise
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};
import accountsDatabase from './accounts-database';
import Logger from '@plebbit/plebbit-logger';
const log = Logger('plebbit-react-hooks:accounts:stores');
// default chain providers
const chainProviders = {
    eth: {
        // default should not use a url, but rather ethers' default provider
        urls: ['https://ethrpc.xyz', 'viem', 'ethers.js'],
        chainId: 1,
    },
    avax: {
        urls: ['https://api.avax.network/ext/bc/C/rpc'],
        chainId: 43114,
    },
    matic: {
        urls: ['https://polygon-rpc.com'],
        chainId: 137,
    },
    sol: {
        urls: ['https://solrpc.xyz'],
        chainId: 1,
    },
};
// force using these options or can cause bugs
export const overwritePlebbitOptions = {
    resolveAuthorAddresses: false,
    validatePages: false,
};
// default options aren't saved to database so they can be changed
export const getDefaultPlebbitOptions = () => {
    // default plebbit options defined by the electron process
    // @ts-ignore
    if (window.defaultPlebbitOptions) {
        // @ts-ignore
        const defaultPlebbitOptions = JSON.parse(JSON.stringify(Object.assign(Object.assign({}, window.defaultPlebbitOptions), { libp2pJsClientsOptions: undefined })));
        // @ts-ignore
        defaultPlebbitOptions.libp2pJsClientsOptions = window.defaultPlebbitOptions.libp2pJsClientsOptions; // libp2pJsClientsOptions is not always just json
        // add missing chain providers
        if (!defaultPlebbitOptions.chainProviders) {
            defaultPlebbitOptions.chainProviders = {};
        }
        // add default chain providers if missing
        for (const chainTicker in chainProviders) {
            if (!defaultPlebbitOptions.chainProviders[chainTicker]) {
                defaultPlebbitOptions.chainProviders[chainTicker] = chainProviders[chainTicker];
            }
        }
        return defaultPlebbitOptions;
    }
    // default plebbit options for web client
    return Object.assign({ ipfsGatewayUrls: ['https://ipfsgateway.xyz', 'https://gateway.plebpubsub.xyz', 'https://gateway.forumindex.com'], kuboRpcClientsOptions: undefined, pubsubKuboRpcClientsOptions: ['https://pubsubprovider.xyz/api/v0', 'https://plebpubsub.xyz/api/v0', 'https://rannithepleb.com/api/v0'], httpRoutersOptions: ['https://routing.lol', 'https://peers.pleb.bot', 'https://peers.plebpubsub.xyz', 'https://peers.forumindex.com'], chainProviders }, overwritePlebbitOptions);
};
// the gateway to use in <img src> for nft avatars
// @ts-ignore
export const defaultMediaIpfsGatewayUrl = window.defaultMediaIpfsGatewayUrl || 'https://ipfs.io';
export const generateDefaultAccount = () => __awaiter(void 0, void 0, void 0, function* () {
    const plebbitOptions = getDefaultPlebbitOptions();
    const plebbit = yield PlebbitJs.Plebbit(plebbitOptions);
    // handle errors or error events are uncaught
    // no need to log them because plebbit-js already logs them
    plebbit.on('error', (error) => log.error('uncaught plebbit instance error, should never happen', { error }));
    const signer = yield plebbit.createSigner();
    const author = {
        address: signer.address,
        wallets: {
            eth: yield chain.getEthWalletFromPlebbitPrivateKey(signer.privateKey, signer.address),
            sol: yield chain.getSolWalletFromPlebbitPrivateKey(signer.privateKey, signer.address),
        },
    };
    const accountName = yield getNextAvailableDefaultAccountName();
    // subplebbits where the account has a role, like moderator, admin, owner, etc.
    const subplebbits = {};
    const account = {
        id: uuid(),
        version: accountsDatabase.accountVersion,
        name: accountName,
        author,
        signer,
        plebbitOptions,
        plebbit: plebbit,
        subscriptions: [],
        blockedAddresses: {},
        blockedCids: {},
        subplebbits,
        mediaIpfsGatewayUrl: defaultMediaIpfsGatewayUrl,
    };
    return account;
});
const getNextAvailableDefaultAccountName = () => __awaiter(void 0, void 0, void 0, function* () {
    const accountIds = yield accountsDatabase.accountsMetadataDatabase.getItem('accountIds');
    const accountNames = [];
    if (accountIds === null || accountIds === void 0 ? void 0 : accountIds.length) {
        const accounts = yield accountsDatabase.getAccounts(accountIds);
        for (const accountId of accountIds) {
            accountNames.push(accounts[accountId].name);
        }
    }
    let accountNumber = 1;
    if (!(accountNames === null || accountNames === void 0 ? void 0 : accountNames.length)) {
        return `Account ${accountNumber}`;
    }
    validator.validateAccountsDatabaseAccountNames(accountNames);
    const accountNamesSet = new Set(accountNames);
    while (true) {
        const accountName = `Account ${accountNumber}`;
        if (!accountNamesSet.has(accountName)) {
            return accountName;
        }
        accountNumber++;
    }
});
const accountGenerator = {
    generateDefaultAccount,
    getDefaultPlebbitOptions,
};
export default accountGenerator;
