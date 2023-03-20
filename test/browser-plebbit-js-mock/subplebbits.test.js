const {act, renderHook} = require('@testing-library/react-hooks/dom')
const {useSubplebbit, setPlebbitJs, restorePlebbitJs, debugUtils} = require('../../dist')
const testUtils = require('../../dist/lib/test-utils').default
const {default: PlebbitJsMock} = require('../../dist/lib/plebbit-js/plebbit-js-mock')
// mock right after importing or sometimes fails to mock
setPlebbitJs(PlebbitJsMock)

const timeout = 10000

describe('subplebbits (plebbit-js mock)', () => {
  before(async () => {
    console.log('before subplebbits tests')
    testUtils.silenceReactWarnings()
    // reset before or init accounts sometimes fails
    await testUtils.resetDatabasesAndStores()
  })
  after(async () => {
    testUtils.restoreAll()
    await testUtils.resetDatabasesAndStores()
    console.log('after reset stores')
  })

  describe('no subplebbits in database', () => {
    it('get subplebbits one at a time', async () => {
      console.log('starting subplebbits tests')
      const rendered = renderHook((subplebbitAddress) => useSubplebbit({subplebbitAddress}))
      const waitFor = testUtils.createWaitFor(rendered, {timeout})

      expect(rendered.result.current?.updatedAt).to.equal(undefined)
      rendered.rerender('subplebbit address 1')
      await waitFor(() => typeof rendered.result.current.address === 'string')
      expect(rendered.result.current.address).to.equal('subplebbit address 1')
      expect(rendered.result.current.title).to.equal('subplebbit address 1 title')
      // wait for subplebbit.on('update') to fetch the updated description
      await waitFor(() => typeof rendered.result.current.description === 'string')
      expect(rendered.result.current.description).to.equal('subplebbit address 1 description updated')

      rendered.rerender('subplebbit address 2')
      await waitFor(() => typeof rendered.result.current.address === 'string')
      expect(rendered.result.current.address).to.equal('subplebbit address 2')
      expect(rendered.result.current.title).to.equal('subplebbit address 2 title')
      // wait for subplebbit.on('update') to fetch the updated description
      await waitFor(() => typeof rendered.result.current.description === 'string')
      expect(rendered.result.current.description).to.equal('subplebbit address 2 description updated')
    })
  })
})
