import {act, renderHook} from '@testing-library/react-hooks'
import testUtils from '../lib/test-utils'
import {useSubplebbit, useSubplebbitStats, useSubplebbits, setPlebbitJs, useResolvedSubplebbitAddress, useAccount} from '..'
import subplebbitStore from '../stores/subplebbits'
import subplebbitsPagesStore from '../stores/subplebbits-pages'
import {useListSubplebbits, resolveSubplebbitAddress} from './subplebbits'
import PlebbitJsMock, {Plebbit, Subplebbit} from '../lib/plebbit-js/plebbit-js-mock'
import utils from '../lib/utils'

describe('subplebbits', () => {
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

  describe('no subplebbits in database', () => {
    afterEach(async () => {
      await testUtils.resetDatabasesAndStores()
    })

    test('get subplebbits one at a time', async () => {
      const rendered = renderHook<any, any>((subplebbitAddress) => useSubplebbit({subplebbitAddress}))
      const waitFor = testUtils.createWaitFor(rendered)

      expect(rendered.result.current.address).toBe(undefined)
      rendered.rerender('subplebbit address 1')
      await waitFor(() => typeof rendered.result.current.title === 'string')

      expect(typeof rendered.result.current.fetchedAt).toBe('number')
      expect(rendered.result.current.address).toBe('subplebbit address 1')
      expect(rendered.result.current.title).toBe('subplebbit address 1 title')
      // wait for subplebbit.on('update') to fetch the updated description
      await waitFor(() => typeof rendered.result.current.description === 'string')

      expect(rendered.result.current.description).toBe('subplebbit address 1 description updated')

      rendered.rerender('subplebbit address 2')
      await waitFor(() => typeof rendered.result.current.title === 'string')

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
      const simulateUpdateEvent = Subplebbit.prototype.simulateUpdateEvent
      // don't simulate 'update' event during this test to see if the updates were saved to database
      let throwOnSubplebbitUpdateEvent = false
      Subplebbit.prototype.simulateUpdateEvent = () => {
        if (throwOnSubplebbitUpdateEvent) {
          throw Error('no subplebbit update events should be emitted when subplebbit already in store')
        }
      }

      // subplebbitsPagesStore has preloaded subplebbit comments
      expect(rendered.result.current.posts.pages.hot.comments.length).toBeGreaterThan(0)
      const subplebbitsPagesStoreComments = subplebbitsPagesStore.getState().comments
      for (const comment of rendered.result.current.posts.pages.hot.comments) {
        expect(typeof comment.cid).toBe('string')
        expect(subplebbitsPagesStoreComments[comment.cid].cid).toBe(comment.cid)
      }

      // reset stores to force using the db
      expect(subplebbitStore.getState().subplebbits).not.toEqual({})
      await testUtils.resetStores()
      expect(subplebbitStore.getState().subplebbits).toEqual({})
      expect(subplebbitsPagesStore.getState().comments).toEqual({})

      // on first render, the account is undefined because it's not yet loaded from database
      const rendered2 = renderHook<any, any>((subplebbitAddress) => useSubplebbit({subplebbitAddress}))
      expect(rendered2.result.current.address).toBe(undefined)
      rendered2.rerender('subplebbit address 1')
      // wait to get account loaded
      await waitFor(() => rendered2.result.current.address === 'subplebbit address 1')

      expect(typeof rendered2.result.current.fetchedAt).toBe('number')
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

      // subplebbitsPagesStore has preloaded subplebbit comments
      expect(rendered2.result.current.posts.pages.hot.comments.length).toBeGreaterThan(0)
      const subplebbitsPagesStoreComments2 = subplebbitsPagesStore.getState().comments
      for (const comment of rendered2.result.current.posts.pages.hot.comments) {
        expect(typeof comment.cid).toBe('string')
        expect(subplebbitsPagesStoreComments2[comment.cid].cid).toBe(comment.cid)
      }

      // restore mock
      Subplebbit.prototype.simulateUpdateEvent = simulateUpdateEvent
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

    test('has updating state', async () => {
      const rendered = renderHook<any, any>((subplebbitAddress) => useSubplebbit({subplebbitAddress}))
      const waitFor = testUtils.createWaitFor(rendered)
      rendered.rerender('subplebbit address')

      await waitFor(() => rendered.result.current.state === 'fetching-ipns')
      expect(rendered.result.current.state).toBe('fetching-ipns')

      await waitFor(() => rendered.result.current.state === 'succeeded')
      expect(rendered.result.current.state).toBe('succeeded')
    })

    test('has error events', async () => {
      // mock update to save subplebbit instance
      const subplebbitUpdate = Subplebbit.prototype.update
      const updatingSubplebbits: any = []
      Subplebbit.prototype.update = function () {
        updatingSubplebbits.push(this)
        return subplebbitUpdate.bind(this)()
      }

      const rendered = renderHook<any, any>((subplebbitAddress) => useSubplebbit({subplebbitAddress}))
      const waitFor = testUtils.createWaitFor(rendered)
      rendered.rerender('subplebbit address')

      // emit error event
      await waitFor(() => updatingSubplebbits.length > 0)
      updatingSubplebbits[0].emit('error', Error('error 1'))

      // first error
      await waitFor(() => rendered.result.current.error.message === 'error 1')
      expect(rendered.result.current.error.message).toBe('error 1')
      expect(rendered.result.current.errors[0].message).toBe('error 1')
      expect(rendered.result.current.errors.length).toBe(1)

      // second error
      updatingSubplebbits[0].emit('error', Error('error 2'))
      await waitFor(() => rendered.result.current.error.message === 'error 2')
      expect(rendered.result.current.error.message).toBe('error 2')
      expect(rendered.result.current.errors[0].message).toBe('error 1')
      expect(rendered.result.current.errors[1].message).toBe('error 2')
      expect(rendered.result.current.errors.length).toBe(2)

      // restore mock
      Subplebbit.prototype.update = subplebbitUpdate
    })
  })

  test('useListSubplebbits', async () => {
    const rendered = renderHook<any, any>(() => useListSubplebbits())
    const waitFor = testUtils.createWaitFor(rendered)
    await waitFor(() => rendered.result.current.length > 0)
    expect(rendered.result.current).toEqual(['list subplebbit address 1', 'list subplebbit address 2'])
  })

  test('useSubplebbitStats', async () => {
    const rendered = renderHook<any, any>(() => useSubplebbitStats({subplebbitAddress: 'address 1'}))
    const waitFor = testUtils.createWaitFor(rendered)
    await waitFor(() => rendered.result.current.hourActiveUserCount)
    expect(rendered.result.current.hourActiveUserCount).toBe(1)
  })

  describe('subplebbit address', () => {
    const timeout = 60000

    // skip because uses internet and not deterministic
    test.skip(
      'useResolvedSubplebbitAddress',
      async () => {
        const rendered = renderHook<any, any>((subplebbitAddress) => useResolvedSubplebbitAddress({subplebbitAddress}))
        const waitFor = testUtils.createWaitFor(rendered, {timeout})
        expect(rendered.result.current.resolvedAddress).toBe(undefined)

        rendered.rerender('plebbit.eth')
        await waitFor(() => typeof rendered.result.current.resolvedAddress === 'string')
        expect(rendered.result.current.resolvedAddress).toBe('QmW5Zt7YXmtskSUjjenGNS3QNRbjqjUPaT35zw5RYUCtY1')
      },
      {timeout}
    )

    test(
      'useResolvedSubplebbitAddress unsupported crypto domain',
      async () => {
        const rendered = renderHook<any, any>((subplebbitAddress) => useResolvedSubplebbitAddress({subplebbitAddress}))
        const waitFor = testUtils.createWaitFor(rendered)
        expect(rendered.result.current.resolvedAddress).toBe(undefined)

        rendered.rerender('plebbit.com')
        await waitFor(() => rendered.result.current.error)
        expect(rendered.result.current.error.message).toBe('crypto domain type unsupported')
      },
      {timeout}
    )

    test(
      'useResolvedSubplebbitAddress not a crypto domain',
      async () => {
        const rendered = renderHook<any, any>((subplebbitAddress) => useResolvedSubplebbitAddress({subplebbitAddress}))
        const waitFor = testUtils.createWaitFor(rendered)
        expect(rendered.result.current.resolvedAddress).toBe(undefined)

        rendered.rerender('abc')
        await waitFor(() => rendered.result.current.error)
        expect(rendered.result.current.error.message).toBe('not a crypto domain')
      },
      {timeout}
    )
  })
})
