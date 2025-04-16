import createStore from 'zustand';
const repliesCommentsStore = createStore((setState, getState) => ({
    comments: {},
    addCommentsToStoreOrUpdateComments(comments) {
        setState((state) => {
            const newComments = {};
            for (const comment of comments) {
                // updatedAt hasn't changed so no need to update the comment
                if (state.comments[comment.cid] && comment.updatedAt <= state.comments[comment.cid].updatedAt) {
                    continue;
                }
                newComments[comment.cid] = comment;
            }
            if (!Object.keys(newComments).length) {
                return {};
            }
            return { comments: Object.assign(Object.assign({}, state.comments), newComments) };
        });
    },
}));
export default repliesCommentsStore;
