var _a;
// fix DEBUG_DEPTH bug https://github.com/debug-js/debug/issues/746
if ((_a = process === null || process === void 0 ? void 0 : process.env) === null || _a === void 0 ? void 0 : _a.DEBUG_DEPTH) {
    require("util").inspect.defaultOptions.depth = process.env.DEBUG_DEPTH;
}
import PlebbitProvider from './providers/plebbit-provider';
import { useAccount, useAccounts, useAccountsActions, useAccountComments, useAccountVotes, useAccountVote, } from './hooks/accounts';
import { useComment, useComments } from './hooks/comments';
import { useSubplebbit, useSubplebbits } from './hooks/subplebbits';
import { useFeed, useBufferedFeeds } from './hooks/feeds';
export * from './types';
export { PlebbitProvider, useAccount, useAccounts, useAccountsActions, useAccountComments, useAccountVotes, useAccountVote, useComment, useComments, useSubplebbit, useSubplebbits, useFeed, useBufferedFeeds };
const hooks = {
    PlebbitProvider,
    useAccount,
    useAccounts,
    useAccountsActions,
    useAccountComments,
    useAccountVotes,
    useAccountVote,
    useComment,
    useSubplebbit,
    useSubplebbits,
    useFeed,
    useBufferedFeeds
};
export default hooks;