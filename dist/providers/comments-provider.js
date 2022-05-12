var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useState, useContext } from 'react';
import { AccountsContext } from './accounts-provider';
import localForageLru from '../lib/localforage-lru';
const commentsDatabase = localForageLru.createInstance({ name: 'comments', size: 5000 });
import Debug from 'debug';
const debug = Debug('plebbitreacthooks:providers:commentsprovider');
import utils from '../lib/utils';
export const CommentsContext = React.createContext(undefined);
const plebbitGetCommentPending = {};
export default function CommentsProvider(props) {
    const accountsContext = useContext(AccountsContext);
    const [comments, setComments] = useState({});
    const commentsActions = {};
    commentsActions.addCommentToContext = (commentId, account) => __awaiter(this, void 0, void 0, function* () {
        // comment is in context already, do nothing
        let comment = comments[commentId];
        if (comment || plebbitGetCommentPending[commentId + account.id]) {
            return;
        }
        // try to find comment in database
        comment = yield getCommentFromDatabase(commentId, account);
        // comment not in database, fetch from plebbit-js
        if (!comment) {
            plebbitGetCommentPending[commentId + account.id] = true;
            comment = yield account.plebbit.getComment(commentId);
            yield commentsDatabase.setItem(commentId, utils.clone(comment));
        }
        debug('commentsActions.addCommentToContext', { commentId, comment, account });
        setComments((previousComments) => (Object.assign(Object.assign({}, previousComments), { [commentId]: utils.clone(comment) })));
        plebbitGetCommentPending[commentId + account.id] = false;
        // the comment is still missing up to date mutable data like upvotes, edits, replies, etc
        comment.on('update', (updatedComment) => __awaiter(this, void 0, void 0, function* () {
            updatedComment = utils.clone(updatedComment);
            yield commentsDatabase.setItem(commentId, updatedComment);
            debug('commentsContext comment update', { commentId, updatedComment, account });
            setComments((previousComments) => (Object.assign(Object.assign({}, previousComments), { [commentId]: updatedComment })));
        }));
        comment.update();
        // when publishing a comment, you don't yet know its CID
        // so when a new comment is fetched, check to see if it's your own
        // comment, and if yes, add the CID to your account comments database
        if (accountsContext === null || accountsContext === void 0 ? void 0 : accountsContext.addCidToAccountComment) {
            yield accountsContext.addCidToAccountComment(comment);
        }
    });
    if (!props.children) {
        return null;
    }
    const commentsContext = {
        comments,
        commentsActions,
    };
    debug({ commentsContext: comments });
    return React.createElement(CommentsContext.Provider, { value: commentsContext }, props.children);
}
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
    comment.replies.pages = utils.merge(((_a = commentData === null || commentData === void 0 ? void 0 : commentData.replies) === null || _a === void 0 ? void 0 : _a.pages) || {}, ((_b = comment === null || comment === void 0 ? void 0 : comment.replies) === null || _b === void 0 ? void 0 : _b.pages) || {});
    comment.replies.pageCids = utils.merge(((_c = commentData === null || commentData === void 0 ? void 0 : commentData.replies) === null || _c === void 0 ? void 0 : _c.pageCids) || {}, ((_d = comment === null || comment === void 0 ? void 0 : comment.replies) === null || _d === void 0 ? void 0 : _d.pageCids) || {});
    // NOTE: adding missing data is probably not needed with a full implementation of plebbit-js with no bugs
    // but the plebbit mock is barely implemented
    return comment;
});
