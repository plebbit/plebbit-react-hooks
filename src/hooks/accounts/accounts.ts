import {useMemo, useState} from 'react'
import useAccountsStore from '../../stores/accounts'
import PlebbitJs from '../../lib/plebbit-js'
import Logger from '@plebbit/plebbit-logger'
const log = Logger('plebbit-react-hooks:hooks:accounts')
import assert from 'assert'
import {useListSubplebbits, useSubplebbits} from '../subplebbits'
import type {UseAccountCommentsFilter, UseAccountCommentsOptions, AccountComments, AccountNotifications, Account} from '../../types'
import {filterPublications, useAccountsWithCalculatedProperties, useAccountsNotifications} from './utils'

/**
 * @param accountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, return
 * the active account id.
 */
function useAccountId(accountName?: string) {
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
  const accountsStore = useAccountsStore()
  const accounts = useAccountsWithCalculatedProperties(accountsStore.accounts, accountsStore.accountsComments, accountsStore.accountsCommentsReplies)
  const accountId = useAccountId(accountName)
  const account = accountId && accounts?.[accountId]
  log('useAccount', {accountId, account, accountName})
  return account
}

/**
 * Return all accounts in the order of `accountsStore.accountIds`. To reorder, use `accountsActions.setAccountsOrder(accountNames)`.
 */
export function useAccounts() {
  const accountsStore = useAccountsStore()
  const accounts = useAccountsWithCalculatedProperties(accountsStore.accounts, accountsStore.accountsComments, accountsStore.accountsCommentsReplies)
  const accountsArray: Account[] = []
  if (accountsStore?.accountIds?.length && accounts) {
    for (const accountId of accountsStore.accountIds) {
      accountsArray.push(accounts[accountId])
    }
    return accountsArray
  }
  log('useAccounts', {accounts, accountIds: accountsStore?.accountIds})
  return accountsArray
}

/**
 * Returns all the accounts related actions, like {createAccount, publishComment, publishVote, etc.}
 */
export function useAccountsActions() {
  const accountsStore = useAccountsStore()
  return accountsStore.accountsActions
}

/**
 * Returns all subplebbits where the account is a creator or moderator
 */
export function useAccountSubplebbits(accountName?: string) {
  const accountId = useAccountId(accountName)
  const accountsStoreAccountSubplebbits = useAccountsStore((state) => state.accounts[accountId || '']?.subplebbits, jsonStringifyEqual)

  // get all unique account subplebbit addresses
  const ownerSubplebbitAddresses = useListSubplebbits()
  const accountSubplebbitAddresses = []
  if (accountsStoreAccountSubplebbits) {
    for (const subplebbitAddress in accountsStoreAccountSubplebbits) {
      accountSubplebbitAddresses.push(subplebbitAddress)
    }
  }
  const uniqueSubplebbitAddresses = [...new Set([...ownerSubplebbitAddresses, ...accountSubplebbitAddresses])].sort()

  // fetch all subplebbit data
  const subplebbitsArray = useSubplebbits(uniqueSubplebbitAddresses, accountName)
  const subplebbits: any = {}
  for (const [i, subplebbit] of subplebbitsArray.entries()) {
    subplebbits[uniqueSubplebbitAddresses[i]] = {
      ...subplebbit,
      // make sure the address is defined if the subplebbit hasn't fetched yet
      address: uniqueSubplebbitAddresses[i],
    }
  }

  // merged subplebbit data with account.subplebbits data
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
  const accountsStore = useAccountsStore()
  const accountsNotifications = useAccountsNotifications(accountsStore.accounts, accountsStore.accountsCommentsReplies)

  const accountId = useAccountId(accountName)
  const account = accountId && accountsStore?.accounts[accountId]
  const notifications: AccountNotifications = (accountId && accountsNotifications?.[accountId]) || []

  const markAsRead = () => {
    if (!account) {
      throw Error('useAccountNotifications cannot mark as read accounts not initalized yet')
    }
    accountsStore.accountsActionsInternal.markAccountNotificationsAsRead(account)
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
  const accountComments = useAccountsStore((state) => state.accountsComments[accountId || ''], jsonStringifyEqual)

  const filteredAccountComments = useMemo(() => {
    if (!accountComments) {
      return
    }
    if (useAccountCommentsOptions?.filter) {
      return filterPublications(accountComments, useAccountCommentsOptions.filter)
    }
    return accountComments
  }, [JSON.stringify(accountComments), JSON.stringify(useAccountCommentsOptions)])

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
  const accountVotes = useAccountsStore((state) => state.accountsVotes[accountId || ''], jsonStringifyEqual)

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
  }, [JSON.stringify(accountVotes), JSON.stringify(useAccountVotesOptions)])

  if (accountVotes && useAccountVotesOptions) {
    log('useAccountVotes', {accountId, filteredAccountVotesArray, accountVotes, useAccountVotesOptions})
  }
  return filteredAccountVotesArray
}

/**
 * Returns an account's single vote on a comment, e.g. to know if you already voted on a comment.
 */
export function useAccountVote(commentCid?: string, accountName?: string) {
  const useAccountVotesOptions: UseAccountCommentsOptions = {accountName}
  if (commentCid) {
    useAccountVotesOptions.filter = {commentCids: [commentCid]}
  }
  const accountVotes = useAccountVotes(useAccountVotesOptions)
  return accountVotes && accountVotes[0]
}

/**
 * Equality function for zustand
 */
function jsonStringifyEqual(objA?: any, objB?: any) {
  return JSON.stringify(objA) === JSON.stringify(objB)
}
