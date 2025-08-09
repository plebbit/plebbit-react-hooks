import {act, renderHook} from '@testing-library/react-hooks/dom'
import {useComment, setPlebbitJs, restorePlebbitJs, debugUtils} from '../../dist'
import testUtils from '../../dist/lib/test-utils'
import PlebbitJsMock from '../../dist/lib/plebbit-js/plebbit-js-mock'
// mock right after importing or sometimes fails to mock
setPlebbitJs(PlebbitJsMock)

const timeout = 2000

describe('comments (plebbit-js mock)', () => {
  before(async () => {
    console.log('before comments tests')
    testUtils.silenceReactWarnings()
    // reset before or init accounts sometimes fails
    await testUtils.resetDatabasesAndStores()
  })
  after(async () => {
    testUtils.restoreAll()
    await testUtils.resetDatabasesAndStores()
    console.log('after reset stores')
  })

  describe('no comments in database', () => {
    it('get comments one at a time', async () => {
      console.log('starting comments tests')
      const rendered = renderHook((commentCid) => useComment({commentCid}))
      const waitFor = testUtils.createWaitFor(rendered, {timeout})
      expect(rendered.result.current?.timestamp).to.equal(undefined)

      rendered.rerender('comment cid 1')
      await waitFor(() => typeof rendered.result.current?.timestamp === 'number')
      expect(typeof rendered.result.current?.timestamp).to.equal('number')
      expect(rendered.result.current?.cid).to.equal('comment cid 1')
      // wait for comment.on('update') to fetch the ipns
      await waitFor(() => typeof rendered.result.current?.cid === 'string' && typeof rendered.result.current?.upvoteCount === 'number')
      expect(rendered.result.current?.cid).to.equal('comment cid 1')
      expect(rendered.result.current?.upvoteCount).to.equal(3)

      rendered.rerender('comment cid 2')
      // wait for addCommentToStore action
      await waitFor(() => typeof rendered.result.current?.timestamp === 'number')
      expect(typeof rendered.result.current?.timestamp).to.equal('number')
      expect(rendered.result.current?.cid).to.equal('comment cid 2')
    })
  })
})
