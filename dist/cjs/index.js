"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAccountsActions = exports.useAccounts = exports.useAccount = void 0;
const react_1 = require("react");
const AccountsProvider_1 = require("./providers/AccountsProvider");
const debug_1 = __importDefault(require("debug"));
const debug = (0, debug_1.default)('plebbitreacthooks:hooks');
/**
 * @param accountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, return
 * the active account.
 */
function useAccount(accountName) {
    const accountsContext = (0, react_1.useContext)(AccountsProvider_1.AccountsContext);
    const activeAccountName = accountsContext === null || accountsContext === void 0 ? void 0 : accountsContext.activeAccountName;
    const accountNameToUse = accountName || activeAccountName;
    const account = accountsContext === null || accountsContext === void 0 ? void 0 : accountsContext.accounts[accountNameToUse];
    debug({ accountName, account, activeAccountName });
    return account;
}
exports.useAccount = useAccount;
/**
 * Return all accounts in the order of `AccountsContext.accountNames`. To reorder, use `accountsActions.setAccountsOrder(accountNames)`
 */
function useAccounts() {
    var _a;
    const accountsContext = (0, react_1.useContext)(AccountsProvider_1.AccountsContext);
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
exports.useAccounts = useAccounts;
function useAccountsActions() {
    const accountsContext = (0, react_1.useContext)(AccountsProvider_1.AccountsContext);
    if (accountsContext) {
        return accountsContext.accountsActions;
    }
    // return empty object for deconstructing without errors
    // e.g. const {createAccount} = useAccountsActions()
    return {};
}
exports.useAccountsActions = useAccountsActions;
