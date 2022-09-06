const {act, renderHook} = require('@testing-library/react-hooks/dom')
const {PlebbitProvider, useAccount, useSubplebbit, useAccountsActions, useAccountVotes, useComment, debugUtils} = require('../../dist')
const {setNativeFunctions} = require('@plebbit/plebbit-js/dist/browser/plebbit')
setNativeFunctions(window.plebbitJsNativeFunctions)
const testUtils = require('../../dist/lib/test-utils').default
const signers = require('../fixtures/signers')
const subplebbitAddress = signers[0].address
const {offlineIpfs, pubsubIpfs} = require('../test-server/ipfs-config')

// large value for manual debugging
const timeout = 600000

// run tests using plebbit options gateway and httpClient
const localGatewayUrl = `http://localhost:${offlineIpfs.gatewayPort}`
const localIpfsProviderUrl = `http://localhost:${offlineIpfs.apiPort}`
const localPubsubProviderUrl = `http://localhost:${pubsubIpfs.apiPort}/api/v0`
const plebbitOptionsTypes = {
  'http client': {
    ipfsHttpClientOptions: localIpfsProviderUrl,
    // define pubsubHttpClientOptions with localPubsubProviderUrl because
    // localIpfsProviderUrl is offline node with no pubsub
    pubsubHttpClientOptions: localPubsubProviderUrl,
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

    describe(`no subplebbits in database (${plebbitOptionsType})`, () => {
      let rendered, waitFor, commentCid

      before(async () => {
        rendered = renderHook(
          ({subplebbitAddress, commentCid} = {}) => {
            const account = useAccount()
            const accountsActions = useAccountsActions()
            const subplebbit = useSubplebbit(subplebbitAddress)
            const accountVotes = useAccountVotes()
            const comment = useComment(commentCid)

            return {account, subplebbit, comment, accountVotes, ...accountsActions}
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
            rendered.result.current.comment?.upvoteCount > 0
        )
        console.log('after getting comment update')
        expect(rendered.result.current.comment?.cid).to.equal(commentCid)
        // could be greater than 1 if code is ran several times with the same test server
        expect(rendered.result.current.comment?.upvoteCount).to.be.greaterThan(0)
      })
    })
  })
}
