import { Accounts, CreateCommentOptions, Account, Comment, AccountsComments } from '../../types';
declare const database: {
    accountsDatabase: LocalForage;
    accountsMetadataDatabase: LocalForage;
    getAccountsVotes: (accountIds: string[]) => Promise<any>;
    getAccountVotes: (accountId: string) => Promise<any>;
    addAccountVote: (accountId: string, createVoteOptions: CreateCommentOptions) => Promise<void>;
    getAccountsComments: (accountIds: string[]) => Promise<AccountsComments>;
    getAccountComments: (accountId: string) => Promise<any[]>;
    addAccountComment: (accountId: string, comment: CreateCommentOptions | Comment, accountCommentIndex?: number | undefined) => Promise<void>;
    addAccount: (account: Account) => Promise<void>;
    getAccounts: (accountIds: string[]) => Promise<Accounts>;
    getAccount: (accountId: string) => Promise<any>;
};
export default database;
