import { Comments } from '../../types';
export declare const listeners: any;
export declare type CommentsState = {
    comments: Comments;
    errors: {
        [commentCid: string]: Error[];
    };
    addCommentToStore: Function;
};
declare const commentsStore: import("zustand").UseBoundStore<import("zustand").StoreApi<CommentsState>>;
export declare const resetCommentsStore: () => Promise<void>;
export declare const resetCommentsDatabaseAndStore: () => Promise<void>;
export default commentsStore;
