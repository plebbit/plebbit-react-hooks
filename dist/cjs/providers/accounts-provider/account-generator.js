"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDefaultAccount = void 0;
const plebbit_js_1 = __importDefault(require("../../lib/plebbit-js"));
const validator_1 = __importDefault(require("../../lib/validator"));
const uuid_1 = require("uuid");
const accounts_database_1 = __importDefault(require("./accounts-database"));
const generateDefaultAccount = async () => {
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
    const accountName = await getNextAvailableDefaultAccountName();
    const account = {
        id: (0, uuid_1.v4)(),
        name: accountName,
        author,
        signer,
        plebbit: plebbit_js_1.default.Plebbit(plebbitOptions),
        plebbitOptions,
        subscriptions: [],
        blockedAddresses: {},
    };
    return account;
};
exports.generateDefaultAccount = generateDefaultAccount;
const getNextAvailableDefaultAccountName = async () => {
    const accountIds = await accounts_database_1.default.accountsMetadataDatabase.getItem('accountIds');
    const accountNames = [];
    if (accountIds) {
        const accounts = await accounts_database_1.default.getAccounts(accountIds);
        for (const accountId of accountIds) {
            accountNames.push(accounts[accountId].name);
        }
    }
    let accountNumber = 1;
    if (!(accountNames === null || accountNames === void 0 ? void 0 : accountNames.length)) {
        return `Account ${accountNumber}`;
    }
    validator_1.default.validateAccountsProviderAccountNames(accountNames);
    const accountNamesSet = new Set(accountNames);
    while (true) {
        const accountName = `Account ${accountNumber}`;
        if (!accountNamesSet.has(accountName)) {
            return accountName;
        }
        accountNumber++;
    }
};
const accountGenerator = {
    generateDefaultAccount: exports.generateDefaultAccount,
};
exports.default = accountGenerator;
