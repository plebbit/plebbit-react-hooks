import {useState, useMemo, useEffect} from 'react'
import {useAccount} from './accounts'
import Logger from '@plebbit/plebbit-logger'
const log = Logger('plebbit-react-hooks:states:plebbit-rpc')
import assert from 'assert'
import {UsePlebbitRpcSettingsOptions, UsePlebbitRpcSettingsResult, PlebbitRpcSettings} from '../types'

/**
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function usePlebbitRpcSettings(options?: UsePlebbitRpcSettingsOptions): UsePlebbitRpcSettingsResult {
  assert(!options || typeof options === 'object', `usePlebbitRpcSettings options argument '${options}' not an object`)
  const {accountName} = options || {}
  const account = useAccount({accountName})
  const [plebbitRpcSettingsState, setPlebbitRpcSettingsState] = useState<PlebbitRpcSettings>()
  const [state, setState] = useState<string>('initializing')
  const [errors, setErrors] = useState<Error[]>([])

  useEffect(() => {
    if (!account) {
      return
    }
    setState('calling-rpc')
    account.plebbit
      .rpcCall('getSettings', [])
      .then((plebbitRpcSettings: PlebbitRpcSettings) => {
        setPlebbitRpcSettingsState(plebbitRpcSettings)
        setState('succeeded')
      })
      .catch((e: any) => {
        setErrors([...errors, e])
        setState('failed')
      })
  }, [account?.id])

  const setPlebbitRpcSettings = async (plebbitRpcSettings: PlebbitRpcSettings) => {
    assert(account, `can't use usePlebbitRpcSettings.setPlebbitRpcSettings before initialized`)
    assert(
      plebbitRpcSettings && typeof plebbitRpcSettings === 'object',
      `usePlebbitRpcSettings.setPlebbitRpcSettings plebbitRpcSettings argument '${plebbitRpcSettings}' not an object`,
    )
    setState('calling-rpc')
    try {
      await account.plebbit.rpcCall('setSettings', [plebbitRpcSettings])
      setPlebbitRpcSettingsState(plebbitRpcSettings)
      setState('succeeded')
    } catch (e: any) {
      setErrors([...errors, e])
      setState('failed')
    }
  }

  return useMemo(
    () => ({
      plebbitRpcSettings: plebbitRpcSettingsState,
      setPlebbitRpcSettings,
      state,
      error: errors?.[errors.length - 1],
      errors,
    }),
    [plebbitRpcSettingsState, setPlebbitRpcSettings, state, errors],
  )
}
