import { useEffect } from 'react';
import { useAccount } from './accounts';
import validator from '../lib/validator';
import Logger from '@plebbit/plebbit-logger';
const log = Logger('plebbit-react-hooks:hooks:comments');
import useCommentsStore from '../stores/comments';
import useSubplebbitsPagesStore from '../stores/subplebbits-pages';
import shallow from 'zustand/shallow';
/**
 * @param commentCid - The IPFS CID of the comment to get
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useComment(commentCid, accountName) {
    const account = useAccount(accountName);
    let comment = useCommentsStore((state) => state.comments[commentCid || '']);
    const addCommentToStore = useCommentsStore((state) => state.addCommentToStore);
    const subplebbitsPagesComment = useSubplebbitsPagesStore((state) => state.comments[commentCid || '']);
    useEffect(() => {
        if (!commentCid || !account) {
            return;
        }
        validator.validateUseCommentArguments(commentCid, account);
        if (!comment) {
            // if comment isn't already in store, add it
            addCommentToStore(commentCid, account).catch((error) => log.error('useComment addCommentToStore error', { commentCid, error }));
        }
    }, [commentCid, account === null || account === void 0 ? void 0 : account.id]);
    if (account && commentCid) {
        log('useComment', { commentCid, comment, commentsStore: useCommentsStore.getState().comments, account });
    }
    // if comment from subplebbit pages is more recent, use it instead
    if (commentCid && ((subplebbitsPagesComment === null || subplebbitsPagesComment === void 0 ? void 0 : subplebbitsPagesComment.updatedAt) || 0) > ((comment === null || comment === void 0 ? void 0 : comment.updatedAt) || 0)) {
        comment = subplebbitsPagesComment;
    }
    return comment;
}
/**
 * @param commentCids - The IPFS CIDs of the comments to get
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useComments(commentCids = [], accountName) {
    var _a, _b;
    const account = useAccount(accountName);
    let comments = useCommentsStore((state) => commentCids.map((commentCid) => state.comments[commentCid || '']), shallow);
    const subplebbitsPagesComments = useSubplebbitsPagesStore((state) => commentCids.map((commentCid) => state.comments[commentCid || '']), shallow);
    const addCommentToStore = useCommentsStore((state) => state.addCommentToStore);
    useEffect(() => {
        if (!commentCids || !account) {
            return;
        }
        validator.validateUseCommentsArguments(commentCids, account);
        const uniqueCommentCids = new Set(commentCids);
        for (const commentCid of uniqueCommentCids) {
            addCommentToStore(commentCid, account).catch((error) => log.error('useComments addCommentToStore error', { commentCid, error }));
        }
    }, [commentCids.toString(), account === null || account === void 0 ? void 0 : account.id]);
    if (account && (commentCids === null || commentCids === void 0 ? void 0 : commentCids.length)) {
        log('useComments', { commentCids, comments, commentsStore: useCommentsStore.getState().comments, account });
    }
    // if comment from subplebbit pages is more recent, use it instead
    comments = [...comments];
    for (const i in comments) {
        if ((((_a = subplebbitsPagesComments[i]) === null || _a === void 0 ? void 0 : _a.updatedAt) || 0) > (((_b = comments[i]) === null || _b === void 0 ? void 0 : _b.updatedAt) || 0)) {
            comments[i] = subplebbitsPagesComments[i];
        }
    }
    return comments;
}
