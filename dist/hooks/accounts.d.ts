import type { UseAccountCommentsOptions, AccountNotifications } from '../types';
/**
 * @param accountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, return
 * the active account.
 */
export declare function useAccount(accountName?: string): any;
/**
 * Return all accounts in the order of `AccountsContext.accountIds`. To reorder, use `accountsActions.setAccountsOrder(accountNames)`.
 */
export declare function useAccounts(): any[] | undefined;
/**
 * Returns all the accounts related actions, like {createAccount, publishComment, publishVote, etc.}
 */
export declare function useAccountsActions(): any;
/**
 * Returns all subplebbits where the account is a creator or moderator
 */
export declare function useAccountSubplebbits(accountName?: string): any;
/**
 * Returns an account's notifications in an array. Unread notifications have a field markedAsRead: false.
 *
 * @param accountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, return
 * the active account's notifications.
 */
export declare function useAccountNotifications(accountName?: string): {
    notifications: AccountNotifications | undefined;
    markAsRead: () => void;
};
/**
 * Returns the own user's comments stored locally, even those not yet published by the subplebbit owner.
 * Check UseAccountCommentsOptions type in types.tsx to filter them, e.g. filter = {subplebbitAddresses: ['memes.eth']}.
 */
export declare function useAccountComments(useAccountCommentsOptions?: UseAccountCommentsOptions): any[] | undefined;
/**
 * Returns the own user's votes stored locally, even those not yet published by the subplebbit owner.
 * Check UseAccountCommentsOptions type in types.tsx to filter them, e.g. filter = {subplebbitAddresses: ['memes.eth']}.
 */
export declare function useAccountVotes(useAccountVotesOptions?: UseAccountCommentsOptions): any[] | undefined;
/**
 * Returns an account's single vote on a comment, e.g. to know if you already voted on a comment.
 */
export declare function useAccountVote(commentCid?: string, accountName?: string): any;
