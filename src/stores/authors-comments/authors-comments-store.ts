import Logger from '@plebbit/plebbit-logger'
const log = Logger('plebbit-react-hooks:authors:stores')
import createStore from 'zustand'
import assert from 'assert'
import {AuthorCommentsFilter, AuthorCommentsOptions, AuthorsComments, Account, Comment} from '../../types'
import commentsStore, {CommentsState} from '../comments'
import QuickLru from 'quick-lru'
import {getUpdatedLoadedAndBufferedComments} from './utils'
import accountsStore from '../accounts'

// reddit loads approximately 25 posts per page while infinite scrolling
export const commentsPerPage = 25
// keep large buffer because fetching cids is slow
export const commentBufferSize = 50

export type AuthorsCommentsState = {
  options: {[authorCommentsOptionsName: string]: AuthorCommentsOptions}
  loadedComments: {[authorCommentsOptionsName: string]: Comment[]}
  bufferedComments: {[authorCommentsOptionsName: string]: Comment[]}
  lastCommentCids: {[authorAddress: string]: string}
  nextCommentCidsToFetch: {[authorAddress: string]: string}
  shouldFetchNextComment: {[authorAddress: string]: boolean}
  addAuthorCommentsToStore: Function
  setNextCommentCidsToFetch: Function
  incrementPageNumber: Function
  updateLoadedAndBufferedComments: Function
}

const authorsCommentsStore = createStore<AuthorsCommentsState>((setState: Function, getState: Function) => ({
  options: {},
  loadedComments: {},
  bufferedComments: {},
  lastCommentCids: {},
  nextCommentCidsToFetch: {},
  shouldFetchNextComment: {},

  addAuthorCommentsToStore: (
    authorCommentsOptionsName: string,
    authorAddress: string,
    commentCid: string,
    filter: AuthorCommentsFilter | undefined,
    account: Account
  ) => {
    assert(
      authorCommentsOptionsName && typeof authorCommentsOptionsName === 'string',
      `addAuthorCommentsToStore.incrementPageNumber invalid argument authorCommentsOptionsName '${authorCommentsOptionsName}'`
    )
    assert(authorAddress && typeof authorAddress === 'string', `authorsCommentsStore.addAuthorCommentsToStore invalid argument authorAddress '${authorAddress}'`)
    assert(commentCid && typeof commentCid === 'string', `authorsCommentsStore.addAuthorCommentsToStore invalid argument commentCid '${commentCid}'`)
    assert(!filter || typeof filter === 'object', `authorsCommentsStore.addAuthorCommentsToStore invalid argument filter '${filter}'`)
    assert(typeof account?.plebbit?.getComment === 'function', `authorsCommentsStore.addAuthorCommentsToStore account '${account}' invalid`)

    const {options} = getState()
    // in store already, do nothing
    if (options[authorCommentsOptionsName]) {
      return
    }
    const authorCommentsOptions = {authorAddress, pageNumber: 1, filter, accountId: account.id}

    // subscribe to nextCommentCidsToFetch and shouldFetchNextComment to fetch the comments
    authorsCommentsStore.subscribe(fetchCommentOnShouldFetchOrNextCidChange(authorCommentsOptions))

    log('authorsCommentsActions.addAuthorCommentsToStore', {authorCommentsOptions, commentCid})
    setState((state: AuthorsCommentsState) => ({
      options: {...state.options, [authorCommentsOptionsName]: authorCommentsOptions},
      loadedComments: {...state.loadedComments, [authorCommentsOptionsName]: []},
      bufferedComments: {...state.bufferedComments, [authorCommentsOptionsName]: []},
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

    log('authorsCommentsActions.setNextCommentCidsToFetch', {authorAddress, nextCommentCidToFetch})
    setState((state: AuthorsCommentsState) => ({
      nextCommentCidsToFetch: {...state.nextCommentCidsToFetch, [authorAddress]: nextCommentCidToFetch},
    }))
  },

  incrementPageNumber: (authorCommentsOptionsName: string) => {
    assert(
      authorCommentsOptionsName && typeof authorCommentsOptionsName === 'string',
      `authorsCommentsActions.incrementPageNumber invalid argument authorCommentsOptionsName '${authorCommentsOptionsName}'`
    )
    const {options} = getState()
    if (!options[authorCommentsOptionsName]) {
      throw Error(`authorsCommentsActions.incrementPageNumber can't increment page number of options '${authorCommentsOptionsName}' not in store`)
    }

    log('authorsCommentsActions.incrementPageNumber', {authorCommentsOptionsName, pageNumber: options[authorCommentsOptionsName].pageNumber + 1})
    setState(({options}: AuthorsCommentsState) => {
      const authorCommentOptions = {...options[authorCommentsOptionsName]}
      authorCommentOptions.pageNumber++
      return {options: {...options, [authorCommentsOptionsName]: authorCommentOptions}}
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
    const shouldFetchNextComment: {[authorAddress: string]: boolean} = {}
    const authorCommentsOptionsNames = Object.keys(options)
    for (const name of authorCommentsOptionsNames) {
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
      if (shouldFetchNextComment[authorAddress] !== true) {
        // fetch if less comments than full page + buffer size
        shouldFetchNextComment[authorAddress] = bufferedComments.length < pageNumber * commentsPerPage + commentBufferSize
      }
    }

    log('authorsCommentsActions.updateLoadedAndBufferedComments', {
      newComment,
      authorsLoadedComments,
      newAuthorsLoadedComments,
      authorsBufferedComments,
      newAuthorsBufferedComments,
      shouldFetchNextComment,
    })
    setState(({loadedComments, bufferedComments}: AuthorsCommentsState) => ({
      loadedComments: newAuthorsLoadedComments,
      bufferedComments: newAuthorsBufferedComments,
      shouldFetchNextComment,
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

  // start fetching comment
  const account = accountsStore.getState().accounts[options.accountId]
  const addCommentToStore = commentsStore.getState().addCommentToStore
  addCommentToStore(nextCommentCidToFetch, account).catch((error: unknown) =>
    log.error('authorsCommentsStore fetchCommentOnShouldFetchOrNextCidChange addCommentToStore error', {nextCommentCidToFetch, account})
  )

  // when comment has fetched, update loadedComments, bufferedComments and shouldFetchNextComment
  commentsStore.subscribe(updateCommentsOnCommentsChange(options, nextCommentCidToFetch))
}

// if commentStore changed, update loadedComments, bufferedComments, shouldFetchNextComment and nextCommentCidsToFetch
const previousComments = new QuickLru({maxSize: 10000})
const updateCommentsOnCommentsChange = (options: AuthorCommentsOptions, commentCid: string) => (state: CommentsState) => {
  const comment = state.comments[commentCid]
  // comment hasn't changed, do nothing
  if (!comment || comment === previousComments.get(commentCid)) {
    return
  }
  previousComments.set(commentCid, comment)

  const {updateLoadedAndBufferedComments, setNextCommentCidsToFetch, nextCommentCidsToFetch} = authorsCommentsStore.getState()
  const nextCidToFetch = nextCommentCidsToFetch[options.authorAddress]
  let newComment

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

// reset store in between tests
const originalState = authorsCommentsStore.getState()
// async function because some stores have async init
export const resetAuthorsCommentsStore = async () => {
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
