import {useMemo, useState} from 'react'
import useAccountsStore from '../../stores/accounts'
import Logger from '@plebbit/plebbit-logger'
const log = Logger('plebbit-react-hooks:hooks:accounts')
import assert from 'assert'
import {useListSubplebbits, useSubplebbits} from '../subplebbits'
import type {
  AccountComments,
  Account,
  Accounts,
  AccountVote,
  AccountsComments,
  AccountsCommentsReplies,
  UseAccountSubplebbitsOptions,
  UseAccountSubplebbitsResult,
  UseAccountVoteOptions,
  UseAccountVoteResult,
  UseAccountVotesOptions,
  UseAccountVotesResult,
  UseAccountCommentsOptions,
  UseAccountCommentsResult,
  UseNotificationsOptions,
  UseNotificationsResult,
  UseAccountOptions,
  UseAccountResult,
} from '../../types'
import {filterPublications, useAccountsWithCalculatedProperties, useAccountWithCalculatedProperties, useCalculatedNotifications} from './utils'

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
export function useAccount(options?: UseAccountOptions): UseAccountResult {
  const {accountName} = options || {}
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

  const state = accountsArray?.length ? 'succeeded' : 'initializing'

  return useMemo(
    () => ({
      accounts: accountsArray,
      state,
      error: undefined,
      errors: [],
    }),
    [accountsArray, state]
  )
}

/**
 * Returns all subplebbits where the account is a creator or moderator
 */
export function useAccountSubplebbits(options?: UseAccountSubplebbitsOptions): UseAccountSubplebbitsResult {
  const {accountName} = options || {}
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

  const state = accountId ? 'succeeded' : 'initializing'

  return useMemo(
    () => ({
      accountSubplebbits,
      state,
      error: undefined,
      errors: [],
    }),
    [accountSubplebbits, state]
  )
}

/**
 * Returns an account's notifications in an array. Unread notifications have a field markedAsRead: false.
 *
 * @param accountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, return
 * the active account's notifications.
 */
export function useNotifications(options?: UseNotificationsOptions): UseNotificationsResult {
  const {accountName} = options || {}
  // get state
  const accountId = useAccountId(accountName)
  const account = useAccountsStore((state) => state.accounts[accountId || ''])
  const accountCommentsReplies = useAccountsStore((state) => state.accountsCommentsReplies[accountId || ''])
  const accountsActionsInternal = useAccountsStore((state) => state.accountsActionsInternal)
  const notifications = useCalculatedNotifications(account, accountCommentsReplies)
  const [errors, setErrors] = useState<Error[]>([])

  const markAsRead = async () => {
    try {
      if (!account) {
        throw Error('useNotifications cannot mark as read accounts not initalized yet')
      }
      accountsActionsInternal.markNotificationsAsRead(account)
    } catch (e: any) {
      setErrors([...errors, e])
    }
  }

  if (account) {
    log('useNotifications', {notifications})
  }

  const state = accountId ? 'succeeded' : 'initializing'

  return useMemo(
    () => ({
      notifications,
      markAsRead,
      state,
      error: errors[errors.length - 1],
      errors,
    }),
    [notifications, errors]
  )
}

/**
 * Returns the own user's comments stored locally, even those not yet published by the subplebbit owner.
 * Check UseAccountCommentsOptions type in types.tsx to filter them, e.g. filter = {subplebbitAddresses: ['memes.eth']}.
 */
export function useAccountComments(options?: UseAccountCommentsOptions): UseAccountCommentsResult {
  const {accountName, filter} = options || {}
  const accountId = useAccountId(accountName)
  const accountComments = useAccountsStore((state) => state.accountsComments[accountId || ''])

  const filteredAccountComments = useMemo(() => {
    if (!accountComments) {
      return []
    }
    if (filter) {
      return filterPublications(accountComments, filter)
    }
    return accountComments
  }, [accountComments, filter])

  if (accountComments && options) {
    log('useAccountComments', {accountId, filteredAccountComments, accountComments, filter})
  }

  const state = accountId ? 'succeeded' : 'initializing'

  return useMemo(
    () => ({
      accountComments: filteredAccountComments,
      state,
      error: undefined,
      errors: [],
    }),
    [filteredAccountComments, state]
  )
}

/**
 * Returns the own user's votes stored locally, even those not yet published by the subplebbit owner.
 * Check UseAccountCommentsOptions type in types.tsx to filter them, e.g. filter = {subplebbitAddresses: ['memes.eth']}.
 */
export function useAccountVotes(options?: UseAccountVotesOptions): UseAccountVotesResult {
  const {accountName, filter} = options || {}
  const accountId = useAccountId(accountName)
  const accountVotes = useAccountsStore((state) => state.accountsVotes[accountId || ''])

  const filteredAccountVotesArray = useMemo(() => {
    let accountVotesArray: AccountVote[] = []
    if (!accountVotes) {
      return accountVotesArray
    }
    for (const i in accountVotes) {
      accountVotesArray.push(accountVotes[i])
    }
    if (filter) {
      accountVotesArray = filterPublications(accountVotesArray, filter)
    }
    return accountVotesArray
  }, [accountVotes, filter])

  if (accountVotes && filter) {
    log('useAccountVotes', {accountId, filteredAccountVotesArray, accountVotes, filter})
  }

  const state = accountId ? 'succeeded' : 'initializing'

  return useMemo(
    () => ({
      accountVotes: filteredAccountVotesArray,
      state,
      error: undefined,
      errors: [],
    }),
    [filteredAccountVotesArray, state]
  )
}

/**
 * Returns an account's single vote on a comment, e.g. to know if you already voted on a comment.
 */
export function useAccountVote(options?: UseAccountVoteOptions): UseAccountVoteResult {
  const {commentCid, accountName} = options || {}
  const accountId = useAccountId(accountName)
  const accountVotes = useAccountsStore((state) => state.accountsVotes[accountId || ''])
  const accountVote: any = accountVotes?.[commentCid || '']
  const state = accountId && commentCid ? 'succeeded' : 'initializing'

  return useMemo(
    () => ({
      ...accountVote,
      state,
      error: undefined,
      errors: [],
    }),
    [accountVote, state]
  )
}
