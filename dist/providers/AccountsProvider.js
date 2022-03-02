var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useState, useEffect } from 'react';
import PlebbitJs from '../plebbit-js';
import assert from 'assert';
import localForage from 'localforage';
const accountsDatabase = localForage.createInstance({ name: 'accounts' });
const accountsMetadataDatabase = localForage.createInstance({ name: 'accountsMetadata' });
import Debug from 'debug';
const debug = Debug('plebbitreacthooks:providers:accountsprovider');
const getAccountsFromDatabase = (accountNames) => __awaiter(void 0, void 0, void 0, function* () {
    assert(Array.isArray(accountNames), `getAccountsFromDatabase accountNames '${accountNames}' not an array`);
    assert(accountNames.length > 0, `getAccountsFromDatabase accountNames '${accountNames}' is empty`);
    for (const accountName of accountNames) {
        assert(typeof accountName === 'string', `getAccountsFromDatabase accountNames '${accountNames}' accountName '${accountName}' not a string`);
        assert(accountName !== '', `getAccountsFromDatabase accountNames '${accountNames}' an accountName argument is empty string`);
    }
    const accounts = {};
    const promises = [];
    for (const accountName of accountNames) {
        promises.push(accountsDatabase.getItem(accountName));
    }
    const accountsArray = yield Promise.all(promises);
    for (const [i, accountName] of accountNames.entries()) {
        assert(accountsArray[i], `accountName '${accountName}' not found in database`);
        accounts[accountName] = accountsArray[i];
        accounts[accountName].plebbit = PlebbitJs.Plebbit(accounts[accountName].plebbitOptions);
    }
    return accounts;
});
const getAccountFromDatabase = (accountName) => __awaiter(void 0, void 0, void 0, function* () {
    const accounts = yield getAccountsFromDatabase([accountName]);
    return accounts[accountName];
});
const addAccountToDatabase = (account) => __awaiter(void 0, void 0, void 0, function* () {
    assert(account && typeof account === 'object', `addAccountToDatabase account '${account}' not an object`);
    assert(typeof account.name === 'string', `addAccountToDatabase account.name '${account.name}' not a string`);
    const accountToPutInDatabase = Object.assign(Object.assign({}, account), { plebbit: undefined });
    yield accountsDatabase.setItem(accountToPutInDatabase.name, accountToPutInDatabase);
});
const createDefaultAccount = () => __awaiter(void 0, void 0, void 0, function* () {
    // TODO: a default account will probably not be exactly like this
    const signer = {}; // TODO: generate new signer
    const author = {
        displayName: null,
        address: 'Qm...', // TODO: get address of signer
    };
    const plebbitOptions = {
        ipfsGatewayUrl: 'https://cloudflare-ipfs',
        ipfsApiUrl: 'http://localhost:8080',
    };
    const accountName = yield getNextAvailableDefaultAccountName();
    const account = {
        name: accountName,
        author,
        signer,
        plebbit: PlebbitJs.Plebbit(plebbitOptions),
        plebbitOptions,
        subscriptions: [],
        addressesLimits: {},
    };
    return account;
});
const getNextAvailableDefaultAccountName = () => __awaiter(void 0, void 0, void 0, function* () {
    const accountNames = yield accountsMetadataDatabase.getItem('accountNames');
    let accountNumber = 1;
    if (!accountNames) {
        return `Account ${accountNumber}`;
    }
    assert(Array.isArray(accountNames), `getNextAvailableDefaultAccountName accountNames '${accountNames}' not an array`);
    for (const accountName of accountNames) {
        assert(typeof accountName === 'string', `getNextAvailableDefaultAccountName accountNames '${accountNames}' accountName '${accountName}' not a string`);
    }
    const accountNamesSet = new Set(accountNames);
    while (true) {
        const accountName = `Account ${accountNumber}`;
        if (!accountNamesSet.has(accountName)) {
            return accountName;
        }
        accountNumber++;
    }
});
export const AccountsContext = React.createContext(undefined);
export default function AccountsProvider(props) {
    const [accounts, setAccounts] = useState(undefined);
    const [accountNames, setAccountNames] = useState(undefined);
    const [activeAccountName, setActiveAccountName] = useState(undefined);
    const accountsActions = {};
    accountsActions.setActiveAccountName = (accountName) => __awaiter(this, void 0, void 0, function* () {
        assert(typeof accountName === 'string', `setActiveAccountName accountName '${accountName}' not a string`);
        assert(accountName !== '', `setActiveAccountName accountName argument is empty string`);
        yield accountsMetadataDatabase.setItem('activeAccountName', accountName);
        debug('accountsActions.setActiveAccountName', { accountName });
        setActiveAccountName(accountName);
    });
    accountsActions.setAccount = (accountNameToSet, account) => __awaiter(this, void 0, void 0, function* () {
        assert(typeof accountNameToSet === 'string', `setAccount accountNameToSet '${accountNameToSet}' not a string`);
        assert(accountNameToSet !== '', `setAccount accountNameToSet argument is empty string`);
        assert(account && typeof account === 'object', `setAccount account '${account}' not an object`);
        // use this function to serialize
        yield addAccountToDatabase(account);
        // use this function to deserialize
        const newAccount = yield getAccountFromDatabase(account.name);
        const newAccounts = Object.assign(Object.assign({}, accounts), { [newAccount.name]: newAccount });
        const newAccountNames = [...accountNames];
        // handle an account name change
        if (newAccount.name !== accountNameToSet) {
            if (activeAccountName === accountNameToSet) {
                setActiveAccountName(newAccount.name);
            }
            // delete old account
            yield accountsDatabase.removeItem(accountNameToSet);
            delete newAccounts[accountNameToSet];
            // delete old account name
            const previousAccountNameIndex = newAccountNames.indexOf(accountNameToSet);
            newAccountNames[previousAccountNameIndex] = newAccount.name;
        }
        debug('accountsActions.setAccount', { accountNameToSet, account: newAccount });
        setAccounts(newAccounts);
        setAccountNames(newAccountNames);
    });
    accountsActions.createAccount = (accountName) => __awaiter(this, void 0, void 0, function* () {
        const newAccount = yield createDefaultAccount();
        if (accountName) {
            assert(typeof accountName === 'string', `createAccount accountName '${accountName}' not a string`);
            assert(accountName !== '', `createAccount accountName argument is empty string`);
            assert(!accountNames.includes(accountName), `createAccount accountName '${accountName}' already exists in database`);
            newAccount.name = accountName;
        }
        const newAccountNames = [...accountNames, newAccount.name];
        const newAccounts = Object.assign(Object.assign({}, accounts), { [newAccount.name]: newAccount });
        yield Promise.all([
            accountsMetadataDatabase.setItem('accountNames', newAccountNames),
            addAccountToDatabase(newAccount),
        ]);
        debug('accountsActions.createAccount', { accountName, account: newAccount });
        setAccounts(newAccounts);
        setAccountNames(newAccountNames);
    });
    accountsActions.deleteAccount = (accountName) => __awaiter(this, void 0, void 0, function* () {
        throw Error('TODO: not implemented');
        // TODO: delete account from provider and from persistant storage
        // change active account to another active account
        // handle the edge case of a user deleting all his account and having none
        // warn user to back up his private key or lose his account permanently
    });
    accountsActions.importAccount = (serializedAccount) => __awaiter(this, void 0, void 0, function* () {
        throw Error('TODO: not implemented');
        // TODO: deserialize account, import account, if account.name already exists, add ' 2', don't overwrite
        // the 'account' will contain AccountComments and AccountVotes
        // TODO: add options to only import private key, account settings, or include all account comments/votes history
    });
    accountsActions.exportAccount = (accountName) => __awaiter(this, void 0, void 0, function* () {
        throw Error('TODO: not implemented');
        // TODO: return account as serialized JSON string for copy paste or save as file
        // the 'account' will contain AccountComments and AccountVotes
        // TODO: add options to only export private key, account settings, or include all account comments/votes history
    });
    accountsActions.setAccountsOrder = (newOrderedAccountNames) => __awaiter(this, void 0, void 0, function* () {
        assert(JSON.stringify([...accountNames].sort()) === JSON.stringify([...newOrderedAccountNames].sort()), `previous account names '${accountNames} contain different account names than argument newOrderedAccountNames '${newOrderedAccountNames}'`);
        debug('accountsActions.setAccountsOrder', {
            previousAccountNames: accountNames,
            newAccountNames: newOrderedAccountNames,
        });
        yield accountsMetadataDatabase.setItem('accountNames', newOrderedAccountNames);
        setAccountNames(newOrderedAccountNames);
    });
    // load accounts from database once on load
    useEffect(() => {
        ;
        (() => __awaiter(this, void 0, void 0, function* () {
            let accountNames, activeAccountName, accounts;
            accountNames = yield accountsMetadataDatabase.getItem('accountNames');
            // get accounts from database if any
            if (accountNames === null || accountNames === void 0 ? void 0 : accountNames.length) {
                ;
                [activeAccountName, accounts] = yield Promise.all([
                    accountsMetadataDatabase.getItem('activeAccountName'),
                    getAccountsFromDatabase(accountNames),
                ]);
            }
            // no accounts in database, generate a default account
            else {
                const defaultAccount = yield createDefaultAccount();
                accountNames = [defaultAccount.name];
                activeAccountName = defaultAccount.name;
                accounts = { [defaultAccount.name]: defaultAccount };
                yield Promise.all([
                    accountsMetadataDatabase.setItem('accountNames', accountNames),
                    accountsMetadataDatabase.setItem('activeAccountName', activeAccountName),
                    addAccountToDatabase(defaultAccount),
                ]);
            }
            setAccounts(accounts);
            setAccountNames(accountNames);
            setActiveAccountName(activeAccountName);
        }))();
    }, []);
    if (!props.children) {
        return null;
    }
    // don't give access to any context until first load
    let accountsContext;
    if (accountNames && activeAccountName && accounts) {
        accountsContext = {
            accounts,
            accountNames,
            activeAccountName,
            accountsActions,
        };
    }
    debug({
        accountsContext: accountsContext && {
            accounts: accountsContext.accounts,
            accountNames: accountsContext.accountNames,
            activeAccountName: accountsContext.activeAccountName,
        },
    });
    return React.createElement(AccountsContext.Provider, { value: accountsContext }, props.children);
}
