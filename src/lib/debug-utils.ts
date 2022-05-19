import localForage from 'localforage'
import localForageLru from '../lib/localforage-lru'

const deleteDatabases = () =>
  Promise.all([
    localForage.createInstance({name: 'accountsMetadata'}).clear(),
    localForage.createInstance({name: 'accounts'}).clear(),
    localForageLru.createInstance({name: 'subplebbits'}).clear(),
    localForageLru.createInstance({name: 'comments'}).clear(),
    localForageLru.createInstance({name: 'subplebbitsPages'}).clear(),
  ])

const deleteCaches = () =>
  Promise.all([
    localForageLru.createInstance({name: 'subplebbits'}).clear(),
    localForageLru.createInstance({name: 'comments'}).clear(),
    localForageLru.createInstance({name: 'subplebbitsPages'}).clear(),
  ])

const deleteAccountsDatabases = () =>
  Promise.all([localForage.createInstance({name: 'accountsMetadata'}).clear(), localForage.createInstance({name: 'accounts'}).clear()])

const deleteNonAccountsDatabases = () =>
  Promise.all([
    localForageLru.createInstance({name: 'subplebbits'}).clear(),
    localForageLru.createInstance({name: 'comments'}).clear(),
    localForageLru.createInstance({name: 'subplebbitsPages'}).clear(),
  ])

const debugUtils = {
  deleteDatabases,
  deleteCaches,
  deleteAccountsDatabases,
  deleteNonAccountsDatabases,
}

export {deleteDatabases, deleteCaches, deleteAccountsDatabases, deleteNonAccountsDatabases}

export default debugUtils
