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
import Debug from 'debug';
const debug = Debug('plebbit-react-hooks:stores:comments');
import utils from '../../lib/utils';
import createStore from 'zustand';
import accountsStore from '../accounts';
let plebbitGetCommentPending = {};
// reset all event listeners in between tests
export const listeners = [];
const commentsStore = createStore((setState, getState) => ({
    comments: {},
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
                    comment = yield account.plebbit.getComment(commentId);
                    debug('commentsStore.addCommentToStore plebbit.getComment', { commentId, comment, account });
                    yield commentsDatabase.setItem(commentId, utils.clone(comment));
                }
                debug('commentsStore.addCommentToStore', { commentId, comment, account });
                setState((state) => ({ comments: Object.assign(Object.assign({}, state.comments), { [commentId]: utils.clone(comment) }) }));
            }
            catch (e) {
                throw e;
            }
            finally {
                plebbitGetCommentPending[commentId + account.id] = false;
            }
            // the comment is still missing up to date mutable data like upvotes, edits, replies, etc
            comment.on('update', (updatedComment) => __awaiter(this, void 0, void 0, function* () {
                updatedComment = utils.clone(updatedComment);
                yield commentsDatabase.setItem(commentId, updatedComment);
                debug('commentsStore comment update', { commentId, updatedComment, account });
                setState((state) => ({ comments: Object.assign(Object.assign({}, state.comments), { [commentId]: updatedComment }) }));
            }));
            listeners.push(comment);
            comment.update();
            // when publishing a comment, you don't yet know its CID
            // so when a new comment is fetched, check to see if it's your own
            // comment, and if yes, add the CID to your account comments database
            yield accountsStore.getState().accountsActionsInternal.addCidToAccountComment(comment);
        });
    },
}));
const getCommentFromDatabase = (commentId, account) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const commentData = yield commentsDatabase.getItem(commentId);
    if (!commentData) {
        return;
    }
    const comment = yield account.plebbit.createComment(commentData);
    // add potential missing data from the database onto the comment instance
    // should not be necessary if Plebbit.createComment is implemented properly
    for (const prop in commentData) {
        if (comment[prop] === undefined || comment[prop] === null) {
            if (commentData[prop] !== undefined && commentData[prop] !== null)
                comment[prop] = commentData[prop];
        }
    }
    // add potential missing data from the Pages API
    if (comment.replies) {
        comment.replies.pages = utils.merge(((_a = commentData === null || commentData === void 0 ? void 0 : commentData.replies) === null || _a === void 0 ? void 0 : _a.pages) || {}, ((_b = comment === null || comment === void 0 ? void 0 : comment.replies) === null || _b === void 0 ? void 0 : _b.pages) || {});
        comment.replies.pageCids = utils.merge(((_c = commentData === null || commentData === void 0 ? void 0 : commentData.replies) === null || _c === void 0 ? void 0 : _c.pageCids) || {}, ((_d = comment === null || comment === void 0 ? void 0 : comment.replies) === null || _d === void 0 ? void 0 : _d.pageCids) || {});
    }
    // NOTE: adding missing data is probably not needed with a full implementation of plebbit-js with no bugs
    // but the plebbit mock is barely implemented
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
