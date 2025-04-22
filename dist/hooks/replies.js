var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useEffect, useState, useMemo } from 'react';
import { useAccount } from './accounts';
import validator from '../lib/validator';
import Logger from '@plebbit/plebbit-logger';
const log = Logger('plebbit-react-hooks:replies:hooks');
import assert from 'assert';
import useRepliesStore, { feedOptionsToFeedName } from '../stores/replies';
export function useReplies(options) {
    assert(!options || typeof options === 'object', `useReplies options argument '${options}' not an object`);
    let { comment, sortType, accountName, flat, flatDepth, accountComments, repliesPerPage, filter } = options || {};
    if (!sortType) {
        sortType = 'best';
    }
    if (typeof flatDepth !== 'number') {
        flatDepth = 0;
    }
    const invalidFlatDepth = flat && typeof (comment === null || comment === void 0 ? void 0 : comment.depth) === 'number' && flatDepth !== comment.depth;
    validator.validateUseRepliesArguments(comment, sortType, accountName, flat, accountComments, repliesPerPage, filter);
    const [errors, setErrors] = useState([]);
    // add replies to store
    const account = useAccount({ accountName });
    const feedOptions = { commentCid: comment === null || comment === void 0 ? void 0 : comment.cid, sortType, accountId: account === null || account === void 0 ? void 0 : account.id, repliesPerPage, flat, accountComments, filter };
    const repliesFeedName = feedOptionsToFeedName(feedOptions);
    const addFeedToStoreOrUpdateComment = useRepliesStore((state) => state.addFeedToStoreOrUpdateComment);
    useEffect(() => {
        if (!(comment === null || comment === void 0 ? void 0 : comment.cid) || !account || invalidFlatDepth) {
            return;
        }
        addFeedToStoreOrUpdateComment(comment, feedOptions).catch((error) => log.error('useReplies addFeedToStoreOrUpdateComment error', { repliesFeedName, comment, feedOptions, error }));
    }, [repliesFeedName, comment]);
    let replies = useRepliesStore((state) => state.loadedFeeds[repliesFeedName || '']);
    let bufferedReplies = useRepliesStore((state) => state.bufferedFeeds[repliesFeedName || '']);
    let updatedReplies = useRepliesStore((state) => state.updatedFeeds[repliesFeedName || '']);
    let hasMore = useRepliesStore((state) => state.feedsHaveMore[repliesFeedName || '']);
    // if the replies is not yet defined, then it has more
    if (!repliesFeedName || typeof hasMore !== 'boolean') {
        hasMore = true;
    }
    // if the replies is not yet defined, but no comment, doesn't have more
    if (!comment) {
        hasMore = false;
    }
    const incrementFeedPageNumber = useRepliesStore((state) => state.incrementFeedPageNumber);
    let loadMore = () => __awaiter(this, void 0, void 0, function* () {
        try {
            if (!(comment === null || comment === void 0 ? void 0 : comment.cid) || !account) {
                throw Error('useReplies cannot load more replies not initalized yet');
            }
            incrementFeedPageNumber(repliesFeedName);
        }
        catch (e) {
            // wait 100 ms so infinite scroll doesn't spam this function
            yield new Promise((r) => setTimeout(r, 50));
            setErrors([...errors, e]);
        }
    });
    const resetFeed = useRepliesStore((state) => state.resetFeed);
    let reset = () => __awaiter(this, void 0, void 0, function* () {
        try {
            if (!(comment === null || comment === void 0 ? void 0 : comment.cid) || !account) {
                throw Error('useReplies cannot reset replies not initalized yet');
            }
            resetFeed(repliesFeedName);
        }
        catch (e) {
            // wait 100 ms so infinite scroll doesn't spam this function
            yield new Promise((r) => setTimeout(r, 50));
            setErrors([...errors, e]);
        }
    });
    // don't display nested replies when flat
    // to start flat replies at a depth other than 0, e.g. a twitter reply thread, change flatDepth
    if (invalidFlatDepth) {
        replies = emptyArray;
        bufferedReplies = emptyArray;
        updatedReplies = emptyArray;
        hasMore = false;
        loadMore = emptyFunction;
        reset = emptyFunction;
    }
    if (account && (comment === null || comment === void 0 ? void 0 : comment.cid)) {
        log('useReplies', {
            repliesLength: (replies === null || replies === void 0 ? void 0 : replies.length) || 0,
            hasMore,
            commentCid: comment.cid,
            sortType,
            flat,
            flatDepth,
            account,
            repliesStoreOptions: useRepliesStore.getState().feedsOptions,
            repliesStore: useRepliesStore.getState(),
            invalidFlatDepth,
        });
    }
    const state = !hasMore ? 'succeeded' : 'fetching';
    return useMemo(() => ({
        replies: replies || [],
        bufferedReplies: bufferedReplies || [],
        updatedReplies: updatedReplies || [],
        hasMore,
        loadMore,
        reset,
        state,
        error: errors[errors.length - 1],
        errors,
    }), [replies, bufferedReplies, updatedReplies, repliesFeedName, hasMore, errors]);
}
const emptyArray = [];
const emptyFunction = () => __awaiter(void 0, void 0, void 0, function* () { });
