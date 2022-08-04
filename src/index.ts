import polyfill from './lib/polyfill'
polyfill()

// fix DEBUG_DEPTH bug https://github.com/debug-js/debug/issues/746
try {
  if (process.env.DEBUG_DEPTH) {
    require('util').inspect.defaultOptions.depth = process.env.DEBUG_DEPTH
  }
} catch (e) {}

import {setPlebbitJs, restorePlebbitJs} from './lib/plebbit-js'
import PlebbitProvider from './providers/plebbit'
import {
  useAccount,
  useAccounts,
  useAccountsActions,
  useAccountComments,
  useAccountVotes,
  useAccountVote,
  useAccountNotifications,
  useAccountSubplebbits,
} from './hooks/accounts'

import {useComment, useComments} from './hooks/comments'
import {useSubplebbit, useSubplebbits, useResolvedSubplebbitAddress} from './hooks/subplebbits'
import {useFeed, useBufferedFeeds} from './hooks/feeds'
import {useAuthorAvatarImageUrl, useResolvedAuthorAddress} from './hooks/authors'
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
  useAccountSubplebbits,
  useAccountNotifications,
  useComment,
  useComments,
  useSubplebbit,
  useSubplebbits,
  useFeed,
  useBufferedFeeds,
  setPlebbitJs,
  restorePlebbitJs,
  useAuthorAvatarImageUrl,
  useResolvedAuthorAddress,
  useResolvedSubplebbitAddress,
  debugUtils,
}

const hooks = {
  PlebbitProvider,
  useAccount,
  useAccounts,
  useAccountsActions,
  useAccountComments,
  useAccountVotes,
  useAccountVote,
  useAccountSubplebbits,
  useAccountNotifications,
  useComment,
  useSubplebbit,
  useSubplebbits,
  useFeed,
  useBufferedFeeds,
  setPlebbitJs,
  debugUtils,
}

export default hooks
