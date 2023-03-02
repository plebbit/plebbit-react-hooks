import polyfill from './lib/polyfill'
polyfill()

// fix DEBUG_DEPTH bug https://github.com/debug-js/debug/issues/746
try {
  if (process.env.DEBUG_DEPTH) {
    require('util').inspect.defaultOptions.depth = process.env.DEBUG_DEPTH
  }
} catch (e) {}

// accounts
import {useAccount, useAccounts, useAccountComment, useAccountComments, useAccountVotes, useAccountVote, useNotifications, useAccountSubplebbits} from './hooks/accounts'

// actions
import {useSubscribe, useBlock, usePublishComment, usePublishVote, useCreateSubplebbit, usePublishCommentEdit, usePublishSubplebbitEdit} from './hooks/actions'

// actions that don't have their own hooks yet
import {createAccount, deleteAccount, setActiveAccount, setAccountsOrder, importAccount, exportAccount, deleteSubplebbit} from './stores/accounts/accounts-actions'

// comments
import {useComment, useComments} from './hooks/comments'

// subplebbits
import {useSubplebbit, useSubplebbits, useSubplebbitMetrics, useResolvedSubplebbitAddress} from './hooks/subplebbits'

// feeds
import {useFeed, useBufferedFeeds} from './hooks/feeds'

// authors
import {useAuthorAvatarImageUrl, useResolvedAuthorAddress} from './hooks/authors'

// utils
import {setPlebbitJs, restorePlebbitJs} from './lib/plebbit-js'
import {deleteDatabases, deleteCaches} from './lib/debug-utils'

// types
export * from './types'

// IMPORTANT: should be the same as 'export default hooks'
export {
  // accounts
  useAccount,
  useAccounts,
  useAccountComment,
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
  // actions that don't have their own hooks yet
  createAccount,
  deleteAccount,
  setActiveAccount,
  setAccountsOrder,
  importAccount,
  exportAccount,
  deleteSubplebbit,
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
  useAccountComment,
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
  // actions that don't have their own hooks yet
  createAccount,
  deleteAccount,
  setActiveAccount,
  setAccountsOrder,
  importAccount,
  exportAccount,
  deleteSubplebbit,
  // utils
  setPlebbitJs,
  restorePlebbitJs,
  deleteDatabases,
  deleteCaches,
}

export default hooks
