import type { Account, UseAccountSubplebbitsOptions, UseAccountSubplebbitsResult, UseAccountVoteOptions, UseAccountVoteResult, UseAccountVotesOptions, UseAccountVotesResult, UseAccountCommentsOptions, UseAccountCommentsResult, UseAccountCommentOptions, UseAccountCommentResult, UseNotificationsOptions, UseNotificationsResult, UseAccountEditsOptions, UseAccountEditsResult, UseEditedCommentOptions, UseEditedCommentResult, UseAccountOptions, UseAccountResult, UsePubsubSubscribeOptions, UsePubsubSubscribeResult } from '../../types';
/**
 * @param accountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, return
 * the active account id.
 */
export declare function useAccountId(accountName?: string): string | false | undefined;
/**
 * @param accountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, return
 * the active account.
 */
export declare function useAccount(options?: UseAccountOptions): UseAccountResult;
/**
 * Return all accounts in the order of `accountsStore.accountIds`. To reorder, use `accountsActions.setAccountsOrder(accountNames)`.
 */
export declare function useAccounts(): {
    accounts: Account[];
    state: string;
    error: undefined;
    errors: never[];
};
/**
 * Returns all subplebbits where the account is a creator or moderator
 */
export declare function useAccountSubplebbits(options?: UseAccountSubplebbitsOptions): UseAccountSubplebbitsResult;
/**
 * Returns an account's notifications in an array. Unread notifications have a field markedAsRead: false.
 *
 * @param accountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, return
 * the active account's notifications.
 */
export declare function useNotifications(options?: UseNotificationsOptions): UseNotificationsResult;
export declare function useAccountComments(options?: UseAccountCommentsOptions): UseAccountCommentsResult;
/**
 * Returns an account's single comment, e.g. a pending comment they published.
 */
export declare function useAccountComment(options?: UseAccountCommentOptions): UseAccountCommentResult;
/**
 * Returns the own user's votes stored locally, even those not yet published by the subplebbit owner.
 * Check UseAccountCommentsOptions type in types.tsx to filter them, e.g. filter = {subplebbitAddresses: ['memes.eth']}.
 */
export declare function useAccountVotes(options?: UseAccountVotesOptions): UseAccountVotesResult;
/**
 * Returns an account's single vote on a comment, e.g. to know if you already voted on a comment.
 */
export declare function useAccountVote(options?: UseAccountVoteOptions): UseAccountVoteResult;
/**
 * Returns all the comment and subplebbit edits published by an account.
 */
export declare function useAccountEdits(options?: UseAccountEditsOptions): UseAccountEditsResult;
/**
 * Returns the comment edited (if has any edits), as well as the pending, succeeded or failed state of the edit.
 */
export declare function useEditedComment(options?: UseEditedCommentOptions): UseEditedCommentResult;
/**
 * This hook should be added to pages where the user is likely to publish something, i,e. the
 * submit page and the /c/<commentCid> page, it improves the speed of publishing to the pubsub
 * by subscribing to the pubsub right away.
 *
 * @param accountName - The nickname of the account, e.g. 'Account 1'.
 * @param subplebbitAddress - The subplebbit address to subscribe to, e.g. 'news.eth'.
 */
export declare function usePubsubSubscribe(options?: UsePubsubSubscribeOptions): UsePubsubSubscribeResult;
