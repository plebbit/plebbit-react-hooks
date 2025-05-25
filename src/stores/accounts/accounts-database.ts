import PlebbitJs from '../../lib/plebbit-js'
import validator from '../../lib/validator'
import chain from '../../lib/chain'
import assert from 'assert'
import localForage from 'localforage'
import localForageLru from '../../lib/localforage-lru'
const accountsDatabase = localForage.createInstance({name: 'accounts'})
const accountsMetadataDatabase = localForage.createInstance({name: 'accountsMetadata'})
import {Accounts, AccountNamesToAccountIds, CreateCommentOptions, Account, Comment, AccountsComments, AccountCommentReply, AccountsCommentsReplies} from '../../types'
import utils from '../../lib/utils'
import {getDefaultPlebbitOptions, overwritePlebbitOptions} from './account-generator'
import Logger from '@plebbit/plebbit-logger'
const log = Logger('plebbit-react-hooks:accounts:stores')

const getAccounts = async (accountIds: string[]) => {
  validator.validateAccountsDatabaseGetAccountsArguments(accountIds)
  const accounts: Accounts = {}
  const promises = []
  for (const accountId of accountIds) {
    promises.push(accountsDatabase.getItem(accountId))
  }
  const accountsArray: any = await Promise.all(promises)
  for (const [i, accountId] of accountIds.entries()) {
    assert(accountsArray[i], `accountId '${accountId}' not found in database`)
    accounts[accountId] = await migrateAccount(accountsArray[i])
    // plebbit options aren't saved to database if they are default
    if (!accounts[accountId].plebbitOptions) {
      accounts[accountId].plebbitOptions = getDefaultPlebbitOptions()
    }
    accounts[accountId].plebbitOptions = {...accounts[accountId].plebbitOptions, ...overwritePlebbitOptions}
    accounts[accountId].plebbit = await PlebbitJs.Plebbit(accounts[accountId].plebbitOptions)
    // handle errors or error events are uncaught
    // no need to log them because plebbit-js already logs them
    accounts[accountId].plebbit.on('error', (error: any) => log.error('uncaught plebbit instance error, should never happen', {error}))
  }
  return accounts
}

const accountVersion = 3
const migrateAccount = async (account: any) => {
  let version = account.version || 1

  // version 2
  if (version === 1) {
    version++
    if (account.plebbitOptions?.ipfsHttpClientsOptions) {
      account.plebbitOptions.kuboRpcClientsOptions = account.plebbitOptions.ipfsHttpClientsOptions
      delete account.plebbitOptions.ipfsHttpClientsOptions
    }
    if (account.plebbitOptions?.pubsubHttpClientsOptions) {
      account.plebbitOptions.pubsubKuboRpcClientsOptions = account.plebbitOptions.pubsubHttpClientsOptions
      delete account.plebbitOptions.pubsubHttpClientsOptions
    }
  }

  // version 3
  if (version === 2) {
    version++
    if (!account.author.wallets) {
      account.author.wallets = {}
    }
    if (!account.author.wallets.eth) {
      account.author.wallets.eth = await chain.getEthWalletFromPlebbitPrivateKey(account.signer.privateKey, account.address)
    }
    if (!account.author.wallets.sol) {
      account.author.wallets.sol = await chain.getSolWalletFromPlebbitPrivateKey(account.signer.privateKey, account.address)
    }
  }

  account.version = accountVersion
  return account
}

const getAccount = async (accountId: string) => {
  const accounts = await getAccounts([accountId])
  return accounts[accountId]
}

const getExportedAccountJson = async (accountId: string) => {
  assert(accountId && typeof accountId === 'string', `getAccountJson argument accountId '${accountId}' invalid`)
  // do not serialize or instantiate anything (unlike getAccount)
  const account = await accountsDatabase.getItem(accountId)
  if (!account) {
    throw Error(`getAccountJson no account in database with accountId '${accountId}'`)
  }
  const accountCommentsDatabase = getAccountCommentsDatabase(accountId)
  const accountVotesDatabase = getAccountVotesDatabase(accountId)
  const accountEditsDatabase = getAccountEditsDatabase(accountId)
  const [accountComments, accountVotes, accountEdits] = await Promise.all([
    getDatabaseAsArray(accountCommentsDatabase),
    getDatabaseAsArray(accountVotesDatabase),
    getDatabaseAsArray(accountEditsDatabase),
  ])
  return JSON.stringify({account, accountComments, accountVotes, accountEdits})
}

// accountVotes, accountComments and accountEdits are indexeddb
// databases formed like an array (keys are numbers)
const getDatabaseAsArray = async (database: any) => {
  const length = (await database.getItem('length')) || 0
  let promises = []
  let i = 0
  while (i < length) {
    promises.push(database.getItem(String(i++)))
  }
  const items = await Promise.all(promises)
  return items
}

const addAccount = async (account: Account) => {
  validator.validateAccountsDatabaseAddAccountArguments(account)
  let accountIds: string[] | null = await accountsMetadataDatabase.getItem('accountIds')

  // handle no duplicate names
  if (accountIds?.length) {
    const accounts: Accounts = await getAccounts(accountIds)
    for (const accountId of accountIds) {
      if (accountId !== account.id && accounts[accountId].name === account.name) {
        throw Error(`account name '${account.name}' already exists in database`)
      }
    }
  }

  // handle updating accounts database
  const accountToPutInDatabase: any = {...account, plebbit: undefined}
  // don't save default plebbit options in database in case they change
  if (JSON.stringify(accountToPutInDatabase.plebbitOptions) === JSON.stringify(getDefaultPlebbitOptions())) {
    delete accountToPutInDatabase.plebbitOptions
  }
  // make sure accountToPutInDatabase.plebbitOptions are valid
  if (accountToPutInDatabase.plebbitOptions) {
    const plebbit = await PlebbitJs.Plebbit(accountToPutInDatabase.plebbitOptions)
    plebbit.on('error', () => {})
    plebbit.destroy?.().catch?.((error: any) => log('database.addAccount plebbit.destroy error', {error})) // make sure it's garbage collected
  }
  await accountsDatabase.setItem(accountToPutInDatabase.id, accountToPutInDatabase)

  // handle updating accountNamesToAccountIds database
  let accountNamesToAccountIds: AccountNamesToAccountIds | null = await accountsMetadataDatabase.getItem('accountNamesToAccountIds')
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

const removeAccount = async (account: Account) => {
  assert(account?.id && typeof account?.id === 'string', `accountsDatabase.removeAccount invalid account.id '${account.id}'`)

  // handle updating accounts database
  await accountsDatabase.removeItem(account.id)

  // handle updating accountNamesToAccountIds database
  let accountNamesToAccountIds: AccountNamesToAccountIds | null = await accountsMetadataDatabase.getItem('accountNamesToAccountIds')
  if (!accountNamesToAccountIds) {
    accountNamesToAccountIds = {}
  }
  delete accountNamesToAccountIds[account.name]
  await accountsMetadataDatabase.setItem('accountNamesToAccountIds', accountNamesToAccountIds)

  // handle updating accountIds database
  let accountIds: string[] | null = await accountsMetadataDatabase.getItem('accountIds')
  accountIds = (accountIds || []).filter((accountId) => accountId !== account.id)
  await accountsMetadataDatabase.setItem('accountIds', accountIds)

  // handle updating activeAccountId database
  const activeAccountId = await accountsMetadataDatabase.getItem('activeAccountId')
  if (activeAccountId === account.id) {
    if (accountIds.length) {
      await accountsMetadataDatabase.setItem('activeAccountId', accountIds[0])
    } else {
      await accountsMetadataDatabase.removeItem('activeAccountId')
    }
  }

  const accountCommentsDatabase = await getAccountCommentsDatabase(account.id)
  if (accountCommentsDatabase) {
    await accountCommentsDatabase.clear()
  }

  const accountVotesDatabase = await getAccountVotesDatabase(account.id)
  if (accountVotesDatabase) {
    await accountVotesDatabase.clear()
  }
}

const accountsCommentsDatabases: any = {}
const getAccountCommentsDatabase = (accountId: string) => {
  assert(accountId && typeof accountId === 'string', `getAccountCommentsDatabase '${accountId}' not a string`)
  if (!accountsCommentsDatabases[accountId]) {
    accountsCommentsDatabases[accountId] = localForage.createInstance({name: `accountComments-${accountId}`})
  }
  return accountsCommentsDatabases[accountId]
}

const addAccountComment = async (accountId: string, comment: CreateCommentOptions | Comment, accountCommentIndex?: number) => {
  const accountCommentsDatabase = getAccountCommentsDatabase(accountId)
  const length = (await accountCommentsDatabase.getItem('length')) || 0
  comment = utils.clone({...comment, signer: undefined})
  if (typeof accountCommentIndex === 'number') {
    assert(accountCommentIndex < length, `addAccountComment cannot edit comment no comment in database at accountCommentIndex '${accountCommentIndex}'`)
    await accountCommentsDatabase.setItem(String(accountCommentIndex), comment)
  } else {
    await Promise.all([accountCommentsDatabase.setItem(String(length), comment), accountCommentsDatabase.setItem('length', length + 1)])
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
  assert(Array.isArray(accountIds), `getAccountsComments invalid accountIds '${accountIds}' not an array`)
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
    accountsVotesDatabases[accountId] = localForage.createInstance({name: `accountVotes-${accountId}`})
  }
  return accountsVotesDatabases[accountId]
}

const addAccountVote = async (accountId: string, createVoteOptions: CreateCommentOptions) => {
  assert(
    createVoteOptions?.commentCid && typeof createVoteOptions?.commentCid === 'string',
    `addAccountVote createVoteOptions.commentCid '${createVoteOptions?.commentCid}' not a string`
  )
  const accountVotesDatabase = getAccountVotesDatabase(accountId)
  const length = (await accountVotesDatabase.getItem('length')) || 0
  const vote = {...createVoteOptions}
  delete vote.signer
  delete vote.author
  // delete all functions because they can't be added to indexeddb
  for (const i in vote) {
    if (typeof vote[i] === 'function') {
      delete vote[i]
    }
  }
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
    votes[vote?.commentCid] = vote
  }
  return votes
}

const getAccountsVotes = async (accountIds: string[]) => {
  assert(Array.isArray(accountIds), `getAccountsVotes invalid accountIds '${accountIds}' not an array`)
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
  const accountCommentsRepliesEntries = await accountCommentsRepliesDatabase.entries()
  const replies = {}
  for (const [, reply] of accountCommentsRepliesEntries) {
    // @ts-ignore
    replies[reply.cid] = reply
  }
  return replies
}

const getAccountsCommentsReplies = async (accountIds: string[]) => {
  assert(Array.isArray(accountIds), `getAccountsCommentsReplies invalid accountIds '${accountIds}' not an array`)
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

const accountsEditsDatabases: any = {}
const getAccountEditsDatabase = (accountId: string) => {
  assert(accountId && typeof accountId === 'string', `getAccountEditsDatabase '${accountId}' not a string`)
  if (!accountsEditsDatabases[accountId]) {
    accountsEditsDatabases[accountId] = localForage.createInstance({name: `accountEdits-${accountId}`})
  }
  return accountsEditsDatabases[accountId]
}

const addAccountEdit = async (accountId: string, createEditOptions: CreateCommentOptions) => {
  assert(
    createEditOptions?.commentCid && typeof createEditOptions?.commentCid === 'string',
    `addAccountEdit createEditOptions.commentCid '${createEditOptions?.commentCid}' not a string`
  )
  const accountEditsDatabase = getAccountEditsDatabase(accountId)
  const length = (await accountEditsDatabase.getItem('length')) || 0
  const edit = {...createEditOptions}
  delete edit.signer
  delete edit.author
  // delete all functions because they can't be added to indexeddb
  for (const i in edit) {
    if (typeof edit[i] === 'function') {
      delete edit[i]
    }
  }

  // edits are an array because you can edit the same comment multiple times
  const edits = (await accountEditsDatabase.getItem(edit.commentCid)) || []
  edits.push(edit)

  await Promise.all([
    accountEditsDatabase.setItem(edit.commentCid, edits),
    accountEditsDatabase.setItem(String(length), edit),
    accountEditsDatabase.setItem('length', length + 1),
  ])
}

const getAccountEdits = async (accountId: string) => {
  const accountEditsDatabase = getAccountEditsDatabase(accountId)
  const length = (await accountEditsDatabase.getItem('length')) || 0
  const edits: any = {}
  if (length === 0) {
    return edits
  }
  let promises = []
  let i = 0
  while (i < length) {
    promises.push(accountEditsDatabase.getItem(String(i++)))
  }
  const editsArray = await Promise.all(promises)
  for (const edit of editsArray) {
    // TODO: must change this logic for subplebbit edits
    if (!edits[edit?.commentCid]) {
      edits[edit?.commentCid] = []
    }
    edits[edit?.commentCid].push(edit)
  }
  return edits
}

const getAccountsEdits = async (accountIds: string[]) => {
  assert(Array.isArray(accountIds), `getAccountsEdits invalid accountIds '${accountIds}' not an array`)
  const promises = []
  for (const accountId of accountIds) {
    promises.push(getAccountEdits(accountId))
  }
  const accountsEditsArray = await Promise.all(promises)
  const accountsEdits: any = {}
  for (const [i, accountId] of accountIds.entries()) {
    accountsEdits[accountId] = accountsEditsArray[i]
  }
  return accountsEdits
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
  removeAccount,
  getExportedAccountJson,
  getAccounts,
  getAccount,
  addAccountCommentReply,
  getAccountCommentsReplies,
  getAccountsCommentsReplies,
  getAccountsEdits,
  getAccountEdits,
  addAccountEdit,
  accountVersion
}

export default database
