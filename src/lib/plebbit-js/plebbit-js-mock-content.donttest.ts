// this file is not part of the tests
// only use it to log the content mock and see if the outputs make sense
// use `jest --testRegex plebbit-js-mock-content.donttest.ts` to run

process.env.REACT_APP_PLEBBIT_REACT_HOOKS_MOCK_CONTENT = '1'
process.env.REACT_APP_PLEBBIT_REACT_HOOKS_MOCK_CONTENT_LOADING_TIME = '100'

import { act, renderHook } from '@testing-library/react-hooks'
import testUtils from '../../lib/test-utils'
import { useComment, useSubplebbit, useFeed } from '../../index'
import PlebbitProvider from '../../providers/plebbit-provider'
import localForageLru from '../../lib/localforage-lru'
import localForage from 'localforage'

const deleteDatabases = () =>
  Promise.all([
    localForage.createInstance({ name: 'accountsMetadata' }).clear(),
    localForage.createInstance({ name: 'accounts' }).clear(),
    localForageLru.createInstance({ name: 'subplebbits' }).clear(),
    localForageLru.createInstance({ name: 'comments' }).clear(),
    localForageLru.createInstance({ name: 'sortedPosts' }).clear(),
  ])

describe('mock content', () => {
  beforeAll(() => {
    testUtils.silenceUpdateUnmountedComponentWarning()
  })
  afterAll(() => {
    testUtils.restoreAll()
  })

  afterEach(async () => {
    await deleteDatabases()
  })

  test('use comments', async () => {
    const rendered = renderHook<any, any>((commentCid) => useComment(commentCid), { wrapper: PlebbitProvider })
    expect(rendered.result.current).toBe(undefined)
    rendered.rerender('QmXxWyFRBUReRNzyJueFLFh84Mtj7ycbySktRQ5ffZLVa0')
    try {
      await rendered.waitFor(() => typeof rendered.result.current.cid === 'string')
    } catch (e) {
      console.error(e)
    }
    console.log(rendered.result.current)
    try {
      await rendered.waitFor(() => typeof rendered.result.current.upvoteCount === 'number')
    } catch (e) {
      console.error(e)
    }
    console.log(rendered.result.current)

    rendered.rerender('QmXxWyFRBUReRNzyJueFLFh84Mtj7ycbySktRQ5ffZLVa1')
    try {
      await rendered.waitFor(() => typeof rendered.result.current.cid === 'string')
    } catch (e) {
      console.error(e)
    }
    console.log(rendered.result.current)

    rendered.rerender('QmXxWyFRBUReRNzyJueFLFh84Mtj7ycbySktRQ5ffZLVa2')
    try {
      await rendered.waitFor(() => typeof rendered.result.current.cid === 'string')
    } catch (e) {
      console.error(e)
    }
    console.log(rendered.result.current)

    rendered.rerender('QmXxWyFRBUReRNzyJueFLFh84Mtj7ycbySktRQ5ffZLVa3')
    try {
      await rendered.waitFor(() => typeof rendered.result.current.cid === 'string')
    } catch (e) {
      console.error(e)
    }
    console.log(rendered.result.current)
  })

  test('use subplebbits', async () => {
    const rendered = renderHook<any, any>((subplebbitAddress) => useSubplebbit(subplebbitAddress), {
      wrapper: PlebbitProvider,
    })
    expect(rendered.result.current).toBe(undefined)
    rendered.rerender('memes.eth')
    try {
      await rendered.waitFor(() => typeof rendered.result.current.address === 'string')
    } catch (e) {
      console.error(e)
    }
    console.log(rendered.result.current)
    console.log(rendered.result.current.sortedPosts.hot.comments)
  })

  test('use feed', async () => {
    const rendered = renderHook<any, any>((subplebbitAddresses) => useFeed(subplebbitAddresses, 'new'), {
      wrapper: PlebbitProvider,
    })
    const scrollOnePage = async () => {
      const nextFeedLength = (rendered.result.current.feed?.length || 0) + 25
      act(() => {
        rendered.result.current.loadMore()
      })
      try {
        await rendered.waitFor(() => rendered.result.current.feed?.length >= nextFeedLength)
      } catch (e) {
        console.error('scrollOnePage failed:', e)
      }
    }

    rendered.rerender(['memes.eth', 'news.eth'])
    try {
      await rendered.waitFor(() => rendered.result.current.feed?.length > 0)
    } catch (e) {
      console.error(e)
    }
    await scrollOnePage()
    await scrollOnePage()
    await scrollOnePage()
    await scrollOnePage()
    await scrollOnePage()
    await scrollOnePage()
    await scrollOnePage()
    console.log(rendered.result.current)
  })
})
