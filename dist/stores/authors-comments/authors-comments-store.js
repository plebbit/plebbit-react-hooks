var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Logger from '@plebbit/plebbit-logger';
const log = Logger('plebbit-react-hooks:authors:stores');
import createStore from 'zustand';
import assert from 'assert';
import commentsStore from '../comments';
import QuickLru from 'quick-lru';
import { getUpdatedLoadedAndBufferedComments, getNextCommentCidToFetchNotFetched } from './utils';
import accountsStore from '../accounts';
// reddit loads approximately 25 posts per page while infinite scrolling
export const commentsPerPage = 25;
// keep large buffer because fetching cids is slow
export const commentBufferSize = 50;
const authorsCommentsStore = createStore((setState, getState) => ({
    options: {},
    loadedComments: {},
    hasMoreBufferedComments: {},
    bufferedCommentCids: {},
    lastCommentCids: {},
    nextCommentCidsToFetch: {},
    shouldFetchNextComment: {},
    addAuthorCommentsToStore: (authorCommentsName, authorAddress, commentCid, filter, account) => {
        var _a;
        assert(authorCommentsName && typeof authorCommentsName === 'string', `addAuthorCommentsToStore.incrementPageNumber invalid argument authorCommentsName '${authorCommentsName}'`);
        assert(authorAddress && typeof authorAddress === 'string', `authorsCommentsStore.addAuthorCommentsToStore invalid argument authorAddress '${authorAddress}'`);
        assert(commentCid && typeof commentCid === 'string', `authorsCommentsStore.addAuthorCommentsToStore invalid argument commentCid '${commentCid}'`);
        assert(!filter || typeof filter === 'function', `authorsCommentsStore.addAuthorCommentsToStore invalid argument filter '${filter}'`);
        assert(typeof ((_a = account === null || account === void 0 ? void 0 : account.plebbit) === null || _a === void 0 ? void 0 : _a.getComment) === 'function', `authorsCommentsStore.addAuthorCommentsToStore account '${account}' invalid`);
        const { options, updateLoadedComments } = getState();
        // in store already, do nothing
        if (options[authorCommentsName]) {
            return;
        }
        const authorCommentsOptions = { authorAddress, pageNumber: 1, filter, accountId: account.id };
        // subscribe to nextCommentCidsToFetch and shouldFetchNextComment to fetch the comments
        authorsCommentsStore.subscribe(fetchCommentOnShouldFetchOrNextCidChange(authorCommentsOptions));
        log('authorsCommentsActions.addAuthorCommentsToStore', { authorCommentsName, authorCommentsOptions, commentCid, previousAuthorsCommentsOptions: options });
        setState((state) => ({
            options: Object.assign(Object.assign({}, state.options), { [authorCommentsName]: authorCommentsOptions }),
            loadedComments: Object.assign(Object.assign({}, state.loadedComments), { [authorCommentsName]: [] }),
            hasMoreBufferedComments: Object.assign(Object.assign({}, state.hasMoreBufferedComments), { [authorCommentsName]: true }),
            bufferedCommentCids: Object.assign(Object.assign({}, state.bufferedCommentCids), { [authorAddress]: state.bufferedCommentCids[authorAddress] || new Set() }),
            lastCommentCids: Object.assign(Object.assign({}, state.lastCommentCids), { [authorAddress]: state.lastCommentCids[authorAddress] || undefined }),
            nextCommentCidsToFetch: Object.assign(Object.assign({}, state.nextCommentCidsToFetch), { [authorAddress]: state.nextCommentCidsToFetch[authorAddress] || commentCid }),
            shouldFetchNextComment: Object.assign(Object.assign({}, state.shouldFetchNextComment), { [authorAddress]: state.shouldFetchNextComment[authorAddress] || true }),
        }));
        // update loadedComments in case the author already has bufferedCommentCids
        updateLoadedComments();
    },
    setNextCommentCidsToFetch: (authorAddress, authorComment) => {
        var _a;
        assert(authorAddress && typeof authorAddress === 'string', `authorsCommentsActions.setNextCommentCidsToFetch invalid argument authorAddress '${authorAddress}'`);
        assert(typeof (authorComment === null || authorComment === void 0 ? void 0 : authorComment.timestamp) === 'number', `authorsCommentsActions.setNextCommentCidsToFetch invalid argument authorComment '${authorComment}'`);
        const { nextCommentCidsToFetch, shouldFetchNextComment, lastCommentCids } = getState();
        if (typeof shouldFetchNextComment[authorAddress] !== 'boolean') {
            throw Error(`authorsCommentsActions.setNextCommentCidsToFetch can't set nextCommentCidToFetch '${authorAddress}' not in store`);
        }
        const nextCommentCidToFetch = (_a = authorComment === null || authorComment === void 0 ? void 0 : authorComment.author) === null || _a === void 0 ? void 0 : _a.previousCommentCid;
        if (nextCommentCidToFetch === nextCommentCidsToFetch[authorAddress]) {
            throw Error(`authorsCommentsActions.setNextCommentCidsToFetch can't set nextCommentCidToFetch '${authorAddress}' to '${nextCommentCidToFetch}' same value`);
        }
        const nextCommentCidToFetchNotFetched = getNextCommentCidToFetchNotFetched(nextCommentCidToFetch);
        // log.trace('authorsCommentsActions.setNextCommentCidsToFetch', {
        //   authorAddress,
        //   authorComment,
        //   previousNextCommentCidToFetch: nextCommentCidsToFetch[authorAddress],
        //   nextCommentCidToFetch,
        //   nextCommentCidToFetchNotFetched,
        //   lastCommentCid: lastCommentCids[authorAddress],
        //   shouldFetchNextComment: shouldFetchNextComment[authorAddress],
        // })
        setState((state) => ({
            nextCommentCidsToFetch: Object.assign(Object.assign({}, state.nextCommentCidsToFetch), { [authorAddress]: nextCommentCidToFetchNotFetched }),
        }));
    },
    incrementPageNumber: (authorCommentsName) => {
        assert(authorCommentsName && typeof authorCommentsName === 'string', `authorsCommentsActions.incrementPageNumber invalid argument authorCommentsName '${authorCommentsName}'`);
        const { options, updateLoadedComments, loadedComments, nextCommentCidsToFetch } = getState();
        if (!options[authorCommentsName]) {
            throw Error(`authorsCommentsActions.incrementPageNumber can't increment page number of options '${authorCommentsName}' not in store`);
        }
        assert(options[authorCommentsName].pageNumber * commentsPerPage <= loadedComments[authorCommentsName].length, `authorsCommentsActions.incrementPageNumber cannot increment page number before current page has loaded`);
        log('authorsCommentsActions.incrementPageNumber', {
            authorCommentsName,
            pageNumber: options[authorCommentsName].pageNumber + 1,
            nextCommentCidsToFetch: nextCommentCidsToFetch[options[authorCommentsName].authorAddress],
        });
        setState(({ options }) => {
            const authorCommentOptions = Object.assign({}, options[authorCommentsName]);
            authorCommentOptions.pageNumber++;
            return { options: Object.assign(Object.assign({}, options), { [authorCommentsName]: authorCommentOptions }) };
        });
        // must update loadedComments to reflect the new added page
        updateLoadedComments();
    },
    addBufferedCommentCid: (authorAddress, commentCid) => {
        assert(authorAddress && typeof authorAddress === 'string', `authorsCommentsActions.addBufferedCommentCid invalid argument authorAddress '${authorAddress}'`);
        assert(commentCid && typeof commentCid === 'string', `authorsCommentsActions.addBufferedCommentCid invalid argument commentCid '${commentCid}'`);
        const { bufferedCommentCids } = getState();
        if (!bufferedCommentCids[authorAddress]) {
            throw Error(`authorsCommentsActions.addBufferedCommentCid can't add commentCid '${authorAddress}' not in store`);
        }
        if (bufferedCommentCids[authorAddress].has(commentCid)) {
            throw Error(`authorsCommentsActions.addBufferedCommentCid can't add commentCid '${authorAddress}' '${commentCid}' already added`);
        }
        // log.trace('authorsCommentsActions.addBufferedCommentCid', {authorAddress, commentCid, previousBufferedCommentCidsSize: bufferedCommentCids[authorAddress].size})
        setState((state) => ({
            bufferedCommentCids: Object.assign(Object.assign({}, state.bufferedCommentCids), { [authorAddress]: new Set([...bufferedCommentCids[authorAddress], commentCid]) }),
        }));
    },
    updateLoadedComments() {
        const { comments } = commentsStore.getState();
        let { loadedComments: previousAuthorsLoadedComments, bufferedCommentCids, options, nextCommentCidsToFetch, lastCommentCids } = getState();
        const newAuthorsLoadedComments = {};
        const newShouldFetchNextComment = {};
        const newHasMoreBufferedComments = {};
        const authorCommentsNames = Object.keys(options);
        for (const name of authorCommentsNames) {
            const { authorAddress, pageNumber, filter } = options[name];
            const previousLoadedComments = previousAuthorsLoadedComments[name];
            const unfilteredBufferedComments = [...bufferedCommentCids[authorAddress]].map((commentCid) => comments[commentCid]);
            const { loadedComments, bufferedComments: filteredBufferedComments } = getUpdatedLoadedAndBufferedComments(previousLoadedComments, unfilteredBufferedComments, pageNumber, filter, comments);
            newAuthorsLoadedComments[name] = loadedComments;
            newHasMoreBufferedComments[name] = filteredBufferedComments.length > loadedComments.length;
            // if another authorCommentOptions should fetch, don't change it
            if (newShouldFetchNextComment[authorAddress] !== true) {
                // fetch if less comments than full page + buffer size
                newShouldFetchNextComment[authorAddress] = filteredBufferedComments.length < pageNumber * commentsPerPage + commentBufferSize;
            }
        }
        // log.trace('authorsCommentsActions.updateLoadedComments', {
        //   bufferedCommentCids,
        //   bufferedCommentCidsSizes: toSizes(bufferedCommentCids),
        //   previousAuthorsLoadedComments,
        //   newAuthorsLoadedComments,
        //   previousAuthorsLoadedCommentsSizes: toSizes(previousAuthorsLoadedComments),
        //   newAuthorsLoadedCommentsSizes: toSizes(newAuthorsLoadedComments),
        //   newShouldFetchNextComment,
        //   lastCommentCids
        // })
        setState(() => ({
            loadedComments: newAuthorsLoadedComments,
            shouldFetchNextComment: newShouldFetchNextComment,
            hasMoreBufferedComments: newHasMoreBufferedComments,
        }));
    },
    setLastCommentCid: (authorAddress, lastCommentCid) => {
        assert(authorAddress && typeof authorAddress === 'string', `authorsCommentsActions.setLastCommentCid invalid argument authorAddress '${authorAddress}'`);
        assert(lastCommentCid && typeof lastCommentCid === 'string', `authorsCommentsActions.setLastCommentCid invalid argument lastCommentCid '${lastCommentCid}'`);
        const { lastCommentCids, shouldFetchNextComment, nextCommentCidsToFetch } = getState();
        if (typeof shouldFetchNextComment[authorAddress] !== 'boolean') {
            throw Error(`authorsCommentsActions.setLastCommentCid can't set lastCommentCid '${authorAddress}' not in store`);
        }
        if (lastCommentCid === lastCommentCids[authorAddress]) {
            throw Error(`authorsCommentsActions.setLastCommentCid can't set setLastCommentCid '${authorAddress}' to '${lastCommentCid}' same value`);
        }
        log('authorsCommentsActions.setLastCommentCid', {
            authorAddress,
            lastCommentCid,
            previousLastCommentCid: lastCommentCids[authorAddress],
            shouldFetchNextComment: shouldFetchNextComment[authorAddress],
            nextCommentCidsToFetch: nextCommentCidsToFetch[authorAddress],
        });
        setState((state) => ({
            lastCommentCids: Object.assign(Object.assign({}, state.lastCommentCids), { [authorAddress]: lastCommentCid }),
        }));
    },
}));
// if nextCommentCidsToFetch or shouldFetchNextComment changed, fetch the next comment
const fetchCommentOnShouldFetchOrNextCidChange = (options) => (state) => {
    const nextCommentCidToFetch = state.nextCommentCidsToFetch[options.authorAddress];
    if (!nextCommentCidToFetch) {
        return;
    }
    // the buffered comments are already full, not need to fetch next comment
    const shouldFetchNextComment = state.shouldFetchNextComment[options.authorAddress];
    if (!shouldFetchNextComment) {
        return;
    }
    // when comment has fetched, update loadedComments, bufferedComments and shouldFetchNextComment
    if (!authorCommentCidsFetching[nextCommentCidToFetch]) {
        authorCommentCidsFetching[nextCommentCidToFetch] = true;
        commentsStore.subscribe(updateCommentsOnCommentsChange(options, nextCommentCidToFetch));
    }
    // start fetching comment
    const account = accountsStore.getState().accounts[options.accountId];
    const addCommentToStore = commentsStore.getState().addCommentToStore;
    addCommentToStore(nextCommentCidToFetch, account).catch((error) => log.error('authorsCommentsStore fetchCommentOnShouldFetchOrNextCidChange addCommentToStore error', { error, nextCommentCidToFetch, account }));
};
// if commentStore changed, update loadedComments, bufferedCommentCids, shouldFetchNextComment and nextCommentCidsToFetch
let previousComments = new QuickLru({ maxSize: 10000 });
let authorCommentCidsFetching = {};
let subplebbitLastCommentCidsFetching = {};
const updateCommentsOnCommentsChange = (options, commentCid) => (state) => {
    var _a, _b, _c;
    // not a next cid, do nothing
    if (!authorCommentCidsFetching[commentCid]) {
        return;
    }
    const comment = state.comments[commentCid];
    // comment hasn't changed, do nothing
    if (!(comment === null || comment === void 0 ? void 0 : comment.timestamp) || comment === previousComments.get(commentCid)) {
        return;
    }
    // comment author address is incorrect, do nothing
    if (((_a = comment.author) === null || _a === void 0 ? void 0 : _a.address) !== options.authorAddress) {
        return;
    }
    previousComments.set(commentCid, comment);
    const { addBufferedCommentCid, bufferedCommentCids, updateLoadedComments, setNextCommentCidsToFetch, nextCommentCidsToFetch } = authorsCommentsStore.getState();
    // the comment is a new comment, add it to buffered comment cids
    if (!bufferedCommentCids[options.authorAddress].has(commentCid)) {
        addBufferedCommentCid(options.authorAddress, commentCid);
    }
    // the comment was the last cid to fetch, set the next cid to fetch as the author previous cid
    const nextCidToFetch = nextCommentCidsToFetch[options.authorAddress];
    if (commentCid === nextCidToFetch) {
        setNextCommentCidsToFetch(options.authorAddress, comment);
    }
    // one of the comment changed, must update loaded comments
    updateLoadedComments();
    // the changed comment might have a new author.subplebbit.lastCommentCid, try to fetch it
    const subplebbitLastCommentCid = (_c = (_b = comment.author) === null || _b === void 0 ? void 0 : _b.subplebbit) === null || _c === void 0 ? void 0 : _c.lastCommentCid;
    if (subplebbitLastCommentCid) {
        // when last comment has fetched, update lastCommentCid
        if (!subplebbitLastCommentCidsFetching[subplebbitLastCommentCid]) {
            subplebbitLastCommentCidsFetching[subplebbitLastCommentCid] = true;
            commentsStore.subscribe(setLastCommentCidOnCommentsChange(options, subplebbitLastCommentCid));
        }
        // start fetching lastCommentCid
        const account = accountsStore.getState().accounts[options.accountId];
        state
            .addCommentToStore(subplebbitLastCommentCid, account)
            .catch((error) => log.error('authorsCommentsStore updateCommentsOnCommentsChange addCommentToStore error', { error, subplebbitLastCommentCid, account }));
    }
};
let previousLastComments = new QuickLru({ maxSize: 10000 });
const setLastCommentCidOnCommentsChange = (options, commentCid) => (state) => {
    var _a, _b;
    // not a last cid candidate, do nothing
    if (!subplebbitLastCommentCidsFetching[commentCid]) {
        return;
    }
    const { comments } = state;
    const comment = comments[commentCid];
    // comment hasn't changed, do nothing
    if (!(comment === null || comment === void 0 ? void 0 : comment.timestamp) || comment === previousLastComments.get(commentCid)) {
        return;
    }
    // comment author address is incorrect, do nothing
    if (((_a = comment.author) === null || _a === void 0 ? void 0 : _a.address) !== options.authorAddress) {
        return;
    }
    previousLastComments.set(commentCid, comment);
    const { addBufferedCommentCid, lastCommentCids, bufferedCommentCids, setLastCommentCid, setNextCommentCidsToFetch, updateLoadedComments } = authorsCommentsStore.getState();
    // if the comment is a new comment, add it to buffered comment cids
    if (!bufferedCommentCids[options.authorAddress].has(commentCid)) {
        addBufferedCommentCid(options.authorAddress, commentCid);
    }
    // already last comment cid, no need to set it
    if (commentCid === lastCommentCids[options.authorAddress]) {
        return;
    }
    // if comment is newer than current lastCommentCid and all bufferedComments, is lastCommentCid
    const currentLastCommentCid = lastCommentCids[options.authorAddress];
    const currentLastComment = comments[currentLastCommentCid || ''];
    // comment is older or equal to current lastCommentCid, do nothing
    if (comment.timestamp <= ((currentLastComment === null || currentLastComment === void 0 ? void 0 : currentLastComment.timestamp) || 0)) {
        log.trace(`authorsCommentsStore setLastCommentCidOnCommentsChange don't set lastCommentCid older than current lastCommentCid`, { comment, currentLastComment });
        return;
    }
    // make sure lastComment is newer than all comments already in bufferedComments
    const bufferedComments = [...bufferedCommentCids[options.authorAddress]].map((commentCid) => comments[commentCid]);
    for (const bufferedComment of bufferedComments) {
        if (((bufferedComment === null || bufferedComment === void 0 ? void 0 : bufferedComment.timestamp) || 0) > comment.timestamp) {
            log.trace(`authorsCommentsStore setLastCommentCidOnCommentsChange don't set lastCommentCid older than buffered comments`, {
                comment,
                currentLastComment,
                bufferedComments,
            });
            return;
        }
    }
    // is last comment cid, set it
    log(`authorsCommentsStore setLastCommentCidOnCommentsChange`, { lastCommentCid: comment.cid, lastComment: comment, currentLastComment, bufferedComments });
    setLastCommentCid(options.authorAddress, commentCid);
    // add the last comment to loadedComments
    updateLoadedComments();
    // start a new linked list of comments to fetch using the lastComment.author.previousCommentCid
    if ((_b = comment.author) === null || _b === void 0 ? void 0 : _b.previousCommentCid) {
        setNextCommentCidsToFetch(options.authorAddress, comment);
    }
};
// reset store in between tests
const originalState = authorsCommentsStore.getState();
// async function because some stores have async init
export const resetAuthorsCommentsStore = () => __awaiter(void 0, void 0, void 0, function* () {
    subplebbitLastCommentCidsFetching = {};
    previousComments = new QuickLru({ maxSize: 10000 });
    authorCommentCidsFetching = {};
    previousLastComments = new QuickLru({ maxSize: 10000 });
    // destroy all component subscriptions to the store
    authorsCommentsStore.destroy();
    // restore original state
    authorsCommentsStore.setState(originalState);
});
// reset database and store in between tests
export const resetAuthorsCommentsDatabaseAndStore = () => __awaiter(void 0, void 0, void 0, function* () {
    yield resetAuthorsCommentsStore();
});
export default authorsCommentsStore;
