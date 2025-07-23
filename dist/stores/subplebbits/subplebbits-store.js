var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import assert from 'assert';
import localForageLru from '../../lib/localforage-lru';
const subplebbitsDatabase = localForageLru.createInstance({ name: 'plebbitReactHooks-subplebbits', size: 500 });
import Logger from '@plebbit/plebbit-logger';
const log = Logger('plebbit-react-hooks:subplebbits:stores');
import utils from '../../lib/utils';
import createStore from 'zustand';
import accountsStore from '../accounts';
import subplebbitsPagesStore from '../subplebbits-pages';
let plebbitGetSubplebbitPending = {};
// reset all event listeners in between tests
export const listeners = [];
const subplebbitsStore = createStore((setState, getState) => ({
    subplebbits: {},
    errors: {},
    addSubplebbitToStore(subplebbitAddress, account) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            assert(subplebbitAddress !== '' && typeof subplebbitAddress === 'string', `subplebbitsStore.addSubplebbitToStore invalid subplebbitAddress argument '${subplebbitAddress}'`);
            assert(typeof ((_a = account === null || account === void 0 ? void 0 : account.plebbit) === null || _a === void 0 ? void 0 : _a.getSubplebbit) === 'function', `subplebbitsStore.addSubplebbitToStore invalid account argument '${account}'`);
            // subplebbit is in store already, do nothing
            const { subplebbits } = getState();
            let subplebbit = subplebbits[subplebbitAddress];
            if (subplebbit || plebbitGetSubplebbitPending[subplebbitAddress + account.id]) {
                return;
            }
            // start trying to get subplebbit
            plebbitGetSubplebbitPending[subplebbitAddress + account.id] = true;
            let errorGettingSubplebbit;
            // try to find subplebbit in owner subplebbits
            if (account.plebbit.subplebbits.includes(subplebbitAddress)) {
                subplebbit = yield account.plebbit.createSubplebbit({ address: subplebbitAddress });
            }
            // try to find subplebbit in database
            let fetchedAt;
            if (!subplebbit) {
                const subplebbitData = yield subplebbitsDatabase.getItem(subplebbitAddress);
                if (subplebbitData) {
                    fetchedAt = subplebbitData.fetchedAt;
                    delete subplebbitData.fetchedAt; // not part of plebbit-js schema
                    try {
                        subplebbit = yield account.plebbit.createSubplebbit(subplebbitData);
                    }
                    catch (e) {
                        fetchedAt = undefined;
                        // need to log this always or it could silently fail in production and cache never be used
                        console.error('failed plebbit.createSubplebbit(cachedSubplebbit)', { cachedSubplebbit: subplebbitData, error: e });
                    }
                }
                if (subplebbit) {
                    // add page comments to subplebbitsPagesStore so they can be used in useComment
                    subplebbitsPagesStore.getState().addSubplebbitPageCommentsToStore(subplebbit);
                }
            }
            // subplebbit not in database, try to fetch from plebbit-js
            if (!subplebbit) {
                try {
                    subplebbit = yield account.plebbit.createSubplebbit({ address: subplebbitAddress });
                }
                catch (e) {
                    errorGettingSubplebbit = e;
                }
            }
            // finished trying to get subplebbit
            plebbitGetSubplebbitPending[subplebbitAddress + account.id] = false;
            // failure getting subplebbit
            if (!subplebbit) {
                if (errorGettingSubplebbit) {
                    setState((state) => {
                        let subplebbitErrors = state.errors[subplebbitAddress] || [];
                        subplebbitErrors = [...subplebbitErrors, errorGettingSubplebbit];
                        return Object.assign(Object.assign({}, state), { errors: Object.assign(Object.assign({}, state.errors), { [subplebbitAddress]: subplebbitErrors }) });
                    });
                }
                throw errorGettingSubplebbit || Error(`subplebbitsStore.addSubplebbitToStore failed getting subplebbit '${subplebbitAddress}'`);
            }
            // success getting subplebbit
            const firstSubplebbitState = utils.clone(Object.assign(Object.assign({}, subplebbit), { fetchedAt }));
            yield subplebbitsDatabase.setItem(subplebbitAddress, firstSubplebbitState);
            log('subplebbitsStore.addSubplebbitToStore', { subplebbitAddress, subplebbit, account });
            setState((state) => ({ subplebbits: Object.assign(Object.assign({}, state.subplebbits), { [subplebbitAddress]: firstSubplebbitState }) }));
            // the subplebbit has published new posts
            subplebbit.on('update', (updatedSubplebbit) => __awaiter(this, void 0, void 0, function* () {
                updatedSubplebbit = utils.clone(updatedSubplebbit);
                // add fetchedAt to be able to expire the cache
                // NOTE: fetchedAt is undefined on owner subplebbits because never stale
                updatedSubplebbit.fetchedAt = Math.floor(Date.now() / 1000);
                yield subplebbitsDatabase.setItem(subplebbitAddress, updatedSubplebbit);
                log('subplebbitsStore subplebbit update', { subplebbitAddress, updatedSubplebbit, account });
                setState((state) => ({ subplebbits: Object.assign(Object.assign({}, state.subplebbits), { [subplebbitAddress]: updatedSubplebbit }) }));
                // if a subplebbit has a role with an account's address add it to the account.subplebbits
                accountsStore.getState().accountsActionsInternal.addSubplebbitRoleToAccountsSubplebbits(updatedSubplebbit);
                // add page comments to subplebbitsPagesStore so they can be used in useComment
                subplebbitsPagesStore.getState().addSubplebbitPageCommentsToStore(updatedSubplebbit);
            }));
            subplebbit.on('updatingstatechange', (updatingState) => {
                setState((state) => ({
                    subplebbits: Object.assign(Object.assign({}, state.subplebbits), { [subplebbitAddress]: Object.assign(Object.assign({}, state.subplebbits[subplebbitAddress]), { updatingState }) }),
                }));
            });
            subplebbit.on('error', (error) => {
                setState((state) => {
                    let subplebbitErrors = state.errors[subplebbitAddress] || [];
                    subplebbitErrors = [...subplebbitErrors, error];
                    return Object.assign(Object.assign({}, state), { errors: Object.assign(Object.assign({}, state.errors), { [subplebbitAddress]: subplebbitErrors }) });
                });
            });
            // set clients on subplebbit so the frontend can display it, dont persist in db because a reload cancels updating
            utils.clientsOnStateChange(subplebbit === null || subplebbit === void 0 ? void 0 : subplebbit.clients, (clientState, clientType, clientUrl, chainTicker) => {
                setState((state) => {
                    var _a;
                    // make sure not undefined, sometimes happens in e2e tests
                    if (!state.subplebbits[subplebbitAddress]) {
                        return;
                    }
                    const clients = Object.assign({}, (_a = state.subplebbits[subplebbitAddress]) === null || _a === void 0 ? void 0 : _a.clients);
                    const client = { state: clientState };
                    if (chainTicker) {
                        const chainProviders = Object.assign(Object.assign({}, clients[clientType][chainTicker]), { [clientUrl]: client });
                        clients[clientType] = Object.assign(Object.assign({}, clients[clientType]), { [chainTicker]: chainProviders });
                    }
                    else {
                        clients[clientType] = Object.assign(Object.assign({}, clients[clientType]), { [clientUrl]: client });
                    }
                    return { subplebbits: Object.assign(Object.assign({}, state.subplebbits), { [subplebbitAddress]: Object.assign(Object.assign({}, state.subplebbits[subplebbitAddress]), { clients }) }) };
                });
            });
            listeners.push(subplebbit);
            subplebbit.update().catch((error) => log.trace('subplebbit.update error', { subplebbit, error }));
        });
    },
    // user is the owner of the subplebbit and can edit it locally
    editSubplebbit(subplebbitAddress, subplebbitEditOptions, account) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            assert(subplebbitAddress !== '' && typeof subplebbitAddress === 'string', `subplebbitsStore.editSubplebbit invalid subplebbitAddress argument '${subplebbitAddress}'`);
            assert(subplebbitEditOptions && typeof subplebbitEditOptions === 'object', `subplebbitsStore.editSubplebbit invalid subplebbitEditOptions argument '${subplebbitEditOptions}'`);
            assert(typeof ((_a = account === null || account === void 0 ? void 0 : account.plebbit) === null || _a === void 0 ? void 0 : _a.createSubplebbit) === 'function', `subplebbitsStore.editSubplebbit invalid account argument '${account}'`);
            // `subplebbitAddress` is different from  `subplebbitEditOptions.address` when editing the subplebbit address
            const subplebbit = yield account.plebbit.createSubplebbit({ address: subplebbitAddress });
            yield subplebbit.edit(subplebbitEditOptions);
            const updatedSubplebbit = utils.clone(subplebbit);
            // edit db of both old and new subplebbit address to not break the UI
            yield subplebbitsDatabase.setItem(subplebbitAddress, updatedSubplebbit);
            yield subplebbitsDatabase.setItem(subplebbit.address, updatedSubplebbit);
            log('subplebbitsStore.editSubplebbit', { subplebbitAddress, subplebbitEditOptions, subplebbit, account });
            setState((state) => ({
                subplebbits: Object.assign(Object.assign({}, state.subplebbits), { 
                    // edit react state of both old and new subplebbit address to not break the UI
                    [subplebbitAddress]: updatedSubplebbit, [subplebbit.address]: updatedSubplebbit }),
            }));
        });
    },
    // internal action called by accountsActions.createSubplebbit
    createSubplebbit(createSubplebbitOptions, account) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            assert(!createSubplebbitOptions || typeof createSubplebbitOptions === 'object', `subplebbitsStore.createSubplebbit invalid createSubplebbitOptions argument '${createSubplebbitOptions}'`);
            if (!(createSubplebbitOptions === null || createSubplebbitOptions === void 0 ? void 0 : createSubplebbitOptions.signer)) {
                assert(!(createSubplebbitOptions === null || createSubplebbitOptions === void 0 ? void 0 : createSubplebbitOptions.address), `subplebbitsStore.createSubplebbit createSubplebbitOptions.address '${createSubplebbitOptions === null || createSubplebbitOptions === void 0 ? void 0 : createSubplebbitOptions.address}' must be undefined to create a subplebbit`);
            }
            assert(typeof ((_a = account === null || account === void 0 ? void 0 : account.plebbit) === null || _a === void 0 ? void 0 : _a.createSubplebbit) === 'function', `subplebbitsStore.createSubplebbit invalid account argument '${account}'`);
            const subplebbit = yield account.plebbit.createSubplebbit(createSubplebbitOptions);
            yield subplebbitsDatabase.setItem(subplebbit.address, utils.clone(subplebbit));
            log('subplebbitsStore.createSubplebbit', { createSubplebbitOptions, subplebbit, account });
            setState((state) => ({ subplebbits: Object.assign(Object.assign({}, state.subplebbits), { [subplebbit.address]: utils.clone(subplebbit) }) }));
            return subplebbit;
        });
    },
    // internal action called by accountsActions.deleteSubplebbit
    deleteSubplebbit(subplebbitAddress, account) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            assert(subplebbitAddress && typeof subplebbitAddress === 'string', `subplebbitsStore.deleteSubplebbit invalid subplebbitAddress argument '${subplebbitAddress}'`);
            assert(typeof ((_a = account === null || account === void 0 ? void 0 : account.plebbit) === null || _a === void 0 ? void 0 : _a.createSubplebbit) === 'function', `subplebbitsStore.deleteSubplebbit invalid account argument '${account}'`);
            const subplebbit = yield account.plebbit.createSubplebbit({ address: subplebbitAddress });
            yield subplebbit.delete();
            yield subplebbitsDatabase.removeItem(subplebbitAddress);
            log('subplebbitsStore.deleteSubplebbit', { subplebbitAddress, subplebbit, account });
            setState((state) => ({ subplebbits: Object.assign(Object.assign({}, state.subplebbits), { [subplebbitAddress]: undefined }) }));
        });
    },
}));
// reset store in between tests
const originalState = subplebbitsStore.getState();
// async function because some stores have async init
export const resetSubplebbitsStore = () => __awaiter(void 0, void 0, void 0, function* () {
    plebbitGetSubplebbitPending = {};
    // remove all event listeners
    listeners.forEach((listener) => listener.removeAllListeners());
    // destroy all component subscriptions to the store
    subplebbitsStore.destroy();
    // restore original state
    subplebbitsStore.setState(originalState);
});
// reset database and store in between tests
export const resetSubplebbitsDatabaseAndStore = () => __awaiter(void 0, void 0, void 0, function* () {
    yield localForageLru.createInstance({ name: 'plebbitReactHooks-subplebbits' }).clear();
    yield resetSubplebbitsStore();
});
export default subplebbitsStore;
