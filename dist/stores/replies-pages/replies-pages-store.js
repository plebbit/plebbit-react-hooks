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
// include replies pages store with feeds for debugging
const log = Logger('plebbit-react-hooks:replies:stores');
import accountsStore from '../accounts';
import commentsStore from '../comments';
import { addChildrenRepliesFeedsToAddToStore } from './utils';
import localForageLru from '../../lib/localforage-lru';
import createStore from 'zustand';
import assert from 'assert';
const repliesPagesDatabase = localForageLru.createInstance({ name: 'plebbitReactHooks-repliesPages', size: 500 });
// reset all event listeners in between tests
export const listeners = [];
const repliesPagesStore = createStore((setState, getState) => ({
    // TODO: eventually clear old pages and comments from memory
    repliesPages: {},
    comments: {},
    addNextRepliesPageToStore: (comment, sortType, account) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        assert((comment === null || comment === void 0 ? void 0 : comment.cid) && typeof (comment === null || comment === void 0 ? void 0 : comment.cid) === 'string', `repliesPagesStore.addNextRepliesPageToStore comment '${comment}' invalid`);
        assert(sortType && typeof sortType === 'string', `repliesPagesStore.addNextRepliesPageToStore sortType '${sortType}' invalid`);
        assert(typeof ((_a = account === null || account === void 0 ? void 0 : account.plebbit) === null || _a === void 0 ? void 0 : _a.createSubplebbit) === 'function', `repliesPagesStore.addNextRepliesPageToStore account '${account}' invalid`);
        // check the preloaded replies on comment.replies.pages first, then the comment.replies.pageCids
        const repliesFirstPageCid = getRepliesFirstPageCid(comment, sortType);
        if (!repliesFirstPageCid) {
            log(`repliesPagesStore.addNextRepliesPageToStore comment '${comment === null || comment === void 0 ? void 0 : comment.cid}' sortType '${sortType}' no repliesFirstPageCid`);
            return;
        }
        // all replies pages in store
        const repliesPagesStore = getState();
        // only specific pages of the comment+sortType
        const repliesPages = getRepliesPages(comment, sortType, repliesPagesStore.repliesPages);
        // if no pages exist yet, add the first page
        let pageCidToAdd;
        if (!repliesPages.length) {
            pageCidToAdd = repliesFirstPageCid;
        }
        else {
            const nextCid = (_b = repliesPages[repliesPages.length - 1]) === null || _b === void 0 ? void 0 : _b.nextCid;
            // if last nextCid is undefined, reached end of pages
            if (!nextCid) {
                log.trace('repliesPagesStore.addNextRepliesPageToStore no more pages', { commentCid: comment.cid, sortType, account });
                return;
            }
            pageCidToAdd = nextCid;
        }
        // page is already added or pending
        if (repliesPagesStore.repliesPages[pageCidToAdd] || fetchPagePending[account.id + pageCidToAdd]) {
            return;
        }
        fetchPagePending[account.id + pageCidToAdd] = true;
        let page;
        try {
            page = yield fetchPage(pageCidToAdd, comment, account);
            log.trace('repliesPagesStore.addNextRepliesPageToStore comment.replies.getPage', {
                pageCid: pageCidToAdd,
                page,
                commentCid: comment.cid,
                subplebbitAddress: comment.subplebbitAddress,
                account,
            });
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
        // add missing children replies feeds
        addChildrenRepliesFeedsToAddToStore(page, comment);
        setState(({ repliesPages, comments }) => {
            const newState = { repliesPages: Object.assign(Object.assign({}, repliesPages), { [pageCidToAdd]: page }) };
            if (hasNewComments) {
                newState.comments = Object.assign(Object.assign({}, comments), newComments);
            }
            return newState;
        });
        log('repliesPagesStore.addNextRepliesPageToStore', { pageCid: pageCidToAdd, commentCid: comment.cid, sortType, page, account });
        // when publishing a comment, you don't yet know its CID
        // so when a new comment is fetched, check to see if it's your own
        // comment, and if yes, add the CID to your account comments database
        for (const comment of flattenedComments) {
            accountsStore
                .getState()
                .accountsActionsInternal.addCidToAccountComment(comment)
                .catch((error) => log.error('repliesPagesStore.addNextRepliesPageToStore addCidToAccountComment error', { comment, error }));
        }
    }),
    // comments contain preloaded pages, those page comments must be added separately
    addRepliesPageCommentsToStore: (comment) => {
        var _a, _b;
        if (!((_a = comment.replies) === null || _a === void 0 ? void 0 : _a.pages)) {
            return;
        }
        // find new comments in the page
        const flattenedComments = utils.flattenCommentsPages(comment.replies.pages);
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
        log('repliesPagesStore.addRepliesPageCommentsToStore', { comment, newComments });
    },
}));
// set clients states on comments store so the frontend can display it, dont persist in db because a reload cancels updating
const onCommentRepliesClientsStateChange = (commentCid) => (clientState, clientType, sortType, clientUrl) => {
    commentsStore.setState((state) => {
        // make sure not undefined, sometimes happens in e2e tests
        if (!state.comments[commentCid]) {
            return {};
        }
        const client = { state: clientState };
        const comment = Object.assign({}, state.comments[commentCid]);
        comment.replies = Object.assign({}, comment.replies);
        comment.replies.clients = Object.assign({}, comment.replies.clients);
        comment.replies.clients[clientType] = Object.assign({}, comment.replies.clients[clientType]);
        comment.replies.clients[clientType][sortType] = Object.assign({}, comment.replies.clients[clientType][sortType]);
        comment.replies.clients[clientType][sortType][clientUrl] = client;
        return { comments: Object.assign(Object.assign({}, state.comments), { [commentCid]: comment }) };
    });
};
const commentRepliesClientsOnStateChange = (clients, onStateChange) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
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
    for (const sortType in clients === null || clients === void 0 ? void 0 : clients.libp2pJsClients) {
        for (const clientUrl in (_k = clients === null || clients === void 0 ? void 0 : clients.libp2pJsClients) === null || _k === void 0 ? void 0 : _k[sortType]) {
            (_m = (_l = clients === null || clients === void 0 ? void 0 : clients.libp2pJsClients) === null || _l === void 0 ? void 0 : _l[sortType]) === null || _m === void 0 ? void 0 : _m[clientUrl].on('statechange', (state) => onStateChange(state, 'libp2pJsClients', sortType, clientUrl));
        }
    }
};
const fetchPageComments = {}; // cache plebbit.createComment because sometimes it's slow
let fetchPagePending = {};
const fetchPage = (pageCid, comment, account) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    // replies page is cached
    const cachedRepliesPage = yield repliesPagesDatabase.getItem(pageCid);
    if (cachedRepliesPage) {
        return cachedRepliesPage;
    }
    if (!fetchPageComments[comment.cid]) {
        fetchPageComments[comment.cid] = yield account.plebbit.createComment({
            cid: comment.cid,
            postCid: comment.postCid,
            subplebbitAddress: comment.subplebbitAddress,
            depth: comment.depth,
        });
        // set clients states on subplebbits store so the frontend can display it
        commentRepliesClientsOnStateChange((_d = fetchPageComments[comment.cid].replies) === null || _d === void 0 ? void 0 : _d.clients, onCommentRepliesClientsStateChange(comment.cid));
    }
    const onError = (error) => log.error(`repliesPagesStore comment '${comment.cid}' failed comment.replies.getPage page cid '${pageCid}':`, error);
    const fetchedRepliesPage = yield utils.retryInfinity(() => fetchPageComments[comment.cid].replies.getPage(pageCid), { onError });
    yield repliesPagesDatabase.setItem(pageCid, utils.clone(fetchedRepliesPage));
    return fetchedRepliesPage;
});
/**
 * Util function to get all pages in the store for a
 * specific comment+sortType using `RepliesPage.nextCid`
 */
export const getRepliesPages = (comment, sortType, repliesPages) => {
    var _a;
    assert(repliesPages && typeof repliesPages === 'object', `getRepliesPages repliesPages '${repliesPages}' invalid`);
    const pages = [];
    const firstPageCid = getRepliesFirstPageCid(comment, sortType);
    // comment has no pages
    // TODO: if a loaded comment doesn't have a first page, it's unclear what we should do
    // should we try to use another sort type by default, like 'best', or should we just ignore it?
    // 'return pages' to ignore it for now
    if (!firstPageCid) {
        return pages;
    }
    const firstPage = repliesPages[firstPageCid];
    if (!firstPage) {
        return pages;
    }
    pages.push(firstPage);
    while (true) {
        const nextCid = (_a = pages[pages.length - 1]) === null || _a === void 0 ? void 0 : _a.nextCid;
        const repliesPage = nextCid && repliesPages[nextCid];
        if (!repliesPage) {
            return pages;
        }
        pages.push(repliesPage);
    }
};
export const getRepliesFirstPageCid = (comment, sortType) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    assert(comment === null || comment === void 0 ? void 0 : comment.cid, `getRepliesFirstPageCid comment '${comment}' invalid`);
    assert(sortType && typeof sortType === 'string', `getRepliesFirstPageCid sortType '${sortType}' invalid`);
    // comment has preloaded replies for sort type
    if ((_c = (_b = (_a = comment.replies) === null || _a === void 0 ? void 0 : _a.pages) === null || _b === void 0 ? void 0 : _b[sortType]) === null || _c === void 0 ? void 0 : _c.comments) {
        return (_f = (_e = (_d = comment.replies) === null || _d === void 0 ? void 0 : _d.pages) === null || _e === void 0 ? void 0 : _e[sortType]) === null || _f === void 0 ? void 0 : _f.nextCid;
    }
    return (_h = (_g = comment.replies) === null || _g === void 0 ? void 0 : _g.pageCids) === null || _h === void 0 ? void 0 : _h[sortType];
    // TODO: if a loaded comment doesn't have a first page, it's unclear what we should do
    // should we try to use another sort type by default, like 'best', or should we just ignore it?
};
// reset store in between tests
const originalState = repliesPagesStore.getState();
// async function because some stores have async init
export const resetRepliesPagesStore = () => __awaiter(void 0, void 0, void 0, function* () {
    fetchPagePending = {};
    // remove all event listeners
    listeners.forEach((listener) => listener.removeAllListeners());
    // destroy all component subscriptions to the store
    repliesPagesStore.destroy();
    // restore original state
    repliesPagesStore.setState(originalState);
});
// reset database and store in between tests
export const resetRepliesPagesDatabaseAndStore = () => __awaiter(void 0, void 0, void 0, function* () {
    yield localForageLru.createInstance({ name: 'plebbitReactHooks-repliesPages' }).clear();
    yield resetRepliesPagesStore();
});
export default repliesPagesStore;
