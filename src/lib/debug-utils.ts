import localForage from 'localforage'
import localForageLru from '../lib/localforage-lru'

const deleteDatabases = () =>
  Promise.all([
    localForage.createInstance({ name: 'accountsMetadata' }).clear(),
    localForage.createInstance({ name: 'accounts' }).clear(),
    localForageLru.createInstance({ name: 'subplebbits' }).clear(),
    localForageLru.createInstance({ name: 'comments' }).clear(),
    localForageLru.createInstance({ name: 'subplebbitsPages' }).clear(),
  ])

const debugUtils = {deleteDatabases}
export {deleteDatabases}

export default debugUtils
