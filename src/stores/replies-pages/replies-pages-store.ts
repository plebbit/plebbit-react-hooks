import utils from '../../lib/utils'
import Logger from '@plebbit/plebbit-logger'
// include replies pages store with feeds for debugging
const log = Logger('plebbit-react-hooks:replies:stores')
import {RepliesPage, RepliesPages, Account, Comment, Comments} from '../../types'
import accountsStore from '../accounts'
import commentsStore, {CommentsState} from '../comments'
import {addChildrenRepliesFeedsToAddToStore} from './utils'
import localForageLru from '../../lib/localforage-lru'
import createStore from 'zustand'
import assert from 'assert'

const repliesPagesDatabase = localForageLru.createInstance({name: 'plebbitReactHooks-repliesPages', size: 500})

// reset all event listeners in between tests
export const listeners: any = []

export type RepliesPagesState = {
  repliesPages: RepliesPages
  comments: Comments
  addNextRepliesPageToStore: Function
  addRepliesPageCommentsToStore: Function
}

const repliesPagesStore = createStore<RepliesPagesState>((setState: Function, getState: Function) => ({
  // TODO: eventually clear old pages and comments from memory
  repliesPages: {},
  comments: {},

  addNextRepliesPageToStore: async (comment: Comment, sortType: string, account: Account) => {
    assert(comment?.cid && typeof comment?.cid === 'string', `repliesPagesStore.addNextRepliesPageToStore comment '${comment}' invalid`)
    assert(sortType && typeof sortType === 'string', `repliesPagesStore.addNextRepliesPageToStore sortType '${sortType}' invalid`)
    assert(typeof account?.plebbit?.createSubplebbit === 'function', `repliesPagesStore.addNextRepliesPageToStore account '${account}' invalid`)

    // check the preloaded replies on comment.replies.pages first, then the comment.replies.pageCids
    const repliesFirstPageCid = getRepliesFirstPageCid(comment, sortType)
    if (!repliesFirstPageCid) {
      log(`repliesPagesStore.addNextRepliesPageToStore comment '${comment?.cid}' sortType '${sortType}' no repliesFirstPageCid`)
      return
    }

    // all replies pages in store
    const repliesPagesStore = getState()
    // only specific pages of the comment+sortType
    const repliesPages = getRepliesPages(comment, sortType, repliesPagesStore.repliesPages)

    // if no pages exist yet, add the first page
    let pageCidToAdd: string
    if (!repliesPages.length) {
      pageCidToAdd = repliesFirstPageCid
    } else {
      const nextCid = repliesPages[repliesPages.length - 1]?.nextCid
      // if last nextCid is undefined, reached end of pages
      if (!nextCid) {
        log.trace('repliesPagesStore.addNextRepliesPageToStore no more pages', {commentCid: comment.cid, sortType, account})
        return
      }

      pageCidToAdd = nextCid
    }

    // page is already added or pending
    if (repliesPagesStore.repliesPages[pageCidToAdd] || fetchPagePending[account.id + pageCidToAdd]) {
      return
    }

    fetchPagePending[account.id + pageCidToAdd] = true
    let page: RepliesPage
    try {
      page = await fetchPage(pageCidToAdd, comment, account)
      log.trace('repliesPagesStore.addNextRepliesPageToStore comment.replies.getPage', {
        pageCid: pageCidToAdd,
        page,
        commentCid: comment.cid,
        subplebbitAddress: comment.subplebbitAddress,
        account,
      })
    } catch (e) {
      throw e
    } finally {
      fetchPagePending[account.id + pageCidToAdd] = false
    }

    // failed getting the page
    if (!page) {
      return
    }

    // find new comments in the page
    const flattenedComments = utils.flattenCommentsPages(page)
    const {comments} = getState()
    let hasNewComments = false
    const newComments: Comments = {}
    for (const comment of flattenedComments) {
      if (comment.cid && (comment.updatedAt || 0) > (comments[comment.cid]?.updatedAt || 0)) {
        // don't clone the comment to save memory, comments remain a pointer to the page object
        newComments[comment.cid] = comment
        hasNewComments = true
      }
    }

    // add missing children replies feeds
    addChildrenRepliesFeedsToAddToStore(page, comment)

    setState(({repliesPages, comments}: any) => {
      const newState: any = {repliesPages: {...repliesPages, [pageCidToAdd]: page}}
      if (hasNewComments) {
        newState.comments = {...comments, ...newComments}
      }
      return newState
    })
    log('repliesPagesStore.addNextRepliesPageToStore', {pageCid: pageCidToAdd, commentCid: comment.cid, sortType, page, account})

    // when publishing a comment, you don't yet know its CID
    // so when a new comment is fetched, check to see if it's your own
    // comment, and if yes, add the CID to your account comments database
    for (const comment of flattenedComments) {
      accountsStore
        .getState()
        .accountsActionsInternal.addCidToAccountComment(comment)
        .catch((error: unknown) => log.error('repliesPagesStore.addNextRepliesPageToStore addCidToAccountComment error', {comment, error}))
    }
  },

  // comments contain preloaded pages, those page comments must be added separately
  addRepliesPageCommentsToStore: (comment: Comment) => {
    if (!comment.replies?.pages) {
      return
    }

    // find new comments in the page
    const flattenedComments = utils.flattenCommentsPages(comment.replies.pages)
    const {comments} = getState()
    let hasNewComments = false
    const newComments: Comments = {}
    for (const comment of flattenedComments) {
      if (comment.cid && (comment.updatedAt || 0) > (comments[comment.cid]?.updatedAt || 0)) {
        // don't clone the comment to save memory, comments remain a pointer to the page object
        newComments[comment.cid] = comment
        hasNewComments = true
      }
    }

    if (!hasNewComments) {
      return
    }

    setState(({comments}: any) => {
      return {comments: {...comments, ...newComments}}
    })
    log('repliesPagesStore.addRepliesPageCommentsToStore', {comment, newComments})
  },
}))

// set clients states on comments store so the frontend can display it, dont persist in db because a reload cancels updating
const onCommentRepliesClientsStateChange = (commentCid: string) => (clientState: string, clientType: string, sortType: string, clientUrl: string) => {
  commentsStore.setState((state: CommentsState) => {
    // make sure not undefined, sometimes happens in e2e tests
    if (!state.comments[commentCid]) {
      return {}
    }
    const client = {state: clientState}
    const comment = {...state.comments[commentCid]}
    comment.replies = {...comment.replies}
    comment.replies.clients = {...comment.replies.clients}
    comment.replies.clients[clientType] = {...comment.replies.clients[clientType]}
    comment.replies.clients[clientType][sortType] = {...comment.replies.clients[clientType][sortType]}
    comment.replies.clients[clientType][sortType][clientUrl] = client
    return {comments: {...state.comments, [commentCid]: comment}}
  })
}

const commentRepliesClientsOnStateChange = (clients: any, onStateChange: Function) => {
  for (const sortType in clients?.ipfsGateways) {
    for (const clientUrl in clients?.ipfsGateways?.[sortType]) {
      clients?.ipfsGateways?.[sortType]?.[clientUrl].on('statechange', (state: string) => onStateChange(state, 'ipfsGateways', sortType, clientUrl))
    }
  }
  for (const sortType in clients?.kuboRpcClients) {
    for (const clientUrl in clients?.kuboRpcClients?.[sortType]) {
      clients?.kuboRpcClients?.[sortType]?.[clientUrl].on('statechange', (state: string) => onStateChange(state, 'kuboRpcClients', sortType, clientUrl))
    }
  }
  for (const sortType in clients?.plebbitRpcClients) {
    for (const clientUrl in clients?.plebbitRpcClients?.[sortType]) {
      clients?.plebbitRpcClients?.[sortType]?.[clientUrl].on('statechange', (state: string) => onStateChange(state, 'plebbitRpcClients', sortType, clientUrl))
    }
  }
}

const fetchPageComments: {[commentCid: string]: any} = {} // cache plebbit.createComment because sometimes it's slow
let fetchPagePending: {[key: string]: boolean} = {}
const fetchPage = async (pageCid: string, comment: Comment, account: Account) => {
  // replies page is cached
  const cachedRepliesPage = await repliesPagesDatabase.getItem(pageCid)
  if (cachedRepliesPage) {
    return cachedRepliesPage
  }
  if (!fetchPageComments[comment.cid]) {
    fetchPageComments[comment.cid] = await account.plebbit.createComment({
      cid: comment.cid,
      postCid: comment.postCid,
      subplebbitAddress: comment.subplebbitAddress,
      depth: comment.depth,
    })

    // set clients states on subplebbits store so the frontend can display it
    commentRepliesClientsOnStateChange(fetchPageComments[comment.cid].replies?.clients, onCommentRepliesClientsStateChange(comment.cid))
  }

  const onError = (error: any) => log.error(`repliesPagesStore comment '${comment.cid}' failed comment.replies.getPage page cid '${pageCid}':`, error)
  const fetchedRepliesPage = await utils.retryInfinity(() => fetchPageComments[comment.cid].replies.getPage(pageCid), {onError})
  await repliesPagesDatabase.setItem(pageCid, utils.clone(fetchedRepliesPage))
  return fetchedRepliesPage
}

/**
 * Util function to get all pages in the store for a
 * specific comment+sortType using `RepliesPage.nextCid`
 */
export const getRepliesPages = (comment: Comment, sortType: string, repliesPages: RepliesPages) => {
  assert(repliesPages && typeof repliesPages === 'object', `getRepliesPages repliesPages '${repliesPages}' invalid`)
  const pages: RepliesPage[] = []
  const firstPageCid = getRepliesFirstPageCid(comment, sortType)
  // comment has no pages
  // TODO: if a loaded comment doesn't have a first page, it's unclear what we should do
  // should we try to use another sort type by default, like 'best', or should we just ignore it?
  // 'return pages' to ignore it for now
  if (!firstPageCid) {
    return pages
  }
  const firstPage = repliesPages[firstPageCid]
  if (!firstPage) {
    return pages
  }
  pages.push(firstPage)
  while (true) {
    const nextCid = pages[pages.length - 1]?.nextCid
    const repliesPage = nextCid && repliesPages[nextCid]
    if (!repliesPage) {
      return pages
    }
    pages.push(repliesPage)
  }
}

export const getRepliesFirstPageCid = (comment: Comment, sortType: string) => {
  assert(comment?.cid, `getRepliesFirstPageCid comment '${comment}' invalid`)
  assert(sortType && typeof sortType === 'string', `getRepliesFirstPageCid sortType '${sortType}' invalid`)
  // comment has preloaded replies for sort type
  if (comment.replies?.pages?.[sortType]?.comments) {
    return comment.replies?.pages?.[sortType]?.nextCid
  }
  return comment.replies?.pageCids?.[sortType]

  // TODO: if a loaded comment doesn't have a first page, it's unclear what we should do
  // should we try to use another sort type by default, like 'best', or should we just ignore it?
}

// reset store in between tests
const originalState = repliesPagesStore.getState()
// async function because some stores have async init
export const resetRepliesPagesStore = async () => {
  fetchPagePending = {}
  // remove all event listeners
  listeners.forEach((listener: any) => listener.removeAllListeners())
  // destroy all component subscriptions to the store
  repliesPagesStore.destroy()
  // restore original state
  repliesPagesStore.setState(originalState)
}

// reset database and store in between tests
export const resetRepliesPagesDatabaseAndStore = async () => {
  await localForageLru.createInstance({name: 'plebbitReactHooks-repliesPages'}).clear()
  await resetRepliesPagesStore()
}

export default repliesPagesStore
