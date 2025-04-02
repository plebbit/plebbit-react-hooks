import { Comments } from '../../types';
export type RepliesCommentsState = {
    comments: Comments;
    addCommentToStoreOrUpdateComment: Function;
};
declare const repliesCommentsStore: import("zustand").UseBoundStore<import("zustand").StoreApi<RepliesCommentsState>>;
export default repliesCommentsStore;
