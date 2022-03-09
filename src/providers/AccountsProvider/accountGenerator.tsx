import PlebbitJs from '../../lib/plebbit-js'
import validator from '../../lib/validator'
import { v4 as uuid } from 'uuid'
import accountsDatabase from './accountsDatabase'
import {Accounts} from '../../types'

export const generateDefaultAccount = async () => {
  // TODO: a default account will probably not be exactly like this
  const signer = {} // TODO: generate new signer
  const author = {
    displayName: null,
    address: 'Qm...', // TODO: get address of signer
  }
  const plebbitOptions = {
    ipfsGatewayUrl: 'https://cloudflare-ipfs',
    ipfsApiUrl: 'http://localhost:8080',
  }
  const accountName = await getNextAvailableDefaultAccountName()
  const account = {
    id: uuid(),
    name: accountName,
    author,
    signer,
    plebbit: PlebbitJs.Plebbit(plebbitOptions),
    plebbitOptions,
    subscriptions: [],
    blockedAddresses: {},
  }
  return account
}

const getNextAvailableDefaultAccountName = async () => {
  const accountIds: string[] | null = await accountsDatabase.accountsMetadataDatabase.getItem('accountIds')
  const accountNames = []
  if (accountIds) {
    const accounts: Accounts | null = await accountsDatabase.getAccounts(accountIds)
    for (const accountId of accountIds) {
      accountNames.push(accounts[accountId].name)
    }
  }
  let accountNumber = 1
  if (!accountNames?.length) {
    return `Account ${accountNumber}`
  }
  validator.validateAccountsProviderAccountNames(accountNames)

  const accountNamesSet = new Set(accountNames)
  while (true) {
    const accountName = `Account ${accountNumber}`
    if (!accountNamesSet.has(accountName)) {
      return accountName
    }
    accountNumber++
  }
}

const accountGenerator = {
  generateDefaultAccount,
}

export default accountGenerator
