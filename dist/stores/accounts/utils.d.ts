import { Account, Subplebbits, AccountComment, AccountsComments, CommentCidsToAccountsComments, Comment } from '../../types';
export declare const getAccountSubplebbits: (account: Account, subplebbits: Subplebbits) => any;
export declare const getCommentCidsToAccountsComments: (accountsComments: AccountsComments) => CommentCidsToAccountsComments;
export declare const fetchCommentLinkDimensions: (link: string) => Promise<{
    linkWidth?: undefined;
    linkHeight?: undefined;
} | {
    linkWidth: any;
    linkHeight: any;
}>;
export declare const getInitAccountCommentsToUpdate: (accountsComments: AccountsComments) => {
    accountComment: AccountComment;
    accountId: string;
}[];
export declare const getAccountCommentDepth: (comment: Comment) => number | undefined;
declare const utils: {
    getAccountSubplebbits: (account: Account, subplebbits: Subplebbits) => any;
    getCommentCidsToAccountsComments: (accountsComments: AccountsComments) => CommentCidsToAccountsComments;
    fetchCommentLinkDimensions: (link: string) => Promise<{
        linkWidth?: undefined;
        linkHeight?: undefined;
    } | {
        linkWidth: any;
        linkHeight: any;
    }>;
    getInitAccountCommentsToUpdate: (accountsComments: AccountsComments) => {
        accountComment: AccountComment;
        accountId: string;
    }[];
    getAccountCommentDepth: (comment: Comment) => number | undefined;
};
export default utils;
