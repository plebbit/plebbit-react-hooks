import React, { useState, useEffect } from 'react'
import PlebbitJs from '../plebbit-js'
import validator from '../validator'
import assert from 'assert'
import {v4 as uuid} from 'uuid'
import localForage from 'localforage'
const accountsDatabase = localForage.createInstance({ name: 'accounts' })
const accountsMetadataDatabase = localForage.createInstance({ name: 'accountsMetadata' })
import Debug from 'debug'
const debug = Debug('plebbitreacthooks:providers:accountsprovider')

type Props = { children?: React.ReactChild }
type AccountNamesToAccountIds = {[key: string]: string} 
// TODO: define types
type Account = any
type Accounts = { [key: string]: Account }
type AccountsActions = any
type AccountsContext = any
type PublishCommentOptions = any
type PublishVoteOptions = any
type Challenge = any
type ChallengeVerification = any

const getAccountsFromDatabase = async (accountIds: string[]) => {
  validator.validateAccountsProviderGetAccountsFromDatabaseArguments(accountIds)
  const accounts: Accounts = {}
  const promises = []
  for (const accountId of accountIds) {
    promises.push(accountsDatabase.getItem(accountId))
  }
  const accountsArray = await Promise.all(promises)
  for (const [i, accountId] of accountIds.entries()) {
    assert(accountsArray[i], `accountId '${accountId}' not found in database`)
    accounts[accountId] = accountsArray[i]
    accounts[accountId].plebbit = PlebbitJs.Plebbit(accounts[accountId].plebbitOptions)
  }
  return accounts
}

const getAccountFromDatabase = async (accountId: string) => {
  const accounts = await getAccountsFromDatabase([accountId])
  return accounts[accountId]
}

const addAccountToDatabase = async (account: Account) => {
  validator.validateAccountsProviderAddAccountToDatabaseArguments(account)
  let accountIds: string[] | null = await accountsMetadataDatabase.getItem('accountIds')

  // handle no duplicate names
  if (accountIds) {
    const accounts: Accounts = await getAccountsFromDatabase(accountIds)
    for (const accountId of accountIds) {
      if (accountId !== account.id && accounts[accountId].name === account.name) {
        throw Error(`account name '${account.name}' already exists in database`)
      }
    }
  }

  // handle updating accounts database
  const accountToPutInDatabase = { ...account, plebbit: undefined }
  await accountsDatabase.setItem(accountToPutInDatabase.id, accountToPutInDatabase)

  // handle updating accountNamesToAccountIds database
  let accountNamesToAccountIds: AccountNamesToAccountIds | null = await accountsMetadataDatabase.getItem('accountNamesToAccountIds')
  if (!accountNamesToAccountIds) {
    accountNamesToAccountIds = {}
  }
  accountNamesToAccountIds[account.name] = account.id
  await accountsMetadataDatabase.setItem('accountNamesToAccountIds', accountNamesToAccountIds)

  // handle updating accountIds database
  if (!accountIds) {
    accountIds = [account.id]
  }
  if (!accountIds.includes(account.id)) {
    accountIds.push(account.id)
  }
  await accountsMetadataDatabase.setItem('accountIds', accountIds) 

  // handle updating activeAccountId database
  if (accountIds.length === 1) {
    await accountsMetadataDatabase.setItem('activeAccountId', account.id)
  }
}

const generateDefaultAccount = async () => {
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
    id: uuid(),
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
  const accountIds: string[] | null = await accountsMetadataDatabase.getItem('accountIds')
  const accountNames = []
  if (accountIds) {
    const accounts: Accounts | null = await getAccountsFromDatabase(accountIds)
    for (const accountId of accountIds) {
      accountNames.push(accounts[accountId].name)
    }
  }
  let accountNumber = 1
  if (!accountNames?.length) {
    return `Account ${accountNumber}`
  }
  validator.validateAccountsProviderAccountNames(accountNames)

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
  const [accountIds, setAccountIds] = useState<any>(undefined)
  const [activeAccountId, setActiveAccountId] = useState<any>(undefined)
  const [accountNamesToAccountIds, setAccountNamesToAccountIds] = useState<any>(undefined)
  const [accountsComments, setAccountsComments] = useState<any>(undefined)
  const [accountsVotes, setAccountsVotes] = useState<any>(undefined)

  const accountsActions: AccountsActions = {}

  accountsActions.setActiveAccount = async (accountName: string) => {
    validator.validateAccountsActionsSetActiveAccountArguments(accountName)
    const accountId = accountNamesToAccountIds[accountName]
    await accountsMetadataDatabase.setItem('activeAccountId', accountId)
    debug('accountsActions.setActiveAccount', { accountName, accountId })
    setActiveAccountId(accountId)
  }

  accountsActions.setAccount = async (account: Account) => {
    validator.validateAccountsActionsSetAccountArguments(account)
    // use this function to serialize and update all databases
    await addAccountToDatabase(account)
    const [newAccount, newAccountIds, newActiveAccountId, accountNamesToAccountIds] = await Promise.all([
      // use this function to deserialize
      getAccountFromDatabase(account.id),
      accountsMetadataDatabase.getItem('accountIds'),
      accountsMetadataDatabase.getItem('activeAccountId'),
      accountsMetadataDatabase.getItem('accountNamesToAccountIds')
    ])
    const newAccounts = { ...accounts, [newAccount.id]: newAccount }
    debug('accountsActions.setAccount', { account: newAccount })
    setAccounts(newAccounts)
    setAccountIds(newAccountIds)
    setActiveAccountId(newActiveAccountId)
    setAccountNamesToAccountIds(accountNamesToAccountIds)
  }

  accountsActions.setAccountsOrder = async (newOrderedAccountNames: string[]) => {
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
    await accountsMetadataDatabase.setItem('accountIds', accountIds)
    setAccountIds(accountIds)
  }

  accountsActions.createAccount = async (accountName?: string) => {
    const newAccount = await generateDefaultAccount()
    if (accountName) {
      newAccount.name = accountName
    }
    await addAccountToDatabase(newAccount)
    const newAccounts = { ...accounts, [newAccount.id]: newAccount }
    const [newAccountIds, newActiveAccountId, accountNamesToAccountIds] = await Promise.all([
      accountsMetadataDatabase.getItem('accountIds'),
      accountsMetadataDatabase.getItem('activeAccountId'),
      accountsMetadataDatabase.getItem('accountNamesToAccountIds')
    ])
    debug('accountsActions.createAccount', { accountName, account: newAccount })
    setAccounts(newAccounts)
    setAccountIds(newAccountIds)
    setAccountNamesToAccountIds(accountNamesToAccountIds)
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

  accountsActions.exportAccount = async (accountName: string) => {
    throw Error('TODO: not implemented')
    // don't allow no account name to avoid catastrophic bugs
    validator.validateAccountsActionsExportAccountArguments(accountName)
    // TODO: return account as serialized JSON string for copy paste or save as file
    // the 'account' will contain AccountComments and AccountVotes
    // TODO: add options to only export private key, account settings, or include all account comments/votes history
  }

  accountsActions.publishComment = async (publishCommentOptions: PublishCommentOptions, accountName?: string) => {
    let account = accounts[activeAccountId]
    if (accountName) {
      const accountId = accountNamesToAccountIds[accountName]
      account = accounts[accountId]
    }
    validator.validateAccountsActionsPublishCommentArguments({publishCommentOptions, accountName, account})

    const createCommentOptions = {
      subplebbitAddress: publishCommentOptions.subplebbitAddress,
      parentCommentCid: publishCommentOptions.parentCommentCid, 
      content: publishCommentOptions.content,
      title: publishCommentOptions.title,
      timestamp: publishCommentOptions.timestamp || Math.round(Date.now() / 1000),
      author: account.author,
      signer: account.signer
    }

    let comment = account.plebbit.createComment(createCommentOptions)
    const publishAndRetryFailedChallengeVerification = () => {
      comment.once('challenge', async (challenge: Challenge) => {
        publishCommentOptions.onChallenge(challenge, comment)
      })
      comment.once('challengeverification', async (challengeVerification: ChallengeVerification) => {
        publishCommentOptions.onChallengeVerification(challengeVerification, comment)
        if (!challengeVerification.challengeAnswerIsVerified) {
          // publish again automatically on fail
          comment = account.plebbit.createComment(createCommentOptions)
          publishAndRetryFailedChallengeVerification()
        }
      })
      comment.publish()
    }

    publishAndRetryFailedChallengeVerification()
    return comment
  }

  accountsActions.publishVote = async (publishVoteOptions: PublishVoteOptions, accountName?: string) => {
    let account = accounts[activeAccountId]
    if (accountName) {
      const accountId = accountNamesToAccountIds[accountName]
      account = accounts[accountId]
    }
    validator.validateAccountsActionsPublishVoteArguments({publishVoteOptions, accountName, account})

    const createVoteOptions = {
      subplebbitAddress: publishVoteOptions.subplebbitAddress,
      vote: publishVoteOptions.vote,
      commentCid: publishVoteOptions.commentCid,
      timestamp: publishVoteOptions.timestamp || Math.round(Date.now() / 1000),
      author: account.author,
      signer: account.signer
    }

    let vote = account.plebbit.createVote(createVoteOptions)
    const publishAndRetryFailedChallengeVerification = () => {
      vote.once('challenge', async (challenge: Challenge) => {
        publishVoteOptions.onChallenge(challenge, vote)
      })
      vote.once('challengeverification', async (challengeVerification: ChallengeVerification) => {
        publishVoteOptions.onChallengeVerification(challengeVerification, vote)
        if (!challengeVerification.challengeAnswerIsVerified) {
          // publish again automatically on fail
          vote = account.plebbit.createVote(createVoteOptions)
          publishAndRetryFailedChallengeVerification()
        }
      })
      vote.publish()
    }

    publishAndRetryFailedChallengeVerification()
    return vote
  }

  // load accounts from database once on load
  useEffect(() => {
    ;(async () => {
      let accountIds: string[] | null, activeAccountId: string | null, accounts: Accounts, accountNamesToAccountIds: AccountNamesToAccountIds | null
      accountIds = await accountsMetadataDatabase.getItem('accountIds')
      // get accounts from database if any
      if (accountIds?.length) {
        ;[activeAccountId, accounts, accountNamesToAccountIds] = await Promise.all<any>([
          accountsMetadataDatabase.getItem('activeAccountId'),
          getAccountsFromDatabase(accountIds),
          accountsMetadataDatabase.getItem('accountNamesToAccountIds')
        ])
      }
      // no accounts in database, create a default account
      else {
        const defaultAccount = await generateDefaultAccount()
        await addAccountToDatabase(defaultAccount)
        accounts = {[defaultAccount.id]: defaultAccount}
        ;[accountIds, activeAccountId, accountNamesToAccountIds] = await Promise.all<any>([
          accountsMetadataDatabase.getItem('accountIds'),
          accountsMetadataDatabase.getItem('activeAccountId'),
          accountsMetadataDatabase.getItem('accountNamesToAccountIds')
        ])
      }
      setAccounts(accounts)
      setAccountIds(accountIds)
      setActiveAccountId(activeAccountId)
      setAccountNamesToAccountIds(accountNamesToAccountIds)
    })()
  }, [])

  if (!props.children) {
    return null
  }

  // don't give access to any context until first load
  let accountsContext: AccountsContext
  if (accountIds && accounts && accountNamesToAccountIds) {
    accountsContext = {
      accounts,
      accountIds,
      activeAccountId,
      accountNamesToAccountIds,
      accountsActions,
    }
  }

  debug({
    accountsContext: accountsContext && {
      accounts,
      accountIds,
      activeAccountId,
      accountNamesToAccountIds
    },
  })
  return <AccountsContext.Provider value={accountsContext}>{props.children}</AccountsContext.Provider>
}
