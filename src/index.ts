import AccountsProvider, {AccountsContext} from './providers/AccountsProvider'
import { useAccount, useAccounts, useAccountsActions } from './hooks/accounts'

const hooks = {
  AccountsProvider,
  AccountsContext,
  useAccount,
  useAccounts,
  useAccountsActions
}

export {
  AccountsProvider,
  AccountsContext,
  useAccount,
  useAccounts,
  useAccountsActions
}

export default hooks
