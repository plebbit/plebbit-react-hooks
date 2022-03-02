import React, { useState, useEffect } from 'react'
import PlebbitJs from '../plebbit-js'
import assert from 'assert'
import localForage from 'localforage'
const accountsDatabase = localForage.createInstance({ name: 'accounts' })
const accountsMetadataDatabase = localForage.createInstance({ name: 'accountsMetadata' })
import Debug from 'debug'
const debug = Debug('plebbitreacthooks:providers:accountsprovider')

type Props = { children?: React.ReactChild }
// TODO: define Account type
type Account = any
type Accounts = { [key: string]: Account }
// TODO: define AccountsActions type
type AccountsActions = any

const getAccountsFromDatabase = async (accountNames: string[]) => {
  assert(Array.isArray(accountNames), `getAccountsFromDatabase accountNames '${accountNames}' not an array`)
  assert(accountNames.length > 0, `getAccountsFromDatabase accountNames '${accountNames}' is empty`)
  for (const accountName of accountNames) {
    assert(
      typeof accountName === 'string',
      `getAccountsFromDatabase accountNames '${accountNames}' accountName '${accountName}' not a string`
    )
    assert(
      accountName !== '',
      `getAccountsFromDatabase accountNames '${accountNames}' an accountName argument is empty string`
    )
  }
  const accounts: Accounts = {}
  const promises = []
  for (const accountName of accountNames) {
    promises.push(accountsDatabase.getItem(accountName))
  }
  const accountsArray = await Promise.all(promises)
  for (const [i, accountName] of accountNames.entries()) {
    assert(accountsArray[i], `accountName '${accountName}' not found in database`)
    accounts[accountName] = accountsArray[i]
    accounts[accountName].plebbit = PlebbitJs.Plebbit(accounts[accountName].plebbitOptions)
  }
  return accounts
}

const getAccountFromDatabase = async (accountName: string) => {
  const accounts = await getAccountsFromDatabase([accountName])
  return accounts[accountName]
}

const addAccountToDatabase = async (account: Account) => {
  assert(account && typeof account === 'object', `addAccountToDatabase account '${account}' not an object`)
  assert(typeof account.name === 'string', `addAccountToDatabase account.name '${account.name}' not a string`)
  const accountToPutInDatabase = { ...account, plebbit: undefined }
  await accountsDatabase.setItem(accountToPutInDatabase.name, accountToPutInDatabase)
}

const createDefaultAccount = async () => {
  // TODO: a default account will probably not be exactly like this
  const signer = {} // TODO: generate new signer
  const author = {
    displayName: null,
    address: 'Qm...', // TODO: get address of signer
  }
  const plebbitOptions = {
    ipfsGatewayUrl: 'https://cloudflare-ipfs',
    ipfsApiUrl: 'http://localhost:8080',
  }
  const accountName = await getNextAvailableDefaultAccountName()
  const account = {
    name: accountName,
    author,
    signer,
    plebbit: PlebbitJs.Plebbit(plebbitOptions),
    plebbitOptions,
    subscriptions: [],
    addressesLimits: {},
  }
  return account
}

const getNextAvailableDefaultAccountName = async () => {
  const accountNames: string[] | null = await accountsMetadataDatabase.getItem('accountNames')
  let accountNumber = 1
  if (!accountNames) {
    return `Account ${accountNumber}`
  }
  assert(Array.isArray(accountNames), `getNextAvailableDefaultAccountName accountNames '${accountNames}' not an array`)
  for (const accountName of accountNames) {
    assert(
      typeof accountName === 'string',
      `getNextAvailableDefaultAccountName accountNames '${accountNames}' accountName '${accountName}' not a string`
    )
  }
  const accountNamesSet = new Set(accountNames)
  while (true) {
    const accountName = `Account ${accountNumber}`
    if (!accountNamesSet.has(accountName)) {
      return accountName
    }
    accountNumber++
  }
}

export const AccountsContext = React.createContext<Accounts | undefined>(undefined)

export default function AccountsProvider(props: Props): JSX.Element | null {
  const [accounts, setAccounts] = useState<any>(undefined)
  const [accountNames, setAccountNames] = useState<any>(undefined)
  const [activeAccountName, setActiveAccountName] = useState<any>(undefined)

  const accountsActions: AccountsActions = {}

  accountsActions.setActiveAccount = async (accountName: string) => {
    assert(typeof accountName === 'string', `setActiveAccountName accountName '${accountName}' not a string`)
    assert(accountName !== '', `setActiveAccountName accountName argument is empty string`)
    await accountsMetadataDatabase.setItem('activeAccountName', accountName)
    debug('accountsActions.setActiveAccountName', { accountName })
    setActiveAccountName(accountName)
  }

  accountsActions.setAccount = async (accountNameToSet: string, account: Account) => {
    assert(typeof accountNameToSet === 'string', `setAccount accountNameToSet '${accountNameToSet}' not a string`)
    assert(accountNameToSet !== '', `setAccount accountNameToSet argument is empty string`)
    assert(account && typeof account === 'object', `setAccount account '${account}' not an object`)
    // use this function to serialize
    await addAccountToDatabase(account)
    // use this function to deserialize
    const newAccount = await getAccountFromDatabase(account.name)
    const newAccounts = { ...accounts, [newAccount.name]: newAccount }
    const newAccountNames = [...accountNames]
    // handle an account name change
    if (newAccount.name !== accountNameToSet) {
      if (activeAccountName === accountNameToSet) {
        setActiveAccountName(newAccount.name)
      }
      // delete old account
      await accountsDatabase.removeItem(accountNameToSet)
      delete newAccounts[accountNameToSet]
      // delete old account name
      const previousAccountNameIndex = newAccountNames.indexOf(accountNameToSet)
      newAccountNames[previousAccountNameIndex] = newAccount.name
    }
    debug('accountsActions.setAccount', { accountNameToSet, account: newAccount })
    setAccounts(newAccounts)
    setAccountNames(newAccountNames)
  }

  accountsActions.createAccount = async (accountName?: string) => {
    const newAccount = await createDefaultAccount()
    if (accountName) {
      assert(typeof accountName === 'string', `createAccount accountName '${accountName}' not a string`)
      assert(accountName !== '', `createAccount accountName argument is empty string`)
      assert(
        !accountNames.includes(accountName),
        `createAccount accountName '${accountName}' already exists in database`
      )
      newAccount.name = accountName
    }
    const newAccountNames = [...accountNames, newAccount.name]
    const newAccounts = { ...accounts, [newAccount.name]: newAccount }
    await Promise.all([
      accountsMetadataDatabase.setItem('accountNames', newAccountNames),
      addAccountToDatabase(newAccount),
    ])
    debug('accountsActions.createAccount', { accountName, account: newAccount })
    setAccounts(newAccounts)
    setAccountNames(newAccountNames)
  }

  accountsActions.deleteAccount = async (accountName?: string) => {
    throw Error('TODO: not implemented')
    // TODO: delete account from provider and from persistant storage
    // change active account to another active account
    // handle the edge case of a user deleting all his account and having none
    // warn user to back up his private key or lose his account permanently
  }

  accountsActions.importAccount = async (serializedAccount: string | Buffer) => {
    throw Error('TODO: not implemented')
    // TODO: deserialize account, import account, if account.name already exists, add ' 2', don't overwrite
    // the 'account' will contain AccountComments and AccountVotes
    // TODO: add options to only import private key, account settings, or include all account comments/votes history
  }

  accountsActions.exportAccount = async (accountName?: string) => {
    throw Error('TODO: not implemented')
    // TODO: return account as serialized JSON string for copy paste or save as file
    // the 'account' will contain AccountComments and AccountVotes
    // TODO: add options to only export private key, account settings, or include all account comments/votes history
  }

  accountsActions.setAccountsOrder = async (newOrderedAccountNames: string[]) => {
    assert(
      JSON.stringify([...accountNames].sort()) === JSON.stringify([...newOrderedAccountNames].sort()),
      `previous account names '${accountNames} contain different account names than argument newOrderedAccountNames '${newOrderedAccountNames}'`
    )
    debug('accountsActions.setAccountsOrder', {
      previousAccountNames: accountNames,
      newAccountNames: newOrderedAccountNames,
    })
    await accountsMetadataDatabase.setItem('accountNames', newOrderedAccountNames)
    setAccountNames(newOrderedAccountNames)
  }

  // load accounts from database once on load
  useEffect(() => {
    ;(async () => {
      let accountNames: string[] | null, activeAccountName: string, accounts: Accounts
      accountNames = await accountsMetadataDatabase.getItem('accountNames')
      // get accounts from database if any
      if (accountNames?.length) {
        ;[activeAccountName, accounts] = await Promise.all<any>([
          accountsMetadataDatabase.getItem('activeAccountName'),
          getAccountsFromDatabase(accountNames),
        ])
      }
      // no accounts in database, generate a default account
      else {
        const defaultAccount = await createDefaultAccount()
        accountNames = [defaultAccount.name]
        activeAccountName = defaultAccount.name
        accounts = { [defaultAccount.name]: defaultAccount }
        await Promise.all([
          accountsMetadataDatabase.setItem('accountNames', accountNames),
          accountsMetadataDatabase.setItem('activeAccountName', activeAccountName),
          addAccountToDatabase(defaultAccount),
        ])
      }
      setAccounts(accounts)
      setAccountNames(accountNames)
      setActiveAccountName(activeAccountName)
    })()
  }, [])

  if (!props.children) {
    return null
  }

  // don't give access to any context until first load
  let accountsContext: any
  if (accountNames && activeAccountName && accounts) {
    accountsContext = {
      accounts,
      accountNames,
      activeAccountName,
      accountsActions,
    }
  }

  debug({
    accountsContext: accountsContext && {
      accounts: accountsContext.accounts,
      accountNames: accountsContext.accountNames,
      activeAccountName: accountsContext.activeAccountName,
    },
  })
  return <AccountsContext.Provider value={accountsContext}>{props.children}</AccountsContext.Provider>
}
