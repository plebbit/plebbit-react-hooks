const { act, renderHook } = require('@testing-library/react-hooks/dom')
const { PlebbitProvider, useAccount, useAccountsActions, useAccountVotes, useAccountComments, setPlebbitJs } = require('../../dist')
const { default: PlebbitJsMock } = require('../../dist/lib/plebbit-js/plebbit-js-mock')
const testUtils = require('../../dist/lib/test-utils').default
setPlebbitJs(PlebbitJsMock)

const timeout = 10000

describe('accounts', () => {
  before(() => {
    testUtils.silenceUpdateUnmountedComponentWarning()
  })
  after(() => {
    testUtils.restoreAll()
  })

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

  describe('publish', () => {
    let rendered, waitFor

    beforeEach(async () => {
      rendered = renderHook(
        (accountName) => {
          const account = useAccount(accountName)
          const accountsActions = useAccountsActions()
          const accountVotes = useAccountVotes()
          const accountComments = useAccountComments()
          return { account, accountVotes, accountComments, ...accountsActions }
        },
        { wrapper: PlebbitProvider }
      )
      waitFor = testUtils.createWaitFor(rendered, { timeout })

      await waitFor(() => rendered.result.current.account.name === 'Account 1')
      expect(rendered.result.current.account.name).to.equal('Account 1')
      expect(typeof rendered.result.current.publishComment).to.equal('function')
      expect(typeof rendered.result.current.publishVote).to.equal('function')
    })

    describe(`create comment`, () => {
      let onChallengeCalled = 0
      let challenge, comment
      const onChallenge = (_challenge, _comment) => {
        challenge = _challenge
        comment = _comment
        onChallengeCalled++
      }
      let onChallengeVerificationCalled = 0
      let challengeVerification, commentVerified
      const onChallengeVerification = (_challengeVerification, _commentVerified) => {
        challengeVerification = _challengeVerification
        commentVerified = _commentVerified
        onChallengeVerificationCalled++
      }

      it('publish comment', async () => {
        const publishCommentOptions = {
          subplebbitAddress: 'Qm...',
          parentCid: 'Qm...',
          content: 'some content',
          onChallenge,
          onChallengeVerification,
        }
        await act(async () => {
          await rendered.result.current.publishComment(publishCommentOptions)
        })
      })

      it('onChallenge gets called', async () => {
        await waitFor(() => onChallengeCalled > 0)
        expect(onChallengeCalled).to.equal(1)

        expect(challenge.type).to.equal('CHALLENGE')
        expect(challenge.challenges[0]).to.deep.equal({ challenge: '2+2=?', type: 'text' })
        expect(typeof comment.publishChallengeAnswers).to.equal('function')
      })

      it('onChallengeVerification gets called', async () => {
        // publish challenge answer and wait for verification
        comment.publishChallengeAnswers(['4'])
        await waitFor(() => onChallengeVerificationCalled > 0)
        expect(onChallengeVerificationCalled).to.equal(1)
        expect(challengeVerification.type).to.equal('CHALLENGEVERIFICATION')
        expect(commentVerified.constructor.name).to.equal('Comment')
      })

      it('published comment is in account comments', async () => {
        await waitFor(() => rendered.result.current.accountComments.length > 0)
        await waitFor(() => typeof rendered.result.current.accountComments[0].cid === 'string')
        expect(rendered.result.current.accountComments.length).to.equal(1)
        expect(rendered.result.current.accountComments[0].cid).to.equal('some content cid')
      })
    })

    describe(`create vote`, () => {
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
          subplebbitAddress: 'Qm...',
          commentCid: 'Qm...',
          vote: 1,
          onChallenge,
          onChallengeVerification,
        }
        await act(async () => {
          await rendered.result.current.publishVote(publishVoteOptions)
        })
      })

      it('onChallenge gets called', async () => {
        // onChallenge gets call backed once
        await waitFor(() => onChallengeCalled > 0)
        expect(onChallengeCalled).to.equal(1)

        expect(challenge.type).to.equal('CHALLENGE')
        expect(challenge.challenges[0]).to.deep.equal({ challenge: '2+2=?', type: 'text' })
        expect(typeof vote.publishChallengeAnswers).to.equal('function')
      })

      it('onChallengeVerification gets called', async () => {
        // publish challenge answer and wait for verification
        vote.publishChallengeAnswers(['4'])
        await waitFor(() => onChallengeVerificationCalled > 0)
        expect(onChallengeVerificationCalled).to.equal(1)
        expect(challengeVerification.type).to.equal('CHALLENGEVERIFICATION')
        expect(voteVerified.constructor.name).to.equal('Vote')
      })

      it('published vote is in account votes', async () => {
        await waitFor(() => rendered.result.current.accountVotes.length > 0)
        await waitFor(() => typeof rendered.result.current.accountVotes[0].commentCid === 'string')
        expect(rendered.result.current.accountVotes.length).to.equal(1)
        expect(rendered.result.current.accountVotes[0].commentCid).to.equal('Qm...')
      })
    })
  })
})
