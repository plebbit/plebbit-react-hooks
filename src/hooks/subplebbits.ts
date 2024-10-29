import {useEffect, useState, useMemo} from 'react'
import {useAccount} from './accounts'
import validator from '../lib/validator'
import Logger from '@plebbit/plebbit-logger'
const log = Logger('plebbit-react-hooks:subplebbits:hooks')
import assert from 'assert'
import {
  Subplebbit,
  SubplebbitStats,
  ChainProviders,
  UseResolvedSubplebbitAddressOptions,
  UseResolvedSubplebbitAddressResult,
  UseSubplebbitOptions,
  UseSubplebbitResult,
  UseSubplebbitsOptions,
  UseSubplebbitsResult,
  UseSubplebbitStatsOptions,
  UseSubplebbitStatsResult,
} from '../types'
import useInterval from './utils/use-interval'
import createStore from 'zustand'
import {resolveEnsTxtRecord} from '../lib/chain'
import useSubplebbitsStore from '../stores/subplebbits'
import shallow from 'zustand/shallow'

/**
 * @param subplebbitAddress - The address of the subplebbit, e.g. 'memes.eth', '12D3KooW...', etc
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useSubplebbit(options?: UseSubplebbitOptions): UseSubplebbitResult {
  assert(!options || typeof options === 'object', `useSubplebbit options argument '${options}' not an object`)
  const {subplebbitAddress, accountName} = options || {}
  const account = useAccount({accountName})
  const subplebbit = useSubplebbitsStore((state: any) => state.subplebbits[subplebbitAddress || ''])
  const addSubplebbitToStore = useSubplebbitsStore((state: any) => state.addSubplebbitToStore)
  const errors = useSubplebbitsStore((state: any) => state.errors[subplebbitAddress || ''])

  useEffect(() => {
    if (!subplebbitAddress || !account) {
      return
    }
    validator.validateUseSubplebbitArguments(subplebbitAddress, account)
    if (!subplebbit) {
      // if subplebbit isn't already in store, add it
      addSubplebbitToStore(subplebbitAddress, account).catch((error: unknown) => log.error('useSubplebbit addSubplebbitToStore error', {subplebbitAddress, error}))
    }
  }, [subplebbitAddress, account?.id])

  if (account && subplebbitAddress) {
    log('useSubplebbit', {subplebbitAddress, subplebbit, account})
  }

  let state = subplebbit?.updatingState || 'initializing'
  // force succeeded even if the subplebbit is fecthing a new update
  if (subplebbit?.updatedAt) {
    state = 'succeeded'
  }

  return useMemo(
    () => ({
      ...subplebbit,
      state,
      error: errors?.[errors.length - 1],
      errors: errors || [],
    }),
    [subplebbit, subplebbitAddress, errors]
  )
}

/**
 * @param subplebbitAddress - The address of the subplebbit, e.g. 'memes.eth', '12D3KooW...', etc
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useSubplebbitStats(options?: UseSubplebbitStatsOptions): UseSubplebbitStatsResult {
  assert(!options || typeof options === 'object', `useSubplebbitStats options argument '${options}' not an object`)
  const {subplebbitAddress, accountName} = options || {}
  const account = useAccount({accountName})
  const subplebbit = useSubplebbit({subplebbitAddress})
  const subplebbitStatsCid = subplebbit?.statsCid
  const subplebbitStats = useSubplebbitsStatsStore((state: SubplebbitsStatsState) => state.subplebbitsStats[subplebbitAddress || ''])
  const setSubplebbitStats = useSubplebbitsStatsStore((state: SubplebbitsStatsState) => state.setSubplebbitStats)

  useEffect(() => {
    if (!subplebbitAddress || !subplebbitStatsCid || !account) {
      return
    }
    ;(async () => {
      let fetchedCid
      try {
        fetchedCid = await account.plebbit.fetchCid(subplebbitStatsCid)
        fetchedCid = JSON.parse(fetchedCid)
        setSubplebbitStats(subplebbitAddress, fetchedCid)
      } catch (error) {
        log.error('useSubplebbitStats plebbit.fetchCid error', {subplebbitAddress, subplebbitStatsCid, subplebbit, fetchedCid, error})
      }
    })()
  }, [subplebbitStatsCid, account?.id, subplebbitAddress, setSubplebbitStats])

  if (account && subplebbitStatsCid) {
    log('useSubplebbitStats', {subplebbitAddress, subplebbitStatsCid, subplebbitStats, subplebbit, account})
  }

  const state = subplebbitStats ? 'succeeded' : 'fetching-ipfs'

  return useMemo(
    () => ({
      ...subplebbitStats,
      state,
      error: undefined,
      errors: [],
    }),
    [subplebbitStats, subplebbitStatsCid, subplebbitAddress]
  )
}

export type SubplebbitsStatsState = {
  subplebbitsStats: {[subplebbitAddress: string]: SubplebbitStats}
  setSubplebbitStats: Function
}

const useSubplebbitsStatsStore = createStore<SubplebbitsStatsState>((setState: Function) => ({
  subplebbitsStats: {},
  setSubplebbitStats: (subplebbitAddress: string, subplebbitStats: SubplebbitStats) =>
    setState((state: SubplebbitsStatsState) => ({subplebbitsStats: {...state.subplebbitsStats, [subplebbitAddress]: subplebbitStats}})),
}))

/**
 * @param subplebbitAddresses - The addresses of the subplebbits, e.g. ['memes.eth', '12D3KooWA...']
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useSubplebbits(options?: UseSubplebbitsOptions): UseSubplebbitsResult {
  assert(!options || typeof options === 'object', `useSubplebbits options argument '${options}' not an object`)
  const {subplebbitAddresses, accountName} = options || {}
  const account = useAccount({accountName})
  const subplebbits: (Subplebbit | undefined)[] = useSubplebbitsStore(
    (state: any) => (subplebbitAddresses || []).map((subplebbitAddress) => state.subplebbits[subplebbitAddress || '']),
    shallow
  )
  const addSubplebbitToStore = useSubplebbitsStore((state: any) => state.addSubplebbitToStore)

  useEffect(() => {
    if (!subplebbitAddresses || !account) {
      return
    }
    validator.validateUseSubplebbitsArguments(subplebbitAddresses, account)
    const uniqueSubplebbitAddresses = new Set(subplebbitAddresses)
    for (const subplebbitAddress of uniqueSubplebbitAddresses) {
      addSubplebbitToStore(subplebbitAddress, account).catch((error: unknown) => log.error('useSubplebbits addSubplebbitToStore error', {subplebbitAddress, error}))
    }
  }, [subplebbitAddresses?.toString(), account?.id])

  if (account && subplebbitAddresses?.length) {
    log('useSubplebbits', {subplebbitAddresses, subplebbits, account})
  }

  // succeed if no subplebbits are undefined
  const state = subplebbits.indexOf(undefined) === -1 ? 'succeeded' : 'fetching-ipns'

  return useMemo(
    () => ({
      subplebbits,
      state,
      error: undefined,
      errors: [],
    }),
    [subplebbits, subplebbitAddresses?.toString()]
  )
}

// TODO: plebbit.listSubplebbits() has been removed, rename this and use event subplebbitschanged instead of polling
/**
 * Returns all the owner subplebbits created by plebbit-js by calling plebbit.listSubplebbits()
 */
export function useListSubplebbits() {
  const account = useAccount()
  const [subplebbitAddresses, setSubplebbitAddresses] = useState<string[]>([])

  const delay = 1000
  const immediate = true
  useInterval(
    () => {
      if (!account?.plebbit) {
        return
      }
      if (account.plebbit.subplebbits.toString() === subplebbitAddresses.toString()) {
        return
      }
      log('useListSubplebbits', {subplebbitAddresses})
      setSubplebbitAddresses(account.plebbit.subplebbits)
    },
    delay,
    immediate
  )

  return subplebbitAddresses
}

/**
 * @param subplebbitAddress - The subplebbit address to resolve to a public key, e.g. 'news.eth' resolves to '12D3KooW...'.
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
// NOTE: useResolvedSubplebbitAddress tests are skipped, if changes are made they must be tested manually
export function useResolvedSubplebbitAddress(options?: UseResolvedSubplebbitAddressOptions): UseResolvedSubplebbitAddressResult {
  assert(!options || typeof options === 'object', `useResolvedSubplebbitAddress options argument '${options}' not an object`)
  let {subplebbitAddress, accountName, cache} = options || {}

  // cache by default
  if (typeof cache !== 'boolean') {
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
  const chainProviders = account?.plebbitOptions?.chainProviders
  const [resolvedAddress, setResolvedAddress] = useState<string>()
  const [errors, setErrors] = useState<Error[]>([])
  const [state, setState] = useState<string>()

  let initialState = 'initializing'
  // before those defined, nothing can happen
  if (options && account && subplebbitAddress) {
    initialState = 'ready'
  }

  useInterval(
    () => {
      // no options, do nothing or reset
      if (!account || !subplebbitAddress) {
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
      if (!subplebbitAddress?.includes('.')) {
        if (state !== 'failed') {
          setErrors([Error('not a crypto domain')])
          setState('failed')
          setResolvedAddress(undefined)
        }
        return
      }

      // only support resolving '.eth' for now
      if (!subplebbitAddress?.endsWith('.eth')) {
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
          const res = await resolveSubplebbitAddress(subplebbitAddress, chainProviders)
          setState('succeeded')
          if (res !== resolvedAddress) {
            setResolvedAddress(res)
          }
        } catch (error: any) {
          setErrors([...errors, error])
          setState('failed')
          setResolvedAddress(undefined)
          log.error('useResolvedSubplebbitAddress resolveSubplebbitAddress error', {subplebbitAddress, chainProviders, error})
        }
      })()
    },
    interval,
    true,
    [subplebbitAddress, chainProviders]
  )

  // only support ENS at the moment
  const chainProvider = chainProviders?.['eth']

  // log('useResolvedSubplebbitAddress', {subplebbitAddress, state, errors, resolvedAddress, chainProviders})
  return {
    resolvedAddress,
    chainProvider,
    state: state || initialState,
    error: errors[errors.length - 1],
    errors,
  }
}

// NOTE: resolveSubplebbitAddress tests are skipped, if changes are made they must be tested manually
export const resolveSubplebbitAddress = async (subplebbitAddress: string, chainProviders: ChainProviders) => {
  let resolvedSubplebbitAddress
  if (subplebbitAddress.endsWith('.eth')) {
    resolvedSubplebbitAddress = await resolveEnsTxtRecord(
      subplebbitAddress,
      'subplebbit-address',
      'eth',
      chainProviders?.['eth']?.urls?.[0],
      chainProviders?.['eth']?.chainId
    )
  } else {
    throw Error(`resolveSubplebbitAddress invalid subplebbitAddress '${subplebbitAddress}'`)
  }
  return resolvedSubplebbitAddress
}
