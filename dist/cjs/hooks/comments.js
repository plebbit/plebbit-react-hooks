"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useComments = exports.useComment = void 0;
const react_1 = require("react");
const accounts_1 = require("./accounts");
const comments_provider_1 = require("../providers/comments-provider");
const validator_1 = __importDefault(require("../lib/validator"));
const debug_1 = __importDefault(require("debug"));
const debug = (0, debug_1.default)('plebbitreacthooks:hooks:comments');
/**
 * @param commentCid - The IPFS CID of the comment to get
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
function useComment(commentCid, accountName) {
    const account = (0, accounts_1.useAccount)(accountName);
    const commentsContext = (0, react_1.useContext)(comments_provider_1.CommentsContext);
    const comment = commentCid && commentsContext.comments[commentCid];
    (0, react_1.useEffect)(() => {
        if (!commentCid || !account) {
            return;
        }
        validator_1.default.validateUseCommentArguments(commentCid, account);
        if (!comment) {
            // if comment isn't already in context, add it
            commentsContext.commentsActions.addCommentToContext(commentCid, account);
        }
    }, [commentCid, account]);
    debug('useComment', { commentsContext: commentsContext.comments, comment, account });
    return comment;
}
exports.useComment = useComment;
/**
 * @param commentCids - The IPFS CIDs of the comments to get
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
function useComments(commentCids, accountName) {
    const account = (0, accounts_1.useAccount)(accountName);
    const commentsContext = (0, react_1.useContext)(comments_provider_1.CommentsContext);
    const comments = [];
    for (const commentCid of commentCids || []) {
        comments.push(commentsContext.comments[commentCid]);
    }
    (0, react_1.useEffect)(() => {
        if (!commentCids || !account) {
            return;
        }
        validator_1.default.validateUseCommentsArguments(commentCids, account);
        const uniqueCommentCids = new Set(commentCids);
        for (const commentCid of uniqueCommentCids) {
            // if comment isn't already in context, add it
            if (!commentsContext.comments[commentCid]) {
                commentsContext.commentsActions.addCommentToContext(commentCid, account);
            }
        }
    }, [commentCids, account]);
    debug('useComments', { commentsContext: commentsContext.comments, comments, account });
    return comments;
}
exports.useComments = useComments;
