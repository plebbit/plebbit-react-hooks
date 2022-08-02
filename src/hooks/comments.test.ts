import {act, renderHook} from '@testing-library/react-hooks'
import testUtils from '../lib/test-utils'
import {useComment, useComments, setPlebbitJs, PlebbitProvider} from '..'
import PlebbitJsMock, {Plebbit, Comment} from '../lib/plebbit-js/plebbit-js-mock'
setPlebbitJs(PlebbitJsMock)

describe('comments', () => {
  beforeAll(() => {
    testUtils.silenceReactWarnings()
  })
  afterAll(() => {
    testUtils.restoreAll()
  })
  afterEach(async () => {
    await testUtils.resetDatabases()
    await testUtils.resetStores()
  })

  describe('no comments in database', () => {
    afterEach(async () => {
      await testUtils.resetDatabases()
      await testUtils.resetStores()
    })

    test('get comments one at a time', async () => {
      // on first render, the account is undefined because it's not yet loaded from database
      const rendered = renderHook<any, any>((commentCid) => useComment(commentCid), {wrapper: PlebbitProvider})
      const waitFor = testUtils.createWaitFor(rendered)
      expect(rendered.result.current).toBe(undefined)

      rendered.rerender('comment cid 1')
      await waitFor(() => typeof rendered.result.current.cid === 'string')
      expect(rendered.result.current.cid).toBe('comment cid 1')

      // wait for comment.on('update') to fetch the ipns
      await waitFor(() => typeof rendered.result.current.cid === 'string' && typeof rendered.result.current.upvoteCount === 'number')
      expect(rendered.result.current.cid).toBe('comment cid 1')
      expect(rendered.result.current.upvoteCount).toBe(3)

      rendered.rerender('comment cid 2')
      // wait for addCommentToStore action
      await waitFor(() => typeof rendered.result.current.cid === 'string')
      expect(rendered.result.current.cid).toBe('comment cid 2')

      // wait for comment.on('update') to fetch the ipns
      await waitFor(() => typeof rendered.result.current.cid === 'string' && typeof rendered.result.current.upvoteCount === 'number')
      expect(rendered.result.current.cid).toBe('comment cid 2')
      expect(rendered.result.current.upvoteCount).toBe(3)

      // get comment 1 again, no need to wait for any updates
      rendered.rerender('comment cid 1')
      expect(rendered.result.current.cid).toBe('comment cid 1')
      expect(rendered.result.current.upvoteCount).toBe(3)

      // make sure comments are still in database
      const getComment = Plebbit.prototype.getComment
      const simulateUpdateEvent = Comment.prototype.simulateUpdateEvent
      // mock getComment on the Plebbit class
      Plebbit.prototype.getComment = (commentCid) => {
        throw Error(`plebbit.getComment called with comment cid '${commentCid}' should not be called when getting comments from database`)
      }
      // don't simulate 'update' event during this test to see if the updates were saved to database
      let throwOnCommentUpdateEvent = false
      Comment.prototype.simulateUpdateEvent = () => {
        if (throwOnCommentUpdateEvent) {
          throw Error('no comment update events should be emitted when comment already in store')
        }
      }

      // reset stores to force using the db
      await testUtils.resetStores()
      await waitFor(() => rendered.result.current === undefined)

      // on first render, the account is undefined because it's not yet loaded from database
      const rendered2 = renderHook<any, any>((commentCid) => useComment(commentCid), {wrapper: PlebbitProvider})
      const waitFor2 = testUtils.createWaitFor(rendered2)
      expect(rendered2.result.current).toBe(undefined)

      rendered2.rerender('comment cid 1')
      await waitFor2(() => typeof rendered2.result.current.cid === 'string')
      expect(rendered2.result.current.cid).toBe('comment cid 1')
      expect(rendered2.result.current.upvoteCount).toBe(3)

      rendered2.rerender('comment cid 2')
      // wait for addCommentToStore action
      await waitFor2(() => typeof rendered2.result.current.cid === 'string')
      expect(rendered2.result.current.cid).toBe('comment cid 2')
      expect(rendered2.result.current.upvoteCount).toBe(3)

      // get comment 1 again from store, should not trigger any comment updates
      throwOnCommentUpdateEvent = true
      rendered2.rerender('comment cid 1')
      expect(rendered2.result.current.cid).toBe('comment cid 1')
      expect(rendered2.result.current.upvoteCount).toBe(3)

      // restore mock
      Comment.prototype.simulateUpdateEvent = simulateUpdateEvent
      Plebbit.prototype.getComment = getComment
    })

    test('get multiple comments at once', async () => {
      const rendered = renderHook<any, any>((commentCids) => useComments(commentCids), {wrapper: PlebbitProvider})
      const waitFor = testUtils.createWaitFor(rendered)
      expect(rendered.result.current).toEqual([])

      rendered.rerender(['comment cid 1', 'comment cid 2', 'comment cid 3'])
      expect(rendered.result.current).toEqual([undefined, undefined, undefined])
      await waitFor(
        () =>
          typeof rendered.result.current[0].cid === 'string' && typeof rendered.result.current[1].cid === 'string' && typeof rendered.result.current[2].cid === 'string'
      )
      expect(rendered.result.current[0].cid).toBe('comment cid 1')
      expect(rendered.result.current[1].cid).toBe('comment cid 2')
      expect(rendered.result.current[2].cid).toBe('comment cid 3')

      // wait for comment.on('update') to fetch the ipns
      await waitFor(
        () =>
          typeof rendered.result.current[0].upvoteCount === 'number' &&
          typeof rendered.result.current[1].upvoteCount === 'number' &&
          typeof rendered.result.current[2].upvoteCount === 'number'
      )
      expect(rendered.result.current[0].upvoteCount).toBe(3)
      expect(rendered.result.current[1].upvoteCount).toBe(3)
      expect(rendered.result.current[2].upvoteCount).toBe(3)
    })
  })
})
