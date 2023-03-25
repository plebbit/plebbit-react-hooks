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
let plebbitGetCommentPending = {};
// reset all event listeners in between tests
export const listeners = [];
const commentsStore = createStore((setState, getState) => ({
    comments: {},
    errors: {},
    addCommentToStore(commentId, account) {
        return __awaiter(this, void 0, void 0, function* () {
            const { comments } = getState();
            // comment is in store already, do nothing
            let comment = comments[commentId];
            if (comment || plebbitGetCommentPending[commentId + account.id]) {
                return;
            }
            plebbitGetCommentPending[commentId + account.id] = true;
            // try to find comment in database
            comment = yield getCommentFromDatabase(commentId, account);
            // comment not in database, fetch from plebbit-js
            try {
                if (!comment) {
                    comment = yield account.plebbit.createComment({ cid: commentId });
                    yield commentsDatabase.setItem(commentId, utils.clone(comment));
                }
                log('commentsStore.addCommentToStore', { commentId, comment, account });
                setState((state) => ({ comments: Object.assign(Object.assign({}, state.comments), { [commentId]: utils.clone(comment) }) }));
            }
            catch (e) {
                throw e;
            }
            finally {
                plebbitGetCommentPending[commentId + account.id] = false;
            }
            // the comment is still missing up to date mutable data like upvotes, edits, replies, etc
            comment === null || comment === void 0 ? void 0 : comment.on('update', (updatedComment) => __awaiter(this, void 0, void 0, function* () {
                updatedComment = utils.clone(updatedComment);
                yield commentsDatabase.setItem(commentId, updatedComment);
                log('commentsStore comment update', { commentId, updatedComment, account });
                setState((state) => ({ comments: Object.assign(Object.assign({}, state.comments), { [commentId]: updatedComment }) }));
            }));
            comment === null || comment === void 0 ? void 0 : comment.on('updatingstatechange', (updatingState) => {
                setState((state) => ({
                    comments: Object.assign(Object.assign({}, state.comments), { [commentId]: Object.assign(Object.assign({}, state.comments[commentId]), { updatingState }) }),
                }));
            });
            comment === null || comment === void 0 ? void 0 : comment.on('error', (error) => {
                setState((state) => {
                    let commentErrors = state.errors[commentId] || [];
                    commentErrors = [...commentErrors, error];
                    return Object.assign(Object.assign({}, state), { errors: Object.assign(Object.assign({}, state.errors), { [commentId]: commentErrors }) });
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
const getCommentFromDatabase = (commentId, account) => __awaiter(void 0, void 0, void 0, function* () {
    const commentData = yield commentsDatabase.getItem(commentId);
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
