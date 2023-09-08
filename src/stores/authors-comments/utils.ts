import {Comment, Comments, CommentsFilter} from '../../types'
import {commentsPerPage} from './authors-comments-store'
import assert from 'assert'
import commentsStore from '../comments'

export const getUpdatedLoadedAndBufferedComments = (
  loadedComments: Comment[],
  bufferedComments: Comment[],
  pageNumber: number,
  filter: CommentsFilter | undefined,
  comments: Comments
) => {
  const newBufferedComments = getUpdatedBufferedComments(loadedComments, bufferedComments, filter, comments)

  // create new loaded comments using the page number and buffered comments
  let newLoadedComments = newBufferedComments.slice(0, pageNumber * commentsPerPage)

  // check if loadedComments have changed
  // don't return a new object if there's no change, to avoid rerender
  if (!commentsHaveChanged(loadedComments, newLoadedComments)) {
    newLoadedComments = loadedComments
  }

  return {loadedComments: newLoadedComments, bufferedComments: newBufferedComments}
}

export const getUpdatedBufferedComments = (loadedComments: Comment[], bufferedComments: Comment[], filter: CommentsFilter | undefined, comments: Comments) => {
  // get previous loaded comment cids
  const previousLoadedCommentCids: {[commentCid: string]: boolean} = {}
  for (const comment of loadedComments) {
    previousLoadedCommentCids[comment.cid] = true
  }

  // get buffered comments without loaded cids
  let newBufferedComments = bufferedComments.filter((comment) => !previousLoadedCommentCids[comment.cid])

  // filter buffered comments
  if (filter) {
    newBufferedComments = newBufferedComments.filter(filter)
  }

  // sort buffered comments by timestamp (newest first)
  newBufferedComments.sort((a, b) => b.timestamp - a.timestamp)

  // append the (new updated) loaded comments to buffered comments
  for (const comment of [...loadedComments].reverse()) {
    const updatedComment = comments[comment.cid]
    newBufferedComments.unshift(updatedComment)
  }

  // no need to check if comments have changed because getUpdatedBufferedComments
  // is not used anywhere outside of tests

  return newBufferedComments
}

const commentsHaveChanged = (comments1: Comment[], comments2: Comment[]) => {
  if (comments1 === comments2) {
    return false
  }
  if (comments1.length !== comments2.length) {
    return true
  }
  for (const i in comments1) {
    if (comments1[i] !== comments2[i]) {
      return true
    }
  }
  return false
}

// if comment already exist, find the actual nextCidToFetch
// can happen if a more recent lastCommentCid becomes nextCommentCidToFetch
export const getNextCommentCidToFetchNotFetched = (nextCommentCidToFetch: string | undefined) => {
  const {comments} = commentsStore.getState()
  let nextCommentCidToFetchNotFetched = nextCommentCidToFetch
  // scroll through comments until the comment doesn't exist, which means hasn't been fetched yet
  let maxAttempt = 99999999
  while (true) {
    // can't happen in production because of hashing, but can happen in tests
    if (!maxAttempt--) {
      throw Error(`getNextCommentCidToFetchNotFetched '${nextCommentCidToFetch}' infinite loop`)
    }
    const comment = comments[nextCommentCidToFetchNotFetched || '']
    if (!comment) {
      break
    }
    nextCommentCidToFetchNotFetched = comment.author?.previousCommentCid
  }
  return nextCommentCidToFetchNotFetched
}

// util for debugging sizes of object of arrays/sets
export const toSizes = (obj: {[key: string]: any}) => {
  const newObj: {[key: string]: number} = {}
  for (const i in obj) {
    newObj[i] = obj[i].length ?? obj[i].size
  }
  return newObj
}
