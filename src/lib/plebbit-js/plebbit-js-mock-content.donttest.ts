// this file is not part of the tests
// only use it to log the content mock and see if the outputs make sense
// use `jest --testRegex plebbit-js-mock-content.donttest.ts` to run

jest.setTimeout(60000)

// process.env.REACT_APP_PLEBBIT_REACT_HOOKS_NO_CACHE = '1'
process.env.REACT_APP_PLEBBIT_REACT_HOOKS_MOCK_CONTENT = '1'
process.env.REACT_APP_PLEBBIT_REACT_HOOKS_MOCK_CONTENT_LOADING_TIME = '1000'

import {act, renderHook} from '@testing-library/react-hooks'
import testUtils from '../../lib/test-utils'
import {useComment, useSubplebbit, useFeed, useAccountsActions, useAccountSubplebbits} from '../../index'
import localForageLru from '../../lib/localforage-lru'
import localForage from 'localforage'

describe('mock content', () => {
  beforeAll(() => {
    testUtils.silenceReactWarnings()
  })
  afterAll(() => {
    testUtils.restoreAll()
  })

  afterEach(async () => {
    await testUtils.resetDatabasesAndStores()
  })

  test('use comments', async () => {
    const rendered = renderHook<any, any>((commentCid) => useComment(commentCid))
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

  test.only('use subplebbits', async () => {
    const rendered = renderHook<any, any>((subplebbitAddress) => useSubplebbit(subplebbitAddress))
    expect(rendered.result.current).toBe(undefined)
    rendered.rerender('anything2.eth')
    try {
      await rendered.waitFor(() => typeof rendered.result.current.address === 'string', {timeout: 60000})
    } catch (e) {
      console.error(e)
    }
    // console.log(rendered.result.current?.posts?.pages?.hot?.comments)
    console.log(rendered.result.current)

    rendered.rerender('jokes2.eth')
    try {
      await rendered.waitFor(() => typeof rendered.result.current.address === 'string', {timeout: 60000})
    } catch (e) {
      console.error(e)
    }
    // console.log(rendered.result.current?.posts?.pages?.hot?.comments)
    console.log(rendered.result.current)

    rendered.rerender('memes2.eth')
    try {
      await rendered.waitFor(() => typeof rendered.result.current.address === 'string', {timeout: 60000})
    } catch (e) {
      console.error(e)
    }
    // console.log(rendered.result.current?.posts?.pages?.hot?.comments)
    console.log(rendered.result.current)
  })

  test('use account subplebbits', async () => {
    const rendered = renderHook<any, any>(() => {
      const {createSubplebbit} = useAccountsActions()
      const accountSubplebbits = useAccountSubplebbits()
      return {createSubplebbit, accountSubplebbits}
    })

    try {
      await rendered.waitFor(() => typeof rendered.result.current?.createSubplebbit === 'function', {timeout: 60000})
    } catch (e) {
      console.error(e)
    }
    console.log(rendered.result.current?.accountSubplebbits)

    console.log('creating subplebbit')
    const subplebbit = await rendered.result.current.createSubplebbit({
      title: 'title',
      description: 'description',
    })
    console.log({subplebbit})

    // wait for account subplebbits
    try {
      await rendered.waitFor(() => JSON.stringify(rendered.result.current?.accountSubplebbits) !== '{}', {timeout: 60000})
    } catch (e) {
      console.error(e)
    }
    const previousAccountSubplebbits = rendered.result.current?.accountSubplebbits
    console.log(rendered.result.current?.accountSubplebbits)

    console.log('editing subplebbit')
    await subplebbit.edit({
      address: 'name.eth',
    })
    console.log({subplebbit})

    // wait for account subplebbits address update
    try {
      await rendered.waitFor(() => JSON.stringify(rendered.result.current?.accountSubplebbits) !== JSON.stringify(previousAccountSubplebbits), {timeout: 60000})
    } catch (e) {
      console.error(e)
    }
    console.log(rendered.result.current?.accountSubplebbits)
  })

  test.only('use feed', async () => {
    const rendered = renderHook<any, any>((subplebbitAddresses) => useFeed(subplebbitAddresses, 'new'))
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

  test('publish', async () => {
    const rendered = renderHook<any, any>(() => useAccountsActions())

    try {
      await rendered.waitFor(() => typeof rendered.result.current.publishComment === 'function', {timeout: 60000})
    } catch (e) {
      console.error(e)
    }

    console.log('publishing comment')
    let onChallengeVerificationCalled = false
    const onChallenge = (challenge: any, comment: any) => {
      console.log('challenge', challenge)
      comment.publishChallengeAnswers(['some answer...'])
    }
    const onChallengeVerification = (...args: any) => {
      console.log('challengeverification', args)
      onChallengeVerificationCalled = true
    }
    await rendered.result.current.publishComment({
      subplebbitAddress: 'news.eth',
      content: 'content',
      title: 'title',
      onChallenge,
      onChallengeVerification,
    })

    try {
      await rendered.waitFor(() => onChallengeVerificationCalled, {timeout: 60000})
    } catch (e) {
      console.error(e)
    }

    console.log('publishing vote')
    onChallengeVerificationCalled = false
    await rendered.result.current.publishVote({
      subplebbitAddress: 'news.eth',
      vote: 1,
      commentCid: 'some cid...',
      onChallenge,
      onChallengeVerification,
    })

    try {
      await rendered.waitFor(() => onChallengeVerificationCalled, {timeout: 60000})
    } catch (e) {
      console.error(e)
    }
  })

  test('create subplebbit', async () => {
    const rendered = renderHook<any, any>(() => useAccountsActions())

    try {
      await rendered.waitFor(() => typeof rendered.result.current.createSubplebbit === 'function', {timeout: 60000})
    } catch (e) {
      console.error(e)
    }

    console.log('creating subplebbit')
    const subplebbit = await rendered.result.current.createSubplebbit({
      title: 'title',
      description: 'description',
    })
    console.log({subplebbit})

    console.log('editing subplebbit')
    await subplebbit.edit({
      address: 'name.eth',
    })
    console.log({subplebbit})
  })
})
