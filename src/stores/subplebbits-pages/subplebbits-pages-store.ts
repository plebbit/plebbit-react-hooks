import utils from '../../lib/utils'
import Logger from '@plebbit/plebbit-logger'
// include subplebbits pages store with feeds for debugging
const log = Logger('plebbit-react-hooks:feeds:stores')
import {Subplebbit, SubplebbitPage, SubplebbitsPages, Account, Comment, Comments} from '../../types'
import accountsStore from '../accounts'
import subplebbitsStore, {SubplebbitsState} from '../subplebbits'
import localForageLru from '../../lib/localforage-lru'
import createStore from 'zustand'
import assert from 'assert'

const subplebbitsPagesDatabase = localForageLru.createInstance({name: 'subplebbitsPages', size: 500})

// reset all event listeners in between tests
export const listeners: any = []

export type SubplebbitsPagesState = {
  subplebbitsPages: SubplebbitsPages
  comments: Comments
  addNextSubplebbitPageToStore: Function
  addSubplebbitPageCommentsToStore: Function
}

const subplebbitsPagesStore = createStore<SubplebbitsPagesState>((setState: Function, getState: Function) => ({
  // TODO: eventually clear old pages and comments from memory
  subplebbitsPages: {},
  comments: {},

  addNextSubplebbitPageToStore: async (subplebbit: Subplebbit, sortType: string, account: Account) => {
    assert(subplebbit?.address && typeof subplebbit?.address === 'string', `subplebbitsPagesStore.addNextSubplebbitPageToStore subplebbit '${subplebbit}' invalid`)
    assert(sortType && typeof sortType === 'string', `subplebbitsPagesStore.addNextSubplebbitPageToStore sortType '${sortType}' invalid`)
    assert(typeof account?.plebbit?.createSubplebbit === 'function', `subplebbitsPagesStore.addNextSubplebbitPageToStore account '${account}' invalid`)

    // check the preloaded posts on subplebbit.posts.pages first, then the subplebbit.posts.pageCids
    const subplebbitFirstPageCid = getSubplebbitFirstPageCid(subplebbit, sortType)
    assert(
      subplebbitFirstPageCid && typeof subplebbitFirstPageCid === 'string',
      `subplebbitsPagesStore.addNextSubplebbitPageToStore subplebbit '${subplebbit?.address}' sortType '${sortType}' subplebbitFirstPageCid '${subplebbitFirstPageCid}' invalid`,
    )

    // all subplebbits pages in store
    const {subplebbitsPages} = getState()
    // only specific pages of the subplebbit+sortType
    const subplebbitPages = getSubplebbitPages(subplebbit, sortType, subplebbitsPages)

    // if no pages exist yet, add the first page
    let pageCidToAdd: string
    if (!subplebbitPages.length) {
      pageCidToAdd = subplebbitFirstPageCid
    } else {
      const nextCid = subplebbitPages[subplebbitPages.length - 1]?.nextCid
      // if last nextCid is undefined, reached end of pages
      if (!nextCid) {
        log.trace('subplebbitsPagesStore.addNextSubplebbitPageToStore no more pages', {subplebbitAddress: subplebbit.address, sortType, account})
        return
      }

      pageCidToAdd = nextCid
    }

    // page is already added or pending
    if (subplebbitsPages[pageCidToAdd] || fetchPagePending[account.id + pageCidToAdd]) {
      return
    }

    fetchPagePending[account.id + pageCidToAdd] = true
    let page: SubplebbitPage
    try {
      page = await fetchPage(pageCidToAdd, subplebbit.address, account)
      log.trace('subplebbitsPagesStore.addNextSubplebbitPageToStore subplebbit.posts.getPage', {pageCid: pageCidToAdd, subplebbitAddress: subplebbit.address, account})
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

    setState(({subplebbitsPages, comments}: any) => {
      const newState: any = {subplebbitsPages: {...subplebbitsPages, [pageCidToAdd]: page}}
      if (hasNewComments) {
        newState.comments = {...comments, ...newComments}
      }
      return newState
    })
    log('subplebbitsPagesStore.addNextSubplebbitPageToStore', {pageCid: pageCidToAdd, subplebbitAddress: subplebbit.address, sortType, page, account})

    // when publishing a comment, you don't yet know its CID
    // so when a new comment is fetched, check to see if it's your own
    // comment, and if yes, add the CID to your account comments database
    for (const comment of flattenedComments) {
      accountsStore
        .getState()
        .accountsActionsInternal.addCidToAccountComment(comment)
        .catch((error: unknown) => log.error('subplebbitsPagesStore.addNextSubplebbitPageToStore addCidToAccountComment error', {comment, error}))
    }
  },

  // subplebbits contain preloaded pages, those page comments must be added separately
  addSubplebbitPageCommentsToStore: (subplebbit: Subplebbit) => {
    if (!subplebbit.posts?.pages) {
      return
    }

    // find new comments in the page
    const flattenedComments = utils.flattenCommentsPages(subplebbit.posts.pages)
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
    log('subplebbitsPagesStore.addSubplebbitPageCommentsToStore', {subplebbit, newComments})
  },
}))

// set clients states on subplebbits store so the frontend can display it, dont persist in db because a reload cancels updating
const onSubplebbitPostsClientsStateChange = (subplebbitAddress: string) => (clientState: string, clientType: string, sortType: string, clientUrl: string) => {
  subplebbitsStore.setState((state: SubplebbitsState) => {
    const client = {state: clientState}
    const subplebbit = {...state.subplebbits[subplebbitAddress]}
    subplebbit.posts = {...subplebbit.posts}
    subplebbit.posts.clients = {...subplebbit.posts.clients}
    subplebbit.posts.clients[clientType] = {...subplebbit.posts.clients[clientType]}
    subplebbit.posts.clients[clientType][sortType] = {...subplebbit.posts.clients[clientType][sortType]}
    subplebbit.posts.clients[clientType][sortType][clientUrl] = client
    return {subplebbits: {...state.subplebbits, [subplebbit.address]: subplebbit}}
  })
}

const subplebbitPostsClientsOnStateChange = (clients: any, onStateChange: Function) => {
  for (const sortType in clients?.ipfsGateways) {
    for (const clientUrl in clients?.ipfsGateways?.[sortType]) {
      clients?.ipfsGateways?.[sortType]?.[clientUrl].on('statechange', (state: string) => onStateChange(state, 'ipfsGateways', sortType, clientUrl))
    }
  }
  for (const sortType in clients?.ipfsClients) {
    for (const clientUrl in clients?.ipfsClients?.[sortType]) {
      clients?.ipfsClients?.[sortType]?.[clientUrl].on('statechange', (state: string) => onStateChange(state, 'ipfsClients', sortType, clientUrl))
    }
  }
  for (const sortType in clients?.plebbitRpcClients) {
    for (const clientUrl in clients?.plebbitRpcClients?.[sortType]) {
      clients?.plebbitRpcClients?.[sortType]?.[clientUrl].on('statechange', (state: string) => onStateChange(state, 'plebbitRpcClients', sortType, clientUrl))
    }
  }
}

let fetchPagePending: {[key: string]: boolean} = {}
const fetchPage = async (pageCid: string, subplebbitAddress: string, account: Account) => {
  // subplebbit page is cached
  const cachedSubplebbitPage = await subplebbitsPagesDatabase.getItem(pageCid)
  if (cachedSubplebbitPage) {
    return cachedSubplebbitPage
  }
  const subplebbit = await account.plebbit.createSubplebbit({address: subplebbitAddress})

  // set clients states on subplebbits store so the frontend can display it
  subplebbitPostsClientsOnStateChange(subplebbit.posts?.clients, onSubplebbitPostsClientsStateChange(subplebbit.address))

  const onError = (error: any) => log.error(`subplebbitsPagesStore subplebbit '${subplebbitAddress}' failed subplebbit.posts.getPage page cid '${pageCid}':`, error)
  const fetchedSubplebbitPage = await utils.retryInfinity(() => subplebbit.posts.getPage(pageCid), {onError})
  await subplebbitsPagesDatabase.setItem(pageCid, utils.clone(fetchedSubplebbitPage))
  return fetchedSubplebbitPage
}

/**
 * Util function to get all pages in the store for a
 * specific subplebbit+sortType using `SubplebbitPage.nextCid`
 */
export const getSubplebbitPages = (subplebbit: Subplebbit, sortType: string, subplebbitsPages: SubplebbitsPages) => {
  assert(subplebbitsPages && typeof subplebbitsPages === 'object', `getSubplebbitPages subplebbitsPages '${subplebbitsPages}' invalid`)
  const pages: SubplebbitPage[] = []
  const firstPageCid = getSubplebbitFirstPageCid(subplebbit, sortType)
  // subplebbit has no pages
  // TODO: if a loaded subplebbit doesn't have a first page, it's unclear what we should do
  // should we try to use another sort type by default, like 'hot', or should we just ignore it?
  // 'return pages' to ignore it for now
  if (!firstPageCid) {
    return pages
  }
  const firstPage = subplebbitsPages[firstPageCid]
  if (!firstPage) {
    return pages
  }
  pages.push(firstPage)
  while (true) {
    const nextCid = pages[pages.length - 1]?.nextCid
    const subplebbitPage = nextCid && subplebbitsPages[nextCid]
    if (!subplebbitPage) {
      return pages
    }
    pages.push(subplebbitPage)
  }
}

export const getSubplebbitFirstPageCid = (subplebbit: Subplebbit, sortType: string) => {
  assert(subplebbit?.address, `getSubplebbitFirstPageCid subplebbit '${subplebbit}' invalid`)
  assert(sortType && typeof sortType === 'string', `getSubplebbitFirstPageCid sortType '${sortType}' invalid`)
  // subplebbit has preloaded posts for sort type
  if (subplebbit.posts?.pages?.[sortType]?.comments) {
    return subplebbit.posts?.pages?.[sortType]?.nextCid
  }
  return subplebbit.posts?.pageCids?.[sortType]

  // TODO: if a loaded subplebbit doesn't have a first page, it's unclear what we should do
  // should we try to use another sort type by default, like 'hot', or should we just ignore it?
}

// reset store in between tests
const originalState = subplebbitsPagesStore.getState()
// async function because some stores have async init
export const resetSubplebbitsPagesStore = async () => {
  fetchPagePending = {}
  // remove all event listeners
  listeners.forEach((listener: any) => listener.removeAllListeners())
  // destroy all component subscriptions to the store
  subplebbitsPagesStore.destroy()
  // restore original state
  subplebbitsPagesStore.setState(originalState)
}

// reset database and store in between tests
export const resetSubplebbitsPagesDatabaseAndStore = async () => {
  await localForageLru.createInstance({name: 'subplebbitsPages'}).clear()
  await resetSubplebbitsPagesStore()
}

export default subplebbitsPagesStore
