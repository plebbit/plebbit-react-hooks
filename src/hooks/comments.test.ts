import {act, renderHook} from '@testing-library/react-hooks'
import testUtils from '../lib/test-utils'
import {useComment, useComments, useReplies, setPlebbitJs} from '..'
import commentsStore from '../stores/comments'
import subplebbitsPagesStore from '../stores/subplebbits-pages'
import PlebbitJsMock, {Plebbit, Comment, Pages, simulateLoadingTime} from '../lib/plebbit-js/plebbit-js-mock'
import utils from '../lib/utils'
import {defaultRepliesPerPage as repliesPerPage} from '../stores/replies'
import repliesPagesStore from '../stores/replies-pages'

describe('comments', () => {
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

    test('plebbit.createComment throws adds useComment().error', async () => {
      // mock update to save comment instance
      const createComment = Plebbit.prototype.createComment
      Plebbit.prototype.createComment = async function () {
        throw Error('plebbit.createComment error')
      }

      const rendered = renderHook<any, any>((commentCid) => useComment({commentCid}))
      const waitFor = testUtils.createWaitFor(rendered)
      rendered.rerender('comment cid')

      // first error
      await waitFor(() => rendered.result.current.error.message === 'plebbit.createComment error')
      expect(rendered.result.current.error.message).toBe('plebbit.createComment error')
      expect(rendered.result.current.errors[0].message).toBe('plebbit.createComment error')
      expect(rendered.result.current.errors.length).toBe(1)

      // restore mock
      Plebbit.prototype.createComment = createComment
    })

    test('useReplies sort type new, switch to sort type old, switch to different comment', async () => {
      const rendered = renderHook<any, any>((useRepliesOptions) => useReplies(useRepliesOptions))
      const waitFor = testUtils.createWaitFor(rendered)
      expect(rendered.result.current.replies).toEqual([])

      const commentCid = 'comment cid 1'
      rendered.rerender({commentCid, sortType: 'new'})
      await waitFor(() => rendered.result.current.replies.length === repliesPerPage)
      expect(rendered.result.current.replies.length).toBe(repliesPerPage)
      expect(rendered.result.current.replies[0].cid).toBe('comment cid 1 page cid new comment cid 100')
      expect(rendered.result.current.replies[0].timestamp).toBeGreaterThan(rendered.result.current.replies[repliesPerPage - 1].timestamp)
      expect(rendered.result.current.hasMore).toBe(true)

      rendered.rerender({commentCid, sortType: 'old'})
      await waitFor(() => rendered.result.current.replies[0].cid === 'comment cid 1 page cid old comment cid 1')
      expect(rendered.result.current.replies.length).toBe(repliesPerPage)
      expect(rendered.result.current.replies[0].cid).toBe('comment cid 1 page cid old comment cid 1')
      expect(rendered.result.current.replies[repliesPerPage - 1].timestamp).toBeGreaterThan(rendered.result.current.replies[0].timestamp)
      expect(rendered.result.current.hasMore).toBe(true)

      rendered.rerender({commentCid: 'comment cid 2', sortType: 'old'})
      await waitFor(() => rendered.result.current.replies[0].cid === 'comment cid 2 page cid old comment cid 1')
      expect(rendered.result.current.replies.length).toBe(repliesPerPage)
      expect(rendered.result.current.replies[0].cid).toBe('comment cid 2 page cid old comment cid 1')
      expect(rendered.result.current.replies[repliesPerPage - 1].timestamp).toBeGreaterThan(rendered.result.current.replies[0].timestamp)
      expect(rendered.result.current.hasMore).toBe(true)
    })

    test('useReplies scroll pages', async () => {
      const rendered = renderHook<any, any>((useRepliesOptions) => useReplies(useRepliesOptions))
      const waitFor = testUtils.createWaitFor(rendered)
      const scrollOnePage = createScrollOnePage(rendered, waitFor)
      expect(rendered.result.current.replies).toEqual([])

      // default sort (best)
      const commentCid = 'comment cid 1'
      rendered.rerender({commentCid})
      await waitFor(() => rendered.result.current.replies.length === repliesPerPage)
      // page 1
      expect(rendered.result.current.replies.length).toBe(repliesPerPage)
      expect(rendered.result.current.hasMore).toBe(true)
      // default sort, shouldnt fetch a page because included in comment.replies.pages
      expect(Object.keys(repliesPagesStore.getState().repliesPages).length).toBe(0)

      // page 2
      await scrollOnePage()
      expect(rendered.result.current.replies.length).toBe(repliesPerPage * 2)
      expect(rendered.result.current.hasMore).toBe(true)
      // still shouldnt fetch a page yet because commentRepliesLeftBeforeNextPage not reached
      expect(Object.keys(repliesPagesStore.getState().repliesPages).length).toBe(0)

      // page 3
      await scrollOnePage()
      expect(rendered.result.current.replies.length).toBe(repliesPerPage * 3)
      expect(rendered.result.current.hasMore).toBe(true)
      // should fetch a page yet because commentRepliesLeftBeforeNextPage reached
      expect(Object.keys(repliesPagesStore.getState().repliesPages).length).toBe(1)
    })

    test.todo('useReplies flat', async () => {})

    test.todo('useReplies has account comments', async () => {})

    test.todo('useReplies nested scroll pages', async () => {})

    test.todo('useReplies if sort type top missing, use best instead, and vice versa', async () => {})

    test.todo('useReplies dynamic filter', async () => {})

    test('useReplies hasMore false', async () => {
      // mock a page with no nextCid
      const getPage = Pages.prototype.getPage
      Pages.prototype.getPage = async function (pageCid: string) {
        await simulateLoadingTime()
        const page: any = {comments: []}
        while (page.comments.length < 100) {
          page.comments.push({
            timestamp: page.comments.length + 1,
            cid: pageCid + ' comment cid ' + (page.comments.length + 1),
            subplebbitAddress: this.comment.subplebbitAddress,
          })
        }
        return page
      }

      const rendered = renderHook<any, any>((useRepliesOptions) => useReplies(useRepliesOptions))
      const waitFor = testUtils.createWaitFor(rendered)
      const scrollOnePage = createScrollOnePage(rendered, waitFor)
      expect(rendered.result.current.replies).toEqual([])

      rendered.rerender({commentCid: 'comment cid 1', sortType: 'new'})
      await waitFor(() => rendered.result.current.replies.length === repliesPerPage)
      // page 1
      expect(rendered.result.current.replies.length).toBe(repliesPerPage)
      expect(rendered.result.current.hasMore).toBe(true)
      // should only fetch 1 page because no next cid
      expect(Object.keys(repliesPagesStore.getState().repliesPages).length).toBe(1)

      // page 2
      await scrollOnePage()
      expect(rendered.result.current.replies.length).toBe(repliesPerPage * 2)
      expect(rendered.result.current.hasMore).toBe(true)
      // should only fetch 1 page because no next cid
      expect(Object.keys(repliesPagesStore.getState().repliesPages).length).toBe(1)

      // page 3
      await scrollOnePage()
      expect(rendered.result.current.replies.length).toBe(repliesPerPage * 3)
      expect(rendered.result.current.hasMore).toBe(true)
      // should only fetch 1 page because no next cid
      expect(Object.keys(repliesPagesStore.getState().repliesPages).length).toBe(1)

      // page 4
      await scrollOnePage()
      expect(rendered.result.current.replies.length).toBe(repliesPerPage * 4)
      expect(rendered.result.current.hasMore).toBe(false)
      // should only fetch 1 page because no next cid
      expect(Object.keys(repliesPagesStore.getState().repliesPages).length).toBe(1)

      Pages.prototype.getPage = getPage
    })

    test.todo('useReplies custom repliesPerPage', async () => {})
  })
})

const createScrollOnePage = (rendered, waitFor) => {
  const scrollOnePage = async () => {
    const nextFeedLength = (rendered.result.current.replies?.length || 0) + repliesPerPage
    await act(async () => {
      await rendered.result.current.loadMore()
    })

    try {
      await rendered.waitFor(() => rendered.result.current.replies?.length >= nextFeedLength)
    } catch (e) {
      // console.error('scrollOnePage failed:', e)
    }
  }
  return scrollOnePage
}
