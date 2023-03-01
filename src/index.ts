import polyfill from './lib/polyfill'
polyfill()

// fix DEBUG_DEPTH bug https://github.com/debug-js/debug/issues/746
try {
  if (process.env.DEBUG_DEPTH) {
    require('util').inspect.defaultOptions.depth = process.env.DEBUG_DEPTH
  }
} catch (e) {}

import {setPlebbitJs, restorePlebbitJs} from './lib/plebbit-js'
import {useAccount, useAccounts, useAccountsActions, useAccountComments, useAccountVotes, useAccountVote, useNotifications, useAccountSubplebbits} from './hooks/accounts'

import {useSubscribe, useBlock, usePublishComment, usePublishVote, useCreateSubplebbit, usePublishCommentEdit, usePublishSubplebbitEdit} from './hooks/actions'

import {useComment, useComments} from './hooks/comments'
import {useSubplebbit, useSubplebbits, useSubplebbitMetrics, useResolvedSubplebbitAddress} from './hooks/subplebbits'
import {useFeed, useBufferedFeeds} from './hooks/feeds'
import {useAuthorAvatarImageUrl, useResolvedAuthorAddress} from './hooks/authors'
import {deleteDatabases, deleteCaches} from './lib/debug-utils'

export * from './types'

// IMPORTANT: should be the same as 'export default hooks'
export {
  // accounts
  useAccount,
  useAccounts,
  useAccountsActions,
  useAccountComments,
  useAccountVotes,
  useAccountVote,
  useAccountSubplebbits,
  useNotifications,
  // comments
  useComment,
  useComments,
  // subplebbits
  useSubplebbit,
  useSubplebbits,
  useSubplebbitMetrics,
  useResolvedSubplebbitAddress,
  // authors
  useAuthorAvatarImageUrl,
  useResolvedAuthorAddress,
  // feeds
  useFeed,
  useBufferedFeeds,
  // actions
  useSubscribe,
  useBlock,
  usePublishComment,
  usePublishVote,
  usePublishCommentEdit,
  usePublishSubplebbitEdit,
  useCreateSubplebbit,
  // utils
  setPlebbitJs,
  restorePlebbitJs,
  deleteDatabases,
  deleteCaches,
}

// IMPORTANT: should be the same as 'export {}'
const hooks = {
  // accounts
  useAccount,
  useAccounts,
  useAccountsActions,
  useAccountComments,
  useAccountVotes,
  useAccountVote,
  useAccountSubplebbits,
  useNotifications,
  // comments
  useComment,
  useComments,
  // subplebbits
  useSubplebbit,
  useSubplebbits,
  useSubplebbitMetrics,
  useResolvedSubplebbitAddress,
  // authors
  useAuthorAvatarImageUrl,
  useResolvedAuthorAddress,
  // feeds
  useFeed,
  useBufferedFeeds,
  // actions
  useSubscribe,
  useBlock,
  usePublishComment,
  usePublishVote,
  usePublishCommentEdit,
  usePublishSubplebbitEdit,
  useCreateSubplebbit,
  // utils
  setPlebbitJs,
  restorePlebbitJs,
  deleteDatabases,
  deleteCaches,
}

export default hooks
