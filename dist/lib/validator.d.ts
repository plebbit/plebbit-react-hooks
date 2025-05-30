export declare const validateAccountsActionsPublishCommentArguments: ({ publishCommentOptions, accountName, account }: any) => void;
export declare const validateAccountsActionsPublishVoteArguments: ({ publishVoteOptions, accountName, account }: any) => void;
export declare const validateAccountsActionsPublishCommentEditArguments: ({ publishCommentEditOptions, accountName, account }: any) => void;
export declare const validateAccountsActionsPublishCommentModerationArguments: ({ publishCommentModerationOptions, accountName, account }: any) => void;
export declare const validateAccountsActionsPublishSubplebbitEditArguments: ({ subplebbitAddress, publishSubplebbitEditOptions, accountName, account }: any) => void;
export declare const validateAccountsActionsExportAccountArguments: (accountName: any) => void;
export declare const validateAccountsActionsSetAccountsOrderArguments: (newOrderedAccountNames: any, accountNames: any) => void;
export declare const validateAccountsActionsSetAccountArguments: (account: any) => void;
export declare const validateAccountsActionsSetActiveAccountArguments: (accountName: any) => void;
export declare const validateAccountsDatabaseGetAccountsArguments: (accountIds: any) => void;
export declare const validateAccountsDatabaseAccountNames: (accountNames: any) => void;
export declare const validateAccountsDatabaseAddAccountArguments: (account: any) => void;
export declare const validateUseCommentArguments: (commentCid: any, account: any) => void;
export declare const validateUseCommentsArguments: (commentCids: any, account: any) => void;
export declare const validateUseSubplebbitArguments: (subplebbitAddress: any, account: any) => void;
export declare const validateUseSubplebbitsArguments: (subplebbitAddresses: any, account: any) => void;
export declare const validateFeedSortType: (sortType: any) => void;
export declare const validateUseFeedArguments: (subplebbitAddresses?: any, sortType?: any, accountName?: any, postsPerPage?: any, filter?: any, newerThan?: any) => void;
export declare const validateUseBufferedFeedsArguments: (feedsOptions?: any, accountName?: any) => void;
export declare const validateRepliesSortType: (sortType: any) => void;
export declare const validateUseRepliesArguments: (comment?: any, sortType?: any, accountName?: any, flat?: any, accountComments?: any, postsPerPage?: any, filter?: any) => void;
declare const validator: {
    validateAccountsActionsPublishCommentArguments: ({ publishCommentOptions, accountName, account }: any) => void;
    validateAccountsActionsPublishCommentEditArguments: ({ publishCommentEditOptions, accountName, account }: any) => void;
    validateAccountsActionsPublishCommentModerationArguments: ({ publishCommentModerationOptions, accountName, account }: any) => void;
    validateAccountsActionsPublishSubplebbitEditArguments: ({ subplebbitAddress, publishSubplebbitEditOptions, accountName, account }: any) => void;
    validateAccountsActionsPublishVoteArguments: ({ publishVoteOptions, accountName, account }: any) => void;
    validateAccountsActionsExportAccountArguments: (accountName: any) => void;
    validateAccountsActionsSetAccountsOrderArguments: (newOrderedAccountNames: any, accountNames: any) => void;
    validateAccountsActionsSetAccountArguments: (account: any) => void;
    validateAccountsActionsSetActiveAccountArguments: (accountName: any) => void;
    validateAccountsDatabaseAddAccountArguments: (account: any) => void;
    validateAccountsDatabaseGetAccountsArguments: (accountIds: any) => void;
    validateAccountsDatabaseAccountNames: (accountNames: any) => void;
    validateUseCommentArguments: (commentCid: any, account: any) => void;
    validateUseCommentsArguments: (commentCids: any, account: any) => void;
    validateUseSubplebbitArguments: (subplebbitAddress: any, account: any) => void;
    validateUseSubplebbitsArguments: (subplebbitAddresses: any, account: any) => void;
    validateFeedSortType: (sortType: any) => void;
    validateUseFeedArguments: (subplebbitAddresses?: any, sortType?: any, accountName?: any, postsPerPage?: any, filter?: any, newerThan?: any) => void;
    validateUseBufferedFeedsArguments: (feedsOptions?: any, accountName?: any) => void;
    validateRepliesSortType: (sortType: any) => void;
    validateUseRepliesArguments: (comment?: any, sortType?: any, accountName?: any, flat?: any, accountComments?: any, postsPerPage?: any, filter?: any) => void;
};
export default validator;
