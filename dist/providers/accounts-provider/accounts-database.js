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
import assert from 'assert';
import localForage from 'localforage';
import localForageLru from '../../lib/localforage-lru';
const accountsDatabase = localForage.createInstance({ name: 'accounts' });
const accountsMetadataDatabase = localForage.createInstance({ name: 'accountsMetadata' });
import utils from '../../lib/utils';
const getAccounts = (accountIds) => __awaiter(void 0, void 0, void 0, function* () {
    validator.validateAccountsDatabaseGetAccountsArguments(accountIds);
    const accounts = {};
    const promises = [];
    for (const accountId of accountIds) {
        promises.push(accountsDatabase.getItem(accountId));
    }
    const accountsArray = yield Promise.all(promises);
    for (const [i, accountId] of accountIds.entries()) {
        assert(accountsArray[i], `accountId '${accountId}' not found in database`);
        accounts[accountId] = accountsArray[i];
        accounts[accountId].plebbit = yield PlebbitJs.Plebbit(accounts[accountId].plebbitOptions);
    }
    return accounts;
});
const getAccount = (accountId) => __awaiter(void 0, void 0, void 0, function* () {
    const accounts = yield getAccounts([accountId]);
    return accounts[accountId];
});
const addAccount = (account) => __awaiter(void 0, void 0, void 0, function* () {
    validator.validateAccountsDatabaseAddAccountArguments(account);
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
    assert(accountId && typeof accountId === 'string', `getAccountCommentsDatabase '${accountId}' not a string`);
    if (!accountsCommentsDatabases[accountId]) {
        accountsCommentsDatabases[accountId] = localForage.createInstance({ name: `accountComments-${accountId}` });
    }
    return accountsCommentsDatabases[accountId];
};
const addAccountComment = (accountId, comment, accountCommentIndex) => __awaiter(void 0, void 0, void 0, function* () {
    const accountCommentsDatabase = getAccountCommentsDatabase(accountId);
    const length = (yield accountCommentsDatabase.getItem('length')) || 0;
    comment = utils.clone(Object.assign(Object.assign({}, comment), { signer: undefined }));
    if (typeof accountCommentIndex === 'number') {
        assert(accountCommentIndex < length, `addAccountComment cannot edit comment no comment in database at accountCommentIndex '${accountCommentIndex}'`);
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
    assert(accountId && typeof accountId === 'string', `getAccountVotesDatabase '${accountId}' not a string`);
    if (!accountsVotesDatabases[accountId]) {
        accountsVotesDatabases[accountId] = localForage.createInstance({ name: `accountVotes-${accountId}` });
    }
    return accountsVotesDatabases[accountId];
};
const addAccountVote = (accountId, createVoteOptions) => __awaiter(void 0, void 0, void 0, function* () {
    assert((createVoteOptions === null || createVoteOptions === void 0 ? void 0 : createVoteOptions.commentCid) && typeof (createVoteOptions === null || createVoteOptions === void 0 ? void 0 : createVoteOptions.commentCid) === 'string', `addAccountVote createVoteOptions.commentCid '${createVoteOptions === null || createVoteOptions === void 0 ? void 0 : createVoteOptions.commentCid}' not a string`);
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
        votes[vote === null || vote === void 0 ? void 0 : vote.commentCid] = vote;
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
const accountsCommentsRepliesDatabases = {};
const getAccountCommentsRepliesDatabase = (accountId) => {
    assert(accountId && typeof accountId === 'string', `getAccountCommentsRepliesDatabase '${accountId}' not a string`);
    if (!accountsCommentsRepliesDatabases[accountId]) {
        accountsCommentsRepliesDatabases[accountId] = localForageLru.createInstance({
            name: `accountCommentsReplies-${accountId}`,
            size: 1000,
        });
    }
    return accountsCommentsRepliesDatabases[accountId];
};
const addAccountCommentReply = (accountId, reply) => __awaiter(void 0, void 0, void 0, function* () {
    const accountCommentsRepliesDatabase = getAccountCommentsRepliesDatabase(accountId);
    yield accountCommentsRepliesDatabase.setItem(reply.cid, utils.clone(reply));
});
const getAccountCommentsReplies = (accountId) => __awaiter(void 0, void 0, void 0, function* () {
    const accountCommentsRepliesDatabase = getAccountCommentsRepliesDatabase(accountId);
    const replyCids = yield accountCommentsRepliesDatabase.keys();
    const promises = [];
    for (const replyCid of replyCids) {
        promises.push(accountCommentsRepliesDatabase.getItem(replyCid));
    }
    const replyArray = yield Promise.all(promises);
    const replies = {};
    for (const reply of replyArray) {
        // @ts-ignore
        replies[reply.cid] = reply;
    }
    return replies;
});
const getAccountsCommentsReplies = (accountIds) => __awaiter(void 0, void 0, void 0, function* () {
    const promises = [];
    for (const accountId of accountIds) {
        promises.push(getAccountCommentsReplies(accountId));
    }
    const accountsCommentsRepliesArray = yield Promise.all(promises);
    const accountsCommentsReplies = {};
    for (const [i, accountId] of accountIds.entries()) {
        accountsCommentsReplies[accountId] = accountsCommentsRepliesArray[i];
    }
    return accountsCommentsReplies;
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
    getAccount,
    addAccountCommentReply,
    getAccountCommentsReplies,
    getAccountsCommentsReplies,
};
export default database;
