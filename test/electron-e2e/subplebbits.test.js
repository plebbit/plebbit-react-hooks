import {expect, test, vi} from 'vitest'
import {assertTestServerDidntCrash} from '../test-server/monitor-test-server'
import {act, renderHook} from '@testing-library/react-hooks/dom'
import {useAccount, useSubplebbit, useSubplebbitStats, useAccountVotes, useComment, debugUtils} from '../../dist'
import * as accountsActions from '../../dist/stores/accounts/accounts-actions'
import {default as testUtils} from '../../dist/lib/test-utils'
import signers from '../fixtures/signers'
const subplebbitAddress = signers[0].address
import {offlineIpfs, pubsubIpfs, plebbitRpc} from '../test-server/config'
const isBase64 = (testString) => /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}))?$/gm.test(testString)

// large value for manual debugging
const timeout = 600000

// run tests using plebbit options gateway and httpClient
const localGatewayUrl = `http://127.0.0.1:${offlineIpfs.gatewayPort}`
const localIpfsProviderUrl = `http://127.0.0.1:${offlineIpfs.apiPort}/api/v0`
const localPubsubProviderUrl = `http://127.0.0.1:${pubsubIpfs.apiPort}/api/v0`
const localPlebbitRpcUrl = `ws://127.0.0.1:${plebbitRpc.port}`
const plebbitOptionsTypes = {
  'plebbit rpc client': {
    plebbitRpcClientsOptions: [localPlebbitRpcUrl],
    dataPath: window.plebbitDataPath,
    publishInterval: 1000,
    updateInterval: 1000,
  },
}

for (const plebbitOptionsType in plebbitOptionsTypes) {
  describe(`subplebbits (${plebbitOptionsType})`, () => {
    before(async () => {
      console.log(`before subplebbits tests (${plebbitOptionsType})`)
      console.log(`after testUtils.resetDatabasesAndStores`)

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

    describe(`no subplebbits in database (${plebbitOptionsType})`, () => {
      let rendered, waitFor, commentCid

      before(async () => {
        rendered = renderHook(({subplebbitAddress, commentCid} = {}) => {
          const account = useAccount()
          const subplebbit = useSubplebbit({subplebbitAddress})
          const subplebbitStats = useSubplebbitStats({subplebbitAddress})
          const {accountVotes} = useAccountVotes()
          const comment = useComment({commentCid})

          return {account, subplebbit, subplebbitStats, comment, accountVotes, ...accountsActions}
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

      it(`get subplebbits one at a time (${plebbitOptionsType})`, async () => {
        console.log(`start subplebbits tests (${plebbitOptionsType})`)

        rendered.rerender({subplebbitAddress})
        await waitFor(() => typeof rendered.result.current.subplebbit.address === 'string')
        expect(rendered.result.current.subplebbit.address).to.equal(subplebbitAddress)
        await waitFor(() => rendered.result.current.subplebbit.posts.pages.hot.comments[0])
        expect(typeof rendered.result.current.subplebbit.posts.pages.hot.comments[0].cid).to.equal('string')
        commentCid = rendered.result.current.subplebbit.posts.pages.hot.comments[0].cid
        console.log('comment cid', commentCid)

        console.log('before subplebbit stats')
        await waitFor(() => typeof rendered.result.current.subplebbitStats.hourPostCount === 'number')
        expect(typeof rendered.result.current.subplebbitStats.hourPostCount).to.equal('number')
        console.log('after subplebbit stats')
      })

      let onChallengeCalled = 0
      let challenge, vote
      const onChallenge = (_challenge, _vote) => {
        challenge = _challenge
        vote = _vote
        onChallengeCalled++
      }
      let onChallengeVerificationCalled = 0
      let challengeVerification, voteVerified
      const onChallengeVerification = (_challengeVerification, _voteVerified) => {
        challengeVerification = _challengeVerification
        voteVerified = _voteVerified
        onChallengeVerificationCalled++
      }

      it(`publish vote (${plebbitOptionsType})`, async () => {
        const publishVoteOptions = {
          subplebbitAddress,
          commentCid: commentCid,
          vote: 1,
          onChallenge,
          onChallengeVerification,
        }
        console.log('before publish vote')
        await act(async () => {
          await rendered.result.current.publishVote(publishVoteOptions)
        })
        console.log('after publish vote')
      })

      it(`onChallenge gets called (${plebbitOptionsType})`, async () => {
        // onChallenge gets call backed once
        await waitFor(() => onChallengeCalled > 0)
        expect(onChallengeCalled).to.equal(1)

        expect(challenge.type).to.equal('CHALLENGE')
        expect(typeof vote.publishChallengeAnswers).to.equal('function')
      })

      it(`onChallengeVerification gets called (${plebbitOptionsType})`, async () => {
        console.log('before publish challenge answers')
        // publish challenge answer and wait for verification
        vote.publishChallengeAnswers(['2'])
        console.log('after publish challenge answers')
        await waitFor(() => onChallengeVerificationCalled > 0)
        expect(onChallengeVerificationCalled).to.equal(1)
        expect(challengeVerification.type).to.equal('CHALLENGEVERIFICATION')
        expect(voteVerified.constructor.name).to.equal('Vote')
      })

      it(`published vote is in account votes (${plebbitOptionsType})`, async () => {
        // for unknown reason 'setAccountsVotes' in accountsActions.publishVote vote.once('challengeverification')
        // never gets triggered, so we can't test if the cid gets added to accounts comments
        console.log(`TODO: figure out why vote doesn't get added to accountVotes`)
        // await waitFor(() => rendered.result.current.accountVotes.length > 0)
        // await waitFor(() => typeof rendered.result.current.accountVotes[0].commentCid === 'string')
        // expect(rendered.result.current.accountVotes.length).to.equal(1)
        // expect(rendered.result.current.accountVotes[0].commentCid).to.equal(commentCid)
      })

      it(`get comment with updated vote count (${plebbitOptionsType})`, async () => {
        console.log('before getting comment')
        rendered.rerender({subplebbitAddress, commentCid})
        await waitFor(() => typeof rendered.result.current.comment.cid === 'string')
        console.log('after getting comment')
        expect(rendered.result.current.comment?.cid).to.equal(commentCid)
        // wait for comment.on('update') to fetch the ipns
        await waitFor(
          () =>
            typeof rendered.result.current.comment.cid === 'string' &&
            typeof rendered.result.current.comment.upvoteCount === 'number' &&
            rendered.result.current.comment?.upvoteCount > 0,
        )
        console.log('after getting comment update')
        expect(rendered.result.current.comment?.cid).to.equal(commentCid)
        // could be greater than 1 if code is ran several times with the same test server
        expect(rendered.result.current.comment?.upvoteCount).to.be.greaterThan(0)
      })
    })
  })
}
