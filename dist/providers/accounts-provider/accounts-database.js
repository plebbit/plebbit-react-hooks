"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const plebbit_js_1 = __importDefault(require("../../lib/plebbit-js"));
const validator_1 = __importDefault(require("../../lib/validator"));
const assert_1 = __importDefault(require("assert"));
const localforage_1 = __importDefault(require("localforage"));
const localforage_lru_1 = __importDefault(require("../../lib/localforage-lru"));
const accountsDatabase = localforage_1.default.createInstance({ name: 'accounts' });
const accountsMetadataDatabase = localforage_1.default.createInstance({ name: 'accountsMetadata' });
const utils_1 = __importDefault(require("../../lib/utils"));
const getAccounts = async (accountIds) => {
    validator_1.default.validateAccountsDatabaseGetAccountsArguments(accountIds);
    const accounts = {};
    const promises = [];
    for (const accountId of accountIds) {
        promises.push(accountsDatabase.getItem(accountId));
    }
    const accountsArray = await Promise.all(promises);
    for (const [i, accountId] of accountIds.entries()) {
        (0, assert_1.default)(accountsArray[i], `accountId '${accountId}' not found in database`);
        accounts[accountId] = accountsArray[i];
        accounts[accountId].plebbit = plebbit_js_1.default.Plebbit(accounts[accountId].plebbitOptions);
    }
    return accounts;
};
const getAccount = async (accountId) => {
    const accounts = await getAccounts([accountId]);
    return accounts[accountId];
};
const addAccount = async (account) => {
    validator_1.default.validateAccountsDatabaseAddAccountArguments(account);
    let accountIds = await accountsMetadataDatabase.getItem('accountIds');
    // handle no duplicate names
    if (accountIds) {
        const accounts = await getAccounts(accountIds);
        for (const accountId of accountIds) {
            if (accountId !== account.id && accounts[accountId].name === account.name) {
                throw Error(`account name '${account.name}' already exists in database`);
            }
        }
    }
    // handle updating accounts database
    const accountToPutInDatabase = Object.assign(Object.assign({}, account), { plebbit: undefined });
    await accountsDatabase.setItem(accountToPutInDatabase.id, accountToPutInDatabase);
    // handle updating accountNamesToAccountIds database
    let accountNamesToAccountIds = await accountsMetadataDatabase.getItem('accountNamesToAccountIds');
    if (!accountNamesToAccountIds) {
        accountNamesToAccountIds = {};
    }
    accountNamesToAccountIds[account.name] = account.id;
    await accountsMetadataDatabase.setItem('accountNamesToAccountIds', accountNamesToAccountIds);
    // handle updating accountIds database
    if (!accountIds) {
        accountIds = [account.id];
    }
    if (!accountIds.includes(account.id)) {
        accountIds.push(account.id);
    }
    await accountsMetadataDatabase.setItem('accountIds', accountIds);
    // handle updating activeAccountId database
    if (accountIds.length === 1) {
        await accountsMetadataDatabase.setItem('activeAccountId', account.id);
    }
};
const accountsCommentsDatabases = {};
const getAccountCommentsDatabase = (accountId) => {
    (0, assert_1.default)(accountId && typeof accountId === 'string', `getAccountCommentsDatabase '${accountId}' not a string`);
    if (!accountsCommentsDatabases[accountId]) {
        accountsCommentsDatabases[accountId] = localforage_1.default.createInstance({ name: `accountComments-${accountId}` });
    }
    return accountsCommentsDatabases[accountId];
};
const addAccountComment = async (accountId, comment, accountCommentIndex) => {
    const accountCommentsDatabase = getAccountCommentsDatabase(accountId);
    const length = (await accountCommentsDatabase.getItem('length')) || 0;
    comment = utils_1.default.clone(Object.assign(Object.assign({}, comment), { signer: undefined }));
    if (typeof accountCommentIndex === 'number') {
        (0, assert_1.default)(accountCommentIndex < length, `addAccountComment cannot edit comment no comment in database at accountCommentIndex '${accountCommentIndex}'`);
        await accountCommentsDatabase.setItem(String(accountCommentIndex), comment);
    }
    else {
        await Promise.all([
            accountCommentsDatabase.setItem(String(length), comment),
            accountCommentsDatabase.setItem('length', length + 1),
        ]);
    }
};
const getAccountComments = async (accountId) => {
    const accountCommentsDatabase = getAccountCommentsDatabase(accountId);
    const length = (await accountCommentsDatabase.getItem('length')) || 0;
    if (length === 0) {
        return [];
    }
    let promises = [];
    let i = 0;
    while (i < length) {
        promises.push(accountCommentsDatabase.getItem(String(i++)));
    }
    const comments = await Promise.all(promises);
    // add index and account id to account comments for easier updating
    for (const i in comments) {
        comments[i].index = Number(i);
        comments[i].accountId = accountId;
    }
    return comments;
};
const getAccountsComments = async (accountIds) => {
    const promises = [];
    for (const accountId of accountIds) {
        promises.push(getAccountComments(accountId));
    }
    const accountsCommentsArray = await Promise.all(promises);
    const accountsComments = {};
    for (const [i, accountId] of accountIds.entries()) {
        accountsComments[accountId] = accountsCommentsArray[i];
    }
    return accountsComments;
};
const accountsVotesDatabases = {};
const getAccountVotesDatabase = (accountId) => {
    (0, assert_1.default)(accountId && typeof accountId === 'string', `getAccountVotesDatabase '${accountId}' not a string`);
    if (!accountsVotesDatabases[accountId]) {
        accountsVotesDatabases[accountId] = localforage_1.default.createInstance({ name: `accountVotes-${accountId}` });
    }
    return accountsVotesDatabases[accountId];
};
const addAccountVote = async (accountId, createVoteOptions) => {
    (0, assert_1.default)(createVoteOptions.commentCid && typeof createVoteOptions.commentCid === 'string', `addAccountVote '${createVoteOptions.commentCid}' not a string`);
    const accountVotesDatabase = getAccountVotesDatabase(accountId);
    const length = (await accountVotesDatabase.getItem('length')) || 0;
    const vote = Object.assign(Object.assign({}, createVoteOptions), { signer: undefined, author: undefined });
    await Promise.all([
        accountVotesDatabase.setItem(vote.commentCid, vote),
        accountVotesDatabase.setItem(String(length), vote),
        accountVotesDatabase.setItem('length', length + 1),
    ]);
};
const getAccountVotes = async (accountId) => {
    const accountVotesDatabase = getAccountVotesDatabase(accountId);
    const length = (await accountVotesDatabase.getItem('length')) || 0;
    const votes = {};
    if (length === 0) {
        return votes;
    }
    let promises = [];
    let i = 0;
    while (i < length) {
        promises.push(accountVotesDatabase.getItem(String(i++)));
    }
    const votesArray = await Promise.all(promises);
    for (const vote of votesArray) {
        votes[vote.commentCid] = vote;
    }
    return votes;
};
const getAccountsVotes = async (accountIds) => {
    const promises = [];
    for (const accountId of accountIds) {
        promises.push(getAccountVotes(accountId));
    }
    const accountsVotesArray = await Promise.all(promises);
    const accountsVotes = {};
    for (const [i, accountId] of accountIds.entries()) {
        accountsVotes[accountId] = accountsVotesArray[i];
    }
    return accountsVotes;
};
const accountsCommentsRepliesDatabases = {};
const getAccountCommentsRepliesDatabase = (accountId) => {
    (0, assert_1.default)(accountId && typeof accountId === 'string', `getAccountCommentsRepliesDatabase '${accountId}' not a string`);
    if (!accountsCommentsRepliesDatabases[accountId]) {
        accountsCommentsRepliesDatabases[accountId] = localforage_lru_1.default.createInstance({ name: `accountCommentsReplies-${accountId}`, size: 1000 });
    }
    return accountsCommentsRepliesDatabases[accountId];
};
const addAccountCommentReply = async (accountId, reply) => {
    const accountCommentsRepliesDatabase = getAccountCommentsRepliesDatabase(accountId);
    await accountCommentsRepliesDatabase.setItem(reply.cid, utils_1.default.clone(reply));
};
const getAccountCommentsReplies = async (accountId) => {
    const accountCommentsRepliesDatabase = getAccountCommentsRepliesDatabase(accountId);
    const replyCids = await accountCommentsRepliesDatabase.keys();
    const promises = [];
    for (const replyCid of replyCids) {
        promises.push(accountCommentsRepliesDatabase.getItem(replyCid));
    }
    const replyArray = await Promise.all(promises);
    const replies = {};
    for (const reply of replyArray) {
        // @ts-ignore
        replies[reply.cid] = reply;
    }
    return replies;
};
const getAccountsCommentsReplies = async (accountIds) => {
    const promises = [];
    for (const accountId of accountIds) {
        promises.push(getAccountCommentsReplies(accountId));
    }
    const accountsCommentsRepliesArray = await Promise.all(promises);
    const accountsCommentsReplies = {};
    for (const [i, accountId] of accountIds.entries()) {
        accountsCommentsReplies[accountId] = accountsCommentsRepliesArray[i];
    }
    return accountsCommentsReplies;
};
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
    getAccount,
    addAccountCommentReply,
    getAccountCommentsReplies,
    getAccountsCommentsReplies
};
exports.default = database;
