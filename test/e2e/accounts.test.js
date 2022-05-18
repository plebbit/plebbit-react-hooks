const { act, renderHook } = require('@testing-library/react-hooks/dom')
const { PlebbitProvider, useAccount } = require('../../dist')
const { mockPlebbitJs, default: PlebbitJsMock } = require('../../dist/lib/plebbit-js/plebbit-js-mock')
const testUtils = require('../../dist/lib/test-utils').default
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

describe('accounts', () => {
  describe('no accounts in database', () => {
    it('generate default account on load', async () => {
      const rendered = renderHook(() => useAccount(), { wrapper: PlebbitProvider })
      const waitFor = testUtils.createWaitFor(rendered, { timeout })

      expect(rendered.result.current).to.equal(undefined)

      await waitFor(() => rendered.result.current?.name === 'Account 1')

      const account = rendered.result.current
      expect(account.name).to.equal('Account 1')
      expect(account.author.displayName).to.equal(null)
      expect(typeof account.author.address).to.equal('string')
      expect(Array.isArray(account.subscriptions)).to.equal(true)
      expect(account.blockedAddresses && typeof account.blockedAddresses === 'object').to.equal(true)
      expect(account.plebbit && typeof account.plebbit === 'object').to.equal(true)
      expect(account.plebbitOptions && typeof account.plebbitOptions === 'object').to.equal(true)
      expect(account.plebbitOptions.ipfsGatewayUrl).to.equal('https://cloudflare-ipfs.com')
      expect(account.plebbitOptions.ipfsHttpClientOptions).to.equal(undefined)
      expect(account.plebbitOptions.pubsubHttpClientOptions).to.equal('https://pubsubprovider.xyz/api/v0')
    })
  })
})
