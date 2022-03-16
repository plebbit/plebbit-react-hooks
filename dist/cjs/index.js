"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.useBufferedFeeds = exports.useFeed = exports.useSubplebbits = exports.useSubplebbit = exports.useComments = exports.useComment = exports.useAccountVote = exports.useAccountVotes = exports.useAccountComments = exports.useAccountsActions = exports.useAccounts = exports.useAccount = exports.PlebbitProvider = void 0;
// fix DEBUG_DEPTH bug https://github.com/debug-js/debug/issues/746
if ((_a = process === null || process === void 0 ? void 0 : process.env) === null || _a === void 0 ? void 0 : _a.DEBUG_DEPTH) {
    require("util").inspect.defaultOptions.depth = process.env.DEBUG_DEPTH;
}
const plebbit_provider_1 = __importDefault(require("./providers/plebbit-provider"));
exports.PlebbitProvider = plebbit_provider_1.default;
const accounts_1 = require("./hooks/accounts");
Object.defineProperty(exports, "useAccount", { enumerable: true, get: function () { return accounts_1.useAccount; } });
Object.defineProperty(exports, "useAccounts", { enumerable: true, get: function () { return accounts_1.useAccounts; } });
Object.defineProperty(exports, "useAccountsActions", { enumerable: true, get: function () { return accounts_1.useAccountsActions; } });
Object.defineProperty(exports, "useAccountComments", { enumerable: true, get: function () { return accounts_1.useAccountComments; } });
Object.defineProperty(exports, "useAccountVotes", { enumerable: true, get: function () { return accounts_1.useAccountVotes; } });
Object.defineProperty(exports, "useAccountVote", { enumerable: true, get: function () { return accounts_1.useAccountVote; } });
const comments_1 = require("./hooks/comments");
Object.defineProperty(exports, "useComment", { enumerable: true, get: function () { return comments_1.useComment; } });
Object.defineProperty(exports, "useComments", { enumerable: true, get: function () { return comments_1.useComments; } });
const subplebbits_1 = require("./hooks/subplebbits");
Object.defineProperty(exports, "useSubplebbit", { enumerable: true, get: function () { return subplebbits_1.useSubplebbit; } });
Object.defineProperty(exports, "useSubplebbits", { enumerable: true, get: function () { return subplebbits_1.useSubplebbits; } });
const feeds_1 = require("./hooks/feeds");
Object.defineProperty(exports, "useFeed", { enumerable: true, get: function () { return feeds_1.useFeed; } });
Object.defineProperty(exports, "useBufferedFeeds", { enumerable: true, get: function () { return feeds_1.useBufferedFeeds; } });
__exportStar(require("./types"), exports);
const hooks = {
    PlebbitProvider: plebbit_provider_1.default,
    useAccount: accounts_1.useAccount,
    useAccounts: accounts_1.useAccounts,
    useAccountsActions: accounts_1.useAccountsActions,
    useAccountComments: accounts_1.useAccountComments,
    useAccountVotes: accounts_1.useAccountVotes,
    useAccountVote: accounts_1.useAccountVote,
    useComment: comments_1.useComment,
    useSubplebbit: subplebbits_1.useSubplebbit,
    useSubplebbits: subplebbits_1.useSubplebbits,
    useFeed: feeds_1.useFeed,
    useBufferedFeeds: feeds_1.useBufferedFeeds
};
exports.default = hooks;
