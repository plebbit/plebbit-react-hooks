import { useMemo, useContext } from 'react';
import { AccountsContext } from '../providers/accounts-provider';
import Debug from 'debug';
const debug = Debug('plebbitreacthooks:hooks:accounts');
import assert from 'assert';
/**
 * @param accountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, return
 * the active account id.
 */
function useAccountId(accountName) {
    const accountsContext = useContext(AccountsContext);
    const accountId = accountName && (accountsContext === null || accountsContext === void 0 ? void 0 : accountsContext.accountNamesToAccountIds[accountName]);
    const activeAccountId = accountsContext === null || accountsContext === void 0 ? void 0 : accountsContext.activeAccountId;
    const accountIdToUse = accountName ? accountId : activeAccountId;
    return accountIdToUse;
}
/**
 * @param accountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, return
 * the active account.
 */
export function useAccount(accountName) {
    const accountsContext = useContext(AccountsContext);
    const accountId = useAccountId(accountName);
    const account = accountsContext === null || accountsContext === void 0 ? void 0 : accountsContext.accounts[accountId];
    debug('useAccount', { accountId, account, accountName: account === null || account === void 0 ? void 0 : account.name });
    return account;
}
/**
 * Return all accounts in the order of `AccountsContext.accountIds`. To reorder, use `accountsActions.setAccountsOrder(accountNames)`.
 */
export function useAccounts() {
    var _a;
    const accountsContext = useContext(AccountsContext);
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
/**
 * Returns all the accounts related actions, like {createAccount, publishComment, publishVote, etc.}
 */
export function useAccountsActions() {
    const accountsContext = useContext(AccountsContext);
    if (accountsContext) {
        return accountsContext.accountsActions;
    }
    // return empty object for deconstructing without errors if context isn't ready
    // e.g. const {createAccount} = useAccountsActions()
    // TODO: possibly return functions that throw 'not ready', or promises that wait until ready
    return {};
}
/**
 * Returns an account's notifications in an array. Unread notifications have a field markedAsRead: false.
 *
 * @param accountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, return
 * the active account's notifications.
 */
export function useAccountNotifications(accountName) {
    const accountsContext = useContext(AccountsContext);
    const accountId = useAccountId(accountName);
    const account = accountsContext === null || accountsContext === void 0 ? void 0 : accountsContext.accounts[accountId];
    let notifications;
    if (account) {
        notifications = accountsContext === null || accountsContext === void 0 ? void 0 : accountsContext.accountsNotifications[accountId];
    }
    const markAsRead = () => {
        if (!account) {
            throw Error('useAccountNotifications cannot mark as read accounts not initalized yet');
        }
        accountsContext === null || accountsContext === void 0 ? void 0 : accountsContext.markAccountNotificationsAsRead(account);
    };
    debug('useAccountNotifications', { notifications });
    return { notifications, markAsRead };
}
/**
 * Returns the own user's comments stored locally, even those not yet published by the subplebbit owner.
 * Check UseAccountCommentsOptions type in types.tsx to filter them, e.g. filter = {subplebbitAddresses: ['memes.eth']}.
 */
export function useAccountComments(useAccountCommentsOptions) {
    const accountId = useAccountId(useAccountCommentsOptions === null || useAccountCommentsOptions === void 0 ? void 0 : useAccountCommentsOptions.accountName);
    const accountsContext = useContext(AccountsContext);
    let accountComments;
    if (accountId && accountsContext) {
        accountComments = accountsContext.accountsComments[accountId];
    }
    const filteredAccountComments = useMemo(() => {
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
/**
 * Returns the own user's votes stored locally, even those not yet published by the subplebbit owner.
 * Check UseAccountCommentsOptions type in types.tsx to filter them, e.g. filter = {subplebbitAddresses: ['memes.eth']}.
 */
export function useAccountVotes(useAccountVotesOptions) {
    const accountId = useAccountId(useAccountVotesOptions === null || useAccountVotesOptions === void 0 ? void 0 : useAccountVotesOptions.accountName);
    const accountsContext = useContext(AccountsContext);
    let accountVotes;
    if (accountId && accountsContext) {
        accountVotes = accountsContext.accountsVotes[accountId];
    }
    const filteredAccountVotesArray = useMemo(() => {
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
/**
 * Returns an account's single vote on a comment, e.g. to know if you already voted on a comment.
 */
export function useAccountVote(commentCid, accountName) {
    const useAccountVotesOptions = { accountName };
    if (commentCid) {
        useAccountVotesOptions.filter = { commentCids: [commentCid] };
    }
    const accountVotes = useAccountVotes(useAccountVotesOptions);
    return accountVotes && accountVotes[0];
}
/**
 * Filter publications, for example only get comments that are posts, votes in a certain subplebbit, etc.
 * Check UseAccountCommentsFilter type in types.tsx for more information, e.g. filter = {subplebbitAddresses: ['memes.eth']}.
 */
const filterPublications = (publications, filter) => {
    var _a, _b, _c, _d;
    for (const postCid of filter.postCids || []) {
        assert(postCid && typeof postCid === 'string', `accountCommentsFilter postCid '${postCid}' not a string`);
    }
    for (const subplebbitAddress of filter.subplebbitAddresses || []) {
        assert(subplebbitAddress && typeof subplebbitAddress === 'string', `accountCommentsFilter subplebbitAddress '${subplebbitAddress}' not a string`);
    }
    for (const commentCid of filter.commentCids || []) {
        assert(commentCid && typeof commentCid === 'string', `accountCommentsFilter commentCid '${commentCid}' not a string`);
    }
    for (const parentCommentCid of filter.parentCommentCids || []) {
        assert(parentCommentCid && typeof parentCommentCid === 'string', `accountCommentsFilter parentCommentCid '${parentCommentCid}' not a string`);
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
