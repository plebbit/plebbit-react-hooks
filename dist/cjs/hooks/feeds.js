"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useBufferedFeeds = exports.useFeed = void 0;
const react_1 = require("react");
const accounts_1 = require("./accounts");
const feeds_provider_1 = require("../providers/feeds-provider");
const validator_1 = __importDefault(require("../lib/validator"));
const debug_1 = __importDefault(require("debug"));
const debug = (0, debug_1.default)('plebbitreacthooks:hooks:feeds');
/**
 * @param subplebbitAddresses - The addresses of the subplebbits, e.g. ['memes.eth', 'Qm...']
 * @param sortType - The sorting algo for the feed: 'hot' | 'new' | 'topHour'| 'topDay' | 'topWeek' | 'topMonth' | 'topYear' | 'topAll'
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
function useFeed(subplebbitAddresses, sortType = 'hot', accountName) {
    validator_1.default.validateFeedSortType(sortType);
    const account = (0, accounts_1.useAccount)(accountName);
    const feedsContext = (0, react_1.useContext)(feeds_provider_1.FeedsContext);
    const [uniqueSubplebbitAddresses] = useUniqueSorted([subplebbitAddresses]);
    const [feedName] = useStringified([[account === null || account === void 0 ? void 0 : account.id, sortType, uniqueSubplebbitAddresses]]);
    const feed = feedName && feedsContext.loadedFeeds[feedName];
    (0, react_1.useEffect)(() => {
        if (!uniqueSubplebbitAddresses || !account) {
            return;
        }
        if (!feed) {
            // if feed isn't already in context, add it
            feedsContext.feedsActions.addFeedToContext(feedName, uniqueSubplebbitAddresses, sortType, account);
        }
    }, [feedName, uniqueSubplebbitAddresses, account]);
    let hasMore = feedName && feedsContext.feedsHaveMore[feedName];
    // if the feed is not yet defined, then it has more
    if (!feedName || typeof feedsContext.feedsHaveMore[feedName] !== 'boolean') {
        hasMore = true;
    }
    const loadMore = () => {
        if (!uniqueSubplebbitAddresses || !account) {
            return;
        }
        feedsContext.feedsActions.incrementFeedPageNumber(feedName);
    };
    debug('useFeed', { feed, hasMore });
    return { feed, hasMore, loadMore };
}
exports.useFeed = useFeed;
/**
 * Use useBufferedFeeds to buffer multiple feeds in the background so what when
 * they are called by useFeed later, they are already preloaded.
 *
 * @param feedOptions - The options of the feed
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
function useBufferedFeeds(feedsOptions = [], accountName) {
    const account = (0, accounts_1.useAccount)(accountName);
    const feedsContext = (0, react_1.useContext)(feeds_provider_1.FeedsContext);
    // do a bunch of calculations to get feedsOptionsFlattened and feedNames
    const subplebbitAddressesArrays = [];
    const sortTypes = [];
    for (const feedOptions of feedsOptions) {
        subplebbitAddressesArrays.push(feedOptions.subplebbitAddresses);
        sortTypes.push(feedOptions.sortType);
    }
    const uniqueSubplebbitAddressesArrays = useUniqueSorted(subplebbitAddressesArrays);
    const feedsOptionsFlattened = [];
    for (const i in feedsOptions) {
        feedsOptionsFlattened[i] = [account === null || account === void 0 ? void 0 : account.id, sortTypes[i] || 'hot', uniqueSubplebbitAddressesArrays[i]];
    }
    const feedNames = useStringified(feedsOptionsFlattened);
    // only give to the user the buffered feeds he requested
    const bufferedFeeds = [];
    for (const feedName of feedNames) {
        bufferedFeeds.push(feedsContext.bufferedFeeds[feedName || ''] || []);
    }
    (0, react_1.useEffect)(() => {
        for (const i in feedsOptionsFlattened) {
            const [accountId, sortType, uniqueSubplebbitAddresses] = feedsOptionsFlattened[Number(i)];
            validator_1.default.validateFeedSortType(sortType);
            const feedName = feedNames[Number(i)];
            if (!uniqueSubplebbitAddresses || !account) {
                return;
            }
            if (!feedsContext.bufferedFeeds[feedName || '']) {
                const isBufferedFeed = true;
                feedsContext.feedsActions.addFeedToContext(feedName, uniqueSubplebbitAddresses, sortType, account, isBufferedFeed);
            }
        }
    }, [feedNames]);
    debug('useBufferedFeeds', { bufferedFeeds });
    return bufferedFeeds;
}
exports.useBufferedFeeds = useBufferedFeeds;
/**
 * Util to find unique and sorted subplebbit addresses for multiple feed options
 */
function useUniqueSorted(stringsArrays) {
    return (0, react_1.useMemo)(() => {
        const uniqueSorted = [];
        for (const stringsArray of stringsArrays || []) {
            if (!stringsArray) {
                uniqueSorted.push(undefined);
            }
            else {
                uniqueSorted.push([...new Set(stringsArray.sort())]);
            }
        }
        return uniqueSorted;
    }, [stringsArrays]);
}
/**
 * Util to stringify multiple objects or return undefineds
 */
function useStringified(objs) {
    return (0, react_1.useMemo)(() => {
        const stringified = [];
        for (const obj of objs || []) {
            if (obj === undefined) {
                stringified.push(undefined);
            }
            else {
                stringified.push(JSON.stringify(obj));
            }
        }
        return stringified;
    }, [objs]);
}
