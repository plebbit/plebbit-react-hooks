"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDefaultAccount = void 0;
const plebbit_js_1 = __importDefault(require("../../lib/plebbit-js"));
const validator_1 = __importDefault(require("../../lib/validator"));
const uuid_1 = require("uuid");
const accounts_database_1 = __importDefault(require("./accounts-database"));
const generateDefaultAccount = () => __awaiter(void 0, void 0, void 0, function* () {
    const plebbitOptions = {
        ipfsGatewayUrl: 'https://cloudflare-ipfs.com',
        ipfsHttpClientOptions: undefined,
        pubsubHttpClientOptions: 'https://pubsubprovider.xyz/api/v0'
    };
    const plebbit = yield plebbit_js_1.default.Plebbit(plebbitOptions);
    const signer = yield plebbit.createSigner();
    const author = {
        displayName: null,
        address: signer.address,
    };
    const accountName = yield getNextAvailableDefaultAccountName();
    const account = {
        id: (0, uuid_1.v4)(),
        name: accountName,
        author,
        signer,
        plebbit: plebbit,
        plebbitOptions,
        subscriptions: [],
        blockedAddresses: {},
    };
    return account;
});
exports.generateDefaultAccount = generateDefaultAccount;
const getNextAvailableDefaultAccountName = () => __awaiter(void 0, void 0, void 0, function* () {
    const accountIds = yield accounts_database_1.default.accountsMetadataDatabase.getItem('accountIds');
    const accountNames = [];
    if (accountIds) {
        const accounts = yield accounts_database_1.default.getAccounts(accountIds);
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
});
const accountGenerator = {
    generateDefaultAccount: exports.generateDefaultAccount,
};
exports.default = accountGenerator;
