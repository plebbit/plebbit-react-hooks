import { useAccount, useAccounts, useAccountComment, useAccountComments, useAccountVotes, useAccountVote, useAccountEdits, useEditedComment, useNotifications, useAccountSubplebbits, usePubsubSubscribe } from './hooks/accounts';
import { useComment, useComments, useValidateComment } from './hooks/comments';
import { useReplies } from './hooks/replies';
import { useSubplebbit, useSubplebbits, useSubplebbitStats, useResolvedSubplebbitAddress } from './hooks/subplebbits';
import { useFeed, useBufferedFeeds } from './hooks/feeds';
import { useAuthor, useAuthorComments, useAuthorAvatar, useResolvedAuthorAddress, useAuthorAddress, setAuthorAvatarsWhitelistedTokenAddresses } from './hooks/authors';
import { useSubscribe, useBlock, usePublishComment, usePublishVote, useCreateSubplebbit, usePublishCommentEdit, usePublishCommentModeration, usePublishSubplebbitEdit } from './hooks/actions';
import { createAccount, deleteAccount, setAccount, setActiveAccount, setAccountsOrder, importAccount, exportAccount, deleteSubplebbit } from './stores/accounts/accounts-actions';
import { useClientsStates, useSubplebbitsStates } from './hooks/states';
import { usePlebbitRpcSettings } from './hooks/plebbit-rpc';
import { setPlebbitJs, restorePlebbitJs } from './lib/plebbit-js';
import { deleteDatabases, deleteCaches } from './lib/debug-utils';
export * from './types';
export { useAccount, useAccounts, useAccountComment, useAccountComments, useAccountVotes, useAccountVote, useAccountEdits, useAccountSubplebbits, useNotifications, usePubsubSubscribe, useComment, useComments, useEditedComment, useValidateComment, useReplies, useSubplebbit, useSubplebbits, useSubplebbitStats, useResolvedSubplebbitAddress, useAuthor, useAuthorComments, useAuthorAvatar, useResolvedAuthorAddress, useAuthorAddress, setAuthorAvatarsWhitelistedTokenAddresses, useFeed, useBufferedFeeds, useSubscribe, useBlock, usePublishComment, usePublishVote, usePublishCommentEdit, usePublishCommentModeration, usePublishSubplebbitEdit, useCreateSubplebbit, createAccount, deleteAccount, setAccount, setActiveAccount, setAccountsOrder, importAccount, exportAccount, deleteSubplebbit, useClientsStates, useSubplebbitsStates, usePlebbitRpcSettings, setPlebbitJs, restorePlebbitJs, deleteDatabases, deleteCaches, };
declare const hooks: {
    useAccount: typeof useAccount;
    useAccounts: typeof useAccounts;
    useAccountComment: typeof useAccountComment;
    useAccountComments: typeof useAccountComments;
    useAccountVotes: typeof useAccountVotes;
    useAccountVote: typeof useAccountVote;
    useAccountEdits: typeof useAccountEdits;
    useAccountSubplebbits: typeof useAccountSubplebbits;
    useNotifications: typeof useNotifications;
    usePubsubSubscribe: typeof usePubsubSubscribe;
    useComment: typeof useComment;
    useComments: typeof useComments;
    useEditedComment: typeof useEditedComment;
    useValidateComment: typeof useValidateComment;
    useReplies: typeof useReplies;
    useSubplebbit: typeof useSubplebbit;
    useSubplebbits: typeof useSubplebbits;
    useSubplebbitStats: typeof useSubplebbitStats;
    useResolvedSubplebbitAddress: typeof useResolvedSubplebbitAddress;
    useAuthor: typeof useAuthor;
    useAuthorComments: typeof useAuthorComments;
    useAuthorAvatar: typeof useAuthorAvatar;
    useResolvedAuthorAddress: typeof useResolvedAuthorAddress;
    useAuthorAddress: typeof useAuthorAddress;
    setAuthorAvatarsWhitelistedTokenAddresses: (tokenAddresses: string[]) => void;
    useFeed: typeof useFeed;
    useBufferedFeeds: typeof useBufferedFeeds;
    useSubscribe: typeof useSubscribe;
    useBlock: typeof useBlock;
    usePublishComment: typeof usePublishComment;
    usePublishVote: typeof usePublishVote;
    usePublishCommentEdit: typeof usePublishCommentEdit;
    usePublishCommentModeration: typeof usePublishCommentModeration;
    usePublishSubplebbitEdit: typeof usePublishSubplebbitEdit;
    useCreateSubplebbit: typeof useCreateSubplebbit;
    createAccount: (accountName?: string | undefined) => Promise<void>;
    deleteAccount: (accountName?: string | undefined) => Promise<void>;
    setAccount: (account: import("./types").Account) => Promise<void>;
    setActiveAccount: (accountName: string) => Promise<void>;
    setAccountsOrder: (newOrderedAccountNames: string[]) => Promise<void>;
    importAccount: (serializedAccount: string) => Promise<void>;
    exportAccount: (accountName?: string | undefined) => Promise<string>;
    deleteSubplebbit: (subplebbitAddress: string, accountName?: string | undefined) => Promise<void>;
    useClientsStates: typeof useClientsStates;
    useSubplebbitsStates: typeof useSubplebbitsStates;
    usePlebbitRpcSettings: typeof usePlebbitRpcSettings;
    setPlebbitJs: typeof setPlebbitJs;
    restorePlebbitJs: typeof restorePlebbitJs;
    deleteDatabases: () => Promise<[void, void, any, any, any]>;
    deleteCaches: () => Promise<[any, any, any]>;
};
export default hooks;
