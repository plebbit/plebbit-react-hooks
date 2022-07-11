import {useEffect, useMemo, useState, useContext} from 'react'
import {useAccount} from './accounts'
import {SubplebbitsContext} from '../providers/subplebbits-provider'
import validator from '../lib/validator'
import Debug from 'debug'
const debug = Debug('plebbit-react-hooks:hooks:subplebbits')
import assert from 'assert'
import {Subplebbit} from '../types'
import useInterval from './utils/use-interval'

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
      subplebbitsContext.subplebbitsActions
        .addSubplebbitToContext(subplebbitAddress, account)
        .catch((error: unknown) => console.error('useSubplebbit addSubplebbitToContext error', {subplebbitAddress, error}))
    }
  }, [subplebbitAddress, account])

  debug('useSubplebbit', {subplebbitsContext: subplebbitsContext.subplebbits, subplebbit, account})
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
        subplebbitsContext.subplebbitsActions
          .addSubplebbitToContext(subplebbitAddress, account)
          .catch((error: unknown) => console.error('useSubplebbits addSubplebbitToContext error', {subplebbitAddress, error}))
      }
    }
  }, [subplebbitAddresses, account])

  debug('useSubplebbits', {subplebbitsContext: subplebbitsContext.subplebbits, subplebbits, account})
  return subplebbits
}

/**
 * Returns all the subplebbits created by plebbit-js by calling plebbit.listSubplebbits()
 */
export function useListSubplebbits() {
  const account = useAccount()
  const [subplebbitAddresses, setSubplebbitAddresses] = useState<string[]>([])

  const delay = 1000
  const immediate = true
  useInterval(
    () => {
      // TODO: find a way to know the plebbit runtime and don't call the function if browser
      if (!account?.plebbit) {
        return
      }
      account.plebbit.listSubplebbits().then((_subplebbitAddresses: string[]) => {
        if (JSON.stringify(_subplebbitAddresses) === JSON.stringify(subplebbitAddresses)) {
          return
        }
        setSubplebbitAddresses(_subplebbitAddresses)
      })
    },
    delay,
    immediate
  )

  debug('useListSubplebbits', {subplebbitAddresses})
  return subplebbitAddresses
}
