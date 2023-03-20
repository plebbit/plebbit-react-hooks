import {act, renderHook} from '@testing-library/react-hooks'
import testUtils from '../lib/test-utils'
import {useSubplebbit, useSubplebbitStats, useSubplebbits, setPlebbitJs, useResolvedSubplebbitAddress, useAccount} from '..'
import subplebbitStore from '../stores/subplebbits'
import {useListSubplebbits, resolveSubplebbitAddress} from './subplebbits'
import PlebbitJsMock, {Plebbit, Subplebbit} from '../lib/plebbit-js/plebbit-js-mock'
import utils from '../lib/utils'
setPlebbitJs(PlebbitJsMock)

describe('subplebbits', () => {
  beforeAll(() => {
    testUtils.silenceReactWarnings()
  })
  afterAll(() => {
    testUtils.restoreAll()
  })
  afterEach(async () => {
    await testUtils.resetDatabasesAndStores()
  })

  describe('no subplebbits in database', () => {
    afterEach(async () => {
      await testUtils.resetDatabasesAndStores()
    })

    test('get subplebbits one at a time', async () => {
      const rendered = renderHook<any, any>((subplebbitAddress) => useSubplebbit({subplebbitAddress}))
      const waitFor = testUtils.createWaitFor(rendered)

      expect(rendered.result.current.address).toBe(undefined)
      rendered.rerender('subplebbit address 1')
      await waitFor(() => typeof rendered.result.current.address === 'string')

      expect(rendered.result.current.address).toBe('subplebbit address 1')
      expect(rendered.result.current.title).toBe('subplebbit address 1 title')
      // wait for subplebbit.on('update') to fetch the updated description
      await waitFor(() => typeof rendered.result.current.description === 'string')

      expect(rendered.result.current.description).toBe('subplebbit address 1 description updated')

      rendered.rerender('subplebbit address 2')
      await waitFor(() => typeof rendered.result.current.address === 'string')

      expect(rendered.result.current.address).toBe('subplebbit address 2')
      expect(rendered.result.current.title).toBe('subplebbit address 2 title')
      // wait for subplebbit.on('update') to fetch the updated description
      await waitFor(() => typeof rendered.result.current.description === 'string')

      expect(rendered.result.current.description).toBe('subplebbit address 2 description updated')

      // get sub 1 again, no need to wait for any updates
      rendered.rerender('subplebbit address 1')
      expect(rendered.result.current.address).toBe('subplebbit address 1')
      expect(rendered.result.current.description).toBe('subplebbit address 1 description updated')

      // make sure subplebbits are still in database
      const getSubplebbit = Plebbit.prototype.getSubplebbit
      const simulateUpdateEvent = Subplebbit.prototype.simulateUpdateEvent
      // mock getSubplebbit on the Plebbit class
      Plebbit.prototype.getSubplebbit = (subplebbitAddress) => {
        throw Error(`plebbit.getSubplebbit called with subplebbit address '${subplebbitAddress}' should not be called when getting subplebbit from database`)
      }
      // don't simulate 'update' event during this test to see if the updates were saved to database
      let throwOnSubplebbitUpdateEvent = false
      Subplebbit.prototype.simulateUpdateEvent = () => {
        if (throwOnSubplebbitUpdateEvent) {
          throw Error('no subplebbit update events should be emitted when subplebbit already in store')
        }
      }

      // reset stores to force using the db
      expect(subplebbitStore.getState().subplebbits).not.toEqual({})
      await testUtils.resetStores()
      expect(subplebbitStore.getState().subplebbits).toEqual({})

      // on first render, the account is undefined because it's not yet loaded from database
      const rendered2 = renderHook<any, any>((subplebbitAddress) => useSubplebbit({subplebbitAddress}))
      expect(rendered2.result.current.address).toBe(undefined)
      rendered2.rerender('subplebbit address 1')
      // wait to get account loaded
      await waitFor(() => rendered2.result.current.address === 'subplebbit address 1')

      expect(rendered2.result.current.address).toBe('subplebbit address 1')
      expect(rendered2.result.current.title).toBe('subplebbit address 1 title')
      expect(rendered2.result.current.description).toBe('subplebbit address 1 description updated')

      rendered2.rerender('subplebbit address 2')
      // wait for addSubplebbitToStore action
      await waitFor(() => rendered2.result.current.address === 'subplebbit address 2')

      expect(rendered2.result.current.address).toBe('subplebbit address 2')
      expect(rendered2.result.current.title).toBe('subplebbit address 2 title')
      expect(rendered2.result.current.description).toBe('subplebbit address 2 description updated')

      // get subplebbit 1 again from store, should not trigger any subplebbit updates
      throwOnSubplebbitUpdateEvent = true
      rendered2.rerender('subplebbit address 1')
      expect(rendered2.result.current.address).toBe('subplebbit address 1')
      expect(rendered2.result.current.title).toBe('subplebbit address 1 title')
      expect(rendered2.result.current.description).toBe('subplebbit address 1 description updated')

      // restore mock
      Subplebbit.prototype.simulateUpdateEvent = simulateUpdateEvent
      Plebbit.prototype.getSubplebbit = getSubplebbit
    })

    test('get multiple subplebbits at once', async () => {
      const rendered = renderHook<any, any>((subplebbitAddresses) => useSubplebbits({subplebbitAddresses}))
      const waitFor = testUtils.createWaitFor(rendered)

      expect(rendered.result.current.subplebbits).toEqual([])
      rendered.rerender(['subplebbit address 1', 'subplebbit address 2', 'subplebbit address 3'])
      expect(rendered.result.current.subplebbits).toEqual([undefined, undefined, undefined])

      await waitFor(
        () =>
          typeof rendered.result.current.subplebbits[0].address === 'string' &&
          typeof rendered.result.current.subplebbits[1].address === 'string' &&
          typeof rendered.result.current.subplebbits[2].address === 'string'
      )
      expect(rendered.result.current.subplebbits[0].address).toBe('subplebbit address 1')
      expect(rendered.result.current.subplebbits[1].address).toBe('subplebbit address 2')
      expect(rendered.result.current.subplebbits[2].address).toBe('subplebbit address 3')

      await waitFor(
        () =>
          typeof rendered.result.current.subplebbits[0].description === 'string' &&
          typeof rendered.result.current.subplebbits[1].description === 'string' &&
          typeof rendered.result.current.subplebbits[2].description === 'string'
      )
      expect(rendered.result.current.subplebbits[0].description).toBe('subplebbit address 1 description updated')
      expect(rendered.result.current.subplebbits[1].description).toBe('subplebbit address 2 description updated')
      expect(rendered.result.current.subplebbits[2].description).toBe('subplebbit address 3 description updated')
    })

    test('get subplebbit, plebbit.getSubplebbit fails 3 times', async () => {
      // mock getSubplebbit on the Plebbit class to fail 3 times
      const getSubplebbit = Plebbit.prototype.getSubplebbit
      const retryInfinityMinTimeout = utils.retryInfinityMinTimeout
      const retryInfinityMaxTimeout = utils.retryInfinityMaxTimeout
      utils.retryInfinityMinTimeout = 10
      utils.retryInfinityMaxTimeout = 10
      let failCount = 0
      Plebbit.prototype.getSubplebbit = async (subplebbitAddress) => {
        // restore original function after 3 fails
        if (++failCount >= 3) {
          Plebbit.prototype.getSubplebbit = getSubplebbit
        }
        throw Error(`failed to get subplebbit`)
      }

      const rendered = renderHook<any, any>((subplebbitAddress) => useSubplebbit({subplebbitAddress}))
      const waitFor = testUtils.createWaitFor(rendered)

      expect(rendered.result.current.address).toBe(undefined)
      rendered.rerender('subplebbit address 1')
      await waitFor(() => typeof rendered.result.current?.address === 'string')

      expect(rendered.result.current?.address).toBe('subplebbit address 1')
      expect(rendered.result.current?.title).toBe('subplebbit address 1 title')
      // wait for subplebbit.on('update') to fetch the updated description
      await waitFor(() => typeof rendered.result.current?.description === 'string')

      expect(rendered.result.current?.description).toBe('subplebbit address 1 description updated')

      // restore mock
      Plebbit.prototype.getSubplebbit = getSubplebbit
      utils.retryInfinityMinTimeout = retryInfinityMinTimeout
      utils.retryInfinityMaxTimeout = retryInfinityMaxTimeout
    })
  })

  test('useListSubplebbits', async () => {
    const rendered = renderHook<any, any>(() => useListSubplebbits())
    const waitFor = testUtils.createWaitFor(rendered)
    await waitFor(() => rendered.result.current.length > 0)
    expect(rendered.result.current).toEqual(['list subplebbit address 1', 'list subplebbit address 2'])
  })

  test('useSubplebbitMetrics', async () => {
    const rendered = renderHook<any, any>(() => useSubplebbitMetrics({subplebbitAddress: 'address 1'}))
    const waitFor = testUtils.createWaitFor(rendered)
    await waitFor(() => rendered.result.current.hourActiveUserCount)
    expect(rendered.result.current.hourActiveUserCount).toBe(1)
  })

  describe('subplebbit address', () => {
    const timeout = 60000
    jest.setTimeout(timeout)

    // skip because uses internet and not deterministic
    test.skip('useResolvedSubplebbitAddress', async () => {
      const rendered = renderHook<any, any>((subplebbitAddress) => useResolvedSubplebbitAddress({subplebbitAddress}))
      const waitFor = testUtils.createWaitFor(rendered, {timeout})
      expect(rendered.result.current.resolvedAddress).toBe(undefined)

      rendered.rerender('plebbit.eth')
      await waitFor(() => typeof rendered.result.current.resolvedAddress === 'string')
      expect(rendered.result.current.resolvedAddress).toBe('QmW5Zt7YXmtskSUjjenGNS3QNRbjqjUPaT35zw5RYUCtY1')
    })

    test('useResolvedSubplebbitAddress unsupported crypto domain', async () => {
      const rendered = renderHook<any, any>((subplebbitAddress) => useResolvedSubplebbitAddress({subplebbitAddress}))
      const waitFor = testUtils.createWaitFor(rendered)
      expect(rendered.result.current.resolvedAddress).toBe(undefined)

      rendered.rerender('plebbit.com')
      await waitFor(() => rendered.result.current.error)
      expect(rendered.result.current.error.message).toBe('crypto domain type unsupported')
    })

    test('useResolvedSubplebbitAddress not a crypto domain', async () => {
      const rendered = renderHook<any, any>((subplebbitAddress) => useResolvedSubplebbitAddress({subplebbitAddress}))
      const waitFor = testUtils.createWaitFor(rendered)
      expect(rendered.result.current.resolvedAddress).toBe(undefined)

      rendered.rerender('abc')
      await waitFor(() => rendered.result.current.error)
      expect(rendered.result.current.error.message).toBe('not a crypto domain')
    })
  })
})
