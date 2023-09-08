import {useEffect, useState, useMemo} from 'react'
import {Comment, CommentsFilter} from '../../types'
import {useComments} from '../comments'
import utils from '../../lib/utils'
import PeerId from 'peer-id'
import {fromString as uint8ArrayFromString} from 'uint8arrays/from-string'
import {toString as uint8ArrayToString} from 'uint8arrays/to-string'
// @ts-ignore
import {Ed25519PublicKey, Ed25519PrivateKey} from 'libp2p-crypto/src/keys/ed25519-class'

// filters are functions so they can't be stringified
const filterNumbers = new WeakMap()
let filterCount = 0
const getFilterName = (filter: CommentsFilter) => {
  let filterNumber = filterNumbers.get(filter)
  if (!filterNumber) {
    filterCount++
    filterNumbers.set(filter, filterCount)
    filterNumber = filterCount
  }
  return `filter${filterNumber}`
}

export const useAuthorCommentsName = (accountId?: string, authorAddress?: string, filter?: CommentsFilter | undefined) => {
  const filterName = filter ? getFilterName(filter) : undefined
  return useMemo(() => accountId + '-' + authorAddress + '-' + filterName, [accountId, authorAddress, filterName])
}

const getPeerIdFromPublicKey = async (publicKeyBase64: string) => {
  const publicKeyBuffer = uint8ArrayFromString(publicKeyBase64, 'base64')

  // the PeerId public key is not a raw public key, it adds a suffix
  const ed25519PublicKeyInstance = new Ed25519PublicKey(publicKeyBuffer)
  const peerId = await PeerId.createFromPubKey(new Uint8Array(ed25519PublicKeyInstance.bytes)) // add new Uint8Array or bugs out in jsdom
  return peerId
}

const getPlebbitAddressFromPublicKey = async (publicKeyBase64: string) => {
  const peerId = await getPeerIdFromPublicKey(publicKeyBase64)
  return peerId.toB58String().trim()
}

export const usePlebbitAddress = (publicKeyBase64: string) => {
  const [plebbitAddress, setPlebbitAddress] = useState<string>()
  useEffect(() => {
    if (typeof publicKeyBase64 !== 'string') {
      return
    }
    getPlebbitAddressFromPublicKey(publicKeyBase64)
      .then((plebbitAddress) => setPlebbitAddress(plebbitAddress))
      .catch(() => {})
  }, [publicKeyBase64])
  return plebbitAddress
}
