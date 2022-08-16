var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Debug from 'debug';
const debug = Debug('plebbit-react-hooks:stores:feeds');
import localForageLru from '../../lib/localforage-lru';
import createStore from 'zustand';
const subplebbitsPagesDatabase = localForageLru.createInstance({ name: 'subplebbitsPages', size: 500 });
// reset all event listeners in between tests
export const listeners = [];
// keep large buffer because fetching cids is slow
const subplebbitPostsLeftBeforeNextPage = 50;
const useSubplebbitsPagesStore = createStore((setState, getState) => ({
    subplebbitsPages: {},
}));
// reset store in between tests
const originalState = useSubplebbitsPagesStore.getState();
// async function because some stores have async init
export const resetSubplebbitsPagesStore = () => __awaiter(void 0, void 0, void 0, function* () {
    // remove all event listeners
    listeners.forEach((listener) => listener.removeAllListeners());
    // destroy all component subscriptions to the store
    useSubplebbitsPagesStore.destroy();
    // restore original state
    useSubplebbitsPagesStore.setState(originalState);
});
// reset database and store in between tests
export const resetSubplebbitsPagesDatabaseAndStore = () => __awaiter(void 0, void 0, void 0, function* () {
    yield subplebbitsPagesDatabase.clear();
    yield resetSubplebbitsPagesStore();
});
