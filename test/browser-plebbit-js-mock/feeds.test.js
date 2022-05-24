const {act, renderHook} = require('@testing-library/react-hooks/dom')
const {PlebbitProvider, useFeed, setPlebbitJs, restorePlebbitJs, debugUtils} = require('../../dist')
const {default: PlebbitJsMock} = require('../../dist/lib/plebbit-js/plebbit-js-mock')
const testUtils = require('../../dist/lib/test-utils').default

const timeout = 10000

describe('feeds (plebbit-js mock)', () => {
  before(() => {
    setPlebbitJs(PlebbitJsMock)
    testUtils.silenceUpdateUnmountedComponentWarning()
  })
  after(async () => {
    testUtils.restoreAll()
    await debugUtils.deleteDatabases()
    restorePlebbitJs()
  })

  describe('get feed', () => {
    // reddit infinite scrolling posts per pages are 25
    const postsPerPage = 25
    let rendered
    let waitFor

    const scrollOnePage = async () => {
      const nextFeedLength = (rendered.result.current.feed?.length || 0) + postsPerPage
      act(() => {
        rendered.result.current.loadMore()
      })
      await waitFor(() => rendered.result.current.feed?.length >= nextFeedLength)
    }

    beforeEach(async () => {
      rendered = renderHook((props) => useFeed(props?.subplebbitAddresses, props?.sortType, props?.accountName), {
        wrapper: PlebbitProvider,
      })
      waitFor = testUtils.createWaitFor(rendered, {timeout})
    })

    it('get feed with no arguments', async () => {
      expect(rendered.result.current.feed).to.equal(undefined)
      expect(typeof rendered.result.current.hasMore).to.equal('boolean')
      expect(typeof rendered.result.current.loadMore).to.equal('function')
    })

    it('get feed page 1 with 1 subplebbit sorted by default (hot)', async () => {
      // get feed with 1 sub
      rendered.rerender({subplebbitAddresses: ['subplebbit address 1']})
      // initial state
      expect(typeof rendered.result.current.hasMore).to.equal('boolean')
      expect(typeof rendered.result.current.loadMore).to.equal('function')

      // wait for feed array to render
      await waitFor(() => Array.isArray(rendered.result.current.feed))
      expect(rendered.result.current.feed).to.deep.equal([])

      // wait for posts to be added, should get full first page
      await waitFor(() => rendered.result.current.feed.length > 0)
      // NOTE: the 'hot' sort type uses timestamps and bugs out with timestamp '1-100' so this is why we get cid 1
      // with low upvote count first
      expect(rendered.result.current.feed[0].cid).to.equal('subplebbit address 1 page cid hot comment cid 1')
      expect(rendered.result.current.feed.length).to.equal(postsPerPage)
    })

    it('change subplebbit addresses and sort type', async () => {
      rendered.rerender({subplebbitAddresses: ['subplebbit address 1'], sortType: 'hot'})
      await waitFor(() => !!rendered.result.current.feed[0].cid.match(/subplebbit address 1/))
      expect(rendered.result.current.feed[0].cid).to.match(/subplebbit address 1/)
      expect(rendered.result.current.feed.length).to.equal(postsPerPage)

      // change subplebbit addresses
      rendered.rerender({subplebbitAddresses: ['subplebbit address 2', 'subplebbit address 3'], sortType: 'hot'})
      await waitFor(() => !!rendered.result.current.feed[0].cid.match(/subplebbit address (2|3)/))
      expect(rendered.result.current.feed[0].cid).to.match(/subplebbit address (2|3)/)
      // the 'hot' sort type should give timestamp 1 with the current mock
      expect(rendered.result.current.feed[0].timestamp).to.equal(1)
      expect(rendered.result.current.feed.length).to.equal(postsPerPage)

      // change sort type
      rendered.rerender({subplebbitAddresses: ['subplebbit address 2', 'subplebbit address 3'], sortType: 'new'})
      await waitFor(() => !!rendered.result.current.feed[0].cid.match(/subplebbit address (2|3)/))
      expect(rendered.result.current.feed[0].cid).to.match(/subplebbit address (2|3)/)
      // the 'new' sort type should give timestamp higher than 99 with the current mock
      expect(rendered.result.current.feed[0].timestamp).to.be.greaterThan(99)
      expect(rendered.result.current.feed.length).to.equal(postsPerPage)

      // change subplebbit addresses and sort type
      rendered.rerender({subplebbitAddresses: ['subplebbit address 4', 'subplebbit address 5'], sortType: 'topAll'})
      await waitFor(() => !!rendered.result.current.feed[0].cid.match(/subplebbit address (4|5)/))
      expect(rendered.result.current.feed[0].cid).to.match(/subplebbit address (4|5)/)
      expect(rendered.result.current.feed.length).to.equal(postsPerPage)
    })

    it('get feed with 1 subplebbit and scroll to multiple pages', async () => {
      // get feed with 1 sub
      rendered.rerender({subplebbitAddresses: ['subplebbit address 1']})
      // wait for posts to be added, should get full first page
      await waitFor(() => rendered.result.current.feed.length > 0)

      let pages = 20
      let currentPage = 1
      while (currentPage++ < pages) {
        // load 25 more posts
        act(() => {
          rendered.result.current.loadMore()
        })
        await waitFor(() => rendered.result.current.feed?.length >= postsPerPage * currentPage)
        expect(rendered.result.current.feed.length).to.equal(postsPerPage * currentPage)
      }
    })

    // use this as stress test
    it.skip('(long stress test) get feed with 25 subplebbit and scroll to 1000 pages', async () => {
      const subplebbitAddresses = []
      while (subplebbitAddresses.length < 25) {
        subplebbitAddresses.push(`subplebbit address ${subplebbitAddresses.length + 1}`)
      }
      rendered.rerender({subplebbitAddresses})
      // wait for posts to be added, should get full first page
      await waitFor(() => rendered.result.current.feed.length > 0)

      let pages = 1000
      let currentPage = 1
      while (currentPage++ < pages) {
        console.log('page', currentPage)
        console.log('feed length', rendered.result.current.feed.length)
        // load 25 more posts
        act(() => {
          rendered.result.current.loadMore()
        })
        await waitFor(() => rendered.result.current.feed?.length >= postsPerPage * currentPage)
        expect(rendered.result.current.feed.length).to.equal(postsPerPage * currentPage)
      }
    })
  })
})
