import type { UseAccountCommentsOptions } from '../types';
/**
 * @param accountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, return
 * the active account.
 */
export declare function useAccount(accountName?: string): any;
/**
 * Return all accounts in the order of `AccountsContext.accountIds`. To reorder, use `accountsActions.setAccountsOrder(accountNames)`
 */
export declare function useAccounts(): any[] | undefined;
export declare function useAccountsActions(): any;
/**
 * Returns the own user's comments stored locally, even those not yet published by the subplebbit owner
 */
export declare function useAccountComments(useAccountCommentsOptions?: UseAccountCommentsOptions): any[] | undefined;
/**
 * Returns the own user's votes stored locally, even those not yet published by the subplebbit owner
 */
export declare function useAccountVotes(useAccountVotesOptions?: UseAccountCommentsOptions): any[] | undefined;
export declare function useAccountVote(commentCid?: string, accountName?: string): any;
