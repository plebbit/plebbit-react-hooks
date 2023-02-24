import assert from 'assert'
import type {
  Account,
  UseAccountCommentsFilter,
  AccountsCommentsReplies,
  AccountCommentsReplies,
  AccountsComments,
  AccountComments,
  Accounts,
  AccountsNotifications,
  AccountNotifications,
  AccountCommentReply,
} from '../../types'
import {useMemo} from 'react'

/**
 * Filter publications, for example only get comments that are posts, votes in a certain subplebbit, etc.
 * Check UseAccountCommentsFilter type in types.tsx for more information, e.g. filter = {subplebbitAddresses: ['memes.eth']}.
 */
export const filterPublications = (publications: any, filter: UseAccountCommentsFilter) => {
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

export const useCalculatedAccountNotifications = (account?: Account, accountCommentsReplies?: AccountCommentsReplies) => {
  return useMemo(() => {
    if (!account || !accountCommentsReplies) {
      return []
    }
    // get reply notifications only
    // TODO: at some point we should also add upvote notifications like 'your post has gotten 10 upvotes'
    return getReplyNotificationsFromAccountCommentsReplies(accountCommentsReplies)
  }, [accountCommentsReplies, account?.blockedAddresses])
}

export const useCalculatedAccountsNotifications = (accounts?: Accounts, accountsCommentsReplies?: AccountsCommentsReplies) => {
  const accountsBlockedAddresses = Object.fromEntries(
    // do not do `account.blockedAddresses || {}` otherwise can't use as useMemoDependencies
    Object.keys(accountsCommentsReplies || {}).map((accountId) => [accountId, accounts?.[accountId]?.blockedAddresses])
  )

  // use a "shallow" check on the argument dependencies because the argument objects might change
  const useMemoDependencies = [...Object.values(accountsCommentsReplies || {}), ...Object.values(accountsBlockedAddresses)]
  // useMemo deps must always have the same length
  // TODO: will break if there's more than 500 / 2 accounts, must find other solution
  useMemoDependencies.length = 500

  return useMemo(() => {
    const accountsNotifications: AccountsNotifications = {}
    if (!accountsCommentsReplies) {
      return accountsNotifications
    }
    for (const accountId in accountsCommentsReplies) {
      // get reply notifications only
      // TODO: at some point we should also add upvote notifications like 'your post has gotten 10 upvotes'
      accountsNotifications[accountId] = getReplyNotificationsFromAccountCommentsReplies(accountsCommentsReplies[accountId])
    }
    return accountsNotifications
  }, useMemoDependencies)
}

const getReplyNotificationsFromAccountCommentsReplies = (accountCommentsReplies: AccountCommentsReplies) => {
  // get reply notifications
  const replyNotifications: AccountCommentReply[] = []
  for (const replyCid in accountCommentsReplies) {
    const reply = accountCommentsReplies[replyCid]
    // TODO: filter blocked addresses
    // if (accountsBlockedAddresses[accountId]?.[reply.subplebbitAddress] || accountsBlockedAddresses[accountId]?.[reply.author.address]) {
    //   continue
    // }
    replyNotifications.push(reply)
  }
  return replyNotifications.sort((a, b) => b.timestamp - a.timestamp)
}

// add calculated properties to accounts, like karma and unreadNotificationCount
const useAccountCalculatedProperties = (account?: Accounts, accountComments?: AccountComments, accountCommentsReplies?: AccountCommentsReplies) => {
  const accountNotifications = useCalculatedAccountNotifications(account, accountCommentsReplies)
  return useMemo(() => {
    return getAccountCalculatedProperties(accountComments, accountNotifications)
  }, [accountComments, accountCommentsReplies])
}

export const useAccountWithCalculatedProperties = (account?: Accounts, accountComments?: AccountComments, accountCommentsReplies?: AccountCommentsReplies) => {
  const accountCalculatedProperties = useAccountCalculatedProperties(account, accountComments, accountCommentsReplies)
  return useMemo(() => {
    if (!account) {
      return
    }
    return {...account, ...accountCalculatedProperties}
  }, [account, accountCalculatedProperties])
}

// add calculated properties to accounts, like karma and unreadNotificationCount
export const useAccountsWithCalculatedProperties = (accounts?: Accounts, accountsComments?: AccountsComments, accountsCommentsReplies?: AccountsCommentsReplies) => {
  const accountsNotifications = useCalculatedAccountsNotifications(accounts, accountsCommentsReplies)

  // use a "shallow" check on the argument dependencies because the argument objects might change
  // use accountsCommentsReplies instead of accountsNotifications because useAccountsNotifications uses it
  const useMemoDependencies = [...Object.values(accounts || {}), ...Object.values(accountsComments || {}), ...Object.values(accountsCommentsReplies || {})]
  // useMemo deps must always have the same length
  // TODO: will break if there's more than 1000 / 3 accounts, must find other solution
  useMemoDependencies.length = 1000

  return useMemo(() => {
    if (!accounts) {
      return
    }
    if (!accountsComments) {
      return accounts
    }
    const accountsWithCalculatedProperties: Accounts = {}
    for (const accountId in accounts) {
      const calculatedProperties = getAccountCalculatedProperties(accountsComments[accountId], accountsNotifications[accountId])
      accountsWithCalculatedProperties[accountId] = {...accounts[accountId], ...calculatedProperties}
    }
    return accountsWithCalculatedProperties
  }, useMemoDependencies)
}

const getAccountCalculatedProperties = (accountComments?: AccountComments, accountNotifications?: AccountNotifications) => {
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
  for (const notification of accountNotifications || []) {
    if (!notification.markedAsRead) {
      unreadNotificationCount++
    }
  }
  accountCalculatedProperties.unreadNotificationCount = unreadNotificationCount

  return accountCalculatedProperties
}
