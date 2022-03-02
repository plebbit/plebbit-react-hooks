import { useContext } from 'react';
import { AccountsContext } from './providers/AccountsProvider';
import Debug from 'debug';
const debug = Debug('plebbitreacthooks:hooks');
/**
 * @param accountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, return
 * the active account.
 */
export function useAccount(accountName) {
    const accountsContext = useContext(AccountsContext);
    const activeAccountName = accountsContext === null || accountsContext === void 0 ? void 0 : accountsContext.activeAccountName;
    const accountNameToUse = accountName || activeAccountName;
    const account = accountsContext === null || accountsContext === void 0 ? void 0 : accountsContext.accounts[accountNameToUse];
    debug({ accountName, account, activeAccountName });
    return account;
}
/**
 * Return all accounts in the order of `AccountsContext.accountNames`. To reorder, use `accountsActions.setAccountsOrder(accountNames)`
 */
export function useAccounts() {
    var _a;
    const accountsContext = useContext(AccountsContext);
    let accounts;
    if (((_a = accountsContext === null || accountsContext === void 0 ? void 0 : accountsContext.accountNames) === null || _a === void 0 ? void 0 : _a.length) && (accountsContext === null || accountsContext === void 0 ? void 0 : accountsContext.accounts)) {
        accounts = [];
        for (const accountName of accountsContext.accountNames) {
            accounts.push(accountsContext.accounts[accountName]);
        }
        return accounts;
    }
    debug({ accounts, accountNames: accountsContext === null || accountsContext === void 0 ? void 0 : accountsContext.accountNames });
    return accounts;
}
export function useAccountsActions() {
    const accountsContext = useContext(AccountsContext);
    if (accountsContext) {
        return accountsContext.accountsActions;
    }
    // return empty object for deconstructing without errors
    // e.g. const {createAccount} = useAccountsActions()
    return {};
}
