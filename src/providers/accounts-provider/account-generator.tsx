import PlebbitJs from '../../lib/plebbit-js'
import validator from '../../lib/validator'
import { v4 as uuid } from 'uuid'
import accountsDatabase from './accounts-database'
import { Accounts } from '../../types'

export const generateDefaultAccount = async () => {
  const plebbitOptions = {
    ipfsGatewayUrl: 'https://cloudflare-ipfs.com',
    ipfsHttpClientOptions: undefined,
    pubsubHttpClientOptions: 'https://pubsubprovider.xyz/api/v0',
  }
  const plebbit = await PlebbitJs.Plebbit(plebbitOptions)
  const signer = await plebbit.createSigner()
  const author = {
    displayName: null,
    address: signer.address,
  }

  const accountName = await getNextAvailableDefaultAccountName()
  const account = {
    id: uuid(),
    name: accountName,
    author,
    signer,
    plebbit: plebbit,
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
