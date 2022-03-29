// this file is not part of the tests
// only use it to log the content mock and see if the outputs make sense
// use `jest --testRegex plebbit-js-mock-content.donttest.ts` to run

jest.setTimeout(60000)

process.env.REACT_APP_PLEBBIT_REACT_HOOKS_MOCK_CONTENT = '1'
process.env.REACT_APP_PLEBBIT_REACT_HOOKS_MOCK_CONTENT_LOADING_TIME = '1000'

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
    localForageLru.createInstance({ name: 'subplebbitsPages' }).clear(),
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
      await rendered.waitFor(() => typeof rendered.result.current.cid === 'string', {timeout: 60000})
    } catch (e) {
      console.error(e)
    }
    console.log(rendered.result.current)
    try {
      await rendered.waitFor(() => typeof rendered.result.current.upvoteCount === 'number', {timeout: 60000})
    } catch (e) {
      console.error(e)
    }
    console.log(rendered.result.current)

    rendered.rerender('QmXxWyFRBUReRNzyJueFLFh84Mtj7ycbySktRQ5ffZLVa1')
    try {
      await rendered.waitFor(() => typeof rendered.result.current.cid === 'string', {timeout: 60000})
    } catch (e) {
      console.error(e)
    }
    console.log(rendered.result.current)

    rendered.rerender('QmXxWyFRBUReRNzyJueFLFh84Mtj7ycbySktRQ5ffZLVa2')
    try {
      await rendered.waitFor(() => typeof rendered.result.current.cid === 'string', {timeout: 60000})
    } catch (e) {
      console.error(e)
    }
    console.log(rendered.result.current)

    rendered.rerender('QmXxWyFRBUReRNzyJueFLFh84Mtj7ycbySktRQ5ffZLVa3')
    try {
      await rendered.waitFor(() => typeof rendered.result.current.cid === 'string', {timeout: 60000})
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
    rendered.rerender('anything.eth')
    try {
      await rendered.waitFor(() => typeof rendered.result.current.address === 'string', {timeout: 60000})
    } catch (e) {
      console.error(e)
    }
    // console.log(rendered.result.current?.posts?.pages?.hot?.comments)
    console.log(rendered.result.current)

    rendered.rerender('jokes.eth')
    try {
      await rendered.waitFor(() => typeof rendered.result.current.address === 'string', {timeout: 60000})
    } catch (e) {
      console.error(e)
    }
    // console.log(rendered.result.current?.posts?.pages?.hot?.comments)
    console.log(rendered.result.current)

    rendered.rerender('memes.eth')
    try {
      await rendered.waitFor(() => typeof rendered.result.current.address === 'string', {timeout: 60000})
    } catch (e) {
      console.error(e)
    }
    // console.log(rendered.result.current?.posts?.pages?.hot?.comments)
    console.log(rendered.result.current)
  })

  test.only('use feed', async () => {
    const rendered = renderHook<any, any>((subplebbitAddresses) => useFeed(subplebbitAddresses, 'new'), {
      wrapper: PlebbitProvider,
    })
    const scrollOnePage = async () => {
      const nextFeedLength = (rendered.result.current.feed?.length || 0) + 25
      act(() => {
        rendered.result.current.loadMore()
      })
      try {
        await rendered.waitFor(() => rendered.result.current.feed?.length >= nextFeedLength, {timeout: 60000})
      } catch (e) {
        console.error('scrollOnePage failed:', e)
      }
    }

    rendered.rerender(['jokes.eth', 'news.eth'])
    try {
      await rendered.waitFor(() => rendered.result.current.feed?.length > 0, {timeout: 60000})
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
