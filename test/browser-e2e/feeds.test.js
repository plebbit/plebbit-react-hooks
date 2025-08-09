import * as monitor from '../test-server/monitor-test-server'
import {act, renderHook} from '@testing-library/react-hooks/dom'
import {useFeed, useBufferedFeeds, useAccount, useAccountVotes, useAccountComments, useValidateComment} from '../../dist'
import debugUtils from '../../dist/lib/debug-utils'
import * as accountsActions from '../../dist/stores/accounts/accounts-actions'
import testUtils from '../../dist/lib/test-utils'
import * as serverConfig from '../test-server/config'
import signers from '../fixtures/signers'
const subplebbitAddress = signers[0].address
const isBase64 = (testString) => /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}))?$/gm.test(testString)

// large value for manual debugging
const timeout = 600000

// run tests using plebbit options gateway and httpClient
const {offlineIpfs, pubsubIpfs, plebbitRpc} = serverConfig
const localGatewayUrl = `http://localhost:${offlineIpfs.gatewayPort}`
const localIpfsProviderUrl = `http://localhost:${offlineIpfs.apiPort}`
const localPubsubProviderUrl = `http://localhost:${pubsubIpfs.apiPort}/api/v0`
const localPlebbitRpcUrl = `ws://127.0.0.1:${plebbitRpc.port}`
const plebbitOptionsTypes = {
  'kubo rpc client': {
    kuboRpcClientsOptions: [localIpfsProviderUrl],
    // define pubsubKuboRpcClientsOptions with localPubsubProviderUrl because
    // localIpfsProviderUrl is offline node with no pubsub
    pubsubKuboRpcClientsOptions: [localPubsubProviderUrl],
    resolveAuthorAddresses: false,
    validatePages: false,
  },
  'gateway and pubsub provider': {
    ipfsGatewayUrls: [localGatewayUrl],
    pubsubKuboRpcClientsOptions: [localPubsubProviderUrl],
    resolveAuthorAddresses: false,
    validatePages: false,
  },
  'plebbit rpc client': {
    plebbitRpcClientsOptions: [localPlebbitRpcUrl],
    resolveAuthorAddresses: false,
    validatePages: false,
  },
}

for (const plebbitOptionsType in plebbitOptionsTypes) {
  describe(`feeds (${plebbitOptionsType})`, () => {
    before(async () => {
      console.log(`before feeds tests (${plebbitOptionsType})`)
      testUtils.silenceReactWarnings()
      // reset before or init accounts sometimes fails
      await testUtils.resetDatabasesAndStores()
    })
    after(async () => {
      testUtils.restoreAll()
      await testUtils.resetDatabasesAndStores()
    })

    let rendered, waitFor

    beforeEach(async () => {
      await monitor.assertTestServerDidntCrash()

      rendered = renderHook((props) => {
        const account = useAccount()
        const feed = useFeed(props)
        return {account, ...accountsActions, ...feed}
      })
      waitFor = testUtils.createWaitFor(rendered, {timeout})

      await waitFor(() => rendered.result.current.account.name === 'Account 1')
      expect(isBase64(rendered.result.current.account.signer.privateKey)).to.be.true
      expect(rendered.result.current.account.signer.address).to.equal(rendered.result.current.account.author.address)
      expect(rendered.result.current.account.name).to.equal('Account 1')
      expect(typeof rendered.result.current.publishComment).to.equal('function')
      expect(typeof rendered.result.current.publishVote).to.equal('function')

      const plebbitOptions = {...plebbitOptionsTypes[plebbitOptionsType]}

      console.log('before set account')
      await act(async () => {
        const account = {...rendered.result.current.account, plebbitOptions}
        await rendered.result.current.setAccount(account)
      })
      expect(rendered.result.current.account.plebbitOptions).to.deep.equal(plebbitOptions)
      console.log('after set account')
    })

    afterEach(async () => {
      await monitor.assertTestServerDidntCrash()

      await testUtils.resetDatabasesAndStores()
    })

    it('get feed with no arguments', async () => {
      expect(rendered.result.current.feed).to.deep.equal([])
      expect(typeof rendered.result.current.hasMore).to.equal('boolean')
      expect(typeof rendered.result.current.loadMore).to.equal('function')
    })

    it('change sort type', async () => {
      console.log(`starting feeds tests (${plebbitOptionsType})`)

      rendered.rerender({subplebbitAddresses: [subplebbitAddress], sortType: 'hot'})
      await waitFor(() => !!rendered.result.current.feed[0].cid)
      expect(rendered.result.current.feed[0].subplebbitAddress).to.equal(subplebbitAddress)
      console.log('after first render')

      // reset
      rendered.rerender({subplebbitAddresses: []})
      await waitFor(() => rendered.result.current.feed.length === 0)
      expect(rendered.result.current.feed.length).to.equal(0)
      console.log('after second render')

      // change sort type
      rendered.rerender({subplebbitAddresses: [subplebbitAddress], sortType: 'new'})
      await waitFor(() => !!rendered.result.current.feed[0].cid)
      expect(rendered.result.current.feed[0].subplebbitAddress).to.equal(subplebbitAddress)
    })

    it('validate comments', async () => {
      console.log(`starting validate comments tests (${plebbitOptionsType})`)

      rendered = renderHook(() => {
        const feed = useFeed({subplebbitAddresses: [subplebbitAddress], sortType: 'hot'})
        const validateComment = useValidateComment({comment: feed.feed[0]})
        const validateCommentWithoutReplies = useValidateComment({comment: feed.feed[0], validateReplies: false})
        let invalidComment
        if (feed.feed[0] && feed.feed[0].raw) {
          invalidComment = JSON.parse(JSON.stringify(feed.feed[0]))
          // change the sub address because we're caching malicious subplebbits
          // and will make other comments invalid
          invalidComment.author.address = 'malicious.eth'
          invalidComment.raw.comment.author.address = 'malicious.eth'
        }
        const validateCommentInvalid = useValidateComment({comment: invalidComment})
        return {...feed, validateComment, validateCommentWithoutReplies, validateCommentInvalid}
      })
      waitFor = testUtils.createWaitFor(rendered, {timeout})

      await waitFor(() => !!rendered.result.current.feed[0].cid)
      expect(rendered.result.current.feed[0].subplebbitAddress).to.equal(subplebbitAddress)
      console.log('after first render')

      // do invalid first to make sure it doesn't block subplebbit
      await waitFor(() => rendered.result.current.validateCommentInvalid.state === 'failed')
      expect(rendered.result.current.validateCommentInvalid.state).to.equal('failed')
      expect(rendered.result.current.validateCommentInvalid.valid).to.equal(false)
      console.log('after validate invalid comment')

      await waitFor(() => rendered.result.current.validateComment.state === 'succeeded')
      expect(rendered.result.current.validateComment.state).to.equal('succeeded')
      expect(rendered.result.current.validateComment.valid).to.equal(true)
      console.log('after validate comment')

      await waitFor(() => rendered.result.current.validateCommentWithoutReplies.state === 'succeeded')
      expect(rendered.result.current.validateCommentWithoutReplies.state).to.equal('succeeded')
      expect(rendered.result.current.validateCommentWithoutReplies.valid).to.equal(true)
      console.log('after validate comment without replies')
    })
  })
}
