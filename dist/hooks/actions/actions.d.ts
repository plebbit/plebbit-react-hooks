import type { UseSubscribeOptions, UseSubscribeResult, UsePublishCommentOptions, UsePublishCommentResult, UseBlockOptions, UseBlockResult, UseCreateSubplebbitOptions, UseCreateSubplebbitResult, UsePublishVoteOptions, UsePublishVoteResult, UsePublishCommentEditOptions, UsePublishCommentEditResult, UsePublishCommentModerationOptions, UsePublishCommentModerationResult, UsePublishSubplebbitEditOptions, UsePublishSubplebbitEditResult } from '../../types';
export declare function useSubscribe(options?: UseSubscribeOptions): UseSubscribeResult;
export declare function useBlock(options?: UseBlockOptions): UseBlockResult;
export declare function usePublishComment(options?: UsePublishCommentOptions): UsePublishCommentResult;
export declare function usePublishVote(options?: UsePublishVoteOptions): UsePublishVoteResult;
export declare function usePublishCommentEdit(options?: UsePublishCommentEditOptions): UsePublishCommentEditResult;
export declare function usePublishCommentModeration(options?: UsePublishCommentModerationOptions): UsePublishCommentModerationResult;
export declare function usePublishSubplebbitEdit(options?: UsePublishSubplebbitEditOptions): UsePublishSubplebbitEditResult;
export declare function useCreateSubplebbit(options?: UseCreateSubplebbitOptions): UseCreateSubplebbitResult;
