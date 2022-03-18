"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentsContext = void 0;
const react_1 = __importStar(require("react"));
const accounts_provider_1 = require("./accounts-provider");
const localforage_lru_1 = __importDefault(require("../lib/localforage-lru"));
const commentsDatabase = localforage_lru_1.default.createInstance({ name: 'comments', size: 5000 });
const debug_1 = __importDefault(require("debug"));
const debug = (0, debug_1.default)('plebbitreacthooks:providers:commentsprovider');
const utils_1 = __importDefault(require("../lib/utils"));
exports.CommentsContext = react_1.default.createContext(undefined);
const plebbitGetCommentPending = {};
function CommentsProvider(props) {
    const accountsContext = (0, react_1.useContext)(accounts_provider_1.AccountsContext);
    const [comments, setComments] = (0, react_1.useState)({});
    const commentsActions = {};
    commentsActions.addCommentToContext = async (commentId, account) => {
        // comment is in context already, do nothing
        let comment = comments[commentId];
        if (comment || plebbitGetCommentPending[commentId + account.id]) {
            return;
        }
        // try to find comment in database
        comment = await getCommentFromDatabase(commentId, account);
        // comment not in database, fetch from plebbit-js
        if (!comment) {
            plebbitGetCommentPending[commentId + account.id] = true;
            comment = await account.plebbit.getComment(commentId);
            await commentsDatabase.setItem(commentId, utils_1.default.clone(comment));
        }
        debug('commentsActions.addCommentToContext', { commentId, comment, account });
        setComments((previousComments) => (Object.assign(Object.assign({}, previousComments), { [commentId]: utils_1.default.clone(comment) })));
        plebbitGetCommentPending[commentId + account.id] = false;
        // the comment is still missing up to date mutable data like upvotes, edits, replies, etc
        comment.on('update', async (updatedComment) => {
            updatedComment = utils_1.default.clone(updatedComment);
            await commentsDatabase.setItem(commentId, updatedComment);
            debug('commentsContext comment update', { commentId, updatedComment, account });
            setComments((previousComments) => (Object.assign(Object.assign({}, previousComments), { [commentId]: updatedComment })));
        });
        comment.update();
        // when publishing a comment, you don't yet know its CID
        // so when a new comment is fetched, check to see if it's your own
        // comment, and if yes, add the CID to your account comments database
        if (accountsContext === null || accountsContext === void 0 ? void 0 : accountsContext.addCidToAccountComment) {
            await accountsContext.addCidToAccountComment(comment);
        }
    };
    if (!props.children) {
        return null;
    }
    const commentsContext = {
        comments,
        commentsActions,
    };
    debug({ commentsContext: comments });
    return react_1.default.createElement(exports.CommentsContext.Provider, { value: commentsContext }, props.children);
}
exports.default = CommentsProvider;
const getCommentFromDatabase = async (commentId, account) => {
    const commentData = await commentsDatabase.getItem(commentId);
    if (!commentData) {
        return;
    }
    const comment = account.plebbit.createComment(commentData);
    // add potential missing data from the database onto the comment instance
    // should not be necessary if Plebbit.createComment is implemented properly
    for (const prop in commentData) {
        if (comment[prop] === undefined || comment[prop] === null) {
            if (commentData[prop] !== undefined && commentData[prop] !== null)
                comment[prop] = commentData[prop];
        }
    }
    return comment;
};
