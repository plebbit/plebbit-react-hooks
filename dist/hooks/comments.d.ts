import { UseCommentsOptions, UseCommentsResult, UseCommentOptions, UseCommentResult, UseRepliesOptions, UseRepliesResult, UseValidateCommentOptions, UseValidateCommentResult } from '../types';
/**
 * @param commentCid - The IPFS CID of the comment to get
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export declare function useComment(options?: UseCommentOptions): UseCommentResult;
/**
 * @param commentCids - The IPFS CIDs of the comments to get
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export declare function useComments(options?: UseCommentsOptions): UseCommentsResult;
export declare function useReplies(options?: UseRepliesOptions): UseRepliesResult;
export declare function useValidateComment(options?: UseValidateCommentOptions): UseValidateCommentResult;
