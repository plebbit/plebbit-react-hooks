import React, {useState, useEffect, useMemo} from 'react'
import validator from '../../lib/validator'
import assert from 'assert'
import Debug from 'debug'
const debug = Debug('plebbit-react-hooks:providers:accounts-provider')
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
  CreateSubplebbitOptions,
  CreateVoteOptions,
  Comment,
  Subplebbit,
  AccountComment,
  AccountsComments,
  AccountsNotifications,
  AccountCommentReply,
  AccountCommentsReplies,
  AccountsCommentsReplies,
} from '../../types'

type AccountsContext = any

export const AccountsContext = React.createContext<AccountsContext | undefined>(undefined)

export default function AccountsProvider(props: Props): JSX.Element | null {
  const [accounts, setAccounts] = useState<Accounts | undefined>(undefined)
  const [accountIds, setAccountIds] = useState<string[] | undefined>(undefined)
  const [activeAccountId, setActiveAccountId] = useState<string | undefined>(undefined)
  const [accountNamesToAccountIds, setAccountNamesToAccountIds] = useState<AccountNamesToAccountIds | undefined>(undefined)
  const [accountsComments, setAccountsComments] = useState<AccountsComments>({})
  const [accountsCommentsReplies, setAccountsCommentsReplies] = useState<AccountsCommentsReplies>({})
  const [accountsVotes, setAccountsVotes] = useState<any>({})
  const accountsCommentsWithoutCids = useAccountsCommentsWithoutCids(accounts, accountsComments)
  const accountsNotifications = useAccountsNotifications(accounts, accountsCommentsReplies)
  const accountsWithCalculatedProperties = useAccountsWithCalculatedProperties(accounts, accountsComments, accountsNotifications)

  const accountsActions: AccountsActions = {}

  accountsActions.setActiveAccount = async (accountName: string) => {
    assert(accountNamesToAccountIds, `can't use AccountContext.accountActions before initialized`)
    validator.validateAccountsActionsSetActiveAccountArguments(accountName)
    const accountId = accountNamesToAccountIds[accountName]
    await accountsDatabase.accountsMetadataDatabase.setItem('activeAccountId', accountId)
    debug('accountsActions.setActiveAccount', {accountName, accountId})
    setActiveAccountId(accountId)
  }

  accountsActions.setAccount = async (account: Account) => {
    validator.validateAccountsActionsSetAccountArguments(account)
    assert(accounts?.[account.id], `cannot set account with account.id '${account.id}' id does not exist in database`)
    // use this function to serialize and update all databases
    await accountsDatabase.addAccount(account)
    const [newAccount, newAccountNamesToAccountIds] = await Promise.all<any>([
      // use this function to deserialize
      accountsDatabase.getAccount(account.id),
      accountsDatabase.accountsMetadataDatabase.getItem('accountNamesToAccountIds'),
    ])
    const newAccounts = {...accounts, [newAccount.id]: newAccount}
    debug('accountsActions.setAccount', {account: newAccount})
    setAccounts(newAccounts)
    setAccountNamesToAccountIds(newAccountNamesToAccountIds)
  }

  accountsActions.setAccountsOrder = async (newOrderedAccountNames: string[]) => {
    assert(accounts && accountNamesToAccountIds, `can't use AccountContext.accountActions before initialized`)
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

  const addNewAccountToDatabaseAndState = async (newAccount: Account) => {
    await accountsDatabase.addAccount(newAccount)
    const newAccounts = {...accounts, [newAccount.id]: newAccount}
    const [newAccountIds, newAccountNamesToAccountIds] = await Promise.all<any>([
      accountsDatabase.accountsMetadataDatabase.getItem('accountIds'),
      accountsDatabase.accountsMetadataDatabase.getItem('accountNamesToAccountIds'),
    ])
    setAccounts(newAccounts)
    setAccountIds(newAccountIds)
    setAccountNamesToAccountIds(newAccountNamesToAccountIds)
    setAccountsComments({...accountsComments, [newAccount.id]: []})
    setAccountsVotes({...accountsVotes, [newAccount.id]: {}})

    // if there is only 1 account, make it active
    // otherwise stay on the same active account
    if (newAccountIds.length === 1) {
      setActiveAccountId(newAccount.id)
    }
  }

  accountsActions.createAccount = async (accountName?: string) => {
    const newAccount = await accountGenerator.generateDefaultAccount()
    if (accountName) {
      newAccount.name = accountName
    }
    await addNewAccountToDatabaseAndState(newAccount)
    debug('accountsActions.createAccount', {accountName, account: newAccount})
  }

  accountsActions.deleteAccount = async (accountName?: string) => {
    assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use AccountContext.accountActions before initialized`)
    let account = accounts[activeAccountId]
    if (accountName) {
      const accountId = accountNamesToAccountIds[accountName]
      account = accounts[accountId]
    }
    assert(account?.id, `accountsActions.deleteAccount account.id '${account?.id}' doesn't exist, activeAccountId '${activeAccountId}' accountName '${accountName}'`)
    await accountsDatabase.removeAccount(account)
    const newAccounts = {...accounts}
    delete newAccounts[account.id]
    const [newAccountIds, newActiveAccountId, newAccountNamesToAccountIds] = await Promise.all<any>([
      accountsDatabase.accountsMetadataDatabase.getItem('accountIds'),
      accountsDatabase.accountsMetadataDatabase.getItem('activeAccountId'),
      accountsDatabase.accountsMetadataDatabase.getItem('accountNamesToAccountIds'),
    ])
    const newAccountsComments = {...accountsComments}
    delete newAccountsComments[account.id]
    const newAccountsVotes = {...accountsVotes}
    delete newAccountsVotes[account.id]
    setAccounts(newAccounts)
    setAccountIds(newAccountIds)
    setActiveAccountId(newActiveAccountId)
    setAccountNamesToAccountIds(newAccountNamesToAccountIds)
    setAccountsComments(newAccountsComments)
    setAccountsVotes(newAccountsVotes)
  }

  accountsActions.deleteComment = async (commentCidOrAccountCommentIndex: string | number, accountName?: string) => {
    throw Error('TODO: not implemented')
  }

  accountsActions.importAccount = async (serializedAccount: string) => {
    assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use AccountContext.accountActions before initialized`)
    let account
    try {
      account = JSON.parse(serializedAccount)
    } catch (e) {}
    assert(account && account?.id && account?.name, `accountsActions.importAccount failed JSON.stringify json serializedAccount '${serializedAccount}'`)

    // if account.name already exists, add ' 2', don't overwrite
    if (accountNamesToAccountIds[account.name]) {
      account.name += ' 2'
    }

    // create a new account id
    const {id} = await accountGenerator.generateDefaultAccount()
    const newAccount = {...account, id}
    await addNewAccountToDatabaseAndState(newAccount)
    debug('accountsActions.importAccount', {account: newAccount})

    // TODO: the 'account' should contain AccountComments and AccountVotes
    // TODO: add options to only import private key, account settings, or include all account comments/votes history
  }

  accountsActions.exportAccount = async (accountName?: string) => {
    assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use AccountContext.accountActions before initialized`)
    let account = accounts[activeAccountId]
    if (accountName) {
      const accountId = accountNamesToAccountIds[accountName]
      account = accounts[accountId]
    }
    assert(account?.id, `accountsActions.exportAccount account.id '${account?.id}' doesn't exist, activeAccountId '${activeAccountId}' accountName '${accountName}'`)
    const accountJson = await accountsDatabase.getAccountJson(account.id)
    debug('accountsActions.exportAccount', {accountJson})
    return accountJson

    // TODO: the 'account' should contain AccountComments and AccountVotes
    // TODO: add options to only export private key, account settings, or include all account comments/votes history
  }

  accountsActions.publishComment = async (publishCommentOptions: PublishCommentOptions, accountName?: string) => {
    assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use AccountContext.accountActions before initialized`)
    let account = accounts[activeAccountId]
    if (accountName) {
      const accountId = accountNamesToAccountIds[accountName]
      account = accounts[accountId]
    }
    validator.validateAccountsActionsPublishCommentArguments({publishCommentOptions, accountName, account})

    let createCommentOptions = {
      timestamp: Math.round(Date.now() / 1000),
      author: account.author,
      signer: account.signer,
      ...publishCommentOptions,
    }
    delete createCommentOptions.onChallenge
    delete createCommentOptions.onChallengeVerification

    let accountCommentIndex: number

    let comment = await account.plebbit.createComment(createCommentOptions)
    const publishAndRetryFailedChallengeVerification = () => {
      comment.once('challenge', async (challenge: Challenge) => {
        publishCommentOptions.onChallenge(challenge, comment)
      })
      comment.once('challengeverification', async (challengeVerification: ChallengeVerification) => {
        publishCommentOptions.onChallengeVerification(challengeVerification, comment)
        if (!challengeVerification.challengeSuccess) {
          // publish again automatically on fail
          createCommentOptions = {...createCommentOptions, timestamp: Math.round(Date.now() / 1000)}
          comment = await account.plebbit.createComment(createCommentOptions)
          publishAndRetryFailedChallengeVerification()
        } else {
          // the challengeverification message of a comment publication should in theory send back the CID
          // of the published comment which is needed to resolve it for replies, upvotes, etc
          if (challengeVerification?.publication?.cid) {
            const commentWithCid = {...createCommentOptions, cid: challengeVerification.publication.cid}
            await accountsDatabase.addAccountComment(account.id, commentWithCid, accountCommentIndex)
            setAccountsComments((previousAccountsComments) => {
              const updatedAccountComments = [...previousAccountsComments[account.id]]
              const updatedAccountComment = {...commentWithCid, index: accountCommentIndex, accountId: account.id}
              updatedAccountComments[accountCommentIndex] = updatedAccountComment
              return {...previousAccountsComments, [account.id]: updatedAccountComments}
            })

            startUpdatingAccountCommentOnCommentUpdateEvents(comment, account, accountCommentIndex).catch((error: unknown) =>
              console.error('accountsActions.publishComment startUpdatingAccountCommentOnCommentUpdateEvents error', {comment, account, accountCommentIndex, error})
            )
          }
        }
      })
      comment.publish()
    }

    publishAndRetryFailedChallengeVerification()
    await accountsDatabase.addAccountComment(account.id, createCommentOptions)
    debug('accountsActions.publishComment', {createCommentOptions})
    setAccountsComments((previousAccountsComments) => {
      // save account comment index to update the comment later
      accountCommentIndex = previousAccountsComments[account.id].length
      const createdAccountComment = {...createCommentOptions, index: accountCommentIndex, accountId: account.id}
      return {
        ...previousAccountsComments,
        [account.id]: [...previousAccountsComments[account.id], createdAccountComment],
      }
    })
  }

  accountsActions.publishCommentEdit = async (publishCommentEditOptions: PublishCommentEditOptions, accountName?: string) => {
    assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use AccountContext.accountActions before initialized`)
    let account = accounts[activeAccountId]
    if (accountName) {
      const accountId = accountNamesToAccountIds[accountName]
      account = accounts[accountId]
    }
    validator.validateAccountsActionsPublishCommentEditArguments({publishCommentEditOptions, accountName, account})

    let createCommentEditOptions = {
      timestamp: Math.round(Date.now() / 1000),
      author: account.author,
      signer: account.signer,
      ...publishCommentEditOptions,
    }
    delete createCommentEditOptions.onChallenge
    delete createCommentEditOptions.onChallengeVerification

    let commentEdit = await account.plebbit.createCommentEdit(createCommentEditOptions)
    const publishAndRetryFailedChallengeVerification = () => {
      commentEdit.once('challenge', async (challenge: Challenge) => {
        publishCommentEditOptions.onChallenge(challenge, commentEdit)
      })
      commentEdit.once('challengeverification', async (challengeVerification: ChallengeVerification) => {
        publishCommentEditOptions.onChallengeVerification(challengeVerification, commentEdit)
        if (!challengeVerification.challengeSuccess) {
          // publish again automatically on fail
          createCommentEditOptions = {...createCommentEditOptions, timestamp: Math.round(Date.now() / 1000)}
          commentEdit = await account.plebbit.createCommentEdit(createCommentEditOptions)
          publishAndRetryFailedChallengeVerification()
        }
      })
      commentEdit.publish()
    }

    publishAndRetryFailedChallengeVerification()
    debug('accountsActions.createCommentEdit', {createCommentEditOptions})
  }

  accountsActions.publishSubplebbitEdit = async (publishSubplebbitEditOptions: any, accountName?: string) => {
    throw Error('TODO: not implemented')
    // TODO: a moderator can publish an edit to the subplebbit settings over the pubsub
    // and the subplebbit owner node will update the subplebbit
  }

  accountsActions.publishVote = async (publishVoteOptions: PublishVoteOptions, accountName?: string) => {
    assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use AccountContext.accountActions before initialized`)
    let account = accounts[activeAccountId]
    if (accountName) {
      const accountId = accountNamesToAccountIds[accountName]
      account = accounts[accountId]
    }
    validator.validateAccountsActionsPublishVoteArguments({publishVoteOptions, accountName, account})

    let createVoteOptions = {
      timestamp: Math.round(Date.now() / 1000),
      author: account.author,
      signer: account.signer,
      ...publishVoteOptions,
    }
    delete createVoteOptions.onChallenge
    delete createVoteOptions.onChallengeVerification

    let vote = await account.plebbit.createVote(createVoteOptions)
    const publishAndRetryFailedChallengeVerification = () => {
      vote.once('challenge', async (challenge: Challenge) => {
        publishVoteOptions.onChallenge(challenge, vote)
      })
      vote.once('challengeverification', async (challengeVerification: ChallengeVerification) => {
        publishVoteOptions.onChallengeVerification(challengeVerification, vote)
        if (!challengeVerification.challengeSuccess) {
          // publish again automatically on fail
          createVoteOptions = {...createVoteOptions, timestamp: Math.round(Date.now() / 1000)}
          vote = await account.plebbit.createVote(createVoteOptions)
          publishAndRetryFailedChallengeVerification()
        }
      })
      vote.publish()
    }

    publishAndRetryFailedChallengeVerification()
    await accountsDatabase.addAccountVote(account.id, createVoteOptions)
    debug('accountsActions.publishVote', {createVoteOptions})
    setAccountsVotes({
      ...accountsVotes,
      [account.id]: {...accountsVotes[account.id], [createVoteOptions.commentCid]: createVoteOptions},
    })
  }

  accountsActions.subscribe = async (subplebbitAddress: string | number, accountName?: string) => {
    assert(subplebbitAddress && typeof subplebbitAddress === 'string', `accountsActions.subscribe invalid subplebbitAddress '${subplebbitAddress}'`)
    assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use AccountContext.accountActions before initialized`)
    let account = accounts[activeAccountId]
    if (accountName) {
      const accountId = accountNamesToAccountIds[accountName]
      account = accounts[accountId]
    }
    assert(account?.id, `accountsActions.subscribe account.id '${account?.id}' doesn't exist, activeAccountId '${activeAccountId}' accountName '${accountName}'`)

    const subscriptions: string[] = account.subscriptions || []
    if (subscriptions.includes(subplebbitAddress)) {
      throw Error(`account '${account.id}' already subscribed to '${subplebbitAddress}'`)
    }
    subscriptions.push(subplebbitAddress)

    const updatedAccount = {...account, subscriptions}
    // update account in db
    await accountsDatabase.addAccount(updatedAccount)
    const updatedAccounts = {...accounts, [updatedAccount.id]: updatedAccount}
    debug('accountsActions.subscribe', {account: updatedAccount, accountName, subplebbitAddress})
    setAccounts(updatedAccounts)
  }

  accountsActions.unsubscribe = async (subplebbitAddress: string | number, accountName?: string) => {
    assert(subplebbitAddress && typeof subplebbitAddress === 'string', `accountsActions.unsubscribe invalid subplebbitAddress '${subplebbitAddress}'`)
    assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use AccountContext.accountActions before initialized`)
    let account = accounts[activeAccountId]
    if (accountName) {
      const accountId = accountNamesToAccountIds[accountName]
      account = accounts[accountId]
    }
    assert(account?.id, `accountsActions.unsubscribe account.id '${account?.id}' doesn't exist, activeAccountId '${activeAccountId}' accountName '${accountName}'`)

    let subscriptions: string[] = account.subscriptions || []
    if (!subscriptions.includes(subplebbitAddress)) {
      throw Error(`account '${account.id}' already unsubscribed from '${subplebbitAddress}'`)
    }
    // remove subplebbitAddress
    subscriptions = subscriptions.filter((address) => address !== subplebbitAddress)

    const updatedAccount = {...account, subscriptions}
    // update account in db
    await accountsDatabase.addAccount(updatedAccount)
    const updatedAccounts = {...accounts, [updatedAccount.id]: updatedAccount}
    debug('accountsActions.unsubscribe', {account: updatedAccount, accountName, subplebbitAddress})
    setAccounts(updatedAccounts)
  }

  accountsActions.blockAddress = async (address: string | number, accountName?: string) => {
    assert(address && typeof address === 'string', `accountsActions.blockAddress invalid address '${address}'`)
    assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use AccountContext.accountActions before initialized`)
    let account = accounts[activeAccountId]
    if (accountName) {
      const accountId = accountNamesToAccountIds[accountName]
      account = accounts[accountId]
    }
    assert(account?.id, `accountsActions.blockAddress account.id '${account?.id}' doesn't exist, activeAccountId '${activeAccountId}' accountName '${accountName}'`)

    const blockedAddresses: {[address: string]: boolean} = {...account.blockedAddresses}
    if (blockedAddresses[address] === true) {
      throw Error(`account '${account.id}' already blocked address '${address}'`)
    }
    blockedAddresses[address] = true

    const updatedAccount = {...account, blockedAddresses}
    // update account in db
    await accountsDatabase.addAccount(updatedAccount)
    const updatedAccounts = {...accounts, [updatedAccount.id]: updatedAccount}
    debug('accountsActions.blockAddress', {account: updatedAccount, accountName, address})
    setAccounts(updatedAccounts)
  }

  accountsActions.unblockAddress = async (address: string | number, accountName?: string) => {
    assert(address && typeof address === 'string', `accountsActions.unblockAddress invalid address '${address}'`)
    assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use AccountContext.accountActions before initialized`)
    let account = accounts[activeAccountId]
    if (accountName) {
      const accountId = accountNamesToAccountIds[accountName]
      account = accounts[accountId]
    }
    assert(account?.id, `accountsActions.unblockAddress account.id '${account?.id}' doesn't exist, activeAccountId '${activeAccountId}' accountName '${accountName}'`)

    const blockedAddresses: {[address: string]: boolean} = {...account.blockedAddresses}
    if (!blockedAddresses[address]) {
      throw Error(`account '${account.id}' already blocked address '${address}'`)
    }
    delete blockedAddresses[address]

    const updatedAccount = {...account, blockedAddresses}
    // update account in db
    await accountsDatabase.addAccount(updatedAccount)
    const updatedAccounts = {...accounts, [updatedAccount.id]: updatedAccount}
    debug('accountsActions.unblockAddress', {account: updatedAccount, accountName, address})
    setAccounts(updatedAccounts)
  }

  accountsActions.createSubplebbit = async (createSubplebbitOptions: CreateSubplebbitOptions, accountName?: string) => {
    assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use AccountContext.accountActions before initialized`)
    let account = accounts[activeAccountId]
    if (accountName) {
      const accountId = accountNamesToAccountIds[accountName]
      account = accounts[accountId]
    }
    return account.plebbit.createSubplebbit(createSubplebbitOptions)
  }

  // internal accounts action: the comment CID is not known at the time of publishing, so every time
  // we fetch a new comment, check if its our own, and attempt to add the CID
  const addCidToAccountComment = async (comment: Comment) => {
    assert(accounts, `can't use AccountContext.accountActions before initialized`)
    const accountCommentsWithoutCids = accountsCommentsWithoutCids[comment?.author?.address]
    if (!accountCommentsWithoutCids) {
      return
    }
    for (const accountComment of accountCommentsWithoutCids) {
      // if author address and timestamp is the same, we assume it's the right comment
      if (accountComment.timestamp && accountComment.timestamp === comment.timestamp) {
        const commentWithCid = utils.merge(accountComment, comment)
        await accountsDatabase.addAccountComment(accountComment.accountId, commentWithCid, accountComment.index)
        setAccountsComments((previousAccountsComments) => {
          const updatedAccountComments = [...previousAccountsComments[accountComment.accountId]]
          updatedAccountComments[accountComment.index] = commentWithCid
          return {...previousAccountsComments, [accountComment.accountId]: updatedAccountComments}
        })

        startUpdatingAccountCommentOnCommentUpdateEvents(comment, accounts[accountComment.accountId], accountComment.index).catch((error: unknown) =>
          console.error('accountsActions.addCidToAccountComment startUpdatingAccountCommentOnCommentUpdateEvents error', {
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

  // internal accounts action: if a subplebbit has a role with an account's address
  // add it to the account.subplebbits database
  const addSubplebbitRoleToAccountsSubplebbits = async (subplebbit: Subplebbit) => {
    if (!subplebbit) {
      return
    }
    assert(accounts, `can't use AccountContext.accountActions before initialized`)

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

    setAccounts((previousAccounts) => {
      const {toAdd, toRemove, hasChange} = getChange(previousAccounts, subplebbit)
      const nextAccounts = {...previousAccounts}

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

      debug('accountsActions.addSubplebbitRoleToAccountsSubplebbits', {subplebbit, toAdd, toRemove})
      return nextAccounts
    })
  }

  // internal accounts action: mark an account's notifications as read
  const markAccountNotificationsAsRead = async (account: Account) => {
    assert(typeof account?.id === 'string', `AccountContext.markAccountNotificationsAsRead invalid account argument '${account}'`)

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

    // add all to react context
    debug('AccountContext.markAccountNotificationsAsRead', {account, repliesToMarkAsRead})
    setAccountsCommentsReplies((previousAccountsCommentsReplies) => {
      const updatedAccountCommentsReplies = {...previousAccountsCommentsReplies[account.id], ...repliesToMarkAsRead}
      return {...previousAccountsCommentsReplies, [account.id]: updatedAccountCommentsReplies}
    })
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
      comment = await account.plebbit.createComment(comment)
    }
    // @ts-ignore
    setAlreadyUpdatingAccountsComments((prev) => ({...prev, [comment.cid]: true}))
    comment.on('update', async (updatedComment: Comment) => {
      // merge should not be needed if plebbit-js is implemented properly, but no harm in fixing potential errors
      updatedComment = utils.merge(commentArgument, comment, updatedComment)
      await accountsDatabase.addAccountComment(account.id, updatedComment, accountCommentIndex)
      setAccountsComments((previousAccountsComments) => {
        const updatedAccountComments = [...previousAccountsComments[account.id]]
        const previousComment = updatedAccountComments[accountCommentIndex]
        const updatedAccountComment = utils.clone({
          ...updatedComment,
          index: accountCommentIndex,
          accountId: account.id,
        })
        updatedAccountComments[accountCommentIndex] = updatedAccountComment
        return {...previousAccountsComments, [account.id]: updatedAccountComments}
      })

      // update AccountCommentsReplies with new replies if has any new replies
      const replyPageArray = [
        updatedComment.replies?.pages?.new,
        updatedComment.replies?.pages?.topAll,
        updatedComment.replies?.pages?.old,
        updatedComment.replies?.pages?.controversialAll,
      ]
      const hasReplies = replyPageArray.map((replyPage) => replyPage?.comments?.length || 0).reduce((prev, curr) => prev + curr) > 0
      if (hasReplies) {
        setAccountsCommentsReplies((previousAccountsCommentsReplies) => {
          // check which replies are read or not
          const updatedAccountCommentsReplies: {[replyCid: string]: Comment} = {}
          for (const replyPage of replyPageArray) {
            for (const reply of replyPage?.comments || []) {
              const markedAsRead = previousAccountsCommentsReplies[account.id]?.[reply.cid]?.markedAsRead === true ? true : false
              updatedAccountCommentsReplies[reply.cid] = {...reply, markedAsRead}
            }
          }

          // add all to database
          const promises = []
          for (const replyCid in updatedAccountCommentsReplies) {
            promises.push(accountsDatabase.addAccountCommentReply(account.id, updatedAccountCommentsReplies[replyCid]))
          }
          Promise.all(promises)

          // set new react context
          const newAccountCommentsReplies = {
            ...previousAccountsCommentsReplies[account.id],
            ...updatedAccountCommentsReplies,
          }
          return {...previousAccountsCommentsReplies, [account.id]: newAccountCommentsReplies}
        })
      }
    })
    comment.update()
  }

  // load accounts from database once on load
  useEffect(() => {
    ;(async () => {
      let accountIds: string[] | undefined
      let activeAccountId: string | undefined
      let accounts: Accounts
      let accountNamesToAccountIds: AccountNamesToAccountIds | undefined
      accountIds = (await accountsDatabase.accountsMetadataDatabase.getItem('accountIds')) || undefined
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
        accounts = {[defaultAccount.id]: defaultAccount}
        ;[accountIds, activeAccountId, accountNamesToAccountIds] = await Promise.all<any>([
          accountsDatabase.accountsMetadataDatabase.getItem('accountIds'),
          accountsDatabase.accountsMetadataDatabase.getItem('activeAccountId'),
          accountsDatabase.accountsMetadataDatabase.getItem('accountNamesToAccountIds'),
        ])
        assert(accountIds && activeAccountId && accountNamesToAccountIds, `AccountsProvider error creating a default account during initialization`)
      }
      const [accountsComments, accountsVotes, accountsCommentsReplies] = await Promise.all<any>([
        accountsDatabase.getAccountsComments(accountIds),
        accountsDatabase.getAccountsVotes(accountIds),
        accountsDatabase.getAccountsCommentsReplies(accountIds),
      ])
      setAccounts(accounts)
      setAccountIds(accountIds)
      setActiveAccountId(activeAccountId)
      setAccountNamesToAccountIds(accountNamesToAccountIds)
      setAccountsComments(accountsComments)
      setAccountsVotes(accountsVotes)
      setAccountsCommentsReplies(accountsCommentsReplies)

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
      accountsNotifications,
      // internal accounts actions
      addCidToAccountComment,
      markAccountNotificationsAsRead,
      addSubplebbitRoleToAccountsSubplebbits,
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
      accountsNotifications,
      accountsCommentsWithoutCids,
    },
  })
  return <AccountsContext.Provider value={accountsContext}>{props.children}</AccountsContext.Provider>
}

const useAccountsNotifications = (accounts?: Accounts, accountsCommentsReplies?: AccountsCommentsReplies) => {
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

const useAccountsCommentsWithoutCids = (accounts?: Accounts, accountsComments?: AccountsComments) => {
  return useMemo(() => {
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
    return accountsCommentsWithoutCids
  }, [accountsComments])
}

// add calculated properties to accounts, like karma and unreadNotificationCount
const useAccountsWithCalculatedProperties = (accounts?: Accounts, accountsComments?: AccountsComments, accountsNotifications?: AccountsNotifications) => {
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
        commentUpvoteCount: 0,
        commentDownvoteCount: 0,
        commentScore: 0,
        linkUpvoteCount: 0,
        linkDownvoteCount: 0,
        linkScore: 0,
        upvoteCount: 0,
        downvoteCount: 0,
        score: 0,
      }
      for (const comment of accountComments) {
        if (comment.parentCid && comment.upvoteCount) {
          karma.commentUpvoteCount += comment.upvoteCount
        }
        if (comment.parentCid && comment.downvoteCount) {
          karma.commentDownvoteCount += comment.downvoteCount
        }
        if (!comment.parentCid && comment.upvoteCount) {
          karma.linkUpvoteCount += comment.upvoteCount
        }
        if (!comment.parentCid && comment.downvoteCount) {
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
