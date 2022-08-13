var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useState, useEffect, useMemo } from 'react';
import utils from '../../lib/utils';
import Debug from 'debug';
const debug = Debug('plebbit-react-hooks:hooks:feeds');
import useAccountsStore from '../../stores/accounts';
import localForageLru from '../../lib/localforage-lru';
const subplebbitsPagesDatabase = localForageLru.createInstance({ name: 'WORK_IN_PROGRESS__subplebbitsPages', size: 500 });
// keep large buffer because fetching cids is slow
const subplebbitPostsLeftBeforeNextPage = 50;
/**
 * Use the `SubplebbitPostsInfo` objects to fetch the first page of all subplebbit/sorts
 * if the `SubplebbitPostsInfo.bufferedPostCount` gets too low, start fetching the next page.
 * Once a next page is added, it is never removed.
 */
export default function useSubplebbitsPages(subplebbitsPostsInfo, subplebbits) {
    const [subplebbitsPages, setSubplebbitsPages] = useState({});
    // set the info necessary to fetch each page recursively
    // if bufferedPostCount is less than subplebbitPostsLeftBeforeNextPage
    const subplebbitsPagesInfo = useMemo(() => {
        var _a, _b, _c;
        const newSubplebbitsPagesInfo = {};
        for (const infoName in subplebbitsPostsInfo) {
            const { firstPageCid, account, subplebbitAddress, sortType, bufferedPostCount } = subplebbitsPostsInfo[infoName];
            // add first page
            const subplebbitFirstPageInfo = {
                pageCid: firstPageCid,
                account,
                subplebbitAddress,
                sortType,
                // add preloaded subplebbit page if any
                page: (_c = (_b = (_a = subplebbits === null || subplebbits === void 0 ? void 0 : subplebbits[subplebbitAddress]) === null || _a === void 0 ? void 0 : _a.posts) === null || _b === void 0 ? void 0 : _b.pages) === null || _c === void 0 ? void 0 : _c[sortType],
            };
            newSubplebbitsPagesInfo[firstPageCid + infoName] = subplebbitFirstPageInfo;
            // add all next pages if needed and if available
            if (bufferedPostCount <= subplebbitPostsLeftBeforeNextPage) {
                const subplebbitPages = getSubplebbitPages(firstPageCid, subplebbitsPages);
                for (const page of subplebbitPages) {
                    if (page.nextCid) {
                        const subplebbitNextPageInfo = {
                            pageCid: page.nextCid,
                            account,
                            subplebbitAddress,
                            sortType,
                        };
                        newSubplebbitsPagesInfo[page.nextCid + infoName] = subplebbitNextPageInfo;
                    }
                }
            }
        }
        return newSubplebbitsPagesInfo;
    }, [subplebbitsPostsInfo, subplebbitsPages]);
    // fetch subplebbit pages if needed
    // once a page is added, it's never removed
    useEffect(() => {
        for (const infoName in subplebbitsPagesInfo) {
            const { pageCid, account, subplebbitAddress, page } = subplebbitsPagesInfo[infoName];
            // page already fetched or fetching
            if (subplebbitsPages[pageCid] || getSubplebbitPagePending[account.id + pageCid]) {
                continue;
            }
            // the subplebbit page was already preloaded in the subplebbit IPNS record
            if (page) {
                setSubplebbitsPages((previousSubplebbitsPages) => (Object.assign(Object.assign({}, previousSubplebbitsPages), { [pageCid]: page })));
                continue;
            }
            ;
            (() => __awaiter(this, void 0, void 0, function* () {
                // subplebbit page is cached
                const cachedSubplebbitPage = yield subplebbitsPagesDatabase.getItem(pageCid);
                if (cachedSubplebbitPage) {
                    setSubplebbitsPages((previousSubplebbitsPages) => (Object.assign(Object.assign({}, previousSubplebbitsPages), { [pageCid]: cachedSubplebbitPage })));
                    return;
                }
                getSubplebbitPagePending[account.id + pageCid] = true;
                const subplebbit = yield account.plebbit.createSubplebbit({ address: subplebbitAddress });
                const fetchedSubplebbitPage = yield subplebbit.posts.getPage(pageCid);
                yield subplebbitsPagesDatabase.setItem(pageCid, fetchedSubplebbitPage);
                debug('FeedsProvider useSubplebbitsPages subplebbit.posts.getPage', {
                    pageCid,
                    infoName,
                    subplebbitPage: {
                        nextCid: fetchedSubplebbitPage.nextCid,
                        commentsLength: fetchedSubplebbitPage.comments.length,
                        subplebbitsPostsInfo,
                    },
                });
                setSubplebbitsPages((previousSubplebbitsPages) => (Object.assign(Object.assign({}, previousSubplebbitsPages), { [pageCid]: fetchedSubplebbitPage })));
                getSubplebbitPagePending[account.id + pageCid] = false;
                // when publishing a comment, you don't yet know its CID
                // so when a new comment is fetched, check to see if it's your own
                // comment, and if yes, add the CID to your account comments database
                const flattenedReplies = utils.flattenCommentsPages(fetchedSubplebbitPage);
                for (const comment of flattenedReplies) {
                    useAccountsStore
                        .getState()
                        .accountsActionsInternal.addCidToAccountComment(comment)
                        .catch((error) => console.error('FeedsProvider useSubplebbitsPages addCidToAccountComment error', { comment, error }));
                }
            }))();
        }
    }, [subplebbitsPagesInfo]);
    return subplebbitsPages;
}
const getSubplebbitPagePending = {};
/**
 * Util function to gather in an array all loaded `SubplebbitPage` pages of a subplebbit/sort
 * using `SubplebbitPage.nextCid`
 */
const getSubplebbitPages = (firstPageCid, subplebbitsPages) => {
    var _a;
    const pages = [];
    const firstPage = subplebbitsPages[firstPageCid];
    if (!firstPage) {
        return pages;
    }
    pages.push(firstPage);
    while (true) {
        const nextCid = (_a = pages[pages.length - 1]) === null || _a === void 0 ? void 0 : _a.nextCid;
        const subplebbitPage = nextCid && subplebbitsPages[nextCid];
        if (!subplebbitPage) {
            return pages;
        }
        pages.push(subplebbitPage);
    }
};
