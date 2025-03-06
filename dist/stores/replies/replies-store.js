var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import assert from 'assert';
import Logger from '@plebbit/plebbit-logger';
const log = Logger('plebbit-react-hooks:replies:stores');
import createStore from 'zustand';
import localForageLru from '../../lib/localforage-lru';
import accountsStore from '../accounts';
import commentsStore from '../comments';
import repliesPagesStore from '../replies-pages';
import { getFeedsCommentsFirstPageCids, getLoadedFeeds, getBufferedFeedsWithoutLoadedFeeds, getFeedsReplyCounts, getFeedsHaveMore, feedsCommentsChanged, getFeedsComments, getFeedsCommentsLoadedCount, getFilteredSortedFeeds, getSortTypeFromComment, } from './utils';
// reddit loads approximately 25 posts per page
// while infinite scrolling
export const defaultRepliesPerPage = 25;
// keep large buffer because fetching cids is slow
export const commentRepliesLeftBeforeNextPage = 50;
// reset all event listeners in between tests
export const listeners = [];
// don't updateFeeds more than once per updateFeedsMinIntervalTime
let updateFeedsPending = false;
const updateFeedsMinIntervalTime = 100;
const repliesStore = createStore((setState, getState) => ({
    feedsOptions: {},
    bufferedFeeds: {},
    loadedFeeds: {},
    bufferedFeedsReplyCounts: {},
    feedsHaveMore: {},
    addFeedToStore(feedName, commentCid, sortType, account, flat, accountComments, repliesPerPage, filter) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            assert(feedName && typeof feedName === 'string', `repliesStore.addFeedToStore feedName '${feedName}' invalid`);
            assert(commentCid && typeof commentCid === 'string', `repliesStore.addFeedToStore commentCid '${commentCid}' invalid`);
            assert(sortType && typeof sortType === 'string', `addFeedToStore.addFeedToStore sortType '${sortType}' invalid`);
            assert(typeof ((_a = account === null || account === void 0 ? void 0 : account.plebbit) === null || _a === void 0 ? void 0 : _a.getSubplebbit) === 'function', `addFeedToStore.addFeedToStore account '${account}' invalid`);
            if (flat === undefined || flat === null) {
                flat = false;
            }
            if (accountComments === undefined || accountComments === null) {
                accountComments = true;
            }
            repliesPerPage = repliesPerPage || defaultRepliesPerPage;
            assert(typeof repliesPerPage === 'number', `addFeedToStore.addFeedToStore repliesPerPage '${repliesPerPage}' invalid`);
            assert(!filter || typeof (filter === null || filter === void 0 ? void 0 : filter.filter) === 'function', `addFeedToStore.addFeedToStore filter.filter '${filter === null || filter === void 0 ? void 0 : filter.filter}' invalid`);
            assert(!filter || typeof (filter === null || filter === void 0 ? void 0 : filter.key) === 'string', `addFeedToStore.addFeedToStore filter.key '${filter === null || filter === void 0 ? void 0 : filter.key}' invalid`);
            const { feedsOptions, updateFeeds } = getState();
            // feed is in store already, do nothing
            // if the feed already exist but is at page 1, reset it to page 1
            if (feedsOptions[feedName] && feedsOptions[feedName].pageNumber !== 0) {
                return;
            }
            // to add a buffered feed, add a feed with pageNumber 0
            const feedOptions = { commentCid, sortType, accountId: account.id, pageNumber: 1, flat, accountComments, repliesPerPage, filter };
            log('repliesStore.addFeedToStore', feedOptions);
            setState(({ feedsOptions }) => {
                // make sure to never overwrite a feed already added
                if (feedsOptions[feedName] && feedsOptions[feedName].pageNumber !== 0) {
                    throw Error(`repliesStore.addFeedToStore feed '${feedName}' already added`);
                }
                return { feedsOptions: Object.assign(Object.assign({}, feedsOptions), { [feedName]: feedOptions }) };
            });
            commentsStore
                .getState()
                .addCommentToStore(commentCid, account)
                .catch((error) => log.error('repliesStore commentsStore.addCommentToStore error', { commentCid, error }));
            // subscribe to comments store changes
            commentsStore.subscribe(updateFeedsOnFeedsCommentsChange);
            // subscribe to bufferedFeedsReplyCounts change
            repliesStore.subscribe(addRepliesPagesOnLowBufferedFeedsReplyCounts);
            // subscribe to replies pages store changes
            repliesPagesStore.subscribe(updateFeedsOnFeedsRepliesPagesChange);
            // update feeds right away to use the already loaded comments and pages
            // if no new comments are added by the feed, like for a sort type change,
            // a feed update will never be triggered, so must be triggered it manually
            updateFeeds();
        });
    },
    incrementFeedPageNumber(feedName) {
        const { feedsOptions, loadedFeeds, updateFeeds } = getState();
        assert(feedsOptions[feedName], `repliesStore.incrementFeedPageNumber feed name '${feedName}' does not exist in feeds store`);
        log('repliesStore.incrementFeedPageNumber', { feedName });
        assert(feedsOptions[feedName].pageNumber * feedsOptions[feedName].repliesPerPage <= loadedFeeds[feedName].length, `repliesStore.incrementFeedPageNumber cannot increment feed page number before current page has loaded`);
        setState(({ feedsOptions, loadedFeeds }) => {
            // don't increment page number before the current page has loaded
            if (feedsOptions[feedName].pageNumber * feedsOptions[feedName].repliesPerPage > loadedFeeds[feedName].length) {
                return {};
            }
            const feedOptions = Object.assign(Object.assign({}, feedsOptions[feedName]), { pageNumber: feedsOptions[feedName].pageNumber + 1 });
            return { feedsOptions: Object.assign(Object.assign({}, feedsOptions), { [feedName]: feedOptions }) };
        });
        // do not update feed at the same time as increment a page number or it might cause
        // a race condition, rather schedule a feed update
        updateFeeds();
    },
    resetFeed(feedName) {
        const { feedsOptions, updateFeeds } = getState();
        assert(feedsOptions[feedName], `repliesStore.resetFeed feed name '${feedName}' does not exist in feeds store`);
        assert(feedsOptions[feedName].pageNumber >= 1, `repliesStore.resetFeed cannot reset feed page number '${feedsOptions[feedName].pageNumber}' lower than 1`);
        log('repliesStore.resetFeed', { feedName });
        setState(({ feedsOptions, loadedFeeds }) => {
            const feedOptions = Object.assign(Object.assign({}, feedsOptions[feedName]), { pageNumber: 1 });
            return { feedsOptions: Object.assign(Object.assign({}, feedsOptions), { [feedName]: feedOptions }), loadedFeeds: Object.assign(Object.assign({}, loadedFeeds), { [feedName]: [] }) };
        });
        updateFeeds();
    },
    // recalculate all feeds using new comments.replies.pages, repliesPagesStore and page numbers
    updateFeeds() {
        if (updateFeedsPending) {
            return;
        }
        updateFeedsPending = true;
        // don't update feeds more than once per updateFeedsMinIntervalTime
        const timeUntilNextUpdate = Date.now() % updateFeedsMinIntervalTime;
        setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            // allow a new update to be scheduled as soon as updateFeedsMinIntervalTime elapses
            updateFeedsPending = false;
            // get state from all stores
            const previousState = getState();
            const { feedsOptions } = previousState;
            const { comments } = commentsStore.getState();
            const { repliesPages } = repliesPagesStore.getState();
            const { accounts } = accountsStore.getState();
            // calculate new feeds
            const filteredSortedFeeds = getFilteredSortedFeeds(feedsOptions, comments, repliesPages, accounts);
            const bufferedFeedsWithoutPreviousLoadedFeeds = getBufferedFeedsWithoutLoadedFeeds(filteredSortedFeeds, previousState.loadedFeeds);
            const loadedFeeds = yield getLoadedFeeds(feedsOptions, previousState.loadedFeeds, bufferedFeedsWithoutPreviousLoadedFeeds, accounts);
            // after loaded feeds are caculated, remove new loaded feeds (again) from buffered feeds
            const bufferedFeeds = getBufferedFeedsWithoutLoadedFeeds(bufferedFeedsWithoutPreviousLoadedFeeds, loadedFeeds);
            const bufferedFeedsReplyCounts = getFeedsReplyCounts(feedsOptions, bufferedFeeds);
            const feedsHaveMore = getFeedsHaveMore(feedsOptions, bufferedFeeds, comments, repliesPages, accounts);
            // set new feeds
            setState((state) => ({ bufferedFeeds, loadedFeeds, bufferedFeedsReplyCounts, feedsHaveMore }));
            log.trace('repliesStore.updateFeeds', {
                feedsOptions,
                bufferedFeeds,
                loadedFeeds,
                bufferedFeedsReplyCounts,
                feedsHaveMore,
                comments,
                repliesPages,
            });
        }), timeUntilNextUpdate);
    },
}));
let previousRepliesPages = {};
const updateFeedsOnFeedsRepliesPagesChange = (repliesPagesStoreState) => {
    const { repliesPages } = repliesPagesStoreState;
    // no changes, do nothing
    if (repliesPages === previousRepliesPages) {
        return;
    }
    previousRepliesPages = repliesPages;
    // currently only the feeds use repliesPagesStore, so any change must
    // trigger a feed update, if in the future another hook uses the repliesPagesStore
    // we should check if the replies pages changed are actually used by the feeds before
    // triggering an update
    repliesStore.getState().updateFeeds();
};
let previousBufferedFeedsReplyCountsPageCids = [];
let previousBufferedFeedsComments = new Map();
let previousBufferedFeedsReplyCounts = {};
const addRepliesPagesOnLowBufferedFeedsReplyCounts = (repliesStoreState) => {
    const { bufferedFeedsReplyCounts, feedsOptions } = repliesStore.getState();
    const { comments } = commentsStore.getState();
    // if feeds comments have changed, we must try adding them even if buffered replies counts haven't changed
    const bufferedFeedsComments = getFeedsComments(feedsOptions, comments);
    const _feedsCommentsChanged = feedsCommentsChanged(previousBufferedFeedsComments, bufferedFeedsComments);
    const bufferedFeedsReplyCountsChanged = previousBufferedFeedsReplyCounts !== bufferedFeedsReplyCounts;
    // if feeds comments havent changed and buffered replies counts also havent changed, do nothing
    if (!_feedsCommentsChanged && !bufferedFeedsReplyCountsChanged) {
        return;
    }
    previousBufferedFeedsComments = bufferedFeedsComments;
    previousBufferedFeedsReplyCounts = bufferedFeedsReplyCounts;
    // in case feeds comments changed, but the first page cids haven't
    const bufferedFeedsReplyCountsPageCids = getFeedsCommentsFirstPageCids(bufferedFeedsComments);
    const bufferedFeedsReplyCountsPageCidsChanged = bufferedFeedsReplyCountsPageCids.toString() !== previousBufferedFeedsReplyCountsPageCids.toString();
    if (!bufferedFeedsReplyCountsPageCidsChanged && !bufferedFeedsReplyCountsChanged) {
        return;
    }
    previousBufferedFeedsReplyCountsPageCids = bufferedFeedsReplyCountsPageCids;
    const { addNextRepliesPageToStore } = repliesPagesStore.getState();
    const { accounts } = accountsStore.getState();
    // bufferedFeedsReplyCounts have changed, check if any of them are low
    for (const feedName in bufferedFeedsReplyCounts) {
        const account = accounts[feedsOptions[feedName].accountId];
        const feedReplyCount = bufferedFeedsReplyCounts[feedName];
        let sortType = feedsOptions[feedName].sortType;
        const commentCid = feedsOptions[feedName].commentCid;
        // TODO: maybe skip if comment subplebbit address, comment cid or comment author is blocked?
        // comment hasn't loaded yet
        if (!comments[commentCid]) {
            continue;
        }
        sortType = getSortTypeFromComment(comments[commentCid], feedsOptions[feedName]);
        // comment replies count is low, fetch next replies page
        if (feedReplyCount <= commentRepliesLeftBeforeNextPage) {
            addNextRepliesPageToStore(comments[commentCid], sortType, account).catch((error) => log.error('repliesStore repliesPagesStore.addNextRepliesPageToStore error', { commentCid, comment: comments[commentCid], sortType, error }));
        }
    }
};
let previousFeedsCommentsFirstPageCids = [];
let previousFeedsComments = new Map();
let previousFeedsCommentsLoadedCount = 0;
const updateFeedsOnFeedsCommentsChange = (commentsStoreState) => {
    const { comments } = commentsStoreState;
    const { feedsOptions, updateFeeds } = repliesStore.getState();
    // feeds comments haven't changed, do nothing
    const feedsComments = getFeedsComments(feedsOptions, comments);
    if (!feedsCommentsChanged(previousFeedsComments, feedsComments)) {
        return;
    }
    previousFeedsComments = feedsComments;
    // decide if feeds comments have changed by looking at all feeds comments page cids
    // (in case that a comment changed, but its first page cid didn't)
    const feedsCommentsFirstPageCids = getFeedsCommentsFirstPageCids(feedsComments);
    // first page cids haven't changed, do nothing
    if (feedsCommentsFirstPageCids.toString() === previousFeedsCommentsFirstPageCids.toString()) {
        // if no new feed comments have loaded, do nothing
        // in case a comment loads with no first page cid and first pages cids don't change, need to trigger hasMore update
        const feedsCommentsLoadedCount = getFeedsCommentsLoadedCount(feedsComments);
        if (feedsCommentsLoadedCount === previousFeedsCommentsLoadedCount) {
            return;
        }
        previousFeedsCommentsLoadedCount = feedsCommentsLoadedCount;
    }
    // feeds comments have changed, update feeds
    previousFeedsCommentsFirstPageCids = feedsCommentsFirstPageCids;
    updateFeeds();
};
// reset store in between tests
const originalState = repliesStore.getState();
// async function because some stores have async init
export const resetRepliesStore = () => __awaiter(void 0, void 0, void 0, function* () {
    previousBufferedFeedsReplyCounts = {};
    previousBufferedFeedsReplyCountsPageCids = [];
    previousBufferedFeedsComments = new Map();
    previousFeedsCommentsFirstPageCids = [];
    previousFeedsComments = new Map();
    previousRepliesPages = {};
    updateFeedsPending = false;
    // remove all event listeners
    listeners.forEach((listener) => listener.removeAllListeners());
    // destroy all component subscriptions to the store
    repliesStore.destroy();
    // restore original state
    repliesStore.setState(originalState);
});
// reset database and store in between tests
export const resetRepliesDatabaseAndStore = () => __awaiter(void 0, void 0, void 0, function* () {
    yield localForageLru.createInstance({ name: 'repliesPages' }).clear();
    yield resetRepliesStore();
});
export default repliesStore;
