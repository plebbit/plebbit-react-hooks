import { useEffect, useMemo, useState, useContext } from 'react'
import { AccountsContext } from './providers/AccountsProvider'
import PlebbitJs from './plebbit-js'
import Debug from 'debug'
const debug = Debug('plebbitreacthooks:hooks')

/**
 * @param accountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, return
 * the active account.
 */
export function useAccount(accountName?: string) {
  const accountsContext = useContext(AccountsContext)
  const activeAccountName = accountsContext?.activeAccountName
  const accountNameToUse = accountName || activeAccountName
  const account = accountsContext?.accounts[accountNameToUse]
  debug({ accountName, account, activeAccountName })
  return account
}

/**
 * Return all accounts in the order of `AccountsContext.accountNames`. To reorder, use `accountsActions.setAccountsOrder(accountNames)`
 */
export function useAccounts() {
  const accountsContext = useContext(AccountsContext)
  let accounts
  if (accountsContext?.accountNames?.length && accountsContext?.accounts) {
    accounts = []
    for (const accountName of accountsContext.accountNames) {
      accounts.push(accountsContext.accounts[accountName])
    }
    return accounts
  }
  debug({ accounts, accountNames: accountsContext?.accountNames })
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
