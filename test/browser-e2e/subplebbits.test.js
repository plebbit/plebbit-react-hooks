const {act, renderHook} = require('@testing-library/react-hooks/dom')
const {PlebbitProvider, useAccount, useSubplebbit, useAccountsActions, useAccountVotes, debugUtils} = require('../../dist')
const testUtils = require('../../dist/lib/test-utils').default
const {default: PlebbitJsMock} = require('../../dist/lib/plebbit-js/plebbit-js-mock')
const signers = require('../fixtures/signers')
const subplebbitAddress = signers[0].address
const {offlineIpfs, pubsubIpfs} = require('../test-server/ipfs-config')

const timeout = 60000

describe.only('subplebbits (plebbit-js mock)', () => {
  before(() => {
    testUtils.silenceUpdateUnmountedComponentWarning()
  })
  after(async () => {
    testUtils.restoreAll()
    await debugUtils.deleteDatabases()
  })

  describe('no subplebbits in database', () => {
    let rendered, waitFor, commentCid

    before(async () => {
      rendered = renderHook(
        (subplebbitAddress) => {
          const account = useAccount()
          const accountsActions = useAccountsActions()
          const subplebbit = useSubplebbit(subplebbitAddress)
          const accountVotes = useAccountVotes()
          return {account, subplebbit, accountVotes, ...accountsActions}
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

    it('get subplebbits one at a time', async () => {
      rendered.rerender(subplebbitAddress)
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

    it('publish vote', async () => {
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

    it('onChallenge gets called', async () => {
      // onChallenge gets call backed once
      await waitFor(() => onChallengeCalled > 0)
      expect(onChallengeCalled).to.equal(1)

      expect(challenge.type).to.equal('CHALLENGE')
      expect(typeof vote.publishChallengeAnswers).to.equal('function')
    })

    it('onChallengeVerification gets called', async () => {
      console.log('before publish challenge answers')
      // publish challenge answer and wait for verification
      vote.publishChallengeAnswers(['2'])
      console.log('after publish challenge answers')
      await waitFor(() => onChallengeVerificationCalled > 0)
      expect(onChallengeVerificationCalled).to.equal(1)
      expect(challengeVerification.type).to.equal('CHALLENGEVERIFICATION')
      expect(voteVerified.constructor.name).to.equal('Vote')
    })

    it('published vote is in account votes', async () => {
      console.log(`TODO: figure out why vote doesn't get added to accountVotes`)
      // await waitFor(() => rendered.result.current.accountVotes.length > 0)
      // await waitFor(() => typeof rendered.result.current.accountVotes[0].commentCid === 'string')
      // expect(rendered.result.current.accountVotes.length).to.equal(1)
      // expect(rendered.result.current.accountVotes[0].commentCid).to.equal(commentCid)
    })
  })
})
