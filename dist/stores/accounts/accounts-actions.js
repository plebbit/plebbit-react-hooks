// public accounts actions that are called by the user
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import accountsStore, { listeners } from './accounts-store';
import subplebbitsStore from '../subplebbits';
import accountsDatabase from './accounts-database';
import accountGenerator from './account-generator';
import Logger from '@plebbit/plebbit-logger';
import validator from '../../lib/validator';
import assert from 'assert';
const log = Logger('plebbit-react-hooks:accounts:stores');
import * as accountsActionsInternal from './accounts-actions-internal';
import { getAccountSubplebbits, getCommentCidsToAccountsComments } from './utils';
import utils from '../../lib/utils';
const addNewAccountToDatabaseAndState = (newAccount) => __awaiter(void 0, void 0, void 0, function* () {
    // add to database first to init the account
    yield accountsDatabase.addAccount(newAccount);
    // use database data for these because it's easier
    const [newAccountIds, newAccountNamesToAccountIds] = yield Promise.all([
        accountsDatabase.accountsMetadataDatabase.getItem('accountIds'),
        accountsDatabase.accountsMetadataDatabase.getItem('accountNamesToAccountIds'),
    ]);
    // set the new state
    const { accounts, accountsComments, accountsVotes, accountsEdits, accountsCommentsReplies } = accountsStore.getState();
    const newAccounts = Object.assign(Object.assign({}, accounts), { [newAccount.id]: newAccount });
    const newState = {
        accounts: newAccounts,
        accountIds: newAccountIds,
        accountNamesToAccountIds: newAccountNamesToAccountIds,
        accountsComments: Object.assign(Object.assign({}, accountsComments), { [newAccount.id]: [] }),
        accountsVotes: Object.assign(Object.assign({}, accountsVotes), { [newAccount.id]: {} }),
        accountsEdits: Object.assign(Object.assign({}, accountsEdits), { [newAccount.id]: {} }),
        accountsCommentsReplies: Object.assign(Object.assign({}, accountsCommentsReplies), { [newAccount.id]: {} }),
    };
    // if there is only 1 account, make it active
    // otherwise stay on the same active account
    if (newAccountIds.length === 1) {
        newState.activeAccountId = newAccount.id;
    }
    accountsStore.setState(newState);
});
export const createAccount = (accountName) => __awaiter(void 0, void 0, void 0, function* () {
    const newAccount = yield accountGenerator.generateDefaultAccount();
    if (accountName) {
        newAccount.name = accountName;
    }
    yield addNewAccountToDatabaseAndState(newAccount);
    log('accountsActions.createAccount', { accountName, account: newAccount });
});
export const deleteAccount = (accountName) => __awaiter(void 0, void 0, void 0, function* () {
    const { accounts, accountNamesToAccountIds, activeAccountId, accountsComments, accountsVotes } = accountsStore.getState();
    assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use accountsStore.accountActions before initialized`);
    let account = accounts[activeAccountId];
    if (accountName) {
        const accountId = accountNamesToAccountIds[accountName];
        account = accounts[accountId];
    }
    assert(account === null || account === void 0 ? void 0 : account.id, `accountsActions.deleteAccount account.id '${account === null || account === void 0 ? void 0 : account.id}' doesn't exist, activeAccountId '${activeAccountId}' accountName '${accountName}'`);
    yield accountsDatabase.removeAccount(account);
    const newAccounts = Object.assign({}, accounts);
    delete newAccounts[account.id];
    const [newAccountIds, newActiveAccountId, newAccountNamesToAccountIds] = yield Promise.all([
        accountsDatabase.accountsMetadataDatabase.getItem('accountIds'),
        accountsDatabase.accountsMetadataDatabase.getItem('activeAccountId'),
        accountsDatabase.accountsMetadataDatabase.getItem('accountNamesToAccountIds'),
    ]);
    const newAccountsComments = Object.assign({}, accountsComments);
    delete newAccountsComments[account.id];
    const newAccountsVotes = Object.assign({}, accountsVotes);
    delete newAccountsVotes[account.id];
    accountsStore.setState({
        accounts: newAccounts,
        accountIds: newAccountIds,
        activeAccountId: newActiveAccountId,
        accountNamesToAccountIds: newAccountNamesToAccountIds,
        accountsComments: newAccountsComments,
        accountsVotes: newAccountsVotes,
    });
});
export const setActiveAccount = (accountName) => __awaiter(void 0, void 0, void 0, function* () {
    const { accountNamesToAccountIds } = accountsStore.getState();
    assert(accountNamesToAccountIds, `can't use accountsStore.accountActions before initialized`);
    validator.validateAccountsActionsSetActiveAccountArguments(accountName);
    const accountId = accountNamesToAccountIds[accountName];
    yield accountsDatabase.accountsMetadataDatabase.setItem('activeAccountId', accountId);
    log('accountsActions.setActiveAccount', { accountName, accountId });
    accountsStore.setState({ activeAccountId: accountId });
});
export const setAccount = (account) => __awaiter(void 0, void 0, void 0, function* () {
    const { accounts } = accountsStore.getState();
    validator.validateAccountsActionsSetAccountArguments(account);
    assert(accounts === null || accounts === void 0 ? void 0 : accounts[account.id], `cannot set account with account.id '${account.id}' id does not exist in database`);
    // if author.address has changed, add new subplebbit roles of author.address found in subplebbits store
    // TODO: add test to check if roles get added
    if (account.author.address !== accounts[account.id].author.address) {
        const subplebbits = getAccountSubplebbits(account, subplebbitsStore.getState().subplebbits);
        account = Object.assign(Object.assign({}, account), { subplebbits });
    }
    // use this function to serialize and update all databases
    yield accountsDatabase.addAccount(account);
    const [newAccount, newAccountNamesToAccountIds] = yield Promise.all([
        // use this function to deserialize
        accountsDatabase.getAccount(account.id),
        accountsDatabase.accountsMetadataDatabase.getItem('accountNamesToAccountIds'),
    ]);
    const newAccounts = Object.assign(Object.assign({}, accounts), { [newAccount.id]: newAccount });
    log('accountsActions.setAccount', { account: newAccount });
    accountsStore.setState({ accounts: newAccounts, accountNamesToAccountIds: newAccountNamesToAccountIds });
});
export const setAccountsOrder = (newOrderedAccountNames) => __awaiter(void 0, void 0, void 0, function* () {
    const { accounts, accountNamesToAccountIds } = accountsStore.getState();
    assert(accounts && accountNamesToAccountIds, `can't use accountsStore.accountActions before initialized`);
    const accountIds = [];
    const accountNames = [];
    for (const accountName of newOrderedAccountNames) {
        const accountId = accountNamesToAccountIds[accountName];
        accountIds.push(accountId);
        accountNames.push(accounts[accountId].name);
    }
    validator.validateAccountsActionsSetAccountsOrderArguments(newOrderedAccountNames, accountNames);
    log('accountsActions.setAccountsOrder', {
        previousAccountNames: accountNames,
        newAccountNames: newOrderedAccountNames,
    });
    yield accountsDatabase.accountsMetadataDatabase.setItem('accountIds', accountIds);
    accountsStore.setState({ accountIds });
});
export const importAccount = (serializedAccount) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { accounts, accountNamesToAccountIds, activeAccountId } = accountsStore.getState();
    assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use accountsStore.accountActions before initialized`);
    let imported;
    try {
        imported = JSON.parse(serializedAccount);
    }
    catch (e) { }
    assert((imported === null || imported === void 0 ? void 0 : imported.account) && ((_a = imported === null || imported === void 0 ? void 0 : imported.account) === null || _a === void 0 ? void 0 : _a.id) && ((_b = imported === null || imported === void 0 ? void 0 : imported.account) === null || _b === void 0 ? void 0 : _b.name), `accountsActions.importAccount failed JSON.stringify json serializedAccount '${serializedAccount}'`);
    // add subplebbit roles already in subplebbits store to imported account
    // TODO: add test to check if roles get added
    const subplebbits = getAccountSubplebbits(imported.account, subplebbitsStore.getState().subplebbits);
    // if imported.account.name already exists, add ' 2', don't overwrite
    if (accountNamesToAccountIds[imported.account.name]) {
        imported.account.name += ' 2';
    }
    // generate new account
    const generatedAccount = yield accountGenerator.generateDefaultAccount();
    // use generatedAccount to init properties like .plebbit and .id on a new account
    // overwrite account.id to avoid duplicate ids
    const newAccount = Object.assign(Object.assign(Object.assign({}, generatedAccount), imported.account), { subplebbits, id: generatedAccount.id });
    // add account to database
    yield accountsDatabase.addAccount(newAccount);
    // add account comments, votes, edits to database
    for (const accountComment of imported.accountComments || []) {
        yield accountsDatabase.addAccountComment(newAccount.id, accountComment);
    }
    for (const accountVote of imported.accountVotes || []) {
        yield accountsDatabase.addAccountVote(newAccount.id, accountVote);
    }
    for (const accountEdit of imported.accountEdits || []) {
        yield accountsDatabase.addAccountEdit(newAccount.id, accountEdit);
    }
    // set new state
    // get new state data from database because it's easier
    const [accountComments, accountVotes, accountEdits, accountIds, newAccountNamesToAccountIds] = yield Promise.all([
        accountsDatabase.getAccountComments(newAccount.id),
        accountsDatabase.getAccountVotes(newAccount.id),
        accountsDatabase.getAccountEdits(newAccount.id),
        accountsDatabase.accountsMetadataDatabase.getItem('accountIds'),
        accountsDatabase.accountsMetadataDatabase.getItem('accountNamesToAccountIds'),
    ]);
    accountsStore.setState((state) => ({
        accounts: Object.assign(Object.assign({}, state.accounts), { [newAccount.id]: newAccount }),
        accountIds,
        accountNamesToAccountIds: newAccountNamesToAccountIds,
        accountsComments: Object.assign(Object.assign({}, state.accountsComments), { [newAccount.id]: accountComments }),
        commentCidsToAccountsComments: getCommentCidsToAccountsComments(Object.assign(Object.assign({}, state.accountsComments), { [newAccount.id]: accountComments })),
        accountsVotes: Object.assign(Object.assign({}, state.accountsVotes), { [newAccount.id]: accountVotes }),
        accountsEdits: Object.assign(Object.assign({}, state.accountsEdits), { [newAccount.id]: accountEdits }),
        // don't import/export replies to own comments, those are just cached and can be refetched
        accountsCommentsReplies: Object.assign(Object.assign({}, state.accountsCommentsReplies), { [newAccount.id]: {} }),
    }));
    log('accountsActions.importAccount', { account: newAccount, accountComments, accountVotes, accountEdits });
    // start looking for updates for all accounts comments in database
    for (const accountComment of accountComments) {
        accountsStore
            .getState()
            .accountsActionsInternal.startUpdatingAccountCommentOnCommentUpdateEvents(accountComment, newAccount, accountComment.index)
            .catch((error) => log.error('accountsActions.importAccount startUpdatingAccountCommentOnCommentUpdateEvents error', {
            accountComment,
            accountCommentIndex: accountComment.index,
            importedAccount: newAccount,
            error,
        }));
    }
    // TODO: add options to only import private key, account settings, or include all account comments/votes history
});
export const exportAccount = (accountName) => __awaiter(void 0, void 0, void 0, function* () {
    const { accounts, accountNamesToAccountIds, activeAccountId } = accountsStore.getState();
    assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use accountsStore.accountActions before initialized`);
    let account = accounts[activeAccountId];
    if (accountName) {
        const accountId = accountNamesToAccountIds[accountName];
        account = accounts[accountId];
    }
    assert(account === null || account === void 0 ? void 0 : account.id, `accountsActions.exportAccount account.id '${account === null || account === void 0 ? void 0 : account.id}' doesn't exist, activeAccountId '${activeAccountId}' accountName '${accountName}'`);
    const exportedAccountJson = yield accountsDatabase.getExportedAccountJson(account.id);
    log('accountsActions.exportAccount', { exportedAccountJson });
    return exportedAccountJson;
});
export const subscribe = (subplebbitAddress, accountName) => __awaiter(void 0, void 0, void 0, function* () {
    const { accounts, accountNamesToAccountIds, activeAccountId } = accountsStore.getState();
    assert(subplebbitAddress && typeof subplebbitAddress === 'string', `accountsActions.subscribe invalid subplebbitAddress '${subplebbitAddress}'`);
    assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use accountsStore.accountActions before initialized`);
    let account = accounts[activeAccountId];
    if (accountName) {
        const accountId = accountNamesToAccountIds[accountName];
        account = accounts[accountId];
    }
    assert(account === null || account === void 0 ? void 0 : account.id, `accountsActions.subscribe account.id '${account === null || account === void 0 ? void 0 : account.id}' doesn't exist, activeAccountId '${activeAccountId}' accountName '${accountName}'`);
    const subscriptions = account.subscriptions || [];
    if (subscriptions.includes(subplebbitAddress)) {
        throw Error(`account '${account.id}' already subscribed to '${subplebbitAddress}'`);
    }
    subscriptions.push(subplebbitAddress);
    const updatedAccount = Object.assign(Object.assign({}, account), { subscriptions });
    // update account in db
    yield accountsDatabase.addAccount(updatedAccount);
    const updatedAccounts = Object.assign(Object.assign({}, accounts), { [updatedAccount.id]: updatedAccount });
    log('accountsActions.subscribe', { account: updatedAccount, accountName, subplebbitAddress });
    accountsStore.setState({ accounts: updatedAccounts });
});
export const unsubscribe = (subplebbitAddress, accountName) => __awaiter(void 0, void 0, void 0, function* () {
    const { accounts, accountNamesToAccountIds, activeAccountId } = accountsStore.getState();
    assert(subplebbitAddress && typeof subplebbitAddress === 'string', `accountsActions.unsubscribe invalid subplebbitAddress '${subplebbitAddress}'`);
    assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use accountsStore.accountActions before initialized`);
    let account = accounts[activeAccountId];
    if (accountName) {
        const accountId = accountNamesToAccountIds[accountName];
        account = accounts[accountId];
    }
    assert(account === null || account === void 0 ? void 0 : account.id, `accountsActions.unsubscribe account.id '${account === null || account === void 0 ? void 0 : account.id}' doesn't exist, activeAccountId '${activeAccountId}' accountName '${accountName}'`);
    let subscriptions = account.subscriptions || [];
    if (!subscriptions.includes(subplebbitAddress)) {
        throw Error(`account '${account.id}' already unsubscribed from '${subplebbitAddress}'`);
    }
    // remove subplebbitAddress
    subscriptions = subscriptions.filter((address) => address !== subplebbitAddress);
    const updatedAccount = Object.assign(Object.assign({}, account), { subscriptions });
    // update account in db
    yield accountsDatabase.addAccount(updatedAccount);
    const updatedAccounts = Object.assign(Object.assign({}, accounts), { [updatedAccount.id]: updatedAccount });
    log('accountsActions.unsubscribe', { account: updatedAccount, accountName, subplebbitAddress });
    accountsStore.setState({ accounts: updatedAccounts });
});
export const blockAddress = (address, accountName) => __awaiter(void 0, void 0, void 0, function* () {
    const { accounts, accountNamesToAccountIds, activeAccountId } = accountsStore.getState();
    assert(address && typeof address === 'string', `accountsActions.blockAddress invalid address '${address}'`);
    assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use accountsStore.accountActions before initialized`);
    let account = accounts[activeAccountId];
    if (accountName) {
        const accountId = accountNamesToAccountIds[accountName];
        account = accounts[accountId];
    }
    assert(account === null || account === void 0 ? void 0 : account.id, `accountsActions.blockAddress account.id '${account === null || account === void 0 ? void 0 : account.id}' doesn't exist, activeAccountId '${activeAccountId}' accountName '${accountName}'`);
    const blockedAddresses = Object.assign({}, account.blockedAddresses);
    if (blockedAddresses[address] === true) {
        throw Error(`account '${account.id}' already blocked address '${address}'`);
    }
    blockedAddresses[address] = true;
    const updatedAccount = Object.assign(Object.assign({}, account), { blockedAddresses });
    // update account in db
    yield accountsDatabase.addAccount(updatedAccount);
    const updatedAccounts = Object.assign(Object.assign({}, accounts), { [updatedAccount.id]: updatedAccount });
    log('accountsActions.blockAddress', { account: updatedAccount, accountName, address });
    accountsStore.setState({ accounts: updatedAccounts });
});
export const unblockAddress = (address, accountName) => __awaiter(void 0, void 0, void 0, function* () {
    const { accounts, accountNamesToAccountIds, activeAccountId } = accountsStore.getState();
    assert(address && typeof address === 'string', `accountsActions.unblockAddress invalid address '${address}'`);
    assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use accountsStore.accountActions before initialized`);
    let account = accounts[activeAccountId];
    if (accountName) {
        const accountId = accountNamesToAccountIds[accountName];
        account = accounts[accountId];
    }
    assert(account === null || account === void 0 ? void 0 : account.id, `accountsActions.unblockAddress account.id '${account === null || account === void 0 ? void 0 : account.id}' doesn't exist, activeAccountId '${activeAccountId}' accountName '${accountName}'`);
    const blockedAddresses = Object.assign({}, account.blockedAddresses);
    if (!blockedAddresses[address]) {
        throw Error(`account '${account.id}' already unblocked address '${address}'`);
    }
    delete blockedAddresses[address];
    const updatedAccount = Object.assign(Object.assign({}, account), { blockedAddresses });
    // update account in db
    yield accountsDatabase.addAccount(updatedAccount);
    const updatedAccounts = Object.assign(Object.assign({}, accounts), { [updatedAccount.id]: updatedAccount });
    log('accountsActions.unblockAddress', { account: updatedAccount, accountName, address });
    accountsStore.setState({ accounts: updatedAccounts });
});
export const blockCid = (cid, accountName) => __awaiter(void 0, void 0, void 0, function* () {
    const { accounts, accountNamesToAccountIds, activeAccountId } = accountsStore.getState();
    assert(cid && typeof cid === 'string', `accountsActions.blockCid invalid cid '${cid}'`);
    assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use accountsStore.accountActions before initialized`);
    let account = accounts[activeAccountId];
    if (accountName) {
        const accountId = accountNamesToAccountIds[accountName];
        account = accounts[accountId];
    }
    assert(account === null || account === void 0 ? void 0 : account.id, `accountsActions.blockCid account.id '${account === null || account === void 0 ? void 0 : account.id}' doesn't exist, activeAccountId '${activeAccountId}' accountName '${accountName}'`);
    const blockedCids = Object.assign({}, account.blockedCids);
    if (blockedCids[cid] === true) {
        throw Error(`account '${account.id}' already blocked cid '${cid}'`);
    }
    blockedCids[cid] = true;
    const updatedAccount = Object.assign(Object.assign({}, account), { blockedCids });
    // update account in db
    yield accountsDatabase.addAccount(updatedAccount);
    const updatedAccounts = Object.assign(Object.assign({}, accounts), { [updatedAccount.id]: updatedAccount });
    log('accountsActions.blockCid', { account: updatedAccount, accountName, cid });
    accountsStore.setState({ accounts: updatedAccounts });
});
export const unblockCid = (cid, accountName) => __awaiter(void 0, void 0, void 0, function* () {
    const { accounts, accountNamesToAccountIds, activeAccountId } = accountsStore.getState();
    assert(cid && typeof cid === 'string', `accountsActions.unblockCid invalid cid '${cid}'`);
    assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use accountsStore.accountActions before initialized`);
    let account = accounts[activeAccountId];
    if (accountName) {
        const accountId = accountNamesToAccountIds[accountName];
        account = accounts[accountId];
    }
    assert(account === null || account === void 0 ? void 0 : account.id, `accountsActions.unblockCid account.id '${account === null || account === void 0 ? void 0 : account.id}' doesn't exist, activeAccountId '${activeAccountId}' accountName '${accountName}'`);
    const blockedCids = Object.assign({}, account.blockedCids);
    if (!blockedCids[cid]) {
        throw Error(`account '${account.id}' already unblocked cid '${cid}'`);
    }
    delete blockedCids[cid];
    const updatedAccount = Object.assign(Object.assign({}, account), { blockedCids });
    // update account in db
    yield accountsDatabase.addAccount(updatedAccount);
    const updatedAccounts = Object.assign(Object.assign({}, accounts), { [updatedAccount.id]: updatedAccount });
    log('accountsActions.unblockCid', { account: updatedAccount, accountName, cid });
    accountsStore.setState({ accounts: updatedAccounts });
});
export const publishComment = (publishCommentOptions, accountName) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    const { accounts, accountsComments, accountNamesToAccountIds, activeAccountId } = accountsStore.getState();
    assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use accountsStore.accountActions before initialized`);
    let account = accounts[activeAccountId];
    if (accountName) {
        const accountId = accountNamesToAccountIds[accountName];
        account = accounts[accountId];
    }
    validator.validateAccountsActionsPublishCommentArguments({ publishCommentOptions, accountName, account });
    // find author.previousCommentCid if any
    const accountCommentsWithCids = accountsComments[account.id]
        .filter((comment) => comment.cid)
        // author can change his address, his previousCommentCid becomes invalid
        .filter((comment) => { var _a, _b; return ((_a = comment.author) === null || _a === void 0 ? void 0 : _a.address) === ((_b = account.author) === null || _b === void 0 ? void 0 : _b.address); });
    const previousCommentCid = (_c = accountCommentsWithCids[accountCommentsWithCids.length - 1]) === null || _c === void 0 ? void 0 : _c.cid;
    const author = Object.assign({}, account.author);
    if (previousCommentCid) {
        author.previousCommentCid = previousCommentCid;
    }
    let createCommentOptions = Object.assign({ timestamp: Math.round(Date.now() / 1000), author, signer: account.signer }, publishCommentOptions);
    delete createCommentOptions.onChallenge;
    delete createCommentOptions.onChallengeVerification;
    delete createCommentOptions.onError;
    delete createCommentOptions.onPublishingStateChange;
    let accountCommentIndex;
    let comment = yield account.plebbit.createComment(createCommentOptions);
    const publishAndRetryFailedChallengeVerification = () => __awaiter(void 0, void 0, void 0, function* () {
        var _d;
        comment.once('challenge', (challenge) => __awaiter(void 0, void 0, void 0, function* () {
            publishCommentOptions.onChallenge(challenge, comment);
        }));
        comment.once('challengeverification', (challengeVerification) => __awaiter(void 0, void 0, void 0, function* () {
            var _e;
            publishCommentOptions.onChallengeVerification(challengeVerification, comment);
            if (!challengeVerification.challengeSuccess) {
                // publish again automatically on fail
                createCommentOptions = Object.assign(Object.assign({}, createCommentOptions), { timestamp: Math.round(Date.now() / 1000) });
                comment = yield account.plebbit.createComment(createCommentOptions);
                publishAndRetryFailedChallengeVerification();
            }
            else {
                // the challengeverification message of a comment publication should in theory send back the CID
                // of the published comment which is needed to resolve it for replies, upvotes, etc
                if ((_e = challengeVerification === null || challengeVerification === void 0 ? void 0 : challengeVerification.publication) === null || _e === void 0 ? void 0 : _e.cid) {
                    const commentWithCid = Object.assign(Object.assign({}, createCommentOptions), { cid: challengeVerification.publication.cid });
                    yield accountsDatabase.addAccountComment(account.id, commentWithCid, accountCommentIndex);
                    accountsStore.setState(({ accountsComments, commentCidsToAccountsComments }) => {
                        var _a;
                        const updatedAccountComments = [...accountsComments[account.id]];
                        const updatedAccountComment = Object.assign(Object.assign({}, commentWithCid), { index: accountCommentIndex, accountId: account.id });
                        updatedAccountComments[accountCommentIndex] = updatedAccountComment;
                        return {
                            accountsComments: Object.assign(Object.assign({}, accountsComments), { [account.id]: updatedAccountComments }),
                            commentCidsToAccountsComments: Object.assign(Object.assign({}, commentCidsToAccountsComments), { [(_a = challengeVerification === null || challengeVerification === void 0 ? void 0 : challengeVerification.publication) === null || _a === void 0 ? void 0 : _a.cid]: { accountId: account.id, accountCommentIndex } }),
                        };
                    });
                    accountsActionsInternal
                        .startUpdatingAccountCommentOnCommentUpdateEvents(comment, account, accountCommentIndex)
                        .catch((error) => log.error('accountsActions.publishComment startUpdatingAccountCommentOnCommentUpdateEvents error', { comment, account, accountCommentIndex, error }));
                }
            }
        }));
        comment.on('error', (error) => {
            var _a;
            accountsStore.setState(({ accountsComments }) => {
                const accountComments = [...accountsComments[account.id]];
                const accountComment = accountComments[accountCommentIndex];
                if (!accountComment) {
                    return {};
                }
                const errors = [...accountComment.errors, error];
                accountComments[accountCommentIndex] = Object.assign(Object.assign({}, accountComment), { errors, error });
                return { accountsComments: Object.assign(Object.assign({}, accountsComments), { [account.id]: accountComments }) };
            });
            (_a = publishCommentOptions.onError) === null || _a === void 0 ? void 0 : _a.call(publishCommentOptions, error, comment);
        });
        comment.on('publishingstatechange', (publishingState) => __awaiter(void 0, void 0, void 0, function* () {
            var _f;
            // set publishing state on account comment so the frontend can display it, dont persist in db because a reload cancels publishing
            accountsStore.setState(({ accountsComments }) => {
                const accountComments = [...accountsComments[account.id]];
                const accountComment = accountComments[accountCommentIndex];
                if (!accountComment) {
                    return {};
                }
                accountComments[accountCommentIndex] = Object.assign(Object.assign({}, accountComment), { publishingState });
                return { accountsComments: Object.assign(Object.assign({}, accountsComments), { [account.id]: accountComments }) };
            });
            (_f = publishCommentOptions.onPublishingStateChange) === null || _f === void 0 ? void 0 : _f.call(publishCommentOptions, publishingState);
        }));
        // set clients on account comment so the frontend can display it, dont persist in db because a reload cancels publishing
        for (const clientType in comment.clients) {
            for (const clientUrl in comment.clients[clientType]) {
                comment.clients[clientType][clientUrl].on('statechange', (state) => {
                    accountsStore.setState(({ accountsComments }) => {
                        const accountComments = [...accountsComments[account.id]];
                        const accountComment = accountComments[accountCommentIndex];
                        if (!accountComment) {
                            return {};
                        }
                        accountComments[accountCommentIndex] = Object.assign(Object.assign({}, accountComment), { clients: utils.clone(comment.clients) });
                        return { accountsComments: Object.assign(Object.assign({}, accountsComments), { [account.id]: accountComments }) };
                    });
                });
            }
        }
        listeners.push(comment);
        try {
            // publish will resolve after the challenge request
            // if it fails before, like failing to resolve ENS, we can emit the error
            yield comment.publish();
        }
        catch (error) {
            (_d = publishCommentOptions.onError) === null || _d === void 0 ? void 0 : _d.call(publishCommentOptions, error, comment);
        }
    });
    publishAndRetryFailedChallengeVerification();
    yield accountsDatabase.addAccountComment(account.id, createCommentOptions);
    log('accountsActions.publishComment', { createCommentOptions });
    let createdAccountComment;
    accountsStore.setState(({ accountsComments }) => {
        // save account comment index to update the comment later
        accountCommentIndex = accountsComments[account.id].length;
        createdAccountComment = Object.assign(Object.assign({}, createCommentOptions), { index: accountCommentIndex, accountId: account.id });
        return {
            accountsComments: Object.assign(Object.assign({}, accountsComments), { [account.id]: [...accountsComments[account.id], createdAccountComment] }),
        };
    });
    return createdAccountComment;
});
export const deleteComment = (commentCidOrAccountCommentIndex, accountName) => __awaiter(void 0, void 0, void 0, function* () {
    throw Error('TODO: not implemented');
});
export const publishVote = (publishVoteOptions, accountName) => __awaiter(void 0, void 0, void 0, function* () {
    const { accounts, accountNamesToAccountIds, activeAccountId } = accountsStore.getState();
    assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use accountsStore.accountActions before initialized`);
    let account = accounts[activeAccountId];
    if (accountName) {
        const accountId = accountNamesToAccountIds[accountName];
        account = accounts[accountId];
    }
    validator.validateAccountsActionsPublishVoteArguments({ publishVoteOptions, accountName, account });
    let createVoteOptions = Object.assign({ timestamp: Math.round(Date.now() / 1000), author: account.author, signer: account.signer }, publishVoteOptions);
    delete createVoteOptions.onChallenge;
    delete createVoteOptions.onChallengeVerification;
    delete createVoteOptions.onError;
    delete createVoteOptions.onPublishingStateChange;
    let vote = yield account.plebbit.createVote(createVoteOptions);
    const publishAndRetryFailedChallengeVerification = () => __awaiter(void 0, void 0, void 0, function* () {
        var _g;
        vote.once('challenge', (challenge) => __awaiter(void 0, void 0, void 0, function* () {
            publishVoteOptions.onChallenge(challenge, vote);
        }));
        vote.once('challengeverification', (challengeVerification) => __awaiter(void 0, void 0, void 0, function* () {
            publishVoteOptions.onChallengeVerification(challengeVerification, vote);
            if (!challengeVerification.challengeSuccess) {
                // publish again automatically on fail
                createVoteOptions = Object.assign(Object.assign({}, createVoteOptions), { timestamp: Math.round(Date.now() / 1000) });
                vote = yield account.plebbit.createVote(createVoteOptions);
                publishAndRetryFailedChallengeVerification();
            }
        }));
        vote.on('error', (error) => { var _a; return (_a = publishVoteOptions.onError) === null || _a === void 0 ? void 0 : _a.call(publishVoteOptions, error, vote); });
        // TODO: add publishingState to account votes
        vote.on('publishingstatechange', (publishingState) => { var _a; return (_a = publishVoteOptions.onPublishingStateChange) === null || _a === void 0 ? void 0 : _a.call(publishVoteOptions, publishingState); });
        listeners.push(vote);
        try {
            // publish will resolve after the challenge request
            // if it fails before, like failing to resolve ENS, we can emit the error
            yield vote.publish();
        }
        catch (error) {
            (_g = publishVoteOptions.onError) === null || _g === void 0 ? void 0 : _g.call(publishVoteOptions, error, vote);
        }
    });
    publishAndRetryFailedChallengeVerification();
    yield accountsDatabase.addAccountVote(account.id, createVoteOptions);
    log('accountsActions.publishVote', { createVoteOptions });
    accountsStore.setState(({ accountsVotes }) => ({
        accountsVotes: Object.assign(Object.assign({}, accountsVotes), { [account.id]: Object.assign(Object.assign({}, accountsVotes[account.id]), { [createVoteOptions.commentCid]: Object.assign(Object.assign({}, createVoteOptions), { signer: undefined, author: undefined }) }) }),
    }));
});
export const publishCommentEdit = (publishCommentEditOptions, accountName) => __awaiter(void 0, void 0, void 0, function* () {
    const { accounts, accountNamesToAccountIds, activeAccountId } = accountsStore.getState();
    assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use accountsStore.accountActions before initialized`);
    let account = accounts[activeAccountId];
    if (accountName) {
        const accountId = accountNamesToAccountIds[accountName];
        account = accounts[accountId];
    }
    validator.validateAccountsActionsPublishCommentEditArguments({ publishCommentEditOptions, accountName, account });
    let createCommentEditOptions = Object.assign({ timestamp: Math.round(Date.now() / 1000), author: account.author, signer: account.signer }, publishCommentEditOptions);
    delete createCommentEditOptions.onChallenge;
    delete createCommentEditOptions.onChallengeVerification;
    delete createCommentEditOptions.onError;
    delete createCommentEditOptions.onPublishingStateChange;
    let commentEdit = yield account.plebbit.createCommentEdit(createCommentEditOptions);
    const publishAndRetryFailedChallengeVerification = () => __awaiter(void 0, void 0, void 0, function* () {
        var _h;
        commentEdit.once('challenge', (challenge) => __awaiter(void 0, void 0, void 0, function* () {
            publishCommentEditOptions.onChallenge(challenge, commentEdit);
        }));
        commentEdit.once('challengeverification', (challengeVerification) => __awaiter(void 0, void 0, void 0, function* () {
            publishCommentEditOptions.onChallengeVerification(challengeVerification, commentEdit);
            if (!challengeVerification.challengeSuccess) {
                // publish again automatically on fail
                createCommentEditOptions = Object.assign(Object.assign({}, createCommentEditOptions), { timestamp: Math.round(Date.now() / 1000) });
                commentEdit = yield account.plebbit.createCommentEdit(createCommentEditOptions);
                publishAndRetryFailedChallengeVerification();
            }
        }));
        commentEdit.on('error', (error) => { var _a; return (_a = publishCommentEditOptions.onError) === null || _a === void 0 ? void 0 : _a.call(publishCommentEditOptions, error, commentEdit); });
        // TODO: add publishingState to account edits
        commentEdit.on('publishingstatechange', (publishingState) => { var _a; return (_a = publishCommentEditOptions.onPublishingStateChange) === null || _a === void 0 ? void 0 : _a.call(publishCommentEditOptions, publishingState); });
        listeners.push(commentEdit);
        try {
            // publish will resolve after the challenge request
            // if it fails before, like failing to resolve ENS, we can emit the error
            yield commentEdit.publish();
        }
        catch (error) {
            (_h = publishCommentEditOptions.onError) === null || _h === void 0 ? void 0 : _h.call(publishCommentEditOptions, error, commentEdit);
        }
    });
    publishAndRetryFailedChallengeVerification();
    yield accountsDatabase.addAccountEdit(account.id, createCommentEditOptions);
    log('accountsActions.publishCommentEdit', { createCommentEditOptions });
    accountsStore.setState(({ accountsEdits }) => {
        // remove signer and author because not needed and they expose private key
        const commentEdit = Object.assign(Object.assign({}, createCommentEditOptions), { signer: undefined, author: undefined });
        let commentEdits = accountsEdits[account.id][createCommentEditOptions.commentCid] || [];
        commentEdits = [...commentEdits, commentEdit];
        return {
            accountsEdits: Object.assign(Object.assign({}, accountsEdits), { [account.id]: Object.assign(Object.assign({}, accountsEdits[account.id]), { [createCommentEditOptions.commentCid]: commentEdits }) }),
        };
    });
});
export const publishSubplebbitEdit = (subplebbitAddress, publishSubplebbitEditOptions, accountName) => __awaiter(void 0, void 0, void 0, function* () {
    var _j;
    const { accounts, accountNamesToAccountIds, activeAccountId } = accountsStore.getState();
    assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use accountsStore.accountActions before initialized`);
    let account = accounts[activeAccountId];
    if (accountName) {
        const accountId = accountNamesToAccountIds[accountName];
        account = accounts[accountId];
    }
    validator.validateAccountsActionsPublishSubplebbitEditArguments({ subplebbitAddress, publishSubplebbitEditOptions, accountName, account });
    // account is the owner of the subplebbit and can edit it locally, no need to publish
    const localSubplebbitAddresses = yield account.plebbit.listSubplebbits();
    if (localSubplebbitAddresses.includes(subplebbitAddress)) {
        yield subplebbitsStore.getState().editSubplebbit(subplebbitAddress, publishSubplebbitEditOptions, account);
        // create fake success challenge verification for consistent behavior with remote subplebbit edit
        publishSubplebbitEditOptions.onChallengeVerification({ challengeSuccess: true });
        (_j = publishSubplebbitEditOptions.onPublishingStateChange) === null || _j === void 0 ? void 0 : _j.call(publishSubplebbitEditOptions, 'succeeded');
        return;
    }
    assert(!publishSubplebbitEditOptions.address || publishSubplebbitEditOptions.address === subplebbitAddress, `accountsActions.publishSubplebbitEdit can't edit address of a remote subplebbit`);
    let createSubplebbitEditOptions = Object.assign(Object.assign({ timestamp: Math.round(Date.now() / 1000), author: account.author, signer: account.signer }, publishSubplebbitEditOptions), { 
        // not possible to edit subplebbit.address over pubsub, only locally
        address: subplebbitAddress });
    delete createSubplebbitEditOptions.onChallenge;
    delete createSubplebbitEditOptions.onChallengeVerification;
    delete createSubplebbitEditOptions.onError;
    delete createSubplebbitEditOptions.onPublishingStateChange;
    let subplebbitEdit = yield account.plebbit.createSubplebbitEdit(createSubplebbitEditOptions);
    const publishAndRetryFailedChallengeVerification = () => __awaiter(void 0, void 0, void 0, function* () {
        var _k;
        subplebbitEdit.once('challenge', (challenge) => __awaiter(void 0, void 0, void 0, function* () {
            publishSubplebbitEditOptions.onChallenge(challenge, subplebbitEdit);
        }));
        subplebbitEdit.once('challengeverification', (challengeVerification) => __awaiter(void 0, void 0, void 0, function* () {
            publishSubplebbitEditOptions.onChallengeVerification(challengeVerification, subplebbitEdit);
            if (!challengeVerification.challengeSuccess) {
                // publish again automatically on fail
                createSubplebbitEditOptions = Object.assign(Object.assign({}, createSubplebbitEditOptions), { timestamp: Math.round(Date.now() / 1000) });
                subplebbitEdit = yield account.plebbit.createSubplebbitEdit(createSubplebbitEditOptions);
                publishAndRetryFailedChallengeVerification();
            }
        }));
        subplebbitEdit.on('error', (error) => { var _a; return (_a = publishSubplebbitEditOptions.onError) === null || _a === void 0 ? void 0 : _a.call(publishSubplebbitEditOptions, error, subplebbitEdit); });
        // TODO: add publishingState to account edits
        subplebbitEdit.on('publishingstatechange', (publishingState) => { var _a; return (_a = publishSubplebbitEditOptions.onPublishingStateChange) === null || _a === void 0 ? void 0 : _a.call(publishSubplebbitEditOptions, publishingState); });
        listeners.push(subplebbitEdit);
        try {
            // publish will resolve after the challenge request
            // if it fails before, like failing to resolve ENS, we can emit the error
            yield subplebbitEdit.publish();
        }
        catch (error) {
            (_k = publishSubplebbitEditOptions.onError) === null || _k === void 0 ? void 0 : _k.call(publishSubplebbitEditOptions, error, subplebbitEdit);
        }
    });
    publishAndRetryFailedChallengeVerification();
    log('accountsActions.publishSubplebbitEdit', { createSubplebbitEditOptions });
});
export const createSubplebbit = (createSubplebbitOptions, accountName) => __awaiter(void 0, void 0, void 0, function* () {
    const { accounts, accountNamesToAccountIds, activeAccountId } = accountsStore.getState();
    assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use accountsStore.accountsActions before initialized`);
    let account = accounts[activeAccountId];
    if (accountName) {
        const accountId = accountNamesToAccountIds[accountName];
        account = accounts[accountId];
    }
    const subplebbit = yield subplebbitsStore.getState().createSubplebbit(createSubplebbitOptions, account);
    log('accountsActions.createSubplebbit', { createSubplebbitOptions, subplebbit });
    return subplebbit;
});
export const deleteSubplebbit = (subplebbitAddress, accountName) => __awaiter(void 0, void 0, void 0, function* () {
    const { accounts, accountNamesToAccountIds, activeAccountId } = accountsStore.getState();
    assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use accountsStore.accountsActions before initialized`);
    let account = accounts[activeAccountId];
    if (accountName) {
        const accountId = accountNamesToAccountIds[accountName];
        account = accounts[accountId];
    }
    yield subplebbitsStore.getState().deleteSubplebbit(subplebbitAddress, account);
    log('accountsActions.deleteSubplebbit', { subplebbitAddress });
});
