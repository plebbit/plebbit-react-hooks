import {useEffect, useState} from 'react'
import {useAccount} from './accounts'
import validator from '../lib/validator'
import Debug from 'debug'
const debug = Debug('plebbit-react-hooks:hooks:authors')
import assert from 'assert'
import {Nft, BlockchainProviders, Author} from '../types'
import {ethers} from 'ethers'

/**
 * @param author - The Author object to resolve the avatar image URL of.
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
// NOTE: useAuthorAvatarImageUrl tests are skipped, if changes are made they must be tested manually
export function useAuthorAvatarImageUrl(author?: Author, accountName?: string) {
  const verified = useVerifiedAuthorAvatarSignature(author, accountName)
  // don't try to get avatar image url at all if signature isn't verified
  const avatar = verified ? author?.avatar : undefined
  const nftImageUrl = useNftImageUrl(avatar, accountName)
  debug('useAuthorAvatarImageUrl', {author, verified, nftImageUrl})
  return nftImageUrl
}

/**
 * @param nft - The NFT object to resolve the image URL of.
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
// NOTE: useNftImageUrl tests are skipped, if changes are made they must be tested manually
export function useNftImageUrl(nft?: Nft, accountName?: string) {
  const account = useAccount(accountName)
  // possible to use account.plebbit instead of account.plebbitOptions
  const ipfsGatewayUrl = account?.plebbitOptions?.ipfsGatewayUrl
  const blockchainProviders = account?.plebbitOptions?.blockchainProviders
  const [nftImageUrl, setNftImageUrl] = useState()

  useEffect(() => {
    if (!account || !nft) {
      return
    }
    ;(async () => {
      try {
        const url = await getNftImageUrl(nft, ipfsGatewayUrl, blockchainProviders)
        setNftImageUrl(url)
      } catch (error) {
        debug('useNftImageUrl getNftImageUrl error', {nft, ipfsGatewayUrl, blockchainProviders, error})
      }
    })()
  }, [nft?.chainTicker, nft?.address, nft?.id, ipfsGatewayUrl, blockchainProviders])

  debug('useNftImageUrl', {nft, ipfsGatewayUrl, nftImageUrl, blockchainProviders})
  return nftImageUrl
}

// NOTE: useVerifiedAuthorAvatarSignature tests are skipped, if changes are made they must be tested manually
export function useVerifiedAuthorAvatarSignature(author?: Author, accountName?: string) {
  const account = useAccount(accountName)
  // possible to use account.plebbit instead of account.plebbitOptions
  const blockchainProviders = account?.plebbitOptions?.blockchainProviders
  const [verified, setVerified] = useState<boolean>()

  useEffect(() => {
    if (!account || !author?.avatar) {
      return
    }
    ;(async () => {
      try {
        const res = await verifyAuthorAvatarSignature(author.avatar, author.address, blockchainProviders)
        setVerified(res)
      } catch (error) {
        debug('useVerifiedAuthorAvatarSignature verifyAuthorAvatarSignature error', {author, blockchainProviders, error})
      }
    })()
  }, [author?.avatar, author?.address, blockchainProviders])

  // don't verify nft signature when using mock content during development
  if (process.env.REACT_APP_PLEBBIT_REACT_HOOKS_MOCK_CONTENT) {
    return true
  }

  debug('useVerifiedAuthorAvatarSignature', {author, verified, blockchainProviders})
  return verified
}

// NOTE: verifyAuthorAvatarSignature tests are skipped, if changes are made they must be tested manually
const verifyAuthorAvatarSignaturePendingPromises: any = {}
const verifyAuthorAvatarSignatureCache: any = {}
export const verifyAuthorAvatarSignature = async (nft: Nft, authorAddress: string, blockchainProviders: BlockchainProviders) => {
  assert(nft.address, `verifyAuthorAvatarSignature invalid nft.address '${nft.address}'`)
  assert(nft.id, `verifyAuthorAvatarSignature invalid nft.tokenAddress '${nft.id}'`)
  assert(nft.signature, `verifyAuthorAvatarSignature invalid nft.signature '${nft.signature}'`)
  assert(authorAddress, `verifyAuthorAvatarSignature invalid authorAddress '${authorAddress}'`)

  // cache the result
  const cacheKey = JSON.stringify({nft, authorAddress, blockchainProviders})
  if (typeof verifyAuthorAvatarSignatureCache[cacheKey] === 'boolean') {
    return verifyAuthorAvatarSignatureCache[cacheKey]
  }

  // will throw if no matching provider
  const blockchainProvider = getBlockchainProvider(nft.chainTicker, blockchainProviders)
  const nftContract = new ethers.Contract(nft.address, nftAbi, blockchainProvider)

  // don't request the same url twice if fetching is pending
  if (verifyAuthorAvatarSignaturePendingPromises[cacheKey]) {
    return verifyAuthorAvatarSignaturePendingPromises[cacheKey]
  }
  let resolve
  let verifyAuthorAvatarSignaturePromise = new Promise((_resolve) => {
    resolve = _resolve
  })
  verifyAuthorAvatarSignaturePendingPromises[cacheKey] = verifyAuthorAvatarSignaturePromise

  // get the owner of the nft at nft.id
  const currentNftOwnerAddress = await nftContract.ownerOf(nft.id)
  let messageThatShouldBeSigned: any = {}
  // the property names must be in this order for the signature to match
  // insert props one at a time otherwise babel/webpack will reorder
  messageThatShouldBeSigned.domainSeparator = 'plebbit-author-avatar'
  messageThatShouldBeSigned.tokenAddress = nft.address
  messageThatShouldBeSigned.tokenId = nft.id
  messageThatShouldBeSigned.authorAddress = authorAddress
  messageThatShouldBeSigned = JSON.stringify(messageThatShouldBeSigned)

  const signatureAddress = ethers.utils.verifyMessage(messageThatShouldBeSigned, nft.signature)
  let verified = true
  if (currentNftOwnerAddress !== signatureAddress) {
    verified = false
  }

  verifyAuthorAvatarSignatureCache[cacheKey] = verified
  // @ts-ignore
  resolve(verified)
  return verified
}

// NOTE: getNftImageUrl tests are skipped, if changes are made they must be tested manually
const nftImageUrlPendingPromises: any = {}
const nftImageUrlCache: any = {}
export const getNftImageUrl = async (nft: Nft, ipfsGatewayUrl: string, blockchainProviders: BlockchainProviders) => {
  assert(blockchainProviders && typeof blockchainProviders === 'object', `invalid blockchainProviders '${blockchainProviders}'`)
  assert(ipfsGatewayUrl && typeof ipfsGatewayUrl === 'string', `invalid ipfsGatewayUrl '${ipfsGatewayUrl}'`)

  // cache the result
  const cacheKey = JSON.stringify({nft, ipfsGatewayUrl, blockchainProviders})
  if (nftImageUrlCache[cacheKey]) {
    return nftImageUrlCache[cacheKey]
  }

  // will throw if no matching provider
  const blockchainProvider = getBlockchainProvider(nft.chainTicker, blockchainProviders)

  // don't request the same url twice if fetching is pending
  if (nftImageUrlPendingPromises[cacheKey]) {
    return nftImageUrlPendingPromises[cacheKey]
  }
  let resolve
  let getNftImageUrlPromise = new Promise((_resolve) => {
    resolve = _resolve
  })
  nftImageUrlPendingPromises[cacheKey] = getNftImageUrlPromise

  const nftContract = new ethers.Contract(nft.address, nftAbi, blockchainProvider)
  let nftUrl = await nftContract.tokenURI(nft.id)

  // if the ipfs nft is json, get the image url using the ipfs gateway in account settings
  if (nftUrl.startsWith('ipfs://')) {
    nftUrl = `${ipfsGatewayUrl}/${nftUrl.replace('://', '/')}`
  }

  // if the ipfs file is json, it probably has an 'image' property
  try {
    const json = await fetch(nftUrl).then((resp) => resp.json())
    nftUrl = json.image

    // if the image property is an ipfs url, get the image url using the ipfs gateway in account settings
    if (nftUrl.startsWith('ipfs://')) {
      nftUrl = `${ipfsGatewayUrl}/${nftUrl.replace('://', '/')}`
    }
  } catch (e) {}

  nftImageUrlCache[cacheKey] = nftUrl
  // @ts-ignore
  resolve(nftUrl)
  return nftUrl
}

/**
 * @param authorAddress - The author address to resolve to a public key, e.g. 'john.eth' resolves to 'Qm...'.
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
// NOTE: useResolvedAuthorAddress tests are skipped, if changes are made they must be tested manually
export function useResolvedAuthorAddress(authorAddress?: string, accountName?: string) {
  const account = useAccount(accountName)
  // possible to use account.plebbit instead of account.plebbitOptions
  const blockchainProviders = account?.plebbitOptions?.blockchainProviders
  const [resolvedAuthorAddress, setResolvedAuthorAddress] = useState<string>()

  useEffect(() => {
    // only support resolving '.eth' for now
    if (!authorAddress?.endsWith('.eth')) {
      return
    }
    if (!account || !authorAddress) {
      return
    }
    ;(async () => {
      try {
        const res = await resolveAuthorAddress(authorAddress, blockchainProviders)
        setResolvedAuthorAddress(res)
      } catch (error) {
        debug('useResolvedAuthorAddress resolveAuthorAddress error', {authorAddress, blockchainProviders, error})
      }
    })()
  }, [authorAddress, blockchainProviders])

  debug('useResolvedAuthorAddress', {authorAddress, resolvedAuthorAddress, blockchainProviders})
  return resolvedAuthorAddress
}

// NOTE: resolveAuthorAddress tests are skipped, if changes are made they must be tested manually
const resolveAuthorAddressPendingPromises: any = {}
const resolveAuthorAddressCache: any = {}
export const resolveAuthorAddress = async (authorAddress: string, blockchainProviders: BlockchainProviders) => {
  // cache the result
  const cacheKey = JSON.stringify({authorAddress, blockchainProviders})
  if (resolveAuthorAddressCache[cacheKey]) {
    return resolveAuthorAddressCache[cacheKey]
  }

  // don't request the same url twice if fetching is pending
  if (resolveAuthorAddressPendingPromises[cacheKey]) {
    return resolveAuthorAddressPendingPromises[cacheKey]
  }
  let resolve
  let resolveAuthorAddressPromise = new Promise((_resolve) => {
    resolve = _resolve
  })
  resolveAuthorAddressPendingPromises[cacheKey] = resolveAuthorAddressPromise

  let resolvedAuthorAddress
  if (authorAddress.endsWith('.eth')) {
    resolvedAuthorAddress = await resolveEnsTxtRecord(authorAddress, 'plebbit-author-address', blockchainProviders)
  } else {
    throw Error(`resolveAuthorAddress invalid authorAddress '${authorAddress}'`)
  }

  resolveAuthorAddressCache[cacheKey] = resolvedAuthorAddress
  // @ts-ignore
  resolve(resolvedAuthorAddress)
  return resolvedAuthorAddress
}

const resolveEnsTxtRecord = async (ensName: string, txtRecordName: string, blockchainProviders: BlockchainProviders) => {
  const blockchainProvider = getBlockchainProvider('eth', blockchainProviders)
  const resolver = await blockchainProvider.getResolver(ensName)
  const txtRecordResult = await resolver.getText(txtRecordName)
  return txtRecordResult
}

// cache the blockchain providers because only 1 should be running at the same time
const cachedBlockchainProviders: any = {}
const getBlockchainProvider = (chainTicker: string, blockchainProviders: BlockchainProviders) => {
  assert(chainTicker && typeof chainTicker === 'string', `invalid chainTicker '${chainTicker}'`)
  assert(blockchainProviders && typeof blockchainProviders === 'object', `invalid blockchainProviders '${blockchainProviders}'`)
  if (cachedBlockchainProviders[chainTicker]) {
    return cachedBlockchainProviders[chainTicker]
  }
  if (chainTicker === 'eth') {
    // if using eth, use ethers' default provider unless another provider is specified
    if (!blockchainProviders['eth'] || blockchainProviders['eth']?.url?.match(/DefaultProvider/i)) {
      cachedBlockchainProviders['eth'] = ethers.getDefaultProvider()
      return cachedBlockchainProviders['eth']
    }
  }
  if (blockchainProviders[chainTicker]) {
    // @ts-ignore
    cachedBlockchainProviders[chainTicker] = new ethers.providers.JsonRpcProvider({url: blockchainProviders[chainTicker].url}, blockchainProviders[chainTicker].chainId)
    return cachedBlockchainProviders[chainTicker]
  }
  throw Error(`no blockchain provider options set for chain ticker '${chainTicker}'`)
}

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
