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

import {
  useComment,
  useComments
} from './hooks/comments'

const hooks = {
  PlebbitProvider,
  useAccount,
  useAccounts,
  useAccountsActions,
  useAccountComments,
  useAccountVotes,
  useAccountVote,
  useComment
}

export {
  PlebbitProvider,
  useAccount,
  useAccounts,
  useAccountsActions,
  useAccountComments,
  useAccountVotes,
  useAccountVote,
  useComment,
  useComments,

  // types
  UseAccountCommentsOptions,
  UseAccountCommentsFilter
}

export default hooks
