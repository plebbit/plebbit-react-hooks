import { Account, Subplebbits, AccountsComments, CommentCidsToAccountsComments } from '../../types';
export declare const getAccountSubplebbits: (account: Account, subplebbits: Subplebbits) => any;
export declare const getCommentCidsToAccountsComments: (accountsComments: AccountsComments) => CommentCidsToAccountsComments;
export declare const fetchCommentLinkDimensions: (link: string) => Promise<{
    linkWidth: any;
    linkHeight: any;
} | {
    linkWidth?: undefined;
    linkHeight?: undefined;
}>;
declare const utils: {
    getAccountSubplebbits: (account: Account, subplebbits: Subplebbits) => any;
    getCommentCidsToAccountsComments: (accountsComments: AccountsComments) => CommentCidsToAccountsComments;
    fetchCommentLinkDimensions: (link: string) => Promise<{
        linkWidth: any;
        linkHeight: any;
    } | {
        linkWidth?: undefined;
        linkHeight?: undefined;
    }>;
};
export default utils;
