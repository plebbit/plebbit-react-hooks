const { act, renderHook } = require('@testing-library/react-hooks/dom')
const { PlebbitProvider, useComment } = require('../../dist')
const { mockPlebbitJs, default: PlebbitJsMock } = require('../../dist/lib/plebbit-js/plebbit-js-mock')
mockPlebbitJs(PlebbitJsMock)

const timeout = 10000
const waitFor = async (rendered, cb) => {
  if (!rendered?.result || typeof cb !== 'function') {
    throw Error(`waitFor invalid arguments`)
  }
  try {
    await rendered.waitFor(() => Boolean(cb()), { timeout })
  } catch (e) {
    console.error(e)
  }
}

describe('comments', () => {
  describe('no comments in database', () => {
    it('get comments one at a time', async () => {
      const rendered = renderHook((commentCid) => useComment(commentCid), { wrapper: PlebbitProvider })
      expect(rendered.result.current).to.equal(undefined)
      rendered.rerender('comment cid 1')
      await waitFor(rendered, () => typeof rendered.result.current?.cid === 'string')

      expect(rendered.result.current.cid).to.equal('comment cid 1')
      // wait for comment.on('update') to fetch the ipns
      await waitFor(
        rendered,
        () =>
          typeof rendered.result.current?.cid === 'string' && typeof rendered.result.current?.upvoteCount === 'number'
      )
      expect(rendered.result.current?.cid).to.equal('comment cid 1')
      expect(rendered.result.current?.upvoteCount).to.equal(3)

      rendered.rerender('comment cid 2')
      // wait for addCommentToContext action
      await waitFor(rendered, () => typeof rendered.result.current?.cid === 'string')
      expect(rendered.result.current?.cid).to.equal('comment cid 2')
    })
  })
})
