import {AccountPublicationsFilter, Comment, Comments, AuthorCommentsFilter} from '../../types'
import {commentsPerPage} from './authors-comments-store'
import assert from 'assert'

export const getUpdatedLoadedAndBufferedComments = (
  loadedComments: Comment[],
  bufferedComments: Comment[],
  pageNumber: number,
  filter: AccountPublicationsFilter,
  comments: Comments
) => {
  // get previous loaded comment cids
  const previousLoadedCommentCids: {[commentCid: string]: boolean} = {}
  for (const comment of loadedComments) {
    previousLoadedCommentCids[comment.cid] = true
  }

  // filter buffered comments
  // let newBufferedComments = filter(filter)

  // get buffered comments without loaded cids
  let newBufferedComments = bufferedComments.filter((comment) => !previousLoadedCommentCids[comment.cid])

  // sort buffered comments by timestamp (newest first)
  newBufferedComments.sort((a, b) => b.timestamp - a.timestamp)

  // append the (new updated) loaded comments to buffered comments
  for (const comment of [...loadedComments].reverse()) {
    const updatedComment = comments[comment.cid]
    newBufferedComments.unshift(updatedComment)
  }

  // create new loaded comments using the page number and buffered comments
  let newLoadedComments = newBufferedComments.slice(0, pageNumber * commentsPerPage)

  // check if loadedComments and buffered comments have changed
  // don't return a new object if there's no change, to avoid rerender
  if (!commentsHaveChanged(loadedComments, newLoadedComments)) {
    newLoadedComments = loadedComments
  }
  if (!commentsHaveChanged(bufferedComments, newBufferedComments)) {
    newBufferedComments = bufferedComments
  }

  return {loadedComments: newLoadedComments, bufferedComments: newBufferedComments}
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

export const filterAuthorComments = (authorComments: Comment[], filter: AuthorCommentsFilter) => {
  assert(
    !filter.subplebbitAddresses || Array.isArray(filter.subplebbitAddresses),
    `authorsCommentsStore filterAuthorComments invalid argument filter.subplebbitAddresses '${filter.subplebbitAddresses}' not an array`
  )
  const filtered = []
  for (const authorComment of authorComments) {
    let isFilteredOut = false
    if (filter.subplebbitAddresses?.length && !filter.subplebbitAddresses.includes(authorComment.subplebbitAddress)) {
      isFilteredOut = true
    }
    if (typeof filter.hasParentCid === 'boolean' && filter.hasParentCid !== Boolean(authorComment.parentCid)) {
      isFilteredOut = true
    }
    if (!isFilteredOut) {
      filtered.push(authorComment)
    }
  }
  return filtered
}
