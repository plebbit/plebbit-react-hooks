import { useMemo } from 'react';
import useAccountsStore from '../../stores/accounts';
import Logger from '@plebbit/plebbit-logger';
const log = Logger('plebbit-react-hooks:hooks:accounts');
import { useListSubplebbits, useSubplebbits } from '../subplebbits';
import { filterPublications, useAccountsWithCalculatedProperties, useAccountsNotifications } from './utils';
/**
 * @param accountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, return
 * the active account id.
 */
function useAccountId(accountName) {
    const accountId = useAccountsStore((state) => state.accountNamesToAccountIds[accountName || '']);
    // don't consider active account if account name is defined
    const activeAccountId = useAccountsStore((state) => !accountName && state.activeAccountId);
    const accountIdToUse = accountName ? accountId : activeAccountId;
    return accountIdToUse;
}
/**
 * @param accountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, return
 * the active account.
 */
export function useAccount(accountName) {
    // get state
    const accountId = useAccountId(accountName);
    const accountStore = useAccountsStore((state) => state.accounts[accountId || '']);
    const accountComments = useAccountsStore((state) => state.accountsComments[accountId || '']);
    const accountCommentsReplies = useAccountsStore((state) => state.accountsCommentsReplies[accountId || '']);
    // create objects arguments for useAccountsWithCalculatedProperties
    const accounts = {};
    const accountsComments = {};
    const accountsCommentsReplies = {};
    if (accountStore === null || accountStore === void 0 ? void 0 : accountStore.id) {
        accounts[accountStore.id] = accountStore;
        if (accountComments) {
            accountsComments[accountStore.id] = accountComments;
        }
        if (accountCommentsReplies) {
            accountsCommentsReplies[accountStore.id] = accountCommentsReplies;
        }
    }
    const accountsWithCalculatedProperties = useAccountsWithCalculatedProperties(accounts, accountsComments, accountsCommentsReplies);
    const account = accountId && (accountsWithCalculatedProperties === null || accountsWithCalculatedProperties === void 0 ? void 0 : accountsWithCalculatedProperties[accountId]);
    log('useAccount', { accountId, account, accountName });
    return account;
}
/**
 * Return all accounts in the order of `accountsStore.accountIds`. To reorder, use `accountsActions.setAccountsOrder(accountNames)`.
 */
export function useAccounts() {
    const accountIds = useAccountsStore((state) => state.accountIds);
    const accountsStore = useAccountsStore((state) => state.accounts);
    const accountsComments = useAccountsStore((state) => state.accountsComments);
    const accountsCommentsReplies = useAccountsStore((state) => state.accountsCommentsReplies);
    const accounts = useAccountsWithCalculatedProperties(accountsStore, accountsComments, accountsCommentsReplies);
    const accountsArray = [];
    if ((accountIds === null || accountIds === void 0 ? void 0 : accountIds.length) && accounts) {
        for (const accountId of accountIds) {
            accountsArray.push(accounts[accountId]);
        }
        return accountsArray;
    }
    log('useAccounts', { accounts, accountIds });
    return accountsArray;
}
/**
 * Returns all the accounts related actions, like {createAccount, publishComment, publishVote, etc.}
 */
export function useAccountsActions() {
    const accountsActions = useAccountsStore((state) => state.accountsActions);
    return accountsActions;
}
/**
 * Returns all subplebbits where the account is a creator or moderator
 */
export function useAccountSubplebbits(accountName) {
    const accountId = useAccountId(accountName);
    const accountsStoreAccountSubplebbits = useAccountsStore((state) => { var _a; return (_a = state.accounts[accountId || '']) === null || _a === void 0 ? void 0 : _a.subplebbits; });
    // get all unique account subplebbit addresses
    const ownerSubplebbitAddresses = useListSubplebbits();
    const accountSubplebbitAddresses = [];
    if (accountsStoreAccountSubplebbits) {
        for (const subplebbitAddress in accountsStoreAccountSubplebbits) {
            accountSubplebbitAddresses.push(subplebbitAddress);
        }
    }
    const uniqueSubplebbitAddresses = [...new Set([...ownerSubplebbitAddresses, ...accountSubplebbitAddresses])].sort();
    // fetch all subplebbit data
    const subplebbitsArray = useSubplebbits(uniqueSubplebbitAddresses, accountName);
    const subplebbits = {};
    for (const [i, subplebbit] of subplebbitsArray.entries()) {
        subplebbits[uniqueSubplebbitAddresses[i]] = Object.assign(Object.assign({}, subplebbit), { 
            // make sure the address is defined if the subplebbit hasn't fetched yet
            address: uniqueSubplebbitAddresses[i] });
    }
    // merged subplebbit data with account.subplebbits data
    const accountSubplebbits = Object.assign({}, subplebbits);
    if (accountsStoreAccountSubplebbits) {
        for (const subplebbitAddress in accountsStoreAccountSubplebbits) {
            accountSubplebbits[subplebbitAddress] = Object.assign(Object.assign({}, accountSubplebbits[subplebbitAddress]), accountsStoreAccountSubplebbits[subplebbitAddress]);
        }
    }
    // add listSubplebbits data
    for (const subplebbitAddress in accountSubplebbits) {
        if (ownerSubplebbitAddresses.includes(subplebbitAddress)) {
            accountSubplebbits[subplebbitAddress].role = { role: 'owner' };
        }
    }
    if (accountId) {
        log('useAccountSubplebbits', { accountSubplebbits });
    }
    return accountSubplebbits;
}
/**
 * Returns an account's notifications in an array. Unread notifications have a field markedAsRead: false.
 *
 * @param accountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, return
 * the active account's notifications.
 */
export function useAccountNotifications(accountName) {
    // get state
    const accountId = useAccountId(accountName);
    const account = useAccountsStore((state) => state.accounts[accountId || '']);
    const accountCommentsReplies = useAccountsStore((state) => state.accountsCommentsReplies[accountId || '']);
    const accountsActionsInternal = useAccountsStore((state) => state.accountsActionsInternal);
    // create objects arguments for useAccountsNotifications
    const accounts = {};
    const accountsCommentsReplies = {};
    if (account === null || account === void 0 ? void 0 : account.id) {
        accounts[account.id] = account;
        if (accountCommentsReplies) {
            accountsCommentsReplies[account.id] = accountCommentsReplies;
        }
    }
    const accountsNotifications = useAccountsNotifications(accounts, accountsCommentsReplies);
    const notifications = (accountId && (accountsNotifications === null || accountsNotifications === void 0 ? void 0 : accountsNotifications[accountId])) || [];
    const markAsRead = () => {
        if (!account) {
            throw Error('useAccountNotifications cannot mark as read accounts not initalized yet');
        }
        accountsActionsInternal.markAccountNotificationsAsRead(account);
    };
    if (account) {
        log('useAccountNotifications', { notifications });
    }
    return { notifications, markAsRead };
}
/**
 * Returns the own user's comments stored locally, even those not yet published by the subplebbit owner.
 * Check UseAccountCommentsOptions type in types.tsx to filter them, e.g. filter = {subplebbitAddresses: ['memes.eth']}.
 */
export function useAccountComments(useAccountCommentsOptions) {
    const accountId = useAccountId(useAccountCommentsOptions === null || useAccountCommentsOptions === void 0 ? void 0 : useAccountCommentsOptions.accountName);
    const accountComments = useAccountsStore((state) => state.accountsComments[accountId || '']);
    const filteredAccountComments = useMemo(() => {
        if (!accountComments) {
            return;
        }
        if (useAccountCommentsOptions === null || useAccountCommentsOptions === void 0 ? void 0 : useAccountCommentsOptions.filter) {
            return filterPublications(accountComments, useAccountCommentsOptions.filter);
        }
        return accountComments;
        // use stringify on useAccountCommentsOptions because the argument object could change
        // while still having the same value, or stay the same, while having different values
    }, [accountComments, JSON.stringify(useAccountCommentsOptions)]);
    if (accountComments && useAccountCommentsOptions) {
        log('useAccountComments', { accountId, filteredAccountComments, accountComments, useAccountCommentsOptions });
    }
    return filteredAccountComments;
}
/**
 * Returns the own user's votes stored locally, even those not yet published by the subplebbit owner.
 * Check UseAccountCommentsOptions type in types.tsx to filter them, e.g. filter = {subplebbitAddresses: ['memes.eth']}.
 */
export function useAccountVotes(useAccountVotesOptions) {
    const accountId = useAccountId(useAccountVotesOptions === null || useAccountVotesOptions === void 0 ? void 0 : useAccountVotesOptions.accountName);
    const accountVotes = useAccountsStore((state) => state.accountsVotes[accountId || '']);
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
        // use stringify on useAccountVotesOptions because the argument object could change
        // while still having the same value, or stay the same, while having different values
    }, [accountVotes, JSON.stringify(useAccountVotesOptions)]);
    if (accountVotes && useAccountVotesOptions) {
        log('useAccountVotes', { accountId, filteredAccountVotesArray, accountVotes, useAccountVotesOptions });
    }
    return filteredAccountVotesArray;
}
/**
 * Returns an account's single vote on a comment, e.g. to know if you already voted on a comment.
 */
export function useAccountVote(commentCid, accountName) {
    const accountId = useAccountId(accountName);
    const accountVotes = useAccountsStore((state) => state.accountsVotes[accountId || '']);
    return commentCid && accountVotes[commentCid];
}
