import assert from 'assert'
import localForageLru from '../../lib/localforage-lru'
const subplebbitsDatabase = localForageLru.createInstance({name: 'subplebbits', size: 500})
import Logger from '@plebbit/plebbit-logger'
const log = Logger('plebbit-react-hooks:stores:subplebbits')
import {Subplebbit, Subplebbits, Account, CreateSubplebbitOptions} from '../../types'
import utils from '../../lib/utils'
import createStore from 'zustand'
import accountsStore from '../accounts'

let plebbitGetSubplebbitPending: {[key: string]: boolean} = {}

// reset all event listeners in between tests
export const listeners: any = []

type SubplebbitsState = {
  subplebbits: Subplebbits
  addSubplebbitToStore: Function
  editSubplebbit: Function
  createSubplebbit: Function
}

const subplebbitsStore = createStore<SubplebbitsState>((setState: Function, getState: Function) => ({
  subplebbits: {},

  async addSubplebbitToStore(subplebbitAddress: string, account: Account) {
    assert(
      subplebbitAddress !== '' && typeof subplebbitAddress === 'string',
      `subplebbitsStore.addSubplebbitToStore invalid subplebbitAddress argument '${subplebbitAddress}'`
    )
    assert(typeof account?.plebbit?.getSubplebbit === 'function', `subplebbitsStore.addSubplebbitToStore invalid account argument '${account}'`)

    // subplebbit is in store already, do nothing
    const {subplebbits} = getState()
    let subplebbit: Subplebbit | undefined = subplebbits[subplebbitAddress]
    if (subplebbit || plebbitGetSubplebbitPending[subplebbitAddress + account.id]) {
      return
    }

    // start trying to get subplebbit
    plebbitGetSubplebbitPending[subplebbitAddress + account.id] = true
    let errorGettingSubplebbit: any

    // try to find subplebbit in owner subplebbits
    if ((await account.plebbit.listSubplebbits()).includes(subplebbitAddress)) {
      subplebbit = await account.plebbit.createSubplebbit({address: subplebbitAddress})
    }

    // try to find subplebbit in database
    if (!subplebbit) {
      subplebbit = await getSubplebbitFromDatabase(subplebbitAddress, account)
    }

    // subplebbit not in database, try to fetch from plebbit-js
    if (!subplebbit) {
      try {
        subplebbit = await account.plebbit.getSubplebbit(subplebbitAddress)
        log.trace('subplebbitsStore.addSubplebbitToStore plebbit.getSubplebbit', {subplebbitAddress, subplebbit, account})
      } catch (e) {
        errorGettingSubplebbit = e
      }
    }

    // finished trying to get subplebbit
    plebbitGetSubplebbitPending[subplebbitAddress + account.id] = false

    // failure getting subplebbit
    if (!subplebbit) {
      throw errorGettingSubplebbit || Error(`subplebbitsStore.addSubplebbitToStore failed getting subplebbit '${subplebbitAddress}'`)
    }

    // success getting subplebbit
    await subplebbitsDatabase.setItem(subplebbitAddress, utils.clone(subplebbit))
    log('subplebbitsStore.addSubplebbitToStore', {subplebbitAddress, subplebbit, account})
    setState((state: any) => ({subplebbits: {...state.subplebbits, [subplebbitAddress]: utils.clone(subplebbit)}}))

    // the subplebbit has published new posts
    subplebbit.on('update', async (updatedSubplebbit: Subplebbit) => {
      updatedSubplebbit = utils.clone(updatedSubplebbit)
      await subplebbitsDatabase.setItem(subplebbitAddress, updatedSubplebbit)
      log('subplebbitsStore subplebbit update', {subplebbitAddress, updatedSubplebbit, account})
      setState((state: any) => ({subplebbits: {...state.subplebbits, [subplebbitAddress]: updatedSubplebbit}}))

      // if a subplebbit has a role with an account's address add it to the account.subplebbits
      accountsStore.getState().accountsActionsInternal.addSubplebbitRoleToAccountsSubplebbits(updatedSubplebbit)
    })
    listeners.push(subplebbit)
    subplebbit.update()
  },

  // user is the owner of the subplebbit and can edit it locally
  async editSubplebbit(subplebbitAddress: string, subplebbitEditOptions: any, account: Account) {
    assert(subplebbitAddress !== '' && typeof subplebbitAddress === 'string', `subplebbitsStore.editSubplebbit invalid subplebbitAddress argument '${subplebbitAddress}'`)
    assert(
      subplebbitEditOptions && typeof subplebbitEditOptions === 'object',
      `subplebbitsStore.editSubplebbit invalid subplebbitEditOptions argument '${subplebbitEditOptions}'`
    )
    assert(typeof account?.plebbit?.createSubplebbit === 'function', `subplebbitsStore.editSubplebbit invalid account argument '${account}'`)

    // `subplebbitAddress` is different from  `subplebbitEditOptions.address` when editing the subplebbit address
    const subplebbit = await account.plebbit.createSubplebbit({address: subplebbitAddress})
    await subplebbit.edit(subplebbitEditOptions)

    const updatedSubplebbit = utils.clone(subplebbit)
    // edit db of both old and new subplebbit address to not break the UI
    await subplebbitsDatabase.setItem(subplebbitAddress, updatedSubplebbit)
    await subplebbitsDatabase.setItem(subplebbit.address, updatedSubplebbit)
    log('subplebbitsStore.editSubplebbit', {subplebbitAddress, subplebbitEditOptions, subplebbit, account})
    setState((state: any) => ({
      subplebbits: {
        ...state.subplebbits,
        // edit react state of both old and new subplebbit address to not break the UI
        [subplebbitAddress]: updatedSubplebbit,
        [subplebbit.address]: updatedSubplebbit,
      },
    }))
  },

  // internal action called by accountsActions.createSubplebbit
  async createSubplebbit(createSubplebbitOptions: CreateSubplebbitOptions, account: Account) {
    assert(
      !createSubplebbitOptions || typeof createSubplebbitOptions === 'object',
      `subplebbitsStore.createSubplebbit invalid createSubplebbitOptions argument '${createSubplebbitOptions}'`
    )
    if (!createSubplebbitOptions?.signer) {
      assert(
        !createSubplebbitOptions?.address,
        `subplebbitsStore.createSubplebbit createSubplebbitOptions.address '${createSubplebbitOptions?.address}' must be undefined to create a subplebbit`
      )
    }
    assert(typeof account?.plebbit?.createSubplebbit === 'function', `subplebbitsStore.createSubplebbit invalid account argument '${account}'`)

    const subplebbit = await account.plebbit.createSubplebbit(createSubplebbitOptions)
    await subplebbitsDatabase.setItem(subplebbit.address, utils.clone(subplebbit))
    log('subplebbitsStore.createSubplebbit', {createSubplebbitOptions, subplebbit, account})
    setState((state: any) => ({subplebbits: {...state.subplebbits, [subplebbit.address]: utils.clone(subplebbit)}}))
    return subplebbit
  },
}))

const getSubplebbitFromDatabase = async (subplebbitAddress: string, account: Account) => {
  const subplebbitData: any = await subplebbitsDatabase.getItem(subplebbitAddress)
  if (!subplebbitData) {
    return
  }
  const subplebbit = await account.plebbit.createSubplebbit(subplebbitData)

  // add potential missing data from the database onto the subplebbit instance
  for (const prop in subplebbitData) {
    if (subplebbit[prop] === undefined || subplebbit[prop] === null) {
      if (subplebbitData[prop] !== undefined && subplebbitData[prop] !== null) subplebbit[prop] = subplebbitData[prop]
    }
  }
  // add potential missing data from the Pages API
  if (subplebbit.posts) {
    subplebbit.posts.pages = utils.merge(subplebbitData?.posts?.pages || {}, subplebbit?.posts?.pages || {})
    subplebbit.posts.pageCids = utils.merge(subplebbitData?.posts?.pageCids || {}, subplebbit?.posts?.pageCids || {})
  }

  // NOTE: adding missing data is probably not needed with a full implementation of plebbit-js with no bugs
  // but the plebbit mock is barely implemented
  return subplebbit
}

// reset store in between tests
const originalState = subplebbitsStore.getState()
// async function because some stores have async init
export const resetSubplebbitsStore = async () => {
  plebbitGetSubplebbitPending = {}
  // remove all event listeners
  listeners.forEach((listener: any) => listener.removeAllListeners())
  // destroy all component subscriptions to the store
  subplebbitsStore.destroy()
  // restore original state
  subplebbitsStore.setState(originalState)
}

// reset database and store in between tests
export const resetSubplebbitsDatabaseAndStore = async () => {
  await localForageLru.createInstance({name: 'subplebbits'}).clear()
  await resetSubplebbitsStore()
}

export default subplebbitsStore
