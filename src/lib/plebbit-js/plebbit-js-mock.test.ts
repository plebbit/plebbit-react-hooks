import PlebbitJsMock from './plebbit-js-mock'

describe('PlebbitJsMock', () => {
  beforeAll(() => {})
  afterAll(() => {})
  afterEach(async () => {})

  describe('Comments states', () => {
    test('Comment.state and Comment.updatingState', async () => {
      // const loadingTime = PlebbitJsMock.loadingTime
      // PlebbitJsMock.loadingTime = 1000
      const plebbit = await PlebbitJsMock()
      const comment = await plebbit.getComment('comment cid')

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
        })
      )

      // start updating state
      await comment.update()
      expect(comment.state).toBe('updating')

      await succeededPromise
      expect(onStatechange.mock.calls[0]).toEqual(['updating'])
      expect(onStatechange.mock.results[0].value).toEqual('updating')
      expect(onUpdatingstatechange.mock.calls[0]).toEqual(['fetching-ipns'])
      expect(onUpdatingstatechange.mock.calls[1]).toEqual(['succeeded'])
      expect(onUpdatingstatechange.mock.results[0].value).toEqual('fetching-ipns')
      expect(onUpdatingstatechange.mock.results[1].value).toEqual('succeeded')
    })
  })
})
