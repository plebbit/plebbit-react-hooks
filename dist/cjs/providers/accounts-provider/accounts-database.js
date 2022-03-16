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
const plebbit_js_1 = __importDefault(require("../../lib/plebbit-js"));
const validator_1 = __importDefault(require("../../lib/validator"));
const assert_1 = __importDefault(require("assert"));
const localforage_1 = __importDefault(require("localforage"));
const accountsDatabase = localforage_1.default.createInstance({ name: 'accounts' });
const accountsMetadataDatabase = localforage_1.default.createInstance({ name: 'accountsMetadata' });
const utils_1 = __importDefault(require("../../lib/utils"));
const getAccounts = (accountIds) => __awaiter(void 0, void 0, void 0, function* () {
    validator_1.default.validateAccountsDatabaseGetAccountsArguments(accountIds);
    const accounts = {};
    const promises = [];
    for (const accountId of accountIds) {
        promises.push(accountsDatabase.getItem(accountId));
    }
    const accountsArray = yield Promise.all(promises);
    for (const [i, accountId] of accountIds.entries()) {
        (0, assert_1.default)(accountsArray[i], `accountId '${accountId}' not found in database`);
        accounts[accountId] = accountsArray[i];
        accounts[accountId].plebbit = plebbit_js_1.default.Plebbit(accounts[accountId].plebbitOptions);
    }
    return accounts;
});
const getAccount = (accountId) => __awaiter(void 0, void 0, void 0, function* () {
    const accounts = yield getAccounts([accountId]);
    return accounts[accountId];
});
const addAccount = (account) => __awaiter(void 0, void 0, void 0, function* () {
    validator_1.default.validateAccountsDatabaseAddAccountArguments(account);
    let accountIds = yield accountsMetadataDatabase.getItem('accountIds');
    // handle no duplicate names
    if (accountIds) {
        const accounts = yield getAccounts(accountIds);
        for (const accountId of accountIds) {
            if (accountId !== account.id && accounts[accountId].name === account.name) {
                throw Error(`account name '${account.name}' already exists in database`);
            }
        }
    }
    // handle updating accounts database
    const accountToPutInDatabase = Object.assign(Object.assign({}, account), { plebbit: undefined });
    yield accountsDatabase.setItem(accountToPutInDatabase.id, accountToPutInDatabase);
    // handle updating accountNamesToAccountIds database
    let accountNamesToAccountIds = yield accountsMetadataDatabase.getItem('accountNamesToAccountIds');
    if (!accountNamesToAccountIds) {
        accountNamesToAccountIds = {};
    }
    accountNamesToAccountIds[account.name] = account.id;
    yield accountsMetadataDatabase.setItem('accountNamesToAccountIds', accountNamesToAccountIds);
    // handle updating accountIds database
    if (!accountIds) {
        accountIds = [account.id];
    }
    if (!accountIds.includes(account.id)) {
        accountIds.push(account.id);
    }
    yield accountsMetadataDatabase.setItem('accountIds', accountIds);
    // handle updating activeAccountId database
    if (accountIds.length === 1) {
        yield accountsMetadataDatabase.setItem('activeAccountId', account.id);
    }
});
const accountsCommentsDatabases = {};
const getAccountCommentsDatabase = (accountId) => {
    (0, assert_1.default)(accountId && typeof accountId === 'string', `getAccountCommentsDatabase '${accountId}' not a string`);
    if (!accountsCommentsDatabases[accountId]) {
        accountsCommentsDatabases[accountId] = localforage_1.default.createInstance({ name: `accountComments-${accountId}` });
    }
    return accountsCommentsDatabases[accountId];
};
const addAccountComment = (accountId, comment, accountCommentIndex) => __awaiter(void 0, void 0, void 0, function* () {
    const accountCommentsDatabase = getAccountCommentsDatabase(accountId);
    const length = (yield accountCommentsDatabase.getItem('length')) || 0;
    comment = utils_1.default.clone(Object.assign(Object.assign({}, comment), { signer: undefined }));
    if (typeof accountCommentIndex === 'number') {
        (0, assert_1.default)(accountCommentIndex < length, `addAccountComment cannot edit comment no comment in database at accountCommentIndex '${accountCommentIndex}'`);
        yield accountCommentsDatabase.setItem(String(accountCommentIndex), comment);
    }
    else {
        yield Promise.all([
            accountCommentsDatabase.setItem(String(length), comment),
            accountCommentsDatabase.setItem('length', length + 1),
        ]);
    }
});
const getAccountComments = (accountId) => __awaiter(void 0, void 0, void 0, function* () {
    const accountCommentsDatabase = getAccountCommentsDatabase(accountId);
    const length = (yield accountCommentsDatabase.getItem('length')) || 0;
    if (length === 0) {
        return [];
    }
    let promises = [];
    let i = 0;
    while (i < length) {
        promises.push(accountCommentsDatabase.getItem(String(i++)));
    }
    const comments = yield Promise.all(promises);
    // add index and account id to account comments for easier updating
    for (const i in comments) {
        comments[i].index = Number(i);
        comments[i].accountId = accountId;
    }
    return comments;
});
const getAccountsComments = (accountIds) => __awaiter(void 0, void 0, void 0, function* () {
    const promises = [];
    for (const accountId of accountIds) {
        promises.push(getAccountComments(accountId));
    }
    const accountsCommentsArray = yield Promise.all(promises);
    const accountsComments = {};
    for (const [i, accountId] of accountIds.entries()) {
        accountsComments[accountId] = accountsCommentsArray[i];
    }
    return accountsComments;
});
const accountsVotesDatabases = {};
const getAccountVotesDatabase = (accountId) => {
    (0, assert_1.default)(accountId && typeof accountId === 'string', `getAccountVotesDatabase '${accountId}' not a string`);
    if (!accountsVotesDatabases[accountId]) {
        accountsVotesDatabases[accountId] = localforage_1.default.createInstance({ name: `accountVotes-${accountId}` });
    }
    return accountsVotesDatabases[accountId];
};
const addAccountVote = (accountId, createVoteOptions) => __awaiter(void 0, void 0, void 0, function* () {
    (0, assert_1.default)(createVoteOptions.commentCid && typeof createVoteOptions.commentCid === 'string', `addAccountVote '${createVoteOptions.commentCid}' not a string`);
    const accountVotesDatabase = getAccountVotesDatabase(accountId);
    const length = (yield accountVotesDatabase.getItem('length')) || 0;
    const vote = Object.assign(Object.assign({}, createVoteOptions), { signer: undefined, author: undefined });
    yield Promise.all([
        accountVotesDatabase.setItem(vote.commentCid, vote),
        accountVotesDatabase.setItem(String(length), vote),
        accountVotesDatabase.setItem('length', length + 1),
    ]);
});
const getAccountVotes = (accountId) => __awaiter(void 0, void 0, void 0, function* () {
    const accountVotesDatabase = getAccountVotesDatabase(accountId);
    const length = (yield accountVotesDatabase.getItem('length')) || 0;
    const votes = {};
    if (length === 0) {
        return votes;
    }
    let promises = [];
    let i = 0;
    while (i < length) {
        promises.push(accountVotesDatabase.getItem(String(i++)));
    }
    const votesArray = yield Promise.all(promises);
    for (const vote of votesArray) {
        votes[vote.commentCid] = vote;
    }
    return votes;
});
const getAccountsVotes = (accountIds) => __awaiter(void 0, void 0, void 0, function* () {
    const promises = [];
    for (const accountId of accountIds) {
        promises.push(getAccountVotes(accountId));
    }
    const accountsVotesArray = yield Promise.all(promises);
    const accountsVotes = {};
    for (const [i, accountId] of accountIds.entries()) {
        accountsVotes[accountId] = accountsVotesArray[i];
    }
    return accountsVotes;
});
const database = {
    accountsDatabase,
    accountsMetadataDatabase,
    getAccountsVotes,
    getAccountVotes,
    addAccountVote,
    getAccountsComments,
    getAccountComments,
    addAccountComment,
    addAccount,
    getAccounts,
    getAccount
};
exports.default = database;
