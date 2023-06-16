import type { Account, AccountPublicationsFilter, AccountsCommentsReplies, AccountCommentsReplies, AccountsComments, AccountComments, Accounts, AccountsNotifications, AccountCommentReply } from '../../types';
/**
 * Filter publications, for example only get comments that are posts, votes in a certain subplebbit, etc.
 * Check AccountPublicationsFilter type in types.tsx for more information, e.g. filter = {subplebbitAddresses: ['memes.eth']}.
 */
export declare const filterPublications: (publications: any, filter: AccountPublicationsFilter) => any[];
export declare const useCalculatedNotifications: (account?: Account, accountCommentsReplies?: AccountCommentsReplies) => AccountCommentReply[];
export declare const useCalculatedAccountsNotifications: (accounts?: Accounts, accountsCommentsReplies?: AccountsCommentsReplies) => AccountsNotifications;
export declare const useAccountWithCalculatedProperties: (account?: Accounts, accountComments?: AccountComments, accountCommentsReplies?: AccountCommentsReplies) => any;
export declare const useAccountsWithCalculatedProperties: (accounts?: Accounts, accountsComments?: AccountsComments, accountsCommentsReplies?: AccountsCommentsReplies) => Accounts | undefined;
