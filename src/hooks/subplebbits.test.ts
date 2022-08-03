import {act, renderHook} from '@testing-library/react-hooks'
import testUtils from '../lib/test-utils'
import {useSubplebbit, useSubplebbits, setPlebbitJs, PlebbitProvider, useResolvedSubplebbitAddress, useAccount} from '..'
import subplebbitStore from '../stores/subplebbits'
import {useListSubplebbits, resolveSubplebbitAddress} from './subplebbits'
import PlebbitJsMock, {Plebbit, Subplebbit} from '../lib/plebbit-js/plebbit-js-mock'
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
      const rendered = renderHook<any, any>((subplebbitAddress) => useSubplebbit(subplebbitAddress), {
        wrapper: PlebbitProvider,
      })
      expect(rendered.result.current).toBe(undefined)
      rendered.rerender('subplebbit address 1')
      try {
        await rendered.waitFor(() => typeof rendered.result.current.address === 'string')
      } catch (e) {
        console.error(e)
      }
      expect(rendered.result.current.address).toBe('subplebbit address 1')
      expect(rendered.result.current.title).toBe('subplebbit address 1 title')
      // wait for subplebbit.on('update') to fetch the updated description
      try {
        await rendered.waitFor(() => typeof rendered.result.current.description === 'string')
      } catch (e) {
        console.error(e)
      }
      expect(rendered.result.current.description).toBe('subplebbit address 1 description updated')

      rendered.rerender('subplebbit address 2')
      try {
        await rendered.waitFor(() => typeof rendered.result.current.address === 'string')
      } catch (e) {
        console.error(e)
      }
      expect(rendered.result.current.address).toBe('subplebbit address 2')
      expect(rendered.result.current.title).toBe('subplebbit address 2 title')
      // wait for subplebbit.on('update') to fetch the updated description
      try {
        await rendered.waitFor(() => typeof rendered.result.current.description === 'string')
      } catch (e) {
        console.error(e)
      }
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
          throw Error('no subplebbit update events should be emitted when subplebbit already in context')
        }
      }

      // reset stores to force using the db
      expect(subplebbitStore.getState().subplebbits).not.toEqual({})
      await testUtils.resetStores()
      expect(subplebbitStore.getState().subplebbits).toEqual({})

      // on first render, the account is undefined because it's not yet loaded from database
      const rendered2 = renderHook<any, any>((subplebbitAddress) => useSubplebbit(subplebbitAddress), {
        wrapper: PlebbitProvider,
      })
      expect(rendered2.result.current).toBe(undefined)
      rendered2.rerender('subplebbit address 1')
      // wait to get account loaded
      try {
        await rendered2.waitForNextUpdate()
      } catch (e) {
        console.error(e)
      }
      expect(rendered2.result.current.address).toBe('subplebbit address 1')
      expect(rendered2.result.current.title).toBe('subplebbit address 1 title')
      expect(rendered2.result.current.description).toBe('subplebbit address 1 description updated')

      rendered2.rerender('subplebbit address 2')
      // wait for addSubplebbitToContext action
      try {
        await rendered2.waitForNextUpdate()
      } catch (e) {
        console.error(e)
      }
      expect(rendered2.result.current.address).toBe('subplebbit address 2')
      expect(rendered2.result.current.title).toBe('subplebbit address 2 title')
      expect(rendered2.result.current.description).toBe('subplebbit address 2 description updated')

      // get subplebbit 1 again from context, should not trigger any subplebbit updates
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
      const rendered = renderHook<any, any>((subplebbitAddresses) => useSubplebbits(subplebbitAddresses), {
        wrapper: PlebbitProvider,
      })
      expect(rendered.result.current).toEqual([])
      rendered.rerender(['subplebbit address 1', 'subplebbit address 2', 'subplebbit address 3'])
      expect(rendered.result.current).toEqual([undefined, undefined, undefined])
      try {
        await rendered.waitFor(
          () =>
            typeof rendered.result.current[0].address === 'string' &&
            typeof rendered.result.current[1].address === 'string' &&
            typeof rendered.result.current[2].address === 'string'
        )
      } catch (e) {
        console.error(e)
      }
      expect(rendered.result.current[0].address).toBe('subplebbit address 1')
      expect(rendered.result.current[1].address).toBe('subplebbit address 2')
      expect(rendered.result.current[2].address).toBe('subplebbit address 3')
      try {
        await rendered.waitFor(
          () =>
            typeof rendered.result.current[0].description === 'string' &&
            typeof rendered.result.current[1].description === 'string' &&
            typeof rendered.result.current[2].description === 'string'
        )
      } catch (e) {
        console.error(e)
      }
      expect(rendered.result.current[0].description).toBe('subplebbit address 1 description updated')
      expect(rendered.result.current[1].description).toBe('subplebbit address 2 description updated')
      expect(rendered.result.current[2].description).toBe('subplebbit address 3 description updated')
    })
  })

  test('useListSubplebbits', async () => {
    const rendered = renderHook<any, any>(() => useListSubplebbits(), {wrapper: PlebbitProvider})
    const waitFor = testUtils.createWaitFor(rendered)
    await waitFor(() => rendered.result.current.length > 0)
    expect(rendered.result.current).toEqual(['list subplebbit address 1', 'list subplebbit address 2'])
  })

  describe('subplebbit address', () => {
    const timeout = 60000
    jest.setTimeout(timeout)

    // skip because uses internet and not deterministic
    test.skip('useResolvedSubplebbitAddress', async () => {
      const rendered = renderHook<any, any>((subplebbitAddress) => useResolvedSubplebbitAddress(subplebbitAddress), {wrapper: PlebbitProvider})
      const waitFor = testUtils.createWaitFor(rendered, {timeout})
      expect(rendered.result.current).toBe(undefined)

      rendered.rerender('plebbit.eth')
      await waitFor(() => typeof rendered.result.current === 'string')
      expect(rendered.result.current).toBe('QmW5Zt7YXmtskSUjjenGNS3QNRbjqjUPaT35zw5RYUCtY1')
    })

    // skip because uses internet and not deterministic
    // also cache and pending is difficult to test without console logging it
    test.skip('resolveSubplebbitAddress (cache and pending)', async () => {
      const rendered = renderHook<any, any>(() => useAccount(), {wrapper: PlebbitProvider})
      const waitFor = testUtils.createWaitFor(rendered, {timeout})
      await waitFor(() => rendered.result.current)
      expect(rendered.result.current).not.toBe(undefined)
      console.log(rendered.result.current)
      const blockchainProviders = rendered.result.current?.plebbitOptions?.blockchainProviders

      // const res = await resolveSubplebbitAddress('plebbit.eth', blockchainProviders)
      // console.log(res)
      // const cachedRes = await resolveSubplebbitAddress('plebbit.eth', blockchainProviders)
      // console.log(cachedRes)

      const res = await Promise.all([resolveSubplebbitAddress('plebbit.eth', blockchainProviders), resolveSubplebbitAddress('plebbit.eth', blockchainProviders)])
      console.log(res)
    })
  })
})
