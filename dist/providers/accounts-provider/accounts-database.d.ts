import { Accounts, CreateCommentOptions, Account, Comment, AccountsComments, AccountCommentReply, AccountsCommentsReplies } from '../../types';
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
    getAccountJson: (accountId: string) => Promise<string>;
    getAccounts: (accountIds: string[]) => Promise<Accounts>;
    getAccount: (accountId: string) => Promise<any>;
    addAccountCommentReply: (accountId: string, reply: AccountCommentReply) => Promise<void>;
    getAccountCommentsReplies: (accountId: string) => Promise<{}>;
    getAccountsCommentsReplies: (accountIds: string[]) => Promise<AccountsCommentsReplies>;
};
export default database;
