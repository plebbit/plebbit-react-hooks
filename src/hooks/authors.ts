import {useEffect, useState, useMemo} from 'react'
import {useInterval} from './utils/use-interval'
import {useAccount} from './accounts'
import validator from '../lib/validator'
import Logger from '@plebbit/plebbit-logger'
const log = Logger('plebbit-react-hooks:authors:hooks')
import assert from 'assert'
import {Nft, BlockchainProviders, Author, UseAuthorAvatarOptions, UseAuthorAvatarResult, UseResolvedAuthorAddressOptions, UseResolvedAuthorAddressResult} from '../types'
import {ethers} from 'ethers'
import {getNftMetadataUrl, getNftImageUrl, getNftOwner, resolveEnsTxtRecord, resolveEnsTxtRecordNoCache} from '../lib/blockchain'

/**
 * @param author - The Author object to resolve the avatar image URL of.
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
// NOTE: useAuthorAvatar tests are skipped, if changes are made they must be tested manually
export function useAuthorAvatar(options?: UseAuthorAvatarOptions): UseAuthorAvatarResult {
  const {author, accountName} = options || {}
  const account = useAccount({accountName})

  // TODO: resolve crypto domain and check if one of the record is a profile pic

  const {verified, error: signatureError} = useVerifiedAuthorAvatarSignature(author, accountName)
  const verifiedError = verified === false && Error(`nft ownership signature proof invalid`)
  const isWhitelisted = useAuthorAvatarIsWhitelisted(author?.avatar)
  const whitelistedError = isWhitelisted === false && Error(`nft collection '${author?.avatar?.address}' not whitelisted`)
  // don't try to get avatar image url at all if signature isn't verified and whitelisted
  const avatar = verified && isWhitelisted ? author?.avatar : undefined
  const {metadataUrl, error: nftMetadataError} = useNftMetadataUrl(avatar, accountName)
  const {imageUrl, error: nftImageUrlError} = useNftImageUrl(metadataUrl, accountName)
  const chainProvider = account?.plebbitOptions?.blockchainProviders?.[avatar?.chainTicker]

  const error = whitelistedError || verifiedError || signatureError || nftMetadataError || nftImageUrlError || undefined
  const errors = useMemo(() => (error ? [error] : []), [error])

  let state = 'initializing'
  if (!author?.avatar) {
    // do nothing, is initializing
  } else if (error) {
    state = 'failed'
  } else if (imageUrl !== undefined) {
    state = 'succeeded'
  } else if (metadataUrl !== undefined) {
    state = 'fetching-metadata'
  } else if (verified !== undefined) {
    state = 'fetching-uri'
  } else if (author?.avatar) {
    state = 'fetching-owner'
  }

  if (author?.avatar) {
    log('useAuthorAvatar', {author, state, verified, isWhitelisted, metadataUrl, imageUrl})
  }

  return useMemo(
    () => ({
      imageUrl,
      metadataUrl,
      chainProvider,
      state,
      error,
      errors,
    }),
    [imageUrl, metadataUrl, chainProvider, state, error]
  )
}

/**
 * @param nft - The NFT object to resolve the URL of.
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
// NOTE: useNftMetadataUrl tests are skipped, if changes are made they must be tested manually
export function useNftMetadataUrl(nft?: Nft, accountName?: string) {
  const account = useAccount({accountName})
  // possible to use account.plebbit instead of account.plebbitOptions
  const ipfsGatewayUrl = account?.plebbitOptions?.ipfsGatewayUrl
  const blockchainProviders = account?.plebbitOptions?.blockchainProviders
  const [nftMetadataUrl, setNftMetadataUrl] = useState()
  const [error, setError] = useState<Error | undefined>()

  const getNftMetadataUrlArgs = [
    nft?.address,
    nft?.id,
    nft?.chainTicker,
    blockchainProviders?.[nft?.chainTicker]?.url,
    blockchainProviders?.[nft?.chainTicker]?.chainId,
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
        log.error('useNftMetadataUrl getNftMetadataUrl error', {nft, ipfsGatewayUrl, blockchainProviders, error})
      }
    })()
  }, getNftMetadataUrlArgs)

  log('useNftMetadataUrl', {nft, ipfsGatewayUrl, nftMetadataUrl, blockchainProviders})
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
  const ipfsGatewayUrl = account?.plebbitOptions?.ipfsGatewayUrl
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
  const blockchainProviders = account?.plebbitOptions?.blockchainProviders
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
        const res = await verifyAuthorAvatarSignature(author.avatar, author.address, blockchainProviders)
        setVerified(res)
      } catch (error: any) {
        setError(error)
        log.error('useVerifiedAuthorAvatarSignature verifyAuthorAvatarSignature error', {author, blockchainProviders, error})
      }
    })()
  }, [author?.avatar, author?.address, blockchainProviders])

  // don't verify nft signature when using mock content during development
  if (process.env.REACT_APP_PLEBBIT_REACT_HOOKS_MOCK_CONTENT) {
    return {verified: true, error: undefined}
  }

  // log('useVerifiedAuthorAvatarSignature', {author, verified, blockchainProviders})
  return {verified, error}
}

const whitelistedTokenAddresses: any = {
  // xpleb nfts
  '0x890a2e81836e0e76e0f49995e6b51ca6ce6f39ed': true,
  // plebsquat
  '0x52e6cd20f5fca56da5a0e489574c92af118b8188': true,
  // random nfts contracts used in mock content and tests
  '0xed5af388653567af2f388e6224dc7c4b3241c544': true,
  '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d': true,
  '0x60e4d786628fea6478f785a6d7e704777c86a7c6': true,
  '0x79fcdef22feed20eddacbb2587640e45491b757f': true,
  '0xf6d8e606c862143556b342149a7fe0558c220375': true,
}
// make sure lower case version exists
for (const i in whitelistedTokenAddresses) {
  whitelistedTokenAddresses[i.toLowerCase()] = whitelistedTokenAddresses[i]
}

function useAuthorAvatarIsWhitelisted(nft?: Nft) {
  // TODO: make a list that a dao can vote it, get the list from plebbit.getDefaults()
  // TODO: make subplebbit owners able to whitelist their own nfts in their subplebbits
  // TODO: make each user able to whitelist/blacklist any nft they want for their own client
  // TODO: make hook to list which default nfts are whitelisted to display to the user

  const isWhitelisted = nft?.address && Boolean(whitelistedTokenAddresses[nft?.address?.toLowerCase()])
  return isWhitelisted
}

// NOTE: verifyAuthorAvatarSignature tests are skipped, if changes are made they must be tested manually
export const verifyAuthorAvatarSignature = async (nft: Nft, authorAddress: string, blockchainProviders: BlockchainProviders) => {
  assert(nft && typeof nft === 'object', `verifyAuthorAvatarSignature invalid nft argument '${nft}'`)
  assert(nft?.address, `verifyAuthorAvatarSignature invalid nft.address '${nft?.address}'`)
  assert(nft?.id, `verifyAuthorAvatarSignature invalid nft.tokenAddress '${nft?.id}'`)
  assert(nft?.signature, `verifyAuthorAvatarSignature invalid nft.signature '${nft?.signature}'`)
  assert(nft?.signature?.signature, `verifyAuthorAvatarSignature invalid nft.signature.signature '${nft?.signature?.signature}'`)
  assert(authorAddress, `verifyAuthorAvatarSignature invalid authorAddress '${authorAddress}'`)

  // get the owner of the nft at nft.id
  const currentNftOwnerAddress = await getNftOwner(
    nft?.address,
    nft?.id,
    nft?.chainTicker,
    blockchainProviders?.[nft?.chainTicker]?.url,
    blockchainProviders?.[nft?.chainTicker]?.chainId
  )

  let messageThatShouldBeSigned: any = {}
  // the property names must be in this order for the signature to match
  // insert props one at a time otherwise babel/webpack will reorder
  messageThatShouldBeSigned.domainSeparator = 'plebbit-author-avatar'
  messageThatShouldBeSigned.tokenAddress = nft.address
  messageThatShouldBeSigned.tokenId = String(nft.id) // must be string type, not number
  messageThatShouldBeSigned.authorAddress = authorAddress
  messageThatShouldBeSigned = JSON.stringify(messageThatShouldBeSigned)

  const signatureAddress = ethers.utils.verifyMessage(messageThatShouldBeSigned, nft.signature.signature)

  let verified = true
  if (currentNftOwnerAddress !== signatureAddress) {
    verified = false
  }
  return verified
}

/**
 * @param author - The author address to resolve to a public key, e.g. 'john.eth' resolves to 'Qm...'.
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
// NOTE: useResolvedAuthorAddress tests are skipped, if changes are made they must be tested manually
export function useResolvedAuthorAddress(options?: UseResolvedAuthorAddressOptions): UseResolvedAuthorAddressResult {
  let {author, accountName, cache} = options || {}

  // cache by default
  if (cache === undefined) {
    cache = true
  }

  // poll every 15 seconds, about the duration of an eth block
  let interval = 15000
  // no point in polling often if caching is on
  if (cache) {
    interval = 1000 * 60 * 60 * 25
  }

  const account = useAccount({accountName})
  // possible to use account.plebbit instead of account.plebbitOptions
  const blockchainProviders = account?.plebbitOptions?.blockchainProviders
  const [resolvedAddress, setResolvedAddress] = useState<string>()
  const [errors, setErrors] = useState<Error[]>([])
  const [state, setState] = useState<string>()

  let initialState = 'initializing'
  // before those defined, nothing can happen
  if (options && account && author?.address) {
    initialState = 'ready'
  }

  useInterval(
    () => {
      // no options, do nothing or reset
      if (!account || !author?.address) {
        if (resolvedAddress !== undefined) {
          setResolvedAddress(undefined)
        }
        if (state !== undefined) {
          setState(undefined)
        }
        if (errors.length) {
          setErrors([])
        }
        return
      }

      // address isn't a crypto domain, can't be resolved
      if (!author?.address.includes('.')) {
        if (state !== 'failed') {
          setErrors([Error('not a crypto domain')])
          setState('failed')
          setResolvedAddress(undefined)
        }
        return
      }

      // only support resolving '.eth' for now
      if (!author?.address?.endsWith('.eth')) {
        if (state !== 'failed') {
          setErrors([Error('crypto domain type unsupported')])
          setState('failed')
          setResolvedAddress(undefined)
        }
        return
      }

      ;(async () => {
        try {
          setState('resolving')
          const res = await resolveAuthorAddress(author?.address, blockchainProviders, cache)
          setState('succeeded')

          // TODO: check if resolved address is the same as author.signer.publicKey

          if (res !== resolvedAddress) {
            setResolvedAddress(res)
          }
        } catch (error: any) {
          setErrors([...errors, error])
          setState('failed')
          setResolvedAddress(undefined)
          log.error('useResolvedAuthorAddress resolveAuthorAddress error', {author, blockchainProviders, error})
        }
      })()
    },
    interval,
    true,
    [author?.address, blockchainProviders]
  )

  // log('useResolvedAuthorAddress', {author, state, errors, resolvedAddress, blockchainProviders})

  // only support ENS at the moment
  const chainProvider = blockchainProviders?.['eth']

  return useMemo(
    () => ({
      resolvedAddress,
      chainProvider,
      state: state || initialState,
      error: errors[errors.length - 1],
      errors,
    }),
    [resolvedAddress, chainProvider, state, errors]
  )
}

// NOTE: resolveAuthorAddress tests are skipped, if changes are made they must be tested manually
export const resolveAuthorAddress = async (authorAddress: string, blockchainProviders: BlockchainProviders, cache?: boolean) => {
  let resolvedAuthorAddress
  if (authorAddress.endsWith('.eth')) {
    const resolve = cache ? resolveEnsTxtRecord : resolveEnsTxtRecordNoCache
    resolvedAuthorAddress = await resolve(authorAddress, 'plebbit-author-address', 'eth', blockchainProviders?.['eth']?.url, blockchainProviders?.['eth']?.chainId)
  } else {
    throw Error(`resolveAuthorAddress invalid authorAddress '${authorAddress}'`)
  }
  return resolvedAuthorAddress
}
