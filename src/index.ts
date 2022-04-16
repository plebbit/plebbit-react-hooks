// fix DEBUG_DEPTH bug https://github.com/debug-js/debug/issues/746
try {
  if (process?.env?.DEBUG_DEPTH) {
    require('util').inspect.defaultOptions.depth = process.env.DEBUG_DEPTH
  }
} catch (e) {}

import PlebbitProvider from './providers/plebbit-provider'
import {
  useAccount,
  useAccounts,
  useAccountsActions,
  useAccountComments,
  useAccountVotes,
  useAccountVote,
  useAccountNotifications,
} from './hooks/accounts'

import { useComment, useComments } from './hooks/comments'
import { useSubplebbit, useSubplebbits } from './hooks/subplebbits'
import { useFeed, useBufferedFeeds } from './hooks/feeds'
import debugUtils from './lib/debug-utils'

export * from './types'

export {
  PlebbitProvider,
  useAccount,
  useAccounts,
  useAccountsActions,
  useAccountComments,
  useAccountVotes,
  useAccountVote,
  useAccountNotifications,
  useComment,
  useComments,
  useSubplebbit,
  useSubplebbits,
  useFeed,
  useBufferedFeeds,
}

const hooks = {
  PlebbitProvider,
  useAccount,
  useAccounts,
  useAccountsActions,
  useAccountComments,
  useAccountVotes,
  useAccountVote,
  useAccountNotifications,
  useComment,
  useSubplebbit,
  useSubplebbits,
  useFeed,
  useBufferedFeeds,
}

export default hooks
