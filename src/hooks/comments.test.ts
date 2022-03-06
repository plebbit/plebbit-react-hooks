import { act, renderHook } from '@testing-library/react-hooks'
import { useComment } from '../index'
import PlebbitProvider from '../providers/PlebbitProvider'
import localForage from 'localforage'
import PlebbitMock, {Plebbit, Comment} from '../lib/plebbit-js/plebbit-js-mock'
import { mockPlebbitJs } from '../lib/plebbit-js'
mockPlebbitJs(PlebbitMock)

const deleteDatabases = () =>
  Promise.all([
    localForage.createInstance({ name: 'comments' }).clear(),
  ])

describe('comments', () => {
  afterEach(async () => {
    await deleteDatabases()
  })

  describe('no comments in database', () => {
    test('get comments', async () => {
      // on first render, the account is undefined because it's not yet loaded from database
      const rendered = renderHook<any, any>((commentCid) => useComment(commentCid), { wrapper: PlebbitProvider })
      expect(rendered.result.current).toBe(undefined)
      rendered.rerender('comment cid 1')
      // wait to get account loaded
      await rendered.waitForNextUpdate()
      // wait for addCommentToContext action
      await rendered.waitForNextUpdate()
      expect(rendered.result.current.cid).toBe('comment cid 1')
      expect(rendered.result.current.upvoteCount).toBe(undefined)
      // wait for comment.on('update') to fetch the ipns
      await rendered.waitForNextUpdate()
      expect(rendered.result.current.cid).toBe('comment cid 1')
      expect(rendered.result.current.upvoteCount).toBe(1)

      rendered.rerender('comment cid 2')
      // wait for addCommentToContext action
      await rendered.waitForNextUpdate()
      expect(rendered.result.current.cid).toBe('comment cid 2')
      expect(rendered.result.current.upvoteCount).toBe(undefined)
      // wait for comment.on('update') to fetch the ipns
      await rendered.waitForNextUpdate()
      expect(rendered.result.current.cid).toBe('comment cid 2')
      expect(rendered.result.current.upvoteCount).toBe(1)

      // get comment 1 again, no need to wait for any updates
      rendered.rerender('comment cid 1')
      expect(rendered.result.current.cid).toBe('comment cid 1')
      expect(rendered.result.current.upvoteCount).toBe(1)

      // make sure comments are still in database
      const getComment = Plebbit.prototype.getComment
      const simulateUpdateEvent = Comment.prototype.simulateUpdateEvent
      // mock getComment on the Plebbit class
      Plebbit.prototype.getComment = (commentCid) => {
        throw Error(`plebbit.getComment called with comment cid '${commentCid}' should not be called when getting comments from database`)
      }
      // don't simulate 'update' event during this test to see if the updates were saved to database
      Comment.prototype.simulateUpdateEvent = () => {}

      // on first render, the account is undefined because it's not yet loaded from database
      const rendered2 = renderHook<any, any>((commentCid) => useComment(commentCid), { wrapper: PlebbitProvider })
      expect(rendered2.result.current).toBe(undefined)
      rendered2.rerender('comment cid 1')
      // wait to get account loaded
      await rendered2.waitForNextUpdate()
      expect(rendered2.result.current.cid).toBe('comment cid 1')
      expect(rendered2.result.current.upvoteCount).toBe(1)

      rendered2.rerender('comment cid 2')
      // wait for addCommentToContext action
      await rendered2.waitForNextUpdate()
      expect(rendered2.result.current.cid).toBe('comment cid 2')
      expect(rendered2.result.current.upvoteCount).toBe(1)

      // get comment 1 again, no need to wait for any updates
      Comment.prototype.simulateUpdateEvent = () => {
        throw Error('no comment update events should be emitted when comment already in context')
      }
      rendered2.rerender('comment cid 1')
      expect(rendered2.result.current.cid).toBe('comment cid 1')
      expect(rendered2.result.current.upvoteCount).toBe(1)

      // restore mock
      Comment.prototype.simulateUpdateEvent = simulateUpdateEvent
      Plebbit.prototype.getComment = getComment
    })
  })
})
