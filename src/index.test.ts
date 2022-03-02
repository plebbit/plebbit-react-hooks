import { act, renderHook } from '@testing-library/react-hooks'
import { useAccount, useAccounts, useAccountsActions } from '.'
import AccountsProvider from './providers/AccountsProvider'
import localForage from 'localforage'
import PlebbitMock from './plebbit-js/plebbit-js-mock'
import { mockPlebbitJs } from './plebbit-js'
mockPlebbitJs(PlebbitMock)

const deleteDatabases = () =>
  Promise.all([
    localForage.createInstance({ name: 'accountsMetadata' }).clear(),
    localForage.createInstance({ name: 'accounts' }).clear(),
  ])

describe('AccountsProvider', () => {
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

      // render a second context with empty state to check if accounts
      // to saved to database
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
      expect(typeof rendered.result.current.setActiveAccountName).toBe('function')

      // change active account
      await act(async () => {
        await rendered.result.current.setActiveAccountName('Account 2')
      })
      expect(rendered.result.current.account.name).toBe('Account 2')

      // change active account
      await act(async () => {
        await rendered.result.current.setActiveAccountName('custom name')
      })
      expect(rendered.result.current.account.name).toBe('custom name')

      // render a second context with empty state to check if
      // active account saved to database
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
          `createAccount accountName '${rendered.result.current.account.name}' already exists in database`
        )
      })
    })

    test('edit account display name', async () => {
      expect(rendered.result.current.account.name).toBe('Account 1')
      expect(rendered.result.current.account.author.displayName).toBe(null)
      const newAccount = JSON.parse(JSON.stringify({ ...rendered.result.current.account, plebbit: undefined }))
      newAccount.author.displayName = 'john'
      await act(async () => {
        await rendered.result.current.setAccount('Account 1', newAccount)
      })
      expect(rendered.result.current.account.author.displayName).toBe('john')
    })

    test('edit active account name and display name', async () => {
      expect(rendered.result.current.account.name).toBe('Account 1')
      expect(rendered.result.current.account.author.displayName).toBe(null)
      const newAccount = JSON.parse(JSON.stringify({ ...rendered.result.current.account, plebbit: undefined }))
      newAccount.author.displayName = 'john'
      newAccount.name = 'john'
      await act(async () => {
        await rendered.result.current.setAccount('Account 1', newAccount)
      })
      expect(rendered.result.current.account.author.displayName).toBe('john')
      expect(rendered.result.current.account.name).toBe('john')
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

      // render a second context with empty state to check if accounts
      // to saved to database
      const rendered2 = renderHook<any, any>(() => useAccounts(), { wrapper: AccountsProvider })
      await rendered2.waitForNextUpdate()
      expect(rendered2.result.current[0].name).toBe('custom name')
      expect(rendered2.result.current[1].name).toBe('Account 3')
      expect(rendered2.result.current[2].name).toBe('Account 2')
      expect(rendered2.result.current[3].name).toBe('Account 1')
    })

    test.todo(`delete active account, active account switches second account in accountNames`)

    test.todo(`delete all accounts and create a new one`)
  })

  describe('multiple comments and votes in database', () => {
    test.todo(`get account's comment`)

    test.todo(`get account's vote`)
  })
})
