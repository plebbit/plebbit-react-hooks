import localForage from 'localforage';
import localForageLru from '../lib/localforage-lru';
const deleteDatabases = () => Promise.all([
    localForage.createInstance({ name: 'accountsMetadata' }).clear(),
    localForage.createInstance({ name: 'accounts' }).clear(),
    localForageLru.createInstance({ name: 'subplebbits' }).clear(),
    localForageLru.createInstance({ name: 'comments' }).clear(),
    localForageLru.createInstance({ name: 'subplebbitsPages' }).clear(),
]);
const plebbitReactHooksDebugUtils = { deleteDatabases };
// add debug function to clear the databases
if (process.env.REACT_APP_PLEBBIT_REACT_HOOKS_MOCK_CONTENT && window) {
    // @ts-ignore
    if (!window.plebbitReactHooksDebugUtils) {
        // @ts-ignore
        window.plebbitReactHooksDebugUtils = plebbitReactHooksDebugUtils;
    }
}
export default plebbitReactHooksDebugUtils;
