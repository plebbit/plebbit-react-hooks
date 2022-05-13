import { useEffect, useMemo, useState, useContext } from 'react'
import { useAccount } from './accounts'
import { SubplebbitsContext } from '../providers/subplebbits-provider'
import validator from '../lib/validator'
import Debug from 'debug'
const debug = Debug('plebbitreacthooks:hooks:subplebbits')
import assert from 'assert'
import { Subplebbit } from '../types'

/**
 * @param subplebbitAddress - The address of the subplebbit, e.g. 'memes.eth', 'Qm...', etc
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useSubplebbit(subplebbitAddress?: string, accountName?: string) {
  const account = useAccount(accountName)
  const subplebbitsContext = useContext(SubplebbitsContext)
  const subplebbit = subplebbitAddress && subplebbitsContext.subplebbits[subplebbitAddress]

  useEffect(() => {
    if (!subplebbitAddress || !account) {
      return
    }
    validator.validateUseSubplebbitArguments(subplebbitAddress, account)
    if (!subplebbit) {
      // if subplebbit isn't already in context, add it
      subplebbitsContext.subplebbitsActions.addSubplebbitToContext(subplebbitAddress, account)
    }
  }, [subplebbitAddress, account])

  debug('useSubplebbit', { subplebbitsContext: subplebbitsContext.subplebbits, subplebbit, account })
  return subplebbit
}

/**
 * @param subplebbitAddresses - The addresses of the subplebbits, e.g. ['memes.eth', 'Qm...']
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useSubplebbits(subplebbitAddresses?: string[], accountName?: string) {
  const account = useAccount(accountName)
  const subplebbitsContext = useContext(SubplebbitsContext)
  const subplebbits: Subplebbit[] = []
  for (const subplebbitAddress of subplebbitAddresses || []) {
    subplebbits.push(subplebbitsContext.subplebbits[subplebbitAddress])
  }

  useEffect(() => {
    if (!subplebbitAddresses || !account) {
      return
    }
    validator.validateUseSubplebbitsArguments(subplebbitAddresses, account)
    const uniqueSubplebbitAddresses = new Set(subplebbitAddresses)
    for (const subplebbitAddress of uniqueSubplebbitAddresses) {
      // if subplebbit isn't already in context, add it
      if (!subplebbitsContext.subplebbits[subplebbitAddress]) {
        subplebbitsContext.subplebbitsActions.addSubplebbitToContext(subplebbitAddress, account)
      }
    }
  }, [subplebbitAddresses, account])

  debug('useSubplebbits', { subplebbitsContext: subplebbitsContext.subplebbits, subplebbits, account })
  return subplebbits
}
