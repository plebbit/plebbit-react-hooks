import Logger from '@plebbit/plebbit-logger'
const log = Logger('plebbit-react-hooks:authors:stores')
import createStore from 'zustand'
import assert from 'assert'
import {CommentsFilter, AuthorCommentsOptions, AuthorsComments, Account, Comment} from '../../types'
import commentsStore, {CommentsState} from '../comments'
import QuickLru from 'quick-lru'
import {toSizes, getUpdatedLoadedAndBufferedComments, getNextCommentCidToFetchNotFetched} from './utils'
import accountsStore from '../accounts'

// reddit loads approximately 25 posts per page while infinite scrolling
export const commentsPerPage = 25
// keep large buffer because fetching cids is slow
export const commentBufferSize = 50

export type AuthorsCommentsState = {
  // authorCommentsName is a string used a key to represent authorAddress + filter + accountId
  options: {[authorCommentsName: string]: AuthorCommentsOptions}
  loadedComments: {[authorCommentsName: string]: Comment[]}
  hasMoreBufferedComments: {[authorCommentsName: string]: boolean}
  bufferedCommentCids: {[authorAddress: string]: Set<string>}
  nextCommentCidsToFetch: {[authorAddress: string]: string | undefined}
  shouldFetchNextComment: {[authorAddress: string]: boolean}
  lastCommentCids: {[authorAddress: string]: string | undefined}
  addAuthorCommentsToStore: Function
  setNextCommentCidsToFetch: Function
  incrementPageNumber: Function
  addBufferedCommentCid: Function
  updateLoadedComments: Function
  setLastCommentCid: Function
}

const authorsCommentsStore = createStore<AuthorsCommentsState>((setState: Function, getState: Function) => ({
  options: {},
  loadedComments: {},
  hasMoreBufferedComments: {},
  bufferedCommentCids: {},
  lastCommentCids: {},
  nextCommentCidsToFetch: {},
  shouldFetchNextComment: {},

  addAuthorCommentsToStore: (authorCommentsName: string, authorAddress: string, commentCid: string, filter: CommentsFilter | undefined, account: Account) => {
    assert(
      authorCommentsName && typeof authorCommentsName === 'string',
      `addAuthorCommentsToStore.incrementPageNumber invalid argument authorCommentsName '${authorCommentsName}'`
    )
    assert(authorAddress && typeof authorAddress === 'string', `authorsCommentsStore.addAuthorCommentsToStore invalid argument authorAddress '${authorAddress}'`)
    assert(commentCid && typeof commentCid === 'string', `authorsCommentsStore.addAuthorCommentsToStore invalid argument commentCid '${commentCid}'`)
    assert(!filter || typeof filter === 'function', `authorsCommentsStore.addAuthorCommentsToStore invalid argument filter '${filter}'`)
    assert(typeof account?.plebbit?.getComment === 'function', `authorsCommentsStore.addAuthorCommentsToStore account '${account}' invalid`)

    const {options, updateLoadedComments} = getState()
    // in store already, do nothing
    if (options[authorCommentsName]) {
      return
    }
    const authorCommentsOptions = {authorAddress, pageNumber: 1, filter, accountId: account.id}

    // subscribe to nextCommentCidsToFetch and shouldFetchNextComment to fetch the comments
    authorsCommentsStore.subscribe(fetchCommentOnShouldFetchOrNextCidChange(authorCommentsOptions))

    log('authorsCommentsActions.addAuthorCommentsToStore', {authorCommentsName, authorCommentsOptions, commentCid, previousAuthorsCommentsOptions: options})
    setState((state: AuthorsCommentsState) => ({
      options: {...state.options, [authorCommentsName]: authorCommentsOptions},
      loadedComments: {...state.loadedComments, [authorCommentsName]: []},
      hasMoreBufferedComments: {...state.hasMoreBufferedComments, [authorCommentsName]: true},
      bufferedCommentCids: {...state.bufferedCommentCids, [authorAddress]: state.bufferedCommentCids[authorAddress] || new Set()},
      lastCommentCids: {...state.lastCommentCids, [authorAddress]: state.lastCommentCids[authorAddress] || undefined},
      nextCommentCidsToFetch: {...state.nextCommentCidsToFetch, [authorAddress]: state.nextCommentCidsToFetch[authorAddress] || commentCid},
      shouldFetchNextComment: {...state.shouldFetchNextComment, [authorAddress]: state.shouldFetchNextComment[authorAddress] || true},
    }))

    // update loadedComments in case the author already has bufferedCommentCids
    updateLoadedComments()
  },

  setNextCommentCidsToFetch: (authorAddress: string, authorComment: Comment) => {
    assert(authorAddress && typeof authorAddress === 'string', `authorsCommentsActions.setNextCommentCidsToFetch invalid argument authorAddress '${authorAddress}'`)
    assert(typeof authorComment?.timestamp === 'number', `authorsCommentsActions.setNextCommentCidsToFetch invalid argument authorComment '${authorComment}'`)
    const {nextCommentCidsToFetch, shouldFetchNextComment, lastCommentCids} = getState()
    if (typeof shouldFetchNextComment[authorAddress] !== 'boolean') {
      throw Error(`authorsCommentsActions.setNextCommentCidsToFetch can't set nextCommentCidToFetch '${authorAddress}' not in store`)
    }
    const nextCommentCidToFetch = authorComment?.author?.previousCommentCid
    if (nextCommentCidToFetch === nextCommentCidsToFetch[authorAddress]) {
      throw Error(`authorsCommentsActions.setNextCommentCidsToFetch can't set nextCommentCidToFetch '${authorAddress}' to '${nextCommentCidToFetch}' same value`)
    }
    const nextCommentCidToFetchNotFetched = getNextCommentCidToFetchNotFetched(nextCommentCidToFetch)

    // log.trace('authorsCommentsActions.setNextCommentCidsToFetch', {
    //   authorAddress,
    //   authorComment,
    //   previousNextCommentCidToFetch: nextCommentCidsToFetch[authorAddress],
    //   nextCommentCidToFetch,
    //   nextCommentCidToFetchNotFetched,
    //   lastCommentCid: lastCommentCids[authorAddress],
    //   shouldFetchNextComment: shouldFetchNextComment[authorAddress],
    // })
    setState((state: AuthorsCommentsState) => ({
      nextCommentCidsToFetch: {...state.nextCommentCidsToFetch, [authorAddress]: nextCommentCidToFetchNotFetched},
    }))
  },

  incrementPageNumber: (authorCommentsName: string) => {
    assert(
      authorCommentsName && typeof authorCommentsName === 'string',
      `authorsCommentsActions.incrementPageNumber invalid argument authorCommentsName '${authorCommentsName}'`
    )
    const {options, updateLoadedComments, loadedComments, nextCommentCidsToFetch} = getState()
    if (!options[authorCommentsName]) {
      throw Error(`authorsCommentsActions.incrementPageNumber can't increment page number of options '${authorCommentsName}' not in store`)
    }
    assert(
      options[authorCommentsName].pageNumber * commentsPerPage <= loadedComments[authorCommentsName].length,
      `authorsCommentsActions.incrementPageNumber cannot increment page number before current page has loaded`
    )

    log('authorsCommentsActions.incrementPageNumber', {
      authorCommentsName,
      pageNumber: options[authorCommentsName].pageNumber + 1,
      nextCommentCidsToFetch: nextCommentCidsToFetch[options[authorCommentsName].authorAddress],
    })
    setState(({options}: AuthorsCommentsState) => {
      const authorCommentOptions = {...options[authorCommentsName]}
      authorCommentOptions.pageNumber++
      return {options: {...options, [authorCommentsName]: authorCommentOptions}}
    })

    // must update loadedComments to reflect the new added page
    updateLoadedComments()
  },

  addBufferedCommentCid: (authorAddress: string, commentCid: string) => {
    assert(authorAddress && typeof authorAddress === 'string', `authorsCommentsActions.addBufferedCommentCid invalid argument authorAddress '${authorAddress}'`)
    assert(commentCid && typeof commentCid === 'string', `authorsCommentsActions.addBufferedCommentCid invalid argument commentCid '${commentCid}'`)

    const {bufferedCommentCids} = getState()
    if (!bufferedCommentCids[authorAddress]) {
      throw Error(`authorsCommentsActions.addBufferedCommentCid can't add commentCid '${authorAddress}' not in store`)
    }
    if (bufferedCommentCids[authorAddress].has(commentCid)) {
      throw Error(`authorsCommentsActions.addBufferedCommentCid can't add commentCid '${authorAddress}' '${commentCid}' already added`)
    }

    // log.trace('authorsCommentsActions.addBufferedCommentCid', {authorAddress, commentCid, previousBufferedCommentCidsSize: bufferedCommentCids[authorAddress].size})
    setState((state: AuthorsCommentsState) => ({
      bufferedCommentCids: {...state.bufferedCommentCids, [authorAddress]: new Set([...bufferedCommentCids[authorAddress], commentCid])},
    }))
  },

  updateLoadedComments() {
    const {comments} = commentsStore.getState()
    let {loadedComments: previousAuthorsLoadedComments, bufferedCommentCids, options, nextCommentCidsToFetch, lastCommentCids} = getState()

    const newAuthorsLoadedComments: AuthorsComments = {}
    const newShouldFetchNextComment: {[authorAddress: string]: boolean} = {}
    const newHasMoreBufferedComments: {[authorCommentsName: string]: boolean} = {}
    const authorCommentsNames = Object.keys(options)
    for (const name of authorCommentsNames) {
      const {authorAddress, pageNumber, filter} = options[name]
      const previousLoadedComments = previousAuthorsLoadedComments[name]
      const unfilteredBufferedComments: Comment[] = [...bufferedCommentCids[authorAddress]].map((commentCid: string) => comments[commentCid])

      const {loadedComments, bufferedComments: filteredBufferedComments} = getUpdatedLoadedAndBufferedComments(
        previousLoadedComments,
        unfilteredBufferedComments,
        pageNumber,
        filter,
        comments
      )
      newAuthorsLoadedComments[name] = loadedComments
      newHasMoreBufferedComments[name] = filteredBufferedComments.length > loadedComments.length

      // if another authorCommentOptions should fetch, don't change it
      if (newShouldFetchNextComment[authorAddress] !== true) {
        // fetch if less comments than full page + buffer size
        newShouldFetchNextComment[authorAddress] = filteredBufferedComments.length < pageNumber * commentsPerPage + commentBufferSize
      }
    }

    // log.trace('authorsCommentsActions.updateLoadedComments', {
    //   bufferedCommentCids,
    //   bufferedCommentCidsSizes: toSizes(bufferedCommentCids),
    //   previousAuthorsLoadedComments,
    //   newAuthorsLoadedComments,
    //   previousAuthorsLoadedCommentsSizes: toSizes(previousAuthorsLoadedComments),
    //   newAuthorsLoadedCommentsSizes: toSizes(newAuthorsLoadedComments),
    //   newShouldFetchNextComment,
    //   lastCommentCids
    // })
    setState(() => ({
      loadedComments: newAuthorsLoadedComments,
      shouldFetchNextComment: newShouldFetchNextComment,
      hasMoreBufferedComments: newHasMoreBufferedComments,
    }))
  },

  setLastCommentCid: (authorAddress: string, lastCommentCid: string) => {
    assert(authorAddress && typeof authorAddress === 'string', `authorsCommentsActions.setLastCommentCid invalid argument authorAddress '${authorAddress}'`)
    assert(lastCommentCid && typeof lastCommentCid === 'string', `authorsCommentsActions.setLastCommentCid invalid argument lastCommentCid '${lastCommentCid}'`)
    const {lastCommentCids, shouldFetchNextComment, nextCommentCidsToFetch} = getState()
    if (typeof shouldFetchNextComment[authorAddress] !== 'boolean') {
      throw Error(`authorsCommentsActions.setLastCommentCid can't set lastCommentCid '${authorAddress}' not in store`)
    }
    if (lastCommentCid === lastCommentCids[authorAddress]) {
      throw Error(`authorsCommentsActions.setLastCommentCid can't set setLastCommentCid '${authorAddress}' to '${lastCommentCid}' same value`)
    }

    log('authorsCommentsActions.setLastCommentCid', {
      authorAddress,
      lastCommentCid,
      previousLastCommentCid: lastCommentCids[authorAddress],
      shouldFetchNextComment: shouldFetchNextComment[authorAddress],
      nextCommentCidsToFetch: nextCommentCidsToFetch[authorAddress],
    })
    setState((state: AuthorsCommentsState) => ({
      lastCommentCids: {...state.lastCommentCids, [authorAddress]: lastCommentCid},
    }))
  },
}))

// if nextCommentCidsToFetch or shouldFetchNextComment changed, fetch the next comment
const fetchCommentOnShouldFetchOrNextCidChange = (options: AuthorCommentsOptions) => (state: AuthorsCommentsState) => {
  const nextCommentCidToFetch = state.nextCommentCidsToFetch[options.authorAddress]
  if (!nextCommentCidToFetch) {
    return
  }

  // the buffered comments are already full, not need to fetch next comment
  const shouldFetchNextComment = state.shouldFetchNextComment[options.authorAddress]
  if (!shouldFetchNextComment) {
    return
  }

  // when comment has fetched, update loadedComments, bufferedComments and shouldFetchNextComment
  if (!authorCommentCidsFetching[nextCommentCidToFetch]) {
    authorCommentCidsFetching[nextCommentCidToFetch] = true
    commentsStore.subscribe(updateCommentsOnCommentsChange(options, nextCommentCidToFetch))
  }

  // start fetching comment
  const account = accountsStore.getState().accounts[options.accountId]
  const addCommentToStore = commentsStore.getState().addCommentToStore
  addCommentToStore(nextCommentCidToFetch, account).catch((error: unknown) =>
    log.error('authorsCommentsStore fetchCommentOnShouldFetchOrNextCidChange addCommentToStore error', {error, nextCommentCidToFetch, account})
  )
}

// if commentStore changed, update loadedComments, bufferedCommentCids, shouldFetchNextComment and nextCommentCidsToFetch
let previousComments = new QuickLru({maxSize: 10000})
let authorCommentCidsFetching: {[commentCid: string]: boolean} = {}
let subplebbitLastCommentCidsFetching: {[commentCid: string]: boolean} = {}
const updateCommentsOnCommentsChange = (options: AuthorCommentsOptions, commentCid: string) => (state: CommentsState) => {
  // not a next cid, do nothing
  if (!authorCommentCidsFetching[commentCid]) {
    return
  }
  const comment = state.comments[commentCid]
  // comment hasn't changed, do nothing
  if (!comment?.timestamp || comment === previousComments.get(commentCid)) {
    return
  }
  // comment author address is incorrect, do nothing
  if (comment.author?.address !== options.authorAddress) {
    return
  }
  previousComments.set(commentCid, comment)

  const {addBufferedCommentCid, bufferedCommentCids, updateLoadedComments, setNextCommentCidsToFetch, nextCommentCidsToFetch} = authorsCommentsStore.getState()

  // the comment is a new comment, add it to buffered comment cids
  if (!bufferedCommentCids[options.authorAddress].has(commentCid)) {
    addBufferedCommentCid(options.authorAddress, commentCid)
  }

  // the comment was the last cid to fetch, set the next cid to fetch as the author previous cid
  const nextCidToFetch = nextCommentCidsToFetch[options.authorAddress]
  if (commentCid === nextCidToFetch) {
    setNextCommentCidsToFetch(options.authorAddress, comment)
  }

  // one of the comment changed, must update loaded comments
  updateLoadedComments()

  // the changed comment might have a new author.subplebbit.lastCommentCid, try to fetch it
  const subplebbitLastCommentCid = comment.author?.subplebbit?.lastCommentCid
  if (subplebbitLastCommentCid) {
    // when last comment has fetched, update lastCommentCid
    if (!subplebbitLastCommentCidsFetching[subplebbitLastCommentCid]) {
      subplebbitLastCommentCidsFetching[subplebbitLastCommentCid] = true
      commentsStore.subscribe(setLastCommentCidOnCommentsChange(options, subplebbitLastCommentCid))
    }

    // start fetching lastCommentCid
    const account = accountsStore.getState().accounts[options.accountId]
    state
      .addCommentToStore(subplebbitLastCommentCid, account)
      .catch((error: unknown) => log.error('authorsCommentsStore updateCommentsOnCommentsChange addCommentToStore error', {error, subplebbitLastCommentCid, account}))
  }
}

let previousLastComments = new QuickLru({maxSize: 10000})
const setLastCommentCidOnCommentsChange = (options: AuthorCommentsOptions, commentCid: string) => (state: CommentsState) => {
  // not a last cid candidate, do nothing
  if (!subplebbitLastCommentCidsFetching[commentCid]) {
    return
  }
  const {comments} = state

  const comment = comments[commentCid]
  // comment hasn't changed, do nothing
  if (!comment?.timestamp || comment === previousLastComments.get(commentCid)) {
    return
  }
  // comment author address is incorrect, do nothing
  if (comment.author?.address !== options.authorAddress) {
    return
  }
  previousLastComments.set(commentCid, comment)

  const {addBufferedCommentCid, lastCommentCids, bufferedCommentCids, setLastCommentCid, setNextCommentCidsToFetch, updateLoadedComments} =
    authorsCommentsStore.getState()

  // if the comment is a new comment, add it to buffered comment cids
  if (!bufferedCommentCids[options.authorAddress].has(commentCid)) {
    addBufferedCommentCid(options.authorAddress, commentCid)
  }

  // already last comment cid, no need to set it
  if (commentCid === lastCommentCids[options.authorAddress]) {
    return
  }

  // if comment is newer than current lastCommentCid and all bufferedComments, is lastCommentCid
  const currentLastCommentCid = lastCommentCids[options.authorAddress]
  const currentLastComment = comments[currentLastCommentCid || '']
  // comment is older or equal to current lastCommentCid, do nothing
  if (comment.timestamp <= (currentLastComment?.timestamp || 0)) {
    log.trace(`authorsCommentsStore setLastCommentCidOnCommentsChange don't set lastCommentCid older than current lastCommentCid`, {comment, currentLastComment})
    return
  }

  // make sure lastComment is newer than all comments already in bufferedComments
  const bufferedComments: Comment[] = [...bufferedCommentCids[options.authorAddress]].map((commentCid: string) => comments[commentCid])
  for (const bufferedComment of bufferedComments) {
    if ((bufferedComment?.timestamp || 0) > comment.timestamp) {
      log.trace(`authorsCommentsStore setLastCommentCidOnCommentsChange don't set lastCommentCid older than buffered comments`, {
        comment,
        currentLastComment,
        bufferedComments,
      })
      return
    }
  }

  // is last comment cid, set it
  log(`authorsCommentsStore setLastCommentCidOnCommentsChange`, {lastCommentCid: comment.cid, lastComment: comment, currentLastComment, bufferedComments})
  setLastCommentCid(options.authorAddress, commentCid)
  // add the last comment to loadedComments
  updateLoadedComments()
  // start a new linked list of comments to fetch using the lastComment.author.previousCommentCid
  if (comment.author?.previousCommentCid) {
    setNextCommentCidsToFetch(options.authorAddress, comment)
  }
}

// reset store in between tests
const originalState = authorsCommentsStore.getState()
// async function because some stores have async init
export const resetAuthorsCommentsStore = async () => {
  subplebbitLastCommentCidsFetching = {}
  previousComments = new QuickLru({maxSize: 10000})
  authorCommentCidsFetching = {}
  previousLastComments = new QuickLru({maxSize: 10000})

  // destroy all component subscriptions to the store
  authorsCommentsStore.destroy()
  // restore original state
  authorsCommentsStore.setState(originalState)
}

// reset database and store in between tests
export const resetAuthorsCommentsDatabaseAndStore = async () => {
  await resetAuthorsCommentsStore()
}

export default authorsCommentsStore
