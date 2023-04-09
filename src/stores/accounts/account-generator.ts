import PlebbitJs from '../../lib/plebbit-js'
import validator from '../../lib/validator'
import {v4 as uuid} from 'uuid'
import accountsDatabase from './accounts-database'
import {Accounts, AccountSubplebbit, ChainProviders} from '../../types'

// default chain providers
const chainProviders: ChainProviders = {
  eth: {
    // default should not use a url, but rather ethers' default provider
    urls: ['ethers.getDefaultProvider()'],
    chainId: 1,
  },
  avax: {
    urls: ['https://api.avax.network/ext/bc/C/rpc'],
    chainId: 43114,
  },
  matic: {
    urls: ['https://polygon-rpc.com'],
    chainId: 137,
  },
}

// default options aren't saved to database so they can be changed
export const getDefaultPlebbitOptions = () => {
  // default plebbit options defined by the electron process
  // @ts-ignore
  if (window.defaultPlebbitOptions) {
    // add missing chain providers
    // @ts-ignore
    const defaultPlebbitOptions: any = JSON.parse(JSON.stringify(window.defaultPlebbitOptions))

    if (!defaultPlebbitOptions.chainProviders) {
      defaultPlebbitOptions.chainProviders = {}
    }
    // add default chain providers if missing
    for (const chainTicker in chainProviders) {
      if (!defaultPlebbitOptions.chainProviders[chainTicker]) {
        defaultPlebbitOptions.chainProviders[chainTicker] = chainProviders[chainTicker]
      }
    }
    return defaultPlebbitOptions
  }
  // default plebbit options for web client
  return {
    ipfsGatewayUrls: ['https://ipfs.io', 'https://cloudflare-ipfs.com'],
    ipfsHttpClientsOptions: undefined,
    pubsubHttpClientsOptions: ['https://pubsubprovider.xyz/api/v0'],
    chainProviders,
  }
}

export const generateDefaultAccount = async () => {
  const plebbitOptions = getDefaultPlebbitOptions()
  const plebbit = await PlebbitJs.Plebbit(plebbitOptions)
  // handle errors or error events are uncaught
  // no need to log them because plebbit-js already logs them
  plebbit.on('error', () => {})

  const signer = await plebbit.createSigner()
  const author = {
    address: signer.address,
  }

  const accountName = await getNextAvailableDefaultAccountName()

  // subplebbits where the account has a role, like moderator, admin, owner, etc.
  const subplebbits: {[subplebbitAddress: string]: AccountSubplebbit} = {}

  const account = {
    id: uuid(),
    name: accountName,
    author,
    signer,
    plebbitOptions,
    plebbit: plebbit,
    subscriptions: [],
    blockedAddresses: {},
    blockedCids: {},
    subplebbits,
  }
  return account
}

const getNextAvailableDefaultAccountName = async () => {
  const accountIds: string[] | null = await accountsDatabase.accountsMetadataDatabase.getItem('accountIds')
  const accountNames = []
  if (accountIds?.length) {
    const accounts: Accounts | null = await accountsDatabase.getAccounts(accountIds)
    for (const accountId of accountIds) {
      accountNames.push(accounts[accountId].name)
    }
  }
  let accountNumber = 1
  if (!accountNames?.length) {
    return `Account ${accountNumber}`
  }
  validator.validateAccountsDatabaseAccountNames(accountNames)

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
  getDefaultPlebbitOptions,
}

export default accountGenerator
