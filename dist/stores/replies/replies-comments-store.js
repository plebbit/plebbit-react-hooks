import createStore from 'zustand';
const repliesCommentsStore = createStore((setState, getState) => ({
    comments: {},
    addCommentToStoreOrUpdateComment(comment) {
        setState((state) => {
            // updatedAt hasn't changed so no need to update the comment
            if (state.comments[comment.cid] && comment.updatedAt <= state.comments[comment.cid].updatedAt) {
                return;
            }
            return { comments: Object.assign(Object.assign({}, state.comments), { [comment.cid]: comment }) };
        });
    },
}));
export default repliesCommentsStore;
