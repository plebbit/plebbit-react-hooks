import { useEffect } from 'react';
import { useAccount } from './accounts';
import validator from '../lib/validator';
import Debug from 'debug';
const debug = Debug('plebbit-react-hooks:hooks:comments');
import useCommentsStore from '../stores/comments';
import shallow from 'zustand/shallow';
/**
 * @param commentCid - The IPFS CID of the comment to get
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useComment(commentCid, accountName) {
    const account = useAccount(accountName);
    const comment = useCommentsStore((state) => state.comments[commentCid || '']);
    const addCommentToStore = useCommentsStore((state) => state.addCommentToStore);
    useEffect(() => {
        if (!commentCid || !account) {
            return;
        }
        validator.validateUseCommentArguments(commentCid, account);
        if (!comment) {
            // if comment isn't already in store, add it
            addCommentToStore(commentCid, account).catch((error) => console.error('useComment addCommentToStore error', { commentCid, error }));
        }
    }, [commentCid, account]);
    debug('useComment', { commentCid, comment, commentsStore: useCommentsStore.getState().comments, account });
    return comment;
}
/**
 * @param commentCids - The IPFS CIDs of the comments to get
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useComments(commentCids = [], accountName) {
    const account = useAccount(accountName);
    const comments = useCommentsStore((state) => commentCids.map((commentCid) => state.comments[commentCid || '']), shallow);
    const addCommentToStore = useCommentsStore((state) => state.addCommentToStore);
    useEffect(() => {
        if (!commentCids || !account) {
            return;
        }
        validator.validateUseCommentsArguments(commentCids, account);
        const uniqueCommentCids = new Set(commentCids);
        for (const commentCid of uniqueCommentCids) {
            addCommentToStore(commentCid, account).catch((error) => console.error('useComments addCommentToStore error', { commentCid, error }));
        }
    }, [commentCids, account]);
    debug('useComments', { commentCids, comments, commentsStore: useCommentsStore.getState().comments, account });
    return comments;
}
