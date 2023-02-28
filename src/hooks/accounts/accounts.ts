import {useMemo, useState} from 'react'
import useAccountsStore from '../../stores/accounts'
import Logger from '@plebbit/plebbit-logger'
const log = Logger('plebbit-react-hooks:hooks:accounts')
import assert from 'assert'
import {useListSubplebbits, useSubplebbits} from '../subplebbits'
import type {
  UseAccountCommentsFilter,
  UseAccountCommentsOptions,
  AccountComments,
  AccountNotifications,
  Account,
  Accounts,
  AccountsComments,
  AccountsCommentsReplies,
} from '../../types'
import {filterPublications, useAccountsWithCalculatedProperties, useAccountWithCalculatedProperties, useCalculatedAccountNotifications} from './utils'

/**
 * @param accountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, return
 * the active account id.
 */
export function useAccountId(accountName?: string) {
  const accountId = useAccountsStore((state) => state.accountNamesToAccountIds[accountName || ''])
  // don't consider active account if account name is defined
  const activeAccountId = useAccountsStore((state) => !accountName && state.activeAccountId)
  const accountIdToUse = accountName ? accountId : activeAccountId
  return accountIdToUse
}

/**
 * @param accountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, return
 * the active account.
 */
export function useAccount(accountName?: string) {
  // get state
  const accountId = useAccountId(accountName)
  const accountStore = useAccountsStore((state) => state.accounts[accountId || ''])
  const accountComments = useAccountsStore((state) => state.accountsComments[accountId || ''])
  const accountCommentsReplies = useAccountsStore((state) => state.accountsCommentsReplies[accountId || ''])
  const account = useAccountWithCalculatedProperties(accountStore, accountComments, accountCommentsReplies)
  log('useAccount', {accountId, account, accountName})
  return account
}

/**
 * Return all accounts in the order of `accountsStore.accountIds`. To reorder, use `accountsActions.setAccountsOrder(accountNames)`.
 */
export function useAccounts() {
  const accountIds = useAccountsStore((state) => state.accountIds)
  const accountsStore = useAccountsStore((state) => state.accounts)
  const accountsComments = useAccountsStore((state) => state.accountsComments)
  const accountsCommentsReplies = useAccountsStore((state) => state.accountsCommentsReplies)
  const accounts = useAccountsWithCalculatedProperties(accountsStore, accountsComments, accountsCommentsReplies)
  const accountsArray: Account[] = useMemo(() => {
    const accountsArray = []
    if (accountIds?.length && accounts) {
      for (const accountId of accountIds) {
        accountsArray.push(accounts[accountId])
      }
    }
    return accountsArray
  }, [accounts, accountIds])

  log('useAccounts', {accounts, accountIds})
  return accountsArray
}

/**
 * Returns all the accounts related actions, like {createAccount, publishComment, publishVote, etc.}
 */
export function useAccountsActions() {
  const accountsActions = useAccountsStore((state) => state.accountsActions)
  return accountsActions
}

/**
 * Returns all subplebbits where the account is a creator or moderator
 */
export function useAccountSubplebbits(accountName?: string) {
  const accountId = useAccountId(accountName)
  const accountsStoreAccountSubplebbits = useAccountsStore((state) => state.accounts[accountId || '']?.subplebbits)

  // get all unique account subplebbit addresses
  const ownerSubplebbitAddresses = useListSubplebbits()
  const uniqueSubplebbitAddresses: string[] = useMemo(() => {
    const accountSubplebbitAddresses = []
    if (accountsStoreAccountSubplebbits) {
      for (const subplebbitAddress in accountsStoreAccountSubplebbits) {
        accountSubplebbitAddresses.push(subplebbitAddress)
      }
    }
    const uniqueSubplebbitAddresses = [...new Set([...ownerSubplebbitAddresses, ...accountSubplebbitAddresses])].sort()
    return uniqueSubplebbitAddresses
  }, [accountsStoreAccountSubplebbits, ownerSubplebbitAddresses])

  // fetch all subplebbit data
  const {subplebbits: subplebbitsArray} = useSubplebbits({subplebbitAddresses: uniqueSubplebbitAddresses, accountName})
  const subplebbits: any = useMemo(() => {
    const subplebbits: any = {}
    for (const [i, subplebbit] of subplebbitsArray.entries()) {
      subplebbits[uniqueSubplebbitAddresses[i]] = {
        ...subplebbit,
        // make sure the address is defined if the subplebbit hasn't fetched yet
        address: uniqueSubplebbitAddresses[i],
      }
    }
    return subplebbits
  }, [subplebbitsArray, uniqueSubplebbitAddresses])

  // merged subplebbit data with account.subplebbits data
  const accountSubplebbits: any = useMemo(() => {
    const accountSubplebbits: any = {...subplebbits}
    if (accountsStoreAccountSubplebbits) {
      for (const subplebbitAddress in accountsStoreAccountSubplebbits) {
        accountSubplebbits[subplebbitAddress] = {
          ...accountSubplebbits[subplebbitAddress],
          ...accountsStoreAccountSubplebbits[subplebbitAddress],
        }
      }
    }
    // add listSubplebbits data
    for (const subplebbitAddress in accountSubplebbits) {
      if (ownerSubplebbitAddresses.includes(subplebbitAddress)) {
        accountSubplebbits[subplebbitAddress].role = {role: 'owner'}
      }
    }
    return accountSubplebbits
  }, [accountsStoreAccountSubplebbits, ownerSubplebbitAddresses, subplebbits])

  if (accountId) {
    log('useAccountSubplebbits', {accountSubplebbits})
  }
  return accountSubplebbits
}

/**
 * Returns an account's notifications in an array. Unread notifications have a field markedAsRead: false.
 *
 * @param accountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, return
 * the active account's notifications.
 */
export function useAccountNotifications(accountName?: string) {
  // get state
  const accountId = useAccountId(accountName)
  const account = useAccountsStore((state) => state.accounts[accountId || ''])
  const accountCommentsReplies = useAccountsStore((state) => state.accountsCommentsReplies[accountId || ''])
  const accountsActionsInternal = useAccountsStore((state) => state.accountsActionsInternal)
  const notifications = useCalculatedAccountNotifications(account, accountCommentsReplies)

  const markAsRead = () => {
    if (!account) {
      throw Error('useAccountNotifications cannot mark as read accounts not initalized yet')
    }
    accountsActionsInternal.markAccountNotificationsAsRead(account)
  }
  if (account) {
    log('useAccountNotifications', {notifications})
  }
  return {notifications, markAsRead}
}

/**
 * Returns the own user's comments stored locally, even those not yet published by the subplebbit owner.
 * Check UseAccountCommentsOptions type in types.tsx to filter them, e.g. filter = {subplebbitAddresses: ['memes.eth']}.
 */
export function useAccountComments(useAccountCommentsOptions?: UseAccountCommentsOptions) {
  const accountId = useAccountId(useAccountCommentsOptions?.accountName)
  const accountComments = useAccountsStore((state) => state.accountsComments[accountId || ''])

  const filteredAccountComments = useMemo(() => {
    if (!accountComments) {
      return
    }
    if (useAccountCommentsOptions?.filter) {
      return filterPublications(accountComments, useAccountCommentsOptions.filter)
    }
    return accountComments
  }, [accountComments, useAccountCommentsOptions])

  if (accountComments && useAccountCommentsOptions) {
    log('useAccountComments', {accountId, filteredAccountComments, accountComments, useAccountCommentsOptions})
  }
  return filteredAccountComments
}

/**
 * Returns the own user's votes stored locally, even those not yet published by the subplebbit owner.
 * Check UseAccountCommentsOptions type in types.tsx to filter them, e.g. filter = {subplebbitAddresses: ['memes.eth']}.
 */
export function useAccountVotes(useAccountVotesOptions?: UseAccountCommentsOptions) {
  const accountId = useAccountId(useAccountVotesOptions?.accountName)
  const accountVotes = useAccountsStore((state) => state.accountsVotes[accountId || ''])

  const filteredAccountVotesArray = useMemo(() => {
    if (!accountVotes) {
      return
    }
    let accountVotesArray = []
    for (const i in accountVotes) {
      accountVotesArray.push(accountVotes[i])
    }
    if (useAccountVotesOptions?.filter) {
      accountVotesArray = filterPublications(accountVotesArray, useAccountVotesOptions.filter)
    }
    return accountVotesArray
  }, [accountVotes, useAccountVotesOptions])

  if (accountVotes && useAccountVotesOptions) {
    log('useAccountVotes', {accountId, filteredAccountVotesArray, accountVotes, useAccountVotesOptions})
  }
  return filteredAccountVotesArray
}

/**
 * Returns an account's single vote on a comment, e.g. to know if you already voted on a comment.
 */
export function useAccountVote(commentCid?: string, accountName?: string) {
  const accountId = useAccountId(accountName)
  const accountVotes = useAccountsStore((state) => state.accountsVotes[accountId || ''])
  return (commentCid && accountVotes && accountVotes[commentCid]) || 0
}
