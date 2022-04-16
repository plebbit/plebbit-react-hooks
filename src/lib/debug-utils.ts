import localForage from 'localforage'
import localForageLru from '../localforage-lru'

// add debug function to clear the databases
if (process.env.REACT_APP_PLEBBIT_REACT_HOOKS_MOCK_CONTENT && window) {
  if (!window.PlebbitReactHooks) {
    window.PlebbitReactHooks = {}
  }
  window.PlebbitReactHooks.deleteDatabases = () =>
    Promise.all([
      localForage.createInstance({ name: 'accountsMetadata' }).clear(),
      localForage.createInstance({ name: 'accounts' }).clear(),
      localForageLru.createInstance({ name: 'subplebbits' }).clear(),
      localForageLru.createInstance({ name: 'comments' }).clear(),
      localForageLru.createInstance({ name: 'subplebbitsPages' }).clear(),
    ])
}

export default debug = undefined
