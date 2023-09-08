import type { Account, AccountsCommentsReplies, AccountCommentsReplies, AccountsComments, AccountComments, Accounts, AccountsNotifications, AccountCommentReply } from '../../types';
export declare const useCalculatedNotifications: (account?: Account, accountCommentsReplies?: AccountCommentsReplies) => AccountCommentReply[];
export declare const useCalculatedAccountsNotifications: (accounts?: Accounts, accountsCommentsReplies?: AccountsCommentsReplies) => AccountsNotifications;
export declare const useAccountWithCalculatedProperties: (account?: Accounts, accountComments?: AccountComments, accountCommentsReplies?: AccountCommentsReplies) => any;
export declare const useAccountsWithCalculatedProperties: (accounts?: Accounts, accountsComments?: AccountsComments, accountsCommentsReplies?: AccountsCommentsReplies) => Accounts | undefined;
