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
import Debug from 'debug';
const debug = Debug('plebbit-react-hooks:stores:feeds');
import createStore from 'zustand';
import localForageLru from '../../lib/localforage-lru';
// reddit loads approximately 25 posts per page
// while infinite scrolling
const postsPerPage = 25;
// reset all event listeners in between tests
export const listeners = [];
const useFeedsStore = createStore((setState, getState) => ({
    feedsOptions: {},
    bufferedFeeds: {},
    loadedFeeds: {},
    addFeedToStore(feedName, subplebbitAddresses, sortType, account, isBufferedFeed) {
        return __awaiter(this, void 0, void 0, function* () {
            const { feedsOptions } = getState();
            // feed is in store already, do nothing
            // if the feed already exist but is at page 1, reset it to page 1
            if (feedsOptions[feedName] && feedsOptions[feedName].pageNumber !== 0) {
                return;
            }
            // to add a buffered feed, add a feed with pageNumber 0
            const feedOptions = { subplebbitAddresses, sortType, account, pageNumber: isBufferedFeed === true ? 0 : 1 };
            debug('feedsActions.addFeedToStore', feedOptions);
            setState(({ feedsOptions }) => {
                // make sure to never overwrite a feed already added
                if (feedsOptions[feedName]) {
                    return {};
                }
                return { feedsOptions: Object.assign(Object.assign({}, feedsOptions), { [feedName]: feedOptions }) };
            });
        });
    },
    incrementFeedPageNumber(feedName) {
        return __awaiter(this, void 0, void 0, function* () {
            const { feedsOptions, loadedFeeds } = getState();
            assert(feedsOptions[feedName], `feedsActions.incrementFeedPageNumber feed name '${feedName}' does not exist in feeds store`);
            debug('feedsActions.incrementFeedPageNumber', { feedName });
            assert(feedsOptions[feedName].pageNumber * postsPerPage <= loadedFeeds[feedName].length, `feedsActions.incrementFeedPageNumber cannot increment feed page number before current page has loaded`);
            setState(({ feedsOptions, loadedFeeds }) => {
                // don't increment page number before the current page has loaded
                if (feedsOptions[feedName].pageNumber * postsPerPage > loadedFeeds[feedName].length) {
                    return {};
                }
                const feedOptions = Object.assign(Object.assign({}, feedsOptions[feedName]), { pageNumber: feedsOptions[feedName].pageNumber + 1 });
                return { feedsOptions: Object.assign(Object.assign({}, feedsOptions), { [feedName]: feedOptions }) };
            });
        });
    },
}));
// reset store in between tests
const originalState = useFeedsStore.getState();
// async function because some stores have async init
export const resetFeedsStore = () => __awaiter(void 0, void 0, void 0, function* () {
    // remove all event listeners
    listeners.forEach((listener) => listener.removeAllListeners());
    // destroy all component subscriptions to the store
    useFeedsStore.destroy();
    // restore original state
    useFeedsStore.setState(originalState);
});
// reset database and store in between tests
export const resetFeedsDatabaseAndStore = () => __awaiter(void 0, void 0, void 0, function* () {
    yield localForageLru.createInstance({ name: 'subplebbitsPages' }).clear();
    yield resetFeedsStore();
});
export default useFeedsStore;
