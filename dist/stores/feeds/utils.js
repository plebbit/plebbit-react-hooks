import { getSubplebbitPages, getSubplebbitFirstPageCid } from '../subplebbits-pages';
import feedSorter from './feed-sorter';
/**
 * Calculate the final buffered feeds from all the loaded subplebbit pages, sort them,
 * and remove the posts already loaded in loadedFeeds
 */
export const getBufferedFeeds = (feedsOptions, loadedFeeds, subplebbits, subplebbitsPages, accounts) => {
    var _a, _b, _c, _d, _e;
    // contruct a list of posts already loaded to remove them from buffered feeds
    const loadedFeedsPosts = {};
    for (const feedName in loadedFeeds) {
        loadedFeedsPosts[feedName] = new Set();
        for (const post of loadedFeeds[feedName]) {
            loadedFeedsPosts[feedName].add(post.cid);
        }
    }
    // calculate each feed
    let newBufferedFeeds = {};
    for (const feedName in feedsOptions) {
        const { subplebbitAddresses, sortType, accountId, filter } = feedsOptions[feedName];
        // find all fetched posts
        const bufferedFeedPosts = [];
        // add each comment from each page, do not filter at this stage, filter after sorting
        for (const subplebbitAddress of subplebbitAddresses) {
            // subplebbit hasn't loaded yet
            if (!subplebbits[subplebbitAddress]) {
                continue;
            }
            // use subplebbit preloaded posts if any
            const preloadedPosts = (_c = (_b = (_a = subplebbits[subplebbitAddress].posts) === null || _a === void 0 ? void 0 : _a.pages) === null || _b === void 0 ? void 0 : _b[sortType]) === null || _c === void 0 ? void 0 : _c.comments;
            if (preloadedPosts) {
                bufferedFeedPosts.push(...preloadedPosts);
            }
            // add all posts from subplebbit pages
            const subplebbitPages = getSubplebbitPages(subplebbits[subplebbitAddress], sortType, subplebbitsPages);
            for (const subplebbitPage of subplebbitPages) {
                if (subplebbitPage === null || subplebbitPage === void 0 ? void 0 : subplebbitPage.comments) {
                    bufferedFeedPosts.push(...subplebbitPage.comments);
                }
            }
        }
        // sort the feed before filtering to get more accurate results
        const sortedBufferedFeedPosts = feedSorter.sort(sortType, bufferedFeedPosts);
        // filter the feed
        const filteredSortedBufferedFeedPosts = [];
        for (const post of sortedBufferedFeedPosts) {
            // don't add posts already loaded in loaded feeds
            if ((_d = loadedFeedsPosts[feedName]) === null || _d === void 0 ? void 0 : _d.has(post.cid)) {
                continue;
            }
            // address is blocked
            if (accounts[accountId].blockedAddresses[post.subplebbitAddress] || (((_e = post.author) === null || _e === void 0 ? void 0 : _e.address) && accounts[accountId].blockedAddresses[post.author.address])) {
                continue;
            }
            // comment cid is blocked
            if (accounts[accountId].blockedCids[post.cid]) {
                continue;
            }
            // if a feed has more than 1 sub, don't include pinned posts
            // TODO: add test to check if pinned are filtered
            if (post.pinned && subplebbitAddresses.length > 1) {
                continue;
            }
            // feedOptions filter function
            if (filter && !filter(post)) {
                continue;
            }
            filteredSortedBufferedFeedPosts.push(post);
        }
        newBufferedFeeds[feedName] = filteredSortedBufferedFeedPosts;
    }
    return newBufferedFeeds;
};
export const getLoadedFeeds = (feedsOptions, loadedFeeds, bufferedFeeds) => {
    const loadedFeedsMissingPosts = {};
    for (const feedName in feedsOptions) {
        const { pageNumber, postsPerPage } = feedsOptions[feedName];
        const loadedFeedPostCount = pageNumber * postsPerPage;
        const currentLoadedFeed = loadedFeeds[feedName] || [];
        const missingPostsCount = loadedFeedPostCount - currentLoadedFeed.length;
        // get new posts from buffered feed
        const bufferedFeed = bufferedFeeds[feedName] || [];
        const missingPosts = [...bufferedFeed];
        if (missingPosts.length > missingPostsCount) {
            missingPosts.length = missingPostsCount;
        }
        // TODO: update posts in already loaded feeds with new votes and reply counts
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
};
export const getBufferedFeedsWithoutLoadedFeeds = (bufferedFeeds, loadedFeeds) => {
    var _a;
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
        for (const post of bufferedFeeds[feedName]) {
            if ((_a = loadedFeedsPosts[feedName]) === null || _a === void 0 ? void 0 : _a.has(post.cid)) {
                continue;
            }
            newBufferedFeeds[feedName].push(post);
        }
    }
    return newBufferedFeeds;
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
 * Get which feeds have more posts, i.e. have no reached the final page of all subs
 */
export const getFeedsHaveMore = (feedsOptions, bufferedFeeds, subplebbits, subplebbitsPages, accounts) => {
    var _a;
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
            if (accounts[accountId].blockedAddresses[subplebbitAddress]) {
                continue subplebbitAddressesLoop;
            }
            const subplebbit = subplebbits[subplebbitAddress];
            // if at least 1 subplebbit hasn't loaded yet, then the feed still has more
            if (!(subplebbit === null || subplebbit === void 0 ? void 0 : subplebbit.updatedAt)) {
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
// get a partial updateFeeds after a page increment
export const getFeedAfterIncrementPageNumber = (feedName, feedOptions, bufferedFeed, loadedFeed, subplebbits, subplebbitsPages, accounts) => {
    // transform arguments into objects
    const feedsOptions = { [feedName]: feedOptions };
    const bufferedFeedsWithLoadedFeeds = { [feedName]: bufferedFeed };
    const previousLoadedFeeds = { [feedName]: loadedFeed };
    // calculate values
    const loadedFeeds = getLoadedFeeds(feedsOptions, previousLoadedFeeds, bufferedFeedsWithLoadedFeeds);
    // after loaded feeds are caculated, remove loaded feeds again from buffered feeds
    const bufferedFeeds = getBufferedFeedsWithoutLoadedFeeds(bufferedFeedsWithLoadedFeeds, loadedFeeds);
    const bufferedFeedsSubplebbitsPostCounts = getFeedsSubplebbitsPostCounts(feedsOptions, bufferedFeeds);
    const feedsHaveMore = getFeedsHaveMore(feedsOptions, bufferedFeeds, subplebbits, subplebbitsPages, accounts);
    // transform values back into single properties
    return {
        bufferedFeed: bufferedFeeds[feedName],
        loadedFeed: loadedFeeds[feedName],
        bufferedFeedSubplebbitsPostCounts: bufferedFeedsSubplebbitsPostCounts[feedName],
        feedHasMore: feedsHaveMore[feedName],
    };
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
