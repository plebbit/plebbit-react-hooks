var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useEffect, useMemo, useState } from 'react';
import { useAccount } from '../accounts';
import validator from '../../lib/validator';
import Logger from '@plebbit/plebbit-logger';
const log = Logger('plebbit-react-hooks:feeds:hooks');
import assert from 'assert';
import useFeedsStore from '../../stores/feeds';
import shallow from 'zustand/shallow';
/**
 * @param subplebbitAddresses - The addresses of the subplebbits, e.g. ['memes.eth', '12D3KooW...']
 * @param sortType - The sorting algo for the feed: 'hot' | 'new' | 'active' | 'topHour' | 'topDay' | 'topWeek' | 'topMonth' | 'topYear' | 'topAll' | 'controversialHour' | 'controversialDay' | 'controversialWeek' | 'controversialMonth' | 'controversialYear' | 'controversialAll'
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useFeed(options) {
    assert(!options || typeof options === 'object', `useFeed options argument '${options}' not an object`);
    let { subplebbitAddresses, sortType, accountName, postsPerPage, filter } = options || {};
    if (!sortType) {
        sortType = 'hot';
    }
    validator.validateUseFeedArguments(subplebbitAddresses, sortType, accountName);
    const account = useAccount({ accountName });
    const addFeedToStore = useFeedsStore((state) => state.addFeedToStore);
    const incrementFeedPageNumber = useFeedsStore((state) => state.incrementFeedPageNumber);
    const uniqueSubplebbitAddresses = useUniqueSorted(subplebbitAddresses);
    const feedName = useFeedName(account === null || account === void 0 ? void 0 : account.id, sortType, uniqueSubplebbitAddresses, postsPerPage, filter);
    const [errors, setErrors] = useState([]);
    // add feed to store
    useEffect(() => {
        if (!(uniqueSubplebbitAddresses === null || uniqueSubplebbitAddresses === void 0 ? void 0 : uniqueSubplebbitAddresses.length) || !account) {
            return;
        }
        const isBufferedFeed = false;
        addFeedToStore(feedName, uniqueSubplebbitAddresses, sortType, account, isBufferedFeed, postsPerPage, filter).catch((error) => log.error('useFeed addFeedToStore error', { feedName, error }));
    }, [feedName]);
    const feed = useFeedsStore((state) => state.loadedFeeds[feedName || '']);
    let hasMore = useFeedsStore((state) => state.feedsHaveMore[feedName || '']);
    // if the feed is not yet defined, then it has more
    if (!feedName || typeof hasMore !== 'boolean') {
        hasMore = true;
    }
    // if the feed is not yet defined, but no subplebbit addresses, doesn't have more
    if (!(subplebbitAddresses === null || subplebbitAddresses === void 0 ? void 0 : subplebbitAddresses.length)) {
        hasMore = false;
    }
    const loadMore = () => __awaiter(this, void 0, void 0, function* () {
        try {
            if (!uniqueSubplebbitAddresses || !account) {
                throw Error('useFeed cannot load more feed not initalized yet');
            }
            incrementFeedPageNumber(feedName);
        }
        catch (e) {
            // wait 100 ms so infinite scroll doesn't spam this function
            yield new Promise((r) => setTimeout(r, 50));
            setErrors([...errors, e]);
        }
    });
    if (account && (subplebbitAddresses === null || subplebbitAddresses === void 0 ? void 0 : subplebbitAddresses.length)) {
        log('useFeed', {
            feedLength: (feed === null || feed === void 0 ? void 0 : feed.length) || 0,
            hasMore,
            subplebbitAddresses,
            sortType,
            account,
            feedsStoreOptions: useFeedsStore.getState().feedsOptions,
            feedsStore: useFeedsStore.getState(),
        });
    }
    const state = !hasMore ? 'succeeded' : 'fetching-ipns';
    return useMemo(() => ({
        feed: feed || [],
        hasMore,
        loadMore,
        state,
        error: errors[errors.length - 1],
        errors,
    }), [feed, feedName, hasMore, errors]);
}
/**
 * Use useBufferedFeeds to buffer multiple feeds in the background so what when
 * they are called by useFeed later, they are already preloaded.
 *
 * @param feedOptions - The options of the feed
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useBufferedFeeds(options) {
    assert(!options || typeof options === 'object', `useBufferedFeeds options argument '${options}' not an object`);
    const { feedsOptions, accountName } = options || {};
    validator.validateUseBufferedFeedsArguments(feedsOptions, accountName);
    const account = useAccount({ accountName });
    const addFeedToStore = useFeedsStore((state) => state.addFeedToStore);
    // do a bunch of calculations to get feedsOptionsFlattened and feedNames
    const { subplebbitAddressesArrays, sortTypes, postsPerPages, filters } = useMemo(() => {
        const subplebbitAddressesArrays = [];
        const sortTypes = [];
        const postsPerPages = [];
        const filters = [];
        for (const feedOptions of feedsOptions || []) {
            subplebbitAddressesArrays.push(feedOptions.subplebbitAddresses || []);
            sortTypes.push(feedOptions.sortType);
            postsPerPages.push(feedOptions.postsPerPage);
            filters.push(feedOptions.filter);
        }
        return { subplebbitAddressesArrays, sortTypes, postsPerPages, filters };
    }, [feedsOptions]);
    const uniqueSubplebbitAddressesArrays = useUniqueSortedArrays(subplebbitAddressesArrays);
    const feedNames = useFeedNames(account === null || account === void 0 ? void 0 : account.id, sortTypes, uniqueSubplebbitAddressesArrays, postsPerPages, filters);
    const bufferedFeeds = useFeedsStore((state) => {
        const bufferedFeeds = {};
        for (const feedName of feedNames) {
            if (!feedName) {
                continue;
            }
            bufferedFeeds[feedName] = state.bufferedFeeds[feedName];
        }
        return bufferedFeeds;
    }, shallow);
    // add feed to store
    useEffect(() => {
        for (const [i] of uniqueSubplebbitAddressesArrays.entries()) {
            const sortType = sortTypes[i] || 'hot';
            const uniqueSubplebbitAddresses = uniqueSubplebbitAddressesArrays[i];
            validator.validateFeedSortType(sortType);
            const feedName = feedNames[i];
            if (!uniqueSubplebbitAddresses || !account) {
                return;
            }
            if (!bufferedFeeds[feedName || '']) {
                const isBufferedFeed = true;
                addFeedToStore(feedName, uniqueSubplebbitAddresses, sortType, account, isBufferedFeed).catch((error) => log.error('useBufferedFeeds addFeedToStore error', { feedName, error }));
            }
        }
    }, [feedNames]);
    // only give to the user the buffered feeds he requested
    const bufferedFeedsArray = useMemo(() => {
        const bufferedFeedsArray = [];
        for (const feedName of feedNames) {
            bufferedFeedsArray.push(bufferedFeeds[feedName || ''] || []);
        }
        return bufferedFeedsArray;
    }, [bufferedFeeds, feedNames]);
    if (account && (feedsOptions === null || feedsOptions === void 0 ? void 0 : feedsOptions.length)) {
        log('useBufferedFeeds', {
            bufferedFeeds,
            feedsOptions,
            account,
            accountName,
            feedsStoreOptions: useFeedsStore.getState().feedsOptions,
            feedsStore: useFeedsStore.getState(),
        });
    }
    const state = 'fetching-ipns';
    return useMemo(() => ({
        bufferedFeeds: bufferedFeedsArray,
        state,
        error: undefined,
        errors: [],
    }), [bufferedFeedsArray, feedsOptions]);
}
/**
 * Util to find unique and sorted subplebbit addresses for multiple feed options
 */
function useUniqueSortedArrays(stringsArrays) {
    return useMemo(() => {
        const uniqueSorted = [];
        for (const stringsArray of stringsArrays || []) {
            uniqueSorted.push([...new Set(stringsArray.sort())]);
        }
        return uniqueSorted;
    }, [stringsArrays]);
}
function useUniqueSorted(stringsArray) {
    return useMemo(() => {
        if (!stringsArray) {
            return [];
        }
        return [...new Set(stringsArray.sort())];
    }, [stringsArray]);
}
// filters are functions so they can't be stringified
const filterNumbers = new WeakMap();
let filterCount = 0;
const getFilterName = (filter) => {
    let filterNumber = filterNumbers.get(filter);
    if (!filterNumber) {
        filterCount++;
        filterNumbers.set(filter, filterCount);
        filterNumber = filterCount;
    }
    return `filter${filterNumber}`;
};
function useFeedName(accountId, sortType, uniqueSubplebbitAddresses, postsPerPage, filter) {
    return useMemo(() => {
        const filterName = filter ? getFilterName(filter) : undefined;
        return accountId + '-' + sortType + '-' + uniqueSubplebbitAddresses + '-' + postsPerPage + '-' + filterName;
    }, [accountId, sortType, uniqueSubplebbitAddresses, postsPerPage, filter]);
}
function useFeedNames(accountId, sortTypes, uniqueSubplebbitAddressesArrays, postsPerPages, filters) {
    return useMemo(() => {
        const feedNames = [];
        for (const [i] of sortTypes.entries()) {
            // @ts-ignore
            const filterName = filters[i] ? getFilterName(filters[i]) : undefined;
            feedNames.push(accountId + '-' + (sortTypes[i] || 'hot') + '-' + uniqueSubplebbitAddressesArrays[i] + '-' + postsPerPages[i] + '-' + filterName);
        }
        return feedNames;
    }, [accountId, sortTypes, uniqueSubplebbitAddressesArrays, postsPerPages, filters]);
}
