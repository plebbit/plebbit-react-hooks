"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_hooks_1 = require("@testing-library/react-hooks");
const test_utils_1 = __importDefault(require("../lib/test-utils"));
const index_1 = require("../index");
const plebbit_provider_1 = __importDefault(require("../providers/plebbit-provider"));
const localforage_lru_1 = __importDefault(require("../lib/localforage-lru"));
const localforage_1 = __importDefault(require("localforage"));
const plebbit_js_mock_1 = __importStar(require("../lib/plebbit-js/plebbit-js-mock"));
(0, plebbit_js_mock_1.mockPlebbitJs)(plebbit_js_mock_1.default);
const deleteDatabases = () => Promise.all([
    localforage_1.default.createInstance({ name: 'accountsMetadata' }).clear(),
    localforage_1.default.createInstance({ name: 'accounts' }).clear(),
    localforage_lru_1.default.createInstance({ name: 'subplebbits' }).clear(),
    localforage_lru_1.default.createInstance({ name: 'comments' }).clear()
]);
describe('feeds', () => {
    beforeAll(() => {
        // some feeds tests are flaky
        // jest.retryTimes(5)
        test_utils_1.default.silenceUpdateUnmountedComponentWarning();
    });
    afterAll(() => {
        // jest.retryTimes(0)
        test_utils_1.default.restoreAll();
    });
    describe('get feed', () => {
        // reddit infinite scrolling posts per pages are 25
        const postsPerPage = 25;
        let rendered;
        const scrollOnePage = () => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const nextFeedLength = (((_a = rendered.result.current.feed) === null || _a === void 0 ? void 0 : _a.length) || 0) + postsPerPage;
            (0, react_hooks_1.act)(() => { rendered.result.current.loadMore(); });
            try {
                yield rendered.waitFor(() => { var _a; return ((_a = rendered.result.current.feed) === null || _a === void 0 ? void 0 : _a.length) >= nextFeedLength; });
            }
            catch (e) {
                console.error('scrollOnePage failed:', e);
            }
        });
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            // @ts-ignore
            rendered = (0, react_hooks_1.renderHook)((props) => (0, index_1.useFeed)(props === null || props === void 0 ? void 0 : props.subplebbitAddresses, props === null || props === void 0 ? void 0 : props.sortType, props === null || props === void 0 ? void 0 : props.accountName), { wrapper: plebbit_provider_1.default });
            // wait for account to init
            try {
                yield rendered.waitForNextUpdate();
            }
            catch (e) {
                console.error('feeds: get feed: beforeEach: rendered.waitForNextUpdate() failed:', e);
            }
        }));
        afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
            yield deleteDatabases();
        }));
        test('get feed with no arguments', () => __awaiter(void 0, void 0, void 0, function* () {
            expect(rendered.result.current.feed).toBe(undefined);
            expect(typeof rendered.result.current.hasMore).toBe('boolean');
            expect(typeof rendered.result.current.loadMore).toBe('function');
        }));
        test('get feed page 1 with 1 subplebbit sorted by default (hot)', () => __awaiter(void 0, void 0, void 0, function* () {
            // get feed with 1 sub
            rendered.rerender({ subplebbitAddresses: ['subplebbit address 1'] });
            // initial state
            expect(typeof rendered.result.current.hasMore).toBe('boolean');
            expect(typeof rendered.result.current.loadMore).toBe('function');
            // wait for feed array to render
            try {
                yield rendered.waitFor(() => Array.isArray(rendered.result.current.feed));
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered.result.current.feed).toEqual([]);
            // wait for posts to be added, should get full first page
            try {
                yield rendered.waitFor(() => rendered.result.current.feed.length > 0);
            }
            catch (e) {
                console.error(e);
            }
            // NOTE: the 'hot' sort type uses timestamps and bugs out with timestamp '1-100' so this is why we get cid 1
            // with low upvote count first
            expect(rendered.result.current.feed[0].cid).toBe('subplebbit address 1 sorted posts cid hot comment cid 1');
            expect(rendered.result.current.feed.length).toBe(postsPerPage);
            // get feed again from database, only wait for 1 render because subplebbit is stored in db
            const rendered2 = (0, react_hooks_1.renderHook)(() => (0, index_1.useFeed)(['subplebbit address 1']), { wrapper: plebbit_provider_1.default });
            expect(rendered2.result.current.feed).toBe(undefined);
            // only wait for 1 render because subplebbit is stored in db
            try {
                yield rendered2.waitForNextUpdate();
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered.result.current.feed[0].cid).toBe('subplebbit address 1 sorted posts cid hot comment cid 1');
            expect(rendered.result.current.feed.length).toBe(postsPerPage);
        }));
        test('get feed with 1 subplebbit and scroll to multiple pages', () => __awaiter(void 0, void 0, void 0, function* () {
            // get feed with 1 sub
            rendered.rerender({ subplebbitAddresses: ['subplebbit address 1'] });
            // wait for posts to be added, should get full first page
            try {
                yield rendered.waitFor(() => rendered.result.current.feed.length > 0);
            }
            catch (e) {
                console.error(e);
            }
            let pages = 20;
            let currentPage = 1;
            while (currentPage++ < pages) {
                // load 25 more posts
                (0, react_hooks_1.act)(() => { rendered.result.current.loadMore(); });
                try {
                    yield rendered.waitFor(() => { var _a; return ((_a = rendered.result.current.feed) === null || _a === void 0 ? void 0 : _a.length) >= postsPerPage * currentPage; });
                }
                catch (e) {
                    console.error(e);
                }
                expect(rendered.result.current.feed.length).toBe(postsPerPage * currentPage);
            }
        }));
        test('get feed with 1 subplebbit sorted by new and scroll to multiple pages', () => __awaiter(void 0, void 0, void 0, function* () {
            let getSortedPostsCalledTimes = 0;
            const getSortedPosts = plebbit_js_mock_1.Subplebbit.prototype.getSortedPosts;
            plebbit_js_mock_1.Subplebbit.prototype.getSortedPosts = function (sortedPostsCid) {
                return __awaiter(this, void 0, void 0, function* () {
                    // without the extra simulated load time the hooks will fetch multiple pages in advance instead of just 1
                    yield (0, plebbit_js_mock_1.simulateLoadingTime)();
                    const sortedComments = {
                        nextSortedCommentsCid: this.address + ' next sorted comments cid ' + (getSortedPostsCalledTimes + 1),
                        comments: []
                    };
                    const postCount = 100;
                    let index = 0;
                    let commentStartIndex = getSortedPostsCalledTimes * postCount;
                    while (index++ < postCount) {
                        sortedComments.comments.push({
                            timestamp: commentStartIndex + index,
                            cid: sortedPostsCid + ' comment cid ' + (commentStartIndex + index),
                            subplebbitAddress: this.address
                        });
                    }
                    getSortedPostsCalledTimes++;
                    return sortedComments;
                });
            };
            // get feed with 1 sub sorted by new page 1
            rendered.rerender({ subplebbitAddresses: ['subplebbit address 1'], sortType: 'new' });
            try {
                yield rendered.waitFor(() => { var _a; return ((_a = rendered.result.current.feed) === null || _a === void 0 ? void 0 : _a.length) >= postsPerPage; });
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered.result.current.feed[0].timestamp).toBe(100);
            expect(rendered.result.current.feed[1].timestamp).toBe(99);
            expect(rendered.result.current.feed[2].timestamp).toBe(98);
            expect(rendered.result.current.feed[0].cid).toBe('subplebbit address 1 sorted posts cid new comment cid 100');
            expect(rendered.result.current.feed[1].cid).toBe('subplebbit address 1 sorted posts cid new comment cid 99');
            expect(rendered.result.current.feed[2].cid).toBe('subplebbit address 1 sorted posts cid new comment cid 98');
            // at this point the buffered feed has gotten 1 subplebbit page 
            expect(getSortedPostsCalledTimes).toBe(1);
            // get page 2
            yield scrollOnePage();
            expect(rendered.result.current.feed[postsPerPage].timestamp).toBe(75);
            expect(rendered.result.current.feed[postsPerPage].cid).toBe('subplebbit address 1 sorted posts cid new comment cid 75');
            // ad this point the buffered feed is length 50, we can wait for getSortedPosts to be called again
            // refill the buffer
            try {
                yield rendered.waitFor(() => getSortedPostsCalledTimes === 2);
            }
            catch (e) {
                console.error(e);
            }
            expect(getSortedPostsCalledTimes).toBe(2);
            // get page 3 and 4, it should show new posts from the recalculated buffer
            yield scrollOnePage();
            expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].timestamp).toBe(200);
            expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].cid).toBe('subplebbit address 1 next sorted comments cid 1 comment cid 200');
            yield scrollOnePage();
            expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].timestamp).toBe(175);
            expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].cid).toBe('subplebbit address 1 next sorted comments cid 1 comment cid 175');
            // scroll 2 more times to get to buffered feeds length 50 and trigger a new buffer refill
            yield scrollOnePage();
            yield scrollOnePage();
            try {
                yield rendered.waitFor(() => getSortedPostsCalledTimes === 3);
            }
            catch (e) {
                console.error(e);
            }
            expect(getSortedPostsCalledTimes).toBe(3);
            // next pages should have recalculated buffered feed that starts at 300
            yield scrollOnePage();
            expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].timestamp).toBe(300);
            expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].cid).toBe('subplebbit address 1 next sorted comments cid 2 comment cid 300');
            yield scrollOnePage();
            expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].timestamp).toBe(275);
            expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].cid).toBe('subplebbit address 1 next sorted comments cid 2 comment cid 275');
            // restore mock
            plebbit_js_mock_1.Subplebbit.prototype.getSortedPosts = getSortedPosts;
        }));
        test('get multiple subplebbits sorted by new and scroll to multiple pages', () => __awaiter(void 0, void 0, void 0, function* () {
            const getSortedPostsCalledTimes = {
                'subplebbit address 1': 0, 'subplebbit address 2': 0, 'subplebbit address 3': 0
            };
            const getSortedPosts = plebbit_js_mock_1.Subplebbit.prototype.getSortedPosts;
            plebbit_js_mock_1.Subplebbit.prototype.getSortedPosts = function (sortedPostsCid) {
                return __awaiter(this, void 0, void 0, function* () {
                    // without the extra simulated load time the hooks will fetch multiple pages in advance instead of just 1
                    yield (0, plebbit_js_mock_1.simulateLoadingTime)();
                    yield (0, plebbit_js_mock_1.simulateLoadingTime)();
                    const sortedComments = {
                        // @ts-ignore
                        nextSortedCommentsCid: this.address + ' next sorted comments cid ' + (getSortedPostsCalledTimes[this.address] + 1),
                        comments: []
                    };
                    const postCount = 100;
                    let index = 0;
                    // @ts-ignore
                    let commentStartIndex = getSortedPostsCalledTimes[this.address] * postCount;
                    while (index++ < postCount) {
                        sortedComments.comments.push({
                            timestamp: commentStartIndex + index,
                            cid: sortedPostsCid + ' comment cid ' + (commentStartIndex + index),
                            subplebbitAddress: this.address
                        });
                    }
                    // @ts-ignore
                    getSortedPostsCalledTimes[this.address]++;
                    return sortedComments;
                });
            };
            // get feed with 3 sub sorted by new page 1
            // the first page will only have posts from the very first sub fetched, sub 1
            rendered.rerender({ subplebbitAddresses: ['subplebbit address 1', 'subplebbit address 2', 'subplebbit address 3'], sortType: 'new' });
            try {
                yield rendered.waitFor(() => { var _a; return ((_a = rendered.result.current.feed) === null || _a === void 0 ? void 0 : _a.length) >= postsPerPage; });
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered.result.current.feed.length).toBe(postsPerPage);
            expect(rendered.result.current.feed[0].timestamp).toBe(100);
            expect(rendered.result.current.feed[1].timestamp).toBe(99);
            expect(rendered.result.current.feed[2].timestamp).toBe(98);
            expect(rendered.result.current.feed[0].cid).toBe('subplebbit address 1 sorted posts cid new comment cid 100');
            expect(rendered.result.current.feed[1].cid).toBe('subplebbit address 1 sorted posts cid new comment cid 99');
            expect(rendered.result.current.feed[2].cid).toBe('subplebbit address 1 sorted posts cid new comment cid 98');
            // at this point the buffered feed has gotten page 1 from all subs
            try {
                yield rendered.waitFor(() => getSortedPostsCalledTimes['subplebbit address 1'] === 1
                    && getSortedPostsCalledTimes['subplebbit address 2'] === 1
                    && getSortedPostsCalledTimes['subplebbit address 3'] === 1);
            }
            catch (e) {
                console.error(e);
            }
            expect(getSortedPostsCalledTimes['subplebbit address 1']).toBe(1);
            expect(getSortedPostsCalledTimes['subplebbit address 2']).toBe(1);
            expect(getSortedPostsCalledTimes['subplebbit address 3']).toBe(1);
            // get page 2, the first posts of page 2 should be sub 1 and 2's cid 100
            yield scrollOnePage();
            expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].timestamp).toBe(100);
            expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage + 1].timestamp).toBe(100);
            expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].cid).toBe('subplebbit address 2 sorted posts cid new comment cid 100');
            expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage + 1].cid).toBe('subplebbit address 3 sorted posts cid new comment cid 100');
            // scroll until the next buffered feed that needs to be refilled
            yield scrollOnePage();
            yield scrollOnePage();
            yield scrollOnePage();
            yield scrollOnePage();
            // at this point the buffered feed has gotten page 2 from all subs
            try {
                yield rendered.waitFor(() => getSortedPostsCalledTimes['subplebbit address 1'] === 2
                    && getSortedPostsCalledTimes['subplebbit address 2'] === 2
                    && getSortedPostsCalledTimes['subplebbit address 3'] === 2);
            }
            catch (e) {
                console.error(e);
            }
            expect(getSortedPostsCalledTimes['subplebbit address 1']).toBe(2);
            expect(getSortedPostsCalledTimes['subplebbit address 2']).toBe(2);
            expect(getSortedPostsCalledTimes['subplebbit address 3']).toBe(2);
            // get next page, the first posts should all be cids 200 from the buffered feed
            yield scrollOnePage();
            expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].timestamp).toBe(200);
            expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage + 1].timestamp).toBe(200);
            expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage + 2].timestamp).toBe(200);
            expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage].cid).toBe('subplebbit address 1 next sorted comments cid 1 comment cid 200');
            expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage + 1].cid).toBe('subplebbit address 2 next sorted comments cid 1 comment cid 200');
            expect(rendered.result.current.feed[rendered.result.current.feed.length - postsPerPage + 2].cid).toBe('subplebbit address 3 next sorted comments cid 1 comment cid 200');
            // restore mock
            plebbit_js_mock_1.Subplebbit.prototype.getSortedPosts = getSortedPosts;
        }));
        // getting feeds with multiple subs in them sometimes gets them in the wrong order because
        // of react renders concurrency so retry a few times if it fails
        describe('retry on fail', () => {
            beforeAll(() => { jest.retryTimes(3); });
            afterAll(() => { jest.retryTimes(0); });
            test('get feed page 1 and 2 with multiple subplebbits sorted by topAll', () => __awaiter(void 0, void 0, void 0, function* () {
                // use buffered feeds to be able to wait until the buffered feeds have updated before loading page 2
                rendered = (0, react_hooks_1.renderHook)((props) => {
                    const feed = (0, index_1.useFeed)(props === null || props === void 0 ? void 0 : props.subplebbitAddresses, props === null || props === void 0 ? void 0 : props.sortType, props === null || props === void 0 ? void 0 : props.accountName);
                    const bufferedFeeds = (0, index_1.useBufferedFeeds)([{ subplebbitAddresses: props === null || props === void 0 ? void 0 : props.subplebbitAddresses, sortType: props === null || props === void 0 ? void 0 : props.sortType }], props === null || props === void 0 ? void 0 : props.accountName);
                    return Object.assign(Object.assign({}, feed), { bufferedFeed: bufferedFeeds[0] });
                }, { wrapper: plebbit_provider_1.default });
                // get feed with 1 sub
                rendered.rerender({ subplebbitAddresses: ['subplebbit address 1', 'subplebbit address 2', 'subplebbit address 3'], sortType: 'topAll' });
                // initial state
                expect(typeof rendered.result.current.hasMore).toBe('boolean');
                expect(typeof rendered.result.current.loadMore).toBe('function');
                // wait for feed array to render
                try {
                    yield rendered.waitFor(() => Array.isArray(rendered.result.current.feed));
                }
                catch (e) {
                    console.error(e);
                }
                expect(rendered.result.current.feed).toEqual([]);
                // wait for posts to be added, should get full first page
                // the first page should only have subplebbit 1 since it loads immediately after loading 1 sub
                try {
                    yield rendered.waitFor(() => rendered.result.current.feed.length > 0);
                }
                catch (e) {
                    console.error(e);
                }
                expect(rendered.result.current.feed.length).toBe(postsPerPage);
                expect(rendered.result.current.feed[0].cid).toBe('subplebbit address 1 sorted posts cid topAll comment cid 100');
                expect(rendered.result.current.feed[1].cid).toBe('subplebbit address 1 sorted posts cid topAll comment cid 99');
                expect(rendered.result.current.feed[2].cid).toBe('subplebbit address 1 sorted posts cid topAll comment cid 98');
                expect(rendered.result.current.feed[0].upvoteCount).toBe(100);
                expect(rendered.result.current.feed[1].upvoteCount).toBe(99);
                expect(rendered.result.current.feed[2].upvoteCount).toBe(98);
                // wait until buffered feeds have sub 2 and 3 loaded
                let bufferedFeedString;
                try {
                    yield rendered.waitFor(() => {
                        bufferedFeedString = JSON.stringify(rendered.result.current.bufferedFeed);
                        return Boolean(bufferedFeedString.match('subplebbit address 2') && bufferedFeedString.match('subplebbit address 3'));
                    });
                }
                catch (e) {
                    console.error(e);
                }
                expect(bufferedFeedString).toMatch('subplebbit address 2');
                expect(bufferedFeedString).toMatch('subplebbit address 3');
                // the second page first posts should be sub 2 and 3 with the highest upvotes
                yield scrollOnePage();
                expect(rendered.result.current.feed[postsPerPage].cid).toMatch(/subplebbit address (2|3) sorted posts cid topAll comment cid 100/);
                expect(rendered.result.current.feed[postsPerPage + 1].cid).toMatch(/subplebbit address (2|3) sorted posts cid topAll comment cid 100/);
                expect(rendered.result.current.feed[postsPerPage].upvoteCount).toBe(100);
                expect(rendered.result.current.feed[postsPerPage + 1].upvoteCount).toBe(100);
            }));
        });
        test(`useBufferedFeeds can fetch multiple subs in the background before delivering the first page`, () => __awaiter(void 0, void 0, void 0, function* () {
            const rendered = (0, react_hooks_1.renderHook)(() => (0, index_1.useBufferedFeeds)([
                { subplebbitAddresses: ['subplebbit address 1', 'subplebbit address 2', 'subplebbit address 3'], sortType: 'new' },
                { subplebbitAddresses: ['subplebbit address 4', 'subplebbit address 5', 'subplebbit address 6'], sortType: 'topAll' },
                { subplebbitAddresses: ['subplebbit address 7', 'subplebbit address 8', 'subplebbit address 9'] }
            ]), { wrapper: plebbit_provider_1.default });
            // should get empty arrays after 1 render
            try {
                yield rendered.waitForNextUpdate();
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered.result.current).toEqual([[], [], []]);
            // should eventually buffer posts for all feeds
            try {
                yield rendered.waitFor(() => rendered.result.current[0].length > 299
                    && rendered.result.current[1].length > 299
                    && rendered.result.current[2].length > 299);
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered.result.current[0].length).toBeGreaterThan(299);
            expect(rendered.result.current[1].length).toBeGreaterThan(299);
            expect(rendered.result.current[2].length).toBeGreaterThan(299);
        }));
        test('get feed using a different account', () => __awaiter(void 0, void 0, void 0, function* () {
            rendered = (0, react_hooks_1.renderHook)((props) => {
                const feed = (0, index_1.useFeed)(props === null || props === void 0 ? void 0 : props.subplebbitAddresses, props === null || props === void 0 ? void 0 : props.sortType, props === null || props === void 0 ? void 0 : props.accountName);
                const { createAccount } = (0, index_1.useAccountsActions)();
                return Object.assign(Object.assign({}, feed), { createAccount });
            }, { wrapper: plebbit_provider_1.default });
            // wait for createAccount to render
            expect(rendered.result.current.createAccount).toBe(undefined);
            try {
                yield rendered.waitForNextUpdate();
            }
            catch (e) {
                console.error(e);
            }
            expect(typeof rendered.result.current.createAccount).toBe('function');
            // create account
            yield (0, react_hooks_1.act)(() => __awaiter(void 0, void 0, void 0, function* () {
                yield rendered.result.current.createAccount('custom name');
            }));
            rendered.rerender({ subplebbitAddresses: ['subplebbit address 1'], sortType: 'new', accountName: 'custom name' });
            expect(typeof rendered.result.current.hasMore).toBe('boolean');
            expect(typeof rendered.result.current.loadMore).toBe('function');
            // wait for feed array to render
            try {
                yield rendered.waitFor(() => Array.isArray(rendered.result.current.feed));
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered.result.current.feed).toEqual([]);
            // wait for posts to be added, should get full first page
            try {
                yield rendered.waitFor(() => rendered.result.current.feed.length > 0);
            }
            catch (e) {
                console.error(e);
            }
            expect(typeof rendered.result.current.feed[0].cid).toBe('string');
            expect(rendered.result.current.feed.length).toBe(postsPerPage);
        }));
        test(`fail to get feed sorted by sort type that doesn't exist`, () => __awaiter(void 0, void 0, void 0, function* () {
            var _b, _c;
            rendered.rerender({ subplebbitAddresses: ['subplebbit address 1', 'subplebbit address 2', 'subplebbit address 3'], sortType: `doesnt exist` });
            expect((_b = rendered.result.error) === null || _b === void 0 ? void 0 : _b.message).toMatch(`invalid feed sort type 'doesnt exist'`);
            // one of the buffered feed has a sort type that doesn't exist
            rendered = (0, react_hooks_1.renderHook)(() => (0, index_1.useBufferedFeeds)([
                { subplebbitAddresses: ['subplebbit address 1', 'subplebbit address 2', 'subplebbit address 3'], sortType: 'new' },
                { subplebbitAddresses: ['subplebbit address 4', 'subplebbit address 5', 'subplebbit address 6'], sortType: `doesnt exist` },
                { subplebbitAddresses: ['subplebbit address 7', 'subplebbit address 8', 'subplebbit address 9'] }
            ]), { wrapper: plebbit_provider_1.default });
            try {
                yield rendered.waitForNextUpdate();
            }
            catch (e) {
                console.error(e);
            }
            expect((_c = rendered.result.error) === null || _c === void 0 ? void 0 : _c.message).toMatch(`invalid feed sort type 'doesnt exist'`);
        }));
        describe('getSortedPosts only has 1 page', () => {
            const getSortedPosts = plebbit_js_mock_1.Subplebbit.prototype.getSortedPosts;
            beforeEach(() => {
                // mock getSortedPosts to only give 1 or 2 pages
                plebbit_js_mock_1.Subplebbit.prototype.getSortedPosts = function (sortedPostsCid) {
                    return __awaiter(this, void 0, void 0, function* () {
                        // without the extra simulated load time the hooks will fetch multiple pages in advance instead of just 1
                        yield (0, plebbit_js_mock_1.simulateLoadingTime)();
                        yield (0, plebbit_js_mock_1.simulateLoadingTime)();
                        const sortedComments = { nextSortedCommentsCid: null, comments: [] };
                        const postCount = 100;
                        let index = 0;
                        while (index++ < postCount) {
                            sortedComments.comments.push({ timestamp: index, cid: sortedPostsCid + ' comment cid ' + index, subplebbitAddress: this.address });
                        }
                        return sortedComments;
                    });
                };
            });
            afterEach(() => {
                plebbit_js_mock_1.Subplebbit.prototype.getSortedPosts = getSortedPosts;
            });
            test(`1 subplebbit, scroll to end of feed, hasMore becomes false`, () => __awaiter(void 0, void 0, void 0, function* () {
                rendered.rerender({ subplebbitAddresses: ['subplebbit address 1'], sortType: 'new' });
                // hasMore should be true before the feed is loaded
                expect(rendered.result.current.hasMore).toBe(true);
                expect(typeof rendered.result.current.loadMore).toBe('function');
                // wait for feed array to render
                try {
                    yield rendered.waitFor(() => Array.isArray(rendered.result.current.feed));
                }
                catch (e) {
                    console.error(e);
                }
                expect(rendered.result.current.feed).toEqual([]);
                // hasMore should be true before the feed is loaded
                expect(rendered.result.current.hasMore).toBe(true);
                try {
                    yield rendered.waitFor(() => rendered.result.current.feed.length > 0);
                }
                catch (e) {
                    console.error(e);
                }
                // hasMore should be true because there are still buffered feeds
                expect(rendered.result.current.hasMore).toBe(true);
                expect(rendered.result.current.feed.length).toBe(postsPerPage);
                yield scrollOnePage();
                // hasMore should be true because there are still buffered feeds
                expect(rendered.result.current.hasMore).toBe(true);
                expect(rendered.result.current.feed.length).toBe(postsPerPage * 2);
                yield scrollOnePage();
                // hasMore should be true because there are still buffered feeds
                expect(rendered.result.current.hasMore).toBe(true);
                expect(rendered.result.current.feed.length).toBe(postsPerPage * 3);
                yield scrollOnePage();
                // there are no bufferedFeed and pages left so hasMore should be false
                expect(rendered.result.current.hasMore).toBe(false);
                expect(rendered.result.current.feed.length).toBe(postsPerPage * 4);
            }));
            test(`multiple subplebbits, scroll to end of feed, hasMore becomes false`, () => __awaiter(void 0, void 0, void 0, function* () {
                rendered.rerender({ subplebbitAddresses: ['subplebbit address 1', 'subplebbit address 2', 'subplebbit address 3'], sortType: 'new' });
                // hasMore should be true before the feed is loaded
                expect(rendered.result.current.hasMore).toBe(true);
                expect(typeof rendered.result.current.loadMore).toBe('function');
                // wait for feed array to render
                try {
                    yield rendered.waitFor(() => Array.isArray(rendered.result.current.feed));
                }
                catch (e) {
                    console.error(e);
                }
                expect(rendered.result.current.feed).toEqual([]);
                // hasMore should be true before the feed is loaded
                expect(rendered.result.current.hasMore).toBe(true);
                try {
                    yield rendered.waitFor(() => rendered.result.current.feed.length > 0);
                }
                catch (e) {
                    console.error(e);
                }
                // hasMore should be true because there are still buffered feeds
                expect(rendered.result.current.hasMore).toBe(true);
                expect(rendered.result.current.feed.length).toBe(postsPerPage);
                yield scrollOnePage();
                // hasMore should be true because there are still buffered feeds
                expect(rendered.result.current.hasMore).toBe(true);
                expect(rendered.result.current.feed.length).toBe(postsPerPage * 2);
                // scroll to end of all pages
                yield scrollOnePage();
                yield scrollOnePage();
                yield scrollOnePage();
                yield scrollOnePage();
                yield scrollOnePage();
                yield scrollOnePage();
                expect(rendered.result.current.hasMore).toBe(true);
                expect(rendered.result.current.feed.length).toBe(postsPerPage * 8);
                yield scrollOnePage();
                yield scrollOnePage();
                yield scrollOnePage();
                yield scrollOnePage();
                // there are no bufferedFeed and pages left so hasMore should be false
                expect(rendered.result.current.hasMore).toBe(false);
                expect(rendered.result.current.feed.length).toBe(postsPerPage * 12);
            }));
            test(`don't increment page number if loaded feed hasn't increased yet`, () => __awaiter(void 0, void 0, void 0, function* () {
                rendered.rerender({ subplebbitAddresses: ['subplebbit address 1'] });
                try {
                    yield rendered.waitFor(() => rendered.result.current.feed.length > 0);
                }
                catch (e) {
                    console.error(e);
                }
                expect(rendered.result.current.feed.length).toBe(postsPerPage);
                expect(typeof rendered.result.current.loadMore).toBe('function');
                yield (0, react_hooks_1.act)(() => __awaiter(void 0, void 0, void 0, function* () {
                    // should have an error here because we load a page before the previous one finishes loading
                    // use a large loop to try to catch the error because depending on timing it doesn't always trigger
                    yield expect(() => __awaiter(void 0, void 0, void 0, function* () {
                        let attempts = 10000;
                        while (attempts) {
                            yield (0, plebbit_js_mock_1.simulateLoadingTime)();
                            rendered.result.current.loadMore();
                            rendered.result.current.loadMore();
                            rendered.result.current.loadMore();
                        }
                    })).rejects.toThrow('feedsActions.incrementFeedPageNumber cannot increment feed page number before current page has loaded');
                }));
            }));
        });
        describe('getSortedPosts never gets called', () => {
            const getSortedPosts = plebbit_js_mock_1.Subplebbit.prototype.getSortedPosts;
            beforeEach(() => {
                plebbit_js_mock_1.Subplebbit.prototype.getSortedPosts = function (sortedPostsCid) {
                    return __awaiter(this, void 0, void 0, function* () {
                        // it can get called with a next cid to fetch the second page
                        if (!sortedPostsCid.match('next')) {
                            throw Error(`subplebbit.getSortedPosts() was called with argument '${sortedPostsCid}', should not get called at all on first page of sort type 'hot'`);
                        }
                        return { nextSortedCommentsCid: null, comments: [] };
                    });
                };
            });
            afterEach(() => {
                plebbit_js_mock_1.Subplebbit.prototype.getSortedPosts = getSortedPosts;
            });
            test(`get feed sorted by hot, don't call subplebbit.getSortedPosts() because already included in IPNS record`, () => __awaiter(void 0, void 0, void 0, function* () {
                var _a;
                rendered.rerender({ subplebbitAddresses: ['subplebbit address 1'], sortType: 'hot' });
                try {
                    yield rendered.waitFor(() => { var _a; return ((_a = rendered.result.current.feed) === null || _a === void 0 ? void 0 : _a.length) >= postsPerPage; });
                }
                catch (e) {
                    console.error(e);
                }
                expect((_a = rendered.result.current.feed) === null || _a === void 0 ? void 0 : _a.length).toBe(postsPerPage);
            }));
        });
        test.only(`subplebbit updates while we are scrolling`, () => __awaiter(void 0, void 0, void 0, function* () {
            rendered = (0, react_hooks_1.renderHook)((props) => {
                const feed = (0, index_1.useFeed)(props === null || props === void 0 ? void 0 : props.subplebbitAddresses, props === null || props === void 0 ? void 0 : props.sortType, props === null || props === void 0 ? void 0 : props.accountName);
                const bufferedFeeds = (0, index_1.useBufferedFeeds)([{ subplebbitAddresses: props === null || props === void 0 ? void 0 : props.subplebbitAddresses, sortType: props === null || props === void 0 ? void 0 : props.sortType }], props === null || props === void 0 ? void 0 : props.accountName);
                return Object.assign(Object.assign({}, feed), { bufferedFeed: bufferedFeeds[0] });
            }, { wrapper: plebbit_provider_1.default });
            // get feed with 1 sub
            rendered.rerender({ subplebbitAddresses: ['subplebbit address 1'], sortType: 'topAll' });
            // initial state
            expect(typeof rendered.result.current.hasMore).toBe('boolean');
            expect(typeof rendered.result.current.loadMore).toBe('function');
            // wait for feed array to render
            try {
                yield rendered.waitFor(() => Array.isArray(rendered.result.current.feed));
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered.result.current.feed).toEqual([]);
            // wait for posts to be added, should get full first page
            // the first page should only have subplebbit 1 since it loads immediately after loading 1 sub
            try {
                yield rendered.waitFor(() => rendered.result.current.feed.length > 0);
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered.result.current.feed.length).toBe(postsPerPage);
            expect(rendered.result.current.feed[0].cid).toBe('subplebbit address 1 sorted posts cid topAll comment cid 100');
            expect(rendered.result.current.feed[1].cid).toBe('subplebbit address 1 sorted posts cid topAll comment cid 99');
            expect(rendered.result.current.feed[2].cid).toBe('subplebbit address 1 sorted posts cid topAll comment cid 98');
            expect(rendered.result.current.feed[0].upvoteCount).toBe(100);
            expect(rendered.result.current.feed[1].upvoteCount).toBe(99);
            expect(rendered.result.current.feed[2].upvoteCount).toBe(98);
        }));
        test.todo(`store sorted posts pages in database`);
        test.todo(`don't let a malicious sub owner display older posts in top hour/day/week/month/year`);
        // already implemented but no tests for it because difficult to test
        test.todo(`subplebbits finish loading with 0 posts, hasMore becomes false, but only after finished loading`);
    });
});