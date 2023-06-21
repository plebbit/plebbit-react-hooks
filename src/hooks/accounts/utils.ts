import assert from 'assert'
import type {
  Account,
  AccountPublicationsFilter,
  AccountsCommentsReplies,
  AccountCommentsReplies,
  AccountsComments,
  AccountComments,
  Accounts,
  AccountsNotifications,
  Notification,
  AccountCommentReply,
} from '../../types'
import {useMemo, useState, useEffect} from 'react'
// @ts-ignore
import useShortAddress from '../utils/use-short-address'
import memoize from 'memoizee'
import utils from '../../lib/utils'
import PlebbitJs from '../../lib/plebbit-js'
import Logger from '@plebbit/plebbit-logger'
const log = Logger('plebbit-react-hooks:accounts:hooks')

/**
 * Filter publications, for example only get comments that are posts, votes in a certain subplebbit, etc.
 * Check AccountPublicationsFilter type in types.tsx for more information, e.g. filter = {subplebbitAddresses: ['memes.eth']}.
 */
export const filterPublications = (publications: any, filter: AccountPublicationsFilter) => {
  for (const postCid of filter.postCids || []) {
    assert(postCid && typeof postCid === 'string', `accountCommentsFilter postCid '${postCid}' not a string`)
  }
  for (const subplebbitAddress of filter.subplebbitAddresses || []) {
    assert(subplebbitAddress && typeof subplebbitAddress === 'string', `accountCommentsFilter subplebbitAddress '${subplebbitAddress}' not a string`)
  }
  for (const commentCid of filter.commentCids || []) {
    assert(commentCid && typeof commentCid === 'string', `accountCommentsFilter commentCid '${commentCid}' not a string`)
  }
  for (const parentCid of filter.parentCids || []) {
    assert(parentCid && typeof parentCid === 'string', `accountCommentsFilter parentCid '${parentCid}' not a string`)
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
    if (filter.parentCids?.length && !filter.parentCids.includes(publication.parentCid)) {
      isFilteredOut = true
    }
    if (typeof filter.hasParentCid === 'boolean' && filter.hasParentCid !== Boolean(publication.parentCid)) {
      isFilteredOut = true
    }
    if (!isFilteredOut) {
      filteredPublications.push(publication)
    }
  }
  return filteredPublications
}

export const useCalculatedNotifications = (account?: Account, accountCommentsReplies?: AccountCommentsReplies) => {
  return useMemo(() => {
    if (!account || !accountCommentsReplies) {
      return []
    }
    // get reply notifications only
    // TODO: at some point we should also add upvote notifications like 'your post has gotten 10 upvotes'
    return getReplyNotificationsFromAccountCommentsReplies(accountCommentsReplies, account?.blockedAddresses, account?.blockedCids)
  }, [accountCommentsReplies, account?.blockedAddresses, account?.blockedCids])
}

// accountsBlockedAddresses must be cached to prevent rerenders
// TODO: add accountsBlockedAddresses as an object in the store that can easily be === checked for equality
const getAccountsBlockedAddressesNoCache = (...args: any) => {
  const accountsBlockedAddresses: {[accountId: string]: {[address: string]: boolean}} = {}
  const separator = Math.ceil(args.length / 2)
  for (const [i] of args.entries()) {
    const accountId = args[i]
    const accountBlockedAddresses = args[i + separator]
    if (accountBlockedAddresses) {
      accountsBlockedAddresses[accountId] = accountBlockedAddresses
    }
  }
  return accountsBlockedAddresses
}
// length false because variable arguments legnth
const getAccountsBlockedAddressesCached = memoize(getAccountsBlockedAddressesNoCache, {max: 100, length: false})

// accountsBlockedCids must be cached to prevent rerenders
// TODO: add accountsBlockedCids as an object in the store that can easily be === checked for equality
const getAccountsBlockedCidsNoCache = (...args: any) => {
  const accountsBlockedCids: {[accountId: string]: {[cid: string]: boolean}} = {}
  const separator = Math.ceil(args.length / 2)
  for (const [i] of args.entries()) {
    const accountId = args[i]
    const accountBlockedCids = args[i + separator]
    if (accountBlockedCids) {
      accountsBlockedCids[accountId] = accountBlockedCids
    }
  }
  return accountsBlockedCids
}
// length false because variable arguments legnth
const getAccountsBlockedCidsCached = memoize(getAccountsBlockedCidsNoCache, {max: 100, length: false})

export const useCalculatedAccountsNotifications = (accounts?: Accounts, accountsCommentsReplies?: AccountsCommentsReplies) => {
  // accountsBlockedAddresses and accountsBlockedCids must be cached to prevent rerenders
  // TODO: add accountsBlockedAddresses and accountsBlockedCids as objects in the store that can easily be === checked for equality
  let accountsBlockedAddresses: any
  let accountsBlockedCids: any
  if (accounts && accountsCommentsReplies) {
    const accountIds = Object.keys(accountsCommentsReplies)
    const accountsBlockedAddressesArray = accountIds.map((accountId) => accounts[accountId]?.blockedAddresses)
    accountsBlockedAddresses = getAccountsBlockedAddressesCached(...accountIds, ...accountsBlockedAddressesArray)
    const accountsBlockedCidsArray = accountIds.map((accountId) => accounts[accountId]?.blockedCids)
    accountsBlockedCids = getAccountsBlockedCidsCached(...accountIds, ...accountsBlockedCidsArray)
  }

  return useMemo(() => {
    const accountsNotifications: AccountsNotifications = {}
    if (!accountsCommentsReplies) {
      return accountsNotifications
    }
    for (const accountId in accountsCommentsReplies) {
      // get reply notifications only
      // TODO: at some point we should also add upvote notifications like 'your post has gotten 10 upvotes'
      accountsNotifications[accountId] = getReplyNotificationsFromAccountCommentsReplies(
        accountsCommentsReplies[accountId],
        accountsBlockedAddresses[accountId],
        accountsBlockedCids[accountId]
      )
    }
    return accountsNotifications
  }, [accountsCommentsReplies, accountsBlockedAddresses, accountsBlockedCids])
}

const getReplyNotificationsFromAccountCommentsReplies = (
  accountCommentsReplies: AccountCommentsReplies,
  accountBlockedAddresses?: {[address: string]: boolean},
  accountBlockedCids?: {[cid: string]: boolean}
) => {
  // get reply notifications
  const replyNotifications: AccountCommentReply[] = []
  for (const replyCid in accountCommentsReplies) {
    const reply = accountCommentsReplies[replyCid]
    if (accountBlockedAddresses?.[reply.subplebbitAddress] || accountBlockedAddresses?.[reply.author?.address]) {
      continue
    }
    if (accountBlockedCids?.[reply.cid] || accountBlockedCids?.[reply.parentCid] || accountBlockedCids?.[reply.postCid]) {
      continue
    }
    replyNotifications.push(reply)
  }
  return replyNotifications.sort((a, b) => b.timestamp - a.timestamp)
}

// add calculated properties to accounts, like karma and unreadNotificationCount
const useAccountCalculatedProperties = (account?: Account, accountComments?: AccountComments, accountCommentsReplies?: AccountCommentsReplies) => {
  const notifications = useCalculatedNotifications(account, accountCommentsReplies)
  return useMemo(() => {
    return getAccountCalculatedProperties(accountComments, notifications)
  }, [accountComments, accountCommentsReplies])
}

export const useAccountWithCalculatedProperties = (account?: Accounts, accountComments?: AccountComments, accountCommentsReplies?: AccountCommentsReplies) => {
  const accountCalculatedProperties = useAccountCalculatedProperties(account, accountComments, accountCommentsReplies)
  const shortAddress = useShortAddress(account?.author?.address)
  return useMemo(() => {
    if (!account) {
      return
    }

    if (shortAddress) {
      account = {...account, author: {...account.author, shortAddress}}
    }

    return {...account, ...accountCalculatedProperties}
  }, [account, accountCalculatedProperties, shortAddress])
}

// add calculated properties to accounts, like karma and unreadNotificationCount
export const useAccountsWithCalculatedProperties = (accounts?: Accounts, accountsComments?: AccountsComments, accountsCommentsReplies?: AccountsCommentsReplies) => {
  const accountsNotifications = useCalculatedAccountsNotifications(accounts, accountsCommentsReplies)
  const accountsShortAuthorAddresses = useAccountsAuthorShortAddresses(accounts)

  return useMemo(() => {
    if (!accounts) {
      return
    }
    if (!accountsComments) {
      return accounts
    }
    const accountsWithCalculatedProperties: Accounts = {}
    for (const accountId in accounts) {
      // must cache getAccountCalculatedProperties() or it recalculates every account, instead of only the one changed
      const accountCalculatedProperties = getAccountCalculatedProperties(accountsComments[accountId], accountsNotifications[accountId])
      const account = {...accounts[accountId], ...accountCalculatedProperties}
      if (accountsShortAuthorAddresses[accountId] && account.author) {
        account.author.shortAddress = accountsShortAuthorAddresses[accountId]
      }
      accountsWithCalculatedProperties[accountId] = account
    }
    return accountsWithCalculatedProperties
  }, [accounts, accountsComments, accountsCommentsReplies, accountsShortAuthorAddresses])
}

const getAccountCalculatedPropertiesNoCache = (accountComments?: AccountComments, notifications?: Notification[]) => {
  const accountCalculatedProperties: any = {}

  // add karma
  const karma = {
    replyUpvoteCount: 0,
    replyDownvoteCount: 0,
    replyScore: 0,
    postUpvoteCount: 0,
    postDownvoteCount: 0,
    postScore: 0,
    upvoteCount: 0,
    downvoteCount: 0,
    score: 0,
  }
  for (const comment of accountComments || []) {
    if (comment.parentCid && comment.upvoteCount) {
      karma.replyUpvoteCount += comment.upvoteCount
    }
    if (comment.parentCid && comment.downvoteCount) {
      karma.replyDownvoteCount += comment.downvoteCount
    }
    if (!comment.parentCid && comment.upvoteCount) {
      karma.postUpvoteCount += comment.upvoteCount
    }
    if (!comment.parentCid && comment.downvoteCount) {
      karma.postDownvoteCount += comment.downvoteCount
    }
  }
  karma.replyScore = karma.replyUpvoteCount - karma.replyDownvoteCount
  karma.postScore = karma.postUpvoteCount - karma.postDownvoteCount
  karma.upvoteCount = karma.replyUpvoteCount + karma.postUpvoteCount
  karma.downvoteCount = karma.replyDownvoteCount + karma.postDownvoteCount
  karma.score = karma.upvoteCount - karma.downvoteCount
  accountCalculatedProperties.karma = karma

  // add unreadNotificationCount
  let unreadNotificationCount = 0
  for (const notification of notifications || []) {
    if (!notification.markedAsRead) {
      unreadNotificationCount++
    }
  }
  accountCalculatedProperties.unreadNotificationCount = unreadNotificationCount

  return accountCalculatedProperties
}
const getAccountCalculatedProperties = memoize(getAccountCalculatedPropertiesNoCache, {max: 100})

const useAccountsAuthorShortAddresses = (accounts?: Accounts) => {
  const [shortAddresses, setShortAddresses] = useState<{[accountId: string]: string}>({})
  useEffect(() => {
    ;(async () => {
      const newShortAddresses: {[accountId: string]: string} = {}
      let shouldUpdate = false
      for (const accountId in accounts || {}) {
        const address: string | undefined = accounts?.[accountId]?.author?.address
        newShortAddresses[accountId] = await utils.getShortAddress(address)
        if (shortAddresses[accountId] !== newShortAddresses[accountId]) {
          shouldUpdate = true
        }
      }
      if (shouldUpdate) {
        setShortAddresses(newShortAddresses)
      }
    })()
  }, [accounts])
  return shortAddresses
}
