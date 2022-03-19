import { act, renderHook } from '@testing-library/react-hooks'
import testUtils from '../lib/test-utils'
import {
  PlebbitProvider,
  useAccount,
  useAccounts,
  useAccountsActions,
  useAccountComments,
  useAccountVotes,
  useAccountVote,
  UseAccountCommentsOptions,
  useComment,
  useAccountNotifications,
  useFeed,
} from '..'
import localForage from 'localforage'
import PlebbitJsMock, { mockPlebbitJs, Plebbit, Comment, Subplebbit } from '../lib/plebbit-js/plebbit-js-mock'
mockPlebbitJs(PlebbitJsMock)

const deleteDatabases = () =>
  Promise.all([
    localForage.createInstance({ name: 'accountsMetadata' }).clear(),
    localForage.createInstance({ name: 'accounts' }).clear(),
  ])

describe('accounts', () => {
  beforeAll(() => {
    testUtils.silenceUpdateUnmountedComponentWarning()
  })
  afterAll(() => {
    testUtils.restoreAll()
  })
  afterEach(async () => {
    await deleteDatabases()
  })

  describe('no accounts in database', () => {
    test('generate default account on load', async () => {
      // on first render, the account is undefined because it's not yet loaded from database
      const rendered = renderHook(() => useAccount(), { wrapper: PlebbitProvider })
      expect(rendered.result.current).toBe(undefined)

      // on second render, you get the default generated account
      try {
        await rendered.waitForNextUpdate()
      } catch (e) {
        console.error(e)
      }
      const account = rendered.result.current
      expect(account.name).toBe('Account 1')
      expect(account.author.displayName).toBe(null)
      expect(typeof account.author.address).toBe('string')
      expect(Array.isArray(account.subscriptions)).toBe(true)
      expect(account.blockedAddresses && typeof account.blockedAddresses === 'object').toBe(true)
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
        { wrapper: PlebbitProvider }
      )
      // on first render, the account is undefined because it's not yet loaded from database
      expect(rendered.result.current.account).toBe(undefined)
      expect(rendered.result.current.createAccount).toBe(undefined)

      // on second render, you get the default generated account
      try {
        await rendered.waitForNextUpdate()
      } catch (e) {
        console.error(e)
      }
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
      const rendered2 = renderHook<any, any>((accountName) => useAccount(accountName), { wrapper: PlebbitProvider })
      // accounts not yet loaded from database
      expect(rendered2.result.current).toBe(undefined)
      try {
        await rendered2.waitForNextUpdate()
      } catch (e) {
        console.error(e)
      }
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
        { wrapper: PlebbitProvider }
      )

      // on second render, you get the default generated account
      try {
        await rendered.waitForNextUpdate()
      } catch (e) {
        console.error(e)
      }
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
      const rendered2 = renderHook<any, any>(() => useAccount(), { wrapper: PlebbitProvider })
      // accounts not yet loaded from database
      expect(rendered2.result.current).toBe(undefined)
      try {
        await rendered2.waitForNextUpdate()
      } catch (e) {
        console.error(e)
      }
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
      const rendered2 = renderHook<any, any>(() => useAccount('Account 2'), { wrapper: PlebbitProvider })
      // accounts not yet loaded from database
      expect(rendered2.result.current).toBe(undefined)
      try {
        await rendered2.waitForNextUpdate()
      } catch (e) {
        console.error(e)
      }
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
      const rendered2 = renderHook<any, any>(() => useAccount(), { wrapper: PlebbitProvider })
      // accounts not yet loaded from database
      expect(rendered2.result.current).toBe(undefined)
      try {
        await rendered2.waitForNextUpdate()
      } catch (e) {
        console.error(e)
      }
      // active account is still 'account name john'
      expect(rendered2.result.current.name).toBe('account name john')
    })

    test('fail to edit account with wrong account id', async () => {
      const newAccount = JSON.parse(JSON.stringify({ ...rendered.result.current.account }))
      newAccount.author.displayName = 'display name john'
      newAccount.id = 'something incorrect'
      await act(async () => {
        expect(rendered.result.current.setAccount(newAccount)).rejects.toThrow(
          `cannot set account with account.id 'something incorrect' id does not exist in database`
        )
      })
    })

    test.todo('edited account can still sign and publish comments')

    test.todo(`fail to edit account.address that doesn't match signer private key`)

    test.todo('export account')

    test.todo('import account')

    test.todo(`import account with duplicate account name succeeds by adding ' 2' to account name`)

    test.todo(`import account with duplicate account id succeeds because account id is reset on import`)

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
      const rendered2 = renderHook<any, any>(() => useAccounts(), { wrapper: PlebbitProvider })
      try {
        await rendered2.waitForNextUpdate()
      } catch (e) {
        console.error(e)
      }
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
        { wrapper: PlebbitProvider }
      )

      // on second render, you get the default generated account
      try {
        await rendered.waitForNextUpdate()
      } catch (e) {
        console.error(e)
      }
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
          parentCid: 'Qm...',
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
        try {
          await rendered.waitFor(() => expect(onChallenge).toBeCalledTimes(1))
        } catch (e) {
          console.error(e)
        }
        expect(onChallenge.mock.calls.length).toBe(1)

        // onChallenge arguments are [challenge, comment]
        const challenge = onChallenge.mock.calls[0][0]
        comment = onChallenge.mock.calls[0][1]
        expect(challenge.type).toBe('CHALLENGE')
        expect(challenge.challenges[0]).toEqual({ challenge: '2+2=?', type: 'text' })
        expect(typeof comment.publishChallengeAnswers).toBe('function')
      })

      test('onChallengeVerification gets called', async () => {
        // publish challenge answer and wait for verification
        comment.publishChallengeAnswers(['4'])
        try {
          await rendered.waitFor(() => expect(onChallengeVerification).toBeCalledTimes(1))
        } catch (e) {
          console.error(e)
        }
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
        try {
          await rendered.waitFor(() => expect(onChallenge).toBeCalledTimes(1))
        } catch (e) {
          console.error(e)
        }
        expect(onChallenge.mock.calls.length).toBe(1)

        // onChallenge arguments are [challenge, comment]
        const challenge = onChallenge.mock.calls[0][0]
        vote = onChallenge.mock.calls[0][1]
        expect(challenge.type).toBe('CHALLENGE')
        expect(challenge.challenges[0]).toEqual({ challenge: '2+2=?', type: 'text' })
        expect(typeof vote.publishChallengeAnswers).toBe('function')
      })

      test('onChallengeVerification gets called', async () => {
        // publish challenge answer and wait for verification
        vote.publishChallengeAnswers(['4'])
        try {
          await rendered.waitFor(() => expect(onChallengeVerification).toBeCalledTimes(1))
        } catch (e) {
          console.error(e)
        }
        expect(onChallengeVerification.mock.calls.length).toBe(1)
        const challengeVerification = onChallengeVerification.mock.calls[0][0]
        const voteVerified = onChallengeVerification.mock.calls[0][1]
        expect(challengeVerification.type).toBe('CHALLENGEVERIFICATION')
        expect(voteVerified.constructor.name).toBe('Vote')
      })
    })
  })

  describe('multiple comments and votes in database', () => {
    let onChallenge: any
    let onChallengeVerification: any
    let publishOptions: any
    let rendered: any

    beforeEach(async () => {
      onChallenge = jest.fn()
      onChallengeVerification = jest.fn()
      publishOptions = { onChallenge, onChallengeVerification }
      rendered = renderHook<any, any>(
        (props: any) => {
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
          const account = useAccount(props?.accountName)
          const accountsActions = useAccountsActions()
          const accountComments = useAccountComments(useAccountCommentsOptions)
          const accountVotes = useAccountVotes(useAccountCommentsOptions)
          const accountVote = useAccountVote(props?.commentCid, props?.accountName)
          return { account, accountComments, accountVotes, accountVote, ...accountsActions }
        },
        { wrapper: PlebbitProvider }
      )
      try {
        await rendered.waitForNextUpdate()
      } catch (e) {
        console.error(e)
      }
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
      await deleteDatabases()
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

    test(`get all account comments`, async () => {
      expect(rendered.result.current.accountComments.length).toBe(3)
      expect(rendered.result.current.accountComments[0].content).toBe('content 1')
      expect(rendered.result.current.accountComments[1].content).toBe('content 2')
      expect(rendered.result.current.accountComments[2].content).toBe('content 3')
      expectAccountCommentsToHaveIndexAndAccountId(
        rendered.result.current.accountComments,
        rendered.result.current.account.id
      )
    })

    test(`get account comment and add cid to it when receive challengeVerification`, async () => {
      expect(rendered.result.current.accountComments.length).toBe(3)
      expect(rendered.result.current.accountComments[0].content).toBe('content 1')
      expect(rendered.result.current.accountComments[1].content).toBe('content 2')
      expect(rendered.result.current.accountComments[2].content).toBe('content 3')
      // wait for all on challenge to be called
      try {
        await rendered.waitFor(() => onChallenge.mock.calls.length === 6)
      } catch (e) {
        console.error(e)
      }
      // publish challenge answers for comment 1 and 2
      onChallenge.mock.calls[0][1].publishChallengeAnswers(['4'])
      onChallenge.mock.calls[1][1].publishChallengeAnswers(['4'])
      // wait for all on challengeverification to be called
      try {
        await rendered.waitFor(() => onChallengeVerification.mock.calls.length === 2)
      } catch (e) {
        console.error(e)
      }
      expect(rendered.result.current.accountComments.length).toBe(3)
      expect(rendered.result.current.accountComments[0].content).toBe('content 1')
      expect(rendered.result.current.accountComments[1].content).toBe('content 2')
      expect(rendered.result.current.accountComments[2].content).toBe('content 3')
      expect(rendered.result.current.accountComments[0].cid).toBe('content 1 cid')
      expect(rendered.result.current.accountComments[1].cid).toBe('content 2 cid')
      expect(rendered.result.current.accountComments[2].cid).toBe(undefined)
      expectAccountCommentsToHaveIndexAndAccountId(
        rendered.result.current.accountComments,
        rendered.result.current.account.id
      )

      // check if cids are in database after getting a new context
      const activeAccountId = rendered.result.current.account.id
      const rendered2 = renderHook<any, any>(() => useAccountComments(), { wrapper: PlebbitProvider })
      try {
        await rendered2.waitForNextUpdate()
      } catch (e) {
        console.error(e)
      }
      expect(rendered2.result.current.length).toBe(3)
      expect(rendered2.result.current[0].content).toBe('content 1')
      expect(rendered2.result.current[1].content).toBe('content 2')
      expect(rendered2.result.current[2].content).toBe('content 3')
      expect(rendered2.result.current[0].cid).toBe('content 1 cid')
      expect(rendered2.result.current[1].cid).toBe('content 2 cid')
      expect(rendered2.result.current[2].cid).toBe(undefined)
      expectAccountCommentsToHaveIndexAndAccountId(rendered2.result.current, activeAccountId)
    })

    test(`cid gets added to account comment after fetched in useComment`, async () => {
      const rendered = renderHook<any, any>(
        (commentCid) => {
          const accountComments = useAccountComments()
          const comment = useComment(commentCid)
          return accountComments
        },
        { wrapper: PlebbitProvider }
      )
      try {
        await rendered.waitForNextUpdate()
      } catch (e) {
        console.error(e)
      }
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
      try {
        await rendered.waitFor(() => !!rendered.result.current[0].cid)
      } catch (e) {
        console.error(e)
      }
      expect(rendered.result.current[0].content).toBe('content 1')
      expect(rendered.result.current[1].content).toBe('content 2')
      expect(rendered.result.current[0].cid).toBe('content 1 cid')
      expect(rendered.result.current[1].cid).toBe(undefined)
      expectAccountCommentsToHaveIndexAndAccountId(rendered.result.current)

      // make sure the account comment starts updating by checking if it received upvotes
      try {
        await rendered.waitFor(() => typeof rendered.result.current[0].upvoteCount === 'number')
      } catch (e) {
        console.error(e)
      }
      expect(rendered.result.current[0].upvoteCount).toBe(3)

      // mock the second comment to get from plebbit.getComment()
      Plebbit.prototype.commentToGet = () => ({
        author: rendered.result.current[1].author,
        timestamp: rendered.result.current[1].timestamp,
        content: rendered.result.current[1].content,
      })

      rendered.rerender('content 2 cid')
      try {
        await rendered.waitFor(() => !!rendered.result.current[1].cid)
      } catch (e) {
        console.error(e)
      }
      expect(rendered.result.current[0].content).toBe('content 1')
      expect(rendered.result.current[1].content).toBe('content 2')
      expect(rendered.result.current[0].cid).toBe('content 1 cid')
      expect(rendered.result.current[1].cid).toBe('content 2 cid')
      expectAccountCommentsToHaveIndexAndAccountId(rendered.result.current)

      // restore mock
      Plebbit.prototype.commentToGet = commentToGet

      // check if cids are still in database after new context
      const rendered2 = renderHook<any, any>(() => useAccountComments(), { wrapper: PlebbitProvider })
      try {
        await rendered2.waitForNextUpdate()
      } catch (e) {
        console.error(e)
      }
      expect(rendered2.result.current[0].cid).toBe('content 1 cid')
      expect(rendered2.result.current[1].cid).toBe('content 2 cid')
      expect(rendered2.result.current[2].cid).toBe(undefined)
      expectAccountCommentsToHaveIndexAndAccountId(rendered2.result.current)
    })

    test(`cid gets added to account comment after feed is fetched`, async () => {
      const getSortedPosts = Subplebbit.prototype.getSortedPosts

      const rendered = renderHook<any, any>(
        (props?) => {
          const { feed } = useFeed(props?.subplebbitAddresses, 'new')
          const accountComments = useAccountComments()
          return { accountComments, feed }
        },
        { wrapper: PlebbitProvider }
      )
      // wait for account comments to render
      try {
        await rendered.waitFor(() => rendered.result.current.accountComments?.length > 0)
      } catch (e) {
        console.error(e)
      }

      // get feed page with our timestamp and author address in it
      const accountCommentTimestamp = rendered.result.current.accountComments[0].timestamp
      const accountCommentAuthor = rendered.result.current.accountComments[0].author
      const accountCommentSubplebbitAddress = rendered.result.current.accountComments[0].subplebbitAddress
      Subplebbit.prototype.getSortedPosts = async () => ({
        comments: [
          {
            cid: 'cid from feed',
            timestamp: accountCommentTimestamp,
            author: accountCommentAuthor,
            subplebbitAddress: accountCommentSubplebbitAddress,
          },
        ],
        nextCid: null,
      })
      rendered.rerender({ subplebbitAddresses: [accountCommentSubplebbitAddress] })

      // wait for feed to load
      try {
        await rendered.waitFor(() => rendered.result.current.feed?.length > 0)
      } catch (e) {
        console.error(e)
      }

      // wait for cid from feed to have been added to account comments
      try {
        await rendered.waitFor(() => rendered.result.current.accountComments[0].cid === 'cid from feed')
      } catch (e) {
        console.error(e)
      }
      expect(rendered.result.current.accountComments[0].cid).toBe('cid from feed')

      // restore mock
      Subplebbit.prototype.getSortedPosts = getSortedPosts
    })

    test(`account comments are stored to database`, async () => {
      // render with new context to see if still in database
      const rendered2 = renderHook<any, any>(() => useAccountComments(), { wrapper: PlebbitProvider })
      try {
        await rendered2.waitForNextUpdate()
      } catch (e) {
        console.error(e)
      }
      expect(rendered2.result.current.length).toBe(3)
      expect(rendered2.result.current[0].content).toBe('content 1')
      expect(rendered2.result.current[1].content).toBe('content 2')
      expect(rendered2.result.current[2].content).toBe('content 3')
      expectAccountCommentsToHaveIndexAndAccountId(rendered2.result.current)
    })

    test(`account has no karma before comments are published`, async () => {
      expect(rendered.result.current.account.karma.score).toBe(0)
      expect(rendered.result.current.account.karma.upvoteCount).toBe(0)
      expect(rendered.result.current.account.karma.downvoteCount).toBe(0)
      expect(rendered.result.current.account.karma.commentScore).toBe(0)
      expect(rendered.result.current.account.karma.commentUpvoteCount).toBe(0)
      expect(rendered.result.current.account.karma.commentDownvoteCount).toBe(0)
      expect(rendered.result.current.account.karma.linkScore).toBe(0)
      expect(rendered.result.current.account.karma.linkUpvoteCount).toBe(0)
      expect(rendered.result.current.account.karma.linkDownvoteCount).toBe(0)
    })

    test(`account has karma after comments are published`, async () => {
      try {
        await rendered.waitFor(() =>
          Boolean(onChallenge.mock.calls[0] && onChallenge.mock.calls[1] && onChallenge.mock.calls[2])
        )
      } catch (e) {
        console.error(e)
      }
      // answer challenges to get the comments published
      onChallenge.mock.calls[0][1].publishChallengeAnswers(['4'])
      onChallenge.mock.calls[1][1].publishChallengeAnswers(['4'])
      onChallenge.mock.calls[2][1].publishChallengeAnswers(['4'])

      try {
        await rendered.waitFor(() => rendered.result.current.account.karma.upvoteCount >= 9)
      } catch (e) {
        console.error(e)
      }
      expect(rendered.result.current.account.karma.score).toBe(6)
      expect(rendered.result.current.account.karma.upvoteCount).toBe(9)
      expect(rendered.result.current.account.karma.downvoteCount).toBe(3)
      expect(rendered.result.current.account.karma.commentScore).toBe(2)
      expect(rendered.result.current.account.karma.commentUpvoteCount).toBe(3)
      expect(rendered.result.current.account.karma.commentDownvoteCount).toBe(1)
      expect(rendered.result.current.account.karma.linkScore).toBe(4)
      expect(rendered.result.current.account.karma.linkUpvoteCount).toBe(6)
      expect(rendered.result.current.account.karma.linkDownvoteCount).toBe(2)

      // get the karma from database by created new context
      const rendered2 = renderHook<any, any>(
        () => {
          const account = useAccount()
          const accountComments = useAccountComments()
          return { account, accountComments }
        },
        { wrapper: PlebbitProvider }
      )
      try {
        await rendered2.waitFor(() => rendered2.result.current.account.karma.upvoteCount >= 9)
      } catch (e) {
        console.error(e)
      }
      expect(rendered2.result.current.account.karma.score).toBe(6)
      expect(rendered2.result.current.account.karma.upvoteCount).toBe(9)
      expect(rendered2.result.current.account.karma.downvoteCount).toBe(3)
      expect(rendered2.result.current.account.karma.commentScore).toBe(2)
      expect(rendered2.result.current.account.karma.commentUpvoteCount).toBe(3)
      expect(rendered2.result.current.account.karma.commentDownvoteCount).toBe(1)
      expect(rendered2.result.current.account.karma.linkScore).toBe(4)
      expect(rendered2.result.current.account.karma.linkUpvoteCount).toBe(6)
      expect(rendered2.result.current.account.karma.linkDownvoteCount).toBe(2)
    })

    test(`get all account votes`, async () => {
      expect(rendered.result.current.accountVotes.length).toBe(3)
      expect(rendered.result.current.accountVotes[0].commentCid).toBe('comment cid 1')
      expect(rendered.result.current.accountVotes[1].commentCid).toBe('comment cid 2')
      expect(rendered.result.current.accountVotes[2].commentCid).toBe('comment cid 3')
    })

    test(`account votes are stored to database`, async () => {
      // render with new context to see if still in database
      const rendered2 = renderHook<any, any>(() => useAccountVotes(), { wrapper: PlebbitProvider })
      try {
        await rendered2.waitForNextUpdate()
      } catch (e) {
        console.error(e)
      }
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

      // render with new context to see if still in database
      const rendered2 = renderHook<any, any>(
        () => {
          const accountComments = useAccountComments({ accountName: 'Account 2' })
          const accountVotes = useAccountVotes({ accountName: 'Account 2' })
          return { accountComments, accountVotes }
        },
        { wrapper: PlebbitProvider }
      )
      try {
        await rendered2.waitForNextUpdate()
      } catch (e) {
        console.error(e)
      }
      expect(rendered2.result.current.accountComments.length).toBe(1)
      expect(rendered2.result.current.accountVotes.length).toBe(1)
      expect(rendered2.result.current.accountComments[0].content).toBe('account 2 content 1')
      expect(rendered2.result.current.accountVotes[0].commentCid).toBe('account 2 comment cid 1')
    })

    test(`get account comments in a post`, () => {
      rendered.rerender({ postCid: 'post cid 1' })
      expect(rendered.result.current.accountComments.length).toBe(1)
      expect(rendered.result.current.accountVotes.length).toBe(0)
      expect(rendered.result.current.accountComments[0].postCid).toBe('post cid 1')
    })

    test(`get account replies to a comment`, () => {
      rendered.rerender({ parentCid: 'parent comment cid 1' })
      expect(rendered.result.current.accountComments.length).toBe(1)
      expect(rendered.result.current.accountVotes.length).toBe(0)
      expect(rendered.result.current.accountComments[0].parentCid).toBe('parent comment cid 1')
    })

    test(`get account posts in a subplebbit`, () => {
      rendered.rerender({ subplebbitAddress: 'subplebbit address 1', hasParentCid: false })
      expect(rendered.result.current.accountComments.length).toBe(1)
      expect(rendered.result.current.accountVotes.length).toBe(2)
      expect(rendered.result.current.accountComments[0].parentCid).toBe(undefined)
    })

    test(`get account posts and comments in a subplebbit`, () => {
      rendered.rerender({ subplebbitAddress: 'subplebbit address 1' })
      expect(rendered.result.current.accountComments.length).toBe(2)
      expect(rendered.result.current.accountVotes.length).toBe(2)
      expect(rendered.result.current.accountComments[0].parentCid).toBe('parent comment cid 1')
      expect(rendered.result.current.accountComments[1].parentCid).toBe(undefined)
    })

    test(`get all account posts`, () => {
      rendered.rerender({ hasParentCid: false })
      expect(rendered.result.current.accountComments.length).toBe(2)
      expect(rendered.result.current.accountVotes.length).toBe(3)
      expect(rendered.result.current.accountComments[0].parentCid).toBe(undefined)
      expect(rendered.result.current.accountComments[1].parentCid).toBe(undefined)
    })

    test(`get account vote on a specific comment`, () => {
      rendered.rerender({ commentCid: 'comment cid 3' })
      expect(rendered.result.current.accountComments.length).toBe(0)
      expect(rendered.result.current.accountVotes.length).toBe(1)
      expect(rendered.result.current.accountVotes[0].commentCid).toBe('comment cid 3')
    })
  })

  describe('one comment in database', () => {
    let rendered: any
    const updatingComments: any = []
    const commentUpdate = Comment.prototype.update

    beforeEach(async () => {
      // mock the comment update to get able to access the comment from test
      Comment.prototype.update = function () {
        updatingComments.push(this)
        return commentUpdate.bind(this)()
      }

      rendered = renderHook<any, any>(
        (props?: any) => {
          const account = useAccount(props?.accountName)
          const { notifications, markAsRead } = useAccountNotifications(props?.accountName)
          const { publishComment } = useAccountsActions()
          return { account, notifications, markAsRead, publishComment }
        },
        { wrapper: PlebbitProvider }
      )
      try {
        await rendered.waitForNextUpdate()
      } catch (e) {
        console.error(e)
      }
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
      await deleteDatabases()
    })

    test('get notifications', async () => {
      try {
        await rendered.waitFor(() => updatingComments.length > 0)
      } catch (e) {
        console.error(e)
      }
      // we should have published 1 comment and it should be updating at this point
      expect(updatingComments.length).toBe(1)
      const comment = updatingComments[0]
      expect(rendered.result.current.notifications).toEqual([])
      expect(rendered.result.current.account.unreadNotificationCount).toBe(0)

      act(() => {
        // update the comment with replies to see get notifications
        comment.sortedReplies = {
          topAll: {
            nextCid: null,
            comments: [
              { cid: 'reply cid 1', timestamp: 1 },
              { cid: 'reply cid 2', timestamp: 2 },
              { cid: 'reply cid 3', timestamp: 3 },
            ],
          },
        }
        comment.emit('update', comment)
      })

      // wait for notifications, should be sorted by highest/newest timestamp
      try {
        await rendered.waitFor(() => rendered.result.current.notifications.length > 0)
      } catch (e) {
        console.error(e)
      }
      expect(rendered.result.current.notifications.length).toBe(3)
      expect(rendered.result.current.notifications[0].cid).toBe('reply cid 3')
      expect(rendered.result.current.notifications[1].cid).toBe('reply cid 2')
      expect(rendered.result.current.notifications[2].cid).toBe('reply cid 1')
      expect(rendered.result.current.notifications[0].markedAsRead).toBe(false)
      expect(rendered.result.current.notifications[1].markedAsRead).toBe(false)
      expect(rendered.result.current.notifications[2].markedAsRead).toBe(false)
      expect(rendered.result.current.account.unreadNotificationCount).toBe(3)

      act(() => {
        // mark te notifications as read
        rendered.result.current.markAsRead()
      })

      // should be marked as read
      try {
        await rendered.waitFor(() => rendered.result.current.notifications[0].markedAsRead === true)
      } catch (e) {
        console.error(e)
      }
      expect(rendered.result.current.notifications.length).toBe(3)
      expect(rendered.result.current.notifications[0].cid).toBe('reply cid 3')
      expect(rendered.result.current.notifications[1].cid).toBe('reply cid 2')
      expect(rendered.result.current.notifications[2].cid).toBe('reply cid 1')
      expect(rendered.result.current.notifications[0].markedAsRead).toBe(true)
      expect(rendered.result.current.notifications[1].markedAsRead).toBe(true)
      expect(rendered.result.current.notifications[2].markedAsRead).toBe(true)
      expect(rendered.result.current.account.unreadNotificationCount).toBe(0)

      act(() => {
        // update the comment with one unread reply and one read reply
        comment.sortedReplies = {
          topAll: {
            nextCid: null,
            comments: [
              { cid: 'reply cid 3', timestamp: 3 },
              { cid: 'reply cid 4', timestamp: 4 },
            ],
          },
        }
        comment.emit('update', comment)
      })

      // comment 3 should be marked as read, comment 4 should not
      try {
        await rendered.waitFor(() => rendered.result.current.notifications.length >= 4)
      } catch (e) {
        console.error(e)
      }
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

      // check to see if in database after refreshing with a new context
      const rendered2 = renderHook<any, any>(() => useAccountNotifications(), { wrapper: PlebbitProvider })
      try {
        await rendered2.waitFor(() => rendered2.result.current.notifications.length >= 4)
      } catch (e) {
        console.error(e)
      }
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
})
