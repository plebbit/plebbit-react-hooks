import utils from '../../lib/utils'
import Logger from '@plebbit/plebbit-logger'
// include subplebbits pages store with feeds for debugging
const log = Logger('plebbit-react-hooks:stores:feeds')
import {Subplebbit, SubplebbitPage, SubplebbitsPages, Account} from '../../types'
import accountsStore from '../accounts'
import localForageLru from '../../lib/localforage-lru'
import createStore from 'zustand'
import assert from 'assert'

const subplebbitsPagesDatabase = localForageLru.createInstance({name: 'subplebbitsPages', size: 500})

// reset all event listeners in between tests
export const listeners: any = []

type SubplebbitsPagesState = {
  subplebbitsPages: SubplebbitsPages
  addNextSubplebbitPageToStore: Function
}

const subplebbitsPagesStore = createStore<SubplebbitsPagesState>((setState: Function, getState: Function) => ({
  subplebbitsPages: {},

  addNextSubplebbitPageToStore: async (subplebbit: Subplebbit, sortType: string, account: Account) => {
    assert(subplebbit?.address && typeof subplebbit?.address === 'string', `subplebbitsPagesStore.addNextSubplebbitPageToStore subplebbit '${subplebbit}' invalid`)
    assert(sortType && typeof sortType === 'string', `subplebbitsPagesStore.addNextSubplebbitPageToStore sortType '${sortType}' invalid`)
    assert(typeof account?.plebbit?.createSubplebbit === 'function', `subplebbitsPagesStore.addNextSubplebbitPageToStore account '${account}' invalid`)

    // check the preloaded posts on subplebbit.posts.pages first, then the subplebbit.posts.pageCids
    const subplebbitFirstPageCid = getSubplebbitFirstPageCid(subplebbit, sortType)
    assert(
      subplebbitFirstPageCid && typeof subplebbitFirstPageCid === 'string',
      `subplebbitsPagesStore.addNextSubplebbitPageToStore subplebbit.posts?.pageCids?.['${sortType}'] '${subplebbit.posts?.pageCids?.[sortType]}' invalid`
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
      setState(({subplebbitsPages}: any) => ({
        subplebbitsPages: {...subplebbitsPages, [pageCidToAdd]: page},
      }))
      log('subplebbitsPagesStore.addNextSubplebbitPageToStore', {pageCid: pageCidToAdd, subplebbitAddress: subplebbit.address, sortType, page, account})
    } catch (e) {
      throw e
    } finally {
      fetchPagePending[account.id + pageCidToAdd] = false
    }

    // when publishing a comment, you don't yet know its CID
    // so when a new comment is fetched, check to see if it's your own
    // comment, and if yes, add the CID to your account comments database
    const flattenedReplies = utils.flattenCommentsPages(page)
    for (const comment of flattenedReplies) {
      accountsStore
        .getState()
        .accountsActionsInternal.addCidToAccountComment(comment)
        .catch((error: unknown) => log.error('subplebbitsPagesStore.addNextSubplebbitPageToStore addCidToAccountComment error', {comment, error}))
    }
  },
}))

let fetchPagePending: {[key: string]: boolean} = {}
const fetchPage = async (pageCid: string, subplebbitAddress: string, account: Account) => {
  // subplebbit page is cached
  const cachedSubplebbitPage = await subplebbitsPagesDatabase.getItem(pageCid)
  if (cachedSubplebbitPage) {
    return cachedSubplebbitPage
  }
  const subplebbit = await account.plebbit.createSubplebbit({address: subplebbitAddress})
  const fetchedSubplebbitPage = await utils.retryInfinity(() => subplebbit.posts.getPage(pageCid))
  await subplebbitsPagesDatabase.setItem(pageCid, fetchedSubplebbitPage)
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
