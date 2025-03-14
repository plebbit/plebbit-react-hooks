var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import localForageLru from '../../lib/localforage-lru';
const commentsDatabase = localForageLru.createInstance({ name: 'comments', size: 5000 });
import Logger from '@plebbit/plebbit-logger';
const log = Logger('plebbit-react-hooks:comments:stores');
import utils from '../../lib/utils';
import createStore from 'zustand';
import accountsStore from '../accounts';
import repliesPagesStore from '../replies-pages';
let plebbitGetCommentPending = {};
// reset all event listeners in between tests
export const listeners = [];
const commentsStore = createStore((setState, getState) => ({
    comments: {},
    errors: {},
    addCommentToStore(commentCid, account) {
        return __awaiter(this, void 0, void 0, function* () {
            const { comments } = getState();
            // comment is in store already, do nothing
            let comment = comments[commentCid];
            if (comment || plebbitGetCommentPending[commentCid + account.id]) {
                return;
            }
            plebbitGetCommentPending[commentCid + account.id] = true;
            // try to find comment in database
            comment = yield getCommentFromDatabase(commentCid, account);
            if (comment) {
                // add comment replies pages to repliesPagesStore so they can be used in useComment
                repliesPagesStore.getState().addRepliesPageCommentsToStore(comment);
            }
            // comment not in database, fetch from plebbit-js
            try {
                if (!comment) {
                    comment = yield account.plebbit.createComment({ cid: commentCid });
                    yield commentsDatabase.setItem(commentCid, utils.clone(comment));
                }
                log('commentsStore.addCommentToStore', { commentCid, comment, account });
                setState((state) => ({ comments: Object.assign(Object.assign({}, state.comments), { [commentCid]: utils.clone(comment) }) }));
            }
            catch (e) {
                setState((state) => {
                    let commentErrors = state.errors[commentCid] || [];
                    commentErrors = [...commentErrors, e];
                    return Object.assign(Object.assign({}, state), { errors: Object.assign(Object.assign({}, state.errors), { [commentCid]: commentErrors }) });
                });
                throw e;
            }
            finally {
                plebbitGetCommentPending[commentCid + account.id] = false;
            }
            // the comment is still missing up to date mutable data like upvotes, edits, replies, etc
            comment === null || comment === void 0 ? void 0 : comment.on('update', (updatedComment) => __awaiter(this, void 0, void 0, function* () {
                updatedComment = utils.clone(updatedComment);
                yield commentsDatabase.setItem(commentCid, updatedComment);
                log('commentsStore comment update', { commentCid, updatedComment, account });
                setState((state) => ({ comments: Object.assign(Object.assign({}, state.comments), { [commentCid]: updatedComment }) }));
                // add comment replies pages to repliesPagesStore so they can be used in useComment
                repliesPagesStore.getState().addRepliesPageCommentsToStore(comment);
            }));
            comment === null || comment === void 0 ? void 0 : comment.on('updatingstatechange', (updatingState) => {
                setState((state) => ({
                    comments: Object.assign(Object.assign({}, state.comments), { [commentCid]: Object.assign(Object.assign({}, state.comments[commentCid]), { updatingState }) }),
                }));
            });
            comment === null || comment === void 0 ? void 0 : comment.on('error', (error) => {
                setState((state) => {
                    let commentErrors = state.errors[commentCid] || [];
                    commentErrors = [...commentErrors, error];
                    return Object.assign(Object.assign({}, state), { errors: Object.assign(Object.assign({}, state.errors), { [commentCid]: commentErrors }) });
                });
            });
            // set clients on comment so the frontend can display it, dont persist in db because a reload cancels updating
            utils.clientsOnStateChange(comment === null || comment === void 0 ? void 0 : comment.clients, (clientState, clientType, clientUrl, chainTicker) => {
                setState((state) => {
                    var _a;
                    // make sure not undefined, sometimes happens in e2e tests
                    if (!state.comments[commentCid]) {
                        return {};
                    }
                    const clients = Object.assign({}, (_a = state.comments[commentCid]) === null || _a === void 0 ? void 0 : _a.clients);
                    const client = { state: clientState };
                    if (chainTicker) {
                        const chainProviders = Object.assign(Object.assign({}, clients[clientType][chainTicker]), { [clientUrl]: client });
                        clients[clientType] = Object.assign(Object.assign({}, clients[clientType]), { [chainTicker]: chainProviders });
                    }
                    else {
                        clients[clientType] = Object.assign(Object.assign({}, clients[clientType]), { [clientUrl]: client });
                    }
                    return { comments: Object.assign(Object.assign({}, state.comments), { [commentCid]: Object.assign(Object.assign({}, state.comments[commentCid]), { clients }) }) };
                });
            });
            // when publishing a comment, you don't yet know its CID
            // so when a new comment is fetched, check to see if it's your own
            // comment, and if yes, add the CID to your account comments database
            // if comment.timestamp isn't defined, it means the next update will contain the timestamp and author
            // which is used in addCidToAccountComment
            if (!(comment === null || comment === void 0 ? void 0 : comment.timestamp)) {
                comment === null || comment === void 0 ? void 0 : comment.once('update', () => accountsStore
                    .getState()
                    .accountsActionsInternal.addCidToAccountComment(comment)
                    .catch((error) => log.error('accountsActionsInternal.addCidToAccountComment error', { comment, error })));
            }
            listeners.push(comment);
            comment === null || comment === void 0 ? void 0 : comment.update().catch((error) => log.trace('comment.update error', { comment, error }));
        });
    },
}));
const getCommentFromDatabase = (commentCid, account) => __awaiter(void 0, void 0, void 0, function* () {
    const commentData = yield commentsDatabase.getItem(commentCid);
    if (!commentData) {
        return;
    }
    const comment = yield account.plebbit.createComment(commentData);
    return comment;
});
// reset store in between tests
const originalState = commentsStore.getState();
// async function because some stores have async init
export const resetCommentsStore = () => __awaiter(void 0, void 0, void 0, function* () {
    plebbitGetCommentPending = {};
    // remove all event listeners
    listeners.forEach((listener) => listener.removeAllListeners());
    // destroy all component subscriptions to the store
    commentsStore.destroy();
    // restore original state
    commentsStore.setState(originalState);
});
// reset database and store in between tests
export const resetCommentsDatabaseAndStore = () => __awaiter(void 0, void 0, void 0, function* () {
    yield localForageLru.createInstance({ name: 'comments' }).clear();
    yield resetCommentsStore();
});
export default commentsStore;
