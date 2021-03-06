const {act, renderHook} = require('@testing-library/react-hooks/dom')
const {PlebbitProvider, useComment, setPlebbitJs, restorePlebbitJs, debugUtils} = require('../../dist')
const testUtils = require('../../dist/lib/test-utils').default
const {default: PlebbitJsMock} = require('../../dist/lib/plebbit-js/plebbit-js-mock')

const timeout = 10000

describe('comments (plebbit-js mock)', () => {
  before(() => {
    setPlebbitJs(PlebbitJsMock)
    testUtils.silenceUpdateUnmountedComponentWarning()
  })
  after(async () => {
    testUtils.restoreAll()
    await debugUtils.deleteDatabases()
    restorePlebbitJs()
  })

  describe('no comments in database', () => {
    it('get comments one at a time', async () => {
      const rendered = renderHook((commentCid) => useComment(commentCid), {wrapper: PlebbitProvider})
      const waitFor = testUtils.createWaitFor(rendered, {timeout})
      expect(rendered.result.current).to.equal(undefined)

      rendered.rerender('comment cid 1')
      await waitFor(() => typeof rendered.result.current?.cid === 'string')

      expect(rendered.result.current.cid).to.equal('comment cid 1')
      // wait for comment.on('update') to fetch the ipns
      await waitFor(() => typeof rendered.result.current?.cid === 'string' && typeof rendered.result.current?.upvoteCount === 'number')
      expect(rendered.result.current?.cid).to.equal('comment cid 1')
      expect(rendered.result.current?.upvoteCount).to.equal(3)

      rendered.rerender('comment cid 2')
      // wait for addCommentToContext action
      await waitFor(() => typeof rendered.result.current?.cid === 'string')
      expect(rendered.result.current?.cid).to.equal('comment cid 2')
    })
  })
})
