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
import Logger from '@plebbit/plebbit-logger';
const log = Logger('plebbit-react-hooks:accounts:stores');
// default chain providers
const chainProviders = {
    eth: {
        // default should not use a url, but rather ethers' default provider
        urls: ['ethers.js', 'https://ethrpc.xyz', 'viem'],
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
};
// default options aren't saved to database so they can be changed
export const getDefaultPlebbitOptions = () => {
    // default plebbit options defined by the electron process
    // @ts-ignore
    if (window.defaultPlebbitOptions) {
        // add missing chain providers
        // @ts-ignore
        const defaultPlebbitOptions = JSON.parse(JSON.stringify(window.defaultPlebbitOptions));
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
    return {
        ipfsGatewayUrls: ['https://ipfs.io', 'https://ipfsgateway.xyz', 'https://cloudflare-ipfs.com', 'https://plebpubsub.live'],
        ipfsHttpClientsOptions: undefined,
        pubsubHttpClientsOptions: ['https://pubsubprovider.xyz/api/v0', 'https://plebpubsub.live/api/v0', 'https://rannithepleb.com/api/v0'],
        chainProviders,
        resolveAuthorAddresses: false,
    };
};
export const generateDefaultAccount = () => __awaiter(void 0, void 0, void 0, function* () {
    const plebbitOptions = getDefaultPlebbitOptions();
    const plebbit = yield PlebbitJs.Plebbit(plebbitOptions);
    // handle errors or error events are uncaught
    // no need to log them because plebbit-js already logs them
    plebbit.on('error', (error) => log.error('uncaught plebbit instance error, should never happen', { error }));
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
        blockedCids: {},
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
