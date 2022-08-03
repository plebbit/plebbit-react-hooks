import accountsStore from './accounts-store'
import accountsDatabase from './accounts-database'
import accountGenerator from './account-generator'
import Debug from 'debug'
import validator from '../../lib/validator'
import assert from 'assert'
const debug = Debug('plebbit-react-hooks:stores:accounts')
import {Account} from '../../types'

const addNewAccountToDatabaseAndState = async (newAccount: Account) => {
  const {accounts, accountsComments, accountsVotes} = accountsStore.getState()
  await accountsDatabase.addAccount(newAccount)
  const newAccounts = {...accounts, [newAccount.id]: newAccount}
  const [newAccountIds, newAccountNamesToAccountIds] = await Promise.all<any>([
    accountsDatabase.accountsMetadataDatabase.getItem('accountIds'),
    accountsDatabase.accountsMetadataDatabase.getItem('accountNamesToAccountIds'),
  ])

  const newState: any = {
    accounts: newAccounts,
    accountIds: newAccountIds,
    accountNamesToAccountIds: newAccountNamesToAccountIds,
    accountsComments: {...accountsComments, [newAccount.id]: []},
    accountsVotes: {...accountsVotes, [newAccount.id]: {}},
  }
  // if there is only 1 account, make it active
  // otherwise stay on the same active account
  if (newAccountIds.length === 1) {
    newState.activeAccountId = newAccount.id
  }
  accountsStore.setState(newState)
}

export const createAccount = async (accountName?: string) => {
  const newAccount = await accountGenerator.generateDefaultAccount()
  if (accountName) {
    newAccount.name = accountName
  }
  await addNewAccountToDatabaseAndState(newAccount)
  debug('accountsActions.createAccount', {accountName, account: newAccount})
}

export const deleteAccount = async (accountName?: string) => {
  const {accounts, accountNamesToAccountIds, activeAccountId, accountsComments, accountsVotes} = accountsStore.getState()
  assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use accountsStore.accountActions before initialized`)
  let account = accounts[activeAccountId]
  if (accountName) {
    const accountId = accountNamesToAccountIds[accountName]
    account = accounts[accountId]
  }
  assert(account?.id, `accountsActions.deleteAccount account.id '${account?.id}' doesn't exist, activeAccountId '${activeAccountId}' accountName '${accountName}'`)
  await accountsDatabase.removeAccount(account)
  const newAccounts = {...accounts}
  delete newAccounts[account.id]
  const [newAccountIds, newActiveAccountId, newAccountNamesToAccountIds] = await Promise.all<any>([
    accountsDatabase.accountsMetadataDatabase.getItem('accountIds'),
    accountsDatabase.accountsMetadataDatabase.getItem('activeAccountId'),
    accountsDatabase.accountsMetadataDatabase.getItem('accountNamesToAccountIds'),
  ])
  const newAccountsComments = {...accountsComments}
  delete newAccountsComments[account.id]
  const newAccountsVotes = {...accountsVotes}
  delete newAccountsVotes[account.id]

  accountsStore.setState({
    accounts: newAccounts,
    accountIds: newAccountIds,
    activeAccountId: newActiveAccountId,
    accountNamesToAccountIds: newAccountNamesToAccountIds,
    accountsComments: newAccountsComments,
    accountsVotes: newAccountsVotes,
  })
}

export const setActiveAccount = async (accountName: string) => {
  const {accountNamesToAccountIds} = accountsStore.getState()
  assert(accountNamesToAccountIds, `can't use accountsStore.accountActions before initialized`)
  validator.validateAccountsActionsSetActiveAccountArguments(accountName)
  const accountId = accountNamesToAccountIds[accountName]
  await accountsDatabase.accountsMetadataDatabase.setItem('activeAccountId', accountId)
  debug('accountsActions.setActiveAccount', {accountName, accountId})
  accountsStore.setState({activeAccountId: accountId})
}

export const setAccount = async (account: Account) => {
  const {accounts} = accountsStore.getState()
  validator.validateAccountsActionsSetAccountArguments(account)
  assert(accounts?.[account.id], `cannot set account with account.id '${account.id}' id does not exist in database`)
  // use this function to serialize and update all databases
  await accountsDatabase.addAccount(account)
  const [newAccount, newAccountNamesToAccountIds] = await Promise.all<any>([
    // use this function to deserialize
    accountsDatabase.getAccount(account.id),
    accountsDatabase.accountsMetadataDatabase.getItem('accountNamesToAccountIds'),
  ])
  const newAccounts = {...accounts, [newAccount.id]: newAccount}
  debug('accountsActions.setAccount', {account: newAccount})
  accountsStore.setState({accounts: newAccounts, accountNamesToAccountIds: newAccountNamesToAccountIds})
}

export const setAccountsOrder = async (newOrderedAccountNames: string[]) => {
  const {accounts, accountNamesToAccountIds} = accountsStore.getState()
  assert(accounts && accountNamesToAccountIds, `can't use accountsStore.accountActions before initialized`)
  const accountIds = []
  const accountNames = []
  for (const accountName of newOrderedAccountNames) {
    const accountId = accountNamesToAccountIds[accountName]
    accountIds.push(accountId)
    accountNames.push(accounts[accountId].name)
  }
  validator.validateAccountsActionsSetAccountsOrderArguments(newOrderedAccountNames, accountNames)
  debug('accountsActions.setAccountsOrder', {
    previousAccountNames: accountNames,
    newAccountNames: newOrderedAccountNames,
  })
  await accountsDatabase.accountsMetadataDatabase.setItem('accountIds', accountIds)
  accountsStore.setState({accountIds})
}

export const importAccount = async (serializedAccount: string) => {
  const {accounts, accountNamesToAccountIds, activeAccountId} = accountsStore.getState()
  assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use accountsStore.accountActions before initialized`)
  let account
  try {
    account = JSON.parse(serializedAccount)
  } catch (e) {}
  assert(account && account?.id && account?.name, `accountsActions.importAccount failed JSON.stringify json serializedAccount '${serializedAccount}'`)

  // if account.name already exists, add ' 2', don't overwrite
  if (accountNamesToAccountIds[account.name]) {
    account.name += ' 2'
  }

  // create a new account id
  const {id} = await accountGenerator.generateDefaultAccount()
  const newAccount = {...account, id}
  await addNewAccountToDatabaseAndState(newAccount)
  debug('accountsActions.importAccount', {account: newAccount})

  // TODO: the 'account' should contain AccountComments and AccountVotes
  // TODO: add options to only import private key, account settings, or include all account comments/votes history
}

export const exportAccount = async (accountName?: string) => {
  const {accounts, accountNamesToAccountIds, activeAccountId} = accountsStore.getState()
  assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use accountsStore.accountActions before initialized`)
  let account = accounts[activeAccountId]
  if (accountName) {
    const accountId = accountNamesToAccountIds[accountName]
    account = accounts[accountId]
  }
  assert(account?.id, `accountsActions.exportAccount account.id '${account?.id}' doesn't exist, activeAccountId '${activeAccountId}' accountName '${accountName}'`)
  const accountJson = await accountsDatabase.getAccountJson(account.id)
  debug('accountsActions.exportAccount', {accountJson})
  return accountJson

  // TODO: the 'account' should contain AccountComments and AccountVotes
  // TODO: add options to only export private key, account settings, or include all account comments/votes history
}

export const deleteComment = async (commentCidOrAccountCommentIndex: string | number, accountName?: string) => {
  throw Error('TODO: not implemented')
}
