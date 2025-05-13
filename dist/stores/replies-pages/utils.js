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
    // assume a page always uses the same sort type recursively
    // could be incorrect, but we don't care about bad pages implementations for now
    const sortType = getSortTypeFromPage(page) || 'best';
    const addRepliesFeedsToStoreRecursively = (page, feedOptions) => {
        var _a, _b;
        for (const reply of (page === null || page === void 0 ? void 0 : page.comments) || []) {
            // NOTE: even a comment with no replies needs a feed, to know it has 0 replies and not displace the UI when a new replies appears
            commentsToAddToStoreOrUpdate.push(reply);
            feedsToAddToStore.push(Object.assign(Object.assign({}, feedOptions), { commentCid: reply === null || reply === void 0 ? void 0 : reply.cid, commentDepth: reply === null || reply === void 0 ? void 0 : reply.depth }));
            addRepliesFeedsToStoreRecursively((_b = (_a = reply === null || reply === void 0 ? void 0 : reply.replies) === null || _a === void 0 ? void 0 : _a.pages) === null || _b === void 0 ? void 0 : _b[sortType], feedOptions);
        }
    };
    const feedsOptionsToAddToStore = Object.values(feedsOptions).filter((feedOptions) => feedOptions.commentCid === comment.cid && !feedOptions.flat);
    for (const feedOptions of feedsOptionsToAddToStore) {
        addRepliesFeedsToStoreRecursively(page, feedOptions);
    }
    log('repliesPagesStore.addChildrenRepliesFeedsToAddToStore', {
        feedsToAddToStore,
        commentsToAddToStoreOrUpdate,
    });
    addFeedsToStore(feedsToAddToStore);
    repliesCommentsStore.getState().addCommentsToStoreOrUpdateComments(commentsToAddToStoreOrUpdate);
};
