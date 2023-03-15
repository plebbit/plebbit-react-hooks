import {useEffect, useState, useMemo} from 'react'
import {Comment} from '../../types'
import {useComments} from '../comments'
import utils from '../../lib/utils'

export const useAuthorLastCommentCid = (authorAddress?: string, comments?: (Comment | undefined)[], accountName?: string) => {
  // get all unique subplebbit.lastCommentCid from comments
  const subplebbitLastCommentCids: string[] = useMemo(() => {
    // don't bother fetching anything if no authorAddress
    if (!authorAddress || !comments?.length) {
      return []
    }

    // 2 comment in the same sub can have different lastCommentCid if a CommentUpdate is stale
    // only fetch the lastCommentCid with the latest updatedAt
    const subplebbitLastCommentUpdatedAt: {[subplebbitAddress: string]: number} = {}
    for (const comment of comments) {
      // no last comment cid to use
      if (!comment?.subplebbitAddress || comment?.author?.subplebbit?.lastCommentCid) {
        continue
      }
      if ((comment?.updatedAt || 0) > (subplebbitLastCommentUpdatedAt[comment.subplebbitAddress] || 0)) {
        subplebbitLastCommentUpdatedAt[comment.subplebbitAddress] = comment?.updatedAt
      }
    }

    // find all unique and most recently updated lastCommentCids
    const subplebbitLastCommentCidsSet = new Set<string>()
    for (const comment of comments) {
      const lastCommentCid = comment?.author?.subplebbit?.lastCommentCid
      if (!lastCommentCid) {
        continue
      }
      // another more recently updated comment in the same sub exists
      if (subplebbitLastCommentUpdatedAt[comment.subplebbitAddress] || 0 > comment?.updatedAt || 0) {
        continue
      }
      subplebbitLastCommentCidsSet.add(lastCommentCid)
    }
    return [...subplebbitLastCommentCidsSet]
  }, [authorAddress, comments])

  const lastSubplebbitComments = useComments({commentCids: subplebbitLastCommentCids, accountName})

  // find the comment with the most recent timestamp
  const lastComment = useMemo(() => {
    // without author address, can't confirm if a comment is from the correct author
    if (!authorAddress) {
      return
    }

    let lastComment
    for (const comment of lastSubplebbitComments.comments) {
      // subplebbit provided a comment with the wrong author in author.subplebbit.lastCommentCid
      if (comment?.author?.address !== authorAddress) {
        continue
      }

      // comment is the last so far
      if ((comment?.timestamp || 0) > (lastComment?.timestamp || 0)) {
        lastComment = comment
      }
    }

    // make sure lastComment is newer than all comments provided in the argument
    if (lastComment) {
      for (const comment of comments || []) {
        // the lastComment is already in the argument, which is ok
        if (comment?.cid === lastComment?.cid) {
          break
        }

        // a comment in the argument is more recent, so there's no point defining lastComment
        if ((comment?.timestamp || 0) > lastComment.timestamp || 0) {
          lastComment = undefined
          break
        }
      }
    }

    return lastComment
  }, [authorAddress, lastSubplebbitComments.comments])

  return lastComment?.cid
}

// cache JSON.stringify for filter because it's used a lot
const stringifyFilter = utils.memoSync(JSON.stringify, {maxSize: 100})

export const getAuthorCommentsOptionsName = (authorAddress: string, filter: AuthorCommentsFilter | undefined, accountId: string) => {
  // if filter is an object, stringify it (cached with memo)
  if (filter) {
    filter = stringifyFilter(filter)
  }
  return authorAddress + '-' + filter + '-' + accountId
}
