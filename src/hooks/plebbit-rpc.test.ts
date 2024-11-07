import {act, renderHook} from '@testing-library/react-hooks'
import testUtils from '../lib/test-utils'
import {usePlebbitRpcSettings, setPlebbitJs} from '..'
import PlebbitJsMock from '../lib/plebbit-js/plebbit-js-mock'

describe('plebbit-rpc', () => {
  beforeAll(async () => {
    // set plebbit-js mock and reset dbs
    setPlebbitJs(PlebbitJsMock)
    await testUtils.resetDatabasesAndStores()

    testUtils.silenceReactWarnings()
  })
  afterAll(() => {
    testUtils.restoreAll()
  })
  afterEach(async () => {
    await testUtils.resetDatabasesAndStores()
  })

  test('usePlebbitRpcSettings', async () => {
    // on first render, the account is undefined because it's not yet loaded from database
    const rendered = renderHook<any, any>(() => usePlebbitRpcSettings())
    const waitFor = testUtils.createWaitFor(rendered)
    expect(rendered.result.current.plebbitRpcSettings).toBe(undefined)

    await waitFor(() => rendered.result.current.state === 'connecting')
    expect(rendered.result.current.state).toBe('connecting')

    await waitFor(() => !!rendered.result.current.plebbitRpcSettings)
    expect(rendered.result.current.plebbitRpcSettings.challenges).not.toBe(undefined)
    expect(rendered.result.current.state).toBe('connected')

    await act(async () => {
      await rendered.result.current.setPlebbitRpcSettings({
        challenges: {
          'some-challenge': {},
        },
      })
    })

    await waitFor(() => !!rendered.result.current.plebbitRpcSettings.challenges['some-challenge'])
    expect(rendered.result.current.plebbitRpcSettings.challenges['some-challenge']).not.toBe(undefined)
    expect(rendered.result.current.state).toBe('succeeded')
  })
})
