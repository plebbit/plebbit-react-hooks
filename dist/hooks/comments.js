import { useEffect, useState, useMemo } from 'react';
import { useAccount } from './accounts';
import validator from '../lib/validator';
import Logger from '@plebbit/plebbit-logger';
const log = Logger('plebbit-react-hooks:comments:hooks');
import assert from 'assert';
import useCommentsStore from '../stores/comments';
import useAccountsStore from '../stores/accounts';
import { commentIsValid } from '../lib/utils';
import useSubplebbitsPagesStore from '../stores/subplebbits-pages';
import useRepliesPagesStore from '../stores/replies-pages';
import shallow from 'zustand/shallow';
/**
 * @param commentCid - The IPFS CID of the comment to get
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useComment(options) {
    assert(!options || typeof options === 'object', `useComment options argument '${options}' not an object`);
    const { commentCid, accountName, onlyIfCached } = options || {};
    const account = useAccount({ accountName });
    const commentFromStore = useCommentsStore((state) => state.comments[commentCid || '']);
    const addCommentToStore = useCommentsStore((state) => state.addCommentToStore);
    const subplebbitsPagesComment = useSubplebbitsPagesStore((state) => state.comments[commentCid || '']);
    const repliesPagesComment = useRepliesPagesStore((state) => state.comments[commentCid || '']);
    const errors = useCommentsStore((state) => state.errors[commentCid || '']);
    // get account comment of the cid if any
    const accountCommentInfo = useAccountsStore((state) => state.commentCidsToAccountsComments[commentCid || '']);
    const accountComment = useAccountsStore((state) => { var _a; return (_a = state.accountsComments[(accountCommentInfo === null || accountCommentInfo === void 0 ? void 0 : accountCommentInfo.accountId) || '']) === null || _a === void 0 ? void 0 : _a[Number(accountCommentInfo === null || accountCommentInfo === void 0 ? void 0 : accountCommentInfo.accountCommentIndex)]; });
    useEffect(() => {
        if (!commentCid || !account) {
            return;
        }
        validator.validateUseCommentArguments(commentCid, account);
        if (!commentFromStore && !onlyIfCached) {
            // if comment isn't already in store, add it
            addCommentToStore(commentCid, account).catch((error) => log.error('useComment addCommentToStore error', { commentCid, error }));
        }
    }, [commentCid, account === null || account === void 0 ? void 0 : account.id, onlyIfCached]);
    let comment = commentFromStore;
    // if comment from subplebbit pages is more recent, use it instead
    if (commentCid && ((subplebbitsPagesComment === null || subplebbitsPagesComment === void 0 ? void 0 : subplebbitsPagesComment.updatedAt) || 0) > ((comment === null || comment === void 0 ? void 0 : comment.updatedAt) || 0)) {
        comment = subplebbitsPagesComment;
        // TODO: subplebbit pages comments aren't auto validated, need to validate
    }
    // if comment from replies pages is more recent, use it instead
    if (commentCid && ((repliesPagesComment === null || repliesPagesComment === void 0 ? void 0 : repliesPagesComment.updatedAt) || 0) > ((comment === null || comment === void 0 ? void 0 : comment.updatedAt) || 0)) {
        comment = repliesPagesComment;
        // TODO: replies pages comments aren't auto validated, need to validate
    }
    // if comment is still not defined, but account comment is, use account comment
    // check `comment.timestamp` instead of `comment` in case comment exists but in a loading state
    const commentFromStoreNotLoaded = !(comment === null || comment === void 0 ? void 0 : comment.timestamp);
    if (commentCid && commentFromStoreNotLoaded && accountComment) {
        comment = accountComment;
    }
    let state = (comment === null || comment === void 0 ? void 0 : comment.updatingState) || 'initializing';
    // force 'fetching-ipns' even if could be something else, so the frontend can use
    // the correct loading skeleton
    if (comment === null || comment === void 0 ? void 0 : comment.timestamp) {
        state = 'fetching-update-ipns';
    }
    // force succeeded even if the commment is fecthing a new update
    if (comment === null || comment === void 0 ? void 0 : comment.updatedAt) {
        state = 'succeeded';
    }
    // force succeeded if the comment is newer than 5 minutes, no need to display loading skeleton if comment was just created
    let replyCount = comment === null || comment === void 0 ? void 0 : comment.replyCount;
    if ((comment === null || comment === void 0 ? void 0 : comment.replyCount) === undefined && (comment === null || comment === void 0 ? void 0 : comment.timestamp) && (comment === null || comment === void 0 ? void 0 : comment.timestamp) > Date.now() / 1000 - 5 * 60) {
        state = 'succeeded';
        // set replyCount because some frontend are likely to check if replyCount === undefined to show a loading skeleton
        replyCount = 0;
    }
    if (account && commentCid) {
        log('useComment', {
            commentCid,
            comment,
            replyCount,
            state,
            commentFromStore,
            subplebbitsPagesComment,
            repliesPagesComment,
            accountComment,
            commentsStore: useCommentsStore.getState().comments,
            account,
            onlyIfCached,
        });
    }
    return useMemo(() => (Object.assign(Object.assign({}, comment), { replyCount,
        state, error: errors === null || errors === void 0 ? void 0 : errors[errors.length - 1], errors: errors || [] })), [comment, commentCid, errors]);
}
/**
 * @param commentCids - The IPFS CIDs of the comments to get
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useComments(options) {
    assert(!options || typeof options === 'object', `useComments options argument '${options}' not an object`);
    const { commentCids, accountName, onlyIfCached } = options || {};
    const account = useAccount({ accountName });
    const commentsStoreComments = useCommentsStore((state) => (commentCids || []).map((commentCid) => state.comments[commentCid || '']), shallow);
    const subplebbitsPagesComments = useSubplebbitsPagesStore((state) => (commentCids || []).map((commentCid) => state.comments[commentCid || '']), shallow);
    const addCommentToStore = useCommentsStore((state) => state.addCommentToStore);
    useEffect(() => {
        if (!commentCids || !account) {
            return;
        }
        validator.validateUseCommentsArguments(commentCids, account);
        if (onlyIfCached) {
            return;
        }
        const uniqueCommentCids = new Set(commentCids);
        for (const commentCid of uniqueCommentCids) {
            addCommentToStore(commentCid, account).catch((error) => log.error('useComments addCommentToStore error', { commentCid, error }));
        }
    }, [commentCids === null || commentCids === void 0 ? void 0 : commentCids.toString(), account === null || account === void 0 ? void 0 : account.id, onlyIfCached]);
    if (account && (commentCids === null || commentCids === void 0 ? void 0 : commentCids.length)) {
        log('useComments', { commentCids, commentsStoreComments, commentsStore: useCommentsStore.getState().comments, account });
    }
    // if comment from subplebbit pages is more recent, use it instead
    const comments = useMemo(() => {
        var _a, _b;
        const comments = [...commentsStoreComments];
        for (const i in comments) {
            if ((((_a = subplebbitsPagesComments[i]) === null || _a === void 0 ? void 0 : _a.updatedAt) || 0) > (((_b = comments[i]) === null || _b === void 0 ? void 0 : _b.updatedAt) || 0)) {
                comments[i] = subplebbitsPagesComments[i];
            }
        }
        return comments;
    }, [commentsStoreComments, subplebbitsPagesComments]);
    // succeed if no comments are undefined
    const state = comments.indexOf(undefined) === -1 ? 'succeeded' : 'fetching-ipfs';
    return useMemo(() => ({
        comments,
        state,
        error: undefined,
        errors: [],
    }), [comments, commentCids === null || commentCids === void 0 ? void 0 : commentCids.toString()]);
}
export function useValidateComment(options) {
    assert(!options || typeof options === 'object', `useValidateComment options argument '${options}' not an object`);
    let { comment, validateReplies, accountName } = options || {};
    if (validateReplies === undefined || validateReplies === null) {
        validateReplies = true;
    }
    const [validated, setValidated] = useState();
    const [errors, setErrors] = useState([]);
    const account = useAccount({ accountName });
    useEffect(() => {
        if (!comment || !(account === null || account === void 0 ? void 0 : account.plebbit)) {
            setValidated(undefined);
            return;
        }
        // don't automatically block subplebbit because what subplebbit it comes from
        // a malicious subplebbit could try to block other subplebbits, etc
        const blockSubplebbit = false;
        commentIsValid(comment, { validateReplies, blockSubplebbit }, account.plebbit).then((validated) => setValidated(validated));
    }, [comment, validateReplies, account === null || account === void 0 ? void 0 : account.plebbit]);
    let state = 'initializing';
    if (validated === true) {
        state = 'succeeded';
    }
    if (validated === false) {
        state = 'failed';
    }
    // start valid at true always because most of the time the value will be true and we dont want to cause a rerender
    let valid = true;
    if (validated == false) {
        valid = false;
    }
    // if comment isn't defined, it would be confusing for valid to be true
    if (!comment) {
        valid = false;
    }
    return useMemo(() => ({
        valid,
        state,
        error: errors[errors.length - 1],
        errors,
    }), [valid, state]);
}
