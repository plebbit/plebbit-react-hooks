import assert from 'assert'
import type {UseAccountCommentsFilter, AccountsCommentsReplies, AccountsComments, Accounts, AccountsNotifications, AccountCommentReply} from '../../types'
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

export const useAccountsNotifications = (accounts?: Accounts, accountsCommentsReplies?: AccountsCommentsReplies) => {
  return useMemo(() => {
    const accountsNotifications: AccountsNotifications = {}
    if (!accountsCommentsReplies) {
      return accountsNotifications
    }
    for (const accountId in accountsCommentsReplies) {
      // get reply notifications
      const accountCommentsReplies: AccountCommentReply[] = []
      for (const replyCid in accountsCommentsReplies[accountId]) {
        const reply = accountsCommentsReplies[accountId][replyCid]

        // TODO: filter blocked addresses
        // if (accounts[accountId].blockedAddress[reply.subplebbitAddress] || accounts[accountId].blockedAddress[reply.author.address]) {
        //   continue
        // }
        accountCommentsReplies.push(reply)
      }

      // TODO: at some point we should also add upvote notifications like 'your post has gotten 10 upvotes'

      accountsNotifications[accountId] = accountCommentsReplies.sort((a, b) => b.timestamp - a.timestamp)
    }
    return accountsNotifications
  }, [accounts, accountsCommentsReplies])
}

// add calculated properties to accounts, like karma and unreadNotificationCount
export const useAccountsWithCalculatedProperties = (accounts?: Accounts, accountsComments?: AccountsComments, accountsCommentsReplies?: AccountsCommentsReplies) => {
  const accountsNotifications = useAccountsNotifications(accounts, accountsCommentsReplies)

  return useMemo(() => {
    if (!accounts) {
      return
    }
    if (!accountsComments) {
      return accounts
    }
    const accountsWithCalculatedProperties = {...accounts}

    // add karma
    for (const accountId in accountsComments) {
      const account = accounts[accountId]
      const accountComments = accountsComments[accountId]
      if (!accountComments || !account) {
        continue
      }
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
      for (const comment of accountComments) {
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
      const accountWithCalculatedProperties = {...account, karma}
      accountsWithCalculatedProperties[accountId] = accountWithCalculatedProperties
    }

    // add unreadNotificationCount
    for (const accountId in accountsWithCalculatedProperties) {
      let unreadNotificationCount = 0
      for (const notification of accountsNotifications?.[accountId] || []) {
        if (!notification.markedAsRead) {
          unreadNotificationCount++
        }
      }
      accountsWithCalculatedProperties[accountId].unreadNotificationCount = unreadNotificationCount
    }

    return accountsWithCalculatedProperties
  }, [accounts, accountsComments, accountsNotifications])
}
