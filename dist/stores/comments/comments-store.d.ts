import { Comments } from '../../types';
export declare const listeners: any;
declare type CommentsState = {
    comments: Comments;
    addCommentToStore: Function;
};
declare const useCommentsStore: import("zustand").UseBoundStore<import("zustand").StoreApi<CommentsState>>;
export declare const resetCommentsStore: () => Promise<void>;
export declare const resetCommentsDatabaseAndStore: () => Promise<void>;
export default useCommentsStore;
