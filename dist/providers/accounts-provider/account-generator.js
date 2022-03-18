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
export const generateDefaultAccount = () => __awaiter(void 0, void 0, void 0, function* () {
    // TODO: a default account will probably not be exactly like this
    const signer = {}; // TODO: generate new signer
    const author = {
        displayName: null,
        address: 'Qm...', // TODO: get address of signer
    };
    const plebbitOptions = {
        ipfsGatewayUrl: 'https://cloudflare-ipfs',
        ipfsApiUrl: 'http://localhost:8080',
    };
    const accountName = yield getNextAvailableDefaultAccountName();
    const account = {
        id: uuid(),
        name: accountName,
        author,
        signer,
        plebbit: PlebbitJs.Plebbit(plebbitOptions),
        plebbitOptions,
        subscriptions: [],
        blockedAddresses: {},
    };
    return account;
});
const getNextAvailableDefaultAccountName = () => __awaiter(void 0, void 0, void 0, function* () {
    const accountIds = yield accountsDatabase.accountsMetadataDatabase.getItem('accountIds');
    const accountNames = [];
    if (accountIds) {
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
};
export default accountGenerator;
