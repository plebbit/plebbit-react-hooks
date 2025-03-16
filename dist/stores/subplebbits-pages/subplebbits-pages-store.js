var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import utils from '../../lib/utils';
import Logger from '@plebbit/plebbit-logger';
// include subplebbits pages store with feeds for debugging
const log = Logger('plebbit-react-hooks:feeds:stores');
import accountsStore from '../accounts';
import subplebbitsStore from '../subplebbits';
import localForageLru from '../../lib/localforage-lru';
import createStore from 'zustand';
import assert from 'assert';
const subplebbitsPagesDatabase = localForageLru.createInstance({ name: 'subplebbitsPages', size: 500 });
// reset all event listeners in between tests
export const listeners = [];
const subplebbitsPagesStore = createStore((setState, getState) => ({
    // TODO: eventually clear old pages and comments from memory
    subplebbitsPages: {},
    comments: {},
    addNextSubplebbitPageToStore: (subplebbit, sortType, account) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        assert((subplebbit === null || subplebbit === void 0 ? void 0 : subplebbit.address) && typeof (subplebbit === null || subplebbit === void 0 ? void 0 : subplebbit.address) === 'string', `subplebbitsPagesStore.addNextSubplebbitPageToStore subplebbit '${subplebbit}' invalid`);
        assert(sortType && typeof sortType === 'string', `subplebbitsPagesStore.addNextSubplebbitPageToStore sortType '${sortType}' invalid`);
        assert(typeof ((_a = account === null || account === void 0 ? void 0 : account.plebbit) === null || _a === void 0 ? void 0 : _a.createSubplebbit) === 'function', `subplebbitsPagesStore.addNextSubplebbitPageToStore account '${account}' invalid`);
        // check the preloaded posts on subplebbit.posts.pages first, then the subplebbit.posts.pageCids
        const subplebbitFirstPageCid = getSubplebbitFirstPageCid(subplebbit, sortType);
        if (!subplebbitFirstPageCid) {
            log(`subplebbitsPagesStore.addNextSubplebbitPageToStore subplebbit '${subplebbit === null || subplebbit === void 0 ? void 0 : subplebbit.address}' sortType '${sortType}' no subplebbitFirstPageCid`);
            return;
        }
        // all subplebbits pages in store
        const { subplebbitsPages } = getState();
        // only specific pages of the subplebbit+sortType
        const subplebbitPages = getSubplebbitPages(subplebbit, sortType, subplebbitsPages);
        // if no pages exist yet, add the first page
        let pageCidToAdd;
        if (!subplebbitPages.length) {
            pageCidToAdd = subplebbitFirstPageCid;
        }
        else {
            const nextCid = (_b = subplebbitPages[subplebbitPages.length - 1]) === null || _b === void 0 ? void 0 : _b.nextCid;
            // if last nextCid is undefined, reached end of pages
            if (!nextCid) {
                log.trace('subplebbitsPagesStore.addNextSubplebbitPageToStore no more pages', { subplebbitAddress: subplebbit.address, sortType, account });
                return;
            }
            pageCidToAdd = nextCid;
        }
        // page is already added or pending
        if (subplebbitsPages[pageCidToAdd] || fetchPagePending[account.id + pageCidToAdd]) {
            return;
        }
        fetchPagePending[account.id + pageCidToAdd] = true;
        let page;
        try {
            page = yield fetchPage(pageCidToAdd, subplebbit.address, account);
            log.trace('subplebbitsPagesStore.addNextSubplebbitPageToStore subplebbit.posts.getPage', { pageCid: pageCidToAdd, subplebbitAddress: subplebbit.address, account });
        }
        catch (e) {
            throw e;
        }
        finally {
            fetchPagePending[account.id + pageCidToAdd] = false;
        }
        // failed getting the page
        if (!page) {
            return;
        }
        // find new comments in the page
        const flattenedComments = utils.flattenCommentsPages(page);
        const { comments } = getState();
        let hasNewComments = false;
        const newComments = {};
        for (const comment of flattenedComments) {
            if (comment.cid && (comment.updatedAt || 0) > (((_c = comments[comment.cid]) === null || _c === void 0 ? void 0 : _c.updatedAt) || 0)) {
                // don't clone the comment to save memory, comments remain a pointer to the page object
                newComments[comment.cid] = comment;
                hasNewComments = true;
            }
        }
        setState(({ subplebbitsPages, comments }) => {
            const newState = { subplebbitsPages: Object.assign(Object.assign({}, subplebbitsPages), { [pageCidToAdd]: page }) };
            if (hasNewComments) {
                newState.comments = Object.assign(Object.assign({}, comments), newComments);
            }
            return newState;
        });
        log('subplebbitsPagesStore.addNextSubplebbitPageToStore', { pageCid: pageCidToAdd, subplebbitAddress: subplebbit.address, sortType, page, account });
        // when publishing a comment, you don't yet know its CID
        // so when a new comment is fetched, check to see if it's your own
        // comment, and if yes, add the CID to your account comments database
        for (const comment of flattenedComments) {
            accountsStore
                .getState()
                .accountsActionsInternal.addCidToAccountComment(comment)
                .catch((error) => log.error('subplebbitsPagesStore.addNextSubplebbitPageToStore addCidToAccountComment error', { comment, error }));
        }
    }),
    // subplebbits contain preloaded pages, those page comments must be added separately
    addSubplebbitPageCommentsToStore: (subplebbit) => {
        var _a, _b;
        if (!((_a = subplebbit.posts) === null || _a === void 0 ? void 0 : _a.pages)) {
            return;
        }
        // find new comments in the page
        const flattenedComments = utils.flattenCommentsPages(subplebbit.posts.pages);
        const { comments } = getState();
        let hasNewComments = false;
        const newComments = {};
        for (const comment of flattenedComments) {
            if (comment.cid && (comment.updatedAt || 0) > (((_b = comments[comment.cid]) === null || _b === void 0 ? void 0 : _b.updatedAt) || 0)) {
                // don't clone the comment to save memory, comments remain a pointer to the page object
                newComments[comment.cid] = comment;
                hasNewComments = true;
            }
        }
        if (!hasNewComments) {
            return;
        }
        setState(({ comments }) => {
            return { comments: Object.assign(Object.assign({}, comments), newComments) };
        });
        log('subplebbitsPagesStore.addSubplebbitPageCommentsToStore', { subplebbit, newComments });
    },
}));
// set clients states on subplebbits store so the frontend can display it, dont persist in db because a reload cancels updating
const onSubplebbitPostsClientsStateChange = (subplebbitAddress) => (clientState, clientType, sortType, clientUrl) => {
    subplebbitsStore.setState((state) => {
        // make sure not undefined, sometimes happens in e2e tests
        if (!state.subplebbits[subplebbitAddress]) {
            return {};
        }
        const client = { state: clientState };
        const subplebbit = Object.assign({}, state.subplebbits[subplebbitAddress]);
        subplebbit.posts = Object.assign({}, subplebbit.posts);
        subplebbit.posts.clients = Object.assign({}, subplebbit.posts.clients);
        subplebbit.posts.clients[clientType] = Object.assign({}, subplebbit.posts.clients[clientType]);
        subplebbit.posts.clients[clientType][sortType] = Object.assign({}, subplebbit.posts.clients[clientType][sortType]);
        subplebbit.posts.clients[clientType][sortType][clientUrl] = client;
        return { subplebbits: Object.assign(Object.assign({}, state.subplebbits), { [subplebbit.address]: subplebbit }) };
    });
};
const subplebbitPostsClientsOnStateChange = (clients, onStateChange) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    for (const sortType in clients === null || clients === void 0 ? void 0 : clients.ipfsGateways) {
        for (const clientUrl in (_a = clients === null || clients === void 0 ? void 0 : clients.ipfsGateways) === null || _a === void 0 ? void 0 : _a[sortType]) {
            (_c = (_b = clients === null || clients === void 0 ? void 0 : clients.ipfsGateways) === null || _b === void 0 ? void 0 : _b[sortType]) === null || _c === void 0 ? void 0 : _c[clientUrl].on('statechange', (state) => onStateChange(state, 'ipfsGateways', sortType, clientUrl));
        }
    }
    for (const sortType in clients === null || clients === void 0 ? void 0 : clients.kuboRpcClients) {
        for (const clientUrl in (_d = clients === null || clients === void 0 ? void 0 : clients.kuboRpcClients) === null || _d === void 0 ? void 0 : _d[sortType]) {
            (_f = (_e = clients === null || clients === void 0 ? void 0 : clients.kuboRpcClients) === null || _e === void 0 ? void 0 : _e[sortType]) === null || _f === void 0 ? void 0 : _f[clientUrl].on('statechange', (state) => onStateChange(state, 'kuboRpcClients', sortType, clientUrl));
        }
    }
    for (const sortType in clients === null || clients === void 0 ? void 0 : clients.plebbitRpcClients) {
        for (const clientUrl in (_g = clients === null || clients === void 0 ? void 0 : clients.plebbitRpcClients) === null || _g === void 0 ? void 0 : _g[sortType]) {
            (_j = (_h = clients === null || clients === void 0 ? void 0 : clients.plebbitRpcClients) === null || _h === void 0 ? void 0 : _h[sortType]) === null || _j === void 0 ? void 0 : _j[clientUrl].on('statechange', (state) => onStateChange(state, 'plebbitRpcClients', sortType, clientUrl));
        }
    }
};
const fetchPageSubplebbits = {}; // cache plebbit.createSubplebbits because sometimes it's slow
let fetchPagePending = {};
const fetchPage = (pageCid, subplebbitAddress, account) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    // subplebbit page is cached
    const cachedSubplebbitPage = yield subplebbitsPagesDatabase.getItem(pageCid);
    if (cachedSubplebbitPage) {
        return cachedSubplebbitPage;
    }
    if (!fetchPageSubplebbits[subplebbitAddress]) {
        fetchPageSubplebbits[subplebbitAddress] = yield account.plebbit.createSubplebbit({ address: subplebbitAddress });
        // set clients states on subplebbits store so the frontend can display it
        subplebbitPostsClientsOnStateChange((_d = fetchPageSubplebbits[subplebbitAddress].posts) === null || _d === void 0 ? void 0 : _d.clients, onSubplebbitPostsClientsStateChange(subplebbitAddress));
    }
    const onError = (error) => log.error(`subplebbitsPagesStore subplebbit '${subplebbitAddress}' failed subplebbit.posts.getPage page cid '${pageCid}':`, error);
    const fetchedSubplebbitPage = yield utils.retryInfinity(() => fetchPageSubplebbits[subplebbitAddress].posts.getPage(pageCid), { onError });
    yield subplebbitsPagesDatabase.setItem(pageCid, utils.clone(fetchedSubplebbitPage));
    return fetchedSubplebbitPage;
});
/**
 * Util function to get all pages in the store for a
 * specific subplebbit+sortType using `SubplebbitPage.nextCid`
 */
export const getSubplebbitPages = (subplebbit, sortType, subplebbitsPages) => {
    var _a;
    assert(subplebbitsPages && typeof subplebbitsPages === 'object', `getSubplebbitPages subplebbitsPages '${subplebbitsPages}' invalid`);
    const pages = [];
    const firstPageCid = getSubplebbitFirstPageCid(subplebbit, sortType);
    // subplebbit has no pages
    // TODO: if a loaded subplebbit doesn't have a first page, it's unclear what we should do
    // should we try to use another sort type by default, like 'hot', or should we just ignore it?
    // 'return pages' to ignore it for now
    if (!firstPageCid) {
        return pages;
    }
    const firstPage = subplebbitsPages[firstPageCid];
    if (!firstPage) {
        return pages;
    }
    pages.push(firstPage);
    while (true) {
        const nextCid = (_a = pages[pages.length - 1]) === null || _a === void 0 ? void 0 : _a.nextCid;
        const subplebbitPage = nextCid && subplebbitsPages[nextCid];
        if (!subplebbitPage) {
            return pages;
        }
        pages.push(subplebbitPage);
    }
};
export const getSubplebbitFirstPageCid = (subplebbit, sortType) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    assert(subplebbit === null || subplebbit === void 0 ? void 0 : subplebbit.address, `getSubplebbitFirstPageCid subplebbit '${subplebbit}' invalid`);
    assert(sortType && typeof sortType === 'string', `getSubplebbitFirstPageCid sortType '${sortType}' invalid`);
    // subplebbit has preloaded posts for sort type
    if ((_c = (_b = (_a = subplebbit.posts) === null || _a === void 0 ? void 0 : _a.pages) === null || _b === void 0 ? void 0 : _b[sortType]) === null || _c === void 0 ? void 0 : _c.comments) {
        return (_f = (_e = (_d = subplebbit.posts) === null || _d === void 0 ? void 0 : _d.pages) === null || _e === void 0 ? void 0 : _e[sortType]) === null || _f === void 0 ? void 0 : _f.nextCid;
    }
    return (_h = (_g = subplebbit.posts) === null || _g === void 0 ? void 0 : _g.pageCids) === null || _h === void 0 ? void 0 : _h[sortType];
    // TODO: if a loaded subplebbit doesn't have a first page, it's unclear what we should do
    // should we try to use another sort type by default, like 'hot', or should we just ignore it?
};
// reset store in between tests
const originalState = subplebbitsPagesStore.getState();
// async function because some stores have async init
export const resetSubplebbitsPagesStore = () => __awaiter(void 0, void 0, void 0, function* () {
    fetchPagePending = {};
    // remove all event listeners
    listeners.forEach((listener) => listener.removeAllListeners());
    // destroy all component subscriptions to the store
    subplebbitsPagesStore.destroy();
    // restore original state
    subplebbitsPagesStore.setState(originalState);
});
// reset database and store in between tests
export const resetSubplebbitsPagesDatabaseAndStore = () => __awaiter(void 0, void 0, void 0, function* () {
    yield localForageLru.createInstance({ name: 'subplebbitsPages' }).clear();
    yield resetSubplebbitsPagesStore();
});
export default subplebbitsPagesStore;
