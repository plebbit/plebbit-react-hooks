import { act, renderHook } from '@testing-library/react-hooks'
import testUtils from '../lib/test-utils'
import { useFeed } from '../index'
import PlebbitProvider from '../providers/PlebbitProvider'
import localForageLru from '../lib/localforage-lru'
import localForage from 'localforage'
import PlebbitJsMock, { mockPlebbitJs, Plebbit, Subplebbit } from '../lib/plebbit-js/plebbit-js-mock'
mockPlebbitJs(PlebbitJsMock)

const deleteDatabases = () => Promise.all([
  localForage.createInstance({ name: 'accountsMetadata' }).clear(),
  localForage.createInstance({ name: 'accounts' }).clear(),
  localForageLru.createInstance({ name: 'subplebbits' }).clear(),
  localForageLru.createInstance({ name: 'comments' }).clear()
])

describe('feeds', () => {
  beforeAll(() => {
    testUtils.silenceUpdateUnmountedComponentWarning()
  })
  afterAll(() => {
    testUtils.restoreAll()
  })

  describe('get feed sorted by default', () => {
    let rendered: any
    beforeEach(async () => {
      // @ts-ignore
      rendered = renderHook<any, any>((subplebbitAddresses, sortedBy, accountName) => useFeed(subplebbitAddresses, sortedBy, accountName), { wrapper: PlebbitProvider })
      // wait for account to init
      await rendered.waitForNextUpdate()
    })
    afterEach(async () => {
      await deleteDatabases()
    })

    test('get feed with no arguments', async () => {
      expect(rendered.result.current.feed).toBe(undefined)
      expect(typeof rendered.result.current.hasMore).toBe('boolean')
      expect(typeof rendered.result.current.loadMore).toBe('function')
    })

    test('get feed with 1 subplebbit', async () => {
      // get feed with 1 sub
      rendered.rerender(['subplebbit address 1'])
      // initial state
      expect(typeof rendered.result.current.hasMore).toBe('boolean')
      expect(typeof rendered.result.current.loadMore).toBe('function')

      // wait for feed array to render
      await rendered.waitFor(() => Array.isArray(rendered.result.current.feed))
      expect(rendered.result.current.feed).toEqual([])

      // wait for posts to be added
      await rendered.waitFor(() => rendered.result.current.feed.length > 0)
      expect(rendered.result.current.feed[0].cid).toBe('subplebbit address 1 sorted post cid 1')

      // get feed again from database, only wait for 1 render because subplebbit is stored in db
      const rendered2 = renderHook<any, any>(() => useFeed(['subplebbit address 1']), { wrapper: PlebbitProvider })
      expect(rendered2.result.current.feed).toBe(undefined)
      // only wait for 1 render because subplebbit is stored in db
      await rendered2.waitForNextUpdate()
      expect(rendered2.result.current.feed[0].cid).toBe('subplebbit address 1 sorted post cid 1')
    })

    test.todo('get feed sorted by top')

    test.todo(`fail to get feed sorted by something that doesn't exist`)
  })
})
