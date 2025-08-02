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
import repliesCommentsStore from './replies-comments-store';
import repliesPagesStore from '../replies-pages';
import { getFeedsCommentsFirstPageCids, getLoadedFeeds, getBufferedFeedsWithoutLoadedFeeds, getUpdatedFeeds, getFeedsReplyCounts, getFeedsHaveMore, feedsCommentsChanged, getFeedsComments, getFeedsCommentsLoadedCount, getFeedsCommentsRepliesPagesFirstUpdatedAts, getFilteredSortedFeeds, getSortTypeFromComment, addAccountsComments, } from './utils';
// reddit loads approximately 25 posts per page
// while infinite scrolling
export const defaultRepliesPerPage = 25;
// keep large buffer because fetching cids is slow
export const commentRepliesLeftBeforeNextPage = 50;
const defaultAccountComments = { newerThan: Infinity, append: false };
const addDefaultFeedOptions = (feedOptions) => {
    feedOptions = Object.assign({}, feedOptions);
    if (feedOptions.flat === undefined || feedOptions.flat === null) {
        feedOptions.flat = false;
    }
    if (feedOptions.accountComments === undefined || feedOptions.accountComments === null) {
        feedOptions.accountComments = defaultAccountComments;
    }
    feedOptions.repliesPerPage = feedOptions.repliesPerPage || defaultRepliesPerPage;
    return feedOptions;
};
export const feedOptionsToFeedName = (feedOptions) => {
    var _a, _b, _c;
    feedOptions = addDefaultFeedOptions(feedOptions);
    return `${feedOptions === null || feedOptions === void 0 ? void 0 : feedOptions.accountId}-${feedOptions === null || feedOptions === void 0 ? void 0 : feedOptions.commentCid}-${feedOptions === null || feedOptions === void 0 ? void 0 : feedOptions.postCid}-${feedOptions === null || feedOptions === void 0 ? void 0 : feedOptions.sortType}-${feedOptions === null || feedOptions === void 0 ? void 0 : feedOptions.flat}-${(_a = feedOptions === null || feedOptions === void 0 ? void 0 : feedOptions.accountComments) === null || _a === void 0 ? void 0 : _a.newerThan}-${(_b = feedOptions === null || feedOptions === void 0 ? void 0 : feedOptions.accountComments) === null || _b === void 0 ? void 0 : _b.append}-${feedOptions === null || feedOptions === void 0 ? void 0 : feedOptions.repliesPerPage}-${(_c = feedOptions === null || feedOptions === void 0 ? void 0 : feedOptions.filter) === null || _c === void 0 ? void 0 : _c.key}-${feedOptions === null || feedOptions === void 0 ? void 0 : feedOptions.streamPage}`;
};
// don't updateFeeds more than once per updateFeedsMinIntervalTime
let updateFeedsPending = false;
let updateFeedsAgain = false;
const updateFeedsMinIntervalTime = 100;
const repliesStore = createStore((setState, getState) => ({
    feedsOptions: {},
    bufferedFeeds: {},
    loadedFeeds: {},
    updatedFeeds: {},
    bufferedFeedsReplyCounts: {},
    feedsHaveMore: {},
    addFeedsToStore(feedOptionsArray) {
        if (!feedOptionsArray.length) {
            return;
        }
        const { feedsOptions: previousFeedsOptions } = getState();
        const newFeedsOptions = {};
        // get all newFeedsOptions
        for (let feedOptions of feedOptionsArray) {
            const feedName = feedOptionsToFeedName(feedOptions);
            // feed is in store already, do nothing
            // if the feed already exist but is at page 0, reset it to page 1
            if (previousFeedsOptions[feedName] && previousFeedsOptions[feedName].pageNumber !== 0) {
                continue;
            }
            feedOptions = addDefaultFeedOptions(feedOptions);
            // to add a buffered feed, add a feed with pageNumber 0
            feedOptions.pageNumber = 1;
            newFeedsOptions[feedName] = feedOptions;
        }
        // set new feedsOptions state
        let feedsChanged = false;
        setState(({ feedsOptions }) => {
            for (const feedName in newFeedsOptions) {
                // make sure to never overwrite a feed already added
                if (feedsOptions[feedName] && feedsOptions[feedName].pageNumber !== 0) {
                    delete newFeedsOptions[feedName];
                }
            }
            if (!Object.keys(newFeedsOptions).length) {
                return {};
            }
            feedsChanged = true;
            return { feedsOptions: Object.assign(Object.assign({}, feedsOptions), newFeedsOptions) };
        });
        if (feedsChanged) {
            log('repliesStore.addFeedsToStore', newFeedsOptions);
        }
        return feedsChanged;
    },
    addFeedToStoreOrUpdateComment(comment, feedOptions) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            // init here because must be called after async accounts store finished initializing
            initializeRepliesStore();
            // validate options
            assert(comment && comment.cid && typeof comment.cid === 'string', `repliesStore.addFeedToStoreOrUpdateComment comment.cid '${comment === null || comment === void 0 ? void 0 : comment.cid}' invalid`);
            assert(feedOptions.commentCid && typeof feedOptions.commentCid === 'string', `repliesStore.addFeedToStoreOrUpdateComment feedOptions.commentCid '${feedOptions.commentCid}' invalid`);
            assert(feedOptions.sortType && typeof feedOptions.sortType === 'string', `repliesStore.addFeedToStoreOrUpdateComment feedOptions.sortType '${feedOptions.sortType}' invalid`);
            const account = accountsStore.getState().accounts[feedOptions.accountId];
            assert(typeof ((_a = account === null || account === void 0 ? void 0 : account.plebbit) === null || _a === void 0 ? void 0 : _a.getSubplebbit) === 'function', `repliesStore.addFeedToStoreOrUpdateComment feedOptions.accountId '${feedOptions.accountId}' invalid`);
            assert(!feedOptions.repliesPerPage || typeof feedOptions.repliesPerPage === 'number', `repliesStore.addFeedToStoreOrUpdateComment feedOptions.repliesPerPage '${feedOptions.repliesPerPage}' invalid`);
            assert(!feedOptions.filter || typeof ((_b = feedOptions.filter) === null || _b === void 0 ? void 0 : _b.filter) === 'function', `repliesStore.addFeedToStoreOrUpdateComment feedOptions.filter.filter '${(_c = feedOptions.filter) === null || _c === void 0 ? void 0 : _c.filter}' invalid`);
            assert(!feedOptions.filter || typeof ((_d = feedOptions.filter) === null || _d === void 0 ? void 0 : _d.key) === 'string', `repliesStore.addFeedToStoreOrUpdateComment feedOptions.filter.key '${(_e = feedOptions.filter) === null || _e === void 0 ? void 0 : _e.key}' invalid`);
            // if replies feed aren't in store yet, add them recursively
            // TODO: optimize performance by only adding feeds that are in page 1, and add more on each page increase
            const commentsToAddToStoreOrUpdate = [];
            const feedsToAddToStore = [];
            // use the sort type availabe on the comment when missing
            const sortType = getSortTypeFromComment(comment, feedOptions);
            const addRepliesFeedsToStoreRecursively = (comment) => {
                var _a, _b, _c;
                // NOTE: even a comment with no replies needs a feed, to know it has 0 replies and not displace the UI when a new replies appears
                commentsToAddToStoreOrUpdate.push(comment);
                feedsToAddToStore.push(Object.assign(Object.assign({}, feedOptions), { commentCid: comment === null || comment === void 0 ? void 0 : comment.cid, commentDepth: comment === null || comment === void 0 ? void 0 : comment.depth }));
                // flat doesn't need nested feeds
                if (!feedOptions.flat) {
                    for (const reply of ((_c = (_b = (_a = comment.replies) === null || _a === void 0 ? void 0 : _a.pages) === null || _b === void 0 ? void 0 : _b[sortType]) === null || _c === void 0 ? void 0 : _c.comments) || []) {
                        addRepliesFeedsToStoreRecursively(reply);
                    }
                }
            };
            addRepliesFeedsToStoreRecursively(comment);
            // add feeds to store and update feeds
            const { addFeedsToStore, updateFeeds } = getState();
            const feedsChanged = addFeedsToStore(feedsToAddToStore);
            // add comments to store (do it after addFeedsToStore because it can trigger updateFeeds)
            repliesCommentsStore.getState().addCommentsToStoreOrUpdateComments(commentsToAddToStoreOrUpdate);
            if (feedsChanged) {
                log('repliesStore.addFeedToStoreOrUpdateComment', { comment, feedOptions, sortType, feedsToAddToStore, commentsToAddToStoreOrUpdate });
                updateFeeds();
            }
        });
    },
    incrementFeedPageNumber(feedName) {
        const { feedsOptions, loadedFeeds, bufferedFeeds, updateFeeds } = getState();
        assert(feedsOptions[feedName], `repliesStore.incrementFeedPageNumber feed name '${feedName}' does not exist in feeds store`);
        log('repliesStore.incrementFeedPageNumber', { feedName });
        // TODO: fix design issue, pageNumber shouldnt be increased when loadMore is called and repliesPerPage not reached
        // assert(
        //   feedsOptions[feedName].pageNumber * feedsOptions[feedName].repliesPerPage <= loadedFeeds[feedName].length,
        //   `repliesStore.incrementFeedPageNumber cannot increment feed page number before current page has loaded`
        // )
        if (feedsOptions[feedName].pageNumber * feedsOptions[feedName].repliesPerPage <= loadedFeeds[feedName].length) {
            assert(bufferedFeeds[feedName].length > 0, `repliesStore.incrementFeedPageNumber cannot increment feed page number before current page has loaded`);
        }
        setState(({ feedsOptions, loadedFeeds }) => {
            // don't increment page number before the current page has loaded
            // if (feedsOptions[feedName].pageNumber * feedsOptions[feedName].repliesPerPage > loadedFeeds[feedName].length) {
            //   return {}
            // }
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
        setState(({ feedsOptions, loadedFeeds, updatedFeeds }) => {
            const feedOptions = Object.assign(Object.assign({}, feedsOptions[feedName]), { pageNumber: 1 });
            return {
                feedsOptions: Object.assign(Object.assign({}, feedsOptions), { [feedName]: feedOptions }),
                loadedFeeds: Object.assign(Object.assign({}, loadedFeeds), { [feedName]: [] }),
                updatedFeeds: Object.assign(Object.assign({}, updatedFeeds), { [feedName]: [] }),
            };
        });
        updateFeeds();
    },
    // recalculate all feeds using new comments.replies.pages, repliesPagesStore and page numbers
    updateFeeds() {
        if (updateFeedsPending) {
            updateFeedsAgain = true;
            return;
        }
        updateFeedsPending = true;
        // don't update feeds more than once per updateFeedsMinIntervalTime
        const timeUntilNextUpdate = Date.now() % updateFeedsMinIntervalTime;
        setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            // get state from all stores
            const previousState = getState();
            const { feedsOptions, updateFeeds } = previousState;
            const { comments } = repliesCommentsStore.getState();
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
            const updatedFeeds = yield getUpdatedFeeds(feedsOptions, filteredSortedFeeds, previousState.updatedFeeds, loadedFeeds, accounts);
            // set new feeds
            setState((state) => ({ bufferedFeeds, loadedFeeds, bufferedFeedsReplyCounts, updatedFeeds, feedsHaveMore }));
            log('repliesStore.updateFeeds', {
                feedsOptions,
                bufferedFeeds,
                loadedFeeds,
                bufferedFeedsReplyCounts,
                updatedFeeds,
                feedsHaveMore,
                comments,
                repliesPages,
            });
            updateFeedsPending = false;
            // if updateFeeds was called while updateFeedsPending = true, call updateFeeds again
            if (updateFeedsAgain) {
                updateFeedsAgain = false;
                updateFeeds();
            }
        }), timeUntilNextUpdate);
    },
}));
let repliesStoreInitialized = false;
const initializeRepliesStore = () => __awaiter(void 0, void 0, void 0, function* () {
    if (repliesStoreInitialized) {
        return;
    }
    repliesStoreInitialized = true;
    // TODO: optimize subscriptions e.g. updateFeedsOnFeedsCommentsChange(comment)
    // subscribe to comments store changes
    repliesCommentsStore.subscribe(updateFeedsOnFeedsCommentsChange);
    // subscribe to bufferedFeedsReplyCounts change
    repliesStore.subscribe(addRepliesPagesOnLowBufferedFeedsReplyCounts);
    // subscribe to replies pages store changes
    repliesPagesStore.subscribe(updateFeedsOnFeedsRepliesPagesChange);
    // subscribe to accounts store changes
    accountsStore.subscribe(updateFeedsOnAccountsCommentsChange);
});
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
    const { comments } = repliesCommentsStore.getState();
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
let previousFeedsCommentsRepliesPagesFirstUpdatedAts = '';
const updateFeedsOnFeedsCommentsChange = (repliesCommentsStoreState) => {
    const { comments } = repliesCommentsStoreState;
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
            // if comment.replies.pages haven't changed, do nothing
            const feedsCommentsRepliesPagesFirstUpdatedAts = getFeedsCommentsRepliesPagesFirstUpdatedAts(feedsComments);
            if (feedsCommentsRepliesPagesFirstUpdatedAts === previousFeedsCommentsRepliesPagesFirstUpdatedAts) {
                return;
            }
            previousFeedsCommentsRepliesPagesFirstUpdatedAts = feedsCommentsRepliesPagesFirstUpdatedAts;
        }
        previousFeedsCommentsLoadedCount = feedsCommentsLoadedCount;
    }
    // feeds comments have changed, update feeds
    previousFeedsCommentsFirstPageCids = feedsCommentsFirstPageCids;
    updateFeeds();
};
let previousAccountsCommentsCount = 0;
let previousAccountsCommentsCids = '';
const updateFeedsOnAccountsCommentsChange = (accountsStoreState) => {
    const { accountsComments } = accountsStoreState;
    const accountsCommentsCount = Object.values(accountsComments).reduce((count, accountComments) => count + accountComments.length, 0);
    // no changes, do nothing
    if (accountsCommentsCount === previousAccountsCommentsCount) {
        // if cids haven't changed (account comments receive cids after pending), do nothing
        const accountsCommentsCids = Object.values(accountsComments).reduce((cids, accountComments) => cids + String(accountComments.map((comment) => comment.cid || '')), '');
        if (accountsCommentsCids === previousAccountsCommentsCids) {
            return;
        }
        previousAccountsCommentsCids = accountsCommentsCids;
    }
    previousAccountsCommentsCount = accountsCommentsCount;
    // TODO: only update the feeds that are relevant to the new accountComment.parentCid/postCid
    repliesStore.getState().updateFeeds();
};
// needed to view replies instantly without waiting for zustant store react rerenders. must be synchronous
export const getRepliesFirstPageSkipValidation = (comment, feedOptions) => {
    const feedName = `firstPageSkipValidation-${comment === null || comment === void 0 ? void 0 : comment.cid}`;
    const feedsOptions = { [feedName]: feedOptions };
    const { accounts } = accountsStore.getState();
    // don't use comments store, only use preloaded comment.replies.pages
    const comments = { [comment.cid]: comment };
    // don't use any reply pages, they can't provide instant loading like preloaded comment.replies.pages
    const repliesPages = {};
    const filteredSortedFeeds = getFilteredSortedFeeds(feedsOptions, comments, repliesPages, accounts);
    // only get first page and put next page in buffered
    const bufferedFeeds = { [feedName]: [] };
    const repliesPerPage = feedOptions.repliesPerPage || defaultRepliesPerPage;
    if (filteredSortedFeeds[feedName].length > repliesPerPage) {
        bufferedFeeds[feedName] = filteredSortedFeeds[feedName].splice(repliesPerPage);
    }
    addAccountsComments(feedsOptions, filteredSortedFeeds);
    const feedsHaveMore = getFeedsHaveMore(feedsOptions, bufferedFeeds, comments, repliesPages, accounts);
    return { replies: filteredSortedFeeds[feedName], hasMore: feedsHaveMore[feedName] };
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
    previousFeedsCommentsLoadedCount = 0;
    previousFeedsCommentsRepliesPagesFirstUpdatedAts = '';
    previousRepliesPages = {};
    previousAccountsCommentsCount = 0;
    previousAccountsCommentsCids = '';
    updateFeedsPending = false;
    // destroy all component subscriptions to the store
    repliesStore.destroy();
    // restore original state
    repliesStore.setState(originalState);
    repliesCommentsStore.setState(Object.assign(Object.assign({}, repliesCommentsStore.getState()), { comments: {} }));
    repliesStoreInitialized = false;
});
// reset database and store in between tests
export const resetRepliesDatabaseAndStore = () => __awaiter(void 0, void 0, void 0, function* () {
    yield localForageLru.createInstance({ name: 'plebbitReactHooks-repliesPages' }).clear();
    yield resetRepliesStore();
});
export default repliesStore;
