var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getRepliesPages, getRepliesFirstPageCid } from '../replies-pages';
import repliesSorter from '../feeds/feed-sorter';
import { flattenCommentsPages, commentIsValid, removeInvalidComments } from '../../lib/utils';
import Logger from '@plebbit/plebbit-logger';
const log = Logger('plebbit-react-hooks:replies:stores');
/**
 * Calculate the feeds from all the loaded replies pages, filter and sort them
 */
export const getFilteredSortedFeeds = (feedsOptions, comments, repliesPages, accounts) => {
    // calculate each feed
    let feeds = {};
    for (const feedName in feedsOptions) {
        let { commentCid, sortType, accountId, filter, flat } = feedsOptions[feedName];
        // find all fetched replies
        let bufferedFeedReplies = [];
        const comment = comments[commentCid];
        sortType = getSortTypeFromComment(comment, feedsOptions[feedName]);
        // comment has loaded and cache not expired
        if (comment) {
            // use comment preloaded replies if any
            const preloadedReplies = getPreloadedReplies(comment, sortType);
            if (preloadedReplies) {
                for (const reply of preloadedReplies) {
                    // replies are manually validated, could have fake subplebbitAddress
                    if (reply.subplebbitAddress !== comment.subplebbitAddress) {
                        break;
                    }
                    bufferedFeedReplies.push(reply);
                }
            }
            // add all replies from comment replies pages
            const _repliesPages = getRepliesPages(comment, sortType, repliesPages);
            for (const repliesPage of _repliesPages) {
                if (repliesPage === null || repliesPage === void 0 ? void 0 : repliesPage.comments) {
                    for (const reply of repliesPage.comments) {
                        // replies are manually validated, could have fake subplebbitAddress
                        if (reply.subplebbitAddress !== comment.subplebbitAddress) {
                            break;
                        }
                        bufferedFeedReplies.push(reply);
                    }
                }
            }
        }
        if (flat) {
            bufferedFeedReplies = flattenCommentsPages({ comments: bufferedFeedReplies });
        }
        // sort the feed before filtering to get more accurate results
        const sortedBufferedFeedReplies = repliesSorter.sort(sortType, bufferedFeedReplies);
        // filter the feed
        const filteredSortedBufferedFeedReplies = [];
        for (const reply of sortedBufferedFeedReplies) {
            // TODO: maybe skip if comment subplebbit address, comment cid or comment author is blocked?
            // feedOptions filter function
            if (filter && !filter.filter(reply)) {
                continue;
            }
            filteredSortedBufferedFeedReplies.push(reply);
        }
        feeds[feedName] = filteredSortedBufferedFeedReplies;
    }
    return feeds;
};
const getPreloadedReplies = (comment, sortType) => {
    var _a, _b, _c, _d, _e, _f, _g;
    let preloadedReplies = (_c = (_b = (_a = comment.replies) === null || _a === void 0 ? void 0 : _a.pages) === null || _b === void 0 ? void 0 : _b[sortType]) === null || _c === void 0 ? void 0 : _c.comments;
    if (preloadedReplies) {
        return preloadedReplies;
    }
    // TODO: should we check pageCids? it's possible to have pageCids 
    // and use 'best' preloadedReplies, if they have no nextCid (all replies are preloaded)
    // changing this might bug out nested immediate react renders
    // only check on comment.depth: 0 for now
    const hasPageCids = Object.keys(((_d = comment.replies) === null || _d === void 0 ? void 0 : _d.pageCids) || {}).length !== 0;
    if (hasPageCids && comment.depth === 0) {
        return;
    }
    const pages = Object.values(((_e = comment.replies) === null || _e === void 0 ? void 0 : _e.pages) || {});
    if (!pages.length) {
        return;
    }
    const nextCids = pages.map((page) => page === null || page === void 0 ? void 0 : page.nextCid).filter((nextCid) => !!nextCid);
    if (nextCids.length > 0) {
        return;
    }
    // if has a preloaded page, but no pageCids and no nextCids, it means all replies fit in a single preloaded page
    // so any sort type can be used, and later be resorted by the client
    if ((_g = (_f = pages[0]) === null || _f === void 0 ? void 0 : _f.comments) === null || _g === void 0 ? void 0 : _g.length) {
        return pages[0].comments;
    }
};
export const getLoadedFeeds = (feedsOptions, loadedFeeds, bufferedFeeds, accounts) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const loadedFeedsMissingReplies = {};
    for (const feedName in feedsOptions) {
        const { pageNumber, repliesPerPage, accountId } = feedsOptions[feedName];
        const plebbit = (_a = accounts[accountId]) === null || _a === void 0 ? void 0 : _a.plebbit;
        const loadedFeedReplyCount = pageNumber * repliesPerPage;
        const currentLoadedFeed = loadedFeeds[feedName] || [];
        const missingRepliesCount = loadedFeedReplyCount - currentLoadedFeed.length;
        // get new replies from buffered feed
        const bufferedFeed = bufferedFeeds[feedName] || [];
        let missingReplies = [];
        for (const reply of bufferedFeed) {
            if (missingReplies.length === missingRepliesCount) {
                missingReplies = yield removeInvalidComments(missingReplies, { validateReplies: false }, plebbit);
                // only stop if there were no invalid comments
                if (missingReplies.length === missingRepliesCount) {
                    break;
                }
            }
            missingReplies.push(reply);
        }
        // the current loaded feed already exist and doesn't need new replies
        if (missingReplies.length === 0 && loadedFeeds[feedName]) {
            continue;
        }
        loadedFeedsMissingReplies[feedName] = missingReplies;
    }
    // do nothing if there are no missing replies
    if (Object.keys(loadedFeedsMissingReplies).length === 0) {
        return loadedFeeds;
    }
    const newLoadedFeeds = {};
    for (const feedName in loadedFeedsMissingReplies) {
        newLoadedFeeds[feedName] = [...(loadedFeeds[feedName] || []), ...loadedFeedsMissingReplies[feedName]];
    }
    return Object.assign(Object.assign({}, loadedFeeds), newLoadedFeeds);
});
export const getBufferedFeedsWithoutLoadedFeeds = (bufferedFeeds, loadedFeeds) => {
    var _a, _b, _c, _d, _e;
    // contruct a list of replies already loaded to remove them from buffered feeds
    const loadedFeedsReplies = {};
    for (const feedName in loadedFeeds) {
        loadedFeedsReplies[feedName] = new Set();
        for (const reply of loadedFeeds[feedName]) {
            loadedFeedsReplies[feedName].add(reply.cid);
        }
    }
    const newBufferedFeeds = {};
    for (const feedName in bufferedFeeds) {
        newBufferedFeeds[feedName] = [];
        let bufferedFeedReplyChanged = false;
        for (const [i, reply] of bufferedFeeds[feedName].entries()) {
            if ((_a = loadedFeedsReplies[feedName]) === null || _a === void 0 ? void 0 : _a.has(reply.cid)) {
                continue;
            }
            newBufferedFeeds[feedName].push(reply);
            if (!bufferedFeedReplyChanged &&
                (((_b = newBufferedFeeds[feedName][i]) === null || _b === void 0 ? void 0 : _b.cid) !== ((_c = bufferedFeeds[feedName][i]) === null || _c === void 0 ? void 0 : _c.cid) ||
                    (((_d = newBufferedFeeds[feedName][i]) === null || _d === void 0 ? void 0 : _d.updatedAt) || 0) > (((_e = bufferedFeeds[feedName][i]) === null || _e === void 0 ? void 0 : _e.updatedAt) || 0))) {
                bufferedFeedReplyChanged = true;
            }
        }
        if (!bufferedFeedReplyChanged && newBufferedFeeds[feedName].length === bufferedFeeds[feedName].length) {
            newBufferedFeeds[feedName] = bufferedFeeds[feedName];
        }
    }
    return newBufferedFeeds;
};
export const getUpdatedFeeds = (feedsOptions, filteredSortedFeeds, updatedFeeds, loadedFeeds, accounts) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c, _d;
    // contruct a list of replies already loaded to remove them from buffered feeds
    const updatedFeedsReplies = {};
    for (const feedName in updatedFeeds) {
        updatedFeedsReplies[feedName] = {};
        for (const [index, updatedReply] of updatedFeeds[feedName].entries()) {
            updatedFeedsReplies[feedName][updatedReply.cid] = { index, updatedReply };
        }
    }
    const newUpdatedFeeds = Object.assign({}, updatedFeeds);
    for (const feedName in filteredSortedFeeds) {
        const plebbit = (_c = accounts[(_b = feedsOptions[feedName]) === null || _b === void 0 ? void 0 : _b.accountId]) === null || _c === void 0 ? void 0 : _c.plebbit;
        const updatedFeed = [...(updatedFeeds[feedName] || [])];
        const onlyHasNewReplies = updatedFeed.length === 0;
        let updatedFeedChanged = false;
        // add new replies from loadedFeed replies
        while (updatedFeed.length < loadedFeeds[feedName].length) {
            updatedFeed[updatedFeed.length] = loadedFeeds[feedName][updatedFeed.length];
            updatedFeedChanged = true;
        }
        // add updated replies from filteredSortedFeed
        if (!onlyHasNewReplies) {
            const promises = [];
            for (const reply of filteredSortedFeeds[feedName]) {
                if ((_d = updatedFeedsReplies[feedName]) === null || _d === void 0 ? void 0 : _d[reply.cid]) {
                    const { index, updatedReply } = updatedFeedsReplies[feedName][reply.cid];
                    promises.push((() => __awaiter(void 0, void 0, void 0, function* () {
                        if ((reply.updatedAt || 0) > (updatedReply.updatedAt || 0) && (yield commentIsValid(reply, { validateReplies: false }, plebbit))) {
                            updatedFeed[index] = reply;
                            updatedFeedChanged = true;
                        }
                    }))());
                }
            }
            yield Promise.all(promises);
        }
        if (updatedFeedChanged) {
            newUpdatedFeeds[feedName] = updatedFeed;
        }
    }
    return newUpdatedFeeds;
});
// find how many replies are in each comments in a buffereds feeds
// NOTE: not useful, could use feed.length, copied over from useFeed and easier to keep it
export const getFeedsReplyCounts = (feedsOptions, feeds) => {
    var _a;
    const feedsReplyCounts = {};
    for (const feedName in feedsOptions) {
        feedsReplyCounts[feedName] = ((_a = feeds[feedName]) === null || _a === void 0 ? void 0 : _a.length) || 0;
    }
    return feedsReplyCounts;
};
/**
 * Get which feeds have more replies, i.e. have not reached the final page of all comments
 */
export const getFeedsHaveMore = (feedsOptions, bufferedFeeds, comments, repliesPages, accounts) => {
    var _a;
    const feedsHaveMore = {};
    for (const feedName in feedsOptions) {
        // if the feed still has buffered replies, then it still has more
        if ((_a = bufferedFeeds[feedName]) === null || _a === void 0 ? void 0 : _a.length) {
            feedsHaveMore[feedName] = true;
            continue;
        }
        let { commentCid, sortType, accountId } = feedsOptions[feedName];
        // TODO: maybe skip if comment cid is blocked?
        const comment = comments[commentCid];
        // if at least comment hasn't loaded yet, then the feed still has more
        if (!(comment === null || comment === void 0 ? void 0 : comment.updatedAt)) {
            feedsHaveMore[feedName] = true;
            continue;
        }
        sortType = getSortTypeFromComment(comment, feedsOptions[feedName]);
        const firstPageCid = getRepliesFirstPageCid(comment, sortType);
        // TODO: if a loaded comment doesn't have a first page, it's unclear what we should do
        // should we try to use another sort type by default, like 'best', or should we just ignore it?
        // 'continue' to ignore it for now
        if (!firstPageCid) {
            feedsHaveMore[feedName] = false;
            continue;
        }
        const pages = getRepliesPages(comment, sortType, repliesPages);
        // if first page isn't loaded yet, then the feed still has more
        if (!pages.length) {
            feedsHaveMore[feedName] = true;
            continue;
        }
        const lastPage = pages[pages.length - 1];
        if (lastPage.nextCid) {
            feedsHaveMore[feedName] = true;
            continue;
        }
        // if buffered feeds are empty and no last page of any comment has a next page, then has more is false
        feedsHaveMore[feedName] = false;
    }
    return feedsHaveMore;
};
// get all comments replies pages cids of all feeds, use to check if a commentsStore change should trigger updateFeeds
export const getFeedsComments = (feedsOptions, comments) => {
    const feedsComments = new Map();
    for (const feedName in feedsOptions) {
        feedsComments.set(feedsOptions[feedName].commentCid, comments[feedsOptions[feedName].commentCid]);
    }
    return feedsComments;
};
export const feedsCommentsChanged = (previousFeedsComments, feedsComments) => {
    if (previousFeedsComments.size !== feedsComments.size) {
        return true;
    }
    for (let commentCid of previousFeedsComments.keys()) {
        // check if the object is still the same
        if (previousFeedsComments.get(commentCid) !== feedsComments.get(commentCid)) {
            return true;
        }
    }
    return false;
};
// get all comments replies pages cids of all feeds, use to check if a commentsStore change should trigger updateFeeds
export const getFeedsCommentsFirstPageCids = (feedsComments) => {
    // find all the feeds comments first page cids
    const feedsCommentsFirstPageCids = new Set();
    for (const comment of feedsComments.values()) {
        if (!(comment === null || comment === void 0 ? void 0 : comment.replies)) {
            continue;
        }
        // check pages
        if (comment.replies.pages) {
            for (const page of Object.values(comment.replies.pages)) {
                if (page === null || page === void 0 ? void 0 : page.nextCid) {
                    feedsCommentsFirstPageCids.add(page === null || page === void 0 ? void 0 : page.nextCid);
                }
            }
        }
        // check pageCids
        if (comment.replies.pageCids) {
            for (const pageCid of Object.values(comment.replies.pageCids)) {
                if (pageCid) {
                    feedsCommentsFirstPageCids.add(pageCid);
                }
            }
        }
    }
    return [...feedsCommentsFirstPageCids].sort();
};
// get all comments replies pages first reply updatedAts, use to check if a commentsStore change should trigger updateFeeds
export const getFeedsCommentsRepliesPagesFirstUpdatedAts = (feedsComments) => {
    var _a, _b, _c;
    let feedsCommentsRepliesPagesFirstUpdatedAts = '';
    for (const comment of feedsComments.values()) {
        for (const page of Object.values(((_a = comment === null || comment === void 0 ? void 0 : comment.replies) === null || _a === void 0 ? void 0 : _a.pages) || {})) {
            if ((_c = (_b = page === null || page === void 0 ? void 0 : page.comments) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.updatedAt) {
                feedsCommentsRepliesPagesFirstUpdatedAts += page.comments[0].cid + page.comments[0].updatedAt;
            }
        }
    }
    return feedsCommentsRepliesPagesFirstUpdatedAts;
};
// get number of feeds comments that are loaded
export const getFeedsCommentsLoadedCount = (feedsComments) => {
    let count = 0;
    for (const comment of feedsComments.values()) {
        if (comment === null || comment === void 0 ? void 0 : comment.updatedAt) {
            count++;
        }
    }
    return count;
};
// selected sort type could be missing from comment, or not optimized
export const getSortTypeFromComment = (comment, feedOptions) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15;
    let { sortType, flat } = feedOptions;
    if (!comment) {
        return sortType;
    }
    // 'topAll' and 'best' are similar enough to be used interchangeably
    if (sortType === 'best' && !((_b = (_a = comment.replies) === null || _a === void 0 ? void 0 : _a.pages) === null || _b === void 0 ? void 0 : _b.best) && !((_d = (_c = comment.replies) === null || _c === void 0 ? void 0 : _c.pageCids) === null || _d === void 0 ? void 0 : _d.best) && (((_f = (_e = comment.replies) === null || _e === void 0 ? void 0 : _e.pages) === null || _f === void 0 ? void 0 : _f.topAll) || ((_h = (_g = comment.replies) === null || _g === void 0 ? void 0 : _g.pageCids) === null || _h === void 0 ? void 0 : _h.topAll))) {
        sortType = 'topAll';
    }
    else if (sortType === 'topAll' &&
        !((_k = (_j = comment.replies) === null || _j === void 0 ? void 0 : _j.pages) === null || _k === void 0 ? void 0 : _k.topAll) &&
        !((_m = (_l = comment.replies) === null || _l === void 0 ? void 0 : _l.pageCids) === null || _m === void 0 ? void 0 : _m.topAll) &&
        (((_p = (_o = comment.replies) === null || _o === void 0 ? void 0 : _o.pages) === null || _p === void 0 ? void 0 : _p.best) || ((_r = (_q = comment.replies) === null || _q === void 0 ? void 0 : _q.pageCids) === null || _r === void 0 ? void 0 : _r.best))) {
        sortType = 'best';
    }
    // if 'new' sort type and flat: true, use 'newFlat'
    else if (sortType === 'new' && flat && (((_t = (_s = comment.replies) === null || _s === void 0 ? void 0 : _s.pages) === null || _t === void 0 ? void 0 : _t.newFlat) || ((_v = (_u = comment.replies) === null || _u === void 0 ? void 0 : _u.pageCids) === null || _v === void 0 ? void 0 : _v.newFlat))) {
        sortType = 'newFlat';
    }
    // if 'old' sort type and flat: true, use 'oldFlat'
    else if (sortType === 'old' && flat && (((_x = (_w = comment.replies) === null || _w === void 0 ? void 0 : _w.pages) === null || _x === void 0 ? void 0 : _x.oldFlat) || ((_z = (_y = comment.replies) === null || _y === void 0 ? void 0 : _y.pageCids) === null || _z === void 0 ? void 0 : _z.oldFlat))) {
        sortType = 'oldFlat';
    }
    // if 'newFlat' is missing, use 'new'
    else if (sortType === 'newFlat' &&
        !((_1 = (_0 = comment.replies) === null || _0 === void 0 ? void 0 : _0.pages) === null || _1 === void 0 ? void 0 : _1.newFlat) &&
        !((_3 = (_2 = comment.replies) === null || _2 === void 0 ? void 0 : _2.pageCids) === null || _3 === void 0 ? void 0 : _3.newFlat) &&
        (((_5 = (_4 = comment.replies) === null || _4 === void 0 ? void 0 : _4.pages) === null || _5 === void 0 ? void 0 : _5.new) || ((_7 = (_6 = comment.replies) === null || _6 === void 0 ? void 0 : _6.pageCids) === null || _7 === void 0 ? void 0 : _7.new))) {
        sortType = 'new';
    }
    // if 'oldFlat' is missing, use 'old'
    else if (sortType === 'oldFlat' &&
        !((_9 = (_8 = comment.replies) === null || _8 === void 0 ? void 0 : _8.pages) === null || _9 === void 0 ? void 0 : _9.oldFlat) &&
        !((_11 = (_10 = comment.replies) === null || _10 === void 0 ? void 0 : _10.pageCids) === null || _11 === void 0 ? void 0 : _11.oldFlat) &&
        (((_13 = (_12 = comment.replies) === null || _12 === void 0 ? void 0 : _12.pages) === null || _13 === void 0 ? void 0 : _13.old) || ((_15 = (_14 = comment.replies) === null || _14 === void 0 ? void 0 : _14.pageCids) === null || _15 === void 0 ? void 0 : _15.old))) {
        sortType = 'old';
    }
    // TODO: if sort type doesn't exist on comment, maybe use first existing?
    // else if (!comment.replies?.pages?.[sortType] && !comment.replies?.pageCids?.[sortType]) {
    //   const firstPageSortType = comment.replies?.pages && Object.keys(comment.replies.pages)[0]
    //   if (firstPageSortType) {
    //     sortType = firstPageSortType
    //   }
    //   else {
    //     const firstPageCidSortType = comment.replies?.pageCids && Object.keys(comment.replies.pageCids)[0]
    //     if (firstPageCidSortType) {
    //       sortType = firstPageCidSortType
    //     }
    //   }
    // }
    return sortType;
};
