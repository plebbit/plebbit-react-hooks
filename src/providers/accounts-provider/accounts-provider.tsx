import React, { useState, useEffect, useMemo } from 'react'
import validator from '../../lib/validator'
import assert from 'assert'
import Debug from 'debug'
const debug = Debug('plebbitreacthooks:providers:accountsprovider')
import accountsDatabase from './accounts-database'
import accountGenerator from './account-generator'
import utils from '../../lib/utils'
import {
  Props, 
  AccountNamesToAccountIds, 
  Account, 
  Accounts, 
  AccountsActions,
  PublishCommentOptions,
  PublishCommentEditOptions,
  PublishVoteOptions,
  Challenge,
  ChallengeVerification,
  CreateCommentOptions,
  CreateVoteOptions,
  Comment,
  AccountComment,
} from '../../types'

type AccountsContext = any

export const AccountsContext = React.createContext<AccountsContext | undefined>(undefined)

export default function AccountsProvider(props: Props): JSX.Element | null {
  const [accounts, setAccounts] = useState<any>(undefined)
  const [accountIds, setAccountIds] = useState<any>(undefined)
  const [activeAccountId, setActiveAccountId] = useState<any>(undefined)
  const [accountNamesToAccountIds, setAccountNamesToAccountIds] = useState<any>(undefined)
  const [accountsComments, setAccountsComments] = useState<any>([])
  const [accountsVotes, setAccountsVotes] = useState<any>({})
  const accountsCommentsWithoutCids = useAccountsCommentsWithoutCids(accounts, accountsComments)
  const accountsWithCalculatedProperties = useAccountsWithCalculatedProperties(accounts, accountsComments)

  const accountsActions: AccountsActions = {}

  accountsActions.setActiveAccount = async (accountName: string) => {
    validator.validateAccountsActionsSetActiveAccountArguments(accountName)
    const accountId = accountNamesToAccountIds[accountName]
    await accountsDatabase.accountsMetadataDatabase.setItem('activeAccountId', accountId)
    debug('accountsActions.setActiveAccount', { accountName, accountId })
    setActiveAccountId(accountId)
  }

  accountsActions.setAccount = async (account: Account) => {
    validator.validateAccountsActionsSetAccountArguments(account)
    assert(accounts[account.id], `cannot set account with account.id '${account.id}' id does not exist in database`)
    // use this function to serialize and update all databases
    await accountsDatabase.addAccount(account)
    const [newAccount, accountNamesToAccountIds] = await Promise.all([
      // use this function to deserialize
      accountsDatabase.getAccount(account.id),
      accountsDatabase.accountsMetadataDatabase.getItem('accountNamesToAccountIds'),
    ])
    const newAccounts = { ...accounts, [newAccount.id]: newAccount }
    debug('accountsActions.setAccount', { account: newAccount })
    setAccounts(newAccounts)
    setAccountNamesToAccountIds(accountNamesToAccountIds)
  }

  accountsActions.setAccountsOrder = async (newOrderedAccountNames: string[]) => {
    const accountIds = []
    const accountNames = []
    for (const accountName of newOrderedAccountNames) {
      const accountId = accountNamesToAccountIds[accountName]
      accountIds.push(accountId)
      accountNames.push(accounts[accountId].name)
    }
    validator.validateAccountsActionsSetAccountsOrderArguments(newOrderedAccountNames, accountNames)
    debug('accountsActions.setAccountsOrder', {
      previousAccountNames: accountNames,
      newAccountNames: newOrderedAccountNames,
    })
    await accountsDatabase.accountsMetadataDatabase.setItem('accountIds', accountIds)
    setAccountIds(accountIds)
  }

  accountsActions.createAccount = async (accountName?: string) => {
    const newAccount = await accountGenerator.generateDefaultAccount()
    if (accountName) {
      newAccount.name = accountName
    }
    await accountsDatabase.addAccount(newAccount)
    const newAccounts = { ...accounts, [newAccount.id]: newAccount }
    const [newAccountIds, newActiveAccountId, accountNamesToAccountIds] = await Promise.all([
      accountsDatabase.accountsMetadataDatabase.getItem('accountIds'),
      accountsDatabase.accountsMetadataDatabase.getItem('activeAccountId'),
      accountsDatabase.accountsMetadataDatabase.getItem('accountNamesToAccountIds'),
    ])
    debug('accountsActions.createAccount', { accountName, account: newAccount })
    setAccounts(newAccounts)
    setAccountIds(newAccountIds)
    setAccountNamesToAccountIds(accountNamesToAccountIds)
    setAccountsComments({ ...accountsComments, [newAccount.id]: [] })
    setAccountsVotes({ ...accountsVotes, [newAccount.id]: {} })
  }

  accountsActions.deleteAccount = async (accountName?: string) => {
    throw Error('TODO: not implemented')
    // TODO: delete account from provider and from persistant storage
    // change active account to another active account
    // handle the edge case of a user deleting all his account and having none
    // warn user to back up his private key or lose his account permanently
  }

  accountsActions.importAccount = async (serializedAccount: string | Buffer) => {
    throw Error('TODO: not implemented')
    // TODO: deserialize account, import account, if account.name already exists, add ' 2', don't overwrite
    // the 'account' will contain AccountComments and AccountVotes
    // TODO: add options to only import private key, account settings, or include all account comments/votes history
  }

  accountsActions.exportAccount = async (accountName: string) => {
    throw Error('TODO: not implemented')
    // don't allow no account name to avoid catastrophic bugs
    validator.validateAccountsActionsExportAccountArguments(accountName)
    // TODO: return account as serialized JSON string for copy paste or save as file
    // the 'account' will contain AccountComments and AccountVotes
    // TODO: add options to only export private key, account settings, or include all account comments/votes history
  }

  accountsActions.publishComment = async (publishCommentOptions: PublishCommentOptions, accountName?: string) => {
    let account = accounts[activeAccountId]
    if (accountName) {
      const accountId = accountNamesToAccountIds[accountName]
      account = accounts[accountId]
    }
    validator.validateAccountsActionsPublishCommentArguments({ publishCommentOptions, accountName, account })

    let createCommentOptions = {
      subplebbitAddress: publishCommentOptions.subplebbitAddress,
      parentCommentCid: publishCommentOptions.parentCommentCid,
      postCid: publishCommentOptions.postCid, // not used by plebbit-js, but used to store in local database
      content: publishCommentOptions.content,
      title: publishCommentOptions.title,
      timestamp: Math.round(Date.now() / 1000),
      author: account.author,
      signer: account.signer,
    }

    let accountCommentIndex: number
    let comment = account.plebbit.createComment(createCommentOptions)
    const publishAndRetryFailedChallengeVerification = () => {
      comment.once('challenge', async (challenge: Challenge) => {
        publishCommentOptions.onChallenge(challenge, comment)
      })
      comment.once('challengeverification', async (challengeVerification: ChallengeVerification) => {
        publishCommentOptions.onChallengeVerification(challengeVerification, comment)
        if (!challengeVerification.challengeAnswerIsVerified) {
          // publish again automatically on fail
          createCommentOptions = {...createCommentOptions, timestamp: Math.round(Date.now() / 1000)}
          comment = account.plebbit.createComment(createCommentOptions)
          publishAndRetryFailedChallengeVerification()
        } else {
          // the challengeverification message of a comment publication should in theory send back the CID
          // of the published comment which is needed to resolve it for replies, upvotes, etc
          if (challengeVerification?.publication?.cid) {
            const commentWithCid = { ...createCommentOptions, cid: challengeVerification.publication.cid }
            await accountsDatabase.addAccountComment(account.id, commentWithCid, accountCommentIndex)
            // @ts-ignore
            setAccountsComments((previousAccounsComments) => {
              const updatedAccountComments = [...previousAccounsComments[account.id]]
              const updatedAccountComment = {...commentWithCid, index: accountCommentIndex, accountId: account.id}
              updatedAccountComments[accountCommentIndex] = updatedAccountComment
              return { ...previousAccounsComments, [account.id]: updatedAccountComments }
            })

            startUpdatingAccountCommentOnCommentUpdateEvents(comment, account, accountCommentIndex)
          }
        }
      })
      comment.publish()
    }

    publishAndRetryFailedChallengeVerification()
    await accountsDatabase.addAccountComment(account.id, createCommentOptions)
    debug('accountsActions.publishComment', { createCommentOptions })
    // @ts-ignore
    setAccountsComments((previousAccounsComments) => {
      // save account comment index to update the comment later
      accountCommentIndex = previousAccounsComments[account.id].length
      const createdAccountComment = {...createCommentOptions, index: accountCommentIndex, accountId: account.id}
      return {
        ...previousAccounsComments,
        [account.id]: [...previousAccounsComments[account.id], createdAccountComment],
      }
    })
  }

  accountsActions.publishCommentEdit = async (publishCommentEditOptions: PublishCommentEditOptions, accountName?: string) => {
    throw Error('TODO: not implemented')
  }

  accountsActions.deleteComment = async (commentCidOrAccountCommentIndex: string | number, accountName?: string) => {
    throw Error('TODO: not implemented')
  }

  accountsActions.publishVote = async (publishVoteOptions: PublishVoteOptions, accountName?: string) => {
    let account = accounts[activeAccountId]
    if (accountName) {
      const accountId = accountNamesToAccountIds[accountName]
      account = accounts[accountId]
    }
    validator.validateAccountsActionsPublishVoteArguments({ publishVoteOptions, accountName, account })

    const createVoteOptions = {
      subplebbitAddress: publishVoteOptions.subplebbitAddress,
      vote: publishVoteOptions.vote,
      commentCid: publishVoteOptions.commentCid,
      timestamp: publishVoteOptions.timestamp || Math.round(Date.now() / 1000),
      author: account.author,
      signer: account.signer,
    }

    let vote = account.plebbit.createVote(createVoteOptions)
    const publishAndRetryFailedChallengeVerification = () => {
      vote.once('challenge', async (challenge: Challenge) => {
        publishVoteOptions.onChallenge(challenge, vote)
      })
      vote.once('challengeverification', async (challengeVerification: ChallengeVerification) => {
        publishVoteOptions.onChallengeVerification(challengeVerification, vote)
        if (!challengeVerification.challengeAnswerIsVerified) {
          // publish again automatically on fail
          vote = account.plebbit.createVote(createVoteOptions)
          publishAndRetryFailedChallengeVerification()
        }
      })
      vote.publish()
    }

    publishAndRetryFailedChallengeVerification()
    await accountsDatabase.addAccountVote(account.id, createVoteOptions)
    debug('accountsActions.publishVote', { createVoteOptions })
    setAccountsVotes({
      ...accountsVotes,
      [account.id]: { ...accountsVotes[account.id], [createVoteOptions.commentCid]: createVoteOptions },
    })
    return vote
  }

  accountsActions.blockAddress = async (address: string | number, accountName?: string) => {
    throw Error('TODO: not implemented')
  }

  accountsActions.limitAddress = async (address: string | number, limitPercent: number, accountName?: string) => {
    // limit how many times per feed page an address can appear, limitPercent 1 = 100%, 0.1 = 10%, 0.001 = 0.1%
    throw Error('TODO: not implemented')
  }

  // internal accounts action: the comment CID is not known at the time of publishing, so every time
  // we fetch a new comment, check if its our own, and attempt to add the CID
  const addCidToAccountComment = async (comment: Comment) => {
    const accountCommentsWithoutCids = accountsCommentsWithoutCids[comment?.author?.address]
    if (!accountCommentsWithoutCids) {
      return
    }
    for (const accountComment of accountCommentsWithoutCids) {
      // if author address and timestamp is the same, we assume it's the right comment
      if (accountComment.timestamp && accountComment.timestamp === comment.timestamp) {
        const commentWithCid = utils.merge(accountComment, comment)
        await accountsDatabase.addAccountComment(accountComment.accountId, commentWithCid, accountComment.index)
        // @ts-ignore
        setAccountsComments((previousAccounsComments) => {
          const updatedAccountComments = [...previousAccounsComments[accountComment.accountId]]
          updatedAccountComments[accountComment.index] = commentWithCid
          return { ...previousAccounsComments, [accountComment.accountId]: updatedAccountComments }
        })

        startUpdatingAccountCommentOnCommentUpdateEvents(comment, accounts[accountComment.accountId], accountComment.index)
        break
      }
    }
  }

  // TODO: we currently subscribe to updates for every single comment
  // in the user's account history. This probably does not scale, we
  // need to eventually schedule and queue older comments to look 
  // for updates at a lower priority.
  const [alreadyUpdatingAccountsComments, setAlreadyUpdatingAccountsComments]: any[] = useState({})
  const startUpdatingAccountCommentOnCommentUpdateEvents = async (comment: Comment, account: Account, accountCommentIndex: number) => {
    assert(typeof accountCommentIndex === 'number', `startUpdatingAccountCommentOnCommentUpdateEvents accountCommentIndex '${accountCommentIndex}' not a number`)
    assert(typeof account?.id === 'string', `startUpdatingAccountCommentOnCommentUpdateEvents account '${account}' account.id '${account?.id}' not a string`)
    const commentArgument = comment
    if (!comment.ipnsName) {
      if (!comment.cid) {
        // comment doesn't have an ipns name yet, so can't receive updates
        // and doesn't have a cid, so has no way to know the ipns name
        return
      }
      comment = await account.plebbit.getComment(comment.cid)
    }
    // account comment already updating
    if (alreadyUpdatingAccountsComments[comment.cid]) {
      return
    }
    // comment is not a `Comment` instance
    if (!comment.on) {
      comment = account.plebbit.createComment(comment)
    }
    // @ts-ignore
    setAlreadyUpdatingAccountsComments(prev => ({...prev, [comment.cid]: true}))
    comment.on('update', async (updatedComment: Comment) => {
      // merge should not be needed if plebbit-js is implemented properly, but no harm in fixing potential errors
      updatedComment = utils.merge(commentArgument, comment, updatedComment)
      await accountsDatabase.addAccountComment(account.id, updatedComment, accountCommentIndex)
      // @ts-ignore
      setAccountsComments((previousAccounsComments) => {
        const updatedAccountComments = [...previousAccounsComments[account.id]]
        const previousComment = updatedAccountComments[accountCommentIndex]
        const updatedAccountComment = utils.clone({...updatedComment, index: accountCommentIndex, accountId: account.id})
        updatedAccountComments[accountCommentIndex] = updatedAccountComment
        return { ...previousAccounsComments, [account.id]: updatedAccountComments }
      })
    })
    comment.update()
  }

  // load accounts from database once on load
  useEffect(() => {
    ;(async () => {
      let accountIds: string[] | null,
        activeAccountId: string | null,
        accounts: Accounts,
        accountNamesToAccountIds: AccountNamesToAccountIds | null
      accountIds = await accountsDatabase.accountsMetadataDatabase.getItem('accountIds')
      // get accounts from database if any
      if (accountIds?.length) {
        ;[activeAccountId, accounts, accountNamesToAccountIds] = await Promise.all<any>([
          accountsDatabase.accountsMetadataDatabase.getItem('activeAccountId'),
          accountsDatabase.getAccounts(accountIds),
          accountsDatabase.accountsMetadataDatabase.getItem('accountNamesToAccountIds'),
        ])
      }
      // no accounts in database, create a default account
      else {
        const defaultAccount = await accountGenerator.generateDefaultAccount()
        await accountsDatabase.addAccount(defaultAccount)
        accounts = { [defaultAccount.id]: defaultAccount }
        ;[accountIds, activeAccountId, accountNamesToAccountIds] = await Promise.all<any>([
          accountsDatabase.accountsMetadataDatabase.getItem('accountIds'),
          accountsDatabase.accountsMetadataDatabase.getItem('activeAccountId'),
          accountsDatabase.accountsMetadataDatabase.getItem('accountNamesToAccountIds'),
        ])
      }
      const [accountsComments, accountsVotes] = await Promise.all<any>([
        // @ts-ignore
        accountsDatabase.getAccountsComments(accountIds),
        // @ts-ignore
        accountsDatabase.getAccountsVotes(accountIds),
      ])
      setAccounts(accounts)
      setAccountIds(accountIds)
      setActiveAccountId(activeAccountId)
      setAccountNamesToAccountIds(accountNamesToAccountIds)
      setAccountsComments(accountsComments)
      setAccountsVotes(accountsVotes)

      // start looking for updates for all accounts comments in database
      for (const accountId in accountsComments) {
        for (const accountComment of accountsComments[accountId]) {
          startUpdatingAccountCommentOnCommentUpdateEvents(accountComment, accounts[accountId], accountComment.index)
        }
      }
    })()
  }, [])

  if (!props.children) {
    return null
  }

  // don't give access to any context until first load
  let accountsContext: AccountsContext
  if (accountIds && accounts && accountNamesToAccountIds) {
    accountsContext = {
      accounts: accountsWithCalculatedProperties,
      accountIds,
      activeAccountId,
      accountNamesToAccountIds,
      accountsActions,
      accountsComments,
      accountsVotes,
      // internal accounts actions
      addCidToAccountComment,
    }
  }

  debug({
    accountsContext: accountsContext && {
      accounts: accountsWithCalculatedProperties,
      accountIds,
      activeAccountId,
      accountNamesToAccountIds,
      accountsComments,
      accountsVotes,
      accountsCommentsWithoutCids,
    },
  })
  return <AccountsContext.Provider value={accountsContext}>{props.children}</AccountsContext.Provider>
}

const useAccountsCommentsWithoutCids = (accounts?: Accounts, accountsComments?: any) => {
  const accountsCommentsWithoutCids = useMemo(() => {
    const accountsCommentsWithoutCids: any = {}
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
    return accountsCommentsWithoutCids
  }, [accountsComments])
  return accountsCommentsWithoutCids
}

// add calculated properties to accounts, like karma
const useAccountsWithCalculatedProperties = (accounts?: Accounts, accountsComments?: any) => {
  return useMemo(() => {
    if (!accounts) {
      return
    }
    if (!accountsComments) {
      return accounts
    }
    const accountsWithCalculatedProperties = {...accounts}
    for (const accountId in accountsComments) {
      const account = accounts[accountId]
      const accountComments = accountsComments[accountId]
      if (!accountComments || !account) {
        continue
      }
      const karma = {
        commentUpvoteCount: 0,
        commentDownvoteCount: 0,
        commentScore: 0,
        linkUpvoteCount: 0,
        linkDownvoteCount: 0,
        linkScore: 0,
        upvoteCount: 0,
        downvoteCount: 0,
        score: 0
      }
      for (const comment of accountComments) {
        if (comment.parentCommentCid && comment.upvoteCount) {
          karma.commentUpvoteCount += comment.upvoteCount
        }
        if (comment.parentCommentCid && comment.downvoteCount) {
          karma.commentDownvoteCount += comment.downvoteCount
        }
        if (!comment.parentCommentCid && comment.upvoteCount) {
          karma.linkUpvoteCount += comment.upvoteCount
        }
        if (!comment.parentCommentCid && comment.downvoteCount) {
          karma.linkDownvoteCount += comment.downvoteCount
        }
      }
      karma.commentScore = karma.commentUpvoteCount - karma.commentDownvoteCount
      karma.linkScore = karma.linkUpvoteCount - karma.linkDownvoteCount
      karma.upvoteCount = karma.commentUpvoteCount + karma.linkUpvoteCount
      karma.downvoteCount = karma.commentDownvoteCount + karma.linkDownvoteCount
      karma.score = karma.upvoteCount - karma.downvoteCount
      const accountWithCalculatedProperties = {...account, karma}
      accountsWithCalculatedProperties[accountId] = accountWithCalculatedProperties
    }

    return accountsWithCalculatedProperties
  }, [accounts, accountsComments])
}
