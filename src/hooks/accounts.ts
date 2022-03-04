import { useEffect, useMemo, useState, useContext } from 'react'
import { AccountsContext } from '../providers/AccountsProvider'
import PlebbitJs from '../plebbit-js'
import Debug from 'debug'
const debug = Debug('plebbitreacthooks:hooks')

/**
 * @param accountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, return
 * the active account.
 */
export function useAccount(accountName?: string) {
  const accountsContext = useContext(AccountsContext)
  let accountId = accountName && accountsContext?.accountNamesToAccountIds[accountName]
  const activeAccountId = accountsContext?.activeAccountId
  const accountNameToUse = accountName ? accountId : activeAccountId
  const account = accountsContext?.accounts[accountNameToUse]
  debug({ accountName, accountId, activeAccountId, account, activeAccountName: account?.name })
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
  debug({ accounts, accountIds: accountsContext?.accountIds })
  return accounts
}

export function useAccountsActions() {
  const accountsContext = useContext(AccountsContext)
  if (accountsContext) {
    return accountsContext.accountsActions
  }
  // return empty object for deconstructing without errors
  // e.g. const {createAccount} = useAccountsActions()
  return {}
}
