import Logger from '@plebbit/plebbit-logger'
const log = Logger('plebbit-react-hooks:authors:stores')
import createStore from 'zustand'
import assert from 'assert'
import {AuthorCommentsFilter, AuthorCommentsOptions, AuthorsComments, Account, Comment} from '../../types'
import commentsStore, {CommentsState} from '../comments'
import QuickLru from 'quick-lru'
import {getUpdatedLoadedAndBufferedComments, getSubplebbitLastCommentCids, getNextCommentCidToFetchNotFetched} from './utils'
import accountsStore from '../accounts'

// reddit loads approximately 25 posts per page while infinite scrolling
export const commentsPerPage = 25
// keep large buffer because fetching cids is slow
export const commentBufferSize = 50

export type AuthorsCommentsState = {
  // authorCommentsName is a string used a key to represent authorAddress + filter + accountId
  options: {[authorCommentsName: string]: AuthorCommentsOptions}
  loadedComments: {[authorCommentsName: string]: Comment[]}
  bufferedComments: {[authorCommentsName: string]: Comment[]}
  nextCommentCidsToFetch: {[authorAddress: string]: string | undefined}
  shouldFetchNextComment: {[authorAddress: string]: boolean}
  lastCommentCids: {[authorAddress: string]: string | undefined}
  addAuthorCommentsToStore: Function
  setNextCommentCidsToFetch: Function
  incrementPageNumber: Function
  updateLoadedAndBufferedComments: Function
  setLastCommentCid: Function
}

const authorsCommentsStore = createStore<AuthorsCommentsState>((setState: Function, getState: Function) => ({
  options: {},
  loadedComments: {},
  bufferedComments: {},
  lastCommentCids: {},
  nextCommentCidsToFetch: {},
  shouldFetchNextComment: {},

  addAuthorCommentsToStore: (authorCommentsName: string, authorAddress: string, commentCid: string, filter: AuthorCommentsFilter | undefined, account: Account) => {
    assert(
      authorCommentsName && typeof authorCommentsName === 'string',
      `addAuthorCommentsToStore.incrementPageNumber invalid argument authorCommentsName '${authorCommentsName}'`
    )
    assert(authorAddress && typeof authorAddress === 'string', `authorsCommentsStore.addAuthorCommentsToStore invalid argument authorAddress '${authorAddress}'`)
    assert(commentCid && typeof commentCid === 'string', `authorsCommentsStore.addAuthorCommentsToStore invalid argument commentCid '${commentCid}'`)
    assert(!filter || typeof filter === 'object', `authorsCommentsStore.addAuthorCommentsToStore invalid argument filter '${filter}'`)
    assert(typeof account?.plebbit?.getComment === 'function', `authorsCommentsStore.addAuthorCommentsToStore account '${account}' invalid`)

    const {options} = getState()
    // in store already, do nothing
    if (options[authorCommentsName]) {
      return
    }
    const authorCommentsOptions = {authorAddress, pageNumber: 1, filter, accountId: account.id}

    // subscribe to nextCommentCidsToFetch and shouldFetchNextComment to fetch the comments
    authorsCommentsStore.subscribe(fetchCommentOnShouldFetchOrNextCidChange(authorCommentsOptions))

    // subscribe to bufferedComments to fetch subplebbit lastCommentCids of updated comments
    authorsCommentsStore.subscribe(fetchLastCommentCidOnBufferedCommentsChange(authorCommentsName, authorCommentsOptions))

    log('authorsCommentsActions.addAuthorCommentsToStore', {authorCommentsOptions, commentCid})
    setState((state: AuthorsCommentsState) => ({
      options: {...state.options, [authorCommentsName]: authorCommentsOptions},
      loadedComments: {...state.loadedComments, [authorCommentsName]: []},
      bufferedComments: {...state.bufferedComments, [authorCommentsName]: []},
      lastCommentCids: {...state.lastCommentCids, [authorAddress]: undefined},
      nextCommentCidsToFetch: {...state.nextCommentCidsToFetch, [authorAddress]: commentCid},
      shouldFetchNextComment: {...state.shouldFetchNextComment, [authorAddress]: true},
    }))
  },

  setNextCommentCidsToFetch: (authorAddress: string, nextCommentCidToFetch: string | undefined) => {
    assert(authorAddress && typeof authorAddress === 'string', `authorsCommentsActions.setNextCommentCidsToFetch invalid argument authorAddress '${authorAddress}'`)
    assert(
      !nextCommentCidToFetch || typeof nextCommentCidToFetch === 'string',
      `authorsCommentsActions.setNextCommentCidsToFetch invalid argument nextCommentCidToFetch '${nextCommentCidToFetch}'`
    )
    const {nextCommentCidsToFetch, shouldFetchNextComment} = getState()
    if (typeof shouldFetchNextComment[authorAddress] !== 'boolean') {
      throw Error(`authorsCommentsActions.setNextCommentCidsToFetch can't set nextCommentCidToFetch '${authorAddress}' not in store`)
    }
    if (nextCommentCidToFetch === nextCommentCidsToFetch[authorAddress]) {
      throw Error(`authorsCommentsActions.setNextCommentCidsToFetch can't set nextCommentCidToFetch '${authorAddress}' to '${nextCommentCidToFetch}' same value`)
    }

    log('authorsCommentsActions.setNextCommentCidsToFetch', {authorAddress, nextCommentCidToFetch})
    setState((state: AuthorsCommentsState) => ({
      nextCommentCidsToFetch: {...state.nextCommentCidsToFetch, [authorAddress]: nextCommentCidToFetch},
    }))
  },

  incrementPageNumber: (authorCommentsName: string) => {
    assert(
      authorCommentsName && typeof authorCommentsName === 'string',
      `authorsCommentsActions.incrementPageNumber invalid argument authorCommentsName '${authorCommentsName}'`
    )
    const {options} = getState()
    if (!options[authorCommentsName]) {
      throw Error(`authorsCommentsActions.incrementPageNumber can't increment page number of options '${authorCommentsName}' not in store`)
    }

    log('authorsCommentsActions.incrementPageNumber', {authorCommentsName, pageNumber: options[authorCommentsName].pageNumber + 1})
    setState(({options}: AuthorsCommentsState) => {
      const authorCommentOptions = {...options[authorCommentsName]}
      authorCommentOptions.pageNumber++
      return {options: {...options, [authorCommentsName]: authorCommentOptions}}
    })

    // must update loadedComments to reflect the new added page
    getState().updateLoadedAndBufferedComments()
  },

  updateLoadedAndBufferedComments(newComment?: Comment) {
    assert(!newComment || typeof newComment === 'object', `authorsCommentsActions.updateLoadedAndBufferedComments invalid argument newComment '${newComment}'`)
    const {comments} = commentsStore.getState()
    let {loadedComments: authorsLoadedComments, bufferedComments: authorsBufferedComments, options, nextCommentCidsToFetch} = getState()

    const newAuthorsLoadedComments: AuthorsComments = {}
    const newAuthorsBufferedComments: AuthorsComments = {}
    const newShouldFetchNextComment: {[authorAddress: string]: boolean} = {}
    const authorCommentsNames = Object.keys(options)
    for (const name of authorCommentsNames) {
      const previousLoadedComments = authorsLoadedComments[name]
      let previousBufferedComments = authorsBufferedComments[name]
      const {authorAddress, pageNumber, filter} = options[name]

      // if the update was triggered by a new comment, add it to bufferedComments
      if (newComment?.author?.address === authorAddress) {
        previousBufferedComments = [...previousBufferedComments, newComment]
      }

      const {loadedComments, bufferedComments} = getUpdatedLoadedAndBufferedComments(previousLoadedComments, previousBufferedComments, pageNumber, filter, comments)
      newAuthorsLoadedComments[name] = loadedComments
      newAuthorsBufferedComments[name] = bufferedComments

      // if another authorCommentOptions should fetch, don't change it
      if (newShouldFetchNextComment[authorAddress] !== true) {
        // fetch if less comments than full page + buffer size
        newShouldFetchNextComment[authorAddress] = bufferedComments.length < pageNumber * commentsPerPage + commentBufferSize
      }
    }

    log('authorsCommentsActions.updateLoadedAndBufferedComments', {
      newComment,
      authorsLoadedComments,
      newAuthorsLoadedComments,
      authorsBufferedComments,
      newAuthorsBufferedComments,
      newShouldFetchNextComment,
    })
    setState(({loadedComments, bufferedComments}: AuthorsCommentsState) => ({
      loadedComments: newAuthorsLoadedComments,
      bufferedComments: newAuthorsBufferedComments,
      shouldFetchNextComment: newShouldFetchNextComment,
    }))
  },

  setLastCommentCid: (authorAddress: string, lastCommentCid: string) => {
    assert(authorAddress && typeof authorAddress === 'string', `authorsCommentsActions.setLastCommentCid invalid argument authorAddress '${authorAddress}'`)
    assert(lastCommentCid && typeof lastCommentCid === 'string', `authorsCommentsActions.setLastCommentCid invalid argument lastCommentCid '${lastCommentCid}'`)
    const {lastCommentCids, shouldFetchNextComment} = getState()
    if (typeof shouldFetchNextComment[authorAddress] !== 'boolean') {
      throw Error(`authorsCommentsActions.setLastCommentCid can't set lastCommentCid '${authorAddress}' not in store`)
    }
    if (lastCommentCid === lastCommentCids[authorAddress]) {
      throw Error(`authorsCommentsActions.setLastCommentCid can't set setLastCommentCid '${authorAddress}' to '${lastCommentCid}' same value`)
    }

    log('authorsCommentsActions.setLastCommentCid', {authorAddress, lastCommentCid})
    setState((state: AuthorsCommentsState) => ({
      lastCommentCids: {...state.lastCommentCids, [authorAddress]: lastCommentCid},
    }))
  },
}))

// if nextCommentCidsToFetch or shouldFetchNextComment changed, fetch the next comment
const fetchCommentOnShouldFetchOrNextCidChange = (options: AuthorCommentsOptions) => (state: AuthorsCommentsState) => {
  let nextCommentCidToFetch = state.nextCommentCidsToFetch[options.authorAddress]
  // if comment already exist, find the actual nextCidToFetch
  // can happen if a more recent lastCommentCid becomes nextCommentCidToFetch
  nextCommentCidToFetch = getNextCommentCidToFetchNotFetched(nextCommentCidToFetch)
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
    log.error('authorsCommentsStore fetchCommentOnShouldFetchOrNextCidChange addCommentToStore error', {nextCommentCidToFetch, account})
  )
}

// if commentStore changed, update loadedComments, bufferedComments, shouldFetchNextComment and nextCommentCidsToFetch
let previousComments = new QuickLru({maxSize: 10000})
let authorCommentCidsFetching: {[commentCid: string]: boolean} = {}
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
  previousComments.set(commentCid, comment)

  const {updateLoadedAndBufferedComments, setNextCommentCidsToFetch, nextCommentCidsToFetch} = authorsCommentsStore.getState()
  const nextCidToFetch = nextCommentCidsToFetch[options.authorAddress]

  // the comment was the last cid to fetch, which means it's a new comment not yet added
  // to buffered and loaded comments
  if (commentCid === nextCidToFetch) {
    // the comment is a new comment, update loaded and buffered comments with the new comment
    updateLoadedAndBufferedComments(comment)

    // the next cid to fetch is the author previous cid of the new comment
    setNextCommentCidsToFetch(options.authorAddress, comment?.author?.previousCommentCid)
  } else {
    // the comment isn't a new comment, but it might have updated one of the loaded or
    // buffered comment anyway, so update them just in case, but without a new comment
    updateLoadedAndBufferedComments()
  }
}

// if buffered comments have changed, try fetching the subplebbit.lastCommentCid of each updated comment
let previousBufferedComments: AuthorsComments = {}
let subplebbitLastCommentCidsFetching: {[commentCid: string]: boolean} = {}
const fetchLastCommentCidOnBufferedCommentsChange = (authorCommentsName: string, options: AuthorCommentsOptions) => (state: AuthorsCommentsState) => {
  const bufferedComments = state.bufferedComments[authorCommentsName]
  // bufferedComments haven't changed, do nothing
  if (previousBufferedComments[authorCommentsName] === bufferedComments) {
    return
  }
  previousBufferedComments[authorCommentsName] = bufferedComments

  const subplebbitLastCommentCids = getSubplebbitLastCommentCids(options.authorAddress, bufferedComments)

  // start fetching author subplebbit last comments
  const account = accountsStore.getState().accounts[options.accountId]
  const addCommentToStore = commentsStore.getState().addCommentToStore

  for (const subplebbitLastCommentCid of subplebbitLastCommentCids) {
    // when comment has fetched, update loadedComments, bufferedComments and shouldFetchNextComment
    if (!subplebbitLastCommentCidsFetching[subplebbitLastCommentCid]) {
      subplebbitLastCommentCidsFetching[subplebbitLastCommentCid] = true
      commentsStore.subscribe(updateLastCommentCidOnCommentsChange(authorCommentsName, options, subplebbitLastCommentCid))
    }

    // start fetching subplebbitLastCommentCid
    addCommentToStore(subplebbitLastCommentCid, account).catch((error: unknown) =>
      log.error('authorsCommentsStore fetchLastCommentCidOnBufferedCommentsChange addCommentToStore error', {subplebbitLastCommentCid, account})
    )
  }
}

const updateLastCommentCidOnCommentsChange = (authorCommentsName: string, options: AuthorCommentsOptions, commentCid: string) => (state: CommentsState) => {
  // not a last cid, do nothing
  if (!subplebbitLastCommentCidsFetching[commentCid]) {
    return
  }
  const {comments} = state

  const comment = comments[commentCid]
  // comment hasn't changed, do nothing
  if (!comment?.timestamp || comment === previousComments.get(commentCid)) {
    return
  }
  previousComments.set(commentCid, comment)

  const {lastCommentCids, bufferedComments} = authorsCommentsStore.getState()

  // if comment is newer than current lastCommentCid and all bufferedComments, is lastCommentCid
  const currentLastCommentCid = lastCommentCids[commentCid]
  const currentLastComment = comments[currentLastCommentCid || '']
  // comment is older or equal to current lastCommentCid, do nothing
  if (comment.timestamp <= (currentLastComment?.timestamp || 0)) {
    return
  }

  // make sure lastComment is newer than all comments already in bufferedComments
  for (const bufferedComment of bufferedComments[authorCommentsName]) {
    if ((bufferedComment?.timestamp || 0) > comment.timestamp) {
      return
    }
  }

  authorsCommentsStore.getState().setLastCommentCid(options.authorAddress, comment.cid)
}

const commentIsNewerThanBufferedComments = (comment: Comment, bufferedComments: Comment[]) => {
  for (const bufferedComment of bufferedComments) {
    if ((bufferedComment?.timestamp || 0) > comment.timestamp || 0) {
      return
    }
  }
}

// reset store in between tests
const originalState = authorsCommentsStore.getState()
// async function because some stores have async init
export const resetAuthorsCommentsStore = async () => {
  previousBufferedComments = {}
  subplebbitLastCommentCidsFetching = {}
  previousComments = new QuickLru({maxSize: 10000})
  authorCommentCidsFetching = {}

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
