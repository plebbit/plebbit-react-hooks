// public accounts actions that are called by the user

import accountsStore, {listeners} from './accounts-store'
import subplebbitsStore from '../subplebbits'
import accountsDatabase from './accounts-database'
import accountGenerator from './account-generator'
import Logger from '@plebbit/plebbit-logger'
import validator from '../../lib/validator'
import assert from 'assert'
const log = Logger('plebbit-react-hooks:stores:accounts')
import {
  Account,
  PublishCommentOptions,
  Challenge,
  ChallengeVerification,
  PublishVoteOptions,
  PublishCommentEditOptions,
  PublishSubplebbitEditOptions,
  CreateSubplebbitOptions,
} from '../../types'
import * as accountsActionsInternal from './accounts-actions-internal'

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
  log('accountsActions.createAccount', {accountName, account: newAccount})
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
  log('accountsActions.setActiveAccount', {accountName, accountId})
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
  log('accountsActions.setAccount', {account: newAccount})
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
  log('accountsActions.setAccountsOrder', {
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
  log('accountsActions.importAccount', {account: newAccount})

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
  log('accountsActions.exportAccount', {accountJson})
  return accountJson

  // TODO: the 'account' should contain AccountComments and AccountVotes
  // TODO: add options to only export private key, account settings, or include all account comments/votes history
}

export const subscribe = async (subplebbitAddress: string | number, accountName?: string) => {
  const {accounts, accountNamesToAccountIds, activeAccountId} = accountsStore.getState()
  assert(subplebbitAddress && typeof subplebbitAddress === 'string', `accountsActions.subscribe invalid subplebbitAddress '${subplebbitAddress}'`)
  assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use accountsStore.accountActions before initialized`)
  let account = accounts[activeAccountId]
  if (accountName) {
    const accountId = accountNamesToAccountIds[accountName]
    account = accounts[accountId]
  }
  assert(account?.id, `accountsActions.subscribe account.id '${account?.id}' doesn't exist, activeAccountId '${activeAccountId}' accountName '${accountName}'`)

  const subscriptions: string[] = account.subscriptions || []
  if (subscriptions.includes(subplebbitAddress)) {
    throw Error(`account '${account.id}' already subscribed to '${subplebbitAddress}'`)
  }
  subscriptions.push(subplebbitAddress)

  const updatedAccount = {...account, subscriptions}
  // update account in db
  await accountsDatabase.addAccount(updatedAccount)
  const updatedAccounts = {...accounts, [updatedAccount.id]: updatedAccount}
  log('accountsActions.subscribe', {account: updatedAccount, accountName, subplebbitAddress})
  accountsStore.setState({accounts: updatedAccounts})
}

export const unsubscribe = async (subplebbitAddress: string | number, accountName?: string) => {
  const {accounts, accountNamesToAccountIds, activeAccountId} = accountsStore.getState()
  assert(subplebbitAddress && typeof subplebbitAddress === 'string', `accountsActions.unsubscribe invalid subplebbitAddress '${subplebbitAddress}'`)
  assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use accountsStore.accountActions before initialized`)
  let account = accounts[activeAccountId]
  if (accountName) {
    const accountId = accountNamesToAccountIds[accountName]
    account = accounts[accountId]
  }
  assert(account?.id, `accountsActions.unsubscribe account.id '${account?.id}' doesn't exist, activeAccountId '${activeAccountId}' accountName '${accountName}'`)

  let subscriptions: string[] = account.subscriptions || []
  if (!subscriptions.includes(subplebbitAddress)) {
    throw Error(`account '${account.id}' already unsubscribed from '${subplebbitAddress}'`)
  }
  // remove subplebbitAddress
  subscriptions = subscriptions.filter((address) => address !== subplebbitAddress)

  const updatedAccount = {...account, subscriptions}
  // update account in db
  await accountsDatabase.addAccount(updatedAccount)
  const updatedAccounts = {...accounts, [updatedAccount.id]: updatedAccount}
  log('accountsActions.unsubscribe', {account: updatedAccount, accountName, subplebbitAddress})
  accountsStore.setState({accounts: updatedAccounts})
}

export const blockAddress = async (address: string | number, accountName?: string) => {
  const {accounts, accountNamesToAccountIds, activeAccountId} = accountsStore.getState()
  assert(address && typeof address === 'string', `accountsActions.blockAddress invalid address '${address}'`)
  assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use accountsStore.accountActions before initialized`)
  let account = accounts[activeAccountId]
  if (accountName) {
    const accountId = accountNamesToAccountIds[accountName]
    account = accounts[accountId]
  }
  assert(account?.id, `accountsActions.blockAddress account.id '${account?.id}' doesn't exist, activeAccountId '${activeAccountId}' accountName '${accountName}'`)

  const blockedAddresses: {[address: string]: boolean} = {...account.blockedAddresses}
  if (blockedAddresses[address] === true) {
    throw Error(`account '${account.id}' already blocked address '${address}'`)
  }
  blockedAddresses[address] = true

  const updatedAccount = {...account, blockedAddresses}
  // update account in db
  await accountsDatabase.addAccount(updatedAccount)
  const updatedAccounts = {...accounts, [updatedAccount.id]: updatedAccount}
  log('accountsActions.blockAddress', {account: updatedAccount, accountName, address})
  accountsStore.setState({accounts: updatedAccounts})
}

export const unblockAddress = async (address: string | number, accountName?: string) => {
  const {accounts, accountNamesToAccountIds, activeAccountId} = accountsStore.getState()
  assert(address && typeof address === 'string', `accountsActions.unblockAddress invalid address '${address}'`)
  assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use accountsStore.accountActions before initialized`)
  let account = accounts[activeAccountId]
  if (accountName) {
    const accountId = accountNamesToAccountIds[accountName]
    account = accounts[accountId]
  }
  assert(account?.id, `accountsActions.unblockAddress account.id '${account?.id}' doesn't exist, activeAccountId '${activeAccountId}' accountName '${accountName}'`)

  const blockedAddresses: {[address: string]: boolean} = {...account.blockedAddresses}
  if (!blockedAddresses[address]) {
    throw Error(`account '${account.id}' already blocked address '${address}'`)
  }
  delete blockedAddresses[address]

  const updatedAccount = {...account, blockedAddresses}
  // update account in db
  await accountsDatabase.addAccount(updatedAccount)
  const updatedAccounts = {...accounts, [updatedAccount.id]: updatedAccount}
  log('accountsActions.unblockAddress', {account: updatedAccount, accountName, address})
  accountsStore.setState({accounts: updatedAccounts})
}

export const publishComment = async (publishCommentOptions: PublishCommentOptions, accountName?: string) => {
  const {accounts, accountNamesToAccountIds, activeAccountId} = accountsStore.getState()
  assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use accountsStore.accountActions before initialized`)
  let account = accounts[activeAccountId]
  if (accountName) {
    const accountId = accountNamesToAccountIds[accountName]
    account = accounts[accountId]
  }
  validator.validateAccountsActionsPublishCommentArguments({publishCommentOptions, accountName, account})

  let createCommentOptions = {
    timestamp: Math.round(Date.now() / 1000),
    author: account.author,
    signer: account.signer,
    ...publishCommentOptions,
  }
  delete createCommentOptions.onChallenge
  delete createCommentOptions.onChallengeVerification

  let accountCommentIndex: number

  let comment = await account.plebbit.createComment(createCommentOptions)
  const publishAndRetryFailedChallengeVerification = async () => {
    comment.once('challenge', async (challenge: Challenge) => {
      publishCommentOptions.onChallenge(challenge, comment)
    })
    comment.once('challengeverification', async (challengeVerification: ChallengeVerification) => {
      publishCommentOptions.onChallengeVerification(challengeVerification, comment)
      if (!challengeVerification.challengeSuccess) {
        // publish again automatically on fail
        createCommentOptions = {...createCommentOptions, timestamp: Math.round(Date.now() / 1000)}
        comment = await account.plebbit.createComment(createCommentOptions)
        publishAndRetryFailedChallengeVerification()
      } else {
        // the challengeverification message of a comment publication should in theory send back the CID
        // of the published comment which is needed to resolve it for replies, upvotes, etc
        if (challengeVerification?.publication?.cid) {
          const commentWithCid = {...createCommentOptions, cid: challengeVerification.publication.cid}
          await accountsDatabase.addAccountComment(account.id, commentWithCid, accountCommentIndex)
          accountsStore.setState(({accountsComments}) => {
            const updatedAccountComments = [...accountsComments[account.id]]
            const updatedAccountComment = {...commentWithCid, index: accountCommentIndex, accountId: account.id}
            updatedAccountComments[accountCommentIndex] = updatedAccountComment
            return {accountsComments: {...accountsComments, [account.id]: updatedAccountComments}}
          })

          accountsActionsInternal
            .startUpdatingAccountCommentOnCommentUpdateEvents(comment, account, accountCommentIndex)
            .catch((error: unknown) =>
              log.error('accountsActions.publishComment startUpdatingAccountCommentOnCommentUpdateEvents error', {comment, account, accountCommentIndex, error})
            )
        }
      }
    })
    listeners.push(comment)
    try {
      // publish will resolve after the challenge request
      // if it fails before, like failing to resolve ENS, we can emit the error
      await comment.publish()
    } catch (error) {
      publishCommentOptions.onError?.(error, comment)
    }
  }

  publishAndRetryFailedChallengeVerification()
  await accountsDatabase.addAccountComment(account.id, createCommentOptions)
  log('accountsActions.publishComment', {createCommentOptions})
  accountsStore.setState(({accountsComments}) => {
    // save account comment index to update the comment later
    accountCommentIndex = accountsComments[account.id].length
    const createdAccountComment = {...createCommentOptions, index: accountCommentIndex, accountId: account.id}
    return {
      accountsComments: {
        ...accountsComments,
        [account.id]: [...accountsComments[account.id], createdAccountComment],
      },
    }
  })
}

export const deleteComment = async (commentCidOrAccountCommentIndex: string | number, accountName?: string) => {
  throw Error('TODO: not implemented')
}

export const publishVote = async (publishVoteOptions: PublishVoteOptions, accountName?: string) => {
  const {accounts, accountNamesToAccountIds, activeAccountId} = accountsStore.getState()
  assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use accountsStore.accountActions before initialized`)
  let account = accounts[activeAccountId]
  if (accountName) {
    const accountId = accountNamesToAccountIds[accountName]
    account = accounts[accountId]
  }
  validator.validateAccountsActionsPublishVoteArguments({publishVoteOptions, accountName, account})

  let createVoteOptions = {
    timestamp: Math.round(Date.now() / 1000),
    author: account.author,
    signer: account.signer,
    ...publishVoteOptions,
  }
  delete createVoteOptions.onChallenge
  delete createVoteOptions.onChallengeVerification

  let vote = await account.plebbit.createVote(createVoteOptions)
  const publishAndRetryFailedChallengeVerification = async () => {
    vote.once('challenge', async (challenge: Challenge) => {
      publishVoteOptions.onChallenge(challenge, vote)
    })
    vote.once('challengeverification', async (challengeVerification: ChallengeVerification) => {
      publishVoteOptions.onChallengeVerification(challengeVerification, vote)
      if (!challengeVerification.challengeSuccess) {
        // publish again automatically on fail
        createVoteOptions = {...createVoteOptions, timestamp: Math.round(Date.now() / 1000)}
        vote = await account.plebbit.createVote(createVoteOptions)
        publishAndRetryFailedChallengeVerification()
      }
    })
    listeners.push(vote)
    try {
      // publish will resolve after the challenge request
      // if it fails before, like failing to resolve ENS, we can emit the error
      await vote.publish()
    } catch (error) {
      publishVoteOptions.onError?.(error, vote)
    }
  }

  publishAndRetryFailedChallengeVerification()
  await accountsDatabase.addAccountVote(account.id, createVoteOptions)
  log('accountsActions.publishVote', {createVoteOptions})
  accountsStore.setState(({accountsVotes}) => ({
    accountsVotes: {
      ...accountsVotes,
      [account.id]: {...accountsVotes[account.id], [createVoteOptions.commentCid]: createVoteOptions},
    },
  }))
}

export const publishCommentEdit = async (publishCommentEditOptions: PublishCommentEditOptions, accountName?: string) => {
  const {accounts, accountNamesToAccountIds, activeAccountId} = accountsStore.getState()
  assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use accountsStore.accountActions before initialized`)
  let account = accounts[activeAccountId]
  if (accountName) {
    const accountId = accountNamesToAccountIds[accountName]
    account = accounts[accountId]
  }
  validator.validateAccountsActionsPublishCommentEditArguments({publishCommentEditOptions, accountName, account})

  let createCommentEditOptions = {
    timestamp: Math.round(Date.now() / 1000),
    author: account.author,
    signer: account.signer,
    ...publishCommentEditOptions,
  }
  delete createCommentEditOptions.onChallenge
  delete createCommentEditOptions.onChallengeVerification

  let commentEdit = await account.plebbit.createCommentEdit(createCommentEditOptions)
  const publishAndRetryFailedChallengeVerification = async () => {
    commentEdit.once('challenge', async (challenge: Challenge) => {
      publishCommentEditOptions.onChallenge(challenge, commentEdit)
    })
    commentEdit.once('challengeverification', async (challengeVerification: ChallengeVerification) => {
      publishCommentEditOptions.onChallengeVerification(challengeVerification, commentEdit)
      if (!challengeVerification.challengeSuccess) {
        // publish again automatically on fail
        createCommentEditOptions = {...createCommentEditOptions, timestamp: Math.round(Date.now() / 1000)}
        commentEdit = await account.plebbit.createCommentEdit(createCommentEditOptions)
        publishAndRetryFailedChallengeVerification()
      }
    })
    listeners.push(commentEdit)
    try {
      // publish will resolve after the challenge request
      // if it fails before, like failing to resolve ENS, we can emit the error
      await commentEdit.publish()
    } catch (error) {
      publishCommentEditOptions.onError?.(error, commentEdit)
    }
  }

  publishAndRetryFailedChallengeVerification()
  log('accountsActions.publishCommentEdit', {createCommentEditOptions})

  // TODO: show pending edits somewhere
}

export const publishSubplebbitEdit = async (subplebbitAddress: string, publishSubplebbitEditOptions: PublishSubplebbitEditOptions, accountName?: string) => {
  const {accounts, accountNamesToAccountIds, activeAccountId} = accountsStore.getState()
  assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use accountsStore.accountActions before initialized`)
  let account = accounts[activeAccountId]
  if (accountName) {
    const accountId = accountNamesToAccountIds[accountName]
    account = accounts[accountId]
  }
  validator.validateAccountsActionsPublishSubplebbitEditArguments({subplebbitAddress, publishSubplebbitEditOptions, accountName, account})

  // account is the owner of the subplebbit and can edit it locally, no need to publish
  const localSubplebbitAddresses = await account.plebbit.listSubplebbits()
  if (localSubplebbitAddresses.includes(subplebbitAddress)) {
    await subplebbitsStore.getState().editSubplebbit(subplebbitAddress, publishSubplebbitEditOptions, account)
    // create fake success challenge verification for consistent behavior with remote subplebbit edit
    publishSubplebbitEditOptions.onChallengeVerification({challengeSuccess: true})
    return
  }

  assert(
    !publishSubplebbitEditOptions.address || publishSubplebbitEditOptions.address === subplebbitAddress,
    `accountsActions.publishSubplebbitEdit can't edit address of a remote subplebbit`
  )
  let createSubplebbitEditOptions = {
    timestamp: Math.round(Date.now() / 1000),
    author: account.author,
    signer: account.signer,
    ...publishSubplebbitEditOptions,
    // not possible to edit subplebbit.address over pubsub, only locally
    address: subplebbitAddress,
  }
  delete createSubplebbitEditOptions.onChallenge
  delete createSubplebbitEditOptions.onChallengeVerification

  let subplebbitEdit = await account.plebbit.createSubplebbitEdit(createSubplebbitEditOptions)
  const publishAndRetryFailedChallengeVerification = async () => {
    subplebbitEdit.once('challenge', async (challenge: Challenge) => {
      publishSubplebbitEditOptions.onChallenge(challenge, subplebbitEdit)
    })
    subplebbitEdit.once('challengeverification', async (challengeVerification: ChallengeVerification) => {
      publishSubplebbitEditOptions.onChallengeVerification(challengeVerification, subplebbitEdit)
      if (!challengeVerification.challengeSuccess) {
        // publish again automatically on fail
        createSubplebbitEditOptions = {...createSubplebbitEditOptions, timestamp: Math.round(Date.now() / 1000)}
        subplebbitEdit = await account.plebbit.createSubplebbitEdit(createSubplebbitEditOptions)
        publishAndRetryFailedChallengeVerification()
      }
    })
    listeners.push(subplebbitEdit)
    try {
      // publish will resolve after the challenge request
      // if it fails before, like failing to resolve ENS, we can emit the error
      await subplebbitEdit.publish()
    } catch (error) {
      publishSubplebbitEditOptions.onError?.(error, subplebbitEdit)
    }
  }

  publishAndRetryFailedChallengeVerification()
  log('accountsActions.publishSubplebbitEdit', {createSubplebbitEditOptions})
}

export const createSubplebbit = async (createSubplebbitOptions: CreateSubplebbitOptions, accountName?: string) => {
  const {accounts, accountNamesToAccountIds, activeAccountId} = accountsStore.getState()
  assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use accountsStore.accountsActions before initialized`)
  let account = accounts[activeAccountId]
  if (accountName) {
    const accountId = accountNamesToAccountIds[accountName]
    account = accounts[accountId]
  }

  const subplebbit = await subplebbitsStore.getState().createSubplebbit(createSubplebbitOptions, account)
  log('accountsActions.createSubplebbit', {createSubplebbitOptions, subplebbit})
  return subplebbit
}
