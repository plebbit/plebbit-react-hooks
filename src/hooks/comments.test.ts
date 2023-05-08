import {act, renderHook} from '@testing-library/react-hooks'
import testUtils from '../lib/test-utils'
import {useComment, useComments, setPlebbitJs} from '..'
import commentsStore from '../stores/comments'
import subplebbitsPagesStore from '../stores/subplebbits-pages'
import PlebbitJsMock, {Plebbit, Comment} from '../lib/plebbit-js/plebbit-js-mock'
import utils from '../lib/utils'
setPlebbitJs(PlebbitJsMock)

describe('comments', () => {
  beforeAll(() => {
    testUtils.silenceReactWarnings()
  })
  afterAll(() => {
    testUtils.restoreAll()
  })
  afterEach(async () => {
    await testUtils.resetDatabasesAndStores()
  })

  describe('no comments in database', () => {
    afterEach(async () => {
      await testUtils.resetDatabasesAndStores()
    })

    test('get comments one at a time', async () => {
      // on first render, the account is undefined because it's not yet loaded from database
      const rendered = renderHook<any, any>((commentCid) => useComment({commentCid}))
      const waitFor = testUtils.createWaitFor(rendered)
      expect(rendered.result.current.cid).toBe(undefined)

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
      expect(commentsStore.getState().comments).not.toEqual({})
      await testUtils.resetStores()
      expect(commentsStore.getState().comments).toEqual({})

      // on first render, the account is undefined because it's not yet loaded from database
      const rendered2 = renderHook<any, any>((commentCid) => useComment({commentCid}))
      const waitFor2 = testUtils.createWaitFor(rendered2)
      expect(rendered2.result.current.cid).toBe(undefined)

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
      const rendered = renderHook<any, any>((commentCids) => useComments({commentCids}))
      const waitFor = testUtils.createWaitFor(rendered)
      expect(rendered.result.current.comments).toEqual([])

      rendered.rerender(['comment cid 1', 'comment cid 2', 'comment cid 3'])
      expect(rendered.result.current.comments).toEqual([undefined, undefined, undefined])
      await waitFor(
        () =>
          typeof rendered.result.current.comments[0].cid === 'string' &&
          typeof rendered.result.current.comments[1].cid === 'string' &&
          typeof rendered.result.current.comments[2].cid === 'string'
      )
      expect(rendered.result.current.comments[0].cid).toBe('comment cid 1')
      expect(rendered.result.current.comments[1].cid).toBe('comment cid 2')
      expect(rendered.result.current.comments[2].cid).toBe('comment cid 3')

      // wait for comment.on('update') to fetch the ipns
      await waitFor(
        () =>
          typeof rendered.result.current.comments[0].upvoteCount === 'number' &&
          typeof rendered.result.current.comments[1].upvoteCount === 'number' &&
          typeof rendered.result.current.comments[2].upvoteCount === 'number'
      )
      expect(rendered.result.current.comments[0].upvoteCount).toBe(3)
      expect(rendered.result.current.comments[1].upvoteCount).toBe(3)
      expect(rendered.result.current.comments[2].upvoteCount).toBe(3)
    })

    test('get comment from subplebbit pages', async () => {
      // on first render, the account is undefined because it's not yet loaded from database
      const rendered = renderHook<any, any>((commentCid) => useComment({commentCid}))
      const waitFor = testUtils.createWaitFor(rendered)
      expect(rendered.result.current.cid).toBe(undefined)

      rendered.rerender('comment cid 1')
      await waitFor(() => typeof rendered.result.current.cid === 'string')
      expect(rendered.result.current.cid).toBe('comment cid 1')
      expect(rendered.result.current.replyCount).toBe(undefined)

      // mock getting a subplebbit page with an updated comment
      const subplebbitsPagesComment = {
        ...rendered.result.current,
        replyCount: 100,
        updatedAt: Math.round(Date.now() / 1000) + 60, // 1 minute in the future to make sure it's more recent
      }
      act(() => {
        subplebbitsPagesStore.setState((state: any) => ({comments: {'comment cid 1': subplebbitsPagesComment}}))
      })

      // using the subplebbit page comment
      await waitFor(() => rendered.result.current.replyCount === 100)
      expect(rendered.result.current.replyCount).toBe(100)
    })

    test('get comments from subplebbit pages', async () => {
      const rendered = renderHook<any, any>((commentCids) => useComments({commentCids}))
      const waitFor = testUtils.createWaitFor(rendered)
      expect(rendered.result.current.comments).toEqual([])

      rendered.rerender(['comment cid 1', 'comment cid 2', 'comment cid 3'])
      expect(rendered.result.current.comments).toEqual([undefined, undefined, undefined])
      await waitFor(
        () =>
          typeof rendered.result.current.comments[0].cid === 'string' &&
          typeof rendered.result.current.comments[1].cid === 'string' &&
          typeof rendered.result.current.comments[2].cid === 'string'
      )
      expect(rendered.result.current.comments[0].cid).toBe('comment cid 1')
      expect(rendered.result.current.comments[1].cid).toBe('comment cid 2')
      expect(rendered.result.current.comments[2].cid).toBe('comment cid 3')
      expect(rendered.result.current.comments[1].replyCount).toBe(undefined)

      // mock getting a subplebbit page with an updated comment
      const subplebbitsPagesComment = {...rendered.result.current.comments[1], replyCount: 100, updatedAt: Math.round(Date.now() / 1000) + 60}
      act(() => {
        subplebbitsPagesStore.setState((state: any) => ({comments: {'comment cid 2': subplebbitsPagesComment}}))
      })

      // using the subplebbit page comment
      await waitFor(() => rendered.result.current.comments[1].replyCount === 100)
      expect(rendered.result.current.comments[1].replyCount).toBe(100)
    })

    test('has updating state', async () => {
      const rendered = renderHook<any, any>((commentCid) => useComment({commentCid}))
      const waitFor = testUtils.createWaitFor(rendered)
      rendered.rerender('comment cid')

      await waitFor(() => rendered.result.current.state === 'fetching-ipfs')
      expect(rendered.result.current.state).toBe('fetching-ipfs')

      await waitFor(() => rendered.result.current.state === 'fetching-update-ipns')
      expect(rendered.result.current.state).toBe('fetching-update-ipns')

      await waitFor(() => rendered.result.current.state === 'succeeded')
      expect(rendered.result.current.state).toBe('succeeded')
    })

    test('has error events', async () => {
      // mock update to save comment instance
      const commentUpdate = Comment.prototype.update
      const updatingComments: any = []
      Comment.prototype.update = function () {
        updatingComments.push(this)
        return commentUpdate.bind(this)()
      }

      const rendered = renderHook<any, any>((commentCid) => useComment({commentCid}))
      const waitFor = testUtils.createWaitFor(rendered)
      rendered.rerender('comment cid')

      // emit error event
      await waitFor(() => updatingComments.length > 0)
      updatingComments[0].emit('error', Error('error 1'))

      // first error
      await waitFor(() => rendered.result.current.error.message === 'error 1')
      expect(rendered.result.current.error.message).toBe('error 1')
      expect(rendered.result.current.errors[0].message).toBe('error 1')
      expect(rendered.result.current.errors.length).toBe(1)

      // second error
      updatingComments[0].emit('error', Error('error 2'))
      await waitFor(() => rendered.result.current.error.message === 'error 2')
      expect(rendered.result.current.error.message).toBe('error 2')
      expect(rendered.result.current.errors[0].message).toBe('error 1')
      expect(rendered.result.current.errors[1].message).toBe('error 2')
      expect(rendered.result.current.errors.length).toBe(2)

      // restore mock
      Comment.prototype.update = commentUpdate
    })
  })
})
