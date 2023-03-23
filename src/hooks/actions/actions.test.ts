import {act, renderHook} from '@testing-library/react-hooks'
import testUtils from '../../lib/test-utils'
import {
  useSubscribe,
  usePublishComment,
  usePublishCommentEdit,
  usePublishSubplebbitEdit,
  usePublishVote,
  useBlock,
  useAccount,
  useCreateSubplebbit,
  setPlebbitJs,
} from '../..'
import PlebbitJsMock, {
  Plebbit,
  Comment,
  CommentEdit,
  SubplebbitEdit,
  Vote,
  Subplebbit,
  Pages,
  resetPlebbitJsMock,
  debugPlebbitJsMock,
} from '../../lib/plebbit-js/plebbit-js-mock'
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
      await waitFor(() => rendered.result.current[1].state === 'ready')
      expect(rendered.result.current[1].state).toBe('ready')
      expect(rendered.result.current[1].subscribed).toBe(true)
    })
  })

  describe('useBlock', () => {
    let rendered: any, waitFor: Function

    beforeEach(async () => {
      rendered = renderHook<any, any>((useBlockOptionsArray = []) => {
        const result1 = useBlock(useBlockOptionsArray[0])
        const result2 = useBlock(useBlockOptionsArray[1])
        return [result1, result2]
      })
      waitFor = testUtils.createWaitFor(rendered)
    })

    afterEach(async () => {
      await testUtils.resetDatabasesAndStores()
    })

    test(`block and unblock two addresses (subplebbit addresses)`, async () => {
      const address = 'address.eth'
      const address2 = 'address2.eth'

      expect(rendered.result.current[0].state).toBe('initializing')
      expect(rendered.result.current[0].blocked).toBe(undefined)
      expect(typeof rendered.result.current[0].block).toBe('function')
      expect(typeof rendered.result.current[0].unblock).toBe('function')

      // get the default value
      rendered.rerender([{address}])
      await waitFor(() => typeof rendered.result.current[0].blocked === 'boolean')
      expect(rendered.result.current[0].state).toBe('ready')
      expect(rendered.result.current[0].blocked).toBe(false)

      // block to 1 address
      await act(async () => {
        await rendered.result.current[0].block()
      })
      await waitFor(() => rendered.result.current[0].blocked === true)
      expect(rendered.result.current[0].blocked).toEqual(true)

      // fail blocking twice
      expect(rendered.result.current[0].errors.length).toBe(0)
      await act(async () => {
        await rendered.result.current[0].block()
      })
      expect(rendered.result.current[0].errors.length).toBe(1)

      // unblock
      await act(async () => {
        await rendered.result.current[0].unblock()
      })
      await waitFor(() => rendered.result.current[0].blocked === false)
      expect(rendered.result.current[0].blocked).toEqual(false)

      // fail unblocking twice
      expect(rendered.result.current[0].errors.length).toBe(1)
      await act(async () => {
        await rendered.result.current[0].unblock()
      })
      expect(rendered.result.current[0].errors.length).toBe(2)

      // block 2 addresses
      rendered.rerender([{address}, {address: address2}])
      await waitFor(() => rendered.result.current[0].state === 'ready')
      await waitFor(() => rendered.result.current[1].state === 'ready')
      expect(rendered.result.current[0].state).toBe('ready')
      expect(rendered.result.current[1].state).toBe('ready')
      expect(rendered.result.current[0].blocked).toBe(false)
      expect(rendered.result.current[1].blocked).toBe(false)

      await act(async () => {
        await rendered.result.current[0].block()
        await rendered.result.current[1].block()
      })
      await waitFor(() => rendered.result.current[0].blocked === true)
      await waitFor(() => rendered.result.current[1].blocked === true)
      expect(rendered.result.current[0].blocked).toBe(true)
      expect(rendered.result.current[1].blocked).toBe(true)

      // unblock with 2 addresses
      await act(async () => {
        await rendered.result.current[0].unblock()
      })
      await waitFor(() => rendered.result.current[0].blocked === false)
      expect(rendered.result.current[0].blocked).toBe(false)
      expect(rendered.result.current[1].blocked).toBe(true)

      // reset stores to force using the db
      await testUtils.resetStores()

      // subscribing persists in database after store reset
      const rendered2 = renderHook<any, any>(() => useBlock({address: address2}))
      const waitFor2 = testUtils.createWaitFor(rendered2)
      await waitFor(() => rendered.result.current[1].state === 'ready')
      expect(rendered.result.current[1].state).toBe('ready')
      expect(rendered.result.current[1].blocked).toBe(true)
    })

    test(`block and unblock two cids (hide comment)`, async () => {
      const cid = 'comment cid 1'
      const cid2 = 'comment cid 2'

      expect(rendered.result.current[0].state).toBe('initializing')
      expect(rendered.result.current[0].blocked).toBe(undefined)
      expect(typeof rendered.result.current[0].block).toBe('function')
      expect(typeof rendered.result.current[0].unblock).toBe('function')

      // get the default value
      rendered.rerender([{cid}])
      await waitFor(() => typeof rendered.result.current[0].blocked === 'boolean')
      expect(rendered.result.current[0].state).toBe('ready')
      expect(rendered.result.current[0].blocked).toBe(false)

      // block to 1 cid
      await act(async () => {
        await rendered.result.current[0].block()
      })
      await waitFor(() => rendered.result.current[0].blocked === true)
      expect(rendered.result.current[0].blocked).toEqual(true)

      // fail blocking twice
      expect(rendered.result.current[0].errors.length).toBe(0)
      await act(async () => {
        await rendered.result.current[0].block()
      })
      expect(rendered.result.current[0].errors.length).toBe(1)

      // unblock
      await act(async () => {
        await rendered.result.current[0].unblock()
      })
      await waitFor(() => rendered.result.current[0].blocked === false)
      expect(rendered.result.current[0].blocked).toEqual(false)

      // fail unblocking twice
      expect(rendered.result.current[0].errors.length).toBe(1)
      await act(async () => {
        await rendered.result.current[0].unblock()
      })
      expect(rendered.result.current[0].errors.length).toBe(2)

      // block 2 cids
      rendered.rerender([{cid}, {cid: cid2}])
      await waitFor(() => rendered.result.current[0].state === 'ready')
      await waitFor(() => rendered.result.current[1].state === 'ready')
      expect(rendered.result.current[0].state).toBe('ready')
      expect(rendered.result.current[1].state).toBe('ready')
      expect(rendered.result.current[0].blocked).toBe(false)
      expect(rendered.result.current[1].blocked).toBe(false)

      await act(async () => {
        await rendered.result.current[0].block()
        await rendered.result.current[1].block()
      })
      await waitFor(() => rendered.result.current[0].blocked === true)
      await waitFor(() => rendered.result.current[1].blocked === true)
      expect(rendered.result.current[0].blocked).toBe(true)
      expect(rendered.result.current[1].blocked).toBe(true)

      // unblock with 2 cids
      await act(async () => {
        await rendered.result.current[0].unblock()
      })
      await waitFor(() => rendered.result.current[0].blocked === false)
      expect(rendered.result.current[0].blocked).toBe(false)
      expect(rendered.result.current[1].blocked).toBe(true)

      // reset stores to force using the db
      await testUtils.resetStores()

      // subscribing persists in database after store reset
      const rendered2 = renderHook<any, any>(() => useBlock({cid: cid2}))
      const waitFor2 = testUtils.createWaitFor(rendered2)
      await waitFor(() => rendered.result.current[1].state === 'ready')
      expect(rendered.result.current[1].state).toBe('ready')
      expect(rendered.result.current[1].blocked).toBe(true)
    })
  })

  describe('useCreateSubplebbit', () => {
    let rendered: any, waitFor: Function

    beforeEach(async () => {
      rendered = renderHook<any, any>((useCreateSubplebbitOptions = []) => {
        const result1 = useCreateSubplebbit(useCreateSubplebbitOptions[0])
        const result2 = useCreateSubplebbit(useCreateSubplebbitOptions[1])
        return [result1, result2]
      })
      waitFor = testUtils.createWaitFor(rendered)
    })

    afterEach(async () => {
      await testUtils.resetDatabasesAndStores()
    })

    test(`can create subplebbit`, async () => {
      expect(rendered.result.current[0].state).toBe('initializing')
      expect(rendered.result.current[0].createdSubplebbit).toBe(undefined)
      expect(typeof rendered.result.current[0].createSubplebbit).toBe('function')

      const options1 = {
        title: 'title',
      }

      // add options
      rendered.rerender([options1])
      await waitFor(() => rendered.result.current[0].state === 'ready')
      expect(rendered.result.current[0].state).toBe('ready')
      expect(rendered.result.current[0].createdSubplebbit).toBe(undefined)

      // create subplebbit
      await act(async () => {
        await rendered.result.current[0].createSubplebbit()
      })
      await waitFor(() => rendered.result.current[0].createdSubplebbit)
      expect(rendered.result.current[0].state).toBe('succeeded')
      expect(rendered.result.current[0].createdSubplebbit?.title).toBe(options1.title)

      // useCreateSubplebbit 2 with same option not created
      rendered.rerender([options1, options1])
      await waitFor(() => rendered.result.current[1].state === 'ready')
      expect(rendered.result.current[1].state).toBe('ready')
      expect(rendered.result.current[1].createdSubplebbit).toBe(undefined)
    })

    test(`can error`, async () => {
      // mock the comment publish to error out
      const createSubplebbit = Plebbit.prototype.createSubplebbit
      Plebbit.prototype.createSubplebbit = async () => {
        throw Error('create subplebbit error')
      }

      const options1 = {
        title: 'title',
      }

      // add options
      rendered.rerender([options1])
      await waitFor(() => rendered.result.current[0].state === 'ready')
      expect(rendered.result.current[0].state).toBe('ready')
      expect(rendered.result.current[0].createdSubplebbit).toBe(undefined)

      // create subplebbit
      await act(async () => {
        await rendered.result.current[0].createSubplebbit()
      })
      // wait for error
      await waitFor(() => rendered.result.current[0].error)
      expect(rendered.result.current[0].error.message).toBe('create subplebbit error')
      expect(rendered.result.current[0].createdSubplebbit).toBe(undefined)
      expect(rendered.result.current[0].state).toBe('failed')
      expect(rendered.result.current[0].errors.length).toBe(1)

      // restore mock
      Plebbit.prototype.createSubplebbit = createSubplebbit
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
        subplebbitAddress: '12D3KooW... acions.test',
        parentCid: 'Qm... acions.test',
        content: 'some content acions.test',
      }
      rendered.rerender(publishCommentOptions)

      // wait for ready
      await waitFor(() => rendered.result.current.state === 'ready')
      expect(rendered.result.current.state).toBe('ready')

      // publish
      await act(async () => {
        await rendered.result.current.publishComment()
      })

      await waitFor(() => rendered.result.current.state === 'publishing-challenge-request')
      expect(rendered.result.current.state).toBe('publishing-challenge-request')

      // wait for challenge
      await waitFor(() => rendered.result.current.challenge)
      expect(rendered.result.current.error).toBe(undefined)
      expect(rendered.result.current.challenge.challenges).toEqual([{challenge: '2+2=?', type: 'text'}])
      expect(rendered.result.current.state).toBe('waiting-challenge-answers')

      // publish challenge verification
      act(() => {
        rendered.result.current.publishChallengeAnswers(['4'])
      })

      await waitFor(() => rendered.result.current.state === 'publishing-challenge-answer')
      expect(rendered.result.current.state).toBe('publishing-challenge-answer')

      await waitFor(() => rendered.result.current.state === 'waiting-challenge-verification')
      expect(rendered.result.current.state).toBe('waiting-challenge-verification')

      // wait for challenge verification
      await waitFor(() => rendered.result.current.challengeVerification)
      expect(rendered.result.current.state).toBe('succeeded')
      expect(typeof rendered.result.current.index).toBe('number')
      expect(rendered.result.current.challengeVerification.challengeSuccess).toBe(true)
      expect(rendered.result.current.error).toBe(undefined)
    })

    test(`can error`, async () => {
      // mock the comment publish to error out
      const commentPublish = Comment.prototype.publish
      Comment.prototype.publish = async () => {
        throw Error('publish error')
      }

      const publishCommentOptions = {
        subplebbitAddress: '12D3KooW... acions.test',
        parentCid: 'Qm... acions.test',
        content: 'some content acions.test',
      }
      rendered.rerender(publishCommentOptions)

      // wait for ready
      await waitFor(() => rendered.result.current.state === 'ready')
      expect(rendered.result.current.state).toBe('ready')
      expect(rendered.result.current.error).toBe(undefined)

      // publish
      await act(async () => {
        await rendered.result.current.publishComment()
      })

      // wait for error
      await waitFor(() => rendered.result.current.error)
      expect(rendered.result.current.error.message).toBe('publish error')
      expect(rendered.result.current.errors.length).toBe(1)

      // restore mock
      Comment.prototype.publish = commentPublish
    })
  })

  describe('usePublishCommentEdit', () => {
    let rendered: any, waitFor: Function

    beforeEach(async () => {
      rendered = renderHook<any, any>((options) => {
        const result = usePublishCommentEdit(options)
        return result
      })
      waitFor = testUtils.createWaitFor(rendered)
    })

    afterEach(async () => {
      await testUtils.resetDatabasesAndStores()
    })

    test(`can publish comment edit`, async () => {
      const publishCommentEditOptions = {
        subplebbitAddress: '12D3KooW... acions.test',
        commentCid: 'Qm... acions.test',
        removed: true,
      }
      rendered.rerender(publishCommentEditOptions)

      // wait for ready
      await waitFor(() => rendered.result.current.state === 'ready')
      expect(rendered.result.current.state).toBe('ready')

      // publish
      await act(async () => {
        await rendered.result.current.publishCommentEdit()
      })

      // wait for challenge
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

    test(`can error`, async () => {
      // mock the comment edit publish to error out
      const commentEditPublish = CommentEdit.prototype.publish
      CommentEdit.prototype.publish = async () => {
        throw Error('publish error')
      }

      const publishCommentEditOptions = {
        subplebbitAddress: '12D3KooW... acions.test',
        commentCid: 'Qm... acions.test',
        removed: true,
      }
      rendered.rerender(publishCommentEditOptions)

      // wait for ready
      await waitFor(() => rendered.result.current.state === 'ready')
      expect(rendered.result.current.state).toBe('ready')
      expect(rendered.result.current.error).toBe(undefined)

      // publish
      await act(async () => {
        await rendered.result.current.publishCommentEdit()
      })

      // wait for error
      await waitFor(() => rendered.result.current.error)
      expect(rendered.result.current.error.message).toBe('publish error')
      expect(rendered.result.current.errors.length).toBe(1)

      // restore mock
      CommentEdit.prototype.publish = commentEditPublish
    })
  })

  describe('usePublishSubplebbitEdit', () => {
    let rendered: any, waitFor: Function

    beforeEach(async () => {
      rendered = renderHook<any, any>((options) => {
        const result = usePublishSubplebbitEdit(options)
        return result
      })
      waitFor = testUtils.createWaitFor(rendered)
    })

    afterEach(async () => {
      await testUtils.resetDatabasesAndStores()
    })

    test(`can publish subplebbit edit`, async () => {
      const publishSubplebbitEditOptions = {
        subplebbitAddress: '12D3KooW... acions.test',
        title: 'new title',
      }
      rendered.rerender(publishSubplebbitEditOptions)

      // wait for ready
      await waitFor(() => rendered.result.current.state === 'ready')
      expect(rendered.result.current.state).toBe('ready')

      // publish
      await act(async () => {
        await rendered.result.current.publishSubplebbitEdit()
      })

      // wait for challenge
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

    test(`can error`, async () => {
      // mock the subplebbit edit publish to error out
      const subplebbitEditPublish = SubplebbitEdit.prototype.publish
      SubplebbitEdit.prototype.publish = async () => {
        throw Error('publish error')
      }

      const publishSubplebbitEditOptions = {
        subplebbitAddress: '12D3KooW... acions.test',
        title: 'new title',
      }
      rendered.rerender(publishSubplebbitEditOptions)

      // wait for ready
      await waitFor(() => rendered.result.current.state === 'ready')
      expect(rendered.result.current.state).toBe('ready')
      expect(rendered.result.current.error).toBe(undefined)

      // publish
      await act(async () => {
        await rendered.result.current.publishSubplebbitEdit()
      })

      // wait for error
      await waitFor(() => rendered.result.current.error)
      expect(rendered.result.current.error.message).toBe('publish error')
      expect(rendered.result.current.errors.length).toBe(1)

      // restore mock
      SubplebbitEdit.prototype.publish = subplebbitEditPublish
    })
  })

  describe('usePublishVote', () => {
    let rendered: any, waitFor: Function

    beforeEach(async () => {
      rendered = renderHook<any, any>((options) => {
        const result = usePublishVote(options)
        return result
      })
      waitFor = testUtils.createWaitFor(rendered)
    })

    afterEach(async () => {
      await testUtils.resetDatabasesAndStores()
    })

    test(`can publish vote`, async () => {
      const publishVoteOptions = {
        subplebbitAddress: '12D3KooW... acions.test',
        commentCid: 'Qm... acions.test',
        vote: 1,
      }
      rendered.rerender(publishVoteOptions)

      // wait for ready
      await waitFor(() => rendered.result.current.state === 'ready')
      expect(rendered.result.current.state).toBe('ready')

      // publish
      await act(async () => {
        await rendered.result.current.publishVote()
      })

      // wait for challenge
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

    test(`can error`, async () => {
      // mock the vote publish to error out
      const votePublish = Vote.prototype.publish
      Vote.prototype.publish = async () => {
        throw Error('publish error')
      }

      const publishVoteOptions = {
        subplebbitAddress: '12D3KooW... acions.test',
        commentCid: 'Qm... acions.test',
        vote: 1,
      }
      rendered.rerender(publishVoteOptions)

      // wait for ready
      await waitFor(() => rendered.result.current.state === 'ready')
      expect(rendered.result.current.state).toBe('ready')
      expect(rendered.result.current.error).toBe(undefined)

      // publish
      await act(async () => {
        await rendered.result.current.publishVote()
      })

      // wait for error
      await waitFor(() => rendered.result.current.error)
      expect(rendered.result.current.error.message).toBe('publish error')
      expect(rendered.result.current.errors.length).toBe(1)

      // restore mock
      Vote.prototype.publish = votePublish
    })
  })
})
