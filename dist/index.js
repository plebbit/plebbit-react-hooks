import polyfill from './lib/polyfill';
polyfill();
// fix DEBUG_DEPTH bug https://github.com/debug-js/debug/issues/746
try {
    if (process.env.DEBUG_DEPTH) {
        require('util').inspect.defaultOptions.depth = process.env.DEBUG_DEPTH;
    }
    if (process.env.DEBUG_ARRAY) {
        require('util').inspect.defaultOptions.maxArrayLength = process.env.DEBUG_ARRAY;
    }
}
catch (e) { }
// accounts
import { useAccount, useAccounts, useAccountComment, useAccountComments, useAccountVotes, useAccountVote, useAccountEdits, useEditedComment, useNotifications, useAccountSubplebbits, usePubsubSubscribe, } from './hooks/accounts';
// comments
import { useComment, useComments, useValidateComment } from './hooks/comments';
// replies
import { useReplies } from './hooks/replies';
// subplebbits
import { useSubplebbit, useSubplebbits, useSubplebbitStats, useResolvedSubplebbitAddress } from './hooks/subplebbits';
// feeds
import { useFeed, useBufferedFeeds } from './hooks/feeds';
// authors
import { useAuthor, useAuthorComments, useAuthorAvatar, useResolvedAuthorAddress, useAuthorAddress, setAuthorAvatarsWhitelistedTokenAddresses } from './hooks/authors';
// actions
import { useSubscribe, useBlock, usePublishComment, usePublishVote, useCreateSubplebbit, usePublishCommentEdit, usePublishCommentModeration, usePublishSubplebbitEdit, } from './hooks/actions';
// actions that don't have their own hooks yet
import { createAccount, deleteAccount, setAccount, setActiveAccount, setAccountsOrder, importAccount, exportAccount, deleteSubplebbit, } from './stores/accounts/accounts-actions';
// states
import { useClientsStates, useSubplebbitsStates } from './hooks/states';
// plebbit-rpc
import { usePlebbitRpcSettings } from './hooks/plebbit-rpc';
// chain
import { getEthWalletFromPlebbitPrivateKey, getSolWalletFromPlebbitPrivateKey, getEthPrivateKeyFromPlebbitPrivateKey, getSolPrivateKeyFromPlebbitPrivateKey, } from './lib/chain';
// utils
import { setPlebbitJs, restorePlebbitJs } from './lib/plebbit-js';
import { deleteDatabases, deleteCaches } from './lib/debug-utils';
// types
export * from './types';
// IMPORTANT: should be the same as 'export default hooks'
export { 
// accounts
useAccount, useAccounts, useAccountComment, useAccountComments, useAccountVotes, useAccountVote, useAccountEdits, useAccountSubplebbits, useNotifications, usePubsubSubscribe, 
// comments
useComment, useComments, useEditedComment, useValidateComment, 
// replies
useReplies, 
// subplebbits
useSubplebbit, useSubplebbits, useSubplebbitStats, useResolvedSubplebbitAddress, 
// authors
useAuthor, useAuthorComments, useAuthorAvatar, useResolvedAuthorAddress, useAuthorAddress, setAuthorAvatarsWhitelistedTokenAddresses, 
// feeds
useFeed, useBufferedFeeds, 
// actions
useSubscribe, useBlock, usePublishComment, usePublishVote, usePublishCommentEdit, usePublishCommentModeration, usePublishSubplebbitEdit, useCreateSubplebbit, 
// actions that don't have their own hooks yet
createAccount, deleteAccount, setAccount, setActiveAccount, setAccountsOrder, importAccount, exportAccount, deleteSubplebbit, 
// states
useClientsStates, useSubplebbitsStates, 
// plebbit-rpc
usePlebbitRpcSettings, 
// chain
getEthWalletFromPlebbitPrivateKey, getSolWalletFromPlebbitPrivateKey, getEthPrivateKeyFromPlebbitPrivateKey, getSolPrivateKeyFromPlebbitPrivateKey, 
// utils
setPlebbitJs, restorePlebbitJs, deleteDatabases, deleteCaches, };
// IMPORTANT: should be the same as 'export {}'
const hooks = {
    // accounts
    useAccount,
    useAccounts,
    useAccountComment,
    useAccountComments,
    useAccountVotes,
    useAccountVote,
    useAccountEdits,
    useAccountSubplebbits,
    useNotifications,
    usePubsubSubscribe,
    // comments
    useComment,
    useComments,
    useEditedComment,
    useValidateComment,
    // replies
    useReplies,
    // subplebbits
    useSubplebbit,
    useSubplebbits,
    useSubplebbitStats,
    useResolvedSubplebbitAddress,
    // authors
    useAuthor,
    useAuthorComments,
    useAuthorAvatar,
    useResolvedAuthorAddress,
    useAuthorAddress,
    setAuthorAvatarsWhitelistedTokenAddresses,
    // feeds
    useFeed,
    useBufferedFeeds,
    // actions
    useSubscribe,
    useBlock,
    usePublishComment,
    usePublishVote,
    usePublishCommentEdit,
    usePublishCommentModeration,
    usePublishSubplebbitEdit,
    useCreateSubplebbit,
    // actions that don't have their own hooks yet
    createAccount,
    deleteAccount,
    setAccount,
    setActiveAccount,
    setAccountsOrder,
    importAccount,
    exportAccount,
    deleteSubplebbit,
    // states
    useClientsStates,
    useSubplebbitsStates,
    // plebbit-rpc
    usePlebbitRpcSettings,
    // chain
    getEthWalletFromPlebbitPrivateKey,
    getSolWalletFromPlebbitPrivateKey,
    getEthPrivateKeyFromPlebbitPrivateKey,
    getSolPrivateKeyFromPlebbitPrivateKey,
    // utils
    setPlebbitJs,
    restorePlebbitJs,
    deleteDatabases,
    deleteCaches,
};
export default hooks;
