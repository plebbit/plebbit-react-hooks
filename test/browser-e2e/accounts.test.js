const {act, renderHook} = require('@testing-library/react-hooks/dom')
const {PlebbitProvider, useAccount, useAccountsActions, useAccountVotes, useAccountComments, debugUtils} = require('../../dist')
const {default: PlebbitJsMock} = require('../../dist/lib/plebbit-js/plebbit-js-mock')
const testUtils = require('../../dist/lib/test-utils').default
const {offlineIpfs, pubsubIpfs} = require('../test-server/ipfs-config')
const signers = require('../fixtures/signers')
const subplebbitAddress = signers[0].address

const timeout = 600000

describe.skip('accounts', () => {
  before(() => {
    testUtils.silenceUpdateUnmountedComponentWarning()
  })
  after(async () => {
    testUtils.restoreAll()
    await debugUtils.deleteDatabases()
  })

  describe('no accounts in database', () => {
    it('generate default account on load', async () => {
      const rendered = renderHook(() => useAccount(), {wrapper: PlebbitProvider})
      const waitFor = testUtils.createWaitFor(rendered, {timeout})

      expect(rendered.result.current).to.equal(undefined)

      await waitFor(() => rendered.result.current?.name === 'Account 1')

      const account = rendered.result.current
      expect(account.name).to.equal('Account 1')
      expect(account.author.displayName).to.equal(null)
      expect(account.signer.privateKey).to.match(/^-----BEGIN ENCRYPTED PRIVATE KEY-----/)
      expect(account.signer.address).to.equal(account.author.address)
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

  describe('publish', () => {
    let rendered, waitFor, publishedCid

    before(async () => {
      rendered = renderHook(
        () => {
          const account = useAccount()
          const accountsActions = useAccountsActions()
          const accountVotes = useAccountVotes()
          const accountComments = useAccountComments()
          return {account, accountVotes, accountComments, ...accountsActions}
        },
        {wrapper: PlebbitProvider}
      )
      waitFor = testUtils.createWaitFor(rendered, {timeout})

      await waitFor(() => rendered.result.current.account.name === 'Account 1')
      expect(rendered.result.current.account.signer.privateKey).to.match(/^-----BEGIN ENCRYPTED PRIVATE KEY-----/)
      expect(rendered.result.current.account.signer.address).to.equal(rendered.result.current.account.author.address)
      expect(rendered.result.current.account.name).to.equal('Account 1')
      expect(typeof rendered.result.current.publishComment).to.equal('function')
      expect(typeof rendered.result.current.publishVote).to.equal('function')

      console.log('before set account')
      const localGatewayUrl = `http://localhost:${offlineIpfs.gatewayPort}`
      await act(async () => {
        const plebbitOptions = {
          ...rendered.result.current.account.plebbitOptions,
          ipfsGatewayUrl: localGatewayUrl,
        }
        const account = {...rendered.result.current.account, plebbitOptions}
        await rendered.result.current.setAccount(account)
      })
      expect(rendered.result.current.account.plebbitOptions.ipfsGatewayUrl).to.equal(localGatewayUrl)
      console.log('after set account')
    })

    describe(`create comment`, () => {
      let onChallengeCalled = 0
      let challenge, comment
      const onChallenge = (_challenge, _comment) => {
        console.log('onChallenge')
        console.log(_challenge)
        challenge = _challenge
        comment = _comment
        onChallengeCalled++
      }
      let onChallengeVerificationCalled = 0
      let challengeVerification, commentVerified
      const onChallengeVerification = (_challengeVerification, _commentVerified) => {
        console.log('onChallengeVerification')
        console.log(_challengeVerification)
        challengeVerification = _challengeVerification
        commentVerified = _commentVerified
        onChallengeVerificationCalled++
      }

      it('publish comment', async () => {
        const publishCommentOptions = {
          subplebbitAddress,
          title: 'some title',
          content: 'some content',
          onChallenge,
          onChallengeVerification,
        }
        await act(async () => {
          console.log('before publishComment')
          await rendered.result.current.publishComment(publishCommentOptions)
          console.log('after publishComment')
        })
      })

      it('onChallenge gets called', async () => {
        await waitFor(() => onChallengeCalled > 0)
        expect(onChallengeCalled).to.equal(1)

        expect(challenge.type).to.equal('CHALLENGE')
        expect(typeof comment.publishChallengeAnswers).to.equal('function')
      })

      it('onChallengeVerification gets called', async () => {
        // publish challenge answer and wait for verification
        comment.publishChallengeAnswers(['2'])
        await waitFor(() => onChallengeVerificationCalled > 0)
        expect(onChallengeVerificationCalled).to.equal(1)
        expect(challengeVerification.type).to.equal('CHALLENGEVERIFICATION')
        expect(typeof challengeVerification.publication.cid).to.equal('string')
        expect(commentVerified.constructor.name).to.match(/Comment|Post/)
        console.log('after onChallengeVerification')
      })

      it('published comment is in account comments', async () => {
        console.log('before comment in accountComments')
        await waitFor(() => rendered.result.current.accountComments.length > 0)
        expect(rendered.result.current.accountComments.length).to.equal(1)
        console.log('after comment in accountComments')
        console.log(rendered.result.current.accountComments)
        console.log('before cid')
        console.log(`TODO: figure out why cid doesn't get added to accountComments`)
        // await waitFor(() => typeof rendered.result.current.accountComments[0].cid === 'string')
        // console.log(rendered.result.current.accountComments)
        // expect(typeof rendered.result.current.accountComments[0].cid).to.equal('string')
        // publishedCid = rendered.result.current.accountComments[0].cid
        // console.log('after cid', publishedCid)
      })
    })
  })
})
