import PlebbitJs from '../../lib/plebbit-js'
import validator from '../../lib/validator'
import assert from 'assert'
import localForage from 'localforage'
import localForageLru from '../../lib/localforage-lru'
const accountsDatabase = localForage.createInstance({ name: 'accounts' })
const accountsMetadataDatabase = localForage.createInstance({ name: 'accountsMetadata' })
import {
  Accounts,
  AccountNamesToAccountIds,
  CreateCommentOptions,
  Account,
  Comment,
  AccountsComments,
  AccountCommentReply,
  AccountsCommentsReplies,
} from '../../types'
import utils from '../../lib/utils'

const getAccounts = async (accountIds: string[]) => {
  validator.validateAccountsDatabaseGetAccountsArguments(accountIds)
  const accounts: Accounts = {}
  const promises = []
  for (const accountId of accountIds) {
    promises.push(accountsDatabase.getItem(accountId))
  }
  const accountsArray = await Promise.all(promises)
  for (const [i, accountId] of accountIds.entries()) {
    assert(accountsArray[i], `accountId '${accountId}' not found in database`)
    accounts[accountId] = accountsArray[i]
    accounts[accountId].plebbit = PlebbitJs.Plebbit(accounts[accountId].plebbitOptions)
  }
  return accounts
}

const getAccount = async (accountId: string) => {
  const accounts = await getAccounts([accountId])
  return accounts[accountId]
}

const addAccount = async (account: Account) => {
  validator.validateAccountsDatabaseAddAccountArguments(account)
  let accountIds: string[] | null = await accountsMetadataDatabase.getItem('accountIds')

  // handle no duplicate names
  if (accountIds) {
    const accounts: Accounts = await getAccounts(accountIds)
    for (const accountId of accountIds) {
      if (accountId !== account.id && accounts[accountId].name === account.name) {
        throw Error(`account name '${account.name}' already exists in database`)
      }
    }
  }

  // handle updating accounts database
  const accountToPutInDatabase = { ...account, plebbit: undefined }
  await accountsDatabase.setItem(accountToPutInDatabase.id, accountToPutInDatabase)

  // handle updating accountNamesToAccountIds database
  let accountNamesToAccountIds: AccountNamesToAccountIds | null = await accountsMetadataDatabase.getItem(
    'accountNamesToAccountIds'
  )
  if (!accountNamesToAccountIds) {
    accountNamesToAccountIds = {}
  }
  accountNamesToAccountIds[account.name] = account.id
  await accountsMetadataDatabase.setItem('accountNamesToAccountIds', accountNamesToAccountIds)

  // handle updating accountIds database
  if (!accountIds) {
    accountIds = [account.id]
  }
  if (!accountIds.includes(account.id)) {
    accountIds.push(account.id)
  }
  await accountsMetadataDatabase.setItem('accountIds', accountIds)

  // handle updating activeAccountId database
  if (accountIds.length === 1) {
    await accountsMetadataDatabase.setItem('activeAccountId', account.id)
  }
}

const accountsCommentsDatabases: any = {}
const getAccountCommentsDatabase = (accountId: string) => {
  assert(accountId && typeof accountId === 'string', `getAccountCommentsDatabase '${accountId}' not a string`)
  if (!accountsCommentsDatabases[accountId]) {
    accountsCommentsDatabases[accountId] = localForage.createInstance({ name: `accountComments-${accountId}` })
  }
  return accountsCommentsDatabases[accountId]
}

const addAccountComment = async (
  accountId: string,
  comment: CreateCommentOptions | Comment,
  accountCommentIndex?: number
) => {
  const accountCommentsDatabase = getAccountCommentsDatabase(accountId)
  const length = (await accountCommentsDatabase.getItem('length')) || 0
  comment = utils.clone({ ...comment, signer: undefined })
  if (typeof accountCommentIndex === 'number') {
    assert(
      accountCommentIndex < length,
      `addAccountComment cannot edit comment no comment in database at accountCommentIndex '${accountCommentIndex}'`
    )
    await accountCommentsDatabase.setItem(String(accountCommentIndex), comment)
  } else {
    await Promise.all([
      accountCommentsDatabase.setItem(String(length), comment),
      accountCommentsDatabase.setItem('length', length + 1),
    ])
  }
}

const getAccountComments = async (accountId: string) => {
  const accountCommentsDatabase = getAccountCommentsDatabase(accountId)
  const length = (await accountCommentsDatabase.getItem('length')) || 0
  if (length === 0) {
    return []
  }
  let promises = []
  let i = 0
  while (i < length) {
    promises.push(accountCommentsDatabase.getItem(String(i++)))
  }
  const comments = await Promise.all(promises)
  // add index and account id to account comments for easier updating
  for (const i in comments) {
    comments[i].index = Number(i)
    comments[i].accountId = accountId
  }
  return comments
}

const getAccountsComments = async (accountIds: string[]) => {
  const promises = []
  for (const accountId of accountIds) {
    promises.push(getAccountComments(accountId))
  }
  const accountsCommentsArray = await Promise.all(promises)
  const accountsComments: AccountsComments = {}
  for (const [i, accountId] of accountIds.entries()) {
    accountsComments[accountId] = accountsCommentsArray[i]
  }
  return accountsComments
}

const accountsVotesDatabases: any = {}
const getAccountVotesDatabase = (accountId: string) => {
  assert(accountId && typeof accountId === 'string', `getAccountVotesDatabase '${accountId}' not a string`)
  if (!accountsVotesDatabases[accountId]) {
    accountsVotesDatabases[accountId] = localForage.createInstance({ name: `accountVotes-${accountId}` })
  }
  return accountsVotesDatabases[accountId]
}

const addAccountVote = async (accountId: string, createVoteOptions: CreateCommentOptions) => {
  assert(
    createVoteOptions.commentCid && typeof createVoteOptions.commentCid === 'string',
    `addAccountVote '${createVoteOptions.commentCid}' not a string`
  )
  const accountVotesDatabase = getAccountVotesDatabase(accountId)
  const length = (await accountVotesDatabase.getItem('length')) || 0
  const vote = { ...createVoteOptions, signer: undefined, author: undefined }
  await Promise.all([
    accountVotesDatabase.setItem(vote.commentCid, vote),
    accountVotesDatabase.setItem(String(length), vote),
    accountVotesDatabase.setItem('length', length + 1),
  ])
}

const getAccountVotes = async (accountId: string) => {
  const accountVotesDatabase = getAccountVotesDatabase(accountId)
  const length = (await accountVotesDatabase.getItem('length')) || 0
  const votes: any = {}
  if (length === 0) {
    return votes
  }
  let promises = []
  let i = 0
  while (i < length) {
    promises.push(accountVotesDatabase.getItem(String(i++)))
  }
  const votesArray = await Promise.all(promises)
  for (const vote of votesArray) {
    votes[vote.commentCid] = vote
  }
  return votes
}

const getAccountsVotes = async (accountIds: string[]) => {
  const promises = []
  for (const accountId of accountIds) {
    promises.push(getAccountVotes(accountId))
  }
  const accountsVotesArray = await Promise.all(promises)
  const accountsVotes: any = {}
  for (const [i, accountId] of accountIds.entries()) {
    accountsVotes[accountId] = accountsVotesArray[i]
  }
  return accountsVotes
}

const accountsCommentsRepliesDatabases: any = {}
const getAccountCommentsRepliesDatabase = (accountId: string) => {
  assert(accountId && typeof accountId === 'string', `getAccountCommentsRepliesDatabase '${accountId}' not a string`)
  if (!accountsCommentsRepliesDatabases[accountId]) {
    accountsCommentsRepliesDatabases[accountId] = localForageLru.createInstance({
      name: `accountCommentsReplies-${accountId}`,
      size: 1000,
    })
  }
  return accountsCommentsRepliesDatabases[accountId]
}

const addAccountCommentReply = async (accountId: string, reply: AccountCommentReply) => {
  const accountCommentsRepliesDatabase = getAccountCommentsRepliesDatabase(accountId)
  await accountCommentsRepliesDatabase.setItem(reply.cid, utils.clone(reply))
}

const getAccountCommentsReplies = async (accountId: string) => {
  const accountCommentsRepliesDatabase = getAccountCommentsRepliesDatabase(accountId)
  const replyCids = await accountCommentsRepliesDatabase.keys()
  const promises = []
  for (const replyCid of replyCids) {
    promises.push(accountCommentsRepliesDatabase.getItem(replyCid))
  }
  const replyArray = await Promise.all(promises)
  const replies = {}
  for (const reply of replyArray) {
    // @ts-ignore
    replies[reply.cid] = reply
  }
  return replies
}

const getAccountsCommentsReplies = async (accountIds: string[]) => {
  const promises = []
  for (const accountId of accountIds) {
    promises.push(getAccountCommentsReplies(accountId))
  }
  const accountsCommentsRepliesArray = await Promise.all(promises)
  const accountsCommentsReplies: AccountsCommentsReplies = {}
  for (const [i, accountId] of accountIds.entries()) {
    accountsCommentsReplies[accountId] = accountsCommentsRepliesArray[i]
  }
  return accountsCommentsReplies
}

const database = {
  accountsDatabase,
  accountsMetadataDatabase,
  getAccountsVotes,
  getAccountVotes,
  addAccountVote,
  getAccountsComments,
  getAccountComments,
  addAccountComment,
  addAccount,
  getAccounts,
  getAccount,
  addAccountCommentReply,
  getAccountCommentsReplies,
  getAccountsCommentsReplies,
}

export default database
