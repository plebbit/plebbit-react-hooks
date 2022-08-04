import assert from 'assert'
import Debug from 'debug'
const debug = Debug('plebbit-react-hooks:stores:accounts')
import accountsDatabase from './accounts-database'
import accountGenerator from './account-generator'
import {AccountNamesToAccountIds, Account, Accounts, AccountsActions, Comment, AccountComment, AccountsComments, AccountsCommentsReplies} from '../../types'
import createStore from 'zustand'
import * as accountsActions from './accounts-actions'
import * as accountsActionsInternal from './accounts-actions-internal'
import localForage from 'localforage'

// reset all event listeners in between tests
export const listeners: any = []

type AccountsState = {
  accounts: Accounts
  accountIds: string[]
  activeAccountId: string | undefined
  accountNamesToAccountIds: AccountNamesToAccountIds
  accountsComments: AccountsComments
  accountsCommentsUpdating: {[commendCid: string]: boolean}
  accountsCommentsReplies: AccountsCommentsReplies
  accountsVotes: any
  accountsActions: {[key: string]: Function}
  accountsActionsInternal: {[key: string]: Function}
}

const useAccountsStore = createStore<AccountsState>((setState: Function, getState: Function) => ({
  accounts: {},
  accountIds: [],
  activeAccountId: undefined,
  accountNamesToAccountIds: {},
  accountsComments: {},
  accountsCommentsUpdating: {},
  accountsCommentsReplies: {},
  accountsVotes: {},
  accountsActions,
  accountsActionsInternal,
}))

// load accounts from database once on load
const initializeAccountsStore = async () => {
  let accountIds: string[] | undefined
  let activeAccountId: string | undefined
  let accounts: Accounts
  let accountNamesToAccountIds: AccountNamesToAccountIds | undefined
  accountIds = (await accountsDatabase.accountsMetadataDatabase.getItem('accountIds')) || undefined
  // get accounts from database if any
  if (accountIds?.length) {
    ;[activeAccountId, accounts, accountNamesToAccountIds] = await Promise.all<any>([
      accountsDatabase.accountsMetadataDatabase.getItem('activeAccountId'),
      accountsDatabase.getAccounts(accountIds),
      accountsDatabase.accountsMetadataDatabase.getItem('accountNamesToAccountIds'),
    ])
  }
  // no accounts in database, create a default account
  else {
    const defaultAccount = await accountGenerator.generateDefaultAccount()
    await accountsDatabase.addAccount(defaultAccount)
    accounts = {[defaultAccount.id]: defaultAccount}
    ;[accountIds, activeAccountId, accountNamesToAccountIds] = await Promise.all<any>([
      accountsDatabase.accountsMetadataDatabase.getItem('accountIds'),
      accountsDatabase.accountsMetadataDatabase.getItem('activeAccountId'),
      accountsDatabase.accountsMetadataDatabase.getItem('accountNamesToAccountIds'),
    ])
    assert(
      accountIds && activeAccountId && accountNamesToAccountIds,
      `accountsStore error creating a default account during initialization accountsMetadataDatabase.accountIds '${accountIds}' accountsMetadataDatabase.activeAccountId '${activeAccountId}' accountsMetadataDatabase.accountNamesToAccountIds '${JSON.stringify(
        accountNamesToAccountIds
      )}'`
    )
  }
  const [accountsComments, accountsVotes, accountsCommentsReplies] = await Promise.all<any>([
    accountsDatabase.getAccountsComments(accountIds),
    accountsDatabase.getAccountsVotes(accountIds),
    accountsDatabase.getAccountsCommentsReplies(accountIds),
  ])
  useAccountsStore.setState((state) => ({accounts, accountIds, activeAccountId, accountNamesToAccountIds, accountsComments, accountsVotes, accountsCommentsReplies}))

  // start looking for updates for all accounts comments in database
  for (const accountId in accountsComments) {
    for (const accountComment of accountsComments[accountId]) {
      useAccountsStore
        .getState()
        .accountsActionsInternal.startUpdatingAccountCommentOnCommentUpdateEvents(accountComment, accounts[accountId], accountComment.index)
        .catch((error: unknown) =>
          console.error('accountsStore.initializeAccountsStore startUpdatingAccountCommentOnCommentUpdateEvents error', {
            accountComment,
            accountCommentIndex: accountComment.index,
            accounts,
            error,
          })
        )
    }
  }
}

// @ts-ignore
const isInitializing = () => !!window.PLEBBIT_REACT_HOOKS_ACCOUNTS_STORE_INITIALIZING

;(async () => {
  // don't initialize on load multiple times when loading the file multiple times during karma tests
  // @ts-ignore
  if (window.PLEBBIT_REACT_HOOKS_ACCOUNTS_STORE_INITIALIZED_ONCE) {
    return
  }

  // @ts-ignore
  window.PLEBBIT_REACT_HOOKS_ACCOUNTS_STORE_INITIALIZED_ONCE = true
  // @ts-ignore
  window.PLEBBIT_REACT_HOOKS_ACCOUNTS_STORE_INITIALIZING = true

  console.log('accounts store initializing started')
  try {
    await initializeAccountsStore()
  } catch (error) {
    // initializing can fail in tests when store is being reset at the same time as databases are being deleted
    console.error('accountsStore.initializeAccountsStore error', {accountsStore: useAccountsStore.getState(), error})
  } finally {
    // @ts-ignore
    delete window.PLEBBIT_REACT_HOOKS_ACCOUNTS_STORE_INITIALIZING
  }
  console.log('accounts store initializing finished')
})()

// reset store in between tests
const originalState = useAccountsStore.getState()
// async function because some stores have async init
export const resetAccountsStore = async () => {
  // don't reset while initializing, it could happen during quick successive tests
  while (isInitializing()) {
    console.warn(`can't reset accounts store while initializing, waiting 100ms`)
    await new Promise((r) => setTimeout(r, 100))
  }

  console.log('accounts store reset started')

  // remove all event listeners
  listeners.forEach((listener: any) => listener.removeAllListeners())
  // destroy all component subscriptions to the store
  useAccountsStore.destroy()
  // restore original state
  useAccountsStore.setState(originalState)
  // init the store
  await initializeAccountsStore()

  console.log('accounts store reset finished')
}

// reset database and store in between tests
export const resetAccountsDatabaseAndStore = async () => {
  // don't reset while initializing, it could happen during quick successive tests
  while (isInitializing()) {
    console.warn(`can't reset accounts database while initializing, waiting 100ms`)
    await new Promise((r) => setTimeout(r, 100))
  }
  await Promise.all([localForage.createInstance({name: 'accountsMetadata'}).clear(), localForage.createInstance({name: 'accounts'}).clear()])
  await resetAccountsStore()
}

export default useAccountsStore
