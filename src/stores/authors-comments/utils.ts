import {AccountPublicationsFilter, Comment, Comments, AuthorCommentsFilter} from '../../types'
import {commentsPerPage} from './authors-comments-store'
import assert from 'assert'
import commentsStore from '../comments'

export const getUpdatedLoadedComments = (
  loadedComments: Comment[],
  bufferedComments: Comment[],
  pageNumber: number,
  filter: AccountPublicationsFilter | undefined,
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

  return newLoadedComments
}

export const getUpdatedBufferedComments = (loadedComments: Comment[], bufferedComments: Comment[], filter: AccountPublicationsFilter | undefined, comments: Comments) => {
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

export const getSubplebbitLastCommentCids = (authorAddress: string, comments: Comment[]) => {
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

// export const getAuthorLastComment = (authorAddress: string, lastSubplebbitComments: Comment[], bufferedComments: Comment[]) => {
//   // without author address, can't confirm if a comment is from the correct author
//   if (!authorAddress) {
//     return
//   }

//   let lastComment
//   for (const comment of lastSubplebbitComments) {
//     // subplebbit provided a comment with the wrong author in author.subplebbit.lastCommentCid
//     if (comment?.author?.address !== authorAddress) {
//       continue
//     }

//     // comment is the last so far
//     if ((comment?.timestamp || 0) > (lastComment?.timestamp || 0)) {
//       lastComment = comment
//     }
//   }

//   // make sure lastComment is newer than all comments provided in the argument
//   if (lastComment) {
//     for (const comment of bufferedComments || []) {
//       // the lastComment is already in the argument, which is ok
//       if (comment?.cid === lastComment?.cid) {
//         break
//       }

//       // a comment in the argument is more recent, so there's no point defining lastComment
//       if ((comment?.timestamp || 0) > lastComment.timestamp || 0) {
//         lastComment = undefined
//         break
//       }
//     }
//   }

//   return lastComment
// }

// util for debugging sizes of object of arrays/sets
export const toSizes = (obj: {[key: string]: any}) => {
  const newObj: {[key: string]: number} = {}
  for (const i in obj) {
    newObj[i] = obj[i].length || obj[i].size
  }
  return newObj
}
