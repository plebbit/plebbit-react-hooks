import assert from 'assert'
import {Nft, ChainProviders, Wallet} from '../../types'
import {ethers} from 'ethers'
import utils from '../utils'

// NOTE: getNftImageUrl tests are skipped, if changes are made they must be tested manually
const getNftImageUrlNoCache = async (nftMetadataUrl: string, ipfsGatewayUrl: string) => {
  assert(nftMetadataUrl && typeof nftMetadataUrl === 'string', `getNftImageUrl invalid nftMetadataUrl '${nftMetadataUrl}'`)
  assert(ipfsGatewayUrl && typeof ipfsGatewayUrl === 'string', `getNftImageUrl invalid ipfsGatewayUrl '${ipfsGatewayUrl}'`)

  let nftImageUrl

  // if the ipfs file is json, it probably has an 'image' property
  const text = await fetch(nftMetadataUrl).then((resp: any) => resp.text())
  try {
    nftImageUrl = JSON.parse(text).image
  } catch (e) {
    // dont throw the json parse error, instead throw the http response
    throw Error(text)
  }

  // if the image property is an ipfs url, get the image url using the ipfs gateway in account settings
  if (nftImageUrl.startsWith('ipfs://')) {
    nftImageUrl = `${ipfsGatewayUrl}/${nftImageUrl.replace('://', '/')}`
  }

  return nftImageUrl
}
export const getNftImageUrl = utils.memo(getNftImageUrlNoCache, {maxSize: 5000})

// NOTE: getNftMetadataUrl tests are skipped, if changes are made they must be tested manually
// don't use objects in arguments for faster caching
const getNftMetadataUrlNoCache = async (nftAddress: string, nftId: string, chainTicker: string, chainProviderUrl: string, chainId: number, ipfsGatewayUrl: string) => {
  assert(nftAddress && typeof nftAddress === 'string', `getNftMetadataUrl invalid nftAddress '${nftAddress}'`)
  assert(nftId && typeof nftId === 'string', `getNftMetadataUrl invalid nftId '${nftId}'`)
  assert(chainTicker && typeof chainTicker === 'string', `getNftMetadataUrl invalid chainTicker '${chainTicker}'`)
  assert(chainProviderUrl && typeof chainProviderUrl === 'string', `getNftMetadataUrl invalid chainProviderUrl '${chainProviderUrl}'`)
  assert(typeof chainId === 'number', `getNftMetadataUrl invalid chainId '${chainId}' not a number`)
  assert(ipfsGatewayUrl && typeof ipfsGatewayUrl === 'string', `getNftMetadataUrl invalid ipfsGatewayUrl '${ipfsGatewayUrl}'`)

  const chainProvider = getChainProvider(chainTicker, chainProviderUrl, chainId)
  const nftContract = new ethers.Contract(nftAddress, nftAbi, chainProvider)
  let nftMetadataUrl = await nftContract.tokenURI(nftId)

  // if the image property is an ipfs url, get the image url using the ipfs gateway in account settings
  if (nftMetadataUrl.startsWith('ipfs://')) {
    nftMetadataUrl = `${ipfsGatewayUrl}/${nftMetadataUrl.replace('://', '/')}`
  }

  return nftMetadataUrl
}
export const getNftMetadataUrl = utils.memo(getNftMetadataUrlNoCache, {maxSize: 5000})

// don't use objects in arguments for faster caching
export const getNftOwnerNoCache = async (nftAddress: string, nftId: string, chainTicker: string, chainProviderUrl: string, chainId: number) => {
  assert(nftAddress && typeof nftAddress === 'string', `getNftOwner invalid nftAddress '${nftAddress}'`)
  assert(nftId && typeof nftId === 'string', `getNftOwner invalid nftId '${nftId}'`)
  assert(chainTicker && typeof chainTicker === 'string', `getNftOwner invalid chainTicker '${chainTicker}'`)
  assert(chainProviderUrl && typeof chainProviderUrl === 'string', `getNftOwner invalid chainProviderUrl '${chainProviderUrl}'`)
  assert(typeof chainId === 'number', `getNftOwner invalid chainId '${chainId}' not a number`)
  const chainProvider = getChainProvider(chainTicker, chainProviderUrl, chainId)
  const nftContract = new ethers.Contract(nftAddress, nftAbi, chainProvider)
  const currentNftOwnerAddress = await nftContract.ownerOf(nftId)
  return currentNftOwnerAddress
}
export const getNftOwner = utils.memo(getNftOwnerNoCache, {maxSize: 5000, maxAge: 1000 * 60 * 60 * 24})

export const resolveEnsTxtRecordNoCache = async (ensName: string, txtRecordName: string, chainTicker: string, chainProviderUrl?: string, chainId?: number) => {
  const chainProvider = getChainProvider(chainTicker, chainProviderUrl, chainId)
  const resolver = await chainProvider.getResolver(ensName)
  if (!resolver) {
    throw Error(`name not registered or network error`)
  }
  const txtRecordResult = await resolver.getText(txtRecordName)
  return txtRecordResult
}
export const resolveEnsTxtRecord = utils.memo(resolveEnsTxtRecordNoCache, {maxSize: 10000, maxAge: 1000 * 60 * 60 * 24})

// cache the chain providers because only 1 should be running at the same time
const getChainProviderNoCache = (chainTicker: string, chainProviderUrl?: string, chainId?: number) => {
  if (chainTicker === 'eth') {
    // if using eth, use ethers' default provider unless another provider is specified
    if (!chainProviderUrl || chainProviderUrl === 'ethers.js') {
      return ethers.getDefaultProvider()
    }
  }
  if (!chainProviderUrl) {
    throw Error(`getChainProvider invalid chainProviderUrl '${chainProviderUrl}'`)
  }
  if (!chainId && chainId !== 0) {
    throw Error(`getChainProvider invalid chainId '${chainId}'`)
  }
  return new ethers.providers.JsonRpcProvider({url: chainProviderUrl}, chainId)
}
const getChainProvider = utils.memoSync(getChainProviderNoCache, {maxSize: 1000})

const nftAbi = [
  {
    inputs: [{internalType: 'uint256', name: 'tokenId', type: 'uint256'}],
    name: 'tokenURI',
    outputs: [{internalType: 'string', name: '', type: 'string'}],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{internalType: 'uint256', name: 'tokenId', type: 'uint256'}],
    name: 'ownerOf',
    outputs: [{internalType: 'address', name: '', type: 'address'}],
    stateMutability: 'view',
    type: 'function',
  },
]

const getWalletMessageToSign = (authorAddress: string, timestamp: number) => {
  let messageToSign: any = {}
  // the property names must be in this order for the signature to match
  // insert props one at a time otherwise babel/webpack will reorder
  messageToSign.domainSeparator = 'plebbit-author-wallet'
  messageToSign.authorAddress = authorAddress
  messageToSign.timestamp = timestamp
  // use plain JSON so the user can read what he's signing
  const messageToSignJson = JSON.stringify(messageToSign)
  return messageToSignJson
}

export const getEthWalletFromPlebbitPrivateKey = async (privateKeyBase64: string, authorAddress: string) => {
  // ignore private key used in plebbit-js signer mock so tests run faster, also make sure nobody uses it
  if (privateKeyBase64 === 'private key') {
    return
  }

  const privateKeyBytes = Uint8Array.from(atob(privateKeyBase64), (c) => c.charCodeAt(0))
  if (privateKeyBytes.length !== 32) {
    throw Error('failed getting eth address from private key not 32 bytes')
  }
  const publicKeyHex = ethers.utils.computePublicKey(privateKeyBytes, false)
  const privateKeyHex = ethers.utils.hexlify(privateKeyBytes)
  const ethAddress = ethers.utils.computeAddress(publicKeyHex)

  // generate signature
  const timestamp = Date.now()
  const signature = await new ethers.Wallet(privateKeyHex).signMessage(getWalletMessageToSign(authorAddress, timestamp))

  return {address: ethAddress, timestamp, signature: {signature, type: 'eip191'}}
}

export const getEthPrivateKeyFromPlebbitPrivateKey = async (privateKeyBase64: string, authorAddress: string) => {
  // ignore private key used in plebbit-js signer mock so tests run faster, also make sure nobody uses it
  if (privateKeyBase64 === 'private key') {
    return
  }

  const privateKeyBytes = Uint8Array.from(atob(privateKeyBase64), (c) => c.charCodeAt(0))
  if (privateKeyBytes.length !== 32) {
    throw Error('failed getting eth address from private key not 32 bytes')
  }
  const privateKeyHex = ethers.utils.hexlify(privateKeyBytes)
  return privateKeyHex
}

import {getPublicKey as ed25519GetPublicKey, sign as ed25519Sign, verify as ed25519Verify} from '@noble/ed25519'
import {toString as uint8ArrayToString, fromString as uint8ArrayFromString} from 'uint8arrays'
export const getSolWalletFromPlebbitPrivateKey = async (privateKeyBase64: string, authorAddress: string) => {
  // ignore private key used in plebbit-js signer mock so tests run faster, also make sure nobody uses it
  if (privateKeyBase64 === 'private key') {
    return
  }

  const privateKeyBytes = Uint8Array.from(atob(privateKeyBase64), (c) => c.charCodeAt(0))
  if (privateKeyBytes.length !== 32) {
    throw Error('failed getting sol address from private key not 32 bytes')
  }
  const publicKeyBytes = await ed25519GetPublicKey(privateKeyBytes)
  const solAddress = uint8ArrayToString(publicKeyBytes, 'base58btc')

  // generate signature (https://solscan.io/verifiedsignatures)
  const timestamp = Date.now()
  const messageBytes = uint8ArrayFromString(getWalletMessageToSign(authorAddress, timestamp), 'utf8')
  const signatureBytes = await ed25519Sign(messageBytes, privateKeyBytes)
  const signatureBase58 = uint8ArrayToString(signatureBytes, 'base58btc')

  return {
    address: solAddress,
    timestamp,
    signature: {
      signature: signatureBase58,
      // solana has no signature standard so just call it 'sol' for now
      // can't use just 'ed25519' because we use it for plebbit signature with base64
      type: 'sol',
    },
  }
}

export const getSolPrivateKeyFromPlebbitPrivateKey = async (privateKeyBase64: string, authorAddress: string) => {
  // ignore private key used in plebbit-js signer mock so tests run faster, also make sure nobody uses it
  if (privateKeyBase64 === 'private key') {
    return
  }

  const privateKeyBytes = Uint8Array.from(atob(privateKeyBase64), (c) => c.charCodeAt(0))
  if (privateKeyBytes.length !== 32) {
    throw Error('failed getting sol address from private key not 32 bytes')
  }
  const publicKeyBytes = await ed25519GetPublicKey(privateKeyBytes)
  const bytes = new Uint8Array(64)
  bytes.set(privateKeyBytes, 0)
  bytes.set(publicKeyBytes, 32)
  const privateKeyBase58 = uint8ArrayToString(bytes, 'base58btc')
  return privateKeyBase58
}

export const validateEthWallet = async (wallet: Wallet, authorAddress: string) => {
  assert(wallet && typeof wallet === 'object', `validateEthWallet invalid wallet argument '${wallet}'`)
  assert(wallet?.address, `validateEthWallet invalid wallet.address '${wallet?.address}'`)
  assert(typeof wallet?.timestamp === 'number', `validateEthWallet invalid wallet.timestamp '${wallet?.timestamp}' not a number`)
  assert(wallet?.signature, `validateEthWallet invalid wallet.signature '${wallet?.signature}'`)
  assert(wallet?.signature?.signature, `validateEthWallet invalid wallet.signature.signature '${wallet?.signature?.signature}'`)
  assert(wallet.signature.type === 'eip191', `validateEthWallet invalid wallet.signature.type '${wallet?.signature?.type}'`)
  assert(authorAddress && typeof authorAddress === 'string', `validateEthWallet invalid authorAddress '${authorAddress}'`)
  const signatureAddress = ethers.utils.verifyMessage(getWalletMessageToSign(authorAddress, wallet.timestamp), wallet.signature.signature)
  if (wallet.address !== signatureAddress) {
    throw Error('wallet address does not equal signature address')
  }
}

export const validateSolWallet = async (wallet: Wallet, authorAddress: string) => {
  assert(wallet && typeof wallet === 'object', `validateSolWallet invalid wallet argument '${wallet}'`)
  assert(wallet?.address, `validateSolWallet invalid wallet.address '${wallet?.address}'`)
  assert(typeof wallet?.timestamp === 'number', `validateSolWallet invalid wallet.timestamp '${wallet?.timestamp}' not a number`)
  assert(wallet?.signature, `validateSolWallet invalid wallet.signature '${wallet?.signature}'`)
  assert(wallet?.signature?.signature, `validateSolWallet invalid wallet.signature.signature '${wallet?.signature?.signature}'`)
  assert(authorAddress && typeof authorAddress === 'string', `validateSolWallet invalid authorAddress '${authorAddress}'`)
  const signatureBytes = uint8ArrayFromString(wallet.signature.signature, 'base58btc')
  const messageBytes = uint8ArrayFromString(getWalletMessageToSign(authorAddress, wallet.timestamp), 'utf8')
  const publicKeyBytes = uint8ArrayFromString(wallet.address, 'base58btc')
  const verified = await ed25519Verify(signatureBytes, messageBytes, publicKeyBytes)
  if (!verified) {
    throw Error('signature invalid')
  }
}

export default {
  getNftOwner,
  getNftMetadataUrl,
  getNftImageUrl,
  resolveEnsTxtRecord,
  getEthWalletFromPlebbitPrivateKey,
  getSolWalletFromPlebbitPrivateKey,
  getEthPrivateKeyFromPlebbitPrivateKey,
  getSolPrivateKeyFromPlebbitPrivateKey,
  validateEthWallet,
  validateSolWallet,
}
