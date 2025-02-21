// internal accounts actions that are not called by the user

import accountsStore, {listeners} from './accounts-store'
import accountsDatabase from './accounts-database'
import Logger from '@plebbit/plebbit-logger'
import assert from 'assert'
const log = Logger('plebbit-react-hooks:accounts:stores')
import {Account, PublishCommentOptions, AccountCommentReply, Comment, AccountsComments, AccountCommentsReplies, Subplebbit} from '../../types'
import utils from '../../lib/utils'

// TODO: we currently subscribe to updates for every single comment
// in the user's account history. This probably does not scale, we
// need to eventually schedule and queue older comments to look
// for updates at a lower priority.
export const startUpdatingAccountCommentOnCommentUpdateEvents = async (comment: Comment, account: Account, accountCommentIndex: number) => {
  assert(typeof accountCommentIndex === 'number', `startUpdatingAccountCommentOnCommentUpdateEvents accountCommentIndex '${accountCommentIndex}' not a number`)
  assert(typeof account?.id === 'string', `startUpdatingAccountCommentOnCommentUpdateEvents account '${account}' account.id '${account?.id}' not a string`)
  const commentArgument = comment

  // comment doesn't have a cid yet, so can't receive updates
  if (!comment.cid) {
    return
  }

  // account comment already updating
  if (accountsStore.getState().accountsCommentsUpdating[comment.cid]) {
    return
  }
  accountsStore.setState(({accountsCommentsUpdating}) => ({accountsCommentsUpdating: {...accountsCommentsUpdating, [comment.cid]: true}}))

  // comment is not a `Comment` instance
  if (!comment.on) {
    comment = await account.plebbit.createComment(comment)
  }

  comment.on('update', async (updatedComment: Comment) => {
    // merge should not be needed if plebbit-js is implemented properly, but no harm in fixing potential errors
    updatedComment = utils.merge(commentArgument, comment, updatedComment)
    await accountsDatabase.addAccountComment(account.id, updatedComment, accountCommentIndex)
    log('startUpdatingAccountCommentOnCommentUpdateEvents comment update', {commentCid: comment.cid, accountCommentIndex, updatedComment, account})
    accountsStore.setState(({accountsComments}) => {
      // account no longer exists
      if (!accountsComments[account.id]) {
        log.error(
          `startUpdatingAccountCommentOnCommentUpdateEvents comment.on('update') invalid accountsStore.accountsComments['${account.id}'] '${
            accountsComments[account.id]
          }', account may have been deleted`
        )
        return {}
      }

      const updatedAccountComments = [...accountsComments[account.id]]
      const previousComment = updatedAccountComments[accountCommentIndex]
      const updatedAccountComment = utils.clone({
        ...updatedComment,
        index: accountCommentIndex,
        accountId: account.id,
      })
      updatedAccountComments[accountCommentIndex] = updatedAccountComment
      return {accountsComments: {...accountsComments, [account.id]: updatedAccountComments}}
    })

    // update AccountCommentsReplies with new replies if has any new replies
    const replyPageArray: any[] = Object.values(updatedComment.replies?.pages || {})

    // validate replies pages
    let replyPagesValid = true
    const subplebbit = await account.plebbit.createSubplebbit({address: comment.subplebbitAddress})
    try {
      for (const replyPage of replyPageArray) {
        replyPage && (await subplebbit.posts.validatePage(replyPage))
      }
    } catch (e) {
      replyPagesValid = false
    }

    const hasReplies = replyPageArray.length && replyPageArray.map((replyPage) => replyPage?.comments?.length || 0).reduce((prev, curr) => prev + curr) > 0
    if (hasReplies && replyPagesValid) {
      accountsStore.setState(({accountsCommentsReplies}) => {
        // account no longer exists
        if (!accountsCommentsReplies[account.id]) {
          log.error(
            `startUpdatingAccountCommentOnCommentUpdateEvents comment.on('update') invalid accountsStore.accountsCommentsReplies['${account.id}'] '${
              accountsCommentsReplies[account.id]
            }', account may have been deleted`
          )
          return {}
        }

        // check which replies are read or not
        const updatedAccountCommentsReplies: {[replyCid: string]: AccountCommentReply} = {}
        for (const replyPage of replyPageArray) {
          for (const reply of replyPage?.comments || []) {
            const markedAsRead = accountsCommentsReplies[account.id]?.[reply.cid]?.markedAsRead === true ? true : false
            updatedAccountCommentsReplies[reply.cid] = {...reply, markedAsRead}
          }
        }

        // add all to database
        const promises = []
        for (const replyCid in updatedAccountCommentsReplies) {
          promises.push(accountsDatabase.addAccountCommentReply(account.id, updatedAccountCommentsReplies[replyCid]))
        }
        Promise.all(promises)

        // set new store
        const newAccountCommentsReplies = {
          ...accountsCommentsReplies[account.id],
          ...updatedAccountCommentsReplies,
        }
        return {accountsCommentsReplies: {...accountsCommentsReplies, [account.id]: newAccountCommentsReplies}}
      })
    }
  })
  listeners.push(comment)
  comment.update().catch((error: unknown) => log.trace('comment.update error', {comment, error}))
}

// internal accounts action: the comment CID is not known at the time of publishing, so every time
// we fetch a new comment, check if its our own, and attempt to add the CID
export const addCidToAccountComment = async (comment: Comment) => {
  const {accounts} = accountsStore.getState()
  assert(accounts, `can't use accountsStore.accountActions before initialized`)
  const accountCommentsWithoutCids = getAccountsCommentsWithoutCids()[comment?.author?.address]
  if (!accountCommentsWithoutCids) {
    return
  }
  for (const accountComment of accountCommentsWithoutCids) {
    // if author address and timestamp is the same, we assume it's the right comment
    if (accountComment.timestamp && accountComment.timestamp === comment.timestamp) {
      const commentWithCid = utils.merge(accountComment, comment)
      await accountsDatabase.addAccountComment(accountComment.accountId, commentWithCid, accountComment.index)
      log('accountsActions.addCidToAccountComment', {commentCid: comment.cid, accountCommentIndex: accountComment.index, accountComment: commentWithCid})
      accountsStore.setState(({accountsComments}) => {
        const updatedAccountComments = [...accountsComments[accountComment.accountId]]
        updatedAccountComments[accountComment.index] = commentWithCid
        return {accountsComments: {...accountsComments, [accountComment.accountId]: updatedAccountComments}}
      })

      startUpdatingAccountCommentOnCommentUpdateEvents(comment, accounts[accountComment.accountId], accountComment.index).catch((error: unknown) =>
        log.error('accountsActions.addCidToAccountComment startUpdatingAccountCommentOnCommentUpdateEvents error', {
          comment,
          account: accounts[accountComment.accountId],
          accountCommentIndex: accountComment.index,
          error,
        })
      )
      break
    }
  }
}

// cache the last result of this function
let previousAccountsCommentsJson: string
let previousAccountsCommentsWithoutCids: any = {}
const getAccountsCommentsWithoutCids = () => {
  const {accounts, accountsComments} = accountsStore.getState()

  // same accounts comments as last time, return cached value
  const accountsCommentsJson = JSON.stringify(accountsComments)
  if (accountsCommentsJson === previousAccountsCommentsJson) {
    return previousAccountsCommentsWithoutCids
  }
  previousAccountsCommentsJson = accountsCommentsJson

  const accountsCommentsWithoutCids: AccountsComments = {}
  if (!accounts || !accountsComments) {
    return accountsCommentsWithoutCids
  }
  for (const accountId in accountsComments) {
    const accountComments = accountsComments[accountId]
    const account = accounts[accountId]
    for (const accountCommentIndex in accountComments) {
      const accountComment = accountComments[accountCommentIndex]
      if (!accountComment.cid) {
        const authorAddress = account?.author?.address
        if (!authorAddress) {
          continue
        }
        if (!accountsCommentsWithoutCids[authorAddress]) {
          accountsCommentsWithoutCids[authorAddress] = []
        }
        accountsCommentsWithoutCids[authorAddress].push(accountComment)
      }
    }
  }
  previousAccountsCommentsWithoutCids = accountsCommentsWithoutCids
  return accountsCommentsWithoutCids
}

// internal accounts action: mark an account's notifications as read
export const markNotificationsAsRead = async (account: Account) => {
  const {accountsCommentsReplies} = accountsStore.getState()
  assert(typeof account?.id === 'string', `accountsStore.markNotificationsAsRead invalid account argument '${account}'`)

  // find all unread replies
  const repliesToMarkAsRead: AccountCommentsReplies = {}
  for (const replyCid in accountsCommentsReplies[account.id]) {
    if (!accountsCommentsReplies[account.id][replyCid].markedAsRead) {
      repliesToMarkAsRead[replyCid] = {...accountsCommentsReplies[account.id][replyCid], markedAsRead: true}
    }
  }

  // add all to database
  const promises = []
  for (const replyCid in repliesToMarkAsRead) {
    promises.push(accountsDatabase.addAccountCommentReply(account.id, repliesToMarkAsRead[replyCid]))
  }
  await Promise.all(promises)

  // add all to react store
  log('accountsActions.markNotificationsAsRead', {account, repliesToMarkAsRead})
  accountsStore.setState(({accountsCommentsReplies}) => {
    const updatedAccountCommentsReplies = {...accountsCommentsReplies[account.id], ...repliesToMarkAsRead}
    return {accountsCommentsReplies: {...accountsCommentsReplies, [account.id]: updatedAccountCommentsReplies}}
  })
}

// internal accounts action: if a subplebbit has a role with an account's address
// add it to the account.subplebbits database
export const addSubplebbitRoleToAccountsSubplebbits = async (subplebbit: Subplebbit) => {
  if (!subplebbit) {
    return
  }
  const {accounts} = accountsStore.getState()
  assert(accounts, `can't use accountsStore.accountActions before initialized`)

  // find subplebbit roles to add and remove
  const getChange = (accounts: any, subplebbit: any) => {
    const toAdd: string[] = []
    const toRemove: string[] = []
    for (const accountId in accounts) {
      const account = accounts[accountId]
      if (!subplebbit.roles?.[account.author.address]) {
        if (account.subplebbits[subplebbit.address]) {
          toRemove.push(accountId)
        }
      } else {
        if (!account.subplebbits[subplebbit.address]) {
          toAdd.push(accountId)
        }
      }
    }
    return {toAdd, toRemove, hasChange: toAdd.length !== 0 || toRemove.length !== 0}
  }

  const {hasChange} = getChange(accounts, subplebbit)
  if (!hasChange) {
    return
  }

  accountsStore.setState(({accounts}) => {
    const {toAdd, toRemove, hasChange} = getChange(accounts, subplebbit)
    const nextAccounts = {...accounts}

    // edit databases and build next accounts
    for (const accountId of toAdd) {
      const account = {...nextAccounts[accountId]}
      account.subplebbits = {
        ...account.subplebbits,
        [subplebbit.address]: {role: subplebbit.roles[account.author.address]},
      }
      nextAccounts[accountId] = account
      accountsDatabase.addAccount(account)
    }
    for (const accountId of toRemove) {
      const account = {...nextAccounts[accountId]}
      account.subplebbits = {...account.subplebbits}
      delete account.subplebbits[subplebbit.address]
      nextAccounts[accountId] = account
      accountsDatabase.addAccount(account)
    }

    log('accountsActions.addSubplebbitRoleToAccountsSubplebbits', {subplebbit, toAdd, toRemove})
    return {accounts: nextAccounts}
  })
}
