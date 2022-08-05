import { useMemo } from 'react';
import useAccountsStore from '../../stores/accounts';
import Debug from 'debug';
const debug = Debug('plebbit-react-hooks:hooks:accounts');
import { useListSubplebbits, useSubplebbits } from '../subplebbits';
import { filterPublications, useAccountsWithCalculatedProperties, useAccountsNotifications } from './utils';
/**
 * @param accountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, return
 * the active account id.
 */
function useAccountId(accountName) {
    const accountsStore = useAccountsStore();
    const accountId = accountName && (accountsStore === null || accountsStore === void 0 ? void 0 : accountsStore.accountNamesToAccountIds[accountName]);
    const activeAccountId = accountsStore === null || accountsStore === void 0 ? void 0 : accountsStore.activeAccountId;
    const accountIdToUse = accountName ? accountId : activeAccountId;
    return accountIdToUse;
}
/**
 * @param accountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, return
 * the active account.
 */
export function useAccount(accountName) {
    const accountsStore = useAccountsStore();
    const accounts = useAccountsWithCalculatedProperties(accountsStore.accounts, accountsStore.accountsComments, accountsStore.accountsCommentsReplies);
    const accountId = useAccountId(accountName);
    const account = accountId && (accounts === null || accounts === void 0 ? void 0 : accounts[accountId]);
    debug('useAccount', { accountId, account, accountName: account === null || account === void 0 ? void 0 : account.name });
    return account;
}
/**
 * Return all accounts in the order of `accountsStore.accountIds`. To reorder, use `accountsActions.setAccountsOrder(accountNames)`.
 */
export function useAccounts() {
    var _a;
    const accountsStore = useAccountsStore();
    const accounts = useAccountsWithCalculatedProperties(accountsStore.accounts, accountsStore.accountsComments, accountsStore.accountsCommentsReplies);
    const accountsArray = [];
    if (((_a = accountsStore === null || accountsStore === void 0 ? void 0 : accountsStore.accountIds) === null || _a === void 0 ? void 0 : _a.length) && accounts) {
        for (const accountId of accountsStore.accountIds) {
            accountsArray.push(accounts[accountId]);
        }
        return accountsArray;
    }
    debug('useAccounts', { accounts, accountIds: accountsStore === null || accountsStore === void 0 ? void 0 : accountsStore.accountIds });
    return accountsArray;
}
/**
 * Returns all the accounts related actions, like {createAccount, publishComment, publishVote, etc.}
 */
export function useAccountsActions() {
    const accountsStore = useAccountsStore();
    return accountsStore.accountsActions;
}
/**
 * Returns all subplebbits where the account is a creator or moderator
 */
export function useAccountSubplebbits(accountName) {
    const account = useAccount(accountName);
    // get all unique account subplebbit addresses
    const ownerSubplebbitAddresses = useListSubplebbits();
    const accountSubplebbitAddresses = [];
    if (account === null || account === void 0 ? void 0 : account.subplebbits) {
        for (const subplebbitAddress in account.subplebbits) {
            accountSubplebbitAddresses.push(subplebbitAddress);
        }
    }
    const uniqueSubplebbitAddresses = [...new Set([...ownerSubplebbitAddresses, ...accountSubplebbitAddresses])].sort();
    // fetch all subplebbit data
    const subplebbitsArray = useSubplebbits(uniqueSubplebbitAddresses, accountName);
    const subplebbits = {};
    for (const [i, subplebbit] of subplebbitsArray.entries()) {
        subplebbits[uniqueSubplebbitAddresses[i]] = Object.assign({}, subplebbit);
    }
    // merged subplebbit data with account.subplebbits data
    const accountSubplebbits = Object.assign({}, subplebbits);
    if (account === null || account === void 0 ? void 0 : account.subplebbits) {
        for (const subplebbitAddress in account.subplebbits) {
            accountSubplebbits[subplebbitAddress] = Object.assign(Object.assign({}, accountSubplebbits[subplebbitAddress]), account.subplebbits[subplebbitAddress]);
        }
    }
    // add listSubplebbits data
    for (const subplebbitAddress in accountSubplebbits) {
        if (ownerSubplebbitAddresses.includes(subplebbitAddress)) {
            accountSubplebbits[subplebbitAddress].role = { role: 'owner' };
        }
    }
    debug('useAccountSubplebbits', { accountSubplebbits });
    return accountSubplebbits;
}
/**
 * Returns an account's notifications in an array. Unread notifications have a field markedAsRead: false.
 *
 * @param accountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, return
 * the active account's notifications.
 */
export function useAccountNotifications(accountName) {
    const accountsStore = useAccountsStore();
    const accountsNotifications = useAccountsNotifications(accountsStore.accounts, accountsStore.accountsCommentsReplies);
    const accountId = useAccountId(accountName);
    const account = accountId && (accountsStore === null || accountsStore === void 0 ? void 0 : accountsStore.accounts[accountId]);
    const notifications = (accountId && (accountsNotifications === null || accountsNotifications === void 0 ? void 0 : accountsNotifications[accountId])) || [];
    const markAsRead = () => {
        if (!account) {
            throw Error('useAccountNotifications cannot mark as read accounts not initalized yet');
        }
        accountsStore.accountsActionsInternal.markAccountNotificationsAsRead(account);
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
    const accountsStore = useAccountsStore();
    let accountComments;
    if (accountId && accountsStore) {
        accountComments = accountsStore.accountsComments[accountId];
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
    const accountsStore = useAccountsStore();
    let accountVotes;
    if (accountId && accountsStore) {
        accountVotes = accountsStore.accountsVotes[accountId];
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
