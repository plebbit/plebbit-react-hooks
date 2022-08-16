import React, {useState, useEffect, useContext, useMemo} from 'react'
import utils from '../../lib/utils'
import Debug from 'debug'
const debug = Debug('plebbit-react-hooks:hooks:feeds')
import {Subplebbits, SubplebbitPage, SubplebbitsPages, SubplebbitsPagesInfo, SubplebbitsPostsInfo} from '../../types'
import useAccountsStore from '../../stores/accounts'
import localForageLru from '../../lib/localforage-lru'
import createStore from 'zustand'
import shallow from 'zustand/shallow'

const subplebbitsPagesDatabase = localForageLru.createInstance({name: 'WORK_IN_PROGRESS__subplebbitsPages', size: 500})

// reset all event listeners in between tests
export const listeners: any = []

// keep large buffer because fetching cids is slow
const subplebbitPostsLeftBeforeNextPage = 50

type SubplebbitsPagesState = {
  subplebbitsPages: SubplebbitsPages
}

const useSubplebbitsPagesStore = createStore<SubplebbitsPagesState>((setState: Function, getState: Function) => ({
  subplebbitsPages: {},
}))

/**
 * Use the `SubplebbitPostsInfo` objects to fetch the first page of all subplebbit/sorts
 * if the `SubplebbitPostsInfo.bufferedPostCount` gets too low, start fetching the next page.
 * Once a next page is added, it is never removed.
 */
export default function useSubplebbitsPages(subplebbitsPostsInfo: SubplebbitsPostsInfo, subplebbits: Subplebbits) {
  // const [subplebbitsPages, setSubplebbitsPages] = useState<SubplebbitsPages>({})
  const subplebbitsPages = useSubplebbitsPagesStore((state) => state.subplebbitsPages, shallow)

  // set the info necessary to fetch each page recursively
  // if bufferedPostCount is less than subplebbitPostsLeftBeforeNextPage
  const subplebbitsPagesInfo = useMemo(() => {
    const newSubplebbitsPagesInfo: SubplebbitsPagesInfo = {}
    for (const infoName in subplebbitsPostsInfo) {
      const {firstPageCid, account, subplebbitAddress, sortType, bufferedPostCount} = subplebbitsPostsInfo[infoName]
      // add first page
      const subplebbitFirstPageInfo = {
        pageCid: firstPageCid,
        account,
        subplebbitAddress,
        sortType,
        // add preloaded subplebbit page if any
        page: subplebbits?.[subplebbitAddress]?.posts?.pages?.[sortType],
      }
      newSubplebbitsPagesInfo[firstPageCid + infoName] = subplebbitFirstPageInfo

      // add all next pages if needed and if available
      if (bufferedPostCount <= subplebbitPostsLeftBeforeNextPage) {
        const subplebbitPages = getSubplebbitPages(firstPageCid, subplebbitsPages)
        for (const page of subplebbitPages) {
          if (page.nextCid) {
            const subplebbitNextPageInfo = {
              pageCid: page.nextCid,
              account,
              subplebbitAddress,
              sortType,
            }
            newSubplebbitsPagesInfo[page.nextCid + infoName] = subplebbitNextPageInfo
          }
        }
      }
    }
    return newSubplebbitsPagesInfo
  }, [JSON.stringify(subplebbitsPostsInfo), subplebbitsPages])

  // fetch subplebbit pages if needed
  // once a page is added, it's never removed
  useEffect(() => {
    for (const infoName in subplebbitsPagesInfo) {
      const {pageCid, account, subplebbitAddress, page} = subplebbitsPagesInfo[infoName]
      // page already fetched or fetching
      if (subplebbitsPages[pageCid] || getSubplebbitPagePending[account.id + pageCid]) {
        continue
      }

      // the subplebbit page was already preloaded in the subplebbit IPNS record
      if (page) {
        // setSubplebbitsPages((previousSubplebbitsPages) => ({
        //   ...previousSubplebbitsPages,
        //   [pageCid]: page,
        // }))
        useSubplebbitsPagesStore.setState(({subplebbitsPages}) => ({
          subplebbitsPages: {...subplebbitsPages, [pageCid]: page},
        }))
        continue
      }

      ;(async () => {
        // subplebbit page is cached
        const cachedSubplebbitPage = await subplebbitsPagesDatabase.getItem(pageCid)
        if (cachedSubplebbitPage) {
          // setSubplebbitsPages((previousSubplebbitsPages) => ({
          //   ...previousSubplebbitsPages,
          //   [pageCid]: cachedSubplebbitPage,
          // }))
          useSubplebbitsPagesStore.setState(({subplebbitsPages}) => ({
            subplebbitsPages: {...subplebbitsPages, [pageCid]: cachedSubplebbitPage},
          }))
          return
        }

        getSubplebbitPagePending[account.id + pageCid] = true
        const subplebbit = await account.plebbit.createSubplebbit({address: subplebbitAddress})
        const fetchedSubplebbitPage = await subplebbit.posts.getPage(pageCid)
        await subplebbitsPagesDatabase.setItem(pageCid, fetchedSubplebbitPage)
        debug('FeedsProvider useSubplebbitsPages subplebbit.posts.getPage', {
          pageCid,
          infoName,
          subplebbitPage: {
            nextCid: fetchedSubplebbitPage.nextCid,
            commentsLength: fetchedSubplebbitPage.comments.length,
            subplebbitsPostsInfo,
          },
        })
        // setSubplebbitsPages((previousSubplebbitsPages) => ({
        //   ...previousSubplebbitsPages,
        //   [pageCid]: fetchedSubplebbitPage,
        // }))
        useSubplebbitsPagesStore.setState(({subplebbitsPages}) => ({
          subplebbitsPages: {...subplebbitsPages, [pageCid]: fetchedSubplebbitPage},
        }))
        getSubplebbitPagePending[account.id + pageCid] = false

        // when publishing a comment, you don't yet know its CID
        // so when a new comment is fetched, check to see if it's your own
        // comment, and if yes, add the CID to your account comments database
        const flattenedReplies = utils.flattenCommentsPages(fetchedSubplebbitPage)
        for (const comment of flattenedReplies) {
          useAccountsStore
            .getState()
            .accountsActionsInternal.addCidToAccountComment(comment)
            .catch((error: unknown) => console.error('FeedsProvider useSubplebbitsPages addCidToAccountComment error', {comment, error}))
        }
      })()
    }
  }, [JSON.stringify(subplebbitsPagesInfo)])

  return subplebbitsPages
}
const getSubplebbitPagePending: {[key: string]: boolean} = {}

/**
 * Util function to gather in an array all loaded `SubplebbitPage` pages of a subplebbit/sort
 * using `SubplebbitPage.nextCid`
 */
const getSubplebbitPages = (firstPageCid: string, subplebbitsPages: SubplebbitsPages) => {
  const pages: SubplebbitPage[] = []
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

// reset store in between tests
const originalState = useSubplebbitsPagesStore.getState()
// async function because some stores have async init
export const resetSubplebbitsPagesStore = async () => {
  // remove all event listeners
  listeners.forEach((listener: any) => listener.removeAllListeners())
  // destroy all component subscriptions to the store
  useSubplebbitsPagesStore.destroy()
  // restore original state
  useSubplebbitsPagesStore.setState(originalState)
}

// reset database and store in between tests
export const resetSubplebbitsPagesDatabaseAndStore = async () => {
  await subplebbitsPagesDatabase.clear()
  await resetSubplebbitsPagesStore()
}