import { AccountNamesToAccountIds, Accounts, AccountsVotes, AccountsEdits, AccountsComments, AccountsCommentsReplies, CommentCidsToAccountsComments } from '../../types';
export declare const listeners: any;
declare type AccountsState = {
    accounts: Accounts;
    accountIds: string[];
    activeAccountId: string | undefined;
    accountNamesToAccountIds: AccountNamesToAccountIds;
    accountsComments: AccountsComments;
    commentCidsToAccountsComments: CommentCidsToAccountsComments;
    accountsCommentsUpdating: {
        [commentCid: string]: boolean;
    };
    accountsCommentsReplies: AccountsCommentsReplies;
    accountsVotes: AccountsVotes;
    accountsEdits: AccountsEdits;
    accountsActions: {
        [functionName: string]: Function;
    };
    accountsActionsInternal: {
        [functionName: string]: Function;
    };
};
declare const accountsStore: import("zustand").UseBoundStore<import("zustand").StoreApi<AccountsState>>;
export declare const resetAccountsStore: () => Promise<void>;
export declare const resetAccountsDatabaseAndStore: () => Promise<void>;
export default accountsStore;
