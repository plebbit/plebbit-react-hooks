import {useEffect, useState, useMemo} from 'react'
import {useAccount} from '../accounts'
import Logger from '@plebbit/plebbit-logger'
const log = Logger('plebbit-react-hooks:authors:hooks')
import assert from 'assert'
import {Nft, ChainProviders, Author} from '../../types'
import {ethers} from 'ethers'
import {getNftMetadataUrl, getNftImageUrl, getNftOwner} from '../../lib/chain'
import createStore from 'zustand'

const noMediaIpfsGatewayUrl = 'http://no-media-ipfs-gateway-url'

/**
 * @param nft - The NFT object to resolve the URL of.
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
// NOTE: useNftMetadataUrl tests are skipped, if changes are made they must be tested manually
export function useNftMetadataUrl(nft?: Nft, accountName?: string) {
  const account = useAccount({accountName})
  // possible to use account.plebbit instead of account.plebbitOptions
  const ipfsGatewayUrl = account?.mediaIpfsGatewayUrl || noMediaIpfsGatewayUrl
  const chainProviders = account?.plebbitOptions?.chainProviders
  const [nftMetadataUrl, setNftMetadataUrl] = useState()
  const [error, setError] = useState<Error | undefined>()

  const getNftMetadataUrlArgs = [
    nft?.address,
    nft?.id,
    nft?.chainTicker,
    chainProviders?.[nft?.chainTicker]?.urls?.[0],
    chainProviders?.[nft?.chainTicker]?.chainId,
    ipfsGatewayUrl,
  ]

  useEffect(() => {
    // reset
    setError(undefined)
    setNftMetadataUrl(undefined)

    if (!account || !nft) {
      return
    }

    ;(async () => {
      try {
        const url = await getNftMetadataUrl(...getNftMetadataUrlArgs)
        setNftMetadataUrl(url)
      } catch (error: any) {
        setError(error)
        log.error('useNftMetadataUrl getNftMetadataUrl error', {nft, ipfsGatewayUrl, chainProviders, error})
      }
    })()
  }, getNftMetadataUrlArgs)

  // log('useNftMetadataUrl', {nft, ipfsGatewayUrl, nftMetadataUrl, chainProviders})
  return {metadataUrl: nftMetadataUrl, error}
}

/**
 * @param nftMetadataUrl - The NFT URL to resolve the image URL of.
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
// NOTE: useNftImageUrl tests are skipped, if changes are made they must be tested manually
export function useNftImageUrl(nftMetadataUrl?: string, accountName?: string) {
  assert(!nftMetadataUrl || typeof nftMetadataUrl === 'string', `useNftImageUrl invalid argument nftMetadataUrl '${nftMetadataUrl}' not a string`)
  const account = useAccount({accountName})
  // possible to use account.plebbit instead of account.plebbitOptions
  const ipfsGatewayUrl = account?.mediaIpfsGatewayUrl || noMediaIpfsGatewayUrl
  const [imageUrl, setImageUrl] = useState()
  const [error, setError] = useState<Error | undefined>()

  useEffect(() => {
    // reset
    setError(undefined)
    setImageUrl(undefined)

    if (!account || !nftMetadataUrl) {
      return
    }

    ;(async () => {
      try {
        const url = await getNftImageUrl(nftMetadataUrl, ipfsGatewayUrl)
        setImageUrl(url)
      } catch (error: any) {
        setError(error)
        log.error('useNftImageUrl getNftImageUrl error', {nftMetadataUrl, ipfsGatewayUrl, error})
      }
    })()
  }, [nftMetadataUrl, ipfsGatewayUrl])

  // log('useNftImageUrl', {nftMetadataUrl, ipfsGatewayUrl, imageUrl})
  return {imageUrl, error}
}

// NOTE: useVerifiedAuthorAvatarSignature tests are skipped, if changes are made they must be tested manually
export function useVerifiedAuthorAvatarSignature(author?: Author, accountName?: string) {
  const account = useAccount({accountName})
  // possible to use account.plebbit instead of account.plebbitOptions
  const chainProviders = account?.plebbitOptions?.chainProviders
  const [verified, setVerified] = useState<boolean>()
  const [error, setError] = useState<Error | undefined>()

  useEffect(() => {
    // reset
    setError(undefined)
    setVerified(undefined)

    if (!account || !author?.avatar) {
      return
    }

    ;(async () => {
      try {
        const res = await verifyAuthorAvatarSignature(author.avatar, author.address, chainProviders)
        setVerified(res)
      } catch (error: any) {
        setError(error)
        log.error('useVerifiedAuthorAvatarSignature verifyAuthorAvatarSignature error', {author, chainProviders, error})
      }
    })()
  }, [author?.avatar, author?.address, chainProviders])

  // don't verify nft signature when using mock content during development
  if (process.env.REACT_APP_PLEBBIT_REACT_HOOKS_MOCK_CONTENT) {
    return {verified: true, error: undefined}
  }

  // log('useVerifiedAuthorAvatarSignature', {author, verified, chainProviders})
  return {verified, error}
}

const defaultWhitelistedTokenAddresses = [
  // xpleb nfts
  '0x890a2e81836e0e76e0f49995e6b51ca6ce6f39ed',
  // plebsquat
  '0x52e6cd20f5fca56da5a0e489574c92af118b8188',
]

type AuthorAvatarsWhitelistedTokenAddressesState = {
  authorAvatarsWhitelistedTokenAddresses: {[tokenAddress: string]: boolean}
  setAuthorAvatarsWhitelistedTokenAddresses: (tokenAddresses: string[]) => void
}

const useAuthorAvatarsWhitelistedTokenAddressesStore = createStore<AuthorAvatarsWhitelistedTokenAddressesState>((setState: Function, getState: Function) => ({
  authorAvatarsWhitelistedTokenAddresses: {},
  setAuthorAvatarsWhitelistedTokenAddresses: (tokenAddresses: string[]) => {
    const authorAvatarsWhitelistedTokenAddresses: {[tokenAddress: string]: boolean} = {}
    for (const tokenAddress of tokenAddresses) {
      authorAvatarsWhitelistedTokenAddresses[tokenAddress] = true
      // make sure lower case version exists
      authorAvatarsWhitelistedTokenAddresses[tokenAddress.toLowerCase()] = true
    }
    setState({authorAvatarsWhitelistedTokenAddresses})
  },
}))
export const setAuthorAvatarsWhitelistedTokenAddresses = useAuthorAvatarsWhitelistedTokenAddressesStore.getState().setAuthorAvatarsWhitelistedTokenAddresses
setAuthorAvatarsWhitelistedTokenAddresses(defaultWhitelistedTokenAddresses) // init default

export function useAuthorAvatarIsWhitelisted(nft?: Nft) {
  // TODO: make a list that a dao can vote it, get the list from plebbit.getDefaults()
  // TODO: make subplebbit owners able to whitelist their own nfts in their subplebbits
  // TODO: make each user able to whitelist/blacklist any nft they want for their own client
  // TODO: make hook to list which default nfts are whitelisted to display to the user

  const authorAvatarsWhitelistedTokenAddresses = useAuthorAvatarsWhitelistedTokenAddressesStore(
    (state: AuthorAvatarsWhitelistedTokenAddressesState) => state.authorAvatarsWhitelistedTokenAddresses
  )

  const isWhitelisted = nft?.address && Boolean(authorAvatarsWhitelistedTokenAddresses[nft?.address?.toLowerCase()])
  return isWhitelisted
}

export const getNftMessageToSign = (authorAddress: string, timestamp: number, tokenAddress: string, tokenId: string) => {
  // use plain JSON so the user can read what he's signing
  // property names must always be in this order for signature to match so don't use JSON.stringify
  return `{"domainSeparator":"plebbit-author-avatar","authorAddress":"${authorAddress}","timestamp":${timestamp},"tokenAddress":"${tokenAddress}","tokenId":"${tokenId}"}`
}

// NOTE: verifyAuthorAvatarSignature tests are skipped, if changes are made they must be tested manually
export const verifyAuthorAvatarSignature = async (nft: Nft, authorAddress: string, chainProviders: ChainProviders) => {
  assert(nft && typeof nft === 'object', `verifyAuthorAvatarSignature invalid nft argument '${nft}'`)
  assert(nft?.address, `verifyAuthorAvatarSignature invalid nft.address '${nft?.address}'`)
  assert(nft?.id && typeof nft?.id === 'string', `verifyAuthorAvatarSignature invalid nft.tokenAddress '${nft?.id}' not a string`)
  assert(typeof nft?.timestamp === 'number', `verifyAuthorAvatarSignature invalid nft.timestamp '${nft?.timestamp}' not a number`)
  assert(nft?.signature, `verifyAuthorAvatarSignature invalid nft.signature '${nft?.signature}'`)
  assert(nft?.signature?.signature, `verifyAuthorAvatarSignature invalid nft.signature.signature '${nft?.signature?.signature}'`)
  assert(authorAddress, `verifyAuthorAvatarSignature invalid authorAddress '${authorAddress}'`)

  // get the owner of the nft at nft.id
  const currentNftOwnerAddress = await getNftOwner(
    nft?.address,
    nft?.id,
    nft?.chainTicker,
    chainProviders?.[nft?.chainTicker]?.urls?.[0],
    chainProviders?.[nft?.chainTicker]?.chainId
  )

  const messageThatShouldBeSigned = getNftMessageToSign(authorAddress, nft.timestamp, nft.address, nft.id)
  const signatureAddress = ethers.utils.verifyMessage(messageThatShouldBeSigned, nft.signature.signature)

  let verified = true
  if (currentNftOwnerAddress !== signatureAddress) {
    verified = false
  }
  return verified
}
