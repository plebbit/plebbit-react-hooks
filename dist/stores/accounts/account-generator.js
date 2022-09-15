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
import { v4 as uuid } from 'uuid';
import accountsDatabase from './accounts-database';
// default blockchain providers
const blockchainProviders = {
    eth: {
        // default should not use a url, but rather ethers' default provider
        url: 'ethers.getDefaultProvider()',
        chainId: 1,
    },
    avax: {
        url: 'https://api.avax.network/ext/bc/C/rpc',
        chainId: 43114,
    },
    matic: {
        url: 'https://polygon-rpc.com',
        chainId: 137,
    },
};
// default options aren't saved to database so they can be changed
export const getDefaultPlebbitOptions = () => {
    // default plebbit options defined by the electron process
    // @ts-ignore
    if (window.defaultPlebbitOptions) {
        // add missing blockchain providers
        // mutate the window.defaultPlebbitOptions on purpose instead of replacing it or it breaks the tests
        // @ts-ignore
        if (!window.defaultPlebbitOptions.blockchainProviders) {
            // @ts-ignore
            window.defaultPlebbitOptions.blockchainProviders = {};
        }
        for (const chainTicker in blockchainProviders) {
            // @ts-ignore
            if (!window.defaultPlebbitOptions.blockchainProviders[chainTicker]) {
                // @ts-ignore
                window.defaultPlebbitOptions.blockchainProviders[chainTicker] = blockchainProviders[chainTicker];
            }
        }
        // @ts-ignore
        return window.defaultPlebbitOptions;
    }
    // default plebbit options for web client
    return {
        ipfsGatewayUrl: 'https://cloudflare-ipfs.com',
        ipfsHttpClientOptions: undefined,
        pubsubHttpClientOptions: 'https://pubsubprovider.xyz/api/v0',
        blockchainProviders,
    };
};
export const generateDefaultAccount = () => __awaiter(void 0, void 0, void 0, function* () {
    const plebbitOptions = getDefaultPlebbitOptions();
    const plebbit = yield PlebbitJs.Plebbit(plebbitOptions);
    const signer = yield plebbit.createSigner();
    const author = {
        address: signer.address,
    };
    const accountName = yield getNextAvailableDefaultAccountName();
    // subplebbits where the account has a role, like moderator, admin, owner, etc.
    const subplebbits = {};
    const account = {
        id: uuid(),
        name: accountName,
        author,
        signer,
        plebbitOptions,
        plebbit: plebbit,
        subscriptions: [],
        blockedAddresses: {},
        subplebbits,
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
    validator.validateAccountsProviderAccountNames(accountNames);
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
