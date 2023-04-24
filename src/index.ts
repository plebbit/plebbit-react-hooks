import polyfill from './lib/polyfill'
polyfill()

// fix DEBUG_DEPTH bug https://github.com/debug-js/debug/issues/746
try {
  if (process.env.DEBUG_DEPTH) {
    require('util').inspect.defaultOptions.depth = process.env.DEBUG_DEPTH
  }
  if (process.env.DEBUG_ARRAY) {
    require('util').inspect.defaultOptions.maxArrayLength = null
  }
} catch (e) {}

// accounts
import {
  useAccount,
  useAccounts,
  useAccountComment,
  useAccountComments,
  useAccountVotes,
  useAccountVote,
  useAccountEdits,
  useEditedComment,
  useNotifications,
  useAccountSubplebbits,
  usePubsubSubscribe,
} from './hooks/accounts'

// comments
import {useComment, useComments} from './hooks/comments'

// subplebbits
import {useSubplebbit, useSubplebbits, useSubplebbitStats, useResolvedSubplebbitAddress} from './hooks/subplebbits'

// feeds
import {useFeed, useBufferedFeeds} from './hooks/feeds'

// authors
import {useAuthor, useAuthorComments, useAuthorAvatar, useResolvedAuthorAddress} from './hooks/authors'

// actions
import {useSubscribe, useBlock, usePublishComment, usePublishVote, useCreateSubplebbit, usePublishCommentEdit, usePublishSubplebbitEdit} from './hooks/actions'

// actions that don't have their own hooks yet
import {
  createAccount,
  deleteAccount,
  setAccount,
  setActiveAccount,
  setAccountsOrder,
  importAccount,
  exportAccount,
  deleteSubplebbit,
} from './stores/accounts/accounts-actions'

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
  useAccountEdits,
  useAccountSubplebbits,
  useNotifications,
  usePubsubSubscribe,
  // comments
  useComment,
  useComments,
  useEditedComment,
  // subplebbits
  useSubplebbit,
  useSubplebbits,
  useSubplebbitStats,
  useResolvedSubplebbitAddress,
  // authors
  useAuthor,
  useAuthorComments,
  useAuthorAvatar,
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
  setAccount,
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
  useAccountEdits,
  useAccountSubplebbits,
  useNotifications,
  usePubsubSubscribe,
  // comments
  useComment,
  useComments,
  useEditedComment,
  // subplebbits
  useSubplebbit,
  useSubplebbits,
  useSubplebbitStats,
  useResolvedSubplebbitAddress,
  // authors
  useAuthor,
  useAuthorComments,
  useAuthorAvatar,
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
  setAccount,
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
