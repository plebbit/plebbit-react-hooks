import repliesStore from '../replies';
import repliesCommentsStore from '../replies/replies-comments-store';
import Logger from '@plebbit/plebbit-logger';
// include replies pages store with feeds for debugging
const log = Logger('plebbit-react-hooks:replies:stores');
const getSortTypeFromPage = (page) => {
    var _a, _b, _c;
    for (const reply of page.comments || []) {
        for (const sortType in (_a = reply === null || reply === void 0 ? void 0 : reply.replies) === null || _a === void 0 ? void 0 : _a.pages) {
            if ((_c = (_b = reply.replies.pages[sortType]) === null || _b === void 0 ? void 0 : _b.comments) === null || _c === void 0 ? void 0 : _c.length) {
                return sortType;
            }
        }
    }
};
export const addChildrenRepliesFeedsToAddToStore = (page, comment) => {
    const { feedsOptions, addFeedsToStore } = repliesStore.getState();
    const commentsToAddToStoreOrUpdate = [];
    const feedsToAddToStore = [];
    const addRepliesFeedsToStoreRecursivelyCalls = [];
    // assume a page always uses the same sort type recursively
    // could be incorrect, but we don't care about bad pages implementations for now
    const sortType = getSortTypeFromPage(page) || 'best';
    const addRepliesFeedsToStoreRecursively = (page, feedOptions) => {
        var _a, _b;
        addRepliesFeedsToStoreRecursivelyCalls.push({ page, feedOptions });
        for (const reply of (page === null || page === void 0 ? void 0 : page.comments) || []) {
            // reply has no replies, so doesn't need a feed
            if (Object.keys(((_a = reply === null || reply === void 0 ? void 0 : reply.replies) === null || _a === void 0 ? void 0 : _a.pages) || {}).length + Object.keys(((_b = reply === null || reply === void 0 ? void 0 : reply.replies) === null || _b === void 0 ? void 0 : _b.pageCids) || {}).length === 0) {
                continue;
            }
            commentsToAddToStoreOrUpdate.push(reply);
            feedsToAddToStore.push(Object.assign(Object.assign({}, feedOptions), { commentCid: reply === null || reply === void 0 ? void 0 : reply.cid }));
            addRepliesFeedsToStoreRecursively(reply.replies.pages[sortType], feedOptions);
        }
    };
    const feedsOptionsToAddToStore = Object.values(feedsOptions).filter((feedOptions) => feedOptions.commentCid === comment.cid && !feedOptions.flat);
    for (const feedOptions of feedsOptionsToAddToStore) {
        addRepliesFeedsToStoreRecursively(page, feedOptions);
    }
    log('addChildrenRepliesFeedsToAddToStore', { feedsToAddToStore, commentsToAddToStoreOrUpdate });
    addFeedsToStore(feedsToAddToStore);
    repliesCommentsStore.getState().addCommentsToStoreOrUpdateComments(commentsToAddToStoreOrUpdate);
};
