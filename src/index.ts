import polyfill from './lib/polyfill'
polyfill()

// fix DEBUG_DEPTH bug https://github.com/debug-js/debug/issues/746
try {
  if (process.env.DEBUG_DEPTH) {
    require('util').inspect.defaultOptions.depth = process.env.DEBUG_DEPTH
  }
} catch (e) {}

import {setPlebbitJs, restorePlebbitJs} from './lib/plebbit-js'
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

import {useSubscribe, useBlock, usePublishComment, usePublishVote, useCreateSubplebbit, usePublishCommentEdit} from './hooks/actions'

import {useComment, useComments} from './hooks/comments'
import {useSubplebbit, useSubplebbits, useSubplebbitMetrics, useResolvedSubplebbitAddress} from './hooks/subplebbits'
import {useFeed, useBufferedFeeds} from './hooks/feeds'
import {useAuthorAvatarImageUrl, useResolvedAuthorAddress} from './hooks/authors'
import debugUtils from './lib/debug-utils'

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
  useAccountNotifications,
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
  useCreateSubplebbit,
  // utils
  setPlebbitJs,
  restorePlebbitJs,
  debugUtils,
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
  useAccountNotifications,
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
  useCreateSubplebbit,
  usePublishVote,
  usePublishCommentEdit,
  // utils
  setPlebbitJs,
  restorePlebbitJs,
  debugUtils,
}

export default hooks
