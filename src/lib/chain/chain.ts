import assert from 'assert'
import {Nft, ChainProviders} from '../../types'
import {ethers} from 'ethers'
import fetch from 'node-fetch'
import utils from '../utils'

// NOTE: getNftImageUrl tests are skipped, if changes are made they must be tested manually
const getNftImageUrlNoCache = async (nftMetadataUrl: string, ipfsGatewayUrl: string) => {
  assert(nftMetadataUrl && typeof nftMetadataUrl === 'string', `getNftImageUrl invalid nftMetadataUrl '${nftMetadataUrl}'`)
  assert(ipfsGatewayUrl && typeof ipfsGatewayUrl === 'string', `getNftImageUrl invalid ipfsGatewayUrl '${ipfsGatewayUrl}'`)

  let nftImageUrl

  // if the ipfs file is json, it probably has an 'image' property
  const text = await fetch(nftMetadataUrl).then((resp) => resp.text())
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
  const txtRecordResult = await resolver.getText(txtRecordName)
  return txtRecordResult
}
export const resolveEnsTxtRecord = utils.memo(resolveEnsTxtRecordNoCache, {maxSize: 10000, maxAge: 1000 * 60 * 60 * 24})

// cache the chain providers because only 1 should be running at the same time
const getChainProviderNoCache = (chainTicker: string, chainProviderUrl?: string, chainId?: number) => {
  if (chainTicker === 'eth') {
    // if using eth, use ethers' default provider unless another provider is specified
    if (!chainProviderUrl || chainProviderUrl.match(/DefaultProvider/i)) {
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

export default {
  getNftOwner,
  getNftMetadataUrl,
  getNftImageUrl,
  resolveEnsTxtRecord,
}
