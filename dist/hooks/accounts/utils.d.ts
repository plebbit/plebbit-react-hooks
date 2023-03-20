import type { Account, AccountPublicationsFilter, AccountsCommentsReplies, AccountCommentsReplies, AccountsComments, AccountComments, Accounts, AccountsNotifications, AccountCommentReply } from '../../types';
/**
 * Filter publications, for example only get comments that are posts, votes in a certain subplebbit, etc.
 * Check AccountPublicationsFilter type in types.tsx for more information, e.g. filter = {subplebbitAddresses: ['memes.eth']}.
 */
export declare const filterPublications: (publications: any, filter: AccountPublicationsFilter) => any[];
export declare const useCalculatedNotifications: (account?: Account | undefined, accountCommentsReplies?: AccountCommentsReplies | undefined) => AccountCommentReply[];
export declare const useCalculatedAccountsNotifications: (accounts?: Accounts | undefined, accountsCommentsReplies?: AccountsCommentsReplies | undefined) => AccountsNotifications;
export declare const useAccountWithCalculatedProperties: (account?: Accounts | undefined, accountComments?: AccountComments | undefined, accountCommentsReplies?: AccountCommentsReplies | undefined) => any;
export declare const useAccountsWithCalculatedProperties: (accounts?: Accounts | undefined, accountsComments?: AccountsComments | undefined, accountsCommentsReplies?: AccountsCommentsReplies | undefined) => Accounts | undefined;
