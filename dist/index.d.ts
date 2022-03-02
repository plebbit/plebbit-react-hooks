/**
 * @param accountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, return
 * the active account.
 */
export declare function useAccount(accountName?: string): any;
/**
 * Return all accounts in the order of `AccountsContext.accountNames`. To reorder, use `accountsActions.setAccountsOrder(accountNames)`
 */
export declare function useAccounts(): any[] | undefined;
export declare function useAccountsActions(): any;
