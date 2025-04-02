import {useEffect, useState, useMemo} from 'react'
import {useAccount} from './accounts'
import validator from '../lib/validator'
import Logger from '@plebbit/plebbit-logger'
const log = Logger('plebbit-react-hooks:replies:hooks')
import assert from 'assert'
import {Comment, UseRepliesOptions, UseRepliesResult, CommentsFilter} from '../types'
import useRepliesStore, {RepliesState} from '../stores/replies'
import shallow from 'zustand/shallow'

export function useReplies(options?: UseRepliesOptions): UseRepliesResult {
  assert(!options || typeof options === 'object', `useReplies options argument '${options}' not an object`)
  let {comment, sortType, accountName, flat, accountComments, repliesPerPage, filter} = options || {}
  if (!sortType) {
    sortType = 'best'
  }
  if (flat === undefined || flat === null) {
    flat = false
  }
  if (accountComments === undefined || accountComments === null) {
    accountComments = true
  }

  validator.validateUseRepliesArguments(comment?.cid, sortType, accountName, flat, accountComments, repliesPerPage, filter)
  const account = useAccount({accountName})
  const addFeedToStoreOrUpdateComment = useRepliesStore((state: RepliesState) => state.addFeedToStoreOrUpdateComment)
  const incrementFeedPageNumber = useRepliesStore((state: RepliesState) => state.incrementFeedPageNumber)
  const resetFeed = useRepliesStore((state: RepliesState) => state.resetFeed)
  const repliesFeedName = useRepliesFeedName(account?.id, comment?.cid, sortType, flat, accountComments, repliesPerPage, filter)
  const [errors, setErrors] = useState<Error[]>([])

  // add replies to store
  useEffect(() => {
    if (!comment?.cid || !account || !comment) {
      return
    }
    addFeedToStoreOrUpdateComment(repliesFeedName, comment, sortType, account, flat, accountComments, repliesPerPage, filter).catch((error: unknown) =>
      log.error('useReplies addFeedToStoreOrUpdateComment error', {repliesFeedName, error})
    )
  }, [repliesFeedName, comment])

  const replies = useRepliesStore((state: RepliesState) => state.loadedFeeds[repliesFeedName || ''])
  const bufferedReplies = useRepliesStore((state: RepliesState) => state.bufferedFeeds[repliesFeedName || ''])
  const updatedReplies = useRepliesStore((state: RepliesState) => state.updatedFeeds[repliesFeedName || ''])
  let hasMore = useRepliesStore((state: RepliesState) => state.feedsHaveMore[repliesFeedName || ''])
  // if the replies is not yet defined, then it has more
  if (!repliesFeedName || typeof hasMore !== 'boolean') {
    hasMore = true
  }
  // if the replies is not yet defined, but no comment, doesn't have more
  if (!comment) {
    hasMore = false
  }

  const loadMore = async () => {
    try {
      if (!comment?.cid || !account) {
        throw Error('useReplies cannot load more replies not initalized yet')
      }
      incrementFeedPageNumber(repliesFeedName)
    } catch (e: any) {
      // wait 100 ms so infinite scroll doesn't spam this function
      await new Promise((r) => setTimeout(r, 50))
      setErrors([...errors, e])
    }
  }

  const reset = async () => {
    try {
      if (!comment?.cid || !account) {
        throw Error('useReplies cannot reset replies not initalized yet')
      }
      resetFeed(repliesFeedName)
    } catch (e: any) {
      // wait 100 ms so infinite scroll doesn't spam this function
      await new Promise((r) => setTimeout(r, 50))
      setErrors([...errors, e])
    }
  }

  if (account && comment?.cid) {
    log('useReplies', {
      repliesLength: replies?.length || 0,
      hasMore,
      commentCid: comment.cid,
      sortType,
      account,
      repliesStoreOptions: useRepliesStore.getState().feedsOptions,
      repliesStore: useRepliesStore.getState(),
    })
  }

  const state = !hasMore ? 'succeeded' : 'fetching'

  return useMemo(
    () => ({
      replies: replies || [],
      bufferedReplies: bufferedReplies || [],
      updatedReplies: updatedReplies || [],
      hasMore,
      loadMore,
      reset,
      state,
      error: errors[errors.length - 1],
      errors,
    }),
    [replies, bufferedReplies, updatedReplies, repliesFeedName, hasMore, errors]
  )
}

function useRepliesFeedName(
  accountId: string,
  commentCid: string | undefined,
  sortType: string,
  flat?: boolean,
  accountComments?: boolean,
  repliesPerPage?: number,
  filter?: CommentsFilter
) {
  return useMemo(() => {
    return accountId + '-' + commentCid + '-' + sortType + '-' + flat + '-' + accountComments + '-' + repliesPerPage + '-' + filter?.key
  }, [accountId, commentCid, sortType, flat, accountComments, repliesPerPage, filter?.key])
}
