import PlebbitJs from '../../lib/plebbit-js'
import validator from '../../lib/validator'
import chain from '../../lib/chain'
import {v4 as uuid} from 'uuid'
import accountsDatabase from './accounts-database'
import {Accounts, AccountSubplebbit, ChainProviders} from '../../types'
import Logger from '@plebbit/plebbit-logger'
const log = Logger('plebbit-react-hooks:accounts:stores')

// default chain providers
const chainProviders: ChainProviders = {
  eth: {
    // default should not use a url, but rather ethers' default provider
    urls: ['ethers.js', 'https://ethrpc.xyz', 'viem'],
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
  sol: {
    urls: ['https://solrpc.xyz'],
    chainId: 1,
  },
}

// force using these options or can cause bugs
export const overwritePlebbitOptions = {
  resolveAuthorAddresses: false,
  validatePages: false,
}

// default options aren't saved to database so they can be changed
export const getDefaultPlebbitOptions = () => {
  // default plebbit options defined by the electron process
  // @ts-ignore
  if (window.defaultPlebbitOptions) {
    // @ts-ignore
    const defaultPlebbitOptions: any = JSON.parse(JSON.stringify({...window.defaultPlebbitOptions, libp2pJsClientsOptions: undefined}))
    // @ts-ignore
    defaultPlebbitOptions.libp2pJsClientsOptions = window.defaultPlebbitOptions.libp2pJsClientsOptions // libp2pJsClientsOptions is not always just json

    // add missing chain providers
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
    ipfsGatewayUrls: ['https://ipfsgateway.xyz', 'https://gateway.plebpubsub.xyz', 'https://gateway.forumindex.com'],
    kuboRpcClientsOptions: undefined,
    pubsubKuboRpcClientsOptions: ['https://pubsubprovider.xyz/api/v0', 'https://plebpubsub.xyz/api/v0', 'https://rannithepleb.com/api/v0'],
    httpRoutersOptions: ['https://routing.lol', 'https://peers.pleb.bot', 'https://peers.plebpubsub.xyz', 'https://peers.forumindex.com'],
    chainProviders,
    ...overwritePlebbitOptions,
  }
}

// the gateway to use in <img src> for nft avatars
// @ts-ignore
export const defaultMediaIpfsGatewayUrl = window.defaultMediaIpfsGatewayUrl || 'https://ipfs.io'

export const generateDefaultAccount = async () => {
  const plebbitOptions = getDefaultPlebbitOptions()
  const plebbit = await PlebbitJs.Plebbit(plebbitOptions)
  // handle errors or error events are uncaught
  // no need to log them because plebbit-js already logs them
  plebbit.on('error', (error: any) => log.error('uncaught plebbit instance error, should never happen', {error}))

  const signer = await plebbit.createSigner()
  const author = {
    address: signer.address,
    wallets: {
      eth: await chain.getEthWalletFromPlebbitPrivateKey(signer.privateKey, signer.address),
      sol: await chain.getSolWalletFromPlebbitPrivateKey(signer.privateKey, signer.address),
    },
  }

  const accountName = await getNextAvailableDefaultAccountName()

  // subplebbits where the account has a role, like moderator, admin, owner, etc.
  const subplebbits: {[subplebbitAddress: string]: AccountSubplebbit} = {}

  const account = {
    id: uuid(),
    version: accountsDatabase.accountVersion,
    name: accountName,
    author,
    signer,
    plebbitOptions,
    plebbit: plebbit,
    subscriptions: [],
    blockedAddresses: {},
    blockedCids: {},
    subplebbits,
    mediaIpfsGatewayUrl: defaultMediaIpfsGatewayUrl,
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
