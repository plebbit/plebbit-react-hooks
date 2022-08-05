const {act, renderHook} = require('@testing-library/react-hooks/dom')
const {setPlebbitJs, PlebbitProvider, useAccount, useSubplebbit, useAccountsActions, useAccountVotes, useAccountComments, debugUtils} = require('../../dist')
// set PlebbitJs with native functions defined in preload.js
setPlebbitJs(window.PlebbitJs)
const testUtils = require('../../dist/lib/test-utils').default
const {offlineIpfs, pubsubIpfs} = require('../test-server/ipfs-config')
const signers = require('../fixtures/signers')
const subplebbitAddress = signers[0].address

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

    describe(`no accounts in database (${plebbitOptionsType})`, () => {
      it(`generate default account on load (${plebbitOptionsType})`, async () => {
        console.log(`start accounts tests (${plebbitOptionsType})`)

        const rendered = renderHook(() => useAccount(), {wrapper: PlebbitProvider})
        const waitFor = testUtils.createWaitFor(rendered, {timeout})

        await waitFor(() => rendered.result.current?.name === 'Account 1')

        const account = rendered.result.current
        expect(account.name).to.equal('Account 1')
        expect(account.author.displayName).to.equal(undefined)
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

    it.only('debug create subplebbit', async () => {
      console.log('do nothing, debug in the dev tool console')
      const plebbitOptions = plebbitOptionsTypes[plebbitOptionsType]
      console.log('plebbitOptions')
      console.log(plebbitOptions)
      console.log(window.PlebbitJs)
      const plebbit = await window.PlebbitJs(plebbitOptions)
      console.log(plebbit)
      console.log('before create subplebbit')
      const subplebbit = await plebbit.createSubplebbit({title: 'test title'})
      console.log(subplebbit)
      console.log('after create subplebbit')
      await new Promise((r) => {})
    })

    describe.skip(`create subplebbit (${plebbitOptionsType})`, () => {
      let rendered, waitFor

      before(async () => {
        rendered = renderHook(
          (subplebbitAddress) => {
            const account = useAccount()
            const accountsActions = useAccountsActions()
            const subplebbit = useSubplebbit(subplebbitAddress)
            return {account, subplebbit, ...accountsActions}
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

      it('create a subplebbit', async () => {
        console.log('before create subplebbit')
        const createdSubplebbitTitle = 'my title'
        let subplebbit
        await act(async () => {
          subplebbit = await rendered.result.current.createSubplebbit({title: createdSubplebbitTitle})
        })
        console.log('after create subplebbit', subplebbit.address, subplebbit)
        const createdSubplebbitAddress = subplebbit?.address
        expect(typeof createdSubplebbitAddress).to.equal('string')
        expect(subplebbit.title).to.equal(createdSubplebbitTitle)

        console.log(subplebbit)
        return

        // TODO: migrate from react context to be able to use subplebbit after creating

        // can useSubplebbit
        rendered.rerender(createdSubplebbitAddress)
        await waitFor(() => rendered.result.current.subplebbit.title === createdSubplebbitTitle)
        expect(rendered.result.current.subplebbit.address).to.equal(createdSubplebbitAddress)
        expect(rendered.result.current.subplebbit.title).to.equal(createdSubplebbitTitle)
        console.log('used subplebbit', rendered.result.current.subplebbit)

        // wait for subplebbit to be added to account subplebbits
        await waitFor(() => rendered.result.current.accountSubplebbits[createdSubplebbitAddress].role.role === 'owner')
        expect(rendered.result.current.accountSubplebbits[createdSubplebbitAddress].role.role).to.equal('owner')

        console.log('before edit subplebbit address')
        // publishSubplebbitEdit address
        const editedSubplebbitAddress = 'my-sub.eth'
        let onChallenge = () => {}
        const onChallengeVerificationCalls = []
        let onChallengeVerification = (...args) => onChallengeVerificationCalls.push([...args])
        await act(async () => {
          await rendered.result.current.publishSubplebbitEdit(createdSubplebbitAddress, {address: editedSubplebbitAddress, onChallenge, onChallengeVerification})
        })
        console.log('after edit subplebbit address')

        // change useSubplebbit address
        rendered.rerender(editedSubplebbitAddress)
        await waitFor(() => rendered.result.current.subplebbit.address === editedSubplebbitAddress)
        expect(rendered.result.current.subplebbit.address).to.equal(editedSubplebbitAddress)
        expect(rendered.result.current.subplebbit.title).to.equal(createdSubplebbitTitle)

        // onChallengeVerification should be called with success even if the sub is edited locally
        await waitFor(() => onChallengeVerification.mock.calls.length === 1)
        expect(onChallengeVerificationCalls.length).to.equal(1)
        expect(onChallengeVerificationCalls[0][0].challengeSuccess).to.equal(true)

        console.log('before edit subplebbit title')
        // publishSubplebbitEdit title and description
        const editedSubplebbitTitle = 'edited title'
        const editedSubplebbitDescription = 'edited description'
        await act(async () => {
          await rendered.result.current.publishSubplebbitEdit(editedSubplebbitAddress, {
            title: editedSubplebbitTitle,
            description: editedSubplebbitDescription,
            onChallenge,
            onChallengeVerification,
          })
        })
        console.log('after edit subplebbit title')

        // wait for change
        await waitFor(() => rendered.result.current.subplebbit.address === editedSubplebbitAddress)
        expect(rendered.result.current.subplebbit.address).to.equal(editedSubplebbitAddress)

        // onChallengeVerification should be called with success even if the sub is edited locally
        await waitFor(() => onChallengeVerification.mock.calls.length === 1)
        expect(onChallengeVerificationCalls.length).to.equal(1)
        expect(onChallengeVerificationCalls[0][0].challengeSuccess).to.equal(true)
      })
    })

    describe(`publish (${plebbitOptionsType})`, () => {
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
          expect(typeof challengeVerification.publication.cid).to.equal('string')
          expect(commentVerified.constructor.name).to.match(/Comment|Post/)
          console.log('after onChallengeVerification')
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
      })
    })
  })
}
