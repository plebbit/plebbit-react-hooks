import utils from '../../lib/utils'
import Debug from 'debug'
const debug = Debug('plebbit-react-hooks:stores:feeds')
import {Subplebbits, SubplebbitPage, SubplebbitsPages, SubplebbitsPagesInfo, SubplebbitsPostsInfo} from '../../types'
import useAccountsStore from '../accounts'
import localForageLru from '../../lib/localforage-lru'
import createStore from 'zustand'
import shallow from 'zustand/shallow'

const subplebbitsPagesDatabase = localForageLru.createInstance({name: 'subplebbitsPages', size: 500})

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
