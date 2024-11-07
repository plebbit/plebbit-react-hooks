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
    const rpcClient: any = Object.values(account.plebbit?.clients?.plebbitRpcClients || {})[0]
    if (!rpcClient) {
      return
    }

    // set initial state
    if (rpcClient.state) {
      setState(rpcClient.state)
    }

    const onRpcSettingsChange = (plebbitRpcSettings: PlebbitRpcSettings) => {
      setPlebbitRpcSettingsState(plebbitRpcSettings)
    }
    const onRpcStateChange = (rpcState: string) => {
      setState(rpcState)
    }
    const onRpcError = (e: any) => {
      setErrors([...errors, e])
    }

    rpcClient.on('settingschange', onRpcSettingsChange)
    rpcClient.on('statechange', onRpcStateChange)
    rpcClient.on('error', onRpcError)

    // clean up
    return () => {
      rpcClient.removeListener('settingschange', onRpcSettingsChange)
      rpcClient.removeListener('statechange', onRpcStateChange)
      rpcClient.removeListener('error', onRpcError)
    }
  }, [account?.id])

  const setPlebbitRpcSettings = async (plebbitRpcSettings: PlebbitRpcSettings) => {
    assert(account, `can't use usePlebbitRpcSettings.setPlebbitRpcSettings before initialized`)
    assert(
      plebbitRpcSettings && typeof plebbitRpcSettings === 'object',
      `usePlebbitRpcSettings.setPlebbitRpcSettings plebbitRpcSettings argument '${plebbitRpcSettings}' not an object`
    )
    const rpcClient: any = Object.values(account.plebbit?.clients?.plebbitRpcClients || {})[0]
    assert(rpcClient, `can't use usePlebbitRpcSettings.setPlebbitRpcSettings no account.plebbit.clients.plebbitRpcClients`)

    try {
      await rpcClient.setSettings(plebbitRpcSettings)
      setState('succeeded')
    } catch (e: any) {
      setErrors([...errors, e])
      setState('failed')
    }

    // go back to original state after some time
    setTimeout(() => {
      if (state !== rpcClient.state && rpcClient.state) {
        setState(rpcClient.state)
      }
    }, 10000)
  }

  return useMemo(
    () => ({
      plebbitRpcSettings: plebbitRpcSettingsState,
      setPlebbitRpcSettings,
      state,
      error: errors?.[errors.length - 1],
      errors,
    }),
    [plebbitRpcSettingsState, account?.id, state, errors]
  )
}
