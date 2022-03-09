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
  UseAccountCommentsFilter,
} from './hooks/accounts'

import { useComment, useComments } from './hooks/comments'
import { useSubplebbit, useSubplebbits } from './hooks/subplebbits'

const hooks = {
  PlebbitProvider,
  useAccount,
  useAccounts,
  useAccountsActions,
  useAccountComments,
  useAccountVotes,
  useAccountVote,
  useComment,
  useSubplebbit, 
  useSubplebbits
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
  useSubplebbit, 
  useSubplebbits,
  // types
  UseAccountCommentsOptions,
  UseAccountCommentsFilter,
}

export default hooks
