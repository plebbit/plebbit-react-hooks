import {act, renderHook} from '@testing-library/react-hooks'
import testUtils from '../../lib/test-utils'
import {
  useAccount,
  useAccounts,
  useAccountComment,
  useAccountComments,
  useAccountVotes,
  useAccountVote,
  useAccountEdits,
  useEditedComment,
  useAccountSubplebbits,
  UseAccountCommentsOptions,
  useComment,
  useNotifications,
  useFeed,
  useSubplebbit,
  usePubsubSubscribe,
  setPlebbitJs,
} from '../..'
import commentsStore from '../../stores/comments'
import * as accountsActions from '../../stores/accounts/accounts-actions'
import PlebbitJsMock, {Plebbit, Comment, Subplebbit, Pages, resetPlebbitJsMock, debugPlebbitJsMock} from '../../lib/plebbit-js/plebbit-js-mock'
import accountsStore from '../../stores/accounts'
setPlebbitJs(PlebbitJsMock)

describe('accounts', () => {
  beforeAll(() => {
    testUtils.silenceReactWarnings()
  })
  afterAll(() => {
    testUtils.restoreAll()
  })

  describe('no accounts in database', () => {
    afterEach(async () => {
      await testUtils.resetDatabasesAndStores()
    })

    test('generate default account on load', async () => {
      // on first render, the account is undefined because it's not yet loaded from database
      const rendered = renderHook(() => useAccount())
      const waitFor = testUtils.createWaitFor(rendered)

      // on second render, you get the default generated account
      await waitFor(() => rendered.result.current.name)
      const account = rendered.result.current
      expect(account.name).toBe('Account 1')
      expect(account.author.displayName).toBe(undefined)
      expect(typeof account.author.address).toBe('string')
      expect(typeof account.author.shortAddress).toBe('string')
      expect(Array.isArray(account.subscriptions)).toBe(true)
      expect(account.blockedAddresses && typeof account.blockedAddresses === 'object').toBe(true)
      expect(account.blockedCids && typeof account.blockedCids === 'object').toBe(true)
      expect(account.plebbit && typeof account.plebbit === 'object').toBe(true)
      expect(account.plebbitOptions && typeof account.plebbitOptions === 'object').toBe(true)
      expect(account.plebbitOptions.ipfsGatewayUrls?.length).toBeGreaterThan(0)
      expect(account.plebbitOptions.pubsubHttpClientsOptions?.length).toBeGreaterThan(0)
      expect(account.plebbitOptions.ipfsHttpClientsOptions).toBe(undefined)
    })

    test(`default plebbit options are not saved to database`, async () => {
      const plebbitOptions = {ipfsHttpClientsOptions: ['http://one:5001/api/v0']}
      // @ts-ignore
      window.defaultPlebbitOptions = plebbitOptions

      // re-init accounts after changing plebbit defaults
      await testUtils.resetDatabasesAndStores()

      const rendered = renderHook(() => {
        const account = useAccount()
        const {setAccount} = accountsActions
        return {account, setAccount}
      })
      const waitFor = testUtils.createWaitFor(rendered)

      // reloaded accounts have new default plebbit options
      await waitFor(() => rendered.result.current.account.plebbitOptions.ipfsHttpClientsOptions[0] === plebbitOptions.ipfsHttpClientsOptions[0])
      expect(rendered.result.current.account.plebbitOptions.ipfsHttpClientsOptions[0]).toBe(plebbitOptions.ipfsHttpClientsOptions[0])

      // set account with new default plebbit options
      await act(async () => {
        const author = {...rendered.result.current.account.author, displayName: 'john'}
        const account = {...rendered.result.current.account, author}
        await rendered.result.current.setAccount(account)
      })

      // account has new default plebbit options
      await waitFor(() => rendered.result.current.account.author.displayName === 'john')
      expect(rendered.result.current.account.author.displayName).toBe('john')
      expect(rendered.result.current.account.plebbitOptions.ipfsHttpClientsOptions[0]).toBe(plebbitOptions.ipfsHttpClientsOptions[0])

      // change default plebbit options and reload accounts
      plebbitOptions.ipfsHttpClientsOptions = ['http://two:5001/api/v0']
      await testUtils.resetStores()

      // on second render get the account from database
      const rendered2 = renderHook(() => {
        const account = useAccount()
        return {account}
      })
      const waitFor2 = testUtils.createWaitFor(rendered2)
      await waitFor2(() => rendered2.result.current.account)

      // account plebbit options were not saved, has new default plebbit options
      expect(rendered2.result.current.account.plebbitOptions.ipfsHttpClientsOptions[0]).toBe(plebbitOptions.ipfsHttpClientsOptions[0])
      expect(rendered2.result.current.account.author.displayName).toBe('john')

      // @ts-ignore
      delete window.defaultPlebbitOptions
    })

    test.todo('default generated account has all the data defined in schema, like signer, author, plebbitOptions, etc')

    test('create new accounts', async () => {
      const rendered = renderHook<any, any>((accountName) => {
        const account = useAccount({accountName})
        const {createAccount} = accountsActions
        return {account, createAccount}
      })
      const waitFor = testUtils.createWaitFor(rendered)

      // on second render, you get the default generated account
      await waitFor(() => rendered.result.current.account.name)
      expect(rendered.result.current.account.name).toBe('Account 1')
      expect(typeof rendered.result.current.createAccount).toBe('function')

      await act(async () => {
        // create 'Account 2'
        await rendered.result.current.createAccount()
        // create 'Account 3'
        await rendered.result.current.createAccount()
        // create account 'custom name'
        await rendered.result.current.createAccount('custom name')
      })

      // get created accounts by name
      rendered.rerender('Account 1')
      expect(rendered.result.current.account.name).toBe('Account 1')
      rendered.rerender('Account 2')
      expect(rendered.result.current.account.name).toBe('Account 2')
      rendered.rerender('Account 3')
      expect(rendered.result.current.account.name).toBe('Account 3')
      rendered.rerender('Account 4')
      expect(rendered.result.current.account).toBe(undefined)
      rendered.rerender('custom name')
      expect(rendered.result.current.account.name).toBe('custom name')

      // reset stores to force using the db
      await testUtils.resetStores()

      // render second store with empty state to check if accounts saved to database
      const rendered2 = renderHook<any, any>((accountName) => useAccount({accountName}))
      const waitFor2 = testUtils.createWaitFor(rendered2)

      // accounts not yet loaded from database
      await waitFor2(() => rendered2.result.current.name)

      // default active account is account 1
      expect(rendered2.result.current.name).toBe('Account 1')
      // get all accounts by name
      rendered2.rerender('Account 1')
      expect(rendered2.result.current.name).toBe('Account 1')
      rendered2.rerender('Account 2')
      expect(rendered2.result.current.name).toBe('Account 2')
      rendered2.rerender('Account 3')
      expect(rendered2.result.current.name).toBe('Account 3')
      rendered2.rerender('Account 4')
      expect(rendered2.result.current).toBe(undefined)
      rendered2.rerender('custom name')
      expect(rendered2.result.current.name).toBe('custom name')
    })

    test('usePubsubSubscribe', async () => {
      const rendered = renderHook<any, any>((subplebbitAddress) => {
        const result = usePubsubSubscribe({subplebbitAddress})
        return {result}
      })
      const waitFor = testUtils.createWaitFor(rendered)

      rendered.rerender('subplebbit-address.eth')
      await waitFor(() => rendered.result.current.result.state === 'succeeded')
      expect(rendered.result.current.result.state).toBe('succeeded')
    })
  })

  describe('multiple accounts in database', () => {
    let rendered: any, waitFor: Function

    beforeEach(async () => {
      // on first render, the account is undefined because it's not yet loaded from database
      rendered = renderHook<any, any>((accountName) => {
        const account = useAccount({accountName})
        const {accounts} = useAccounts()
        const {accountComments} = useAccountComments()
        const {accountVotes} = useAccountVotes()
        const {accountEdits} = useAccountEdits()
        return {account, accounts, accountComments, accountVotes, accountEdits, ...accountsActions}
      })
      waitFor = testUtils.createWaitFor(rendered)

      // on second render, you get the default generated account
      await waitFor(() => rendered.result.current.account.name)
      expect(rendered.result.current.account.name).toBe('Account 1')
      expect(typeof rendered.result.current.createAccount).toBe('function')

      await act(async () => {
        // create 'Account 2'
        await rendered.result.current.createAccount()
        // create 'Account 3'
        await rendered.result.current.createAccount()
        // create account 'custom name'
        await rendered.result.current.createAccount('custom name')
      })
    })

    afterEach(async () => {
      await testUtils.resetDatabasesAndStores()
    })

    test('change which account is active', async () => {
      // active account is Account 1
      expect(rendered.result.current.account.name).toBe('Account 1')
      expect(typeof rendered.result.current.setActiveAccount).toBe('function')

      // change active account
      await act(async () => {
        await rendered.result.current.setActiveAccount('Account 2')
      })
      expect(rendered.result.current.account.name).toBe('Account 2')

      // change active account
      await act(async () => {
        await rendered.result.current.setActiveAccount('custom name')
      })
      expect(rendered.result.current.account.name).toBe('custom name')

      // reset stores to force using the db
      await testUtils.resetStores()

      // render second store with empty state to check if accounts saved to database
      const rendered2 = renderHook<any, any>(() => useAccount())
      const waitFor2 = testUtils.createWaitFor(rendered2)

      // accounts not yet loaded from database
      await waitFor2(() => rendered2.result.current.name)

      // active account is still 'custom name'
      expect(rendered2.result.current.name).toBe('custom name')
    })

    test(`fail to get account that doesn't exist`, () => {
      expect(rendered.result.current.account.name).toBe('Account 1')
      rendered.rerender('account that does not exist')
      expect(rendered.result.current.account).toBe(undefined)
      rendered.rerender('Account 1')
      expect(rendered.result.current.account.name).toBe('Account 1')
    })

    test(`useAccounts have shortAddresses`, async () => {
      expect(typeof rendered.result.current.accounts[0].author.shortAddress).toBe('string')
      expect(typeof rendered.result.current.accounts[1].author.shortAddress).toBe('string')
    })

    test(`fail to create account with name that already exists`, async () => {
      expect(typeof rendered.result.current.account.name).toBe('string')
      await act(async () => {
        expect(() => rendered.result.current.createAccount(rendered.result.current.account.name)).rejects.toThrow(
          `account name '${rendered.result.current.account.name}' already exists in database`
        )
      })
    })

    test('edit non active account display name', async () => {
      rendered.rerender('Account 2')
      expect(rendered.result.current.account.name).toBe('Account 2')
      expect(rendered.result.current.account.author.displayName).toBe(undefined)
      const newAccount = JSON.parse(JSON.stringify({...rendered.result.current.account}))
      newAccount.author.displayName = 'display name john'
      await act(async () => {
        await rendered.result.current.setAccount(newAccount)
      })
      expect(rendered.result.current.account.author.displayName).toBe('display name john')

      // reset stores to force using the db
      await testUtils.resetStores()

      // render second store with empty state to check if account change saved to database
      const rendered2 = renderHook<any, any>(() => useAccount({accountName: 'Account 2'}))
      const waitFor2 = testUtils.createWaitFor(rendered2)

      // accounts not yet loaded from database
      await waitFor2(() => rendered2.result.current.name)

      // active account display name is still 'display name john'
      expect(rendered2.result.current.author.displayName).toBe('display name john')
    })

    test('edit active account name and display name', async () => {
      expect(rendered.result.current.account.name).toBe('Account 1')
      expect(rendered.result.current.account.author.displayName).toBe(undefined)
      const newAccount = JSON.parse(JSON.stringify({...rendered.result.current.account}))
      newAccount.author.displayName = 'display name john'
      newAccount.name = 'account name john'
      await act(async () => {
        await rendered.result.current.setAccount(newAccount)
      })
      expect(rendered.result.current.account.author.displayName).toBe('display name john')
      expect(rendered.result.current.account.name).toBe('account name john')

      // reset stores to force using the db
      await testUtils.resetStores()

      // render second store with empty state to check if account change saved to database
      const rendered2 = renderHook<any, any>(() => useAccount())
      const waitFor2 = testUtils.createWaitFor(rendered2)

      // accounts not yet loaded from database
      await waitFor2(() => rendered2.result.current.name)

      // active account is still 'account name john'
      expect(rendered2.result.current.name).toBe('account name john')
    })

    test('fail to edit account with wrong account id', async () => {
      const newAccount = JSON.parse(JSON.stringify({...rendered.result.current.account}))
      newAccount.author.displayName = 'display name john'
      newAccount.id = 'something incorrect'
      await act(async () => {
        expect(rendered.result.current.setAccount(newAccount)).rejects.toThrow(`cannot set account with account.id 'something incorrect' id does not exist in database`)
      })
    })

    test.todo('edited account can still sign and publish comments')

    test.todo(`fail to edit account.author.address that doesn't match signer private key`)

    test.todo(`fail to edit account.signer.address that doesn't match signer private key`)

    describe('account comments, account votes, account edits in database', () => {
      const subplebbitAddress = 'subplebbit address'

      beforeEach(async () => {
        let challengeVerificationCount = 0
        const publishCommentEditOptions = {
          subplebbitAddress,
          locked: true,
          onChallenge: (challenge: any, comment: any) => comment.publishChallengeAnswers(),
          onChallengeVerification: () => challengeVerificationCount++,
        }
        const publishCommentOptions = {
          subplebbitAddress,
          onChallenge: (challenge: any, comment: any) => comment.publishChallengeAnswers(),
          onChallengeVerification: () => challengeVerificationCount++,
        }
        const publishVoteOptions = {
          subplebbitAddress,
          vote: 1,
          onChallenge: (challenge: any, comment: any) => comment.publishChallengeAnswers(),
          onChallengeVerification: () => challengeVerificationCount++,
        }
        await act(async () => {
          await accountsActions.publishComment({...publishCommentOptions, content: 'content 1'})
          // wait for account comment to have cid, for comment.author.previousCommentCid tests
          await waitFor(() => rendered.result.current.accountComments[0]?.cid)

          await accountsActions.publishComment({...publishCommentOptions, content: 'content 2'})
          await accountsActions.publishVote({...publishVoteOptions, commentCid: 'comment cid 1'})
          await accountsActions.publishVote({...publishVoteOptions, commentCid: 'comment cid 2'})
          await accountsActions.publishCommentEdit({...publishCommentEditOptions, commentCid: 'comment cid 1'})
          await accountsActions.publishCommentEdit({...publishCommentEditOptions, commentCid: 'comment cid 2'})
        })
        await waitFor(() => challengeVerificationCount === 6)
        expect(challengeVerificationCount).toBe(6)
      })

      afterEach(async () => {
        await testUtils.resetDatabasesAndStores()
      })

      test('published comment has comment.author.previousCommentCid', async () => {
        await waitFor(() => rendered.result.current.accountComments.length >= 2)
        expect(rendered.result.current.accountComments[0].author.previousCommentCid).toBe(undefined)
        expect(rendered.result.current.accountComments[0].cid).toBe('content 1 cid')
        expect(rendered.result.current.accountComments[1].author.previousCommentCid).toBe('content 1 cid')
      })

      test('export account', async () => {
        let exportedJson: any, exported: any
        await act(async () => {
          exportedJson = await rendered.result.current.exportAccount()
        })
        try {
          exported = JSON.parse(exportedJson)
        } catch (e) {
          console.error(e)
        }
        expect(typeof exportedJson).toBe('string')
        expect(typeof exported?.account?.id).toBe('string')
        expect(typeof exported?.account?.signer?.privateKey).toBe('string')

        // account.plebbit has been removed
        expect(exported?.account.plebbit).toBe(undefined)

        // exported account comments
        expect(exported?.accountComments?.[0]?.content).toBe('content 1')
        expect(exported?.accountComments?.[1]?.content).toBe('content 2')

        // exported account votes
        expect(exported?.accountVotes?.[0]?.commentCid).toBe('comment cid 1')
        expect(exported?.accountVotes?.[1]?.commentCid).toBe('comment cid 2')

        // exported account edits
        expect(exported?.accountEdits?.[0]?.commentCid).toBe('comment cid 1')
        expect(exported?.accountEdits?.[1]?.commentCid).toBe('comment cid 2')
      })

      test('import account', async () => {
        let exported: any
        await act(async () => {
          try {
            exported = JSON.parse(await rendered.result.current.exportAccount())
          } catch (e) {}
        })
        expect(typeof exported?.account?.id).toBe('string')
        expect(typeof exported?.account?.signer?.privateKey).toBe('string')
        // account.plebbit has been removed
        expect(exported?.account.plebbit).toBe(undefined)

        exported.account.author.name = 'imported author name'
        exported.account.name = 'imported account name'
        exported.account.id = 'imported account id' // this should get reset
        await act(async () => {
          await rendered.result.current.importAccount(JSON.stringify(exported))
        })
        rendered.rerender(exported?.account.name)

        await waitFor(() => rendered.result.current.account.author.name === exported?.account.author.name)
        expect(rendered.result.current.account?.author?.name).toBe(exported?.account.author.name)
        expect(rendered.result.current.account?.name).toBe(exported?.account.name)
        // account.id has been reset
        expect(typeof rendered.result.current.account?.id).toBe('string')
        expect(rendered.result.current.account?.id).not.toBe(exported?.account.id)
        // account.plebbit has been initialized
        expect(typeof rendered.result.current.account?.plebbit?.getSubplebbit).toBe('function')

        // has account comments, votes, edits
        await waitFor(() => rendered.result.current.accountComments?.[0]?.content === 'content 1')
        expect(rendered.result.current.accountComments?.[0]?.content).toBe('content 1')
        expect(rendered.result.current.accountComments?.[1]?.content).toBe('content 2')
        await waitFor(() => rendered.result.current.accountVotes?.[0]?.commentCid === 'comment cid 1')
        expect(rendered.result.current.accountVotes?.[0]?.commentCid).toBe('comment cid 1')
        expect(rendered.result.current.accountVotes?.[1]?.commentCid).toBe('comment cid 2')
        await waitFor(() => rendered.result.current.accountEdits?.[0]?.commentCid === 'comment cid 1')
        expect(rendered.result.current.accountEdits?.[0]?.commentCid).toBe('comment cid 1')
        expect(rendered.result.current.accountEdits?.[1]?.commentCid).toBe('comment cid 2')

        // reset stores to force using the db
        await testUtils.resetStores()

        // imported account persists in database after store reset
        const rendered2 = renderHook<any, any>(() => {
          const account = useAccount({accountName: exported?.account.name})
          const {accountComments} = useAccountComments({accountName: exported?.account.name})
          const {accountVotes} = useAccountVotes({accountName: exported?.account.name})
          const {accountEdits} = useAccountEdits({accountName: exported?.account.name})
          return {account, accountComments, accountVotes, accountEdits}
        })
        const waitFor2 = testUtils.createWaitFor(rendered2)
        await waitFor2(() => (rendered2.result.current.account.name = exported?.account.name))
        expect(rendered2.result.current.account.author?.name).toBe(exported?.account.author.name)
        expect(rendered2.result.current.account.name).toBe(exported?.account.name)
        // account.id has been reset
        expect(typeof rendered2.result.current.account.id).toBe('string')
        expect(rendered2.result.current.account.id).not.toBe(exported?.account.id)
        // account.plebbit has been initialized
        expect(typeof rendered2.result.current.account.plebbit?.getSubplebbit).toBe('function')

        // has account comments, votes, edits
        await waitFor2(() => rendered2.result.current.accountComments?.[0]?.content === 'content 1')
        expect(rendered2.result.current.accountComments?.[0]?.content).toBe('content 1')
        expect(rendered2.result.current.accountComments?.[1]?.content).toBe('content 2')
        await waitFor2(() => rendered2.result.current.accountVotes?.[0]?.commentCid === 'comment cid 1')
        expect(rendered2.result.current.accountVotes?.[0]?.commentCid).toBe('comment cid 1')
        expect(rendered2.result.current.accountVotes?.[1]?.commentCid).toBe('comment cid 2')
        await waitFor2(() => rendered2.result.current.accountEdits?.[0]?.commentCid === 'comment cid 1')
        expect(rendered2.result.current.accountEdits?.[0]?.commentCid).toBe('comment cid 1')
        expect(rendered2.result.current.accountEdits?.[1]?.commentCid).toBe('comment cid 2')
      })

      test(`import account with duplicate account name succeeds by adding ' 2' to account name`, async () => {
        let exported: any
        await act(async () => {
          try {
            exported = JSON.parse(await rendered.result.current.exportAccount())
          } catch (e) {}
        })
        expect(typeof exported?.account?.id).toBe('string')
        expect(typeof exported?.account?.signer?.privateKey).toBe('string')

        exported.account.author.name = 'imported author name'
        exported.account.id = 'imported account id' // this should get reset
        await act(async () => {
          await rendered.result.current.importAccount(JSON.stringify(exported))
        })
        // if the imported account name already exists, ' 2' get added to the name
        rendered.rerender(exported?.account.name + ' 2')

        await waitFor(() => rendered.result.current.account.author.name === exported?.account.author.name)
        expect(rendered.result.current.account?.author?.name).toBe(exported?.account.author.name)
      })

      test(`import account with duplicate account id succeeds because account id is reset on import`, async () => {
        let exported: any
        await act(async () => {
          try {
            exported = JSON.parse(await rendered.result.current.exportAccount())
          } catch (e) {}
        })
        expect(typeof exported?.account?.id).toBe('string')
        expect(typeof exported?.account?.signer?.privateKey).toBe('string')

        exported.account.name = 'imported account name'
        await act(async () => {
          await rendered.result.current.importAccount(JSON.stringify(exported))
        })
        rendered.rerender(exported?.account.name)

        await waitFor(() => rendered.result.current.account.id)
        expect(rendered.result.current.account?.name).toBe(exported?.account.name)
        expect(rendered.result.current.account?.id).not.toBe(exported?.account.id)
      })
    })

    test(`change account order`, async () => {
      expect(rendered.result.current.accounts[0].name).toBe('Account 1')
      expect(rendered.result.current.accounts[1].name).toBe('Account 2')
      expect(rendered.result.current.accounts[2].name).toBe('Account 3')
      expect(rendered.result.current.accounts[3].name).toBe('custom name')
      await act(async () => {
        expect(() => rendered.result.current.setAccountsOrder(['wrong account name', 'Account 3', 'Account 2', 'Account 1'])).rejects.toThrow()
        await rendered.result.current.setAccountsOrder(['custom name', 'Account 3', 'Account 2', 'Account 1'])
      })
      expect(rendered.result.current.accounts[0].name).toBe('custom name')
      expect(rendered.result.current.accounts[1].name).toBe('Account 3')
      expect(rendered.result.current.accounts[2].name).toBe('Account 2')
      expect(rendered.result.current.accounts[3].name).toBe('Account 1')

      // reset stores to force using the db
      await testUtils.resetStores()

      // render second store with empty state to check if saved to database
      const rendered2 = renderHook<any, any>(() => useAccounts())
      const waitFor2 = testUtils.createWaitFor(rendered2)
      await waitFor2(() => rendered2.result.current.accounts[0].name)

      expect(rendered2.result.current.accounts[0].name).toBe('custom name')
      expect(rendered2.result.current.accounts[1].name).toBe('Account 3')
      expect(rendered2.result.current.accounts[2].name).toBe('Account 2')
      expect(rendered2.result.current.accounts[3].name).toBe('Account 1')
    })

    test(`delete account non-active account`, async () => {
      const activeAccountIdBefore = rendered.result.current.account.id
      const accountCountBefore = rendered.result.current.accounts.length
      await act(async () => {
        await rendered.result.current.deleteAccount('Account 2')
      })

      // deleting a non-active account doesn't affect the active account
      await waitFor(() => rendered.result.current.accounts.length === accountCountBefore - 1)
      expect(rendered.result.current.account.id).toBe(activeAccountIdBefore)

      // check that account is deleted
      rendered.rerender('Account 2')
      await waitFor(() => rendered.result.current.account === undefined)
      await waitFor(() => rendered.result.current.accounts.length === accountCountBefore - 1)
      expect(rendered.result.current.account).toBe(undefined)
      expect(rendered.result.current.accounts.length).toBe(accountCountBefore - 1)
      expect(rendered.result.current.accounts[0].name).toBe('Account 1')
      expect(rendered.result.current.accounts[1].name).toBe('Account 3')
      expect(rendered.result.current.accounts[2].name).toBe('custom name')

      // reset stores to force using the db
      await testUtils.resetStores()

      // account deleted persists in database after store reset
      const rendered2 = renderHook<any, any>(() => useAccounts())
      const waitFor2 = testUtils.createWaitFor(rendered2)
      await waitFor2(() => rendered2.result.current.accounts.length > 0)
      expect(rendered2.result.current.accounts.length).toBe(accountCountBefore - 1)
      expect(rendered2.result.current.accounts[0].name).toBe('Account 1')
      expect(rendered2.result.current.accounts[1].name).toBe('Account 3')
      expect(rendered2.result.current.accounts[2].name).toBe('custom name')
    })

    test(`delete active account, active account switches to second account in accountNames`, async () => {
      const activeAccountIdBefore = rendered.result.current.account.id
      const accountCountBefore = rendered.result.current.accounts.length
      await act(async () => {
        await rendered.result.current.deleteAccount()
      })

      // deleting active account 'Account 1' switches active account to 'Account 2'
      await waitFor(() => rendered.result.current.accounts.length === accountCountBefore - 1)
      expect(rendered.result.current.account.id).not.toBe(activeAccountIdBefore)
      expect(rendered.result.current.account.name).toBe('Account 2')
      expect(rendered.result.current.accounts.length).toBe(accountCountBefore - 1)

      // check that account is deleted
      rendered.rerender('Account 1')
      await waitFor(() => rendered.result.current.account === undefined)
      await waitFor(() => rendered.result.current.accounts.length === accountCountBefore - 1)
      expect(rendered.result.current.account).toBe(undefined)
      expect(rendered.result.current.accounts.length).toBe(accountCountBefore - 1)
      expect(rendered.result.current.accounts[0].name).toBe('Account 2')
      expect(rendered.result.current.accounts[1].name).toBe('Account 3')
      expect(rendered.result.current.accounts[2].name).toBe('custom name')

      // reset stores to force using the db
      await testUtils.resetStores()

      // account deleted persists in database after store reset
      const rendered2 = renderHook<any, any>(() => useAccounts())
      const waitFor2 = testUtils.createWaitFor(rendered2)
      await waitFor2(() => rendered2.result.current.accounts.length > 0)
      expect(rendered2.result.current.accounts.length).toBe(accountCountBefore - 1)
      expect(rendered2.result.current.accounts[0].name).toBe('Account 2')
      expect(rendered2.result.current.accounts[1].name).toBe('Account 3')
      expect(rendered2.result.current.accounts[2].name).toBe('custom name')
    })

    test(`delete all accounts and create a new one, which becomes active`, async () => {
      let accountCount = rendered.result.current.accounts.length
      while (accountCount--) {
        await act(async () => {
          await rendered.result.current.deleteAccount()
        })
        await waitFor(() => rendered.result.current.accounts.length === accountCount)
      }

      // all accounts have been deleted
      expect(rendered.result.current.accounts.length).toBe(0)

      // create new account
      await act(async () => {
        await rendered.result.current.createAccount()
      })
      await waitFor(() => rendered.result.current.accounts.length === 1)
      await waitFor(() => rendered.result.current.account)
      expect(rendered.result.current.accounts.length).toBe(1)
      expect(rendered.result.current.account.name).toBe('Account 1')
    })

    test(`subscribe and unsubscribe to subplebbit`, async () => {
      const subplebbitAddress = 'tosubscribeto.eth'
      const subplebbitAddress2 = 'tosubscribeto2.eth'

      // subscribe to 1 sub
      await act(async () => {
        await rendered.result.current.subscribe(subplebbitAddress)
      })
      await waitFor(() => rendered.result.current.account.subscriptions.length === 1)
      expect(rendered.result.current.account.subscriptions).toEqual([subplebbitAddress])

      // fail subscribing twice
      await act(async () => {
        await expect(() => rendered.result.current.subscribe(subplebbitAddress)).rejects.toThrow()
      })

      // unsubscribe
      await act(async () => {
        await rendered.result.current.unsubscribe(subplebbitAddress)
      })
      await waitFor(() => rendered.result.current.account.subscriptions.length === 0)
      expect(rendered.result.current.account.subscriptions).toEqual([])

      // fail unsubscribing twice
      await act(async () => {
        await expect(() => rendered.result.current.unsubscribe(subplebbitAddress)).rejects.toThrow()
      })

      // subscribe to 2 subs
      await act(async () => {
        await rendered.result.current.subscribe(subplebbitAddress)
        await rendered.result.current.subscribe(subplebbitAddress2)
      })
      await waitFor(() => rendered.result.current.account.subscriptions.length === 2)
      expect(rendered.result.current.account.subscriptions).toEqual([subplebbitAddress, subplebbitAddress2])

      // unsubscribe with 2 subs
      await act(async () => {
        await rendered.result.current.unsubscribe(subplebbitAddress)
      })
      await waitFor(() => rendered.result.current.account.subscriptions.length === 1)
      expect(rendered.result.current.account.subscriptions).toEqual([subplebbitAddress2])

      // reset stores to force using the db
      await testUtils.resetStores()

      // subscribing persists in database after store reset
      const rendered2 = renderHook<any, any>(() => useAccount())
      const waitFor2 = testUtils.createWaitFor(rendered2)
      await waitFor2(() => rendered2.result.current.subscriptions.length === 1)
      expect(rendered2.result.current.subscriptions).toEqual([subplebbitAddress2])
    })

    test(`block and unblock to address`, async () => {
      const address1 = 'subplebbit.eth'
      const address2 = 'author.eth'

      // block address 1
      await act(async () => {
        await rendered.result.current.blockAddress(address1)
      })
      await waitFor(() => Object.keys(rendered.result.current.account.blockedAddresses).length === 1)
      expect(rendered.result.current.account.blockedAddresses).toEqual({[address1]: true})

      // fail subscribing twice
      await act(async () => {
        await expect(() => rendered.result.current.blockAddress(address1)).rejects.toThrow()
      })

      // unblock
      await act(async () => {
        await rendered.result.current.unblockAddress(address1)
      })
      await waitFor(() => Object.keys(rendered.result.current.account.blockedAddresses).length === 0)
      expect(rendered.result.current.account.blockedAddresses).toEqual({})

      // fail unblocking twice
      await act(async () => {
        await expect(() => rendered.result.current.unblockAddress(address1)).rejects.toThrow()
      })

      // block address 1 and 2
      await act(async () => {
        await rendered.result.current.blockAddress(address1)
        await rendered.result.current.blockAddress(address2)
      })
      await waitFor(() => Object.keys(rendered.result.current.account.blockedAddresses).length === 2)
      expect(rendered.result.current.account.blockedAddresses).toEqual({[address1]: true, [address2]: true})

      // unblock with 2 blocked addresses
      await act(async () => {
        await rendered.result.current.unblockAddress(address1)
      })
      await waitFor(() => Object.keys(rendered.result.current.account.blockedAddresses).length === 1)
      expect(rendered.result.current.account.blockedAddresses).toEqual({[address2]: true})

      // reset stores to force using the db
      await testUtils.resetStores()

      // blocking persists in database after store reset
      const rendered2 = renderHook<any, any>(() => useAccount())
      const waitFor2 = testUtils.createWaitFor(rendered2)
      await waitFor2(() => Object.keys(rendered2.result.current.blockedAddresses).length === 1)
      expect(rendered2.result.current.blockedAddresses).toEqual({[address2]: true})
    })

    // already implemented but not tested
    test.todo('deleting account deletes account comments')

    // already implemented but not tested
    test.todo('deleting account deletes account votes')
  })

  describe('no comments or votes in database', () => {
    let rendered: any, waitFor: any
    const render = async () => {
      // on first render, the account is undefined because it's not yet loaded from database
      rendered = renderHook<any, any>((accountName) => {
        const account = useAccount({accountName})
        const {accountEdits} = useAccountEdits({accountName})
        return {account, accountEdits, ...accountsActions}
      })
      waitFor = testUtils.createWaitFor(rendered)

      // on second render, you get the default generated account
      await waitFor(() => rendered.result.current.account.name)
      expect(rendered.result.current.account.name).toBe('Account 1')
      expect(typeof rendered.result.current.publishComment).toBe('function')
      expect(typeof rendered.result.current.publishVote).toBe('function')
    }

    describe(`create comment`, () => {
      beforeAll(async () => {
        await render()
      })
      afterAll(async () => {
        await testUtils.resetDatabasesAndStores()
      })

      const onChallenge = jest.fn()
      const onChallengeVerification = jest.fn()

      test('publish comment', async () => {
        const publishCommentOptions = {
          subplebbitAddress: '12D3KooW...',
          parentCid: 'Qm...',
          content: 'some content',
          onChallenge,
          onChallengeVerification,
        }
        let pendingComment: any
        await act(async () => {
          pendingComment = await rendered.result.current.publishComment(publishCommentOptions)
        })
        expect(pendingComment.index).toBe(0)
      })

      let comment: any

      test('onChallenge gets called', async () => {
        // onChallenge gets call backed once
        await waitFor(() => onChallenge.mock.calls.length === 1)
        expect(onChallenge.mock.calls.length).toBe(1)

        // onChallenge arguments are [challenge, comment]
        const challenge = onChallenge.mock.calls[0][0]
        comment = onChallenge.mock.calls[0][1]
        expect(challenge.type).toBe('CHALLENGE')
        expect(challenge.challenges[0]).toEqual({challenge: '2+2=?', type: 'text'})
        expect(typeof comment.publishChallengeAnswers).toBe('function')
      })

      test('onChallengeVerification gets called', async () => {
        // publish challenge answer and wait for verification
        comment.publishChallengeAnswers(['4'])
        await waitFor(() => onChallengeVerification.mock.calls.length === 1)

        expect(onChallengeVerification.mock.calls.length).toBe(1)
        const challengeVerification = onChallengeVerification.mock.calls[0][0]
        const commentVerified = onChallengeVerification.mock.calls[0][1]
        expect(challengeVerification.type).toBe('CHALLENGEVERIFICATION')
        expect(commentVerified.constructor.name).toBe('Comment')

        // commentCidsToAccountsComments is set after challenge verification
        const {commentCidsToAccountsComments} = accountsStore.getState()
        expect(commentCidsToAccountsComments['some content cid'].accountId).toBe(rendered.result.current.account.id)
        expect(commentCidsToAccountsComments['some content cid'].accountCommentIndex).toBe(0)
      })

      test('useComment can use the published account comment', async () => {
        // make sure we use the account comment and not get comment
        const getComment = Plebbit.prototype.getComment
        Plebbit.prototype.getComment = async () => {
          throw Error('failed getting comment')
        }

        const rendered2 = renderHook<any, any>((commentCid) => useComment({commentCid}))
        rendered2.rerender('some content cid')
        await waitFor(() => rendered2.result.current.content === 'some content')
        expect(rendered2.result.current.content).toBe('some content')
        // account comment should already have cid
        expect(rendered2.result.current.cid).toBe('some content cid')
        // account comment should have index
        expect(rendered2.result.current.index).toBe(0)

        // retry with reset store to see if can use account comment from db
        await testUtils.resetStores()

        const rendered3 = renderHook<any, any>((commentCid) => useComment({commentCid}))
        rendered3.rerender('some content cid')
        await waitFor(() => rendered3.result.current.content === 'some content')
        expect(rendered3.result.current.content).toBe('some content')
        // account comment should already have cid
        expect(rendered3.result.current.cid).toBe('some content cid')
        // account comment should have index
        expect(rendered3.result.current.index).toBe(0)

        // restore mock
        Plebbit.prototype.getComment = getComment
      })
    })

    describe(`create vote`, () => {
      beforeAll(async () => {
        await render()
      })
      afterAll(async () => {
        await testUtils.resetDatabasesAndStores()
      })

      const onChallenge = jest.fn()
      const onChallengeVerification = jest.fn()

      test('publish vote', async () => {
        const publishVoteOptions = {
          subplebbitAddress: '12D3KooW...',
          commentCid: 'Qm...',
          vote: 1,
          onChallenge,
          onChallengeVerification,
        }
        await act(async () => {
          await rendered.result.current.publishVote(publishVoteOptions)
        })
      })

      let vote: any

      test('onChallenge gets called', async () => {
        // onChallenge gets call backed once
        await waitFor(() => onChallenge.mock.calls.length === 1)
        expect(onChallenge.mock.calls.length).toBe(1)

        // onChallenge arguments are [challenge, comment]
        const challenge = onChallenge.mock.calls[0][0]
        vote = onChallenge.mock.calls[0][1]
        expect(challenge.type).toBe('CHALLENGE')
        expect(challenge.challenges[0]).toEqual({challenge: '2+2=?', type: 'text'})
        expect(typeof vote.publishChallengeAnswers).toBe('function')
      })

      test('onChallengeVerification gets called', async () => {
        // publish challenge answer and wait for verification
        vote.publishChallengeAnswers(['4'])
        await waitFor(() => onChallengeVerification.mock.calls.length === 1)

        expect(onChallengeVerification.mock.calls.length).toBe(1)
        const challengeVerification = onChallengeVerification.mock.calls[0][0]
        const voteVerified = onChallengeVerification.mock.calls[0][1]
        expect(challengeVerification.type).toBe('CHALLENGEVERIFICATION')
        expect(voteVerified.constructor.name).toBe('Vote')
      })
    })

    describe(`create comment edit`, () => {
      beforeAll(async () => {
        await render()
      })
      afterAll(async () => {
        await testUtils.resetDatabasesAndStores()
      })

      const onChallenge = jest.fn()
      const onChallengeVerification = jest.fn()

      test('publish comment edit', async () => {
        const commentEditOptions = {
          subplebbitAddress: '12D3KooW...',
          commentCid: 'Qm...',
          locked: true,
          onChallenge,
          onChallengeVerification,
        }
        await act(async () => {
          await rendered.result.current.publishCommentEdit(commentEditOptions)
        })
      })

      let commentEdit: any

      test('onChallenge gets called', async () => {
        // onChallenge gets call backed once
        await waitFor(() => onChallenge.mock.calls.length === 1)
        expect(onChallenge.mock.calls.length).toBe(1)

        // onChallenge arguments are [challenge, comment]
        const challenge = onChallenge.mock.calls[0][0]
        commentEdit = onChallenge.mock.calls[0][1]
        expect(challenge.type).toBe('CHALLENGE')
        expect(challenge.challenges[0]).toEqual({challenge: '2+2=?', type: 'text'})
        expect(typeof commentEdit.publishChallengeAnswers).toBe('function')
      })

      test('onChallengeVerification gets called', async () => {
        // publish challenge answer and wait for verification
        commentEdit.publishChallengeAnswers(['4'])
        await waitFor(() => onChallengeVerification.mock.calls.length === 1)

        expect(onChallengeVerification.mock.calls.length).toBe(1)
        const challengeVerification = onChallengeVerification.mock.calls[0][0]
        const commentEditVerified = onChallengeVerification.mock.calls[0][1]
        expect(challengeVerification.type).toBe('CHALLENGEVERIFICATION')
        expect(commentEditVerified.constructor.name).toBe('CommentEdit')
      })

      test('account edits has comment edit', async () => {
        await waitFor(() => rendered.result.current.accountEdits.length === 1)
        expect(rendered.result.current.accountEdits.length).toBe(1)
        expect(rendered.result.current.accountEdits[0].locked).toBe(true)
        expect(typeof rendered.result.current.accountEdits[0].timestamp).toBe('number')

        // reset stores to force using the db
        await testUtils.resetStores()
        const rendered2 = renderHook<any, any>(() => useAccountEdits())
        await waitFor(() => rendered2.result.current.accountEdits.length === 1)
        expect(rendered2.result.current.accountEdits.length).toBe(1)
        expect(rendered2.result.current.accountEdits[0].locked).toBe(true)
        expect(typeof rendered2.result.current.accountEdits[0].timestamp).toBe('number')
      })

      test('useEditedComment has edited comment', async () => {
        const rendered2 = renderHook<any, any>(() => {
          const comment = useComment({commentCid: 'Qm...'})
          const editedComment = useEditedComment({comment})
          return editedComment
        })
        await waitFor(() => rendered2.result.current.editedComment)
        expect(rendered2.result.current.editedComment).not.toBe(undefined)
        expect(rendered2.result.current.pendingEdits.locked || rendered2.result.current.succeededEdits.locked).toBe(true)
        expect(rendered2.result.current.state).toMatch(/pending|succeeded/)
      })
    })

    describe(`create subplebbit edit`, () => {
      beforeAll(async () => {
        await render()
      })
      afterAll(async () => {
        await testUtils.resetDatabasesAndStores()
      })

      const onChallenge = jest.fn()
      const onChallengeVerification = jest.fn()

      test('publish subplebbit edit', async () => {
        const subplebbitAddress = '12D3KooW...'
        const publishSubplebbitEditOptions = {
          title: 'edited title',
          onChallenge,
          onChallengeVerification,
        }
        await act(async () => {
          await rendered.result.current.publishSubplebbitEdit(subplebbitAddress, publishSubplebbitEditOptions)
        })
      })

      let subplebbitEdit: any

      test('onChallenge gets called', async () => {
        // onChallenge gets call backed once
        await waitFor(() => onChallenge.mock.calls.length === 1)
        expect(onChallenge.mock.calls.length).toBe(1)

        // onChallenge arguments are [challenge, comment]
        const challenge = onChallenge.mock.calls[0][0]
        subplebbitEdit = onChallenge.mock.calls[0][1]
        expect(challenge.type).toBe('CHALLENGE')
        expect(challenge.challenges[0]).toEqual({challenge: '2+2=?', type: 'text'})
        expect(typeof subplebbitEdit.publishChallengeAnswers).toBe('function')
      })

      test('onChallengeVerification gets called', async () => {
        // publish challenge answer and wait for verification
        subplebbitEdit.publishChallengeAnswers(['4'])
        await waitFor(() => onChallengeVerification.mock.calls.length === 1)

        expect(onChallengeVerification.mock.calls.length).toBe(1)
        const challengeVerification = onChallengeVerification.mock.calls[0][0]
        const subplebbitEditVerified = onChallengeVerification.mock.calls[0][1]
        expect(challengeVerification.type).toBe('CHALLENGEVERIFICATION')
        expect(subplebbitEditVerified.constructor.name).toBe('SubplebbitEdit')
      })
    })
  })

  describe('multiple comments and votes in database', () => {
    let onChallenge: any
    let onChallengeVerification: any
    let publishOptions: any
    let rendered: any
    let waitFor: any

    beforeEach(async () => {
      onChallenge = jest.fn()
      onChallengeVerification = jest.fn()
      publishOptions = {onChallenge, onChallengeVerification}
      rendered = renderHook<any, any>((props: any) => {
        const useAccountCommentsOptions: UseAccountCommentsOptions = {
          accountName: props?.accountName,
          filter: {
            commentCids: props?.commentCid && [props?.commentCid],
            postCids: props?.postCid && [props?.postCid],
            subplebbitAddresses: props?.subplebbitAddress && [props?.subplebbitAddress],
            parentCids: props?.parentCid && [props?.parentCid],
            hasParentCid: props?.hasParentCid,
          },
        }
        const account = useAccount(props)
        const {accountComments} = useAccountComments(useAccountCommentsOptions)
        const {accountVotes} = useAccountVotes(useAccountCommentsOptions)
        const accountVote = useAccountVote(props)
        return {account, accountComments, accountVotes, accountVote, ...accountsActions}
      })
      waitFor = testUtils.createWaitFor(rendered)

      await waitFor(() => rendered.result.current.account.name)
      expect(rendered.result.current.account.name).toBe('Account 1')
      expect(typeof rendered.result.current.publishComment).toBe('function')
      expect(typeof rendered.result.current.publishVote).toBe('function')

      await act(async () => {
        await rendered.result.current.publishComment({
          ...publishOptions,
          title: 'title 1',
          content: 'content 1',
          parentCid: 'parent comment cid 1',
          postCid: 'post cid 1',
          subplebbitAddress: 'subplebbit address 1',
        })
        await rendered.result.current.publishComment({
          ...publishOptions,
          title: 'title 2',
          content: 'content 2',
          subplebbitAddress: 'subplebbit address 1',
        })
        await rendered.result.current.publishComment({
          ...publishOptions,
          title: 'title 3',
          content: 'content 3',
          subplebbitAddress: 'subplebbit address 2',
        })
        await rendered.result.current.publishVote({
          ...publishOptions,
          vote: 1,
          commentCid: 'comment cid 1',
          subplebbitAddress: 'subplebbit address 1',
        })
        await rendered.result.current.publishVote({
          ...publishOptions,
          vote: 1,
          commentCid: 'comment cid 2',
          subplebbitAddress: 'subplebbit address 1',
        })
        await rendered.result.current.publishVote({
          ...publishOptions,
          vote: 1,
          commentCid: 'comment cid 3',
          subplebbitAddress: 'subplebbit address 2',
        })
      })
    })

    afterEach(async () => {
      await testUtils.resetDatabasesAndStores()
    })

    const expectAccountCommentsToHaveIndexAndAccountId = (accountComments: any[], accountId?: string) => {
      for (const [i, accountComment] of accountComments.entries()) {
        expect(accountComment.index).toBe(i)
        if (accountId) {
          expect(accountComment.accountId).toBe(accountId)
        } else {
          expect(typeof accountComment.accountId).toBe('string')
        }
      }
    }

    test(`useAccountComment single comment`, async () => {
      const rendered2 = renderHook<any, any>((props) => useAccountComment(props))
      rendered2.rerender({commentIndex: 0})
      await waitFor(() => rendered2.result.current.content === 'content 1')
      expect(rendered2.result.current.content).toBe('content 1')
      expect(rendered2.result.current.index).toBe(0)

      rendered2.rerender({commentIndex: 10})
      await waitFor(() => rendered2.result.current.content === undefined)
      expect(rendered2.result.current.content).toBe(undefined)
      expect(rendered2.result.current.index).toBe(undefined)

      rendered2.rerender({commentIndex: 2})
      await waitFor(() => rendered2.result.current.content === 'content 3')
      expect(rendered2.result.current.content).toBe('content 3')
      expect(rendered2.result.current.index).toBe(2)

      rendered2.rerender({})
      await waitFor(() => rendered2.result.current.content === undefined)
      expect(rendered2.result.current.content).toBe(undefined)
      expect(rendered2.result.current.index).toBe(undefined)
    })

    test(`get all account comments`, async () => {
      expect(rendered.result.current.accountComments.length).toBe(3)
      expect(rendered.result.current.accountComments[0].content).toBe('content 1')
      expect(rendered.result.current.accountComments[1].content).toBe('content 2')
      expect(rendered.result.current.accountComments[2].content).toBe('content 3')
      expectAccountCommentsToHaveIndexAndAccountId(rendered.result.current.accountComments, rendered.result.current.account.id)
    })

    test(`account comments have states`, async () => {
      expect(rendered.result.current.accountComments.length).toBe(3)
      expect(rendered.result.current.accountComments[0].state).toBe('pending')
      expect(rendered.result.current.accountComments[1].state).toBe('pending')
      expect(rendered.result.current.accountComments[2].state).toBe('pending')
    })

    test(`account comments have publishing states`, async () => {
      expect(rendered.result.current.accountComments.length).toBe(3)
      // state is 'waiting-challenge-answers' because the test setup doesn't call publishChallengeAnswers
      await waitFor(() => rendered.result.current.accountComments[0].publishingState === 'waiting-challenge-answers')
      expect(rendered.result.current.accountComments[0].publishingState).toBe('waiting-challenge-answers')
      await waitFor(() => rendered.result.current.accountComments[1].publishingState === 'waiting-challenge-answers')
      expect(rendered.result.current.accountComments[1].publishingState).toBe('waiting-challenge-answers')
      await waitFor(() => rendered.result.current.accountComments[2].publishingState === 'waiting-challenge-answers')
      expect(rendered.result.current.accountComments[2].publishingState).toBe('waiting-challenge-answers')
    })

    test(`get account comment and add cid to it when receive challengeVerification`, async () => {
      expect(rendered.result.current.accountComments.length).toBe(3)
      expect(rendered.result.current.accountComments[0].content).toBe('content 1')
      expect(rendered.result.current.accountComments[1].content).toBe('content 2')
      expect(rendered.result.current.accountComments[2].content).toBe('content 3')

      // wait for all on challenge to be called
      await waitFor(() => onChallenge.mock.calls.length === 6)

      // publish challenge answers for comment 1 and 2
      onChallenge.mock.calls[0][1].publishChallengeAnswers(['4'])
      onChallenge.mock.calls[1][1].publishChallengeAnswers(['4'])

      // wait for all on challengeverification to be called
      await waitFor(() => onChallengeVerification.mock.calls.length === 2)

      expect(rendered.result.current.accountComments.length).toBe(3)
      expect(rendered.result.current.accountComments[0].content).toBe('content 1')
      expect(rendered.result.current.accountComments[1].content).toBe('content 2')
      expect(rendered.result.current.accountComments[2].content).toBe('content 3')
      expect(rendered.result.current.accountComments[0].cid).toBe('content 1 cid')
      expect(rendered.result.current.accountComments[1].cid).toBe('content 2 cid')
      expect(rendered.result.current.accountComments[2].cid).toBe(undefined)
      expect(rendered.result.current.accountComments[0].state).toBe('succeeded')
      expect(rendered.result.current.accountComments[1].state).toBe('succeeded')
      expect(rendered.result.current.accountComments[2].state).toBe('pending')
      expectAccountCommentsToHaveIndexAndAccountId(rendered.result.current.accountComments, rendered.result.current.account.id)

      // check if cids are in database after getting a new store
      const activeAccountId = rendered.result.current.account.id
      // reset stores to force using the db
      await testUtils.resetStores()
      const rendered2 = renderHook<any, any>(() => useAccountComments())
      const waitFor2 = testUtils.createWaitFor(rendered2)
      await waitFor2(() => rendered2.result.current.accountComments.length)

      expect(rendered2.result.current.accountComments.length).toBe(3)
      expect(rendered2.result.current.accountComments[0].content).toBe('content 1')
      expect(rendered2.result.current.accountComments[1].content).toBe('content 2')
      expect(rendered2.result.current.accountComments[2].content).toBe('content 3')
      expect(rendered2.result.current.accountComments[0].cid).toBe('content 1 cid')
      expect(rendered2.result.current.accountComments[1].cid).toBe('content 2 cid')
      expect(rendered2.result.current.accountComments[2].cid).toBe(undefined)
      expectAccountCommentsToHaveIndexAndAccountId(rendered2.result.current.accountComments, activeAccountId)
    })

    describe('retry on fail', () => {
      beforeAll(() => {
        // this test seems to depend on a race condition and must be retried
        // most likely not a bug with the hook
        jest.retryTimes(10)
        testUtils.silenceWaitForWarning = true
      })
      afterAll(() => {
        jest.retryTimes(0)
        testUtils.silenceWaitForWarning = false
      })
      test(`cid gets added to account comment after fetched in useComment`, async () => {
        const rendered = renderHook<any, any>((commentCid) => {
          const {accountComments} = useAccountComments()
          const comment = useComment({commentCid})
          return accountComments
        })
        await waitFor(() => rendered.result.current[0].content)

        expect(rendered.result.current[0].content).toBe('content 1')
        expect(rendered.result.current[1].content).toBe('content 2')
        expect(rendered.result.current[0].cid).toBe(undefined)
        expect(rendered.result.current[1].cid).toBe(undefined)
        expectAccountCommentsToHaveIndexAndAccountId(rendered.result.current)

        // mock the comment to get from plebbit.getComment()
        // to simulate getting a comment that the account published
        const commentToGet = Plebbit.prototype.commentToGet
        Plebbit.prototype.commentToGet = () => ({
          author: rendered.result.current[0].author,
          timestamp: rendered.result.current[0].timestamp,
          content: rendered.result.current[0].content,
        })

        rendered.rerender('content 1 cid')
        await waitFor(() => !!rendered.result.current[0].cid)

        expect(rendered.result.current[0].content).toBe('content 1')
        expect(rendered.result.current[1].content).toBe('content 2')
        expect(rendered.result.current[0].cid).toBe('content 1 cid')
        expect(rendered.result.current[1].cid).toBe(undefined)
        expectAccountCommentsToHaveIndexAndAccountId(rendered.result.current)

        // make sure the account comment starts updating by checking if it received upvotes
        await waitFor(() => typeof rendered.result.current[0].upvoteCount === 'number')
        expect(rendered.result.current[0].upvoteCount).toBe(3)

        // mock the second comment to get from plebbit.getComment()
        Plebbit.prototype.commentToGet = () => ({
          author: rendered.result.current[1].author,
          timestamp: rendered.result.current[1].timestamp,
          content: rendered.result.current[1].content,
        })

        rendered.rerender('content 2 cid')
        await waitFor(() => !!rendered.result.current[1].cid)

        expect(rendered.result.current[0].content).toBe('content 1')
        expect(rendered.result.current[1].content).toBe('content 2')
        expect(rendered.result.current[0].cid).toBe('content 1 cid')
        expect(rendered.result.current[1].cid).toBe('content 2 cid')
        expectAccountCommentsToHaveIndexAndAccountId(rendered.result.current)

        // restore mock
        Plebbit.prototype.commentToGet = commentToGet

        // reset stores to force using the db
        await testUtils.resetStores()

        // check if cids are still in database after new store
        const rendered2 = renderHook<any, any>(() => useAccountComments())
        const waitFor2 = testUtils.createWaitFor(rendered2)
        await waitFor2(() => rendered2.result.current[0].cid)

        expect(rendered2.result.current.accountComments[0].cid).toBe('content 1 cid')
        expect(rendered2.result.current.accountComments[1].cid).toBe('content 2 cid')
        expect(rendered2.result.current.accountComments[2].cid).toBe(undefined)
        expectAccountCommentsToHaveIndexAndAccountId(rendered2.result.current.accountComments)
      })
    })

    test(`cid gets added to account comment after feed is fetched`, async () => {
      const getPage = Pages.prototype.getPage

      const rendered = renderHook<any, any>((props?) => {
        const {feed} = useFeed({subplebbitAddresses: props?.subplebbitAddresses, sortType: 'new'})
        const {accountComments} = useAccountComments()
        return {accountComments, feed}
      })
      const waitFor = testUtils.createWaitFor(rendered)

      // wait for account comments to render
      await waitFor(() => rendered.result.current.accountComments?.length > 0)

      // get feed page with our timestamp and author address in it
      const accountCommentTimestamp = rendered.result.current.accountComments[0].timestamp
      const accountCommentAuthor = rendered.result.current.accountComments[0].author
      const accountCommentSubplebbitAddress = rendered.result.current.accountComments[0].subplebbitAddress
      Pages.prototype.getPage = async () => ({
        comments: [
          {
            cid: 'cid from feed',
            timestamp: accountCommentTimestamp,
            author: accountCommentAuthor,
            subplebbitAddress: accountCommentSubplebbitAddress,
          },
        ],
        nextCid: undefined,
      })
      rendered.rerender({subplebbitAddresses: [accountCommentSubplebbitAddress]})

      // wait for feed to load
      await waitFor(() => rendered.result.current.feed?.length > 0)

      // wait for cid from feed to have been added to account comments
      await waitFor(() => rendered.result.current.accountComments[0].cid === 'cid from feed')
      expect(rendered.result.current.accountComments[0].cid).toBe('cid from feed')

      // restore mock
      Pages.prototype.getPage = getPage
    })

    test(`account comments are stored to database`, async () => {
      // reset stores to force using the db
      await testUtils.resetStores()

      // render with new store to see if still in database
      const rendered2 = renderHook<any, any>(() => useAccountComments())
      const waitFor2 = testUtils.createWaitFor(rendered2)
      await waitFor2(() => rendered2.result.current.accountComments.length)

      expect(rendered2.result.current.accountComments.length).toBe(3)
      expect(rendered2.result.current.accountComments[0].content).toBe('content 1')
      expect(rendered2.result.current.accountComments[1].content).toBe('content 2')
      expect(rendered2.result.current.accountComments[2].content).toBe('content 3')
      expectAccountCommentsToHaveIndexAndAccountId(rendered2.result.current.accountComments)
    })

    test(`account has no karma before comments are published`, async () => {
      expect(rendered.result.current.account.karma.score).toBe(0)
      expect(rendered.result.current.account.karma.upvoteCount).toBe(0)
      expect(rendered.result.current.account.karma.downvoteCount).toBe(0)
      expect(rendered.result.current.account.karma.replyScore).toBe(0)
      expect(rendered.result.current.account.karma.replyUpvoteCount).toBe(0)
      expect(rendered.result.current.account.karma.replyDownvoteCount).toBe(0)
      expect(rendered.result.current.account.karma.postScore).toBe(0)
      expect(rendered.result.current.account.karma.postUpvoteCount).toBe(0)
      expect(rendered.result.current.account.karma.postDownvoteCount).toBe(0)
    })

    test(`account has karma after comments are published`, async () => {
      await waitFor(() => Boolean(onChallenge.mock.calls[0] && onChallenge.mock.calls[1] && onChallenge.mock.calls[2]))

      // answer challenges to get the comments published
      onChallenge.mock.calls[0][1].publishChallengeAnswers(['4'])
      onChallenge.mock.calls[1][1].publishChallengeAnswers(['4'])
      onChallenge.mock.calls[2][1].publishChallengeAnswers(['4'])

      await waitFor(() => rendered.result.current.account.karma.upvoteCount >= 9)
      expect(rendered.result.current.account.karma.score).toBe(6)
      expect(rendered.result.current.account.karma.upvoteCount).toBe(9)
      expect(rendered.result.current.account.karma.downvoteCount).toBe(3)
      expect(rendered.result.current.account.karma.replyScore).toBe(2)
      expect(rendered.result.current.account.karma.replyUpvoteCount).toBe(3)
      expect(rendered.result.current.account.karma.replyDownvoteCount).toBe(1)
      expect(rendered.result.current.account.karma.postScore).toBe(4)
      expect(rendered.result.current.account.karma.postUpvoteCount).toBe(6)
      expect(rendered.result.current.account.karma.postDownvoteCount).toBe(2)

      // reset stores to force using the db
      await testUtils.resetStores()

      // get the karma from database by creating new store
      const rendered2 = renderHook<any, any>(() => {
        const account = useAccount()
        const {accountComments} = useAccountComments()
        return {account, accountComments}
      })
      const waitFor2 = testUtils.createWaitFor(rendered2)

      await waitFor2(() => rendered2.result.current.account.karma.upvoteCount === 9 && rendered2.result.current.account.karma.score === 6)
      expect(rendered2.result.current.account.karma.score).toBe(6)
      expect(rendered2.result.current.account.karma.upvoteCount).toBe(9)
      expect(rendered2.result.current.account.karma.downvoteCount).toBe(3)
      expect(rendered2.result.current.account.karma.replyScore).toBe(2)
      expect(rendered2.result.current.account.karma.replyUpvoteCount).toBe(3)
      expect(rendered2.result.current.account.karma.replyDownvoteCount).toBe(1)
      expect(rendered2.result.current.account.karma.postScore).toBe(4)
      expect(rendered2.result.current.account.karma.postUpvoteCount).toBe(6)
      expect(rendered2.result.current.account.karma.postDownvoteCount).toBe(2)
    })

    test(`get all account votes`, async () => {
      expect(rendered.result.current.accountVotes.length).toBe(3)
      expect(rendered.result.current.accountVotes[0].commentCid).toBe('comment cid 1')
      expect(rendered.result.current.accountVotes[1].commentCid).toBe('comment cid 2')
      expect(rendered.result.current.accountVotes[2].commentCid).toBe('comment cid 3')
    })

    test(`account votes are stored to database`, async () => {
      // reset stores to force using the db
      await testUtils.resetStores()

      // render with new store to see if still in database
      const rendered2 = renderHook<any, any>(() => useAccountVotes())
      const waitFor2 = testUtils.createWaitFor(rendered2)

      await waitFor2(() => rendered2.result.current.accountVotes.length)
      expect(rendered2.result.current.accountVotes.length).toBe(3)
      expect(rendered2.result.current.accountVotes[0].commentCid).toBe('comment cid 1')
      expect(rendered2.result.current.accountVotes[1].commentCid).toBe('comment cid 2')
      expect(rendered2.result.current.accountVotes[2].commentCid).toBe('comment cid 3')
    })

    test(`get all comments and votes from different account name`, async () => {
      await act(async () => {
        await rendered.result.current.createAccount()
        await rendered.result.current.setActiveAccount('Account 2')
        await rendered.result.current.publishComment({
          ...publishOptions,
          title: 'account 2 title 1',
          content: 'account 2 content 1',
          subplebbitAddress: 'account 2 subplebbit address 1',
        })
        await rendered.result.current.publishVote({
          ...publishOptions,
          vote: 1,
          commentCid: 'account 2 comment cid 1',
          subplebbitAddress: 'account 2 subplebbit address 1',
        })
      })
      expect(rendered.result.current.accountComments.length).toBe(1)
      expect(rendered.result.current.accountVotes.length).toBe(1)
      expect(rendered.result.current.accountComments[0].content).toBe('account 2 content 1')
      expect(rendered.result.current.accountVotes[0].commentCid).toBe('account 2 comment cid 1')

      await act(async () => {
        await rendered.result.current.setActiveAccount('Account 1')
      })
      // no comments were added to 'Account 1'
      expect(rendered.result.current.accountComments.length).toBe(3)
      expect(rendered.result.current.accountVotes.length).toBe(3)

      // reset stores to force using the db
      await testUtils.resetStores()

      // render with new store to see if still in database
      const rendered2 = renderHook<any, any>(() => {
        const {accountComments} = useAccountComments({accountName: 'Account 2'})
        const {accountVotes} = useAccountVotes({accountName: 'Account 2'})
        return {accountComments, accountVotes}
      })
      const waitFor2 = testUtils.createWaitFor(rendered2)

      await waitFor2(() => rendered2.result.current.accountComments.length)
      expect(rendered2.result.current.accountComments.length).toBe(1)
      expect(rendered2.result.current.accountVotes.length).toBe(1)
      expect(rendered2.result.current.accountComments[0].content).toBe('account 2 content 1')
      expect(rendered2.result.current.accountVotes[0].commentCid).toBe('account 2 comment cid 1')
    })

    test(`get account comments in a post`, () => {
      rendered.rerender({postCid: 'post cid 1'})
      expect(rendered.result.current.accountComments.length).toBe(1)
      expect(rendered.result.current.accountVotes.length).toBe(0)
      expect(rendered.result.current.accountComments[0].postCid).toBe('post cid 1')
    })

    test(`get account replies to a comment`, () => {
      rendered.rerender({parentCid: 'parent comment cid 1'})
      expect(rendered.result.current.accountComments.length).toBe(1)
      expect(rendered.result.current.accountVotes.length).toBe(0)
      expect(rendered.result.current.accountComments[0].parentCid).toBe('parent comment cid 1')
    })

    test(`get account posts in a subplebbit`, () => {
      rendered.rerender({subplebbitAddress: 'subplebbit address 1', hasParentCid: false})
      expect(rendered.result.current.accountComments.length).toBe(1)
      expect(rendered.result.current.accountVotes.length).toBe(2)
      expect(rendered.result.current.accountComments[0].parentCid).toBe(undefined)
    })

    test(`get account posts and comments in a subplebbit`, () => {
      rendered.rerender({subplebbitAddress: 'subplebbit address 1'})
      expect(rendered.result.current.accountComments.length).toBe(2)
      expect(rendered.result.current.accountVotes.length).toBe(2)
      expect(rendered.result.current.accountComments[0].parentCid).toBe('parent comment cid 1')
      expect(rendered.result.current.accountComments[1].parentCid).toBe(undefined)
    })

    test(`get all account posts`, () => {
      rendered.rerender({hasParentCid: false})
      expect(rendered.result.current.accountComments.length).toBe(2)
      expect(rendered.result.current.accountVotes.length).toBe(3)
      expect(rendered.result.current.accountComments[0].parentCid).toBe(undefined)
      expect(rendered.result.current.accountComments[1].parentCid).toBe(undefined)
    })

    test(`get account vote on a specific comment`, () => {
      rendered.rerender({commentCid: 'comment cid 3'})
      expect(rendered.result.current.accountComments.length).toBe(0)
      expect(rendered.result.current.accountVotes.length).toBe(1)
      expect(rendered.result.current.accountVotes[0].commentCid).toBe('comment cid 3')
      expect(typeof rendered.result.current.accountVotes[0].timestamp).toBe('number')

      // useAccountVote
      expect(rendered.result.current.accountVote.commentCid).toBe('comment cid 3')
      expect(rendered.result.current.accountVote.vote).toBe(1)
      expect(typeof rendered.result.current.accountVote.timestamp).toBe('number')
    })
  })

  describe('one comment in database', () => {
    let rendered: any, waitFor: any
    const updatingComments: any = []
    const commentUpdate = Comment.prototype.update

    beforeEach(async () => {
      // mock the comment update to get able to access the comment from test
      Comment.prototype.update = function () {
        updatingComments.push(this)
        return commentUpdate.bind(this)()
      }

      rendered = renderHook<any, any>((props?: any) => {
        const account = useAccount(props)
        const accounts = useAccounts()
        const {notifications, markAsRead} = useNotifications(props)
        const {publishComment} = accountsActions
        return {account, accounts, notifications, markAsRead, publishComment}
      })
      waitFor = testUtils.createWaitFor(rendered)

      await waitFor(() => rendered.result.current.account?.name)
      expect(rendered.result.current.account?.name).toBe('Account 1')
      expect(rendered.result.current.notifications).toEqual([])
      expect(typeof rendered.result.current.markAsRead).toBe('function')
      expect(typeof rendered.result.current.publishComment).toBe('function')

      await act(async () => {
        await rendered.result.current.publishComment({
          title: 'title 1',
          content: 'content 1',
          parentCid: 'parent comment cid 1',
          postCid: 'post cid 1',
          subplebbitAddress: 'subplebbit address 1',
          // @ts-ignore
          onChallenge: (challenge, comment) => comment.publishChallengeAnswers(),
          onChallengeVerification: () => {},
        })
      })
    })

    afterEach(async () => {
      Comment.prototype.update = commentUpdate
      await testUtils.resetDatabasesAndStores()
    })

    test('get notifications', async () => {
      await waitFor(() => updatingComments.length > 0)
      // we should have published 1 comment and it should be updating at this point
      expect(updatingComments.length).toBe(1)
      const comment = updatingComments[0]
      expect(rendered.result.current.notifications).toEqual([])
      expect(rendered.result.current.account.unreadNotificationCount).toBe(0)
      expect(rendered.result.current.accounts.accounts[0].unreadNotificationCount).toBe(0)

      act(() => {
        // update the comment with replies to see get notifications
        comment.replies = {
          pages: {
            topAll: {
              nextCid: undefined,
              comments: [
                {cid: 'reply cid 1', timestamp: 1},
                {cid: 'reply cid 2', timestamp: 2},
                {cid: 'reply cid 3', timestamp: 3},
              ],
            },
          },
        }
        comment.emit('update', comment)
      })

      // wait for notifications, should be sorted by highest/newest timestamp
      await waitFor(() => rendered.result.current.notifications.length > 0)

      expect(rendered.result.current.notifications.length).toBe(3)
      expect(rendered.result.current.notifications[0].cid).toBe('reply cid 3')
      expect(rendered.result.current.notifications[1].cid).toBe('reply cid 2')
      expect(rendered.result.current.notifications[2].cid).toBe('reply cid 1')
      expect(rendered.result.current.notifications[0].markedAsRead).toBe(false)
      expect(rendered.result.current.notifications[1].markedAsRead).toBe(false)
      expect(rendered.result.current.notifications[2].markedAsRead).toBe(false)
      expect(rendered.result.current.account.unreadNotificationCount).toBe(3)
      expect(rendered.result.current.accounts.accounts[0].unreadNotificationCount).toBe(3)

      await act(async () => {
        // mark the notifications as read
        await rendered.result.current.markAsRead()
      })

      // should be marked as read
      await waitFor(() => rendered.result.current.notifications[0].markedAsRead === true)

      expect(rendered.result.current.notifications.length).toBe(3)
      expect(rendered.result.current.notifications[0].cid).toBe('reply cid 3')
      expect(rendered.result.current.notifications[1].cid).toBe('reply cid 2')
      expect(rendered.result.current.notifications[2].cid).toBe('reply cid 1')
      expect(rendered.result.current.notifications[0].markedAsRead).toBe(true)
      expect(rendered.result.current.notifications[1].markedAsRead).toBe(true)
      expect(rendered.result.current.notifications[2].markedAsRead).toBe(true)
      expect(rendered.result.current.account.unreadNotificationCount).toBe(0)
      expect(rendered.result.current.accounts.accounts[0].unreadNotificationCount).toBe(0)

      act(() => {
        // update the comment with one unread reply and one read reply
        comment.replies = {
          pages: {
            topAll: {
              nextCid: undefined,
              comments: [
                {cid: 'reply cid 3', timestamp: 3, subplebbitAddress: 'blocked subplebbit address', postCid: 'blocked post cid'},
                {cid: 'reply cid 4', timestamp: 4, author: {address: 'blocked author address'}, parentCid: 'blocked parent cid'},
              ],
            },
          },
        }
        comment.emit('update', comment)
      })

      // comment 3 should be marked as read, comment 4 should not
      await waitFor(() => rendered.result.current.notifications.length >= 4)

      expect(rendered.result.current.notifications.length).toBe(4)
      expect(rendered.result.current.notifications[0].cid).toBe('reply cid 4')
      expect(rendered.result.current.notifications[1].cid).toBe('reply cid 3')
      expect(rendered.result.current.notifications[2].cid).toBe('reply cid 2')
      expect(rendered.result.current.notifications[3].cid).toBe('reply cid 1')
      expect(rendered.result.current.notifications[0].markedAsRead).toBe(false)
      expect(rendered.result.current.notifications[1].markedAsRead).toBe(true)
      expect(rendered.result.current.notifications[2].markedAsRead).toBe(true)
      expect(rendered.result.current.notifications[3].markedAsRead).toBe(true)
      expect(rendered.result.current.account.unreadNotificationCount).toBe(1)
      expect(rendered.result.current.accounts.accounts[0].unreadNotificationCount).toBe(1)

      // block addresses
      await act(async () => {
        await accountsActions.blockAddress('blocked subplebbit address')
        await accountsActions.blockAddress('blocked author address')
      })
      await waitFor(() => rendered.result.current.notifications.length === 2)
      expect(rendered.result.current.notifications.length).toBe(2)
      expect(rendered.result.current.notifications[0].cid).toBe('reply cid 2')
      expect(rendered.result.current.notifications[1].cid).toBe('reply cid 1')
      expect(rendered.result.current.accounts.accounts[0].unreadNotificationCount).toBe(0)

      // unblock addresses
      await act(async () => {
        await accountsActions.unblockAddress('blocked subplebbit address')
        await accountsActions.unblockAddress('blocked author address')
      })
      await waitFor(() => rendered.result.current.notifications.length === 4)
      expect(rendered.result.current.notifications.length).toBe(4)
      expect(rendered.result.current.notifications[0].cid).toBe('reply cid 4')
      expect(rendered.result.current.notifications[1].cid).toBe('reply cid 3')
      expect(rendered.result.current.notifications[2].cid).toBe('reply cid 2')
      expect(rendered.result.current.notifications[3].cid).toBe('reply cid 1')
      expect(rendered.result.current.accounts.accounts[0].unreadNotificationCount).toBe(1)

      // block cids
      await act(async () => {
        await accountsActions.blockCid('blocked parent cid')
        await accountsActions.blockCid('blocked post cid')
        await accountsActions.blockCid('reply cid 2')
      })
      await waitFor(() => rendered.result.current.notifications.length === 1)
      expect(rendered.result.current.notifications.length).toBe(1)
      expect(rendered.result.current.notifications[0].cid).toBe('reply cid 1')
      expect(rendered.result.current.accounts.accounts[0].unreadNotificationCount).toBe(0)

      // unblock cids
      await act(async () => {
        await accountsActions.unblockCid('blocked parent cid')
        await accountsActions.unblockCid('blocked post cid')
        await accountsActions.unblockCid('reply cid 2')
      })
      await waitFor(() => rendered.result.current.notifications.length === 4)
      expect(rendered.result.current.notifications.length).toBe(4)
      expect(rendered.result.current.notifications[0].cid).toBe('reply cid 4')
      expect(rendered.result.current.notifications[1].cid).toBe('reply cid 3')
      expect(rendered.result.current.notifications[2].cid).toBe('reply cid 2')
      expect(rendered.result.current.notifications[3].cid).toBe('reply cid 1')
      expect(rendered.result.current.accounts.accounts[0].unreadNotificationCount).toBe(1)

      // reset stores to force using the db
      await testUtils.resetStores()

      // check to see if in database after refreshing with a new store
      const rendered2 = renderHook<any, any>(() => useNotifications())
      const waitFor2 = testUtils.createWaitFor(rendered2)
      await waitFor2(() => rendered2.result.current.notifications.length >= 4)

      expect(rendered2.result.current.notifications.length).toBe(4)
      expect(rendered2.result.current.notifications[0].cid).toBe('reply cid 4')
      expect(rendered2.result.current.notifications[1].cid).toBe('reply cid 3')
      expect(rendered2.result.current.notifications[2].cid).toBe('reply cid 2')
      expect(rendered2.result.current.notifications[3].cid).toBe('reply cid 1')
      expect(rendered2.result.current.notifications[0].markedAsRead).toBe(false)
      expect(rendered2.result.current.notifications[1].markedAsRead).toBe(true)
      expect(rendered2.result.current.notifications[2].markedAsRead).toBe(true)
      expect(rendered2.result.current.notifications[3].markedAsRead).toBe(true)
    })
  })

  describe('useAccountSubplebbits', () => {
    describe('with setup', () => {
      beforeAll(() => {
        // roles tests depend on race conditions as part of the test
        // so not possible to make them deterministic, add a retry
        // the hooks don't have the race condition, only the tests do
        jest.retryTimes(20)
        testUtils.silenceWaitForWarning = true
      })
      afterAll(() => {
        jest.retryTimes(0)
        testUtils.silenceWaitForWarning = false
      })
      afterEach(async () => {
        await testUtils.resetDatabasesAndStores()
      })

      let rendered: any
      let waitFor: Function

      beforeEach(async () => {
        rendered = renderHook<any, any>(() => {
          const {accountSubplebbits} = useAccountSubplebbits()
          const account = useAccount()
          const {setAccount} = accountsActions
          return {accountSubplebbits, setAccount, account}
        })
        waitFor = testUtils.createWaitFor(rendered)

        await waitFor(() => rendered.result.current.account.name)
        const {account, setAccount} = rendered.result.current
        const role = {role: 'moderator'}
        const subplebbits = {'subplebbit address 1': {role}}
        await act(async () => {
          await setAccount({...account, subplebbits})
        })
      })

      test('returns owner subplebbits', async () => {
        await waitFor(() => rendered.result.current.accountSubplebbits['list subplebbit address 1'])
        expect(rendered.result.current.accountSubplebbits['list subplebbit address 1'].role.role).toBe('owner')
        expect(rendered.result.current.accountSubplebbits['list subplebbit address 2'].role.role).toBe('owner')
      })

      test('not yet fetched accounts subplebbits have address', async () => {
        await waitFor(() => rendered.result.current.accountSubplebbits['list subplebbit address 1'])
        expect(rendered.result.current.accountSubplebbits['list subplebbit address 1'].address).toBe('list subplebbit address 1')
        expect(rendered.result.current.accountSubplebbits['list subplebbit address 2'].address).toBe('list subplebbit address 2')
      })

      test('returns moderator subplebbits after setting them', async () => {
        await waitFor(() => rendered.result.current.accountSubplebbits['subplebbit address 1'].role.role === 'moderator')
        expect(rendered.result.current.accountSubplebbits['subplebbit address 1'].role.role).toBe('moderator')
        await waitFor(() => rendered.result.current.accountSubplebbits['list subplebbit address 1'])
        expect(rendered.result.current.accountSubplebbits['list subplebbit address 1'].role.role).toBe('owner')
        expect(rendered.result.current.accountSubplebbits['list subplebbit address 2'].role.role).toBe('owner')
      })

      test('remove subplebbit role to account.subplebbits[subplebbitAddress].role after encountering it removed a subplebbit', async () => {
        await waitFor(() => rendered.result.current.accountSubplebbits['subplebbit address 1'])
        expect(rendered.result.current.accountSubplebbits['subplebbit address 1'].role.role).toBe('moderator')
        // subplebbit address 1 doesn't have account.author.address as role, so it gets removed from accountSubplebbits
        // after a render
        await waitFor(() => !rendered.result.current.accountSubplebbits['subplebbit address 1'])
        expect(rendered.result.current.accountSubplebbits['subplebbit address 1']).toBe(undefined)
      })
    })

    test('add subplebbit role to account.subplebbits[subplebbitAddress].role after encountering it in a subplebbit', async () => {
      // don't use the same setup or test doesnt work

      // mock the roles on a new subplebbit
      const moderatorAuthorAddress = 'author address'
      const moderatingSubplebbitAddress = 'moderating subplebbit address'
      const rolesToGet = Subplebbit.prototype.rolesToGet
      Subplebbit.prototype.rolesToGet = () => ({
        [moderatorAuthorAddress]: {role: 'moderator'},
      })

      const rendered = renderHook<any, any>((subplebbitAddress) => {
        const {accountSubplebbits} = useAccountSubplebbits()
        const account = useAccount()
        const {setAccount} = accountsActions
        const subplebbit = useSubplebbit({subplebbitAddress})
        return {accountSubplebbits, setAccount, account}
      })
      const waitFor = testUtils.createWaitFor(rendered)
      await waitFor(() => rendered.result.current.account)

      // change author address
      await act(async () => {
        await rendered.result.current.setAccount({...rendered.result.current.account, author: {address: moderatorAuthorAddress}})
      })
      await waitFor(() => rendered.result.current.account.author.address === moderatorAuthorAddress)
      // account subplebbits are not yet added, will be added after we fetch the sub
      expect(rendered.result.current.accountSubplebbits[moderatingSubplebbitAddress]).toBe(undefined)
      expect(rendered.result.current.account.subplebbits[moderatingSubplebbitAddress]).toBe(undefined)

      // fetch the moderating subplebbit from the moderator account
      rendered.rerender(moderatingSubplebbitAddress)
      await waitFor(() => rendered.result.current.accountSubplebbits[moderatingSubplebbitAddress])
      expect(rendered.result.current.accountSubplebbits[moderatingSubplebbitAddress].role.role).toBe('moderator')
      await waitFor(() => rendered.result.current.account.subplebbits[moderatingSubplebbitAddress])
      expect(rendered.result.current.account.subplebbits[moderatingSubplebbitAddress].role.role).toBe('moderator')

      // unmock the roles
      Subplebbit.prototype.rolesToGet = rolesToGet
    })
  })

  describe('create owner subplebbit', () => {
    let rendered: any
    let waitFor: Function

    beforeEach(async () => {
      rendered = renderHook<any, any>((subplebbitAddress?: string) => {
        const account = useAccount()
        const {accountSubplebbits} = useAccountSubplebbits()
        const subplebbit = useSubplebbit({subplebbitAddress})
        return {account, subplebbit, accountSubplebbits, ...accountsActions}
      })
      waitFor = testUtils.createWaitFor(rendered)
      await waitFor(() => rendered.result.current.account)
    })

    afterEach(() => {
      resetPlebbitJsMock()
    })

    test('create owner subplebbit and edit it', async () => {
      const createdSubplebbitAddress = 'created subplebbit address'
      let subplebbit: any
      await act(async () => {
        subplebbit = await rendered.result.current.createSubplebbit()
      })
      expect(subplebbit?.address).toBe(createdSubplebbitAddress)

      // wait for subplebbit to be added to account subplebbits
      await waitFor(() => rendered.result.current.accountSubplebbits[createdSubplebbitAddress].role.role === 'owner')
      expect(rendered.result.current.accountSubplebbits[createdSubplebbitAddress].role.role).toBe('owner')

      // can useSubplebbit
      rendered.rerender(createdSubplebbitAddress)
      await waitFor(() => rendered.result.current.subplebbit)
      expect(rendered.result.current.subplebbit.address).toBe(createdSubplebbitAddress)
      expect(rendered.result.current.subplebbit.title).toBe(undefined)

      // publishSubplebbitEdit
      const editedTitle = 'edited title'
      const onChallenge = jest.fn()
      const onChallengeVerification = jest.fn()
      await act(async () => {
        await rendered.result.current.publishSubplebbitEdit(createdSubplebbitAddress, {title: editedTitle, onChallenge, onChallengeVerification})
      })

      // onChallengeVerification should be called with success even if the sub is edited locally
      await waitFor(() => onChallengeVerification.mock.calls.length === 1)
      expect(onChallengeVerification).toBeCalledTimes(1)
      expect(onChallengeVerification.mock.calls[0][0].challengeSuccess).toBe(true)

      // useSubplebbit is edited
      await waitFor(() => rendered.result.current.subplebbit.title === editedTitle)
      expect(rendered.result.current.subplebbit.address).toBe(createdSubplebbitAddress)
      expect(rendered.result.current.subplebbit.title).toBe(editedTitle)

      // edit address
      const editedAddress = 'edited.eth'
      await act(async () => {
        await rendered.result.current.publishSubplebbitEdit(createdSubplebbitAddress, {address: editedAddress, title: editedTitle, onChallenge, onChallengeVerification})
      })

      // useSubplebbit(previousAddress) address is edited
      await waitFor(() => rendered.result.current.subplebbit.address === editedAddress)
      expect(rendered.result.current.subplebbit.address).toBe(editedAddress)
      expect(rendered.result.current.subplebbit.title).toBe(editedTitle)

      // useSubplebbit(currentAddress) address is edited
      rendered.rerender(`doesnt exist`)
      await waitFor(() => rendered.result.current.subplebbit.address === undefined)
      expect(rendered.result.current.subplebbit.address).toBe(undefined)
      rendered.rerender(editedAddress)
      await waitFor(() => rendered.result.current.subplebbit.address === editedAddress)
      expect(rendered.result.current.subplebbit.address).toBe(editedAddress)
      expect(rendered.result.current.subplebbit.title).toBe(editedTitle)
    })

    test('create owner subplebbit and delete it', async () => {
      const createdSubplebbitAddress = 'created subplebbit address'
      let subplebbit: any
      await act(async () => {
        subplebbit = await rendered.result.current.createSubplebbit()
      })
      expect(subplebbit?.address).toBe(createdSubplebbitAddress)

      // can useSubplebbit
      rendered.rerender(createdSubplebbitAddress)
      await waitFor(() => rendered.result.current.subplebbit)
      expect(rendered.result.current.subplebbit.address).toBe(createdSubplebbitAddress)
      expect(rendered.result.current.subplebbit.title).toBe(undefined)

      // delete it
      await act(async () => {
        await rendered.result.current.deleteSubplebbit(createdSubplebbitAddress)
      })

      // useSubplebbit is edited
      await waitFor(() => rendered.result.current.subplebbit.address === undefined)
      expect(rendered.result.current.subplebbit.address).toBe(undefined)
    })

    test('create and edit owner subplebbit useSubplebbit persists after reload', async () => {
      const createdSubplebbitAddress = 'created subplebbit address'
      const createdSubplebbitTitle = 'created subplebbit title'
      let subplebbit: any
      await act(async () => {
        subplebbit = await rendered.result.current.createSubplebbit({title: createdSubplebbitTitle})
      })
      expect(subplebbit?.address).toBe(createdSubplebbitAddress)

      // can useSubplebbit
      rendered.rerender(createdSubplebbitAddress)
      await waitFor(() => rendered.result.current.subplebbit)
      expect(rendered.result.current.subplebbit.address).toBe(createdSubplebbitAddress)
      expect(rendered.result.current.subplebbit.title).toBe(createdSubplebbitTitle)

      // render again with new context and store
      await testUtils.resetStores()
      rendered = renderHook<any, any>((subplebbitAddress?: string) => {
        const subplebbit = useSubplebbit({subplebbitAddress})
        return {subplebbit, ...accountsActions}
      })
      expect(rendered.result.current.subplebbit.address).toBe(undefined)

      // can useSubplebbit after reload
      rendered.rerender(createdSubplebbitAddress)
      await waitFor(() => rendered.result.current.subplebbit.address)
      expect(rendered.result.current.subplebbit.address).toBe(createdSubplebbitAddress)
      expect(rendered.result.current.subplebbit.title).toBe(createdSubplebbitTitle)

      // publishSubplebbitEdit
      const editedTitle = 'edited title'
      const onChallenge = jest.fn()
      const onChallengeVerification = jest.fn()
      await act(async () => {
        await rendered.result.current.publishSubplebbitEdit(createdSubplebbitAddress, {title: editedTitle, onChallenge, onChallengeVerification})
      })

      // useSubplebbit is edited
      await waitFor(() => rendered.result.current.subplebbit.title === editedTitle)
      expect(rendered.result.current.subplebbit.address).toBe(createdSubplebbitAddress)
      expect(rendered.result.current.subplebbit.title).toBe(editedTitle)

      // render again with new context and store
      await testUtils.resetStores()
      rendered = renderHook<any, any>((subplebbitAddress?: string) => {
        const subplebbit = useSubplebbit({subplebbitAddress})
        return {subplebbit, ...accountsActions}
      })
      expect(rendered.result.current.subplebbit.address).toBe(undefined)

      // can useSubplebbit after reload
      rendered.rerender(createdSubplebbitAddress)
      await waitFor(() => rendered.result.current.subplebbit.title === editedTitle)
      expect(rendered.result.current.subplebbit.address).toBe(createdSubplebbitAddress)
      expect(rendered.result.current.subplebbit.title).toBe(editedTitle)

      // edit address
      const editedAddress = 'edited.eth'
      await act(async () => {
        await rendered.result.current.publishSubplebbitEdit(createdSubplebbitAddress, {address: editedAddress, title: editedTitle, onChallenge, onChallengeVerification})
      })

      // render again with new context and store
      await testUtils.resetStores()
      rendered = renderHook<any, any>((subplebbitAddress?: string) => {
        const subplebbit = useSubplebbit({subplebbitAddress})
        return {subplebbit, ...accountsActions}
      })
      expect(rendered.result.current.subplebbit.address).toBe(undefined)

      // useSubplebbit(previousAddress) address is edited
      rendered.rerender(createdSubplebbitAddress)
      await waitFor(() => rendered.result.current.subplebbit.address === editedAddress)
      expect(rendered.result.current.subplebbit.address).toBe(editedAddress)
      expect(rendered.result.current.subplebbit.title).toBe(editedTitle)

      // useSubplebbit(currentAddress) address is edited
      rendered.rerender(`doesnt exist`)
      await waitFor(() => rendered.result.current.subplebbit.address === undefined)
      expect(rendered.result.current.subplebbit.address).toBe(undefined)

      rendered.rerender(editedAddress)
      await waitFor(() => rendered.result.current.subplebbit.address === editedAddress)
      expect(rendered.result.current.subplebbit.address).toBe(editedAddress)
      expect(rendered.result.current.subplebbit.title).toBe(editedTitle)
    })
  })

  describe('useEditedComment', () => {
    let rendered: any, waitFor: any
    const publishedComments: any = []

    beforeEach(async () => {
      rendered = renderHook<any, any>((commentCid?: any) => {
        const account = useAccount()
        const {accountComments} = useAccountComments()
        const comment = useComment({commentCid})
        const editedComment = useEditedComment({comment})
        const {accountEdits} = useAccountEdits()
        return {comment, editedComment, accountComments, account, accountEdits}
      })
      waitFor = testUtils.createWaitFor(rendered)

      let challengeVerificationCount = 0
      const getPublishCommentOptions = (number: number) => ({
        title: 'title ' + String(number),
        content: 'content ' + String(number),
        parentCid: 'parent comment cid ' + String(number),
        subplebbitAddress: 'subplebbit address',
        // @ts-ignore
        onChallenge: (challenge, comment) => {
          publishedComments.push(comment)
          comment.publishChallengeAnswers()
        },
        onChallengeVerification: () => challengeVerificationCount++,
      })

      // publish 3 comments in the same sub
      await waitFor(() => rendered.result.current.account)
      await act(async () => {
        let amount = 3,
          number = 0
        while (number++ < amount) {
          await accountsActions.publishComment(getPublishCommentOptions(number))
        }
      })
      await waitFor(() => challengeVerificationCount === 3)
      expect(challengeVerificationCount).toBe(3)
    })

    afterEach(async () => {
      await testUtils.resetDatabasesAndStores()
    })

    test('useComment adds comment to comments store even if the comment is an account comment', async () => {
      const commentCid = rendered.result.current.accountComments[0].cid
      expect(commentCid).not.toBe(undefined)
      // trigger useComment to add comment to store
      rendered.rerender(commentCid)
      // wait for comment to be added to store
      await waitFor(() => commentsStore.getState().comments[commentCid])
      expect(commentsStore.getState().comments[commentCid]).not.toBe(undefined)
      expect(commentsStore.getState().comments[commentCid].cid).toBe(commentCid)

      await waitFor(() => rendered.result.current.comment.index === undefined)
      expect(rendered.result.current.comment?.cid).toBe(commentCid)
      expect(typeof rendered.result.current.comment?.timestamp).toBe('number')
      // comment isn't an account comment (doesn't have comment.index)
      expect(rendered.result.current.comment.index).toBe(undefined)
    })

    test('edited comment succeeded', async () => {
      const commentCid = rendered.result.current.accountComments[0].cid
      expect(commentCid).not.toBe(undefined)
      const subplebbitAddress = rendered.result.current.accountComments[0].subplebbitAddress
      expect(subplebbitAddress).not.toBe(undefined)

      rendered.rerender(commentCid)

      // wait for useComment to load comment from store
      await waitFor(() => rendered.result.current.comment?.cid && rendered.result.current.comment.index === undefined)
      expect(rendered.result.current.comment?.cid).toBe(commentCid)
      // comment isn't an account comment (doesn't have comment.index)
      expect(rendered.result.current.comment.index).toBe(undefined)

      // publish edit options
      let challengeVerificationCount = 0
      const commentEditTimestamp = Math.ceil(Date.now() / 1000)
      const publishCommentEditOptions = {
        timestamp: commentEditTimestamp,
        commentCid,
        subplebbitAddress,
        locked: true,
        onChallenge: (challenge: any, comment: any) => comment.publishChallengeAnswers(),
        onChallengeVerification: () => challengeVerificationCount++,
      }

      // publish edit
      expect(rendered.result.current.editedComment.editedComment).toBe(undefined)
      expect(rendered.result.current.editedComment.state).toBe('unedited')
      await act(async () => {
        await accountsActions.publishCommentEdit(publishCommentEditOptions)
      })

      // edit is pending because the comment from store doesn't yet have locked: true
      await waitFor(() => rendered.result.current.editedComment.editedComment)
      expect(rendered.result.current.comment.locked).toBe(undefined)
      expect(rendered.result.current.editedComment.editedComment).not.toBe(undefined)
      expect(rendered.result.current.editedComment.state).toBe('pending')
      expect(rendered.result.current.editedComment.editedComment.locked).toBe(true)
      expect(rendered.result.current.editedComment.pendingEdits.locked).toBe(true)
      // there are no unecessary keys in editedCommentResult.[state]Edits
      expect(Object.keys(rendered.result.current.editedComment.succeededEdits).length).toBe(0)
      expect(Object.keys(rendered.result.current.editedComment.pendingEdits).length).toBe(1)
      expect(Object.keys(rendered.result.current.editedComment.failedEdits).length).toBe(0)

      // update comment with edited prop in store
      const updatedComment = {...commentsStore.getState().comments[commentCid]}
      updatedComment.locked = true
      updatedComment.updatedAt = commentEditTimestamp + 1
      commentsStore.setState(({comments}) => ({comments: {...comments, [commentCid]: updatedComment}}))

      // wait for comment to become updated and to not be account comment (not have comment.index)
      await waitFor(() => rendered.result.current.comment.locked === true && rendered.result.current.comment.index === undefined)
      expect(rendered.result.current.comment.locked).toBe(true)
      expect(rendered.result.current.comment.index).toBe(undefined)

      // wait for edit to become succeeded
      await waitFor(() => rendered.result.current.editedComment.state === 'succeeded')
      expect(rendered.result.current.editedComment.editedComment).not.toBe(undefined)
      expect(rendered.result.current.editedComment.state).toBe('succeeded')
      expect(rendered.result.current.editedComment.editedComment.locked).toBe(true)
      expect(rendered.result.current.editedComment.succeededEdits.locked).toBe(true)
      // there are no unecessary keys in editedCommentResult.[state]Edits
      expect(Object.keys(rendered.result.current.editedComment.succeededEdits).length).toBe(1)
      expect(Object.keys(rendered.result.current.editedComment.pendingEdits).length).toBe(0)
      expect(Object.keys(rendered.result.current.editedComment.failedEdits).length).toBe(0)
    })

    test('edited comment failed', async () => {
      const commentCid = rendered.result.current.accountComments[0].cid
      expect(commentCid).not.toBe(undefined)
      const subplebbitAddress = rendered.result.current.accountComments[0].subplebbitAddress
      expect(subplebbitAddress).not.toBe(undefined)

      rendered.rerender(commentCid)

      // wait for useComment to load comment from store
      await waitFor(() => rendered.result.current.comment?.cid && rendered.result.current.comment.index === undefined)
      expect(rendered.result.current.comment?.cid).toBe(commentCid)
      // comment isn't an account comment (doesn't have comment.index)
      expect(rendered.result.current.comment.index).toBe(undefined)

      // publish edit options
      let challengeVerificationCount = 0
      const commentEditTimestamp = Math.ceil(Date.now() / 1000) - 60 * 60 // 1 hour ago to make the edit not pending
      const publishCommentEditOptions = {
        timestamp: commentEditTimestamp,
        commentCid,
        subplebbitAddress,
        locked: true,
        onChallenge: (challenge: any, comment: any) => comment.publishChallengeAnswers(),
        onChallengeVerification: () => challengeVerificationCount++,
      }

      // publish edit
      expect(rendered.result.current.editedComment.editedComment).toBe(undefined)
      expect(rendered.result.current.editedComment.state).toBe('unedited')
      await act(async () => {
        await accountsActions.publishCommentEdit(publishCommentEditOptions)
      })

      // edit failed (not pending) because is already 1 hour old
      await waitFor(() => rendered.result.current.editedComment.editedComment)
      expect(rendered.result.current.comment.locked).toBe(undefined)
      // updatedAt is required to evaluate the status of a CommentEdit
      await waitFor(() => rendered.result.current.comment.updatedAt)
      expect(rendered.result.current.comment.updatedAt).toBeGreaterThan(commentEditTimestamp)
      expect(rendered.result.current.editedComment.editedComment).not.toBe(undefined)
      expect(rendered.result.current.editedComment.state).toBe('failed')
      expect(rendered.result.current.editedComment.editedComment.locked).toBe(undefined)
      expect(rendered.result.current.editedComment.failedEdits.locked).toBe(true)
      // there are no unecessary keys in editedCommentResult.[state]Edits
      expect(Object.keys(rendered.result.current.editedComment.succeededEdits).length).toBe(0)
      expect(Object.keys(rendered.result.current.editedComment.pendingEdits).length).toBe(0)
      expect(Object.keys(rendered.result.current.editedComment.failedEdits).length).toBe(1)

      // edit becomes pending if comment.updatedAt is too old
      let updatedComment = {...commentsStore.getState().comments[commentCid]}
      // make updatedAt 1 hour ago but still newer than edit time
      updatedComment.updatedAt = commentEditTimestamp + 1
      commentsStore.setState(({comments}) => ({comments: {...comments, [commentCid]: updatedComment}}))

      // edit is pending because the comment from store updatedAt is too old
      await waitFor(() => rendered.result.current.editedComment?.state === 'pending')
      expect(rendered.result.current.editedComment.editedComment).not.toBe(undefined)
      expect(rendered.result.current.editedComment.state).toBe('pending')
      expect(rendered.result.current.editedComment.editedComment.locked).toBe(true)
      expect(rendered.result.current.editedComment.pendingEdits.locked).toBe(true)
      // there are no unecessary keys in editedCommentResult.[state]Edits
      expect(Object.keys(rendered.result.current.editedComment.succeededEdits).length).toBe(0)
      expect(Object.keys(rendered.result.current.editedComment.pendingEdits).length).toBe(1)
      expect(Object.keys(rendered.result.current.editedComment.failedEdits).length).toBe(0)

      // add locked: true to comment
      updatedComment = {...commentsStore.getState().comments[commentCid]}
      // make updatedAt 1 hour ago but still newer than edit time
      updatedComment.locked = true
      commentsStore.setState(({comments}) => ({comments: {...comments, [commentCid]: updatedComment}}))

      // edit is succeeded even if updatedAt is old because is newer than the edit
      await waitFor(() => rendered.result.current.editedComment?.state === 'succeeded')
      expect(rendered.result.current.editedComment.editedComment).not.toBe(undefined)
      expect(rendered.result.current.editedComment.state).toBe('succeeded')
      expect(rendered.result.current.editedComment.editedComment.locked).toBe(true)
      expect(rendered.result.current.editedComment.succeededEdits.locked).toBe(true)
      // there are no unecessary keys in editedCommentResult.[state]Edits
      expect(Object.keys(rendered.result.current.editedComment.succeededEdits).length).toBe(1)
      expect(Object.keys(rendered.result.current.editedComment.pendingEdits).length).toBe(0)
      expect(Object.keys(rendered.result.current.editedComment.failedEdits).length).toBe(0)
    })
  })
})
