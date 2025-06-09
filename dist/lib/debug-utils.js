import localForage from 'localforage';
import localForageLru from '../lib/localforage-lru';
const deleteDatabases = () => Promise.all([
    localForage.createInstance({ name: 'plebbitReactHooks-accountsMetadata' }).clear(),
    localForage.createInstance({ name: 'plebbitReactHooks-accounts' }).clear(),
    localForageLru.createInstance({ name: 'plebbitReactHooks-subplebbits' }).clear(),
    localForageLru.createInstance({ name: 'plebbitReactHooks-comments' }).clear(),
    localForageLru.createInstance({ name: 'plebbitReactHooks-subplebbitsPages' }).clear(),
]);
const deleteCaches = () => Promise.all([
    localForageLru.createInstance({ name: 'plebbitReactHooks-subplebbits' }).clear(),
    localForageLru.createInstance({ name: 'plebbitReactHooks-comments' }).clear(),
    localForageLru.createInstance({ name: 'plebbitReactHooks-subplebbitsPages' }).clear(),
]);
const debugUtils = {
    deleteDatabases,
    deleteCaches,
};
export { deleteDatabases, deleteCaches };
export default debugUtils;
