import { Account, Comment, Subplebbit } from '../../types';
export declare const startUpdatingAccountCommentOnCommentUpdateEvents: (comment: Comment, account: Account, accountCommentIndex: number) => Promise<void>;
export declare const addCidToAccountComment: (comment: Comment) => Promise<void>;
export declare const markAccountNotificationsAsRead: (account: Account) => Promise<void>;
export declare const addSubplebbitRoleToAccountsSubplebbits: (subplebbit: Subplebbit) => Promise<void>;
