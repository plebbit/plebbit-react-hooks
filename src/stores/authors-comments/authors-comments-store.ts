import Logger from '@plebbit/plebbit-logger'
const log = Logger('plebbit-react-hooks:authors:stores')
import createStore from 'zustand'
import assert from 'assert'
import {AuthorCommentsFilter, AuthorCommentsOptions, AuthorsComments, Account, Comment} from '../../types'
import commentsStore, {CommentsState} from '../comments'
import utils from '../../lib/utils'
import QuickLru from 'quick-lru'
import {getUpdatedLoadedAndBufferedComments} from './utils'
import accountsStore from '../accounts'

// reddit loads approximately 25 posts per page while infinite scrolling
export const commentsPerPage = 25
// keep large buffer because fetching cids is slow
export const commentsBufferSize = 50

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

  addAuthorCommentsToStore: (authorAddress: string, commentCid: string, filter: AuthorCommentsFilter | undefined, account: Account) => {
    assert(authorAddress && typeof authorAddress === 'string', `authorsCommentsStore.addAuthorCommentsToStore invalid argument authorAddress '${authorAddress}'`)
    assert(commentCid && typeof commentCid === 'string', `authorsCommentsStore.addAuthorCommentsToStore invalid argument commentCid '${commentCid}'`)
    assert(!filter || typeof filter === 'object', `authorsCommentsStore.addAuthorCommentsToStore invalid argument filter '${filter}'`)
    assert(typeof account?.plebbit?.getComment === 'function', `authorsCommentsStore.addAuthorCommentsToStore account '${account}' invalid`)

    const name = getAuthorCommentsOptionsName(authorAddress, filter, account.id)
    const {options} = getState()
    // in store already, do nothing
    if (options[name]) {
      return
    }
    const authorCommentsOptions = {authorAddress, pageNumber: 1, filter, accountId: account.id}

    // subscribe to nextCommentCidsToFetch and shouldFetchNextComment to fetch the comments
    authorsCommentsStore.subscribe(fetchCommentOnNextCommentCidsToFetchChange(authorCommentsOptions))
    authorsCommentsStore.subscribe(fetchCommentOnShouldFetchNextCommentChange(authorCommentsOptions))

    setState((state: AuthorsCommentsState) => ({
      options: {...state.options, [name]: authorCommentsOptions},
      loadedComments: {...state.loadedComments, [name]: []},
      bufferedComments: {...state.bufferedComments, [name]: []},
      lastCommentCids: {...state.lastCommentCids, [authorAddress]: undefined},
      nextCommentCidsToFetch: {...state.nextCommentCidsToFetch, [authorAddress]: commentCid},
      shouldFetchNextComment: {...state.shouldFetchNextComment, [authorAddress]: true},
    }))
  },

  setNextCommentCidsToFetch: (authorAddress: string, nextCommentCidToFetch: string | undefined) => {
    assert(authorAddress && typeof authorAddress === 'string', `authorsCommentsStore.setNextCommentCidsToFetch invalid argument authorAddress '${authorAddress}'`)
    assert(
      !nextCommentCidToFetch || typeof nextCommentCidToFetch === 'string',
      `authorsCommentsStore.setNextCommentCidsToFetch invalid argument nextCommentCidToFetch '${nextCommentCidToFetch}'`
    )
    setState((state: AuthorsCommentsState) => ({
      nextCommentCidsToFetch: {...state.nextCommentCidsToFetch, [authorAddress]: nextCommentCidToFetch},
    }))
  },

  incrementPageNumber: (authorAddress: string, filter: AuthorCommentsFilter | undefined, account: Account) => {
    assert(authorAddress && typeof authorAddress === 'string', `authorsCommentsStore.incrementPageNumber invalid argument authorAddress '${authorAddress}'`)
    assert(!filter || typeof filter === 'object', `authorsCommentsStore.incrementPageNumber invalid argument filter '${filter}'`)
    assert(typeof account?.plebbit?.getSubplebbit === 'function', `authorsCommentsStore.incrementPageNumber account '${account}' invalid`)
    const name = getAuthorCommentsOptionsName(authorAddress, filter, account.id)
    const {options} = getState()
    if (!options[name]) {
      throw Error(`can't increment page number of options '${name}' not in store`)
    }

    setState(({options}: AuthorsCommentsState) => {
      const authorCommentOptions = {...options[name]}
      authorCommentOptions.pageNumber++
      return {options: {...options, [name]: authorCommentOptions}}
    })
  },

  updateLoadedAndBufferedComments(newComment?: Comment) {
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
        shouldFetchNextComment[authorAddress] = bufferedComments.length < pageNumber * commentsPerPage + commentsBufferSize
      }
    }

    setState(({loadedComments, bufferedComments}: AuthorsCommentsState) => ({
      loadedComments: newAuthorsLoadedComments,
      bufferedComments: newAuthorsBufferedComments,
      shouldFetchNextComment,
    }))
  },
}))

const fetchCommentOnNextCommentCidsToFetchChange = (options: AuthorCommentsOptions) => (state: AuthorsCommentsState) => {
  const nextCommentCidToFetch = state.nextCommentCidsToFetch[options.authorAddress]
  if (!nextCommentCidToFetch) {
    return
  }

  // add comment to comments store to start fetching it
  const account = accountsStore.getState().accounts[options.accountId]
  const addCommentToStore = commentsStore.getState().addCommentToStore
  addCommentToStore(nextCommentCidToFetch, account).catch(console.log)

  // todo when comment is fetched
  commentsStore.subscribe(updateCommentsOnCommentsChange(options, nextCommentCidToFetch))
}

const fetchCommentOnShouldFetchNextCommentChange = (options: AuthorCommentsOptions) => (state: AuthorsCommentsState) => {
  const nextCommentCidToFetch = state.nextCommentCidsToFetch[options.authorAddress]
  if (!nextCommentCidToFetch) {
    return
  }

  // start fetching comment
  const account = accountsStore.getState().accounts[options.accountId]
  const addCommentToStore = commentsStore.getState().addCommentToStore
  addCommentToStore(nextCommentCidToFetch, account).catch(console.log)

  // update loaded and buffered comments, and next comment cid to fetch
  commentsStore.subscribe(updateCommentsOnCommentsChange(options, nextCommentCidToFetch))
}

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

  // the comment was the last cid to fetch, use it to
  // set the next cid to fetch and to add a new comment to bufferedComments
  if (commentCid === nextCidToFetch) {
    // the next cid to fetch is the author previous cid
    setNextCommentCidsToFetch(options.authorAddress, comment?.author?.previousCid)

    // the comment is a new comment, add it to bufferedComments
    newComment = comment
  }

  // update loaded and buffered comments (with a new comment if any)
  updateLoadedAndBufferedComments(newComment)
}

export const getAuthorCommentsOptionsName = (authorAddress: string, filter: AuthorCommentsFilter | undefined, accountId: string) => {
  // if filter is an object, stringify it (cached with memo)
  if (filter) {
    filter = utils.jsonStringifyMemo(filter)
  }
  return authorAddress + '-' + filter + '-' + accountId
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
