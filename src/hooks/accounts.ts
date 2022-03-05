import { useEffect, useMemo, useState, useContext } from 'react'
import { AccountsContext } from '../providers/AccountsProvider'
import PlebbitJs from '../plebbit-js'
import Debug from 'debug'
const debug = Debug('plebbitreacthooks:hooks:accounts')
import assert from 'assert'

/**
 * @param accountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, return
 * the active account id.
 */
function useAccountId(accountName?: string) {
  const accountsContext = useContext(AccountsContext)
  const accountId = accountName && accountsContext?.accountNamesToAccountIds[accountName]
  const activeAccountId = accountsContext?.activeAccountId
  const accountIdToUse = accountName ? accountId : activeAccountId
  return accountIdToUse
}

/**
 * @param accountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, return
 * the active account.
 */
export function useAccount(accountName?: string) {
  const accountsContext = useContext(AccountsContext)
  const accountId = useAccountId(accountName)
  const account = accountsContext?.accounts[accountId]
  debug('useAccount', { accountId, account, accountName: account?.name })
  return account
}

/**
 * Return all accounts in the order of `AccountsContext.accountIds`. To reorder, use `accountsActions.setAccountsOrder(accountNames)`
 */
export function useAccounts() {
  const accountsContext = useContext(AccountsContext)
  let accounts
  if (accountsContext?.accountIds?.length && accountsContext?.accounts) {
    accounts = []
    for (const accountId of accountsContext.accountIds) {
      accounts.push(accountsContext.accounts[accountId])
    }
    return accounts
  }
  debug('useAccounts', { accounts, accountIds: accountsContext?.accountIds })
  return accounts
}

export function useAccountsActions() {
  const accountsContext = useContext(AccountsContext)
  if (accountsContext) {
    return accountsContext.accountsActions
  }
  // return empty object for deconstructing without errors
  // e.g. const {createAccount} = useAccountsActions()
  // TODO: possibly return functions that throw 'not ready', or promises that wait until ready
  return {}
}

/**
 * Returns the own user's comments stored locally, even those not yet published by the subplebbit owner
 */
export function useAccountComments(accountCommentsOptions?: AccountCommentsOptions) {
  const accountId = useAccountId(accountCommentsOptions?.accountName)
  const accountsContext = useContext(AccountsContext)

  let accountComments: any
  if (accountId && accountsContext) {
    accountComments = accountsContext.accountsComments[accountId]
  }

  const filteredAccountComments = useMemo(() => {
    if (!accountComments) {
      return
    }
    if (accountCommentsOptions?.filter) {
      return filterPublications(accountComments, accountCommentsOptions.filter)
    }
    return accountComments
  }
  , [accountComments, accountCommentsOptions])

  debug('useAccountComments', { accountId, filteredAccountComments, accountComments, accountCommentsOptions })
  return filteredAccountComments
}

/**
 * Returns the own user's votes stored locally, even those not yet published by the subplebbit owner
 */
export function useAccountVotes(accountVotesOptions?: AccountCommentsOptions) {
  const accountId = useAccountId(accountVotesOptions?.accountName)
  const accountsContext = useContext(AccountsContext)

  let accountVotes: any
  if (accountId && accountsContext) {
    accountVotes = accountsContext.accountsVotes[accountId]
  }

  const filteredAccountVotesArray = useMemo(() => {
    if (!accountVotes) {
      return
    }
    let accountVotesArray = []
    for (const i in accountVotes) {
      accountVotesArray.push(accountVotes[i])
    }
    if (accountVotesOptions?.filter) {
      accountVotesArray = filterPublications(accountVotesArray, accountVotesOptions.filter)
    }
    return accountVotesArray
  }
  , [accountVotes, accountVotesOptions])

  debug('useAccountVotes', { accountId, filteredAccountVotesArray, accountVotes, accountVotesOptions })
  return filteredAccountVotesArray
}

export function useAccountVote(commentCid?: string, accountName?: string) {
  const accountVotesOptions: AccountCommentsOptions = {accountName}
  if (commentCid) {
    accountVotesOptions.filter = {commentCids: [commentCid]}
  }
  const accountVotes = useAccountVotes(accountVotesOptions)
  return accountVotes && accountVotes[0]
}

export type AccountCommentsFilter = {
  subplebbitAddresses?: string[]
  postCids?: string[]
  commentCids?: string[]
  parentCommentCids?: string[]
  hasParentCommentCid?: boolean
}

export type AccountCommentsOptions = {
  accountName?: string
  filter?: AccountCommentsFilter
}

const filterPublications = (publications: any, filter: AccountCommentsFilter) => {
  for (const postCid of filter.postCids || []) {
    assert(postCid && typeof postCid === 'string', `accountCommentsFilter postCid '${postCid}' not a string`)
  }
  for (const subplebbitAddress of filter.subplebbitAddresses || []) {
    assert(subplebbitAddress && typeof subplebbitAddress === 'string', `accountCommentsFilter subplebbitAddress '${subplebbitAddress}' not a string`)
  }
  for (const commentCid of filter.commentCids || []) {
    assert(commentCid && typeof commentCid === 'string', `accountCommentsFilter commentCid '${commentCid}' not a string`)
  }
  for (const parentCommentCid of filter.parentCommentCids || []) {
    assert(parentCommentCid && typeof parentCommentCid === 'string', `accountCommentsFilter parentCommentCid '${parentCommentCid}' not a string`)
  }
  const filteredPublications = []
  for (const publication of publications) {
    let isFilteredOut = false
    if (filter.subplebbitAddresses?.length && !filter.subplebbitAddresses.includes(publication.subplebbitAddress)) {
      isFilteredOut = true
    }
    if (filter.postCids?.length && !filter.postCids.includes(publication.postCid)) {
      isFilteredOut = true
    }
    if (filter.commentCids?.length && !filter.commentCids.includes(publication.commentCid)) {
      isFilteredOut = true
    }
    if (filter.parentCommentCids?.length && !filter.parentCommentCids.includes(publication.parentCommentCid)) {
      isFilteredOut = true
    }
    if (typeof filter.hasParentCommentCid === 'boolean' && filter.hasParentCommentCid !== Boolean(publication.parentCommentCid)) {
      isFilteredOut = true
    }
    if (!isFilteredOut) {
      filteredPublications.push(publication)
    }
  }
  return filteredPublications
}
