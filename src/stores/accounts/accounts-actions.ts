// public accounts actions that are called by the user

import accountsStore, {listeners} from './accounts-store'
import subplebbitsStore from '../subplebbits'
import accountsDatabase from './accounts-database'
import accountGenerator from './account-generator'
import Logger from '@plebbit/plebbit-logger'
import validator from '../../lib/validator'
import assert from 'assert'
const log = Logger('plebbit-react-hooks:accounts:stores')
import {
  Account,
  Accounts,
  PublishCommentOptions,
  Challenge,
  ChallengeVerification,
  PublishVoteOptions,
  PublishCommentEditOptions,
  PublishSubplebbitEditOptions,
  CreateSubplebbitOptions,
  Subplebbits,
  AccountComment,
} from '../../types'
import * as accountsActionsInternal from './accounts-actions-internal'
import {getAccountSubplebbits, getCommentCidsToAccountsComments, fetchCommentLinkDimensions} from './utils'
import utils from '../../lib/utils'

const addNewAccountToDatabaseAndState = async (newAccount: Account) => {
  // add to database first to init the account
  await accountsDatabase.addAccount(newAccount)
  // use database data for these because it's easier
  const [newAccountIds, newAccountNamesToAccountIds] = await Promise.all<any>([
    accountsDatabase.accountsMetadataDatabase.getItem('accountIds'),
    accountsDatabase.accountsMetadataDatabase.getItem('accountNamesToAccountIds'),
  ])

  // set the new state
  const {accounts, accountsComments, accountsVotes, accountsEdits, accountsCommentsReplies} = accountsStore.getState()
  const newAccounts = {...accounts, [newAccount.id]: newAccount}
  const newState: any = {
    accounts: newAccounts,
    accountIds: newAccountIds,
    accountNamesToAccountIds: newAccountNamesToAccountIds,
    accountsComments: {...accountsComments, [newAccount.id]: []},
    accountsVotes: {...accountsVotes, [newAccount.id]: {}},
    accountsEdits: {...accountsEdits, [newAccount.id]: {}},
    accountsCommentsReplies: {...accountsCommentsReplies, [newAccount.id]: {}},
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

  // if author.address has changed, add new subplebbit roles of author.address found in subplebbits store
  // TODO: add test to check if roles get added
  if (account.author.address !== accounts[account.id].author.address) {
    const subplebbits = getAccountSubplebbits(account, subplebbitsStore.getState().subplebbits)
    account = {...account, subplebbits}
  }

  // use this function to serialize and update all databases
  await accountsDatabase.addAccount(account)
  const [newAccount, newAccountNamesToAccountIds] = await Promise.all<any>([
    // use this function to deserialize
    accountsDatabase.getAccount(account.id),
    accountsDatabase.accountsMetadataDatabase.getItem('accountNamesToAccountIds'),
  ])
  const newAccounts: Accounts = {...accounts, [newAccount.id]: newAccount}
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
  let imported
  try {
    imported = JSON.parse(serializedAccount)
  } catch (e) {}
  assert(
    imported?.account && imported?.account?.id && imported?.account?.name,
    `accountsActions.importAccount failed JSON.stringify json serializedAccount '${serializedAccount}'`
  )

  // add subplebbit roles already in subplebbits store to imported account
  // TODO: add test to check if roles get added
  const subplebbits = getAccountSubplebbits(imported.account, subplebbitsStore.getState().subplebbits)

  // if imported.account.name already exists, add ' 2', don't overwrite
  if (accountNamesToAccountIds[imported.account.name]) {
    imported.account.name += ' 2'
  }

  // generate new account
  const generatedAccount = await accountGenerator.generateDefaultAccount()
  // use generatedAccount to init properties like .plebbit and .id on a new account
  // overwrite account.id to avoid duplicate ids
  const newAccount = {...generatedAccount, ...imported.account, subplebbits, id: generatedAccount.id}

  // add account to database
  await accountsDatabase.addAccount(newAccount)

  // add account comments, votes, edits to database
  for (const accountComment of imported.accountComments || []) {
    await accountsDatabase.addAccountComment(newAccount.id, accountComment)
  }
  for (const accountVote of imported.accountVotes || []) {
    await accountsDatabase.addAccountVote(newAccount.id, accountVote)
  }
  for (const accountEdit of imported.accountEdits || []) {
    await accountsDatabase.addAccountEdit(newAccount.id, accountEdit)
  }

  // set new state

  // get new state data from database because it's easier
  const [accountComments, accountVotes, accountEdits, accountIds, newAccountNamesToAccountIds] = await Promise.all<any>([
    accountsDatabase.getAccountComments(newAccount.id),
    accountsDatabase.getAccountVotes(newAccount.id),
    accountsDatabase.getAccountEdits(newAccount.id),
    accountsDatabase.accountsMetadataDatabase.getItem('accountIds'),
    accountsDatabase.accountsMetadataDatabase.getItem('accountNamesToAccountIds'),
  ])

  accountsStore.setState((state) => ({
    accounts: {...state.accounts, [newAccount.id]: newAccount},
    accountIds,
    accountNamesToAccountIds: newAccountNamesToAccountIds,
    accountsComments: {...state.accountsComments, [newAccount.id]: accountComments},
    commentCidsToAccountsComments: getCommentCidsToAccountsComments({...state.accountsComments, [newAccount.id]: accountComments}),
    accountsVotes: {...state.accountsVotes, [newAccount.id]: accountVotes},
    accountsEdits: {...state.accountsEdits, [newAccount.id]: accountEdits},
    // don't import/export replies to own comments, those are just cached and can be refetched
    accountsCommentsReplies: {...state.accountsCommentsReplies, [newAccount.id]: {}},
  }))

  log('accountsActions.importAccount', {account: newAccount, accountComments, accountVotes, accountEdits})

  // start looking for updates for all accounts comments in database
  for (const accountComment of accountComments) {
    accountsStore
      .getState()
      .accountsActionsInternal.startUpdatingAccountCommentOnCommentUpdateEvents(accountComment, newAccount, accountComment.index)
      .catch((error: unknown) =>
        log.error('accountsActions.importAccount startUpdatingAccountCommentOnCommentUpdateEvents error', {
          accountComment,
          accountCommentIndex: accountComment.index,
          importedAccount: newAccount,
          error,
        })
      )
  }

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
  const exportedAccountJson = await accountsDatabase.getExportedAccountJson(account.id)
  log('accountsActions.exportAccount', {exportedAccountJson})
  return exportedAccountJson
}

export const subscribe = async (subplebbitAddress: string, accountName?: string) => {
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

  const updatedAccount: Account = {...account, subscriptions}
  // update account in db async for instant feedback speed
  accountsDatabase.addAccount(updatedAccount)
  const updatedAccounts = {...accounts, [updatedAccount.id]: updatedAccount}
  log('accountsActions.subscribe', {account: updatedAccount, accountName, subplebbitAddress})
  accountsStore.setState({accounts: updatedAccounts})
}

export const unsubscribe = async (subplebbitAddress: string, accountName?: string) => {
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

  const updatedAccount: Account = {...account, subscriptions}
  // update account in db async for instant feedback speed
  accountsDatabase.addAccount(updatedAccount)
  const updatedAccounts = {...accounts, [updatedAccount.id]: updatedAccount}
  log('accountsActions.unsubscribe', {account: updatedAccount, accountName, subplebbitAddress})
  accountsStore.setState({accounts: updatedAccounts})
}

export const blockAddress = async (address: string, accountName?: string) => {
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

  const updatedAccount: Account = {...account, blockedAddresses}
  // update account in db async for instant feedback speed
  accountsDatabase.addAccount(updatedAccount)
  const updatedAccounts = {...accounts, [updatedAccount.id]: updatedAccount}
  log('accountsActions.blockAddress', {account: updatedAccount, accountName, address})
  accountsStore.setState({accounts: updatedAccounts})
}

export const unblockAddress = async (address: string, accountName?: string) => {
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
    throw Error(`account '${account.id}' already unblocked address '${address}'`)
  }
  delete blockedAddresses[address]

  const updatedAccount: Account = {...account, blockedAddresses}
  // update account in db async for instant feedback speed
  accountsDatabase.addAccount(updatedAccount)
  const updatedAccounts = {...accounts, [updatedAccount.id]: updatedAccount}
  log('accountsActions.unblockAddress', {account: updatedAccount, accountName, address})
  accountsStore.setState({accounts: updatedAccounts})
}

export const blockCid = async (cid: string, accountName?: string) => {
  const {accounts, accountNamesToAccountIds, activeAccountId} = accountsStore.getState()
  assert(cid && typeof cid === 'string', `accountsActions.blockCid invalid cid '${cid}'`)
  assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use accountsStore.accountActions before initialized`)
  let account = accounts[activeAccountId]
  if (accountName) {
    const accountId = accountNamesToAccountIds[accountName]
    account = accounts[accountId]
  }
  assert(account?.id, `accountsActions.blockCid account.id '${account?.id}' doesn't exist, activeAccountId '${activeAccountId}' accountName '${accountName}'`)

  const blockedCids: {[cid: string]: boolean} = {...account.blockedCids}
  if (blockedCids[cid] === true) {
    throw Error(`account '${account.id}' already blocked cid '${cid}'`)
  }
  blockedCids[cid] = true

  const updatedAccount: Account = {...account, blockedCids}
  // update account in db async for instant feedback speed
  accountsDatabase.addAccount(updatedAccount)
  const updatedAccounts = {...accounts, [updatedAccount.id]: updatedAccount}
  log('accountsActions.blockCid', {account: updatedAccount, accountName, cid})
  accountsStore.setState({accounts: updatedAccounts})
}

export const unblockCid = async (cid: string, accountName?: string) => {
  const {accounts, accountNamesToAccountIds, activeAccountId} = accountsStore.getState()
  assert(cid && typeof cid === 'string', `accountsActions.unblockCid invalid cid '${cid}'`)
  assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use accountsStore.accountActions before initialized`)
  let account = accounts[activeAccountId]
  if (accountName) {
    const accountId = accountNamesToAccountIds[accountName]
    account = accounts[accountId]
  }
  assert(account?.id, `accountsActions.unblockCid account.id '${account?.id}' doesn't exist, activeAccountId '${activeAccountId}' accountName '${accountName}'`)

  const blockedCids: {[cid: string]: boolean} = {...account.blockedCids}
  if (!blockedCids[cid]) {
    throw Error(`account '${account.id}' already unblocked cid '${cid}'`)
  }
  delete blockedCids[cid]

  const updatedAccount: Account = {...account, blockedCids}
  // update account in db async for instant feedback speed
  accountsDatabase.addAccount(updatedAccount)
  const updatedAccounts = {...accounts, [updatedAccount.id]: updatedAccount}
  log('accountsActions.unblockCid', {account: updatedAccount, accountName, cid})
  accountsStore.setState({accounts: updatedAccounts})
}

export const publishComment = async (publishCommentOptions: PublishCommentOptions, accountName?: string) => {
  const {accounts, accountsComments, accountNamesToAccountIds, activeAccountId} = accountsStore.getState()
  assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use accountsStore.accountActions before initialized`)
  let account = accounts[activeAccountId]
  if (accountName) {
    const accountId = accountNamesToAccountIds[accountName]
    account = accounts[accountId]
  }
  validator.validateAccountsActionsPublishCommentArguments({publishCommentOptions, accountName, account})

  // find author.previousCommentCid if any
  const accountCommentsWithCids = accountsComments[account.id]
    .filter((comment: AccountComment) => comment.cid)
    // author can change his address, his previousCommentCid becomes invalid
    .filter((comment: AccountComment) => comment.author?.address === account.author?.address)
  const previousCommentCid = accountCommentsWithCids[accountCommentsWithCids.length - 1]?.cid
  const author = {...account.author}
  if (previousCommentCid) {
    author.previousCommentCid = previousCommentCid
  }

  let createCommentOptions: any = {
    timestamp: Math.round(Date.now() / 1000),
    author,
    signer: account.signer,
    ...publishCommentOptions,
  }
  delete createCommentOptions.onChallenge
  delete createCommentOptions.onChallengeVerification
  delete createCommentOptions.onError
  delete createCommentOptions.onPublishingStateChange

  // make sure the options dont throw
  await account.plebbit.createComment(createCommentOptions)

  // set fetching link dimensions state
  let fetchingLinkDimensionsStates: {state: string; publishingState: string}
  if (publishCommentOptions.link) {
    publishCommentOptions.onPublishingStateChange?.('fetching-link-dimensions')
    fetchingLinkDimensionsStates = {state: 'publishing', publishingState: 'fetching-link-dimensions'}
  }

  // save comment to db
  let accountCommentIndex = accountsComments[account.id].length
  await accountsDatabase.addAccountComment(account.id, createCommentOptions)
  let createdAccountComment: any
  accountsStore.setState(({accountsComments}) => {
    createdAccountComment = {...createCommentOptions, index: accountCommentIndex, accountId: account.id}
    return {
      accountsComments: {
        ...accountsComments,
        [account.id]: [...accountsComments[account.id], {...createdAccountComment, ...fetchingLinkDimensionsStates}],
      },
    }
  })

  let comment: any
  ;(async () => {
    // fetch comment.link dimensions
    if (publishCommentOptions.link) {
      const commentLinkDimensions = await fetchCommentLinkDimensions(publishCommentOptions.link)
      createCommentOptions = {...createCommentOptions, ...commentLinkDimensions}
      // save dimensions to db
      createdAccountComment = {...createCommentOptions, index: accountCommentIndex, accountId: account.id}
      await accountsDatabase.addAccountComment(account.id, createdAccountComment)
      accountsStore.setState(({accountsComments}) => {
        const accountComments: AccountComment[] = [...accountsComments[account.id]]
        accountComments[accountCommentIndex] = createdAccountComment
        return {accountsComments: {...accountsComments, [account.id]: accountComments}}
      })
    }
    comment = await account.plebbit.createComment(createCommentOptions)
    publishAndRetryFailedChallengeVerification()
    log('accountsActions.publishComment', {createCommentOptions})
  })()

  let lastChallenge: Challenge | undefined
  async function publishAndRetryFailedChallengeVerification() {
    comment.once('challenge', async (challenge: Challenge) => {
      lastChallenge = challenge
      publishCommentOptions.onChallenge(challenge, comment)
    })
    comment.once('challengeverification', async (challengeVerification: ChallengeVerification) => {
      publishCommentOptions.onChallengeVerification(challengeVerification, comment)
      if (!challengeVerification.challengeSuccess && lastChallenge) {
        // publish again automatically on fail
        createCommentOptions = {...createCommentOptions, timestamp: Math.round(Date.now() / 1000)}
        comment = await account.plebbit.createComment(createCommentOptions)
        lastChallenge = undefined
        publishAndRetryFailedChallengeVerification()
      } else {
        // the challengeverification message of a comment publication should in theory send back the CID
        // of the published comment which is needed to resolve it for replies, upvotes, etc
        if (challengeVerification?.publication?.cid) {
          const commentWithCid = comment
          await accountsDatabase.addAccountComment(account.id, commentWithCid, accountCommentIndex)
          accountsStore.setState(({accountsComments, commentCidsToAccountsComments}) => {
            const updatedAccountComments = [...accountsComments[account.id]]
            const updatedAccountComment = {...commentWithCid, index: accountCommentIndex, accountId: account.id}
            updatedAccountComments[accountCommentIndex] = updatedAccountComment
            return {
              accountsComments: {...accountsComments, [account.id]: updatedAccountComments},
              commentCidsToAccountsComments: {...commentCidsToAccountsComments, [challengeVerification?.publication?.cid]: {accountId: account.id, accountCommentIndex}},
            }
          })

          // clone the comment or it bugs publishing callbacks
          const updatingComment = await account.plebbit.createComment({...comment})
          accountsActionsInternal
            .startUpdatingAccountCommentOnCommentUpdateEvents(updatingComment, account, accountCommentIndex)
            .catch((error: unknown) =>
              log.error('accountsActions.publishComment startUpdatingAccountCommentOnCommentUpdateEvents error', {comment, account, accountCommentIndex, error})
            )
        }
      }
    })

    comment.on('error', (error: Error) => {
      accountsStore.setState(({accountsComments}) => {
        const accountComments = [...(accountsComments[account.id] || [])]
        const accountComment = accountComments[accountCommentIndex]
        // account comment hasn't been stored in state yet
        if (!accountComment) {
          return {}
        }
        const errors = [...(accountComment.errors || []), error]
        accountComments[accountCommentIndex] = {...accountComment, errors, error}
        return {accountsComments: {...accountsComments, [account.id]: accountComments}}
      })
      publishCommentOptions.onError?.(error, comment)
    })
    comment.on('publishingstatechange', async (publishingState: string) => {
      // set publishing state on account comment so the frontend can display it, dont persist in db because a reload cancels publishing
      accountsStore.setState(({accountsComments}) => {
        const accountComments = [...(accountsComments[account.id] || [])]
        const accountComment = accountComments[accountCommentIndex]
        // account comment hasn't been stored in state yet
        if (!accountComment) {
          return {}
        }
        accountComments[accountCommentIndex] = {...accountComment, publishingState}
        return {accountsComments: {...accountsComments, [account.id]: accountComments}}
      })

      publishCommentOptions.onPublishingStateChange?.(publishingState)
    })

    // set clients on account comment so the frontend can display it, dont persist in db because a reload cancels publishing
    utils.clientsOnStateChange(comment.clients, (clientState: string, clientType: string, clientUrl: string, chainTicker?: string) => {
      accountsStore.setState(({accountsComments}) => {
        const accountComments = [...(accountsComments[account.id] || [])]
        const accountComment = accountComments[accountCommentIndex]
        // account comment hasn't been stored in state yet
        if (!accountComment) {
          return {}
        }
        const clients = {...comment.clients}
        const client = {state: clientState}
        if (chainTicker) {
          const chainProviders = {...clients[clientType][chainTicker], [clientUrl]: client}
          clients[clientType] = {...clients[clientType], [chainTicker]: chainProviders}
        } else {
          clients[clientType] = {...clients[clientType], [clientUrl]: client}
        }
        accountComments[accountCommentIndex] = {...accountComment, clients}
        return {accountsComments: {...accountsComments, [account.id]: accountComments}}
      })
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

  return createdAccountComment
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

  let createVoteOptions: any = {
    timestamp: Math.round(Date.now() / 1000),
    author: account.author,
    signer: account.signer,
    ...publishVoteOptions,
  }
  delete createVoteOptions.onChallenge
  delete createVoteOptions.onChallengeVerification
  delete createVoteOptions.onError
  delete createVoteOptions.onPublishingStateChange

  let vote = await account.plebbit.createVote(createVoteOptions)
  let lastChallenge: Challenge | undefined
  const publishAndRetryFailedChallengeVerification = async () => {
    vote.once('challenge', async (challenge: Challenge) => {
      lastChallenge = challenge
      publishVoteOptions.onChallenge(challenge, vote)
    })
    vote.once('challengeverification', async (challengeVerification: ChallengeVerification) => {
      publishVoteOptions.onChallengeVerification(challengeVerification, vote)
      if (!challengeVerification.challengeSuccess && lastChallenge) {
        // publish again automatically on fail
        createVoteOptions = {...createVoteOptions, timestamp: Math.round(Date.now() / 1000)}
        vote = await account.plebbit.createVote(createVoteOptions)
        lastChallenge = undefined
        publishAndRetryFailedChallengeVerification()
      }
    })
    vote.on('error', (error: Error) => publishVoteOptions.onError?.(error, vote))
    // TODO: add publishingState to account votes
    vote.on('publishingstatechange', (publishingState: string) => publishVoteOptions.onPublishingStateChange?.(publishingState))
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
      [account.id]: {
        ...accountsVotes[account.id],
        [createVoteOptions.commentCid]:
          // remove signer and author because not needed and they expose private key
          {...createVoteOptions, signer: undefined, author: undefined},
      },
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

  let createCommentEditOptions: any = {
    timestamp: Math.round(Date.now() / 1000),
    author: account.author,
    signer: account.signer,
    ...publishCommentEditOptions,
  }
  delete createCommentEditOptions.onChallenge
  delete createCommentEditOptions.onChallengeVerification
  delete createCommentEditOptions.onError
  delete createCommentEditOptions.onPublishingStateChange

  let commentEdit = await account.plebbit.createCommentEdit(createCommentEditOptions)
  let lastChallenge: Challenge | undefined
  const publishAndRetryFailedChallengeVerification = async () => {
    commentEdit.once('challenge', async (challenge: Challenge) => {
      publishCommentEditOptions.onChallenge(challenge, commentEdit)
    })
    commentEdit.once('challengeverification', async (challengeVerification: ChallengeVerification) => {
      publishCommentEditOptions.onChallengeVerification(challengeVerification, commentEdit)
      if (!challengeVerification.challengeSuccess && lastChallenge) {
        // publish again automatically on fail
        createCommentEditOptions = {...createCommentEditOptions, timestamp: Math.round(Date.now() / 1000)}
        commentEdit = await account.plebbit.createCommentEdit(createCommentEditOptions)
        lastChallenge = undefined
        publishAndRetryFailedChallengeVerification()
      }
    })
    commentEdit.on('error', (error: Error) => publishCommentEditOptions.onError?.(error, commentEdit))
    // TODO: add publishingState to account edits
    commentEdit.on('publishingstatechange', (publishingState: string) => publishCommentEditOptions.onPublishingStateChange?.(publishingState))
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

  await accountsDatabase.addAccountEdit(account.id, createCommentEditOptions)
  log('accountsActions.publishCommentEdit', {createCommentEditOptions})
  accountsStore.setState(({accountsEdits}) => {
    // remove signer and author because not needed and they expose private key
    const commentEdit = {...createCommentEditOptions, signer: undefined, author: undefined}
    let commentEdits = accountsEdits[account.id][createCommentEditOptions.commentCid] || []
    commentEdits = [...commentEdits, commentEdit]
    return {
      accountsEdits: {
        ...accountsEdits,
        [account.id]: {...accountsEdits[account.id], [createCommentEditOptions.commentCid]: commentEdits},
      },
    }
  })
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
    publishSubplebbitEditOptions.onPublishingStateChange?.('succeeded')
    return
  }

  assert(
    !publishSubplebbitEditOptions.address || publishSubplebbitEditOptions.address === subplebbitAddress,
    `accountsActions.publishSubplebbitEdit can't edit address of a remote subplebbit`
  )
  let createSubplebbitEditOptions: any = {
    timestamp: Math.round(Date.now() / 1000),
    author: account.author,
    signer: account.signer,
    ...publishSubplebbitEditOptions,
    // not possible to edit subplebbit.address over pubsub, only locally
    address: subplebbitAddress,
  }
  delete createSubplebbitEditOptions.onChallenge
  delete createSubplebbitEditOptions.onChallengeVerification
  delete createSubplebbitEditOptions.onError
  delete createSubplebbitEditOptions.onPublishingStateChange

  let subplebbitEdit = await account.plebbit.createSubplebbitEdit(createSubplebbitEditOptions)
  let lastChallenge: Challenge | undefined
  const publishAndRetryFailedChallengeVerification = async () => {
    subplebbitEdit.once('challenge', async (challenge: Challenge) => {
      publishSubplebbitEditOptions.onChallenge(challenge, subplebbitEdit)
    })
    subplebbitEdit.once('challengeverification', async (challengeVerification: ChallengeVerification) => {
      publishSubplebbitEditOptions.onChallengeVerification(challengeVerification, subplebbitEdit)
      if (!challengeVerification.challengeSuccess && lastChallenge) {
        // publish again automatically on fail
        createSubplebbitEditOptions = {...createSubplebbitEditOptions, timestamp: Math.round(Date.now() / 1000)}
        subplebbitEdit = await account.plebbit.createSubplebbitEdit(createSubplebbitEditOptions)
        lastChallenge = undefined
        publishAndRetryFailedChallengeVerification()
      }
    })
    subplebbitEdit.on('error', (error: Error) => publishSubplebbitEditOptions.onError?.(error, subplebbitEdit))
    // TODO: add publishingState to account edits
    subplebbitEdit.on('publishingstatechange', (publishingState: string) => publishSubplebbitEditOptions.onPublishingStateChange?.(publishingState))
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

export const deleteSubplebbit = async (subplebbitAddress: string, accountName?: string) => {
  const {accounts, accountNamesToAccountIds, activeAccountId} = accountsStore.getState()
  assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use accountsStore.accountsActions before initialized`)
  let account = accounts[activeAccountId]
  if (accountName) {
    const accountId = accountNamesToAccountIds[accountName]
    account = accounts[accountId]
  }

  await subplebbitsStore.getState().deleteSubplebbit(subplebbitAddress, account)
  log('accountsActions.deleteSubplebbit', {subplebbitAddress})
}
