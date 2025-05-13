import {useEffect, useState, useMemo} from 'react'
import {useAccount} from './accounts'
import validator from '../lib/validator'
import Logger from '@plebbit/plebbit-logger'
const log = Logger('plebbit-react-hooks:replies:hooks')
import assert from 'assert'
import {Comment, UseRepliesOptions, UseRepliesResult, CommentsFilter} from '../types'
import useRepliesStore, {RepliesState, feedOptionsToFeedName} from '../stores/replies'
import shallow from 'zustand/shallow'

export function useReplies(options?: UseRepliesOptions): UseRepliesResult {
  assert(!options || typeof options === 'object', `useReplies options argument '${options}' not an object`)
  let {comment, sortType, accountName, flat, flatDepth, accountComments, repliesPerPage, filter, streamPage} = options || {}
  if (!sortType) {
    sortType = 'best'
  }
  if (typeof flatDepth !== 'number') {
    flatDepth = 0
  }
  const invalidFlatDepth = flat && typeof comment?.depth === 'number' && flatDepth !== comment.depth
  validator.validateUseRepliesArguments(comment, sortType, accountName, flat, accountComments, repliesPerPage, filter)

  const [errors, setErrors] = useState<Error[]>([])

  // add replies to store
  const account = useAccount({accountName})
  const feedOptions = {commentCid: comment?.cid, commentDepth: comment?.depth, sortType, accountId: account?.id, repliesPerPage, flat, accountComments, filter, streamPage}
  const repliesFeedName = feedOptionsToFeedName(feedOptions)
  const addFeedToStoreOrUpdateComment = useRepliesStore((state: RepliesState) => state.addFeedToStoreOrUpdateComment)
  useEffect(() => {
    if (!comment?.cid || !account || invalidFlatDepth) {
      return
    }
    addFeedToStoreOrUpdateComment(comment, feedOptions).catch((error: unknown) =>
      log.error('useReplies addFeedToStoreOrUpdateComment error', {repliesFeedName, comment, feedOptions, error})
    )
  }, [repliesFeedName, comment])

  let replies = useRepliesStore((state: RepliesState) => state.loadedFeeds[repliesFeedName || ''])
  let bufferedReplies = useRepliesStore((state: RepliesState) => state.bufferedFeeds[repliesFeedName || ''])
  let updatedReplies = useRepliesStore((state: RepliesState) => state.updatedFeeds[repliesFeedName || ''])
  let hasMore = useRepliesStore((state: RepliesState) => state.feedsHaveMore[repliesFeedName || ''])
  // if the replies is not yet defined, then it has more
  if (!repliesFeedName || typeof hasMore !== 'boolean') {
    hasMore = true
  }
  // if the replies is not yet defined, but no comment, doesn't have more
  if (!comment) {
    hasMore = false
  }

  const incrementFeedPageNumber = useRepliesStore((state: RepliesState) => state.incrementFeedPageNumber)
  let loadMore = async () => {
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

  const resetFeed = useRepliesStore((state: RepliesState) => state.resetFeed)
  let reset = async () => {
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

  // don't display nested replies when flat
  // to start flat replies at a depth other than 0, e.g. a twitter reply thread, change flatDepth
  if (invalidFlatDepth) {
    replies = emptyArray
    bufferedReplies = emptyArray
    updatedReplies = emptyArray
    hasMore = false
    loadMore = emptyFunction
    reset = emptyFunction
  }

  if (account && comment?.cid) {
    log('useReplies', {
      repliesLength: replies?.length || 0,
      hasMore,
      comment,
      sortType,
      flat,
      flatDepth,
      repliesStoreOptions: useRepliesStore.getState().feedsOptions,
      repliesStore: useRepliesStore.getState(),
      invalidFlatDepth,
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

const emptyArray: any = []
const emptyFunction = async () => {}
