var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getSubplebbitPages, getSubplebbitFirstPageCid } from '../subplebbits-pages';
import feedSorter from './feed-sorter';
import { subplebbitPostsCacheExpired, commentIsValid, removeInvalidComments } from '../../lib/utils';
import Logger from '@plebbit/plebbit-logger';
const log = Logger('plebbit-react-hooks:feeds:stores');
/**
 * Calculate the feeds from all the loaded subplebbit pages, filter and sort them
 */
export const getFilteredSortedFeeds = (feedsOptions, subplebbits, subplebbitsPages, accounts) => {
    var _a, _b, _c, _d;
    // calculate each feed
    let feeds = {};
    for (const feedName in feedsOptions) {
        const { subplebbitAddresses, sortType, accountId, filter, newerThan } = feedsOptions[feedName];
        const newerThanTimestamp = newerThan ? Math.floor(Date.now() / 1000) - newerThan : undefined;
        // find all fetched posts
        const bufferedFeedPosts = [];
        // add each comment from each page, do not filter at this stage, filter after sorting
        for (const subplebbitAddress of subplebbitAddresses) {
            // subplebbit hasn't loaded yet
            if (!subplebbits[subplebbitAddress]) {
                continue;
            }
            // if cache is expired and has internet access, don't use, wait for next subplebbit update
            if (subplebbitPostsCacheExpired(subplebbits[subplebbitAddress]) && window.navigator.onLine) {
                continue;
            }
            // use subplebbit preloaded posts if any
            const preloadedPosts = getPreloadedPosts(subplebbits[subplebbitAddress], sortType);
            if (preloadedPosts) {
                for (const post of preloadedPosts) {
                    // posts are manually validated, could have fake subplebbitAddress
                    if (post.subplebbitAddress !== subplebbitAddress) {
                        break;
                    }
                    bufferedFeedPosts.push(post);
                }
            }
            // add all posts from subplebbit pages
            const subplebbitPages = getSubplebbitPages(subplebbits[subplebbitAddress], sortType, subplebbitsPages);
            for (const subplebbitPage of subplebbitPages) {
                if (subplebbitPage === null || subplebbitPage === void 0 ? void 0 : subplebbitPage.comments) {
                    for (const post of subplebbitPage.comments) {
                        // posts are manually validated, could have fake subplebbitAddress
                        if (post.subplebbitAddress !== subplebbitAddress) {
                            break;
                        }
                        bufferedFeedPosts.push(post);
                    }
                }
            }
        }
        // sort the feed before filtering to get more accurate results
        const sortedBufferedFeedPosts = feedSorter.sort(sortType, bufferedFeedPosts);
        // filter the feed
        const filteredSortedBufferedFeedPosts = [];
        for (const post of sortedBufferedFeedPosts) {
            // address is blocked
            if (((_a = accounts[accountId]) === null || _a === void 0 ? void 0 : _a.blockedAddresses[post.subplebbitAddress]) || (((_b = post.author) === null || _b === void 0 ? void 0 : _b.address) && ((_c = accounts[accountId]) === null || _c === void 0 ? void 0 : _c.blockedAddresses[post.author.address]))) {
                continue;
            }
            // comment cid is blocked
            if ((_d = accounts[accountId]) === null || _d === void 0 ? void 0 : _d.blockedCids[post.cid]) {
                continue;
            }
            // if a feed has more than 1 sub, don't include pinned posts
            // TODO: add test to check if pinned are filtered
            if (post.pinned && subplebbitAddresses.length > 1) {
                continue;
            }
            // feedOptions filter function
            if (filter && !filter.filter(post)) {
                continue;
            }
            // filter posts older than newerThan option
            if (newerThanTimestamp) {
                if (sortType === 'active') {
                    if ((post.lastReplyTimestamp || post.timestamp) <= newerThanTimestamp) {
                        continue;
                    }
                }
                else {
                    if (post.timestamp <= newerThanTimestamp) {
                        continue;
                    }
                }
            }
            filteredSortedBufferedFeedPosts.push(post);
        }
        feeds[feedName] = filteredSortedBufferedFeedPosts;
    }
    return feeds;
};
const getPreloadedPosts = (subplebbit, sortType) => {
    var _a, _b, _c, _d, _e, _f, _g;
    let preloadedPosts = (_c = (_b = (_a = subplebbit.posts) === null || _a === void 0 ? void 0 : _a.pages) === null || _b === void 0 ? void 0 : _b[sortType]) === null || _c === void 0 ? void 0 : _c.comments;
    if (preloadedPosts) {
        return preloadedPosts;
    }
    const hasPageCids = Object.keys(((_d = subplebbit.posts) === null || _d === void 0 ? void 0 : _d.pageCids) || {}).length !== 0;
    if (hasPageCids) {
        return;
    }
    const pages = Object.values(((_e = subplebbit.posts) === null || _e === void 0 ? void 0 : _e.pages) || {});
    if (!pages.length) {
        return;
    }
    const nextCids = pages.map((page) => page === null || page === void 0 ? void 0 : page.nextCid).filter((nextCid) => !!nextCid);
    if (nextCids.length > 0) {
        return;
    }
    // if has a preloaded page, but no pageCids and no nextCids, it means all posts fit in a single preloaded page
    // so any sort type can be used, and later be resorted by the client
    if ((_g = (_f = pages[0]) === null || _f === void 0 ? void 0 : _f.comments) === null || _g === void 0 ? void 0 : _g.length) {
        return pages[0].comments;
    }
};
export const getLoadedFeeds = (feedsOptions, loadedFeeds, bufferedFeeds, accounts) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const loadedFeedsMissingPosts = {};
    for (const feedName in feedsOptions) {
        const { pageNumber, postsPerPage, accountId } = feedsOptions[feedName];
        const plebbit = (_a = accounts[accountId]) === null || _a === void 0 ? void 0 : _a.plebbit;
        const loadedFeedPostCount = pageNumber * postsPerPage;
        const currentLoadedFeed = loadedFeeds[feedName] || [];
        const missingPostsCount = loadedFeedPostCount - currentLoadedFeed.length;
        // get new posts from buffered feed
        const bufferedFeed = bufferedFeeds[feedName] || [];
        let missingPosts = [];
        for (const post of bufferedFeed) {
            if (missingPosts.length === missingPostsCount) {
                missingPosts = yield removeInvalidComments(missingPosts, { validateReplies: false }, plebbit);
                // only stop if there were no invalid comments
                if (missingPosts.length === missingPostsCount) {
                    break;
                }
            }
            missingPosts.push(post);
        }
        // the current loaded feed already exist and doesn't need new posts
        if (missingPosts.length === 0 && loadedFeeds[feedName]) {
            continue;
        }
        loadedFeedsMissingPosts[feedName] = missingPosts;
    }
    // do nothing if there are no missing posts
    if (Object.keys(loadedFeedsMissingPosts).length === 0) {
        return loadedFeeds;
    }
    const newLoadedFeeds = {};
    for (const feedName in loadedFeedsMissingPosts) {
        newLoadedFeeds[feedName] = [...(loadedFeeds[feedName] || []), ...loadedFeedsMissingPosts[feedName]];
    }
    return Object.assign(Object.assign({}, loadedFeeds), newLoadedFeeds);
});
export const getBufferedFeedsWithoutLoadedFeeds = (bufferedFeeds, loadedFeeds) => {
    var _a, _b, _c, _d, _e;
    // contruct a list of posts already loaded to remove them from buffered feeds
    const loadedFeedsPosts = {};
    for (const feedName in loadedFeeds) {
        loadedFeedsPosts[feedName] = new Set();
        for (const post of loadedFeeds[feedName]) {
            loadedFeedsPosts[feedName].add(post.cid);
        }
    }
    const newBufferedFeeds = {};
    for (const feedName in bufferedFeeds) {
        newBufferedFeeds[feedName] = [];
        let bufferedFeedPostChanged = false;
        for (const [i, post] of bufferedFeeds[feedName].entries()) {
            if ((_a = loadedFeedsPosts[feedName]) === null || _a === void 0 ? void 0 : _a.has(post.cid)) {
                continue;
            }
            newBufferedFeeds[feedName].push(post);
            if (!bufferedFeedPostChanged &&
                (((_b = newBufferedFeeds[feedName][i]) === null || _b === void 0 ? void 0 : _b.cid) !== ((_c = bufferedFeeds[feedName][i]) === null || _c === void 0 ? void 0 : _c.cid) ||
                    (((_d = newBufferedFeeds[feedName][i]) === null || _d === void 0 ? void 0 : _d.updatedAt) || 0) > (((_e = bufferedFeeds[feedName][i]) === null || _e === void 0 ? void 0 : _e.updatedAt) || 0))) {
                bufferedFeedPostChanged = true;
            }
        }
        if (!bufferedFeedPostChanged && newBufferedFeeds[feedName].length === bufferedFeeds[feedName].length) {
            newBufferedFeeds[feedName] = bufferedFeeds[feedName];
        }
    }
    return newBufferedFeeds;
};
export const getUpdatedFeeds = (feedsOptions, filteredSortedFeeds, updatedFeeds, loadedFeeds, accounts) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c, _d;
    // contruct a list of posts already loaded to remove them from buffered feeds
    const updatedFeedsPosts = {};
    for (const feedName in updatedFeeds) {
        updatedFeedsPosts[feedName] = {};
        for (const [index, updatedPost] of updatedFeeds[feedName].entries()) {
            updatedFeedsPosts[feedName][updatedPost.cid] = { index, updatedPost };
        }
    }
    const newUpdatedFeeds = Object.assign({}, updatedFeeds);
    for (const feedName in filteredSortedFeeds) {
        const plebbit = (_c = accounts[(_b = feedsOptions[feedName]) === null || _b === void 0 ? void 0 : _b.accountId]) === null || _c === void 0 ? void 0 : _c.plebbit;
        const updatedFeed = [...(updatedFeeds[feedName] || [])];
        const onlyHasNewPosts = updatedFeed.length === 0;
        let updatedFeedChanged = false;
        // add new posts from loadedFeed posts
        while (updatedFeed.length < loadedFeeds[feedName].length) {
            updatedFeed[updatedFeed.length] = loadedFeeds[feedName][updatedFeed.length];
            updatedFeedChanged = true;
        }
        // add updated post from filteredSortedFeed
        if (!onlyHasNewPosts) {
            const promises = [];
            for (const post of filteredSortedFeeds[feedName]) {
                if ((_d = updatedFeedsPosts[feedName]) === null || _d === void 0 ? void 0 : _d[post.cid]) {
                    const { index, updatedPost } = updatedFeedsPosts[feedName][post.cid];
                    // faster to validate comments async
                    promises.push((() => __awaiter(void 0, void 0, void 0, function* () {
                        if ((post.updatedAt || 0) > (updatedPost.updatedAt || 0) && (yield commentIsValid(post, { validateReplies: false }, plebbit))) {
                            updatedFeed[index] = post;
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
// find with subplebbits have posts newer (or ranked higher) than the loaded feeds
// can be used to display "new posts in x, y, z subs" alert, like on twitter
export const getFeedsSubplebbitAddressesWithNewerPosts = (filteredSortedFeeds, loadedFeeds, previousFeedsSubplebbitAddressesWithNewerPosts) => {
    const feedsSubplebbitAddressesWithNewerPosts = {};
    for (const feedName in loadedFeeds) {
        const loadedFeed = loadedFeeds[feedName];
        const cidsInLoadedFeed = new Set();
        for (const post of loadedFeed) {
            cidsInLoadedFeed.add(post.cid);
        }
        const subplebbitAddressesWithNewerPostsSet = new Set();
        for (const [i, post] of filteredSortedFeeds[feedName].entries()) {
            if (i >= loadedFeed.length) {
                break;
            }
            // if any post in filteredSortedFeeds ranks higher than the loaded feed count, it's a newer post
            if (!cidsInLoadedFeed.has(post.cid)) {
                subplebbitAddressesWithNewerPostsSet.add(post.subplebbitAddress);
            }
        }
        const subplebbitAddressesWithNewerPosts = [...subplebbitAddressesWithNewerPostsSet];
        // don't update the array if the data is the same to avoid rerenders
        const previousSubplebbitAddressesWithNewerPosts = previousFeedsSubplebbitAddressesWithNewerPosts[feedName] || [];
        if (subplebbitAddressesWithNewerPosts.length === previousSubplebbitAddressesWithNewerPosts.length &&
            subplebbitAddressesWithNewerPosts.toString() === previousSubplebbitAddressesWithNewerPosts.toString()) {
            feedsSubplebbitAddressesWithNewerPosts[feedName] = previousFeedsSubplebbitAddressesWithNewerPosts[feedName];
        }
        else {
            feedsSubplebbitAddressesWithNewerPosts[feedName] = subplebbitAddressesWithNewerPosts;
        }
    }
    return feedsSubplebbitAddressesWithNewerPosts;
};
// find how many posts are left in each subplebbits in a buffereds feeds
export const getFeedsSubplebbitsPostCounts = (feedsOptions, feeds) => {
    const feedsSubplebbitsPostCounts = {};
    for (const feedName in feedsOptions) {
        feedsSubplebbitsPostCounts[feedName] = {};
        for (const subplebbitAddress of feedsOptions[feedName].subplebbitAddresses) {
            feedsSubplebbitsPostCounts[feedName][subplebbitAddress] = 0;
        }
        for (const comment of feeds[feedName] || []) {
            feedsSubplebbitsPostCounts[feedName][comment.subplebbitAddress]++;
        }
    }
    return feedsSubplebbitsPostCounts;
};
/**
 * Get which feeds have more posts, i.e. have not reached the final page of all subs
 */
export const getFeedsHaveMore = (feedsOptions, bufferedFeeds, subplebbits, subplebbitsPages, accounts) => {
    var _a, _b;
    const feedsHaveMore = {};
    feedsLoop: for (const feedName in feedsOptions) {
        // if the feed still has buffered posts, then it still has more
        if ((_a = bufferedFeeds[feedName]) === null || _a === void 0 ? void 0 : _a.length) {
            feedsHaveMore[feedName] = true;
            continue feedsLoop;
        }
        const { subplebbitAddresses, sortType, accountId } = feedsOptions[feedName];
        subplebbitAddressesLoop: for (const subplebbitAddress of subplebbitAddresses) {
            // don't consider the sub if the address is blocked
            if ((_b = accounts[accountId]) === null || _b === void 0 ? void 0 : _b.blockedAddresses[subplebbitAddress]) {
                continue subplebbitAddressesLoop;
            }
            const subplebbit = subplebbits[subplebbitAddress];
            // if at least 1 subplebbit hasn't loaded yet, then the feed still has more
            if (!(subplebbit === null || subplebbit === void 0 ? void 0 : subplebbit.updatedAt)) {
                feedsHaveMore[feedName] = true;
                continue feedsLoop;
            }
            // if at least 1 subplebbit has posts cache expired, then the feed still has more
            if (subplebbitPostsCacheExpired(subplebbit)) {
                feedsHaveMore[feedName] = true;
                continue feedsLoop;
            }
            const firstPageCid = getSubplebbitFirstPageCid(subplebbit, sortType);
            // TODO: if a loaded subplebbit doesn't have a first page, it's unclear what we should do
            // should we try to use another sort type by default, like 'hot', or should we just ignore it?
            // 'continue' to ignore it for now
            if (!firstPageCid) {
                continue subplebbitAddressesLoop;
            }
            const pages = getSubplebbitPages(subplebbit, sortType, subplebbitsPages);
            // if first page isn't loaded yet, then the feed still has more
            if (!pages.length) {
                feedsHaveMore[feedName] = true;
                continue feedsLoop;
            }
            const lastPage = pages[pages.length - 1];
            if (lastPage.nextCid) {
                feedsHaveMore[feedName] = true;
                continue feedsLoop;
            }
        }
        // if buffered feeds are empty and no last page of any subplebbit has a next page, then has more is false
        feedsHaveMore[feedName] = false;
    }
    return feedsHaveMore;
};
// get all subplebbits pages cids of all feeds, use to check if a subplebbitsStore change should trigger updateFeeds
export const getFeedsSubplebbits = (feedsOptions, subplebbits) => {
    // find all feeds subplebbits
    const feedsSubplebbitAddresses = new Set();
    Object.keys(feedsOptions).forEach((i) => feedsOptions[i].subplebbitAddresses.forEach((a) => feedsSubplebbitAddresses.add(a)));
    // use map for performance increase when checking size
    const feedsSubplebbits = new Map();
    for (const subplebbitAddress of feedsSubplebbitAddresses) {
        feedsSubplebbits.set(subplebbitAddress, subplebbits[subplebbitAddress]);
    }
    return feedsSubplebbits;
};
export const feedsSubplebbitsChanged = (previousFeedsSubplebbits, feedsSubplebbits) => {
    if (previousFeedsSubplebbits.size !== feedsSubplebbits.size) {
        return true;
    }
    for (let subplebbitAddress of previousFeedsSubplebbits.keys()) {
        // check if the object is still the same
        if (previousFeedsSubplebbits.get(subplebbitAddress) !== feedsSubplebbits.get(subplebbitAddress)) {
            return true;
        }
    }
    return false;
};
// get all subplebbits pages cids of all feeds, use to check if a subplebbitsStore change should trigger updateFeeds
export const getFeedsSubplebbitsFirstPageCids = (feedsSubplebbits) => {
    // find all the feeds subplebbits first page cids
    const feedsSubplebbitsFirstPageCids = new Set();
    for (const subplebbit of feedsSubplebbits.values()) {
        if (!(subplebbit === null || subplebbit === void 0 ? void 0 : subplebbit.posts)) {
            continue;
        }
        // check pages
        if (subplebbit.posts.pages) {
            for (const page of Object.values(subplebbit.posts.pages)) {
                if (page === null || page === void 0 ? void 0 : page.nextCid) {
                    feedsSubplebbitsFirstPageCids.add(page === null || page === void 0 ? void 0 : page.nextCid);
                }
            }
        }
        // check pageCids
        if (subplebbit.posts.pageCids) {
            for (const pageCid of Object.values(subplebbit.posts.pageCids)) {
                if (pageCid) {
                    feedsSubplebbitsFirstPageCids.add(pageCid);
                }
            }
        }
    }
    return [...feedsSubplebbitsFirstPageCids].sort();
};
// get all subplebbits posts pages first post updatedAts, use to check if a subplebbitsStore change should trigger updateFeeds
export const getFeedsSubplebbitsPostsPagesFirstUpdatedAts = (feedsSubplebbits) => {
    var _a, _b, _c;
    let feedsSubplebbitsPostsPagesFirstUpdatedAts = '';
    for (const subplebbit of feedsSubplebbits.values()) {
        for (const page of Object.values(((_a = subplebbit === null || subplebbit === void 0 ? void 0 : subplebbit.posts) === null || _a === void 0 ? void 0 : _a.pages) || {})) {
            if ((_c = (_b = page === null || page === void 0 ? void 0 : page.comments) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.updatedAt) {
                feedsSubplebbitsPostsPagesFirstUpdatedAts += page.comments[0].cid + page.comments[0].updatedAt;
            }
        }
    }
    return feedsSubplebbitsPostsPagesFirstUpdatedAts;
};
// get number of feeds subplebbit that are loaded
export const getFeedsSubplebbitsLoadedCount = (feedsSubplebbits) => {
    let count = 0;
    for (const subplebbit of feedsSubplebbits.values()) {
        if (subplebbit === null || subplebbit === void 0 ? void 0 : subplebbit.updatedAt) {
            count++;
        }
    }
    return count;
};
export const getAccountsBlockedAddresses = (accounts) => {
    const blockedAddressesSet = new Set();
    for (const { blockedAddresses } of Object.values(accounts)) {
        for (const address in blockedAddresses) {
            if (blockedAddresses[address]) {
                blockedAddressesSet.add(address);
            }
        }
    }
    return [...blockedAddressesSet].sort();
};
export const accountsBlockedAddressesChanged = (previousAccountsBlockedAddresses, accountsBlockedAddresses) => {
    if (previousAccountsBlockedAddresses.length !== accountsBlockedAddresses.length) {
        return true;
    }
    for (const i in previousAccountsBlockedAddresses) {
        // check if the object is still the same
        if (previousAccountsBlockedAddresses[i] !== accountsBlockedAddresses[i]) {
            return true;
        }
    }
    return false;
};
export const feedsHaveChangedBlockedAddresses = (feedsOptions, bufferedFeeds, blockedAddresses, previousBlockedAddresses) => {
    var _a;
    // find the difference between current and previous blocked addresses
    const changedBlockedAddresses = blockedAddresses
        .filter((x) => !previousBlockedAddresses.includes(x))
        .concat(previousBlockedAddresses.filter((x) => !blockedAddresses.includes(x)));
    // if changed blocked addresses arent used in the feeds, do nothing
    const feedsSubplebbitAddresses = new Set();
    Object.keys(feedsOptions).forEach((i) => feedsOptions[i].subplebbitAddresses.forEach((a) => feedsSubplebbitAddresses.add(a)));
    for (const address of changedBlockedAddresses) {
        // a changed address is used in the feed, update feeds
        if (feedsSubplebbitAddresses.has(address)) {
            return true;
        }
    }
    // feeds posts author addresses have a changed blocked address
    // NOTE: because of this, if an author address is unblocked, feeds won't update until some other event causes a feed update
    // it seems preferable to causing unnecessary rerenders every time an unused block event occurs
    const changedBlockedAddressesSet = new Set(changedBlockedAddresses);
    for (const feedName in bufferedFeeds) {
        for (const post of bufferedFeeds[feedName] || []) {
            if (((_a = post === null || post === void 0 ? void 0 : post.author) === null || _a === void 0 ? void 0 : _a.address) && changedBlockedAddressesSet.has(post.author.address)) {
                return true;
            }
        }
    }
    return false;
};
export const getAccountsBlockedCids = (accounts) => {
    const blockedCidsSet = new Set();
    for (const { blockedCids } of Object.values(accounts)) {
        for (const address in blockedCids) {
            if (blockedCids[address]) {
                blockedCidsSet.add(address);
            }
        }
    }
    return [...blockedCidsSet].sort();
};
export const accountsBlockedCidsChanged = (previousAccountsBlockedCids, accountsBlockedCids) => {
    if (previousAccountsBlockedCids.length !== accountsBlockedCids.length) {
        return true;
    }
    for (const i in previousAccountsBlockedCids) {
        // check if the object is still the same
        if (previousAccountsBlockedCids[i] !== accountsBlockedCids[i]) {
            return true;
        }
    }
    return false;
};
export const feedsHaveChangedBlockedCids = (feedsOptions, bufferedFeeds, blockedCids, previousBlockedCids) => {
    // find the difference between current and previous blocked addresses
    const changedBlockedCids = blockedCids.filter((x) => !previousBlockedCids.includes(x)).concat(previousBlockedCids.filter((x) => !blockedCids.includes(x)));
    // feeds posts author addresses have a changed blocked address
    // NOTE: because of this, if a cid is unblocked, feeds won't update until some other event causes a feed update
    // it seems preferable to causing unnecessary rerenders every time an unused block event occurs
    const changedBlockedCidsSet = new Set(changedBlockedCids);
    for (const feedName in bufferedFeeds) {
        for (const post of bufferedFeeds[feedName] || []) {
            if ((post === null || post === void 0 ? void 0 : post.cid) && changedBlockedCidsSet.has(post === null || post === void 0 ? void 0 : post.cid)) {
                return true;
            }
        }
    }
    return false;
};
