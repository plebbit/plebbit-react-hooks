import {useEffect, useState, useMemo} from 'react'
import {useInterval} from '../utils/use-interval'
import {useAccount} from '../accounts'
import Logger from '@plebbit/plebbit-logger'
const log = Logger('plebbit-react-hooks:authors:hooks')
import {
  BlockchainProviders,
  Author,
  UseAuthorOptions,
  UseAuthorResult,
  UseAuthorAvatarOptions,
  UseAuthorAvatarResult,
  UseResolvedAuthorAddressOptions,
  UseResolvedAuthorAddressResult,
} from '../../types'
import {resolveEnsTxtRecord, resolveEnsTxtRecordNoCache} from '../../lib/blockchain'
import {useNftMetadataUrl, useNftImageUrl, useVerifiedAuthorAvatarSignature, useAuthorAvatarIsWhitelisted} from './author-avatars'
import {useComment} from '../comments'

/**
 * @param authorAddress - The address of the author
 * @param commentCid - The last known comment cid of the author (not possible to get an author without providing at least 1 comment cid)
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
// NOTE: useAuthorAvatar tests are skipped, if changes are made they must be tested manually
export function useAuthor(options?: UseAuthorOptions): UseAuthorResult {
  const {authorAddress, commentCid, accountName} = options || {}
  const comment = useComment({commentCid, accountName})

  // the commentCid doesnt have the same author address as authorAddress
  const useAuthorError = useMemo(() => {
    // if comment is loaded and author address is different from authorAddress
    if (comment?.timestamp && authorAddress && comment?.author?.address !== authorAddress) {
      return Error('commentCid author.address is different from authorAddress')
    }
    if (commentCid && !authorAddress) {
      return Error('missing UseAuthorOptions.authorAddress')
    }
    if (!commentCid && authorAddress) {
      return Error('missing UseAuthorOptions.commentCid')
    }
  }, [commentCid, comment?.timestamp, comment?.author?.address, authorAddress])

  // if has author error, don't return the autor
  let author: Author | undefined
  if (!useAuthorError) {
    author = comment?.author
  }

  // merge comment.errors with useAuthorError
  const errors = useMemo(() => {
    if (useAuthorError) {
      return [...comment.errors, useAuthorError]
    }
    return comment.errors
  }, [comment.errors, useAuthorError])

  // if has author error, state failed
  const state = useAuthorError ? 'failed' : comment?.state || 'initializing'

  if (comment?.timestamp) {
    log('useAuthor', {authorAddress, commentCid, accountName, author, comment, useAuthorError, state})
  }

  return useMemo(
    () => ({
      author,
      state,
      error: errors[errors.length - 1],
      errors,
    }),
    [author, errors, state]
  )
}

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
