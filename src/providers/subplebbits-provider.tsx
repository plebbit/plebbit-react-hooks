import React, {useState, useEffect, useContext} from 'react'
import validator from '../lib/validator'
import assert from 'assert'
import localForageLru from '../lib/localforage-lru'
const subplebbitsDatabase = localForageLru.createInstance({name: 'subplebbits', size: 500})
import Debug from 'debug'
const debug = Debug('plebbit-react-hooks:providers:subplebbits-provider')
import {Props, Subplebbit, Subplebbits, Account} from '../types'
import {AccountsContext} from './accounts-provider'
import utils from '../lib/utils'

type SubplebbitsContext = any

export const SubplebbitsContext = React.createContext<SubplebbitsContext | undefined>(undefined)

const plebbitGetSubplebbitPending: {[key: string]: boolean} = {}

export default function SubplebbitsProvider(props: Props): JSX.Element | null {
  const accountsContext: any = useContext(AccountsContext)
  const [subplebbits, setSubplebbits] = useState<Subplebbits>({})

  const subplebbitsActions: {[key: string]: Function} = {}

  subplebbitsActions.addSubplebbitToContext = async (subplebbitAddress: string, account: Account) => {
    // subplebbit is in context already, do nothing
    let subplebbit: Subplebbit | undefined = subplebbits[subplebbitAddress]
    if (subplebbit || plebbitGetSubplebbitPending[subplebbitAddress + account.id]) {
      return
    }

    // try to find subplebbit in database
    subplebbit = await getSubplebbitFromDatabase(subplebbitAddress, account)

    // subplebbit not in database, fetch from plebbit-js
    if (!subplebbit) {
      plebbitGetSubplebbitPending[subplebbitAddress + account.id] = true
      subplebbit = await account.plebbit.getSubplebbit(subplebbitAddress)
      await subplebbitsDatabase.setItem(subplebbitAddress, utils.clone(subplebbit))
    }
    debug('subplebbitsActions.addSubplebbitToContext', {subplebbitAddress, subplebbit, account})
    setSubplebbits((previousSubplebbits) => ({...previousSubplebbits, [subplebbitAddress]: utils.clone(subplebbit)}))
    plebbitGetSubplebbitPending[subplebbitAddress + account.id] = false

    // the subplebbit has published new posts
    subplebbit.on('update', async (updatedSubplebbit: Subplebbit) => {
      updatedSubplebbit = utils.clone(updatedSubplebbit)
      await subplebbitsDatabase.setItem(subplebbitAddress, updatedSubplebbit)
      debug('subplebbitsContext subplebbit update', {subplebbitAddress, updatedSubplebbit, account})
      setSubplebbits((previousSubplebbits) => ({...previousSubplebbits, [subplebbitAddress]: updatedSubplebbit}))

      // if a subplebbit has a role with an account's address add it to the account.subplebbits
      accountsContext.addSubplebbitRoleToAccountsSubplebbits(updatedSubplebbit)
    })
    subplebbit.update()
  }

  // user is the owner of the subplebbit and can edit it locally
  subplebbitsActions.editSubplebbit = async (subplebbitAddress: string, subplebbitEditOptions: any, account: Account) => {
    assert(
      subplebbitAddress !== '' && typeof subplebbitAddress === 'string',
      `subplebbitsActions.editSubplebbit invalid subplebbitAddress argument '${subplebbitAddress}'`
    )
    assert(
      subplebbitEditOptions && typeof subplebbitEditOptions === 'object',
      `subplebbitsActions.editSubplebbit invalid subplebbitEditOptions argument '${subplebbitEditOptions}'`
    )
    assert(typeof account?.plebbit?.createSubplebbit === 'function', `subplebbitsActions.editSubplebbit invalid account argument '${account}'`)

    // `subplebbitAddress` is different from  `subplebbitEditOptions.address` when editing the subplebbit address
    const subplebbit = await account.plebbit.createSubplebbit({address: subplebbitAddress})
    await subplebbit.edit(subplebbitEditOptions)
    debug('subplebbitsActions.editSubplebbit', {subplebbitAddress, subplebbitEditOptions, subplebbit, account})
    setSubplebbits((previousSubplebbits) => ({
      ...previousSubplebbits,
      // edit react state of both old and new subplebbit address to not break the UI
      [subplebbitAddress]: utils.clone(subplebbit),
      [subplebbit.address]: utils.clone(subplebbit),
    }))
  }

  if (!props.children) {
    return null
  }

  const subplebbitsContext: SubplebbitsContext = {
    subplebbits,
    subplebbitsActions,
  }

  debug({subplebbitsContext: subplebbits})
  return <SubplebbitsContext.Provider value={subplebbitsContext}>{props.children}</SubplebbitsContext.Provider>
}

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
