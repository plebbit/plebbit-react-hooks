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
import assert from 'assert';
import localForage from 'localforage';
import localForageLru from '../../lib/localforage-lru';
import utils from '../../lib/utils';
import { getDefaultPlebbitOptions, overwritePlebbitOptions } from './account-generator';
import Logger from '@plebbit/plebbit-logger';
const log = Logger('plebbit-react-hooks:accounts:stores');
const accountsDatabase = localForage.createInstance({ name: 'plebbitReactHooks-accounts' });
const accountsMetadataDatabase = localForage.createInstance({ name: 'plebbitReactHooks-accountsMetadata' });
// TODO: remove this eventually after everyone has migrated
// migrate to name with safe prefix
const migrate = () => __awaiter(void 0, void 0, void 0, function* () {
    const previousAccountsDatabase = localForage.createInstance({ name: 'accounts' });
    const previousAccountsMetadataDatabase = localForage.createInstance({ name: 'accountsMetadata' });
    // no previous db to migrate
    if (!(yield previousAccountsMetadataDatabase.getItem('activeAccountId'))) {
        return;
    }
    // db already migrated
    if (yield accountsMetadataDatabase.getItem('activeAccountId')) {
        return;
    }
    // migrate
    const promises = [];
    for (const key of yield previousAccountsDatabase.keys()) {
        promises.push(previousAccountsDatabase.getItem(key).then((value) => accountsDatabase.setItem(key, value)));
    }
    for (const key of yield previousAccountsMetadataDatabase.keys()) {
        promises.push(previousAccountsMetadataDatabase.getItem(key).then((value) => accountsMetadataDatabase.setItem(key, value)));
    }
    const accountIds = yield previousAccountsMetadataDatabase.getItem('accountIds');
    if (Array.isArray(accountIds)) {
        const databaseNames = ['accountComments', 'accountVotes', 'accountCommentsReplies', 'accountEdits'];
        for (const databaseName of databaseNames) {
            for (const accountId of accountIds) {
                const previousDatabase = localForage.createInstance({ name: `${databaseName}-${accountId}` });
                const database = localForage.createInstance({ name: `plebbitReactHooks-${databaseName}-${accountId}` });
                for (const key of yield previousDatabase.keys()) {
                    promises.push(previousDatabase.getItem(key).then((value) => database.setItem(key, value)));
                }
            }
        }
    }
    yield Promise.all(promises);
});
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
        accounts[accountId] = yield migrateAccount(accountsArray[i]);
        // plebbit options aren't saved to database if they are default
        if (!accounts[accountId].plebbitOptions) {
            accounts[accountId].plebbitOptions = getDefaultPlebbitOptions();
        }
        accounts[accountId].plebbitOptions = Object.assign(Object.assign({}, accounts[accountId].plebbitOptions), overwritePlebbitOptions);
        accounts[accountId].plebbit = yield PlebbitJs.Plebbit(accounts[accountId].plebbitOptions);
        // handle errors or error events are uncaught
        // no need to log them because plebbit-js already logs them
        accounts[accountId].plebbit.on('error', (error) => log.error('uncaught plebbit instance error, should never happen', { error }));
    }
    return accounts;
});
const accountVersion = 4;
const migrateAccount = (account) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    let version = account.version || 1;
    // version 2
    if (version === 1) {
        version++;
        if ((_a = account.plebbitOptions) === null || _a === void 0 ? void 0 : _a.ipfsHttpClientsOptions) {
            account.plebbitOptions.kuboRpcClientsOptions = account.plebbitOptions.ipfsHttpClientsOptions;
            delete account.plebbitOptions.ipfsHttpClientsOptions;
        }
        if ((_b = account.plebbitOptions) === null || _b === void 0 ? void 0 : _b.pubsubHttpClientsOptions) {
            account.plebbitOptions.pubsubKuboRpcClientsOptions = account.plebbitOptions.pubsubHttpClientsOptions;
            delete account.plebbitOptions.pubsubHttpClientsOptions;
        }
    }
    // version 3
    if (version === 2) {
        version++;
        if (!account.author.wallets) {
            account.author.wallets = {};
        }
        if (!account.author.wallets.eth) {
            account.author.wallets.eth = yield chain.getEthWalletFromPlebbitPrivateKey(account.signer.privateKey, account.address);
        }
        if (!account.author.wallets.sol) {
            account.author.wallets.sol = yield chain.getSolWalletFromPlebbitPrivateKey(account.signer.privateKey, account.address);
        }
    }
    if (version === 3) {
        version++;
        // in version 3, wallets had timestamps in ms, should be seconds
        if (((_e = (_d = (_c = account.author) === null || _c === void 0 ? void 0 : _c.wallets) === null || _d === void 0 ? void 0 : _d.eth) === null || _e === void 0 ? void 0 : _e.timestamp) > 1e12) {
            account.author.wallets.eth = yield chain.getEthWalletFromPlebbitPrivateKey(account.signer.privateKey, account.address);
        }
        if (((_h = (_g = (_f = account.author) === null || _f === void 0 ? void 0 : _f.wallets) === null || _g === void 0 ? void 0 : _g.sol) === null || _h === void 0 ? void 0 : _h.timestamp) > 1e12) {
            account.author.wallets.sol = yield chain.getSolWalletFromPlebbitPrivateKey(account.signer.privateKey, account.address);
        }
    }
    account.version = accountVersion;
    return account;
});
const getAccount = (accountId) => __awaiter(void 0, void 0, void 0, function* () {
    const accounts = yield getAccounts([accountId]);
    return accounts[accountId];
});
const getExportedAccountJson = (accountId) => __awaiter(void 0, void 0, void 0, function* () {
    assert(accountId && typeof accountId === 'string', `getAccountJson argument accountId '${accountId}' invalid`);
    // do not serialize or instantiate anything (unlike getAccount)
    const account = yield accountsDatabase.getItem(accountId);
    if (!account) {
        throw Error(`getAccountJson no account in database with accountId '${accountId}'`);
    }
    const accountCommentsDatabase = getAccountCommentsDatabase(accountId);
    const accountVotesDatabase = getAccountVotesDatabase(accountId);
    const accountEditsDatabase = getAccountEditsDatabase(accountId);
    const [accountComments, accountVotes, accountEdits] = yield Promise.all([
        getDatabaseAsArray(accountCommentsDatabase),
        getDatabaseAsArray(accountVotesDatabase),
        getDatabaseAsArray(accountEditsDatabase),
    ]);
    return JSON.stringify({ account, accountComments, accountVotes, accountEdits });
});
// accountVotes, accountComments and accountEdits are indexeddb
// databases formed like an array (keys are numbers)
const getDatabaseAsArray = (database) => __awaiter(void 0, void 0, void 0, function* () {
    const length = (yield database.getItem('length')) || 0;
    let promises = [];
    let i = 0;
    while (i < length) {
        promises.push(database.getItem(String(i++)));
    }
    const items = yield Promise.all(promises);
    return items;
});
const addAccount = (account) => __awaiter(void 0, void 0, void 0, function* () {
    var _j, _k, _l;
    validator.validateAccountsDatabaseAddAccountArguments(account);
    let accountIds = yield accountsMetadataDatabase.getItem('accountIds');
    // handle no duplicate names
    if (accountIds === null || accountIds === void 0 ? void 0 : accountIds.length) {
        const accounts = yield getAccounts(accountIds);
        for (const accountId of accountIds) {
            if (accountId !== account.id && accounts[accountId].name === account.name) {
                throw Error(`account name '${account.name}' already exists in database`);
            }
        }
    }
    // handle updating accounts database
    const accountToPutInDatabase = Object.assign(Object.assign({}, account), { plebbit: undefined });
    // don't save default plebbit options in database in case they change
    if (JSON.stringify(accountToPutInDatabase.plebbitOptions) === JSON.stringify(getDefaultPlebbitOptions())) {
        delete accountToPutInDatabase.plebbitOptions;
    }
    // make sure accountToPutInDatabase.plebbitOptions are valid
    if (accountToPutInDatabase.plebbitOptions) {
        const plebbit = yield PlebbitJs.Plebbit(accountToPutInDatabase.plebbitOptions);
        plebbit.on('error', () => { });
        (_l = (_j = plebbit.destroy) === null || _j === void 0 ? void 0 : (_k = _j.call(plebbit)).catch) === null || _l === void 0 ? void 0 : _l.call(_k, (error) => log('database.addAccount plebbit.destroy error', { error })); // make sure it's garbage collected
    }
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
const removeAccount = (account) => __awaiter(void 0, void 0, void 0, function* () {
    assert((account === null || account === void 0 ? void 0 : account.id) && typeof (account === null || account === void 0 ? void 0 : account.id) === 'string', `accountsDatabase.removeAccount invalid account.id '${account.id}'`);
    // handle updating accounts database
    yield accountsDatabase.removeItem(account.id);
    // handle updating accountNamesToAccountIds database
    let accountNamesToAccountIds = yield accountsMetadataDatabase.getItem('accountNamesToAccountIds');
    if (!accountNamesToAccountIds) {
        accountNamesToAccountIds = {};
    }
    delete accountNamesToAccountIds[account.name];
    yield accountsMetadataDatabase.setItem('accountNamesToAccountIds', accountNamesToAccountIds);
    // handle updating accountIds database
    let accountIds = yield accountsMetadataDatabase.getItem('accountIds');
    accountIds = (accountIds || []).filter((accountId) => accountId !== account.id);
    yield accountsMetadataDatabase.setItem('accountIds', accountIds);
    // handle updating activeAccountId database
    const activeAccountId = yield accountsMetadataDatabase.getItem('activeAccountId');
    if (activeAccountId === account.id) {
        if (accountIds.length) {
            yield accountsMetadataDatabase.setItem('activeAccountId', accountIds[0]);
        }
        else {
            yield accountsMetadataDatabase.removeItem('activeAccountId');
        }
    }
    const accountCommentsDatabase = yield getAccountCommentsDatabase(account.id);
    if (accountCommentsDatabase) {
        yield accountCommentsDatabase.clear();
    }
    const accountVotesDatabase = yield getAccountVotesDatabase(account.id);
    if (accountVotesDatabase) {
        yield accountVotesDatabase.clear();
    }
});
const accountsCommentsDatabases = {};
const getAccountCommentsDatabase = (accountId) => {
    assert(accountId && typeof accountId === 'string', `getAccountCommentsDatabase '${accountId}' not a string`);
    if (!accountsCommentsDatabases[accountId]) {
        accountsCommentsDatabases[accountId] = localForage.createInstance({ name: `plebbitReactHooks-accountComments-${accountId}` });
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
        yield Promise.all([accountCommentsDatabase.setItem(String(length), comment), accountCommentsDatabase.setItem('length', length + 1)]);
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
    assert(Array.isArray(accountIds), `getAccountsComments invalid accountIds '${accountIds}' not an array`);
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
        accountsVotesDatabases[accountId] = localForage.createInstance({ name: `plebbitReactHooks-accountVotes-${accountId}` });
    }
    return accountsVotesDatabases[accountId];
};
const addAccountVote = (accountId, createVoteOptions) => __awaiter(void 0, void 0, void 0, function* () {
    assert((createVoteOptions === null || createVoteOptions === void 0 ? void 0 : createVoteOptions.commentCid) && typeof (createVoteOptions === null || createVoteOptions === void 0 ? void 0 : createVoteOptions.commentCid) === 'string', `addAccountVote createVoteOptions.commentCid '${createVoteOptions === null || createVoteOptions === void 0 ? void 0 : createVoteOptions.commentCid}' not a string`);
    const accountVotesDatabase = getAccountVotesDatabase(accountId);
    const length = (yield accountVotesDatabase.getItem('length')) || 0;
    const vote = Object.assign({}, createVoteOptions);
    delete vote.signer;
    delete vote.author;
    // delete all functions because they can't be added to indexeddb
    for (const i in vote) {
        if (typeof vote[i] === 'function') {
            delete vote[i];
        }
    }
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
    assert(Array.isArray(accountIds), `getAccountsVotes invalid accountIds '${accountIds}' not an array`);
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
            name: `plebbitReactHooks-accountCommentsReplies-${accountId}`,
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
    const accountCommentsRepliesEntries = yield accountCommentsRepliesDatabase.entries();
    const replies = {};
    for (const [, reply] of accountCommentsRepliesEntries) {
        // @ts-ignore
        replies[reply.cid] = reply;
    }
    return replies;
});
const getAccountsCommentsReplies = (accountIds) => __awaiter(void 0, void 0, void 0, function* () {
    assert(Array.isArray(accountIds), `getAccountsCommentsReplies invalid accountIds '${accountIds}' not an array`);
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
const accountsEditsDatabases = {};
const getAccountEditsDatabase = (accountId) => {
    assert(accountId && typeof accountId === 'string', `getAccountEditsDatabase '${accountId}' not a string`);
    if (!accountsEditsDatabases[accountId]) {
        accountsEditsDatabases[accountId] = localForage.createInstance({ name: `plebbitReactHooks-accountEdits-${accountId}` });
    }
    return accountsEditsDatabases[accountId];
};
const addAccountEdit = (accountId, createEditOptions) => __awaiter(void 0, void 0, void 0, function* () {
    assert((createEditOptions === null || createEditOptions === void 0 ? void 0 : createEditOptions.commentCid) && typeof (createEditOptions === null || createEditOptions === void 0 ? void 0 : createEditOptions.commentCid) === 'string', `addAccountEdit createEditOptions.commentCid '${createEditOptions === null || createEditOptions === void 0 ? void 0 : createEditOptions.commentCid}' not a string`);
    const accountEditsDatabase = getAccountEditsDatabase(accountId);
    const length = (yield accountEditsDatabase.getItem('length')) || 0;
    const edit = Object.assign({}, createEditOptions);
    delete edit.signer;
    delete edit.author;
    // delete all functions because they can't be added to indexeddb
    for (const i in edit) {
        if (typeof edit[i] === 'function') {
            delete edit[i];
        }
    }
    // edits are an array because you can edit the same comment multiple times
    const edits = (yield accountEditsDatabase.getItem(edit.commentCid)) || [];
    edits.push(edit);
    yield Promise.all([
        accountEditsDatabase.setItem(edit.commentCid, edits),
        accountEditsDatabase.setItem(String(length), edit),
        accountEditsDatabase.setItem('length', length + 1),
    ]);
});
const getAccountEdits = (accountId) => __awaiter(void 0, void 0, void 0, function* () {
    const accountEditsDatabase = getAccountEditsDatabase(accountId);
    const length = (yield accountEditsDatabase.getItem('length')) || 0;
    const edits = {};
    if (length === 0) {
        return edits;
    }
    let promises = [];
    let i = 0;
    while (i < length) {
        promises.push(accountEditsDatabase.getItem(String(i++)));
    }
    const editsArray = yield Promise.all(promises);
    for (const edit of editsArray) {
        // TODO: must change this logic for subplebbit edits
        if (!edits[edit === null || edit === void 0 ? void 0 : edit.commentCid]) {
            edits[edit === null || edit === void 0 ? void 0 : edit.commentCid] = [];
        }
        edits[edit === null || edit === void 0 ? void 0 : edit.commentCid].push(edit);
    }
    return edits;
});
const getAccountsEdits = (accountIds) => __awaiter(void 0, void 0, void 0, function* () {
    assert(Array.isArray(accountIds), `getAccountsEdits invalid accountIds '${accountIds}' not an array`);
    const promises = [];
    for (const accountId of accountIds) {
        promises.push(getAccountEdits(accountId));
    }
    const accountsEditsArray = yield Promise.all(promises);
    const accountsEdits = {};
    for (const [i, accountId] of accountIds.entries()) {
        accountsEdits[accountId] = accountsEditsArray[i];
    }
    return accountsEdits;
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
    removeAccount,
    getExportedAccountJson,
    getAccounts,
    getAccount,
    addAccountCommentReply,
    getAccountCommentsReplies,
    getAccountsCommentsReplies,
    getAccountsEdits,
    getAccountEdits,
    addAccountEdit,
    accountVersion,
    migrate,
};
export default database;
