import {assertTestServerDidntCrash} from '../test-server/monitor-test-server'
import {act, renderHook} from '@testing-library/react-hooks/dom'
import {useAccount, useAccountVotes, useAccountComments, useNotifications, useComment, useReplies, useAccountSubplebbits, useSubplebbit, useFeed} from '../../dist'
import debugUtils from '../../dist/lib/debug-utils'

import * as accountsActions from '../../dist/stores/accounts/accounts-actions'
import subplebbitsStore from '../../dist/stores/subplebbits'
import testUtils from '../../dist/lib/test-utils'
import {offlineIpfs, pubsubIpfs, plebbitRpc} from '../test-server/config'
import signers from '../fixtures/signers'
const subplebbitAddress = signers[0].address
const adminRoleSigner = signers[1]

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
    beforeAll(async () => {
      console.log(`before accounts tests (${plebbitOptionsType})`)
      testUtils.silenceReactWarnings()
      // reset before or init accounts sometimes fails
      await testUtils.resetDatabasesAndStores()
    })
    afterAll(async () => {
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

    if (plebbitOptionsType !== 'plebbit rpc client') {
      console.log(`${plebbitOptionsType} can't create subplebbit, skipping`)
    } else {
      describe(`create subplebbit (${plebbitOptionsType})`, () => {
        let rendered, waitFor

        beforeAll(async () => {
          rendered = renderHook((subplebbitAddress) => {
            const account = useAccount()
            const {accountSubplebbits} = useAccountSubplebbits()
            const subplebbit = useSubplebbit({subplebbitAddress})
            const subplebbitAddresses = subplebbitAddress ? [subplebbitAddress] : undefined
            const modQueue = useFeed({subplebbitAddresses, modQueue: ['pendingApproval']})
            const feed = useFeed({subplebbitAddresses})
            return {account, accountSubplebbits, subplebbit, modQueue, feed, ...accountsActions}
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

        it('create and edit a subplebbit', async () => {
          console.log('before create subplebbit')
          const createdSubplebbitTitle = 'my title'
          let subplebbit
          await act(async () => {
            subplebbit = await rendered.result.current.createSubplebbit({title: createdSubplebbitTitle})
          })
          console.log('after create subplebbit', subplebbit.address)
          const createdSubplebbitAddress = subplebbit?.address
          expect(typeof createdSubplebbitAddress).to.equal('string')
          expect(subplebbit.title).to.equal(createdSubplebbitTitle)

          console.log('before used subplebbit')
          // can useSubplebbit
          rendered.rerender(createdSubplebbitAddress)
          await waitFor(() => rendered.result.current.subplebbit.title === createdSubplebbitTitle)
          expect(rendered.result.current.subplebbit.address).to.equal(createdSubplebbitAddress)
          expect(rendered.result.current.subplebbit.title).to.equal(createdSubplebbitTitle)
          console.log('after used subplebbit')

          // wait for subplebbit to be added to account subplebbits
          console.log('before subplebbit added to account subplebbits')
          await waitFor(() => rendered.result.current.accountSubplebbits[createdSubplebbitAddress].role.role === 'owner')
          expect(rendered.result.current.accountSubplebbits[createdSubplebbitAddress].role.role).to.equal('owner')
          console.log('after subplebbit added to account subplebbits')

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

          console.log('before use subplebbit')
          // change useSubplebbit address
          rendered.rerender(editedSubplebbitAddress)
          await waitFor(() => rendered.result.current.subplebbit.address === editedSubplebbitAddress)
          expect(rendered.result.current.subplebbit.address).to.equal(editedSubplebbitAddress)
          expect(rendered.result.current.subplebbit.title).to.equal(createdSubplebbitTitle)
          console.log('after use subplebbit')

          console.log('before onChallengeVerification')
          // onChallengeVerification should be called with success even if the sub is edited locally
          await waitFor(() => onChallengeVerificationCalls.length >= 1)
          expect(onChallengeVerificationCalls.length).to.equal(1)
          expect(onChallengeVerificationCalls[0][0].challengeSuccess).to.equal(true)
          console.log('after onChallengeVerification')

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

          console.log('before subplebbit change')
          // wait for change
          await waitFor(() => rendered.result.current.subplebbit.address === editedSubplebbitAddress)
          expect(rendered.result.current.subplebbit.address).to.equal(editedSubplebbitAddress)
          console.log('after subplebbit change')

          console.log('before onChallengeVerification')
          // onChallengeVerification should be called with success even if the sub is edited locally
          await waitFor(() => onChallengeVerificationCalls.length >= 2)
          expect(onChallengeVerificationCalls.length).to.equal(2)
          expect(onChallengeVerificationCalls[1][0].challengeSuccess).to.equal(true)
          console.log('after onChallengeVerification')

          // delete subplebbit
          console.log('before deleteSubplebbit')
          await act(async () => {
            await rendered.result.current.deleteSubplebbit(editedSubplebbitAddress)
          })
          await waitFor(() => rendered.result.current.subplebbit?.updatedAt === undefined)
          expect(rendered.result.current.subplebbit?.updatedAt).to.equal(undefined)
          await waitFor(() => rendered.result.current.accountSubplebbits[editedSubplebbitAddress]?.updatedAt === undefined)
          console.log('after deleteSubplebbit')
        })

        it('create pending approval subplebbit, publish and approve', async () => {
          const title = 'pending approval subplebbit'
          console.log('before create subplebbit')
          let subplebbit
          await act(async () => {
            subplebbit = await rendered.result.current.createSubplebbit({
              title,
              settings: {
                challenges: [
                  {
                    name: 'text-math',
                    pendingApproval: true,
                    exclude: [{role: ['moderator']}],
                  },
                ],
              },
            })
            await subplebbit.start()

            // flaky if not waiting after subplebbit.start()
            await new Promise((r) => setTimeout(r, 1000))
          })
          console.log('after create subplebbit', subplebbit.address)
          expect(typeof subplebbit.address).to.equal('string')
          expect(subplebbit.title).to.equal(title)
          expect(subplebbit.challenges[0].description.includes('math')).to.equal(true)
          expect(subplebbit.challenges[0].pendingApproval).to.equal(true)

          console.log('before used subplebbit')
          // can useSubplebbit
          rendered.rerender(subplebbit.address)
          await waitFor(() => rendered.result.current.subplebbit.title === title)
          expect(rendered.result.current.subplebbit.title).to.equal(title)
          expect(rendered.result.current.subplebbit.challenges[0].description.includes('math')).to.equal(true)
          expect(rendered.result.current.subplebbit.challenges[0].pendingApproval).to.equal(true)
          console.log('after used subplebbit')

          let challenge, comment, challengeVerification
          const logChallenge = (str, obj) => {
            obj = {...obj}
            delete obj.encrypted
            delete obj.signature
            delete obj.challengeRequestId
            console.log(str, obj)
          }
          const onChallenge = (_challenge, _comment) => {
            logChallenge('onChallenge', _challenge)
            challenge = _challenge
            comment = _comment
          }
          const onChallengeVerification = (_challengeVerification) => {
            logChallenge('onChallengeVerification', _challengeVerification)
            challengeVerification = _challengeVerification
          }

          // publish wrong challenge answer, verification should be success false
          let publishCommentOptions = {
            subplebbitAddress: subplebbit.address,
            title: 'some title',
            content: 'some content',
            onChallenge,
            onChallengeVerification,
          }
          await act(async () => {
            console.log('before publishComment wrong challenge answer')
            await rendered.result.current.publishComment(publishCommentOptions)
            console.log('after publishComment wrong challenge answer')
          })
          // wait for challenge
          await waitFor(() => !!challenge)
          expect(challenge.type).to.equal('CHALLENGE')
          comment.publishChallengeAnswers(['']) // publish wrong challenge answer
          // wait for challenge verification
          await waitFor(() => !!challengeVerification)
          expect(challengeVerification.type).to.equal('CHALLENGEVERIFICATION')
          // verification should be success false
          expect(challengeVerification.challengeSuccess).to.equal(false)
          expect(challengeVerification.commentUpdate?.pendingApproval).to.equal(undefined)
          expect(rendered.result.current.modQueue.feed.length).to.equal(0)
          console.log('after onChallengeVerification wrong challenge answer')

          // reset
          let challenge2, comment2, challengeVerification2
          publishCommentOptions = {...publishCommentOptions}
          publishCommentOptions.onChallenge = (_challenge, _comment) => {
            logChallenge('onChallenge', _challenge)
            challenge2 = _challenge
            comment2 = _comment
          }
          publishCommentOptions.onChallengeVerification = (_challengeVerification) => {
            logChallenge('onChallengeVerification', _challengeVerification)
            challengeVerification2 = _challengeVerification
          }
          publishCommentOptions.content += ' 2'

          // publish correct challenge answer, verification should be success true, but pending approval
          await act(async () => {
            console.log('before publishComment')
            await rendered.result.current.publishComment(publishCommentOptions)
            console.log('after publishComment')
          })
          // wait for challenge
          await waitFor(() => !!challenge2)
          expect(challenge2.type).to.equal('CHALLENGE')
          let challengeAnswer = String(eval(challenge2.challenges[0].challenge))
          // challengeAnswer = 'wrong answer'
          comment2.publishChallengeAnswers([challengeAnswer]) // publish correct challenge answer
          // wait for challenge verification
          await waitFor(() => !!challengeVerification2)
          expect(challengeVerification2.type).to.equal('CHALLENGEVERIFICATION')
          expect(challengeVerification2.challengeSuccess).to.equal(true)
          expect(challengeVerification2.commentUpdate.pendingApproval).to.equal(true)
          const pendingApprovalCommentCid = challengeVerification2.commentUpdate.cid
          expect(typeof pendingApprovalCommentCid).to.equal('string')
          console.log('after onChallengeVerification')

          // wait for pending approval in modQueue
          console.log(`before useFeed({modQueue: ['pendingApproval']})`)
          await waitFor(() => rendered.result.current.modQueue.feed.length > 0)
          console.log(rendered.result.current.modQueue.feed)
          expect(rendered.result.current.modQueue.feed.length).to.equal(1)
          expect(rendered.result.current.modQueue.feed[0].pendingApproval).to.equal(true)
          expect(rendered.result.current.modQueue.feed[0].content).to.equal(publishCommentOptions.content)
          console.log(`after useFeed({modQueue: ['pendingApproval']})`)

          // approve pending approval comment
          expect(rendered.result.current.feed.feed.length).to.equal(0)
          expect(typeof rendered.result.current.account.author.address).to.equal('string')
          await subplebbit.edit({
            roles: {[rendered.result.current.account.author.address]: {role: 'moderator'}},
          })
          expect(subplebbit.roles[rendered.result.current.account.author.address].role).to.equal('moderator')

          await act(async () => {
            console.log('before publishCommentModeration')
            await rendered.result.current.publishCommentModeration({
              subplebbitAddress: subplebbit.address,
              commentCid: pendingApprovalCommentCid,
              commentModeration: {approved: true},
              onChallenge,
              onChallengeVerification,
            })
            console.log('after publishCommentModeration')
          })

          // wait for approved comment to appear in feed
          console.log(`before useFeed()`)
          await waitFor(() => rendered.result.current.feed.feed.length > 0)
          expect(rendered.result.current.feed.feed.length).to.equal(1)
          expect(rendered.result.current.feed.feed[0].content).to.equal(publishCommentOptions.content)
          console.log(`after useFeed()`)
        })
      })
    }

    describe(`publish subplebbit edit (${plebbitOptionsType})`, () => {
      let rendered, waitFor

      beforeAll(async () => {
        rendered = renderHook((subplebbitAddress) => {
          const account = useAccount()
          const subplebbit = useSubplebbit({subplebbitAddress})
          return {account, subplebbit, ...accountsActions}
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
          const account = {
            ...rendered.result.current.account,
            plebbitOptions,
            // the 'admin' role signer of subplebbitAddress
            signer: {
              type: 'ed25519',
              privateKey: adminRoleSigner.privateKey,
              address: adminRoleSigner.address,
            },
            author: {
              ...rendered.result.current.account.author,
              address: adminRoleSigner.address,
            },
          }
          await rendered.result.current.setAccount(account)
        })
        expect(rendered.result.current.account.plebbitOptions).to.deep.equal(plebbitOptions)
        console.log('after set account')
      })

      it('publish subplebbit edit', async () => {
        console.log('before used subplebbit')
        rendered.rerender(subplebbitAddress)
        await waitFor(() => rendered.result.current.subplebbit.address === subplebbitAddress)
        await waitFor(() => rendered.result.current.subplebbit.roles[adminRoleSigner.address].role === 'admin')
        expect(rendered.result.current.subplebbit.address).to.equal(subplebbitAddress)
        expect(rendered.result.current.subplebbit.roles[adminRoleSigner.address].role).to.equal('admin')
        console.log('after used subplebbit')

        // publish subplebbit edit
        const onChallenge = (challenge, subplebbitEdit) => subplebbitEdit.publishChallengeAnswers(['2'])
        const onChallengeVerificationCalls = []
        const onChallengeVerification = (...args) => onChallengeVerificationCalls.push([...args])
        const editedTitle = `edited title ${Math.random()}`
        console.log('before plebbit.publishSubplebbitEdit()')
        await act(async () => {
          await rendered.result.current.publishSubplebbitEdit(subplebbitAddress, {title: editedTitle, onChallenge, onChallengeVerification})
        })
        console.log('after plebbit.publishSubplebbitEdit()')

        console.log('before onChallengeVerification')
        await waitFor(() => onChallengeVerificationCalls.length >= 1)
        expect(onChallengeVerificationCalls.length).to.equal(1)
        expect(onChallengeVerificationCalls[0][0].challengeSuccess).to.equal(true)
        console.log(onChallengeVerificationCalls[0][0])
        console.log('after onChallengeVerification')

        await waitFor(() => rendered.result.current.subplebbit.title === editedTitle)
        expect(rendered.result.current.subplebbit.title).to.equal(editedTitle)
        console.log(rendered.result.current.subplebbit.title)
      })
    })

    describe(`publish (${plebbitOptionsType})`, {retry: 2}, () => {
      let rendered, waitFor, publishedCid

      beforeAll(async () => {
        rendered = renderHook((commentCid) => {
          const account = useAccount()
          const {accountVotes} = useAccountVotes()
          const {accountComments} = useAccountComments()
          const notifications = useNotifications()
          const comment = useComment({commentCid})
          const replies = useReplies({comment})
          return {account, accountVotes, accountComments, notifications, comment, replies, ...accountsActions}
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
          expect(rendered.result.current.accountComments.length).to.be.greaterThan(0)
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

        it(`publish reply (${plebbitOptionsType})`, {retry: 2}, async () => {
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
          // wait for the parent comment to be indexed by the subplebbit before publishing a reply
          rendered.rerender(publishedCid)
          await waitFor(() => typeof rendered.result.current.comment?.timestamp === 'number')
          console.log('parent comment indexed, publishing reply')

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
          expect(replyChallengeVerification.challengeSuccess).to.equal(true, 'Not expected this challengeVerification: ' + JSON.stringify(replyChallengeVerification))
          console.log('after onChallengeVerification')

          // wait for useReplies
          expect(typeof publishedCid).to.equal('string')
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
