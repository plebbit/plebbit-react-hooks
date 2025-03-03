import {useEffect, useState, useMemo} from 'react'
import {Comment, CommentsFilter} from '../../types'
import {useComments} from '../comments'
import utils from '../../lib/utils'
import PeerId from 'peer-id'
import {fromString as uint8ArrayFromString} from 'uint8arrays/from-string'
import {toString as uint8ArrayToString} from 'uint8arrays/to-string'
import {create as createMultihash} from 'multiformats/hashes/digest'
import assert from 'assert'

export const useAuthorCommentsName = (accountId?: string, authorAddress?: string, filter?: CommentsFilter | undefined) => {
  return useMemo(() => accountId + '-' + authorAddress + '-' + filter?.key, [accountId, authorAddress, filter?.key])
}

const protobufPublicKeyPrefix = new Uint8Array([8, 1, 18, 32])
const multihashIdentityCode = 0
const getPlebbitAddressFromPublicKey = (publicKeyBase64: string) => {
  const publicKeyBuffer = uint8ArrayFromString(publicKeyBase64, 'base64')
  const publicKeyBufferWithPrefix = new Uint8Array(protobufPublicKeyPrefix.length + publicKeyBuffer.length)
  publicKeyBufferWithPrefix.set(protobufPublicKeyPrefix, 0)
  publicKeyBufferWithPrefix.set(publicKeyBuffer, protobufPublicKeyPrefix.length)
  const multihash = createMultihash(multihashIdentityCode, publicKeyBufferWithPrefix).bytes
  return uint8ArrayToString(multihash, 'base58btc')
}

export const usePlebbitAddress = (publicKeyBase64?: string) => {
  return useMemo(() => (publicKeyBase64 ? getPlebbitAddressFromPublicKey(publicKeyBase64) : undefined), [publicKeyBase64])
}
