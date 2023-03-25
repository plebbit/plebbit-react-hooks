// test plebbit-js mock content https://github.com/plebbit/plebbit-react-hooks/blob/master/docs/mock-content.md

window.process = {env: {}}
window.process.env.REACT_APP_PLEBBIT_REACT_HOOKS_MOCK_CONTENT = '1'
window.process.env.REACT_APP_PLEBBIT_REACT_HOOKS_MOCK_CONTENT_LOADING_TIME = '1000'

const {useComment, useSubplebbit, useFeed, useAccountSubplebbits, useAccount, setPlebbitJs} = require('../../dist')
const {default: PlebbitJsMockContent} = require('../../dist/lib/plebbit-js/plebbit-js-mock-content')
// mock right after importing or sometimes fails to mock
setPlebbitJs(PlebbitJsMockContent)

const accountsActions = require('../../dist/stores/accounts/accounts-actions')
const {act, renderHook} = require('@testing-library/react-hooks/dom')
const testUtils = require('../../dist/lib/test-utils').default

describe('mock content', () => {
  before(() => {
    testUtils.silenceReactWarnings()
  })
  after(() => {
    testUtils.restoreAll()
  })

  afterEach(async () => {
    await testUtils.resetDatabasesAndStores()
  })

  it('use comments', async () => {
    const rendered = renderHook((commentCid) => useComment({commentCid}))
    const waitFor = testUtils.createWaitFor(rendered, {timeout: 60000})

    rendered.rerender('QmXxWyFRBUReRNzyJueFLFh84Mtj7ycbySktRQ5ffZLVa0')
    await waitFor(() => typeof rendered.result.current.timestamp === 'number')
    console.log(rendered.result.current)
    expect(typeof rendered.result.current.timestamp).to.equal('number')
    await waitFor(() => typeof rendered.result.current.upvoteCount === 'number')
    console.log(rendered.result.current)
    expect(typeof rendered.result.current.upvoteCount).to.equal('number')

    rendered.rerender(null)
    await waitFor(() => rendered.result.current.timestamp === undefined)
    expect(rendered.result.current.timestamp).to.equal(undefined)
    await waitFor(() => rendered.result.current.upvoteCount === undefined)
    expect(rendered.result.current.upvoteCount).to.equal(undefined)

    rendered.rerender('QmXxWyFRBUReRNzyJueFLFh84Mtj7ycbySktRQ5ffZLVa1')
    await waitFor(() => typeof rendered.result.current.timestamp === 'number')
    expect(typeof rendered.result.current.timestamp).to.equal('number')
    await waitFor(() => typeof rendered.result.current.upvoteCount === 'number')
    console.log(rendered.result.current)
    expect(typeof rendered.result.current.upvoteCount).to.equal('number')

    rendered.rerender('QmXxWyFRBUReRNzyJueFLFh84Mtj7ycbySktRQ5ffZLVa2')
    await waitFor(() => typeof rendered.result.current.timestamp === 'number')
    expect(typeof rendered.result.current.timestamp).to.equal('number')
    await waitFor(() => typeof rendered.result.current.upvoteCount === 'number')
    console.log(rendered.result.current)
    expect(typeof rendered.result.current.upvoteCount).to.equal('number')

    rendered.rerender('QmXxWyFRBUReRNzyJueFLFh84Mtj7ycbySktRQ5ffZLVa3')
    await waitFor(() => typeof rendered.result.current.timestamp === 'number')
    expect(typeof rendered.result.current.timestamp).to.equal('number')
    await waitFor(() => typeof rendered.result.current.upvoteCount === 'number')
    console.log(rendered.result.current)
    expect(typeof rendered.result.current.upvoteCount).to.equal('number')

    // test getting from db
    await testUtils.resetStores()
    const rendered2 = renderHook((commentCid) => useComment({commentCid}))

    rendered2.rerender('QmXxWyFRBUReRNzyJueFLFh84Mtj7ycbySktRQ5ffZLVa3')
    await waitFor(() => typeof rendered2.result.current.subplebbitAddress === 'string')
    console.log(rendered2.result.current)
    expect(typeof rendered2.result.current.subplebbitAddress).to.equal('string')
    expect(typeof rendered2.result.current.timestamp).to.equal('number')
    expect(typeof rendered2.result.current.upvoteCount).to.equal('number')
  })

  it('use subplebbits', async () => {
    const rendered = renderHook((subplebbitAddress) => useSubplebbit({subplebbitAddress}))
    const waitFor = testUtils.createWaitFor(rendered, {timeout: 60000})

    rendered.rerender('anything2.eth')
    await waitFor(() => typeof rendered.result.current.updatedAt === 'number')
    // console.log(rendered.result.current?.posts?.pages?.hot?.comments)
    console.log(rendered.result.current)
    expect(rendered.result.current.address).to.equal('anything2.eth')
    expect(typeof rendered.result.current.updatedAt).to.equal('number')
    expect(typeof rendered.result.current.posts?.pages?.hot?.comments?.[0]?.cid).to.equal('string')
    expect(typeof rendered.result.current.posts?.pageCids?.new).to.equal('string')

    rendered.rerender(null)
    await waitFor(() => rendered.result.current.updatedAt === undefined)
    expect(rendered.result.current.updatedAt).to.equal(undefined)

    rendered.rerender('jokes2.eth')
    await waitFor(() => typeof rendered.result.current.updatedAt === 'number')
    // console.log(rendered.result.current?.posts?.pages?.hot?.comments)
    console.log(rendered.result.current)
    expect(rendered.result.current.address).to.equal('jokes2.eth')
    expect(typeof rendered.result.current.updatedAt).to.equal('number')
    expect(typeof rendered.result.current.posts?.pages?.hot?.comments?.[0]?.cid).to.equal('string')
    expect(typeof rendered.result.current.posts?.pageCids?.new).to.equal('string')

    rendered.rerender('12D3KooWANwdyPERMQaCgiMnTT1t3Lr4XLFbK1z4ptFVhW2ozg1z')
    await waitFor(() => typeof rendered.result.current.updatedAt === 'number')
    // console.log(rendered.result.current?.posts?.pages?.hot?.comments)
    console.log(rendered.result.current)
    expect(rendered.result.current.address).to.equal('12D3KooWANwdyPERMQaCgiMnTT1t3Lr4XLFbK1z4ptFVhW2ozg1z')
    expect(typeof rendered.result.current.updatedAt).to.equal('number')
    expect(typeof rendered.result.current.posts?.pages?.hot?.comments?.[0]?.cid).to.equal('string')
    expect(typeof rendered.result.current.posts?.pageCids?.new).to.equal('string')

    // test getting from db
    await testUtils.resetStores()
    const rendered2 = renderHook((subplebbitAddress) => useSubplebbit({subplebbitAddress}))

    rendered2.rerender('12D3KooWANwdyPERMQaCgiMnTT1t3Lr4XLFbK1z4ptFVhW2ozg1z')
    await waitFor(() => typeof rendered2.result.current.subplebbitAddress === 'string')
    console.log(rendered2.result.current)
    expect(rendered2.result.current.address).to.equal('12D3KooWANwdyPERMQaCgiMnTT1t3Lr4XLFbK1z4ptFVhW2ozg1z')
    expect(typeof rendered2.result.current.updatedAt).to.equal('number')
    expect(typeof rendered2.result.current.posts?.pages?.hot?.comments?.[0]?.cid).to.equal('string')
    expect(typeof rendered2.result.current.posts?.pageCids?.new).to.equal('string')
  })

  it('use feed', async () => {
    const rendered = renderHook((subplebbitAddresses) => useFeed({subplebbitAddresses, sortType: 'hot'}))
    const waitFor = testUtils.createWaitFor(rendered, {timeout: 120000})

    const scrollOnePage = async () => {
      const nextFeedLength = (rendered.result.current.feed?.length || 0) + 25
      act(() => {
        rendered.result.current.loadMore()
      })
      try {
        await rendered.waitFor(() => rendered.result.current.feed?.length >= nextFeedLength, {timeout: 120000})
      } catch (e) {
        console.error('scrollOnePage failed:', e)
      }
    }

    rendered.rerender(['jokes.eth', 'news.eth'])
    await waitFor(() => rendered.result.current.feed?.length > 0)
    console.log(rendered.result.current)
    expect(rendered.result.current.feed?.length).to.be.greaterThan(0)
    await scrollOnePage()
    await scrollOnePage()
    console.log(rendered.result.current)
    expect(rendered.result.current.feed?.length).to.be.greaterThan(50)
  })

  it('publish', async () => {
    const rendered = renderHook(() => useAccount())
    const waitFor = testUtils.createWaitFor(rendered, {timeout: 60000})

    await waitFor(() => typeof rendered.result.current.plebbit?.createComment === 'function')
    expect(typeof rendered.result.current.plebbit?.createComment).to.equal('function')

    console.log('publishing comment')
    let onChallengeVerificationCalled = false
    const onChallenge = (challenge, comment) => {
      console.log('challenge', challenge)
      comment.publishChallengeAnswers(['some answer...'])
    }
    const onChallengeVerification = (...args) => {
      console.log('challengeverification', args)
      onChallengeVerificationCalled = true
    }
    await accountsActions.publishComment({
      subplebbitAddress: 'news.eth',
      content: 'content',
      title: 'title',
      onChallenge,
      onChallengeVerification,
    })

    await waitFor(() => onChallengeVerificationCalled === true)
    expect(onChallengeVerificationCalled).to.equal(true)

    console.log('publishing vote')
    onChallengeVerificationCalled = false
    await accountsActions.publishVote({
      subplebbitAddress: 'news.eth',
      vote: 1,
      commentCid: 'some cid...',
      onChallenge,
      onChallengeVerification,
    })

    await waitFor(() => onChallengeVerificationCalled === true)
    expect(onChallengeVerificationCalled).to.equal(true)
  })

  it('use account subplebbits', async () => {
    const rendered = renderHook(() => {
      const account = useAccount()
      const {createSubplebbit} = accountsActions
      const accountSubplebbits = useAccountSubplebbits()
      return {createSubplebbit, accountSubplebbits, account}
    })
    const waitFor = testUtils.createWaitFor(rendered, {timeout: 60000})
    await waitFor(() => typeof rendered.result.current.account?.plebbit?.createSubplebbit === 'function')
    expect(typeof rendered.result.current.account?.plebbit?.createSubplebbit).to.equal('function')

    console.log('creating subplebbit')
    const subplebbit = await rendered.result.current.createSubplebbit({
      title: 'title',
      description: 'description',
    })
    console.log({subplebbit})
    expect(subplebbit.title).to.equal('title')

    // wait for account subplebbits
    await waitFor(() => JSON.stringify(rendered.result.current?.accountSubplebbits?.accountSubplebbits) !== '{}')
    expect(JSON.stringify(rendered.result.current?.accountSubplebbits?.accountSubplebbits)).not.to.equal('{}')
    console.log(rendered.result.current?.accountSubplebbits)

    // NOTE: this test won't change accountSubplebbits state, need to use publishSubplebbitEdit for that
    console.log('editing subplebbit')
    await subplebbit.edit({
      address: 'name.eth',
    })
    console.log({subplebbit})
    expect(subplebbit.address).to.equal('name.eth')
  })
})
