import repliesStore from '../replies';
import { getSortTypeFromComment } from '../replies/utils';
import repliesCommentsStore from '../replies/replies-comments-store';
export const addChildrenRepliesFeedsToAddToStore = (page, comment) => {
    const { feedsOptions, addFeedsToStore } = repliesStore.getState();
    const commentsToAddToStoreOrUpdate = [];
    const feedsToAddToStore = [];
    const addRepliesFeedsToStoreRecursively = (page, feedOptions) => {
        var _a, _b;
        // use the sort type availabe on the comment when missing
        // recalculate sort type every addRepliesFeedsToStoreRecursively call
        // because a 'new' page could have nested 'best' preloaded comments
        const sortType = getSortTypeFromComment(comment, feedOptions);
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
    addFeedsToStore(feedsToAddToStore);
    repliesCommentsStore.getState().addCommentsToStoreOrUpdateComments(commentsToAddToStoreOrUpdate);
};
