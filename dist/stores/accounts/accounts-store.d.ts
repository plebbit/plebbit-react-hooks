import { AccountNamesToAccountIds, Accounts, AccountsComments, AccountsCommentsReplies } from '../../types';
export declare const listeners: any;
declare type AccountsState = {
    accounts: Accounts;
    accountIds: string[];
    activeAccountId: string | undefined;
    accountNamesToAccountIds: AccountNamesToAccountIds;
    accountsComments: AccountsComments;
    accountsCommentsUpdating: {
        [commendCid: string]: boolean;
    };
    accountsCommentsReplies: AccountsCommentsReplies;
    accountsVotes: any;
    accountsActions: {
        [key: string]: Function;
    };
    accountsActionsInternal: {
        [key: string]: Function;
    };
};
declare const accountsStore: import("zustand").UseBoundStore<import("zustand").StoreApi<AccountsState>>;
export declare const resetAccountsStore: () => Promise<void>;
export declare const resetAccountsDatabaseAndStore: () => Promise<void>;
export default accountsStore;
