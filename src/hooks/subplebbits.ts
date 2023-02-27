import {useEffect, useState} from 'react'
import {useAccount} from './accounts'
import validator from '../lib/validator'
import Logger from '@plebbit/plebbit-logger'
const log = Logger('plebbit-react-hooks:hooks:subplebbits')
import assert from 'assert'
import {Subplebbit, BlockchainProviders, UseResolvedSubplebbitAddressOptions, UseResolvedSubplebbitAddressResult} from '../types-new'
import useInterval from './utils/use-interval'
import {resolveEnsTxtRecord} from '../lib/blockchain'
import useSubplebbitsStore from '../stores/subplebbits'
import shallow from 'zustand/shallow'

/**
 * @param subplebbitAddress - The address of the subplebbit, e.g. 'memes.eth', 'Qm...', etc
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useSubplebbit(subplebbitAddress?: string, accountName?: string) {
  const account = useAccount(accountName)
  const subplebbit = useSubplebbitsStore((state: any) => state.subplebbits[subplebbitAddress || ''])
  const addSubplebbitToStore = useSubplebbitsStore((state: any) => state.addSubplebbitToStore)

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
  return subplebbit
}

/**
 * @param subplebbitAddress - The address of the subplebbit, e.g. 'memes.eth', 'Qm...', etc
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useSubplebbitMetrics(subplebbitAddress?: string, accountName?: string) {
  const account = useAccount(accountName)
  const subplebbit = useSubplebbit(subplebbitAddress)
  const subplebbitMetricsCid = subplebbit?.metricsCid
  const [subplebbitMetrics, setSubplebbitMetrics] = useState()

  useEffect(() => {
    if (!subplebbitMetricsCid || !account) {
      return
    }
    ;(async () => {
      let fetchedCid
      try {
        fetchedCid = await account.plebbit.fetchCid(subplebbitMetricsCid)
        fetchedCid = JSON.parse(fetchedCid)
        setSubplebbitMetrics(fetchedCid)
      } catch (error) {
        log.error('useSubplebbitMetrics plebbit.fetchCid error', {subplebbitAddress, subplebbitMetricsCid, subplebbit, fetchedCid, error})
      }
    })()
  }, [subplebbitMetricsCid, account?.id])

  if (account && subplebbitMetricsCid) {
    log('useSubplebbitMetrics', {subplebbitAddress, subplebbitMetricsCid, subplebbitMetrics, subplebbit, account})
  }
  return subplebbitMetrics
}

/**
 * @param subplebbitAddresses - The addresses of the subplebbits, e.g. ['memes.eth', 'Qm...']
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useSubplebbits(subplebbitAddresses: string[] = [], accountName?: string) {
  const account = useAccount(accountName)
  const subplebbits: Subplebbit[] = useSubplebbitsStore(
    (state: any) => subplebbitAddresses.map((subplebbitAddress) => state.subplebbits[subplebbitAddress || '']),
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
  }, [subplebbitAddresses.toString(), account?.id])

  if (account && subplebbitAddresses?.length) {
    log('useSubplebbits', {subplebbitAddresses, subplebbits, account})
  }
  return subplebbits
}

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
      account.plebbit.listSubplebbits().then((_subplebbitAddresses: string[]) => {
        if (_subplebbitAddresses.toString() === subplebbitAddresses.toString()) {
          return
        }
        log('useListSubplebbits', {subplebbitAddresses})
        setSubplebbitAddresses(_subplebbitAddresses)
      })
    },
    delay,
    immediate
  )

  return subplebbitAddresses
}

/**
 * @param subplebbitAddress - The subplebbit address to resolve to a public key, e.g. 'news.eth' resolves to 'Qm...'.
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
// NOTE: useResolvedSubplebbitAddress tests are skipped, if changes are made they must be tested manually
export function useResolvedSubplebbitAddress(options: UseResolvedSubplebbitAddressOptions): UseResolvedSubplebbitAddressResult {
  let {subplebbitAddress, accountName, cache} = options || {}

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

  const account = useAccount(accountName)
  // possible to use account.plebbit instead of account.plebbitOptions
  const blockchainProviders = account?.plebbitOptions?.blockchainProviders
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
      if (!account || !subplebbitAddress) {
        return
      }

      // address isn't a crypto domain, can't be resolved
      if (!subplebbitAddress?.includes('.')) {
        if (state !== 'failed') {
          setErrors([Error('not a crypto domain')])
          setState('failed')
        }
        return
      }

      // only support resolving '.eth' for now
      if (!subplebbitAddress?.endsWith('.eth')) {
        if (state !== 'failed') {
          setErrors([Error('crypto domain type unsupported')])
          setState('failed')
        }
        return
      }

      ;(async () => {
        try {
          setState('resolving')
          const res = await resolveSubplebbitAddress(subplebbitAddress, blockchainProviders)
          setState('succeeded')
          if (res !== resolvedAddress) {
            setResolvedAddress(res)
          }
        } catch (error: any) {
          setErrors([...errors, error])
          setState('failed')
          log.error('useResolvedSubplebbitAddress resolveSubplebbitAddress error', {subplebbitAddress, blockchainProviders, error})
        }
      })()
    },
    interval,
    true,
    [subplebbitAddress, blockchainProviders]
  )

  // log('useResolvedSubplebbitAddress', {subplebbitAddress, state, errors, resolvedAddress, blockchainProviders})
  return {
    state: state || initialState,
    error: errors[errors.length - 1],
    errors,
    resolvedAddress,
  }
}

// NOTE: resolveSubplebbitAddress tests are skipped, if changes are made they must be tested manually
export const resolveSubplebbitAddress = async (subplebbitAddress: string, blockchainProviders: BlockchainProviders) => {
  let resolvedSubplebbitAddress
  if (subplebbitAddress.endsWith('.eth')) {
    resolvedSubplebbitAddress = await resolveEnsTxtRecord(
      subplebbitAddress,
      'subplebbit-address',
      'eth',
      blockchainProviders?.['eth']?.url,
      blockchainProviders?.['eth']?.chainId
    )
  } else {
    throw Error(`resolveSubplebbitAddress invalid subplebbitAddress '${subplebbitAddress}'`)
  }
  return resolvedSubplebbitAddress
}
