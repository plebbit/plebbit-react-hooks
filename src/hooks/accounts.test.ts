import { act, renderHook } from '@testing-library/react-hooks'
import { useAccount, useAccounts, useAccountsActions, useIsAccountComment, useAccountComments, useAccountVotes, useAccountVote, AccountCommentsOptions } from './accounts'
import AccountsProvider from '../providers/AccountsProvider'
import localForage from 'localforage'
import PlebbitMock from '../plebbit-js/plebbit-js-mock'
import { mockPlebbitJs } from '../plebbit-js'
mockPlebbitJs(PlebbitMock)

const deleteDatabases = () =>
  Promise.all([
    localForage.createInstance({ name: 'accountsMetadata' }).clear(),
    localForage.createInstance({ name: 'accounts' }).clear()
  ])

describe('accounts', () => {
  afterEach(async () => {
    await deleteDatabases()
  })

  describe('no accounts in database', () => {
    test('generate default account on load', async () => {
      // on first render, the account is undefined because it's not yet loaded from database
      const rendered = renderHook(() => useAccount(), { wrapper: AccountsProvider })
      expect(rendered.result.current).toBe(undefined)

      // on second render, you get the default generated account
      await rendered.waitForNextUpdate()
      const account = rendered.result.current
      expect(account.name).toBe('Account 1')
      expect(account.author.displayName).toBe(null)
      expect(typeof account.author.address).toBe('string')
      expect(Array.isArray(account.subscriptions)).toBe(true)
      expect(account.addressesLimits && typeof account.addressesLimits === 'object').toBe(true)
      expect(account.plebbit && typeof account.plebbit === 'object').toBe(true)
      expect(account.plebbitOptions.ipfsGatewayUrl).toBe('https://cloudflare-ipfs')
      expect(account.plebbitOptions.ipfsApiUrl).toBe('http://localhost:8080')
    })

    test.todo('default generated account has all the data defined in schema, like signer, author, plebbitOptions, etc')

    test('create new accounts', async () => {
      const rendered = renderHook<any, any>(
        (accountName) => {
          const account = useAccount(accountName)
          const { createAccount } = useAccountsActions()
          return { account, createAccount }
        },
        { wrapper: AccountsProvider }
      )
      // on first render, the account is undefined because it's not yet loaded from database
      expect(rendered.result.current.account).toBe(undefined)
      expect(rendered.result.current.createAccount).toBe(undefined)

      // on second render, you get the default generated account
      await rendered.waitForNextUpdate()
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

      // render second context with empty state to check if accounts saved to database
      const rendered2 = renderHook<any, any>((accountName) => useAccount(accountName), { wrapper: AccountsProvider })
      // accounts not yet loaded from database
      expect(rendered2.result.current).toBe(undefined)
      await rendered2.waitForNextUpdate()
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
  })

  describe('multiple accounts in database', () => {
    let rendered: any

    beforeEach(async () => {
      // on first render, the account is undefined because it's not yet loaded from database
      rendered = renderHook<any, any>(
        (accountName) => {
          const account = useAccount(accountName)
          const accounts = useAccounts()
          const accountsActions = useAccountsActions()
          return { account, accounts, ...accountsActions }
        },
        { wrapper: AccountsProvider }
      )

      // on second render, you get the default generated account
      await rendered.waitForNextUpdate()
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
      await deleteDatabases()
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

      // render second context with empty state to check if accounts saved to database
      const rendered2 = renderHook<any, any>(() => useAccount(), { wrapper: AccountsProvider })
      // accounts not yet loaded from database
      expect(rendered2.result.current).toBe(undefined)
      await rendered2.waitForNextUpdate()
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
      expect(rendered.result.current.account.author.displayName).toBe(null)
      const newAccount = JSON.parse(JSON.stringify({ ...rendered.result.current.account }))
      newAccount.author.displayName = 'display name john'
      await act(async () => {
        await rendered.result.current.setAccount(newAccount)
      })
      expect(rendered.result.current.account.author.displayName).toBe('display name john')

      // render second context with empty state to check if account change saved to database
      const rendered2 = renderHook<any, any>(() => useAccount('Account 2'), { wrapper: AccountsProvider })
      // accounts not yet loaded from database
      expect(rendered2.result.current).toBe(undefined)
      await rendered2.waitForNextUpdate()
      // active account display name is still 'display name john'
      expect(rendered2.result.current.author.displayName).toBe('display name john')
    })

    test('edit active account name and display name', async () => {
      expect(rendered.result.current.account.name).toBe('Account 1')
      expect(rendered.result.current.account.author.displayName).toBe(null)
      const newAccount = JSON.parse(JSON.stringify({ ...rendered.result.current.account }))
      newAccount.author.displayName = 'display name john'
      newAccount.name = 'account name john'
      await act(async () => {
        await rendered.result.current.setAccount(newAccount)
      })
      expect(rendered.result.current.account.author.displayName).toBe('display name john')
      expect(rendered.result.current.account.name).toBe('account name john')

      // render second context with empty state to check if account change saved to database
      const rendered2 = renderHook<any, any>(() => useAccount(), { wrapper: AccountsProvider })
      // accounts not yet loaded from database
      expect(rendered2.result.current).toBe(undefined)
      await rendered2.waitForNextUpdate()
      // active account is still 'account name john'
      expect(rendered2.result.current.name).toBe('account name john')
    })

    test.todo('export account')

    test.todo('import account')

    test.todo(`import account with duplicate account name, don't overwrite, add ' 2' to account name`)

    test(`change account order`, async () => {
      expect(rendered.result.current.accounts[0].name).toBe('Account 1')
      expect(rendered.result.current.accounts[1].name).toBe('Account 2')
      expect(rendered.result.current.accounts[2].name).toBe('Account 3')
      expect(rendered.result.current.accounts[3].name).toBe('custom name')
      await act(async () => {
        expect(() =>
          rendered.result.current.setAccountsOrder(['wrong account name', 'Account 3', 'Account 2', 'Account 1'])
        ).rejects.toThrow()
        await rendered.result.current.setAccountsOrder(['custom name', 'Account 3', 'Account 2', 'Account 1'])
      })
      expect(rendered.result.current.accounts[0].name).toBe('custom name')
      expect(rendered.result.current.accounts[1].name).toBe('Account 3')
      expect(rendered.result.current.accounts[2].name).toBe('Account 2')
      expect(rendered.result.current.accounts[3].name).toBe('Account 1')

      // render second context with empty state to check if saved to database
      const rendered2 = renderHook<any, any>(() => useAccounts(), { wrapper: AccountsProvider })
      await rendered2.waitForNextUpdate()
      expect(rendered2.result.current[0].name).toBe('custom name')
      expect(rendered2.result.current[1].name).toBe('Account 3')
      expect(rendered2.result.current[2].name).toBe('Account 2')
      expect(rendered2.result.current[3].name).toBe('Account 1')
    })

    test.todo(`delete active account, active account switches second account in accountNames`)

    test.todo(`delete all accounts and create a new one, which becomes active`)
  })

  describe('no comments or votes in database', () => {
    let rendered: any

    beforeEach(async () => {
      // on first render, the account is undefined because it's not yet loaded from database
      rendered = renderHook<any, any>(
        (accountName) => {
          const account = useAccount(accountName)
          const accountsActions = useAccountsActions()
          return { account, ...accountsActions }
        },
        { wrapper: AccountsProvider }
      )

      // on second render, you get the default generated account
      await rendered.waitForNextUpdate()
      expect(rendered.result.current.account.name).toBe('Account 1')
      expect(typeof rendered.result.current.publishComment).toBe('function')
      expect(typeof rendered.result.current.publishVote).toBe('function')
    })

    afterEach(async () => {
      await deleteDatabases()
    })

    describe(`create comment`, () => {
      const onChallenge = jest.fn()
      const onChallengeVerification = jest.fn()

      test('publish comment', async () => {
        const publishCommentOptions = {
          subplebbitAddress: 'Qm...',
          parentCommentCid: 'Qm...', 
          content: 'some content',
          onChallenge,
          onChallengeVerification,
        }
        await act(async () => {
          await rendered.result.current.publishComment(publishCommentOptions)
        })
      })

      let comment: any

      test('onChallenge gets called', async () => {
        // onChallenge gets call backed once
        await rendered.waitFor(() => expect(onChallenge).toBeCalledTimes(1))
        expect(onChallenge.mock.calls.length).toBe(1)

        // onChallenge arguments are [challenge, comment]
        const challenge = onChallenge.mock.calls[0][0]
        comment = onChallenge.mock.calls[0][1]
        expect(challenge.type).toBe('CHALLENGE')
        expect(challenge.challenges[0]).toEqual({challenge: '2+2=?', type: 'text'})
        expect(typeof comment.publishChallengeAnswer).toBe('function')
      })

      test('onChallengeVerification gets called', async () => {
        // publish challenge answer and wait for verification
        comment.publishChallengeAnswer(['4'])
        await rendered.waitFor(() => expect(onChallengeVerification).toBeCalledTimes(1))
        expect(onChallengeVerification.mock.calls.length).toBe(1)
        const challengeVerification = onChallengeVerification.mock.calls[0][0]
        const commentVerified = onChallengeVerification.mock.calls[0][1]
        expect(challengeVerification.type).toBe('CHALLENGEVERIFICATION')
        expect(commentVerified.constructor.name).toBe('Comment')
      })
    })

    describe(`create vote`, () => {
      const onChallenge = jest.fn()
      const onChallengeVerification = jest.fn()

      test('publish vote', async () => {
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

      let vote: any

      test('onChallenge gets called', async () => {
        // onChallenge gets call backed once
        await rendered.waitFor(() => expect(onChallenge).toBeCalledTimes(1))
        expect(onChallenge.mock.calls.length).toBe(1)

        // onChallenge arguments are [challenge, comment]
        const challenge = onChallenge.mock.calls[0][0]
        vote = onChallenge.mock.calls[0][1]
        expect(challenge.type).toBe('CHALLENGE')
        expect(challenge.challenges[0]).toEqual({challenge: '2+2=?', type: 'text'})
        expect(typeof vote.publishChallengeAnswer).toBe('function')
      })

      test('onChallengeVerification gets called', async () => {
        // publish challenge answer and wait for verification
        vote.publishChallengeAnswer(['4'])
        await rendered.waitFor(() => expect(onChallengeVerification).toBeCalledTimes(1))
        expect(onChallengeVerification.mock.calls.length).toBe(1)
        const challengeVerification = onChallengeVerification.mock.calls[0][0]
        const voteVerified = onChallengeVerification.mock.calls[0][1]
        expect(challengeVerification.type).toBe('CHALLENGEVERIFICATION')
        expect(voteVerified.constructor.name).toBe('Vote')
      })
    })
  })

  describe('multiple comments and votes in database', () => {
    const onChallenge = jest.fn()
    const onChallengeVerification = jest.fn()
    const publishOptions = {onChallenge, onChallengeVerification}
    let rendered: any

    beforeEach(async () => {
      rendered = renderHook<any, any>(
        (props: any) => {
          const accountCommentsOptions: AccountCommentsOptions = {
            accountName: props?.accountName,
            filter: {
              commentCids: [props?.commentCid],
              postCids: [props?.postCid],
              subplebbitAddresses: [props?.subplebbitAddress],
              parentCommentCids: [props?.parentCommentCids],
              hasParentCommentCid: props?.hasParentCommentCid
            }
          }
          const account = useAccount(props?.accountName)
          const accountsActions = useAccountsActions()
          const isAccountComment = useIsAccountComment(props?.commentCid, props?.accountName)
          const accountComments = useAccountComments(accountCommentsOptions)
          const accountVotes = useAccountVotes(accountCommentsOptions)
          const accountVote = useAccountVote(props?.commentCid, props?.accountName)
          return { account, isAccountComment, accountComments, accountVotes, accountVote, ...accountsActions }
        },
        { wrapper: AccountsProvider }
      )
      await rendered.waitForNextUpdate()      
      expect(rendered.result.current.account.name).toBe('Account 1')
      expect(typeof rendered.result.current.publishComment).toBe('function')
      expect(typeof rendered.result.current.publishVote).toBe('function')

      await act(async () => {
        await rendered.result.current.publishComment({
          ...publishOptions, title: 'title 1', content: 'content 1', subplebbitAddress: 'subplebbit address 1'
        })
        await rendered.result.current.publishComment({
          ...publishOptions, title: 'title 2', content: 'content 2', subplebbitAddress: 'subplebbit address 1'
        })
        await rendered.result.current.publishComment({
          ...publishOptions, title: 'title 3', content: 'content 3', subplebbitAddress: 'subplebbit address 2'
        })
        await rendered.result.current.publishVote({
          ...publishOptions, vote: 1, commentCid: 'comment cid 1', subplebbitAddress: 'subplebbit address 1'
        })
        await rendered.result.current.publishVote({
          ...publishOptions, vote: 1, commentCid: 'comment cid 2', subplebbitAddress: 'subplebbit address 1'
        })
        await rendered.result.current.publishVote({
          ...publishOptions, vote: 1, commentCid: 'comment cid 3', subplebbitAddress: 'subplebbit address 2'
        })
      })
    })

    afterEach(async () => {
      await deleteDatabases()
    })

    test(`get all account comments`, async () => {
      expect(rendered.result.current.accountComments.length).toBe(3)
      expect(rendered.result.current.accountComments[0].content).toBe('content 1')
      expect(rendered.result.current.accountComments[1].content).toBe('content 2')
      expect(rendered.result.current.accountComments[2].content).toBe('content 3')
    })

    test(`account comments are stored to database`, async () => {
      // render with new context to see if still in database
      const rendered2 = renderHook<any, any>(() => useAccountComments(),
        { wrapper: AccountsProvider }
      )
      await rendered2.waitForNextUpdate()
      expect(rendered2.result.current.length).toBe(3)
      expect(rendered2.result.current[0].content).toBe('content 1')
      expect(rendered2.result.current[1].content).toBe('content 2')
      expect(rendered2.result.current[2].content).toBe('content 3')
    })

    test(`get all account votes`, async () => {
      expect(rendered.result.current.accountVotes.length).toBe(3)
      expect(rendered.result.current.accountVotes[0].commentCid).toBe('comment cid 1')
      expect(rendered.result.current.accountVotes[1].commentCid).toBe('comment cid 2')
      expect(rendered.result.current.accountVotes[2].commentCid).toBe('comment cid 3')
    })

    test(`account votes are stored to database`, async () => {
      // render with new context to see if still in database
      const rendered2 = renderHook<any, any>(() => useAccountVotes(),
        { wrapper: AccountsProvider }
      )
      await rendered2.waitForNextUpdate()
      expect(rendered2.result.current.length).toBe(3)
      expect(rendered2.result.current[0].commentCid).toBe('comment cid 1')
      expect(rendered2.result.current[1].commentCid).toBe('comment cid 2')
      expect(rendered2.result.current[2].commentCid).toBe('comment cid 3')
    })

    test(`get all comments and votes from different account name`, async () => {
      await act(async () => {
        await rendered.result.current.createAccount()
        await rendered.result.current.setActiveAccount('Account 2')
        await rendered.result.current.publishComment({
          ...publishOptions, title: 'account 2 title 1', content: 'account 2 content 1', subplebbitAddress: 'account 2 subplebbit address 1'
        })
        await rendered.result.current.publishVote({
          ...publishOptions, vote: 1, commentCid: 'account 2 comment cid 1', subplebbitAddress: 'account 2 subplebbit address 1'
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

      // render with new context to see if still in database
      const rendered2 = renderHook<any, any>(() => {
        const accountComments = useAccountComments({accountName: 'Account 2'})
        const accountVotes = useAccountVotes({accountName: 'Account 2'})
        return {accountComments, accountVotes}
      },
        { wrapper: AccountsProvider }
      )
      await rendered2.waitForNextUpdate()
      expect(rendered2.result.current.accountComments.length).toBe(1)
      expect(rendered2.result.current.accountVotes.length).toBe(1)
      expect(rendered2.result.current.accountComments[0].content).toBe('account 2 content 1')
      expect(rendered2.result.current.accountVotes[0].commentCid).toBe('account 2 comment cid 1')
    })

    test.todo(`get account's vote`)
  })
})
