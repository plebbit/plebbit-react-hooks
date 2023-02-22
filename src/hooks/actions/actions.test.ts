import {act, renderHook} from '@testing-library/react-hooks'
import testUtils from '../../lib/test-utils'
import {useSubscribe, usePublishComment, setPlebbitJs} from '../..'
import PlebbitJsMock, {Plebbit, Comment, Subplebbit, Pages, resetPlebbitJsMock, debugPlebbitJsMock} from '../../lib/plebbit-js/plebbit-js-mock'
setPlebbitJs(PlebbitJsMock)

describe('actions', () => {
  beforeAll(() => {
    testUtils.silenceReactWarnings()
  })
  afterAll(() => {
    testUtils.restoreAll()
  })

  describe('useSubscribe', () => {
    let rendered: any, waitFor: Function

    beforeEach(async () => {
      rendered = renderHook<any, any>((useSubscribeOptionsArray = []) => {
        const result1 = useSubscribe(useSubscribeOptionsArray[0])
        const result2 = useSubscribe(useSubscribeOptionsArray[1])
        return [result1, result2]
      })
      waitFor = testUtils.createWaitFor(rendered)
    })

    afterEach(async () => {
      await testUtils.resetDatabasesAndStores()
    })

    test(`subscribe and unsubscribe to subplebbit`, async () => {
      const subplebbitAddress = 'tosubscribeto.eth'
      const subplebbitAddress2 = 'tosubscribeto2.eth'

      expect(rendered.result.current[0].state).toBe('initializing')
      expect(rendered.result.current[0].subscribed).toBe(undefined)
      expect(typeof rendered.result.current[0].subscribe).toBe('function')
      expect(typeof rendered.result.current[0].unsubscribe).toBe('function')

      // get the default value
      rendered.rerender([{subplebbitAddress}])
      await waitFor(() => typeof rendered.result.current[0].subscribed === 'boolean')
      expect(rendered.result.current[0].state).toBe('ready')
      expect(rendered.result.current[0].subscribed).toBe(false)

      // subscribe to 1 sub
      await act(async () => {
        await rendered.result.current[0].subscribe()
      })
      await waitFor(() => rendered.result.current[0].subscribed === true)
      expect(rendered.result.current[0].subscribed).toEqual(true)

      // fail subscribing twice
      expect(rendered.result.current[0].errors.length).toBe(0)
      await act(async () => {
        await rendered.result.current[0].subscribe()
      })
      expect(rendered.result.current[0].errors.length).toBe(1)

      // unsubscribe
      await act(async () => {
        await rendered.result.current[0].unsubscribe()
      })
      await waitFor(() => rendered.result.current[0].subscribed === false)
      expect(rendered.result.current[0].subscribed).toEqual(false)

      // fail unsubscribing twice
      expect(rendered.result.current[0].errors.length).toBe(1)
      await act(async () => {
        await rendered.result.current[0].unsubscribe()
      })
      expect(rendered.result.current[0].errors.length).toBe(2)

      // subscribe to 2 subs
      rendered.rerender([{subplebbitAddress}, {subplebbitAddress: subplebbitAddress2}])
      await waitFor(() => rendered.result.current[0].state === 'ready')
      await waitFor(() => rendered.result.current[1].state === 'ready')
      expect(rendered.result.current[0].state).toBe('ready')
      expect(rendered.result.current[1].state).toBe('ready')
      expect(rendered.result.current[0].subscribed).toBe(false)
      expect(rendered.result.current[1].subscribed).toBe(false)

      await act(async () => {
        await rendered.result.current[0].subscribe()
        await rendered.result.current[1].subscribe()
      })
      await waitFor(() => rendered.result.current[0].subscribed === true)
      await waitFor(() => rendered.result.current[1].subscribed === true)
      expect(rendered.result.current[0].subscribed).toBe(true)
      expect(rendered.result.current[1].subscribed).toBe(true)

      // unsubscribe with 2 subs
      await act(async () => {
        await rendered.result.current[0].unsubscribe()
      })
      await waitFor(() => rendered.result.current[0].subscribed === false)
      expect(rendered.result.current[0].subscribed).toBe(false)
      expect(rendered.result.current[1].subscribed).toBe(true)

      // reset stores to force using the db
      await testUtils.resetStores()

      // subscribing persists in database after store reset
      const rendered2 = renderHook<any, any>(() => useSubscribe({subplebbitAddress: subplebbitAddress2}))
      const waitFor2 = testUtils.createWaitFor(rendered2)
      await waitFor(() => rendered.result.current.state === 'ready')
      expect(rendered.result.current[1].subscribed).toBe(true)
    })
  })

  describe('usePublishComment', () => {
    let rendered: any, waitFor: Function

    beforeEach(async () => {
      rendered = renderHook<any, any>((options) => {
        const result = usePublishComment(options)
        return result
      })
      waitFor = testUtils.createWaitFor(rendered)
    })

    afterEach(async () => {
      await testUtils.resetDatabasesAndStores()
    })

    test(`can publish comment`, async () => {
      const publishCommentOptions = {
        subplebbitAddress: 'Qm...',
        parentCid: 'Qm...',
        content: 'some content',
      }
      rendered.rerender(publishCommentOptions)

      // wait for ready
      await waitFor(() => rendered.result.current.state === 'ready')
      expect(rendered.result.current.state).toBe('ready')

      // publish
      await act(async () => {
        await rendered.result.current.publishComment()
      })

      // wait for challenge
      await waitFor(() => rendered.result.current.state === 'waiting-challenge')
      expect(rendered.result.current.state).toBe('waiting-challenge')
      await waitFor(() => rendered.result.current.challenge)
      expect(rendered.result.current.error).toBe(undefined)
      expect(rendered.result.current.challenge.challenges).toEqual([{challenge: '2+2=?', type: 'text'}])

      // publish challenge verification
      await act(async () => {
        await rendered.result.current.publishChallengeAnswers(['4'])
      })

      // wait for challenge verification
      await waitFor(() => rendered.result.current.challengeVerification)
      expect(rendered.result.current.state).toBe('succeeded')
      expect(rendered.result.current.challengeVerification.challengeSuccess).toBe(true)
      expect(rendered.result.current.error).toBe(undefined)
    })
  })
})
