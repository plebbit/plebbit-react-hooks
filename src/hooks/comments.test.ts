import {act, renderHook} from '@testing-library/react-hooks'
import testUtils from '../lib/test-utils'
import {useComment, useComments, useReplies, useValidateComment, setPlebbitJs} from '..'
import commentsStore from '../stores/comments'
import subplebbitsPagesStore from '../stores/subplebbits-pages'
import PlebbitJsMock, {Plebbit, Comment, Pages, simulateLoadingTime} from '../lib/plebbit-js/plebbit-js-mock'
import utils from '../lib/utils'
import repliesStore, {defaultRepliesPerPage as repliesPerPage} from '../stores/replies'
import repliesPagesStore from '../stores/replies-pages'

const plebbitJsMockRepliesPageLength = 100

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

    test(`onlyIfCached: true doesn't add to store`, async () => {
      let rendered, waitFor
      rendered = renderHook<any, any>((options: any) => useComment(options))
      waitFor = testUtils.createWaitFor(rendered)

      rendered.rerender({commentCid: 'comment cid 1', onlyIfCached: true})
      // TODO: find better way to wait
      await new Promise((r) => setTimeout(r, 20))
      // comment not added to store
      expect(commentsStore.getState().comments).toEqual({})

      rendered = renderHook<any, any>((options: any) => useComments(options))
      waitFor = testUtils.createWaitFor(rendered)

      rendered.rerender({commentCids: ['comment cid 1', 'comment cid 2'], onlyIfCached: true})
      expect(rendered.result.current.comments.length).toBe(2)
      // TODO: find better way to wait
      await new Promise((r) => setTimeout(r, 20))
      // comment not added to store
      expect(commentsStore.getState().comments).toEqual({})
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
  })
})

describe('comment replies', () => {
  let simulateUpdateEvent

  beforeAll(async () => {
    // set plebbit-js mock and reset dbs
    setPlebbitJs(PlebbitJsMock)
    await testUtils.resetDatabasesAndStores()

    testUtils.silenceReactWarnings()

    // mock adding replies to comment
    simulateUpdateEvent = Comment.prototype.simulateUpdateEvent
    Comment.prototype.simulateUpdateEvent = async function () {
      // if timestamp isn't defined, simulate fetching the comment ipfs
      if (!this.timestamp) {
        this.simulateFetchCommentIpfsUpdateEvent()
        return
      }

      // simulate finding vote counts on an IPNS record
      this.upvoteCount = typeof this.upvoteCount === 'number' ? this.upvoteCount + 2 : 3
      this.downvoteCount = typeof this.downvoteCount === 'number' ? this.downvoteCount + 1 : 1
      this.updatedAt = Math.floor(Date.now() / 1000)

      const bestPageCid = this.cid + ' page cid best'
      this.replies.pages.best = this.replies.pageToGet(bestPageCid)
      this.replies.pageCids = {
        best: bestPageCid,
        new: this.cid + ' page cid new',
        newFlat: this.cid + ' page cid newFlat',
        old: this.cid + ' page cid old',
        oldFlat: this.cid + ' page cid oldFlat',
      }

      this.updatingState = 'succeeded'
      this.emit('update', this)
      this.emit('updatingstatechange', 'succeeded')
    }
  })
  afterAll(() => {
    testUtils.restoreAll()

    // restore mock
    Comment.prototype.simulateUpdateEvent = simulateUpdateEvent
  })
  afterEach(async () => {
    await testUtils.resetDatabasesAndStores()
  })

  describe('useReplies', () => {
    let rendered, waitFor, scrollOnePage

    beforeEach(() => {
      rendered = renderHook<any, any>((useRepliesOptions) => useReplies(useRepliesOptions))
      waitFor = testUtils.createWaitFor(rendered)
      scrollOnePage = scrollOnePage = async () => {
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
    })
    afterEach(async () => {
      await testUtils.resetDatabasesAndStores()
    })

    test('sort type new, switch to sort type old, switch to different comment', async () => {
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

    test('scroll pages', async () => {
      expect(rendered.result.current.replies).toEqual([])

      // default sort (best)
      const commentCid = 'comment cid 1'
      rendered.rerender({commentCid})
      await waitFor(() => rendered.result.current.replies.length === repliesPerPage)
      // page 1
      expect(rendered.result.current.replies.length).toBe(repliesPerPage)
      expect(rendered.result.current.updatedReplies.length).toBe(rendered.result.current.replies.length)
      expect(rendered.result.current.bufferedReplies.length).toBe(plebbitJsMockRepliesPageLength - repliesPerPage)
      expect(rendered.result.current.hasMore).toBe(true)
      // default sort, shouldnt fetch a page because included in comment.replies.pages
      expect(Object.keys(repliesPagesStore.getState().repliesPages).length).toBe(0)

      // page 2
      await scrollOnePage()
      expect(rendered.result.current.replies.length).toBe(repliesPerPage * 2)
      expect(rendered.result.current.updatedReplies.length).toBe(rendered.result.current.replies.length)
      expect(rendered.result.current.bufferedReplies.length).toBe(plebbitJsMockRepliesPageLength - repliesPerPage * 2)
      expect(rendered.result.current.hasMore).toBe(true)
      // still shouldnt fetch a page yet because commentRepliesLeftBeforeNextPage not reached
      expect(Object.keys(repliesPagesStore.getState().repliesPages).length).toBe(0)

      // page 3
      await scrollOnePage()
      expect(rendered.result.current.replies.length).toBe(repliesPerPage * 3)
      expect(rendered.result.current.updatedReplies.length).toBe(rendered.result.current.replies.length)
      await waitFor(() => rendered.result.current.bufferedReplies.length === plebbitJsMockRepliesPageLength * 2 - repliesPerPage * 3)
      expect(rendered.result.current.bufferedReplies.length).toBe(plebbitJsMockRepliesPageLength * 2 - repliesPerPage * 3)
      expect(rendered.result.current.hasMore).toBe(true)
      // should fetch a page yet because commentRepliesLeftBeforeNextPage reached
      expect(Object.keys(repliesPagesStore.getState().repliesPages).length).toBe(1)
    })

    test('if sort type topAll missing, use best instead', async () => {
      expect(rendered.result.current.replies).toEqual([])

      const commentCid = 'comment cid 1'
      rendered.rerender({commentCid, sortType: 'topAll'})
      await waitFor(() => rendered.result.current.replies.length === repliesPerPage)
      expect(rendered.result.current.updatedReplies.length).toBe(rendered.result.current.replies.length)
      expect(rendered.result.current.bufferedReplies.length).toBe(plebbitJsMockRepliesPageLength - repliesPerPage)
      expect(rendered.result.current.replies.length).toBe(repliesPerPage)
      expect(rendered.result.current.replies[0].cid).toBe('comment cid 1 page cid best comment cid 100')
      expect(rendered.result.current.hasMore).toBe(true)

      // page 2
      await scrollOnePage()
      expect(rendered.result.current.replies.length).toBe(repliesPerPage * 2)
      expect(rendered.result.current.updatedReplies.length).toBe(rendered.result.current.replies.length)
      expect(rendered.result.current.bufferedReplies.length).toBe(plebbitJsMockRepliesPageLength - repliesPerPage * 2)
      expect(rendered.result.current.hasMore).toBe(true)
      // still shouldnt fetch a page yet because commentRepliesLeftBeforeNextPage not reached
      expect(Object.keys(repliesPagesStore.getState().repliesPages).length).toBe(0)

      // page 3
      await scrollOnePage()
      expect(rendered.result.current.replies.length).toBe(repliesPerPage * 3)
      expect(rendered.result.current.updatedReplies.length).toBe(rendered.result.current.replies.length)
      await waitFor(() => rendered.result.current.bufferedReplies.length === plebbitJsMockRepliesPageLength * 2 - repliesPerPage * 3)
      expect(rendered.result.current.bufferedReplies.length).toBe(plebbitJsMockRepliesPageLength * 2 - repliesPerPage * 3)
      expect(rendered.result.current.hasMore).toBe(true)
      // should fetch a page yet because commentRepliesLeftBeforeNextPage reached
      expect(Object.keys(repliesPagesStore.getState().repliesPages).length).toBe(1)
    })

    test('if sort type best missing, use topAll instead', async () => {
      const simulateUpdateEvent = Comment.prototype.simulateUpdateEvent
      Comment.prototype.simulateUpdateEvent = async function () {
        this.replies.pages.topAll = {
          comments: [
            {
              timestamp: 1,
              cid: this.cid + ' topAll reply cid 1',
              subplebbitAddress: this.subplebbitAddress,
              upvoteCount: 1,
              downvoteCount: 10,
              author: {address: this.cid + ' topAll author address'},
              updatedAt: 1,
            },
          ],
          nextCid: this.cid + ' next page cid topAll',
        }
        this.updatingState = 'succeeded'
        this.emit('update', this)
        this.emit('updatingstatechange', 'succeeded')
      }

      const commentCid = 'comment cid 1'
      rendered.rerender({commentCid, sortType: 'best'})
      await waitFor(() => rendered.result.current.replies.length === repliesPerPage)
      expect(rendered.result.current.replies.length).toBe(repliesPerPage)
      expect(rendered.result.current.replies[0].cid).toBe('comment cid 1 topAll reply cid 1')
      expect(rendered.result.current.hasMore).toBe(true)

      // page 2
      await scrollOnePage()
      expect(rendered.result.current.replies.length).toBe(repliesPerPage * 2)
      expect(rendered.result.current.hasMore).toBe(true)
      expect(Object.keys(repliesPagesStore.getState().repliesPages).length).toBe(1)

      // page 3
      await scrollOnePage()
      expect(rendered.result.current.replies.length).toBe(repliesPerPage * 3)
      expect(rendered.result.current.hasMore).toBe(true)
      expect(Object.keys(repliesPagesStore.getState().repliesPages).length).toBe(1)

      Comment.prototype.simulateUpdateEvent = simulateUpdateEvent

      // wait to load all pages or can cause race condition with other tests
      await waitFor(() => Object.keys(repliesPagesStore.getState().repliesPages).length === 2)
      expect(Object.keys(repliesPagesStore.getState().repliesPages).length).toBe(2)
    })

    test('hasMore false', async () => {
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

      rendered.rerender({commentCid: 'comment cid 1', sortType: 'new'})
      await waitFor(() => rendered.result.current.replies.length === repliesPerPage)
      // page 1
      expect(rendered.result.current.replies.length).toBe(repliesPerPage)
      expect(rendered.result.current.updatedReplies.length).toBe(rendered.result.current.replies.length)
      expect(rendered.result.current.bufferedReplies.length).toBe(plebbitJsMockRepliesPageLength - repliesPerPage)
      expect(rendered.result.current.hasMore).toBe(true)
      // should only fetch 1 page because no next cid
      expect(Object.keys(repliesPagesStore.getState().repliesPages).length).toBe(1)

      // page 2
      await scrollOnePage()
      expect(rendered.result.current.replies.length).toBe(repliesPerPage * 2)
      expect(rendered.result.current.updatedReplies.length).toBe(rendered.result.current.replies.length)
      expect(rendered.result.current.bufferedReplies.length).toBe(plebbitJsMockRepliesPageLength - repliesPerPage * 2)
      expect(rendered.result.current.hasMore).toBe(true)
      // should only fetch 1 page because no next cid
      expect(Object.keys(repliesPagesStore.getState().repliesPages).length).toBe(1)

      // page 3
      await scrollOnePage()
      expect(rendered.result.current.replies.length).toBe(repliesPerPage * 3)
      expect(rendered.result.current.updatedReplies.length).toBe(rendered.result.current.replies.length)
      expect(rendered.result.current.bufferedReplies.length).toBe(plebbitJsMockRepliesPageLength - repliesPerPage * 3)
      expect(rendered.result.current.hasMore).toBe(true)
      // should only fetch 1 page because no next cid
      expect(Object.keys(repliesPagesStore.getState().repliesPages).length).toBe(1)

      // page 4
      await scrollOnePage()
      expect(rendered.result.current.replies.length).toBe(repliesPerPage * 4)
      expect(rendered.result.current.updatedReplies.length).toBe(rendered.result.current.replies.length)
      expect(rendered.result.current.bufferedReplies.length).toBe(plebbitJsMockRepliesPageLength - repliesPerPage * 4)
      expect(rendered.result.current.hasMore).toBe(false)
      // should only fetch 1 page because no next cid
      expect(Object.keys(repliesPagesStore.getState().repliesPages).length).toBe(1)

      Pages.prototype.getPage = getPage
    })

    test('custom repliesPerPage', async () => {
      const commentCid = 'comment cid 1'
      rendered.rerender({commentCid, repliesPerPage: 10})
      await waitFor(() => rendered.result.current.replies.length === 10)
      expect(rendered.result.current.replies.length).toBe(10)
      expect(rendered.result.current.hasMore).toBe(true)

      rendered.rerender({commentCid, repliesPerPage: undefined})
      await waitFor(() => rendered.result.current.replies.length === repliesPerPage)
      expect(rendered.result.current.replies.length).toBe(repliesPerPage)
      expect(rendered.result.current.hasMore).toBe(true)

      rendered.rerender({commentCid, repliesPerPage: 100})
      await waitFor(() => rendered.result.current.replies.length === 100)
      expect(rendered.result.current.replies.length).toBe(100)
      expect(rendered.result.current.hasMore).toBe(true)
    })

    test('dynamic filter', async () => {
      // NOTE: if the filter is too difficult, it cause fetch too many pages
      // and cause race conditions with other tests
      const createCidMatchFilter = (cid: string) => ({
        filter: (comment: Comment) => !!comment.cid.match(cid),
        key: `cid-match-${cid}`,
      })

      rendered.rerender({
        commentCid: 'comment cid a',
        filter: createCidMatchFilter('1'),
        sortType: 'new',
      })
      await waitFor(() => rendered.result.current.replies?.length > 2)
      expect(rendered.result.current.replies[0].cid).toBe('comment cid a page cid new comment cid 100')
      expect(rendered.result.current.replies[1].cid).toBe('comment cid a page cid new comment cid 91')
      expect(rendered.result.current.replies[2].cid).toBe('comment cid a page cid new comment cid 81')
      expect(Object.keys(repliesStore.getState().feedsOptions).length).toBe(1)

      rendered.rerender({
        commentCid: 'comment cid b',
        filter: createCidMatchFilter('2'),
        sortType: 'new',
      })
      await waitFor(() => rendered.result.current.replies?.length > 2)
      expect(rendered.result.current.replies[0].cid).toBe('comment cid b page cid new comment cid 92')
      expect(rendered.result.current.replies[1].cid).toBe('comment cid b page cid new comment cid 82')
      expect(rendered.result.current.replies[2].cid).toBe('comment cid b page cid new comment cid 72')
      expect(Object.keys(repliesStore.getState().feedsOptions).length).toBe(2)
    })

    test('can useComment({onlyIfCached: true}) on a comment from replies pages', async () => {
      rendered = renderHook<any, any>(({useCommentOptions, useRepliesOptions}) => {
        const comment = useComment(useCommentOptions)
        const replies = useReplies(useRepliesOptions)
        return {comment, replies}
      })
      waitFor = testUtils.createWaitFor(rendered)

      const useRepliesOptions = {
        commentCid: 'comment cid 1',
        // the preloaded page is best
        sortType: 'best',
        // the preloaded page size is 100
        repliesPerPage: 200,
      }
      rendered.rerender({useRepliesOptions})
      await waitFor(() => rendered.result.current.replies.replies.length === useRepliesOptions.repliesPerPage)
      expect(rendered.result.current.replies.replies.length).toBe(useRepliesOptions.repliesPerPage)

      // first reply (preloaded) is defined
      const firstCommentCid = rendered.result.current.replies.replies[0].cid
      rendered.rerender({useRepliesOptions, useCommentOptions: {commentCid: firstCommentCid, onlyIfCached: true}})
      await waitFor(() => typeof rendered.result.current.comment.updatedAt === 'number')
      expect(typeof rendered.result.current.comment.updatedAt).toBe('number')
      expect(rendered.result.current.comment.cid).toBe(firstCommentCid)

      // last reply (from a page) is defined
      const lastCommentCid = rendered.result.current.replies.replies[useRepliesOptions.repliesPerPage - 1].cid
      rendered.rerender({useRepliesOptions, useCommentOptions: {commentCid: lastCommentCid, onlyIfCached: true}})
      await waitFor(() => typeof rendered.result.current.comment.updatedAt === 'number')
      expect(typeof rendered.result.current.comment.updatedAt).toBe('number')
      expect(rendered.result.current.comment.cid).toBe(lastCommentCid)
    })

    test.todo('has account comments', async () => {})

    test.todo('nested scroll pages', async () => {})
  })

  describe('useReplies flat', () => {
    let pageToGet

    beforeAll(() => {
      // mock nested replies on pages
      pageToGet = Pages.prototype.pageToGet
      Pages.prototype.pageToGet = async function (pageCid) {
        const subplebbitAddress = this.subplebbit?.address || this.comment?.subplebbitAddress
        const page: any = {
          nextCid: subplebbitAddress + ' ' + pageCid + ' - next page cid',
          comments: [],
        }
        const count = 35
        let index = 0
        while (index++ < count) {
          page.comments.push({
            timestamp: index,
            cid: pageCid + ' comment cid ' + index,
            subplebbitAddress,
            upvoteCount: index,
            downvoteCount: 10,
            author: {
              address: pageCid + ' author address ' + index,
            },
            updatedAt: index,
            replies: {
              pages: {
                best: {
                  comments: [
                    {
                      timestamp: index + 10,
                      cid: pageCid + ' comment cid ' + index + ' nested 1',
                      subplebbitAddress,
                      upvoteCount: index,
                      downvoteCount: 10,
                      author: {
                        address: pageCid + ' author address ' + index,
                      },
                      updatedAt: index,
                      replies: {
                        pages: {
                          best: {
                            comments: [
                              {
                                timestamp: index + 20,
                                cid: pageCid + ' comment cid ' + index + ' nested 2',
                                subplebbitAddress,
                                upvoteCount: index,
                                downvoteCount: 10,
                                author: {
                                  address: pageCid + ' author address ' + index,
                                },
                                updatedAt: index,
                              },
                            ],
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          })
        }
        return page
      }
    })
    afterAll(() => {
      // restore mock
      Pages.prototype.pageToGet = pageToGet
    })

    let rendered, waitFor, scrollOnePage

    beforeEach(() => {
      rendered = renderHook<any, any>((useRepliesOptions) => useReplies(useRepliesOptions))
      waitFor = testUtils.createWaitFor(rendered)
      scrollOnePage = scrollOnePage = async () => {
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
    })
    afterEach(async () => {
      await testUtils.resetDatabasesAndStores()
    })

    test('sort type best is flattened', async () => {
      // make sure pages were reset properly
      expect(Object.keys(repliesPagesStore.getState().repliesPages).length).toBe(0)

      rendered.rerender({commentCid: 'comment cid 1', sortType: 'best', flat: true})
      await waitFor(() => rendered.result.current.replies.length === repliesPerPage)
      expect(rendered.result.current.replies.length).toBe(repliesPerPage)
      expect(rendered.result.current.hasMore).toBe(true)
      let hasNestedReplies = false
      for (const reply of rendered.result.current.replies) {
        if (reply.cid.includes('nested')) {
          hasNestedReplies = true
          break
        }
      }
      expect(hasNestedReplies).toBe(true)

      // make sure page was fetched
      expect(Object.keys(repliesPagesStore.getState().repliesPages).length).toBeGreaterThan(0)
    })

    test('default sort type is flattened', async () => {
      // make sure pages were reset properly
      expect(Object.keys(repliesPagesStore.getState().repliesPages).length).toBe(0)

      rendered.rerender({commentCid: 'comment cid 1', flat: true})
      await waitFor(() => rendered.result.current.replies.length === repliesPerPage)
      expect(rendered.result.current.replies.length).toBe(repliesPerPage)
      expect(rendered.result.current.hasMore).toBe(true)
      let hasNestedReplies = false
      for (const reply of rendered.result.current.replies) {
        if (reply.cid.includes('nested')) {
          hasNestedReplies = true
          break
        }
      }
      expect(hasNestedReplies).toBe(true)

      // make sure page was fetched
      expect(Object.keys(repliesPagesStore.getState().repliesPages).length).toBeGreaterThan(0)
    })

    test('sort type new uses newFlat if available', async () => {
      // make sure pages were reset properly
      expect(Object.keys(repliesPagesStore.getState().repliesPages).length).toBe(0)

      rendered.rerender({commentCid: 'comment cid 1', sortType: 'new', flat: true})
      await waitFor(() => rendered.result.current.replies.length === repliesPerPage)

      const pageCids = Object.keys(repliesPagesStore.getState().repliesPages)
      expect(pageCids.length).toBe(1)
      expect(pageCids[0]).toMatch('newFlat')
    })

    test('sort type old uses oldFlat if available', async () => {
      // make sure pages were reset properly
      expect(Object.keys(repliesPagesStore.getState().repliesPages).length).toBe(0)

      rendered.rerender({commentCid: 'comment cid 1', sortType: 'old', flat: true})
      await waitFor(() => rendered.result.current.replies.length === repliesPerPage)

      const pageCids = Object.keys(repliesPagesStore.getState().repliesPages)
      expect(pageCids.length).toBe(1)
      expect(pageCids[0]).toMatch('oldFlat')
    })

    test('sort type newFlat uses new if missing', async () => {
      const simulateUpdateEvent = Comment.prototype.simulateUpdateEvent
      Comment.prototype.simulateUpdateEvent = async function () {
        this.replies.pageCids = {
          new: this.cid + ' page cid new',
        }
        this.updatingState = 'succeeded'
        this.emit('update', this)
        this.emit('updatingstatechange', 'succeeded')
      }

      // make sure pages were reset properly
      expect(Object.keys(repliesPagesStore.getState().repliesPages).length).toBe(0)

      rendered.rerender({commentCid: 'comment cid 1', sortType: 'newFlat', flat: true})
      await waitFor(() => rendered.result.current.replies.length === repliesPerPage)

      const pageCids = Object.keys(repliesPagesStore.getState().repliesPages)
      expect(pageCids.length).toBe(1)
      expect(pageCids[0]).not.toMatch('newFlat')

      Comment.prototype.simulateUpdateEvent = simulateUpdateEvent
    })

    test('sort type new, flat: true uses new if newFlat missing', async () => {
      const simulateUpdateEvent = Comment.prototype.simulateUpdateEvent
      Comment.prototype.simulateUpdateEvent = async function () {
        this.replies.pageCids = {
          new: this.cid + ' page cid new',
        }
        this.updatingState = 'succeeded'
        this.emit('update', this)
        this.emit('updatingstatechange', 'succeeded')
      }

      // make sure pages were reset properly
      expect(Object.keys(repliesPagesStore.getState().repliesPages).length).toBe(0)

      rendered.rerender({commentCid: 'comment cid 1', sortType: 'new', flat: true})
      await waitFor(() => rendered.result.current.replies.length === repliesPerPage)

      const pageCids = Object.keys(repliesPagesStore.getState().repliesPages)
      expect(pageCids.length).toBe(1)
      expect(pageCids[0]).not.toMatch('newFlat')

      Comment.prototype.simulateUpdateEvent = simulateUpdateEvent
    })

    test('sort type oldFlat uses old if missing', async () => {
      const simulateUpdateEvent = Comment.prototype.simulateUpdateEvent
      Comment.prototype.simulateUpdateEvent = async function () {
        this.replies.pageCids = {
          old: this.cid + ' page cid old',
        }
        this.updatingState = 'succeeded'
        this.emit('update', this)
        this.emit('updatingstatechange', 'succeeded')
      }

      // make sure pages were reset properly
      expect(Object.keys(repliesPagesStore.getState().repliesPages).length).toBe(0)

      rendered.rerender({commentCid: 'comment cid 1', sortType: 'oldFlat', flat: true})
      await waitFor(() => rendered.result.current.replies.length === repliesPerPage)

      const pageCids = Object.keys(repliesPagesStore.getState().repliesPages)
      expect(pageCids.length).toBe(1)
      expect(pageCids[0]).not.toMatch('oldFlat')

      Comment.prototype.simulateUpdateEvent = simulateUpdateEvent
    })

    test('sort type old, flat: true uses old if oldFlat missing', async () => {
      const simulateUpdateEvent = Comment.prototype.simulateUpdateEvent
      Comment.prototype.simulateUpdateEvent = async function () {
        this.replies.pageCids = {
          old: this.cid + ' page cid old',
        }
        this.updatingState = 'succeeded'
        this.emit('update', this)
        this.emit('updatingstatechange', 'succeeded')
      }

      // make sure pages were reset properly
      expect(Object.keys(repliesPagesStore.getState().repliesPages).length).toBe(0)

      rendered.rerender({commentCid: 'comment cid 1', sortType: 'old', flat: true})
      await waitFor(() => rendered.result.current.replies.length === repliesPerPage)

      const pageCids = Object.keys(repliesPagesStore.getState().repliesPages)
      expect(pageCids.length).toBe(1)
      expect(pageCids[0]).not.toMatch('oldFlat')

      Comment.prototype.simulateUpdateEvent = simulateUpdateEvent
    })

    test('replies.pages has 1 reply with no next cid, hasMore false', async () => {
      const simulateUpdateEvent = Comment.prototype.simulateUpdateEvent
      Comment.prototype.simulateUpdateEvent = async function () {
        this.replies.pages = {
          best: {
            comments: [
              {
                timestamp: 1,
                cid: 'comment cid 1',
                subplebbitAddress: 'subplebbit address',
                updatedAt: 1,
                upvoteCount: 1,
              },
            ],
          },
        }
        this.replies.pageCids = {}
        this.updatedAt = 1
        this.updatingState = 'succeeded'
        this.emit('update', this)
        this.emit('updatingstatechange', 'succeeded')
      }

      const commentCid = 'comment cid 1'
      rendered.rerender({commentCid})
      await waitFor(() => rendered.result.current.replies.length === 1)
      expect(rendered.result.current.replies.length).toBe(1)
      expect(rendered.result.current.replies[0].cid).toBe('comment cid 1')
      await waitFor(() => rendered.result.current.hasMore === false)
      expect(rendered.result.current.hasMore).toBe(false)

      Comment.prototype.simulateUpdateEvent = simulateUpdateEvent
    })

    test.only('updated reply is updated, loaded reply is not', async () => {
      const page1 = {
        comments: [
          {
            timestamp: 1,
            cid: 'comment cid 1',
            subplebbitAddress: 'subplebbit address',
            updatedAt: 1,
            upvoteCount: 1,
          },
        ],
      }
      // updatedAt didn't change, shouldn't update
      const page2 = {
        comments: [
          {
            timestamp: 1,
            cid: 'comment cid 1',
            subplebbitAddress: 'subplebbit address',
            updatedAt: 1,
            upvoteCount: 2,
          },
        ],
      }
      const page3 = {
        comments: [
          {
            timestamp: 1,
            cid: 'comment cid 1',
            subplebbitAddress: 'subplebbit address',
            updatedAt: 2,
            upvoteCount: 2,
          },
        ],
      }
      const page4 = {
        comments: [
          {
            timestamp: 100,
            cid: 'comment cid 2',
            subplebbitAddress: 'subplebbit address',
            updatedAt: 100,
            upvoteCount: 100,
          },
          {
            timestamp: 1,
            cid: 'comment cid 1',
            subplebbitAddress: 'subplebbit address',
            updatedAt: 3,
            upvoteCount: 3,
          },
        ],
      }
      const pages = [page1, page2, page3, page4]

      const simulateUpdateEvent = Comment.prototype.simulateUpdateEvent
      let comment
      Comment.prototype.simulateUpdateEvent = async function () {
        comment = this
        this.subplebbitAddress = 'subplebbit address'
        this.replies.pages = {best: pages.shift()}
        this.replies.pageCids = {}
        this.updatedAt = this.updatedAt ? this.updatedAt + 1 : 1
        this.updatingState = 'succeeded'
        this.emit('update', this)
        this.emit('updatingstatechange', 'succeeded')
      }

      const commentCid = 'comment cid 1'
      rendered.rerender({commentCid})

      // first comment update
      await waitFor(() => rendered.result.current.replies.length === 1)
      expect(pages.length).toBe(3)
      expect(rendered.result.current.replies.length).toBe(1)
      expect(rendered.result.current.updatedReplies.length).toBe(1)
      expect(rendered.result.current.replies[0].cid).toBe('comment cid 1')
      expect(rendered.result.current.updatedReplies[0].cid).toBe('comment cid 1')
      expect(rendered.result.current.replies[0].updatedAt).toBe(1)
      expect(rendered.result.current.updatedReplies[0].updatedAt).toBe(1)
      expect(rendered.result.current.replies[0].upvoteCount).toBe(1)
      expect(rendered.result.current.updatedReplies[0].upvoteCount).toBe(1)
      expect(rendered.result.current.hasMore).toBe(false)

      // second comment update (updatedAt doesn't change, so shouldn't update)
      comment.simulateUpdateEvent()
      await waitFor(() => commentsStore.getState().comments['comment cid 1'].replies.pages.best.comments[0].upvoteCount === 2)
      expect(pages.length).toBe(2)
      // comment in store updated, but the updatedAt didn't change so no change in useReplies().updatedReplies
      expect(commentsStore.getState().comments['comment cid 1'].replies.pages.best.comments[0].updatedAt).toBe(1)
      expect(commentsStore.getState().comments['comment cid 1'].replies.pages.best.comments[0].upvoteCount).toBe(2)
      expect(rendered.result.current.replies.length).toBe(1)
      expect(rendered.result.current.updatedReplies.length).toBe(1)
      expect(rendered.result.current.replies[0].cid).toBe('comment cid 1')
      expect(rendered.result.current.updatedReplies[0].cid).toBe('comment cid 1')
      expect(rendered.result.current.replies[0].updatedAt).toBe(1)
      expect(rendered.result.current.updatedReplies[0].updatedAt).toBe(1)
      expect(rendered.result.current.replies[0].upvoteCount).toBe(1)
      expect(rendered.result.current.updatedReplies[0].upvoteCount).toBe(1)
      expect(rendered.result.current.hasMore).toBe(false)

      // third comment update (updatedAt doesn't change, so shouldn't update)
      comment.simulateUpdateEvent()
      await waitFor(() => rendered.result.current.updatedReplies[0].updatedAt === 2)
      expect(pages.length).toBe(1)
      expect(rendered.result.current.replies.length).toBe(1)
      expect(rendered.result.current.updatedReplies.length).toBe(1)
      expect(rendered.result.current.replies[0].cid).toBe('comment cid 1')
      expect(rendered.result.current.updatedReplies[0].cid).toBe('comment cid 1')
      expect(rendered.result.current.replies[0].updatedAt).toBe(1)
      expect(rendered.result.current.updatedReplies[0].updatedAt).toBe(2)
      expect(rendered.result.current.replies[0].upvoteCount).toBe(1)
      expect(rendered.result.current.updatedReplies[0].upvoteCount).toBe(2)
      expect(rendered.result.current.hasMore).toBe(false)

      // fourth comment update
      comment.simulateUpdateEvent()
      await waitFor(() => rendered.result.current.updatedReplies[0].updatedAt === 3)
      expect(pages.length).toBe(0)
      expect(rendered.result.current.replies.length).toBe(2)
      expect(rendered.result.current.updatedReplies.length).toBe(2)
      expect(rendered.result.current.replies[0].cid).toBe('comment cid 1')
      expect(rendered.result.current.updatedReplies[0].cid).toBe('comment cid 1')
      expect(rendered.result.current.replies[0].updatedAt).toBe(1)
      expect(rendered.result.current.updatedReplies[0].updatedAt).toBe(3)
      expect(rendered.result.current.replies[0].upvoteCount).toBe(1)
      expect(rendered.result.current.updatedReplies[0].upvoteCount).toBe(3)
      expect(rendered.result.current.hasMore).toBe(false)
      expect(rendered.result.current.replies[1].cid).toBe('comment cid 2')
      expect(rendered.result.current.updatedReplies[1].cid).toBe('comment cid 2')

      Comment.prototype.simulateUpdateEvent = simulateUpdateEvent
    })
  })

  describe('useValidateComment', () => {
    let rendered, waitFor

    beforeEach(() => {
      rendered = renderHook<any, any>((options) => useValidateComment(options))
      waitFor = testUtils.createWaitFor(rendered)
    })
    afterEach(async () => {
      await testUtils.resetDatabasesAndStores()
    })

    test('is valid', async () => {
      expect(rendered.result.current.valid).toBe(false)
      expect(rendered.result.current.state).toBe('initializing')

      // the first render is always true, to avoid rerenders when true
      const comment = {cid: 'comment cid 1', subplebbitAddress: 'subplebbit address 1'}
      rendered.rerender({comment})
      expect(rendered.result.current.valid).toBe(true)
      expect(rendered.result.current.state).toBe('initializing') // valid true but still initializing
      await waitFor(() => rendered.result.current.state === 'succeeded')
      expect(rendered.result.current.state).toBe('succeeded')
      expect(rendered.result.current.valid).toBe(true)

      rendered.rerender({comment: undefined})
      expect(rendered.result.current.valid).toBe(false)
      expect(rendered.result.current.state).toBe('initializing')

      rendered.rerender({comment, validateReplies: false})
      expect(rendered.result.current.valid).toBe(true)
      expect(rendered.result.current.state).toBe('initializing') // valid true but still initializing
      await waitFor(() => rendered.result.current.state === 'succeeded')
      expect(rendered.result.current.state).toBe('succeeded')
      expect(rendered.result.current.valid).toBe(true)

      rendered.rerender({comment: undefined})
      expect(rendered.result.current.valid).toBe(false)
      expect(rendered.result.current.state).toBe('initializing')

      rendered.rerender({comment, validateReplies: true})
      expect(rendered.result.current.valid).toBe(true)
      expect(rendered.result.current.state).toBe('initializing') // valid true but still initializing
      await waitFor(() => rendered.result.current.state === 'succeeded')
      expect(rendered.result.current.state).toBe('succeeded')
      expect(rendered.result.current.valid).toBe(true)
    })

    test('is invalid', async () => {
      const validatePage = Pages.prototype.validatePage
      Pages.prototype.validatePage = async function () {
        throw Error('mocked page invalid')
      }

      expect(rendered.result.current.valid).toBe(false)
      expect(rendered.result.current.state).toBe('initializing')

      // the first render is always true, to avoid rerenders when true
      const comment = {cid: 'comment cid 1', subplebbitAddress: 'subplebbit address 1'}
      rendered.rerender({comment})
      expect(rendered.result.current.valid).toBe(true)
      expect(rendered.result.current.state).toBe('initializing')

      await waitFor(() => rendered.result.current.valid === false)
      expect(rendered.result.current.valid).toBe(false)
      expect(rendered.result.current.state).toBe('failed')

      Pages.prototype.validatePage = validatePage
    })
  })
})
