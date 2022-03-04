import React, { useState, useEffect } from 'react'
import PlebbitJs from '../plebbit-js'
import validator from '../validator'
import assert from 'assert'
import localForage from 'localforage'
const accountsDatabase = localForage.createInstance({ name: 'accounts' })
const accountsMetadataDatabase = localForage.createInstance({ name: 'accountsMetadata' })
const accountsCommentsDatabase = localForage.createInstance({ name: 'accountsComments' })
const accountsVotesDatabase = localForage.createInstance({ name: 'accountsVotes' })
import Debug from 'debug'
const debug = Debug('plebbitreacthooks:providers:accountsprovider')

type Props = { children?: React.ReactChild }
// TODO: define Account type
type Account = any
type Accounts = { [key: string]: Account }
// TODO: define AccountsActions type
type AccountsActions = any
// TODO: define type
type PublishCommentOptions = any
// TODO: define type
type Challenge = any
// TODO: define type
type ChallengeVerification = any

const getAccountsFromDatabase = async (accountNames: string[]) => {
  validator.validateAccountsProviderGetAccountsFromDatabaseArguments(accountNames)
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
  validator.validateAccountsProviderAddAccountToDatabaseArguments(account)
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
  const [accountNames, setAccountNames] = useState<any>(undefined)
  const [activeAccountName, setActiveAccountName] = useState<any>(undefined)

  const accountsActions: AccountsActions = {}

  accountsActions.setActiveAccount = async (accountName: string) => {
    validator.validateAccountsActionsSetActiveAccountArguments(accountName)
    await accountsMetadataDatabase.setItem('activeAccountName', accountName)
    debug('accountsActions.setActiveAccountName', { accountName })
    setActiveAccountName(accountName)
  }

  accountsActions.setAccount = async (accountNameToSet: string, account: Account) => {
    validator.validateAccountsActionsSetAccountArguments(accountNameToSet, account)
    // use this function to serialize
    await addAccountToDatabase(account)
    // use this function to deserialize
    const newAccount = await getAccountFromDatabase(account.name)
    const newAccounts = { ...accounts, [newAccount.name]: newAccount }
    const newAccountNames = [...accountNames]
    // handle an account name change
    if (newAccount.name !== accountNameToSet) {
      if (activeAccountName === accountNameToSet) {
        await accountsMetadataDatabase.setItem('activeAccountName', newAccount.name)
      }
      // delete old account
      await accountsDatabase.removeItem(accountNameToSet)
      delete newAccounts[accountNameToSet]
      // replace old account name
      const previousAccountNameIndex = newAccountNames.indexOf(accountNameToSet)
      newAccountNames[previousAccountNameIndex] = newAccount.name
      await accountsMetadataDatabase.setItem('accountNames', newAccountNames)
      // replace old account comments and votes
      await accountsCommentsDatabase.setItem(newAccount.name, await accountsCommentsDatabase.getItem(accountNameToSet))
      await accountsCommentsDatabase.removeItem(accountNameToSet)
      await accountsVotesDatabase.setItem(newAccount.name, await accountsVotesDatabase.getItem(accountNameToSet))
      await accountsVotesDatabase.removeItem(accountNameToSet)
    }
    debug('accountsActions.setAccount', { accountNameToSet, account: newAccount })
    setAccounts(newAccounts)
    setAccountNames(newAccountNames)
    // handle active account name change
    if (activeAccountName === accountNameToSet && newAccount.name !== accountNameToSet) {
      setActiveAccountName(newAccount.name)
    }
  }

  accountsActions.setAccountsOrder = async (newOrderedAccountNames: string[]) => {
    validator.validateAccountsActionsSetAccountsOrderArguments(newOrderedAccountNames, accountNames)
    debug('accountsActions.setAccountsOrder', {
      previousAccountNames: accountNames,
      newAccountNames: newOrderedAccountNames,
    })
    await accountsMetadataDatabase.setItem('accountNames', newOrderedAccountNames)
    setAccountNames(newOrderedAccountNames)
  }

  accountsActions.createAccount = async (accountName?: string) => {
    const newAccount = await createDefaultAccount()
    if (accountName) {
      validator.validateAccountsActionsCreateAccountArguments(accountName, accountNames)
      newAccount.name = accountName
    }
    const newAccountNames = [...accountNames, newAccount.name]
    const newAccounts = { ...accounts, [newAccount.name]: newAccount }
    await Promise.all([
      accountsMetadataDatabase.setItem('accountNames', newAccountNames),
      accountsCommentsDatabase.setItem(newAccount.name, []),
      accountsVotesDatabase.setItem(newAccount.name, {}),
      addAccountToDatabase(newAccount),
    ])
    debug('accountsActions.createAccount', { accountName, account: newAccount })
    setAccounts(newAccounts)
    setAccountNames(newAccountNames)
    // there was no accounts left before creating this account so set the only account as active
    if (newAccountNames.length === 1) {
      setActiveAccountName(newAccountNames[0])
    }
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
    let account = accountName ? accounts[accountName] : accounts[activeAccountName]
    validator.validateAccountsActionsPublishCommentArguments({publishCommentOptions, accountName, activeAccountName, account})

    const commentOptions = {
      subplebbitAddress: publishCommentOptions.subplebbitAddress,
      parentCommentCid: publishCommentOptions.parentCommentCid, 
      content: publishCommentOptions.content,
      timestamp: publishCommentOptions.timestamp || Math.round(Date.now() / 1000),
      author: account.author,
      signer: account.signer
    }
    let comment = account.plebbit.createComment(commentOptions)
    const publishAndRetryFailedChallengeVerification = () => {
      comment.once('challenge', async (challenge: Challenge) => {
        publishCommentOptions.onChallenge(challenge, comment)
      })
      comment.once('challengeverification', async (challengeVerification: ChallengeVerification) => {
        publishCommentOptions.onChallengeVerification(challengeVerification, comment)
        if (!challengeVerification.challengeAnswerIsVerified) {
          // publish again automatically on fail
          comment = account.plebbit.createComment(commentOptions)
          publishAndRetryFailedChallengeVerification()
        }
      })
      comment.publish()
    }
    publishAndRetryFailedChallengeVerification()
    return comment
  }

  accountsActions.publishVote = async () => {
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
          accountsCommentsDatabase.setItem(defaultAccount.name, []),
          accountsVotesDatabase.setItem(defaultAccount.name, {}),
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
  if (accountNames && accounts) {
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
