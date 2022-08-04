import assert from 'assert'
import localForageLru from '../../lib/localforage-lru'
const subplebbitsDatabase = localForageLru.createInstance({name: 'subplebbits', size: 500})
import Debug from 'debug'
const debug = Debug('plebbit-react-hooks:stores:subplebbits')
import {Subplebbit, Subplebbits, Account, CreateSubplebbitOptions} from '../../types'
import utils from '../../lib/utils'
import createStore from 'zustand'
import accountsStore from '../accounts'

const plebbitGetSubplebbitPending: {[key: string]: boolean} = {}

// reset all event listeners in between tests
export const listeners: any = []

type SubplebbitsState = {
  subplebbits: Subplebbits
  addSubplebbitToStore: Function
  editSubplebbit: Function
  createSubplebbit: Function
}

const useSubplebbitsStore = createStore<SubplebbitsState>((setState: Function, getState: Function) => ({
  subplebbits: {},

  async addSubplebbitToStore(subplebbitAddress: string, account: Account) {
    assert(
      subplebbitAddress !== '' && typeof subplebbitAddress === 'string',
      `subplebbitsStore.addSubplebbitToStore invalid subplebbitAddress argument '${subplebbitAddress}'`
    )
    assert(typeof account?.plebbit?.getSubplebbit === 'function', `subplebbitsStore.addSubplebbitToStore invalid account argument '${account}'`)

    const {subplebbits} = getState()

    // subplebbit is in store already, do nothing
    let subplebbit: Subplebbit | undefined = subplebbits[subplebbitAddress]
    if (subplebbit || plebbitGetSubplebbitPending[subplebbitAddress + account.id]) {
      return
    }
    plebbitGetSubplebbitPending[subplebbitAddress + account.id] = true

    // try to find subplebbit in database
    subplebbit = await getSubplebbitFromDatabase(subplebbitAddress, account)

    // subplebbit not in database, fetch from plebbit-js
    try {
      if (!subplebbit) {
        subplebbit = await account.plebbit.getSubplebbit(subplebbitAddress)
        debug('subplebbitsStore.addSubplebbitToStore plebbit.getSubplebbit', {subplebbitAddress, subplebbit, account})
        await subplebbitsDatabase.setItem(subplebbitAddress, utils.clone(subplebbit))
      }
      debug('subplebbitsStore.addSubplebbitToStore', {subplebbitAddress, subplebbit, account})
      setState((state: any) => ({subplebbits: {...state.subplebbits, [subplebbitAddress]: utils.clone(subplebbit)}}))
    } catch (e) {
      throw e
    } finally {
      plebbitGetSubplebbitPending[subplebbitAddress + account.id] = false
    }

    // the subplebbit has published new posts
    subplebbit.on('update', async (updatedSubplebbit: Subplebbit) => {
      updatedSubplebbit = utils.clone(updatedSubplebbit)
      await subplebbitsDatabase.setItem(subplebbitAddress, updatedSubplebbit)
      debug('subplebbitsStore subplebbit update', {subplebbitAddress, updatedSubplebbit, account})
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
    debug('subplebbitsStore.editSubplebbit', {subplebbitAddress, subplebbitEditOptions, subplebbit, account})
    setState((state: any) => ({
      subplebbits: {
        ...state.subplebbits,
        // edit react state of both old and new subplebbit address to not break the UI
        [subplebbitAddress]: utils.clone(subplebbit),
        [subplebbit.address]: utils.clone(subplebbit),
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
    debug('subplebbitsStore.createSubplebbit', {createSubplebbitOptions, subplebbit, account})
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
const originalState = useSubplebbitsStore.getState()
// async function because some stores have async init
export const resetSubplebbitsStore = async () => {
  // remove all event listeners
  listeners.forEach((listener: any) => listener.removeAllListeners())
  // destroy all component subscriptions to the store
  useSubplebbitsStore.destroy()
  // restore original state
  useSubplebbitsStore.setState(originalState)
}

// reset database and store in between tests
export const resetSubplebbitsDatabaseAndStore = async () => {
  await localForageLru.createInstance({name: 'subplebbits'}).clear()
  await resetSubplebbitsStore()
}

export default useSubplebbitsStore
