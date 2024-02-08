import PlebbitJsMock from './plebbit-js-mock'

describe('PlebbitJsMock', () => {
  test('Comment.state and Comment.updatingState', async () => {
    const plebbit = await PlebbitJsMock()
    const comment = await plebbit.createComment({cid: 'comment cid'})

    // initial state is stopped
    expect(comment.state).toBe('stopped')
    expect(comment.updatingState).toBe('stopped')

    const onStatechange = jest.fn(() => comment.state)
    const onUpdatingstatechange = jest.fn(() => comment.updatingState)

    comment.on('statechange', onStatechange)
    comment.on('updatingstatechange', onUpdatingstatechange)

    // wait for succeeded
    const succeededPromise = new Promise((resolve) =>
      comment.on('updatingstatechange', (state: string) => {
        state === 'succeeded' && resolve(state)
      }),
    )

    // start updating state
    await comment.update()
    expect(comment.state).toBe('updating')

    await succeededPromise
    expect(onStatechange.mock.calls[0]).toEqual(['updating'])
    expect(onStatechange.mock.results[0].value).toEqual('updating')
    expect(onStatechange.mock.calls.length).toBe(1)
    expect(onUpdatingstatechange.mock.calls[0]).toEqual(['fetching-ipfs'])
    expect(onUpdatingstatechange.mock.calls[1]).toEqual(['fetching-update-ipns'])
    expect(onUpdatingstatechange.mock.calls[2]).toEqual(['succeeded'])
    expect(onUpdatingstatechange.mock.calls.length).toBe(3)
    expect(onUpdatingstatechange.mock.results[0].value).toEqual('fetching-ipfs')
    expect(onUpdatingstatechange.mock.results[1].value).toEqual('fetching-update-ipns')
    expect(onUpdatingstatechange.mock.results[2].value).toEqual('succeeded')
  })

  test('Subplebbit.state and Subplebbit.updatingState', async () => {
    const plebbit = await PlebbitJsMock()
    const subplebbit = await plebbit.createSubplebbit({address: 'subplebbit address'})

    // initial state is stopped
    expect(subplebbit.state).toBe('stopped')
    expect(subplebbit.updatingState).toBe('stopped')

    const onStatechange = jest.fn(() => subplebbit.state)
    const onUpdatingstatechange = jest.fn(() => subplebbit.updatingState)

    subplebbit.on('statechange', onStatechange)
    subplebbit.on('updatingstatechange', onUpdatingstatechange)

    // wait for succeeded twice (2 updates)
    let succeededCount = 0
    const succeededPromise = new Promise((resolve) =>
      subplebbit.on('updatingstatechange', (state: string) => {
        state === 'succeeded' && ++succeededCount === 2 && resolve(state)
      }),
    )

    // start updating state
    await subplebbit.update()
    expect(subplebbit.state).toBe('updating')

    await succeededPromise
    expect(onStatechange.mock.calls[0]).toEqual(['updating'])
    expect(onStatechange.mock.results[0].value).toEqual('updating')
    expect(onStatechange.mock.calls.length).toBe(1)
    expect(onUpdatingstatechange.mock.calls[0]).toEqual(['fetching-ipns'])
    expect(onUpdatingstatechange.mock.calls[1]).toEqual(['succeeded'])
    expect(onUpdatingstatechange.mock.calls[2]).toEqual(['fetching-ipns'])
    expect(onUpdatingstatechange.mock.calls[3]).toEqual(['succeeded'])
    expect(onUpdatingstatechange.mock.calls.length).toBe(4)
    expect(onUpdatingstatechange.mock.results[0].value).toEqual('fetching-ipns')
    expect(onUpdatingstatechange.mock.results[1].value).toEqual('succeeded')
    expect(onUpdatingstatechange.mock.results[2].value).toEqual('fetching-ipns')
    expect(onUpdatingstatechange.mock.results[3].value).toEqual('succeeded')
  })

  test('Comment.publishingState', async () => {
    const plebbit = await PlebbitJsMock()
    const comment = await plebbit.createComment({content: 'content', subplebbitAddresses: 'subplebbit address'})

    // initial state is stopped
    expect(comment.state).toBe('stopped')
    expect(comment.publishingState).toBe('stopped')

    const onStatechange = jest.fn(() => comment.state)
    const onPublishingstatechange = jest.fn(() => comment.publishingState)

    comment.on('statechange', onStatechange)
    comment.on('publishingstatechange', onPublishingstatechange)

    // wait for succeeded
    const succeededPromise = new Promise((resolve) =>
      comment.on('publishingstatechange', (state: string) => {
        state === 'succeeded' && resolve(state)
      }),
    )

    // start publishing state
    comment.on('challenge', () => comment.publishChallengeAnswers(['4']))
    await comment.publish()
    expect(comment.state).toBe('publishing')

    await succeededPromise
    expect(onStatechange.mock.calls[0]).toEqual(['publishing'])
    expect(onStatechange.mock.calls.length).toBe(1)
    expect(onStatechange.mock.results[0].value).toEqual('publishing')
    expect(onPublishingstatechange.mock.calls[0]).toEqual(['publishing-challenge-request'])
    expect(onPublishingstatechange.mock.calls[1]).toEqual(['waiting-challenge-answers'])
    expect(onPublishingstatechange.mock.calls[2]).toEqual(['publishing-challenge-answer'])
    expect(onPublishingstatechange.mock.calls[3]).toEqual(['waiting-challenge-verification'])
    expect(onPublishingstatechange.mock.calls[4]).toEqual(['succeeded'])
    expect(onPublishingstatechange.mock.calls.length).toBe(5)
    expect(onPublishingstatechange.mock.results[0].value).toEqual('publishing-challenge-request')
    expect(onPublishingstatechange.mock.results[1].value).toEqual('waiting-challenge-answers')
    expect(onPublishingstatechange.mock.results[2].value).toEqual('publishing-challenge-answer')
    expect(onPublishingstatechange.mock.results[3].value).toEqual('waiting-challenge-verification')
    expect(onPublishingstatechange.mock.results[4].value).toEqual('succeeded')
  })
})
