import validator from '../../lib/validator'
import assert from 'assert'
import Debug from 'debug'
const debug = Debug('plebbit-react-hooks:stores:accounts')
import accountsDatabase from './accounts-database'
import accountGenerator from './account-generator'
import utils from '../../lib/utils'
import subplebbitStore from '../subplebbits'
import {
  Props,
  AccountNamesToAccountIds,
  Account,
  Accounts,
  AccountsActions,
  PublishCommentOptions,
  PublishCommentEditOptions,
  PublishSubplebbitEditOptions,
  PublishVoteOptions,
  Challenge,
  ChallengeVerification,
  CreateCommentOptions,
  CreateSubplebbitOptions,
  CreateVoteOptions,
  Comment,
  Subplebbit,
  AccountComment,
  AccountsComments,
  AccountsNotifications,
  AccountCommentReply,
  AccountCommentsReplies,
  AccountsCommentsReplies,
} from '../../types'
import createStore from 'zustand'
import * as accountsActions from './accounts-actions'

const listeners: any = []

type AccountsState = {
  accounts: Accounts
  accountIds: string[]
  activeAccountId: string | undefined
  accountNamesToAccountIds: AccountNamesToAccountIds
  accountsComments: AccountsComments
  accountsCommentsReplies: AccountsCommentsReplies
  accountsVotes: any
  accountsActions: {[key: string]: Function}
}

const useAccountsStore = createStore<AccountsState>((setState: Function, getState: Function) => ({
  accounts: {},
  accountIds: [],
  activeAccountId: undefined,
  accountNamesToAccountIds: {},
  accountsComments: {},
  accountsCommentsReplies: {},
  accountsVotes: {},
  accountsActions,
}))

// load accounts from database once on load
const setAccountsFromDatabaseInStore = async () => {
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
    assert(accountIds && activeAccountId && accountNamesToAccountIds, `AccountsProvider error creating a default account during initialization`)
  }
  const [accountsComments, accountsVotes, accountsCommentsReplies] = await Promise.all<any>([
    accountsDatabase.getAccountsComments(accountIds),
    accountsDatabase.getAccountsVotes(accountIds),
    accountsDatabase.getAccountsCommentsReplies(accountIds),
  ])
  // setAccounts(accounts)
  // setAccountIds(accountIds)
  // setActiveAccountId(activeAccountId)
  // setAccountNamesToAccountIds(accountNamesToAccountIds)
  // setAccountsComments(accountsComments)
  // setAccountsVotes(accountsVotes)
  // setAccountsCommentsReplies(accountsCommentsReplies)
  useAccountsStore.setState((state) => ({accounts, accountIds, activeAccountId, accountNamesToAccountIds, accountsComments, accountsVotes, accountsCommentsReplies}))

  // start looking for updates for all accounts comments in database
  for (const accountId in accountsComments) {
    for (const accountComment of accountsComments[accountId]) {
      // TODO zustand
      // startUpdatingAccountCommentOnCommentUpdateEvents(accountComment, accounts[accountId], accountComment.index)
    }
  }
}
setAccountsFromDatabaseInStore()

// reset store in between tests
const originalState = useAccountsStore.getState()
// async function because some stores have async init
export const resetAccountsStore = async () => {
  // remove all listeners
  listeners.forEach((listener: any) => listener.removeAllListeners())
  // destroy all component subscriptions to the store
  useAccountsStore.destroy()
  // restore original state
  useAccountsStore.setState(originalState)
  // init the store
  await setAccountsFromDatabaseInStore()
}

export default useAccountsStore
