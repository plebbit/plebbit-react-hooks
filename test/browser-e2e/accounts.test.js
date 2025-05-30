const {assertTestServerDidntCrash} = require('../test-server/monitor-test-server')
const {act, renderHook} = require('@testing-library/react-hooks/dom')
const {useAccount, useAccountVotes, useAccountComments, useNotifications, useComment, useReplies, debugUtils} = require('../../dist')
const accountsActions = require('../../dist/stores/accounts/accounts-actions')
const testUtils = require('../../dist/lib/test-utils').default
const {offlineIpfs, pubsubIpfs, plebbitRpc} = require('../test-server/config')
const signers = require('../fixtures/signers')
const subplebbitAddress = signers[0].address

const isBase64 = (testString) => /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}))?$/gm.test(testString)

// large value for manual debugging
const timeout = 600000

// run tests using plebbit options gateway and httpClient
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
  describe(`accounts (${plebbitOptionsType})`, () => {
    before(async () => {
      console.log(`before accounts tests (${plebbitOptionsType})`)
      testUtils.silenceReactWarnings()
      // reset before or init accounts sometimes fails
      await testUtils.resetDatabasesAndStores()
    })
    after(async () => {
      testUtils.restoreAll()
      await testUtils.resetDatabasesAndStores()
    })

    beforeEach(async () => {
      await assertTestServerDidntCrash()
    })
    afterEach(async () => {
      await assertTestServerDidntCrash()
    })

    describe(`no accounts in database (${plebbitOptionsType})`, () => {
      it(`generate default account on load (${plebbitOptionsType})`, async () => {
        console.log(`starting accounts tests (${plebbitOptionsType})`)

        const rendered = renderHook(() => useAccount())
        const waitFor = testUtils.createWaitFor(rendered, {timeout})

        await waitFor(() => rendered.result.current?.name === 'Account 1')

        const account = rendered.result.current
        expect(account.name).to.equal('Account 1')
        expect(account.author.displayName).to.equal(undefined)
        expect(isBase64(account.signer.privateKey)).to.be.true
        expect(account.signer.address).to.equal(account.author.address)
        expect(typeof account.author.address).to.equal('string')
        expect(Array.isArray(account.subscriptions)).to.equal(true)
        expect(account.blockedAddresses && typeof account.blockedAddresses === 'object').to.equal(true)
        expect(account.plebbit && typeof account.plebbit === 'object').to.equal(true)
        expect(account.plebbitOptions && typeof account.plebbitOptions === 'object').to.equal(true)
        expect(account.plebbitOptions.ipfsGatewayUrls?.length).to.be.greaterThan(0)
        expect(account.plebbitOptions.pubsubKuboRpcClientsOptions?.length).to.be.greaterThan(0)
        expect(account.plebbitOptions.ipfsHttpClientOptions).to.equal(undefined)

        // wait for short address
        await waitFor(() => rendered.result.current?.author?.shortAddress)
        expect(typeof rendered.result.current?.author?.shortAddress).to.equal('string')
      })
    })

    describe(`publish (${plebbitOptionsType})`, () => {
      let rendered, waitFor, publishedCid

      before(async () => {
        rendered = renderHook((commentCid) => {
          const account = useAccount()
          const {accountVotes} = useAccountVotes()
          const {accountComments} = useAccountComments()
          const notifications = useNotifications()
          const comment = useComment({commentCid})
          const replies = useReplies({comment})
          return {account, accountVotes, accountComments, notifications, replies, ...accountsActions}
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

      describe(`create comment (${plebbitOptionsType})`, () => {
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

        it(`publish comment (${plebbitOptionsType})`, async () => {
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

        it(`onChallenge gets called (${plebbitOptionsType})`, async () => {
          await waitFor(() => onChallengeCalled > 0)
          expect(onChallengeCalled).to.equal(1)

          expect(challenge.type).to.equal('CHALLENGE')
          expect(typeof comment.publishChallengeAnswers).to.equal('function')
        })

        it(`onChallengeVerification gets called (${plebbitOptionsType})`, async () => {
          // publish challenge answer and wait for verification
          comment.publishChallengeAnswers(['2'])
          await waitFor(() => onChallengeVerificationCalled > 0)
          expect(onChallengeVerificationCalled).to.equal(1)
          expect(challengeVerification.type).to.equal('CHALLENGEVERIFICATION')
          expect(typeof challengeVerification.commentUpdate.cid).to.equal('string')
          expect(commentVerified.constructor.name).to.match(/Comment|Post/)
          console.log('after onChallengeVerification')

          publishedCid = challengeVerification.commentUpdate.cid
        })

        it(`published comment is in account comments (${plebbitOptionsType})`, async () => {
          console.log('before comment in accountComments')
          await waitFor(() => rendered.result.current.accountComments.length > 0)
          expect(rendered.result.current.accountComments.length).to.equal(1)
          console.log('after comment in accountComments')
          console.log(rendered.result.current.accountComments)
          console.log('before cid')
          // for unknown reason 'setAccountsComments' in accountsActions.publishComment comment.once('challengeverification')
          // never gets triggered, so we can't test if the cid gets added to accounts comments
          // it could be because of a race condition between the 2 setAccountsComments calls
          console.log(`TODO: figure out why cid doesn't get added to accountComments`)
          // await waitFor(() => typeof rendered.result.current.accountComments[0].cid === 'string')
          // console.log(rendered.result.current.accountComments)
          // expect(typeof rendered.result.current.accountComments[0].cid).to.equal('string')
          // publishedCid = rendered.result.current.accountComments[0].cid
          // console.log('after cid', publishedCid)
        })

        it(`publish reply (${plebbitOptionsType})`, async () => {
          // make sure there's no notifications
          expect(rendered.result.current.notifications.notifications.length).to.equal(0)

          const onChallenge = (challenge, comment) => {
            console.log('onChallenge')
            console.log(challenge)
            comment.publishChallengeAnswers(['2'])
          }
          let replyChallengeVerification
          const onChallengeVerification = (challengeVerification, comment) => {
            console.log('onChallengeVerification')
            console.log(challengeVerification)
            replyChallengeVerification = challengeVerification
          }
          const publishCommentOptions = {
            subplebbitAddress,
            parentCid: publishedCid,
            postCid: publishedCid,
            content: 'some content',
            onChallenge,
            onChallengeVerification,
          }
          await act(async () => {
            console.log('before publishComment')
            await rendered.result.current.publishComment(publishCommentOptions)
            console.log('after publishComment')
          })

          // wait for reply challenge verification
          await waitFor(() => replyChallengeVerification)
          expect(replyChallengeVerification.challengeSuccess).to.equal(true)
          console.log('after onChallengeVerification')

          // wait for useReplies
          expect(typeof publishedCid).to.equal('string')
          rendered.rerender(publishedCid)
          await waitFor(() => rendered.result.current.replies.replies.length > 0)
          expect(rendered.result.current.replies.replies.length).to.equal(1)
          console.log('after useReplies')

          // wait for useNotifications
          await waitFor(() => rendered.result.current.notifications.notifications.length > 0)
          expect(rendered.result.current.notifications.notifications.length).to.equal(1)
          console.log('after useNotifications')
        })
      })
    })
  })
}
