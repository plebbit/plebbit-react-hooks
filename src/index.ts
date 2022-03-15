// fix DEBUG_DEPTH bug https://github.com/debug-js/debug/issues/746
if (process?.env?.DEBUG_DEPTH) {
  require("util").inspect.defaultOptions.depth = process.env.DEBUG_DEPTH
}

import PlebbitProvider from './providers/plebbit-provider'
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
import { useFeed } from './hooks/feeds'

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
  useSubplebbits,
  useFeed
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
  useFeed,
  // types
  UseAccountCommentsOptions,
  UseAccountCommentsFilter,
}

export default hooks
