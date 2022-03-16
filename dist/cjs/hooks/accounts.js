"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAccountVote = exports.useAccountVotes = exports.useAccountComments = exports.useAccountsActions = exports.useAccounts = exports.useAccount = void 0;
const react_1 = require("react");
const accounts_provider_1 = require("../providers/accounts-provider");
const debug_1 = __importDefault(require("debug"));
const debug = (0, debug_1.default)('plebbitreacthooks:hooks:accounts');
const assert_1 = __importDefault(require("assert"));
/**
 * @param accountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, return
 * the active account id.
 */
function useAccountId(accountName) {
    const accountsContext = (0, react_1.useContext)(accounts_provider_1.AccountsContext);
    const accountId = accountName && (accountsContext === null || accountsContext === void 0 ? void 0 : accountsContext.accountNamesToAccountIds[accountName]);
    const activeAccountId = accountsContext === null || accountsContext === void 0 ? void 0 : accountsContext.activeAccountId;
    const accountIdToUse = accountName ? accountId : activeAccountId;
    return accountIdToUse;
}
/**
 * @param accountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, return
 * the active account.
 */
function useAccount(accountName) {
    const accountsContext = (0, react_1.useContext)(accounts_provider_1.AccountsContext);
    const accountId = useAccountId(accountName);
    const account = accountsContext === null || accountsContext === void 0 ? void 0 : accountsContext.accounts[accountId];
    debug('useAccount', { accountId, account, accountName: account === null || account === void 0 ? void 0 : account.name });
    return account;
}
exports.useAccount = useAccount;
/**
 * Return all accounts in the order of `AccountsContext.accountIds`. To reorder, use `accountsActions.setAccountsOrder(accountNames)`
 */
function useAccounts() {
    var _a;
    const accountsContext = (0, react_1.useContext)(accounts_provider_1.AccountsContext);
    let accounts;
    if (((_a = accountsContext === null || accountsContext === void 0 ? void 0 : accountsContext.accountIds) === null || _a === void 0 ? void 0 : _a.length) && (accountsContext === null || accountsContext === void 0 ? void 0 : accountsContext.accounts)) {
        accounts = [];
        for (const accountId of accountsContext.accountIds) {
            accounts.push(accountsContext.accounts[accountId]);
        }
        return accounts;
    }
    debug('useAccounts', { accounts, accountIds: accountsContext === null || accountsContext === void 0 ? void 0 : accountsContext.accountIds });
    return accounts;
}
exports.useAccounts = useAccounts;
function useAccountsActions() {
    const accountsContext = (0, react_1.useContext)(accounts_provider_1.AccountsContext);
    if (accountsContext) {
        return accountsContext.accountsActions;
    }
    // return empty object for deconstructing without errors
    // e.g. const {createAccount} = useAccountsActions()
    // TODO: possibly return functions that throw 'not ready', or promises that wait until ready
    return {};
}
exports.useAccountsActions = useAccountsActions;
/**
 * Returns the own user's comments stored locally, even those not yet published by the subplebbit owner
 */
function useAccountComments(useAccountCommentsOptions) {
    const accountId = useAccountId(useAccountCommentsOptions === null || useAccountCommentsOptions === void 0 ? void 0 : useAccountCommentsOptions.accountName);
    const accountsContext = (0, react_1.useContext)(accounts_provider_1.AccountsContext);
    let accountComments;
    if (accountId && accountsContext) {
        accountComments = accountsContext.accountsComments[accountId];
    }
    const filteredAccountComments = (0, react_1.useMemo)(() => {
        if (!accountComments) {
            return;
        }
        if (useAccountCommentsOptions === null || useAccountCommentsOptions === void 0 ? void 0 : useAccountCommentsOptions.filter) {
            return filterPublications(accountComments, useAccountCommentsOptions.filter);
        }
        return accountComments;
    }, [accountComments, useAccountCommentsOptions]);
    debug('useAccountComments', { accountId, filteredAccountComments, accountComments, useAccountCommentsOptions });
    return filteredAccountComments;
}
exports.useAccountComments = useAccountComments;
/**
 * Returns the own user's votes stored locally, even those not yet published by the subplebbit owner
 */
function useAccountVotes(useAccountVotesOptions) {
    const accountId = useAccountId(useAccountVotesOptions === null || useAccountVotesOptions === void 0 ? void 0 : useAccountVotesOptions.accountName);
    const accountsContext = (0, react_1.useContext)(accounts_provider_1.AccountsContext);
    let accountVotes;
    if (accountId && accountsContext) {
        accountVotes = accountsContext.accountsVotes[accountId];
    }
    const filteredAccountVotesArray = (0, react_1.useMemo)(() => {
        if (!accountVotes) {
            return;
        }
        let accountVotesArray = [];
        for (const i in accountVotes) {
            accountVotesArray.push(accountVotes[i]);
        }
        if (useAccountVotesOptions === null || useAccountVotesOptions === void 0 ? void 0 : useAccountVotesOptions.filter) {
            accountVotesArray = filterPublications(accountVotesArray, useAccountVotesOptions.filter);
        }
        return accountVotesArray;
    }, [accountVotes, useAccountVotesOptions]);
    debug('useAccountVotes', { accountId, filteredAccountVotesArray, accountVotes, useAccountVotesOptions });
    return filteredAccountVotesArray;
}
exports.useAccountVotes = useAccountVotes;
function useAccountVote(commentCid, accountName) {
    const useAccountVotesOptions = { accountName };
    if (commentCid) {
        useAccountVotesOptions.filter = { commentCids: [commentCid] };
    }
    const accountVotes = useAccountVotes(useAccountVotesOptions);
    return accountVotes && accountVotes[0];
}
exports.useAccountVote = useAccountVote;
const filterPublications = (publications, filter) => {
    var _a, _b, _c, _d;
    for (const postCid of filter.postCids || []) {
        (0, assert_1.default)(postCid && typeof postCid === 'string', `accountCommentsFilter postCid '${postCid}' not a string`);
    }
    for (const subplebbitAddress of filter.subplebbitAddresses || []) {
        (0, assert_1.default)(subplebbitAddress && typeof subplebbitAddress === 'string', `accountCommentsFilter subplebbitAddress '${subplebbitAddress}' not a string`);
    }
    for (const commentCid of filter.commentCids || []) {
        (0, assert_1.default)(commentCid && typeof commentCid === 'string', `accountCommentsFilter commentCid '${commentCid}' not a string`);
    }
    for (const parentCommentCid of filter.parentCommentCids || []) {
        (0, assert_1.default)(parentCommentCid && typeof parentCommentCid === 'string', `accountCommentsFilter parentCommentCid '${parentCommentCid}' not a string`);
    }
    const filteredPublications = [];
    for (const publication of publications) {
        let isFilteredOut = false;
        if (((_a = filter.subplebbitAddresses) === null || _a === void 0 ? void 0 : _a.length) && !filter.subplebbitAddresses.includes(publication.subplebbitAddress)) {
            isFilteredOut = true;
        }
        if (((_b = filter.postCids) === null || _b === void 0 ? void 0 : _b.length) && !filter.postCids.includes(publication.postCid)) {
            isFilteredOut = true;
        }
        if (((_c = filter.commentCids) === null || _c === void 0 ? void 0 : _c.length) && !filter.commentCids.includes(publication.commentCid)) {
            isFilteredOut = true;
        }
        if (((_d = filter.parentCommentCids) === null || _d === void 0 ? void 0 : _d.length) && !filter.parentCommentCids.includes(publication.parentCommentCid)) {
            isFilteredOut = true;
        }
        if (typeof filter.hasParentCommentCid === 'boolean' &&
            filter.hasParentCommentCid !== Boolean(publication.parentCommentCid)) {
            isFilteredOut = true;
        }
        if (!isFilteredOut) {
            filteredPublications.push(publication);
        }
    }
    return filteredPublications;
};
