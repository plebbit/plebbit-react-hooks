var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { act, renderHook } from '@testing-library/react-hooks';
import testUtils from '../lib/test-utils';
import { useFeed, useBufferedFeeds, useAccountsActions } from '../index';
import PlebbitProvider from '../providers/plebbit-provider';
import localForageLru from '../lib/localforage-lru';
import localForage from 'localforage';
import PlebbitJsMock, { mockPlebbitJs, Subplebbit, simulateLoadingTime } from '../lib/plebbit-js/plebbit-js-mock';
mockPlebbitJs(PlebbitJsMock);
const deleteDatabases = () => Promise.all([
    localForage.createInstance({ name: 'accountsMetadata' }).clear(),
    localForage.createInstance({ name: 'accounts' }).clear(),
    localForageLru.createInstance({ name: 'subplebbits' }).clear(),
    localForageLru.createInstance({ name: 'comments' }).clear(),
    localForageLru.createInstance({ name: 'sortedPosts' }).clear()
]);
describe('feeds', () => {
    beforeAll(() => {
        // some feeds tests are flaky
        // jest.retryTimes(5)
        testUtils.silenceUpdateUnmountedComponentWarning();
    });
    afterAll(() => {
        // jest.retryTimes(0)
        testUtils.restoreAll();
    });
    describe('get feed', () => {
        // reddit infinite scrolling posts per pages are 25
        const postsPerPage = 25;
        let rendered;
        const scrollOnePage = () => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const nextFeedLength = (((_a = rendered.result.current.feed) === null || _a === void 0 ? void 0 : _a.length) || 0) + postsPerPage;
            act(() => { rendered.result.current.loadMore(); });
            try {
                yield rendered.waitFor(() => { var _a; return ((_a = rendered.result.current.feed) === null || _a === void 0 ? void 0 : _a.length) >= nextFeedLength; });
            }
            catch (e) {
                console.error('scrollOnePage failed:', e);
            }
        });
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            // @ts-ignore
            rendered = renderHook((props) => useFeed(props === null || props === void 0 ? void 0 : props.subplebbitAddresses, props === null || props === void 0 ? void 0 : props.sortType, props === null || props === void 0 ? void 0 : props.accountName), { wrapper: PlebbitProvider });
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
            const rendered2 = renderHook(() => useFeed(['subplebbit address 1']), { wrapper: PlebbitProvider });
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
                act(() => { rendered.result.current.loadMore(); });
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
            const getSortedPosts = Subplebbit.prototype.getSortedPosts;
            Subplebbit.prototype.getSortedPosts = function (sortedPostsCid) {
                return __awaiter(this, void 0, void 0, function* () {
                    // without the extra simulated load time the hooks will fetch multiple pages in advance instead of just 1
                    yield simulateLoadingTime();
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
            Subplebbit.prototype.getSortedPosts = getSortedPosts;
        }));
        test('get multiple subplebbits sorted by new and scroll to multiple pages', () => __awaiter(void 0, void 0, void 0, function* () {
            const getSortedPostsCalledTimes = {
                'subplebbit address 1': 0, 'subplebbit address 2': 0, 'subplebbit address 3': 0
            };
            const getSortedPosts = Subplebbit.prototype.getSortedPosts;
            Subplebbit.prototype.getSortedPosts = function (sortedPostsCid) {
                return __awaiter(this, void 0, void 0, function* () {
                    // without the extra simulated load time the hooks will fetch multiple pages in advance instead of just 1
                    yield simulateLoadingTime();
                    yield simulateLoadingTime();
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
            Subplebbit.prototype.getSortedPosts = getSortedPosts;
        }));
        // getting feeds with multiple subs in them sometimes gets them in the wrong order because
        // of react renders concurrency so retry a few times if it fails
        describe('retry on fail', () => {
            beforeAll(() => { jest.retryTimes(3); });
            afterAll(() => { jest.retryTimes(0); });
            test('get feed page 1 and 2 with multiple subplebbits sorted by topAll', () => __awaiter(void 0, void 0, void 0, function* () {
                // use buffered feeds to be able to wait until the buffered feeds have updated before loading page 2
                rendered = renderHook((props) => {
                    const feed = useFeed(props === null || props === void 0 ? void 0 : props.subplebbitAddresses, props === null || props === void 0 ? void 0 : props.sortType, props === null || props === void 0 ? void 0 : props.accountName);
                    const bufferedFeeds = useBufferedFeeds([{ subplebbitAddresses: props === null || props === void 0 ? void 0 : props.subplebbitAddresses, sortType: props === null || props === void 0 ? void 0 : props.sortType }], props === null || props === void 0 ? void 0 : props.accountName);
                    return Object.assign(Object.assign({}, feed), { bufferedFeed: bufferedFeeds[0] });
                }, { wrapper: PlebbitProvider });
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
            const rendered = renderHook(() => useBufferedFeeds([
                { subplebbitAddresses: ['subplebbit address 1', 'subplebbit address 2', 'subplebbit address 3'], sortType: 'new' },
                { subplebbitAddresses: ['subplebbit address 4', 'subplebbit address 5', 'subplebbit address 6'], sortType: 'topAll' },
                { subplebbitAddresses: ['subplebbit address 7', 'subplebbit address 8', 'subplebbit address 9'] }
            ]), { wrapper: PlebbitProvider });
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
            rendered = renderHook((props) => {
                const feed = useFeed(props === null || props === void 0 ? void 0 : props.subplebbitAddresses, props === null || props === void 0 ? void 0 : props.sortType, props === null || props === void 0 ? void 0 : props.accountName);
                const { createAccount } = useAccountsActions();
                return Object.assign(Object.assign({}, feed), { createAccount });
            }, { wrapper: PlebbitProvider });
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
            yield act(() => __awaiter(void 0, void 0, void 0, function* () {
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
            rendered = renderHook(() => useBufferedFeeds([
                { subplebbitAddresses: ['subplebbit address 1', 'subplebbit address 2', 'subplebbit address 3'], sortType: 'new' },
                { subplebbitAddresses: ['subplebbit address 4', 'subplebbit address 5', 'subplebbit address 6'], sortType: `doesnt exist` },
                { subplebbitAddresses: ['subplebbit address 7', 'subplebbit address 8', 'subplebbit address 9'] }
            ]), { wrapper: PlebbitProvider });
            try {
                yield rendered.waitForNextUpdate();
            }
            catch (e) {
                console.error(e);
            }
            expect((_c = rendered.result.error) === null || _c === void 0 ? void 0 : _c.message).toMatch(`invalid feed sort type 'doesnt exist'`);
        }));
        describe('getSortedPosts only has 1 page', () => {
            const getSortedPosts = Subplebbit.prototype.getSortedPosts;
            beforeEach(() => {
                // mock getSortedPosts to only give 1 or 2 pages
                Subplebbit.prototype.getSortedPosts = function (sortedPostsCid) {
                    return __awaiter(this, void 0, void 0, function* () {
                        // without the extra simulated load time the hooks will fetch multiple pages in advance instead of just 1
                        yield simulateLoadingTime();
                        yield simulateLoadingTime();
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
                Subplebbit.prototype.getSortedPosts = getSortedPosts;
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
                yield act(() => __awaiter(void 0, void 0, void 0, function* () {
                    // should have an error here because we load a page before the previous one finishes loading
                    // use a large loop to try to catch the error because depending on timing it doesn't always trigger
                    yield expect(() => __awaiter(void 0, void 0, void 0, function* () {
                        let attempts = 10000;
                        while (attempts) {
                            yield simulateLoadingTime();
                            rendered.result.current.loadMore();
                            rendered.result.current.loadMore();
                            rendered.result.current.loadMore();
                        }
                    })).rejects.toThrow('feedsActions.incrementFeedPageNumber cannot increment feed page number before current page has loaded');
                }));
            }));
        });
        describe('getSortedPosts never gets called', () => {
            const getSortedPosts = Subplebbit.prototype.getSortedPosts;
            beforeEach(() => {
                Subplebbit.prototype.getSortedPosts = function (sortedPostsCid) {
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
                Subplebbit.prototype.getSortedPosts = getSortedPosts;
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
        test(`subplebbit updates while we are scrolling`, () => __awaiter(void 0, void 0, void 0, function* () {
            const update = Subplebbit.prototype.update;
            // mock the update method to be able to have access to the updating subplebbit instances
            const subplebbits = [];
            Subplebbit.prototype.update = function () {
                subplebbits.push(this);
                return update.bind(this)();
            };
            rendered = renderHook((props) => {
                const feed = useFeed(props === null || props === void 0 ? void 0 : props.subplebbitAddresses, props === null || props === void 0 ? void 0 : props.sortType, props === null || props === void 0 ? void 0 : props.accountName);
                const bufferedFeeds = useBufferedFeeds([{ subplebbitAddresses: props === null || props === void 0 ? void 0 : props.subplebbitAddresses, sortType: props === null || props === void 0 ? void 0 : props.sortType }], props === null || props === void 0 ? void 0 : props.accountName);
                return Object.assign(Object.assign({}, feed), { bufferedFeed: bufferedFeeds[0] });
            }, { wrapper: PlebbitProvider });
            // get feed with 1 sub
            rendered.rerender({ subplebbitAddresses: ['subplebbit address 1'], sortType: 'topAll' });
            try {
                yield rendered.waitFor(() => rendered.result.current.feed.length > 0);
            }
            catch (e) {
                console.error(e);
            }
            // the first page of loaded and buffered feeds should have laoded
            expect(rendered.result.current.feed.length).toBe(postsPerPage);
            expect(rendered.result.current.bufferedFeed.length).toBe(75);
            // at this point only one subplebbit should have updated a single time
            expect(subplebbits.length).toBe(1);
            const [subplebbit] = subplebbits;
            act(() => {
                // update the sorted posts cids and send a subplebbit update event and wait for buffered feeds to change
                subplebbits[0].sortedPostsCids = {
                    hot: 'updated sorted posts cid hot',
                    topAll: 'updated sorted posts cid topAll',
                    new: 'updated sorted posts cid new',
                };
                subplebbit.emit('update', subplebbit);
            });
            // wait for the buffered feed to empty (because of the update), then to refill with updated sorted posts
            // more testing in production will have to be done to figure out if emptying the buffered feed while waiting
            // for new posts causes problems.
            try {
                yield rendered.waitFor(() => rendered.result.current.bufferedFeed[0].cid === 'updated sorted posts cid topAll comment cid 100');
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered.result.current.bufferedFeed[0].cid).toBe('updated sorted posts cid topAll comment cid 100');
            Subplebbit.prototype.update = update;
        }));
        describe('getSortedPosts only gets called once per sortedPostsCid', () => {
            const getSortedPosts = Subplebbit.prototype.getSortedPosts;
            beforeEach(() => {
                const usedSortedPostsCids = {};
                Subplebbit.prototype.getSortedPosts = function (sortedPostsCid) {
                    return __awaiter(this, void 0, void 0, function* () {
                        if (usedSortedPostsCids[sortedPostsCid]) {
                            throw Error(`subplebbit.getSortedPosts() already called with argument '${sortedPostsCid}'`);
                        }
                        usedSortedPostsCids[sortedPostsCid] = true;
                        return getSortedPosts.bind(this)(sortedPostsCid);
                    });
                };
            });
            afterEach(() => {
                Subplebbit.prototype.getSortedPosts = getSortedPosts;
            });
            test(`store sorted posts pages in database`, () => __awaiter(void 0, void 0, void 0, function* () {
                var _a, _b;
                rendered.rerender({ subplebbitAddresses: ['subplebbit address 1'], sortType: 'new' });
                try {
                    yield rendered.waitFor(() => { var _a; return ((_a = rendered.result.current.feed) === null || _a === void 0 ? void 0 : _a.length) >= postsPerPage; });
                }
                catch (e) {
                    console.error(e);
                }
                expect((_a = rendered.result.current.feed) === null || _a === void 0 ? void 0 : _a.length).toBe(postsPerPage);
                // render with a fresh empty context to test database persistance
                const rendered2 = renderHook(() => useFeed(['subplebbit address 1'], 'new'), { wrapper: PlebbitProvider });
                try {
                    yield rendered2.waitFor(() => { var _a; return ((_a = rendered2.result.current.feed) === null || _a === void 0 ? void 0 : _a.length) >= postsPerPage; });
                }
                catch (e) {
                    console.error(e);
                }
                expect((_b = rendered2.result.current.feed) === null || _b === void 0 ? void 0 : _b.length).toBe(postsPerPage);
            }));
        });
        // TODO: not implemented
        // at the moment a comment already inside a loaded feed will ignore all updates from future pages
        test.todo(`if an updated subplebbit page gives a comment already in a loaded feed, replace it with the newest version with updated votes/replies`);
        // TODO: not implemented
        test.todo(`don't let a malicious sub owner display older posts in top hour/day/week/month/year`);
        // already implemented but no tests for it because difficult to test
        test.todo(`subplebbits finish loading with 0 posts, hasMore becomes false, but only after finished loading`);
    });
});
