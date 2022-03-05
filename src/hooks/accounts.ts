import { useEffect, useMemo, useState, useContext } from 'react'
import { AccountsContext } from '../providers/AccountsProvider'
import PlebbitJs from '../plebbit-js'
import Debug from 'debug'
const debug = Debug('plebbitreacthooks:hooks:accounts')

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

export function useAccountComments(accountCommentsOptions?: AccountCommentsOptions) {
  const accountId = useAccountId(accountCommentsOptions?.accountName)
  const accountsContext = useContext(AccountsContext)
  if (accountId && accountsContext) {
    return accountsContext.accountsComments[accountId]
  }
}

export function useIsAccountComment(commentCid?: string, accountName?: string) {

}

export function useAccountVotes(accountCommentsOptions?: AccountCommentsOptions) {
  const accountId = useAccountId(accountCommentsOptions?.accountName)
  const accountsContext = useContext(AccountsContext)

  let accountVotes: any
  if (accountId && accountsContext) {
    accountVotes = accountsContext.accountsVotes[accountId]
  }

  const accountVotesArray = useMemo(() => {
    if (!accountVotes) {
      return
    }
    const accountVotesArray = []
    for (const i in accountVotes) {
      accountVotesArray.push(accountVotes[i])
    }
    return accountVotesArray
  }
  , [accountVotes])

  debug('useAccountVotes', { accountId, accountVotesArray, accountVotes })
  return accountVotesArray
}

export function useAccountVote(commentCid?: string, accountName?: string) {

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