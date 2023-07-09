import { Account, Subplebbits, AccountsComments, CommentCidsToAccountsComments } from '../../types';
export declare const getAccountSubplebbits: (account: Account, subplebbits: Subplebbits) => any;
export declare const getCommentCidsToAccountsComments: (accountsComments: AccountsComments) => CommentCidsToAccountsComments;
export declare const fetchCommentLinkDimensions: (link: string) => Promise<{
    linkHeight: any;
    linkWidth: any;
} | {
    linkHeight?: undefined;
    linkWidth?: undefined;
}>;
declare const utils: {
    getAccountSubplebbits: (account: Account, subplebbits: Subplebbits) => any;
    getCommentCidsToAccountsComments: (accountsComments: AccountsComments) => CommentCidsToAccountsComments;
    fetchCommentLinkDimensions: (link: string) => Promise<{
        linkHeight: any;
        linkWidth: any;
    } | {
        linkHeight?: undefined;
        linkWidth?: undefined;
    }>;
};
export default utils;
