import AccountsProvider, {AccountsContext} from './providers/AccountsProvider'
import {
  useAccount,
  useAccounts,
  useAccountsActions,
  useAccountComments,
  useAccountVotes,
  useAccountVote,
  UseAccountCommentsOptions,
  UseAccountCommentsFilter
} from './hooks/accounts'

const hooks = {
  AccountsProvider,
  AccountsContext,
  useAccount,
  useAccounts,
  useAccountsActions,
  useAccountComments,
  useAccountVotes,
  useAccountVote
}

export {
  AccountsProvider,
  AccountsContext,
  useAccount,
  useAccounts,
  useAccountsActions,
  useAccountComments,
  useAccountVotes,
  useAccountVote,
  UseAccountCommentsOptions,
  UseAccountCommentsFilter
}

export default hooks
