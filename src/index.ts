import PlebbitProvider from './providers/PlebbitProvider'
import {
  useAccount,
  useAccounts,
  useAccountsActions,
  useAccountComments,
  useAccountVotes,
  useAccountVote,

  // types
  UseAccountCommentsOptions,
  UseAccountCommentsFilter
} from './hooks/accounts'

const hooks = {
  PlebbitProvider,
  useAccount,
  useAccounts,
  useAccountsActions,
  useAccountComments,
  useAccountVotes,
  useAccountVote
}

export {
  PlebbitProvider,
  useAccount,
  useAccounts,
  useAccountsActions,
  useAccountComments,
  useAccountVotes,
  useAccountVote,

  // types
  UseAccountCommentsOptions,
  UseAccountCommentsFilter
}

export default hooks
