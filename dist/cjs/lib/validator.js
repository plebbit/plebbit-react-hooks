"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFeedSortType = exports.validateUseSubplebbitsArguments = exports.validateUseSubplebbitArguments = exports.validateUseCommentsArguments = exports.validateUseCommentArguments = exports.validateAccountsDatabaseAddAccountArguments = exports.validateAccountsProviderAccountNames = exports.validateAccountsDatabaseGetAccountsArguments = exports.validateAccountsActionsSetActiveAccountArguments = exports.validateAccountsActionsSetAccountArguments = exports.validateAccountsActionsSetAccountsOrderArguments = exports.validateAccountsActionsExportAccountArguments = exports.validateAccountsActionsPublishVoteArguments = exports.validateAccountsActionsPublishCommentArguments = void 0;
const assert_1 = __importDefault(require("assert"));
const validateAccountsActionsPublishCommentArguments = ({ publishCommentOptions, accountName, account, }) => {
    (0, assert_1.default)(!accountName || typeof accountName === 'string', `publishComment accountName '${accountName}' not a string`);
    (0, assert_1.default)(accountName !== '', `publishComment accountName argument is empty string`);
    (0, assert_1.default)(!accountName || account, `publishComment no account with name '${accountName}' in AccountsContext`);
    (0, assert_1.default)(publishCommentOptions && typeof publishCommentOptions === 'object', 'publishComment publishCommentOptions not an object');
    (0, assert_1.default)(typeof publishCommentOptions.onChallenge === 'function', 'publishComment publishCommentOptions.onChallenge not a function');
    (0, assert_1.default)(typeof publishCommentOptions.onChallengeVerification === 'function', 'publishComment publishCommentOptions.onChallengeVerification not a function');
    (0, assert_1.default)(typeof publishCommentOptions.subplebbitAddress === 'string', 'publishComment publishCommentOptions.subplebbitAddress not a string');
    (0, assert_1.default)(!publishCommentOptions.parentCid || typeof publishCommentOptions.parentCid === 'string', 'publishComment publishCommentOptions.parentCid not a string');
    (0, assert_1.default)(typeof publishCommentOptions.content === 'string', 'publishComment publishCommentOptions.content not a string');
    (0, assert_1.default)(publishCommentOptions.content !== '', 'publishComment publishCommentOptions.content is an empty string');
    (0, assert_1.default)(!publishCommentOptions.timestamp || typeof publishCommentOptions.timestamp === 'number', 'publishComment publishCommentOptions.timestamp is not a number');
};
exports.validateAccountsActionsPublishCommentArguments = validateAccountsActionsPublishCommentArguments;
const validateAccountsActionsPublishVoteArguments = ({ publishVoteOptions, accountName, account }) => {
    (0, assert_1.default)(!accountName || typeof accountName === 'string', `publishVote accountName '${accountName}' not a string`);
    (0, assert_1.default)(accountName !== '', `publishVote accountName argument is empty string`);
    (0, assert_1.default)(!accountName || account, `publishVote no account with name '${accountName}' in AccountsContext`);
    (0, assert_1.default)(publishVoteOptions && typeof publishVoteOptions === 'object', 'publishVote publishVoteOptions not an object');
    (0, assert_1.default)(typeof publishVoteOptions.onChallenge === 'function', 'publishVote publishVoteOptions.onChallenge not a function');
    (0, assert_1.default)(typeof publishVoteOptions.onChallengeVerification === 'function', 'publishVote publishVoteOptions.onChallengeVerification not a function');
    (0, assert_1.default)(typeof publishVoteOptions.subplebbitAddress === 'string', 'publishVote publishVoteOptions.subplebbitAddress not a string');
    (0, assert_1.default)(typeof publishVoteOptions.commentCid === 'string', 'publishVote publishVoteOptions.commentCid not a string');
    (0, assert_1.default)(publishVoteOptions.vote === 1 || publishVoteOptions.vote === 0 || publishVoteOptions.vote === -1, 'publishVote publishVoteOptions.vote not 1, 0 or -1');
    (0, assert_1.default)(!publishVoteOptions.timestamp || typeof publishVoteOptions.timestamp === 'number', 'publishVote publishVoteOptions.timestamp is not a number');
};
exports.validateAccountsActionsPublishVoteArguments = validateAccountsActionsPublishVoteArguments;
const validateAccountsActionsExportAccountArguments = (accountName) => {
    (0, assert_1.default)(typeof accountName === 'string', `exportAccount accountName '${accountName}' not a string`);
    (0, assert_1.default)(accountName !== '', `exportAccount accountName argument is empty string`);
};
exports.validateAccountsActionsExportAccountArguments = validateAccountsActionsExportAccountArguments;
const validateAccountsActionsSetAccountsOrderArguments = (newOrderedAccountNames, accountNames) => {
    (0, assert_1.default)(JSON.stringify([...accountNames].sort()) === JSON.stringify([...newOrderedAccountNames].sort()), `previous account names '${accountNames} contain different account names than argument newOrderedAccountNames '${newOrderedAccountNames}'`);
};
exports.validateAccountsActionsSetAccountsOrderArguments = validateAccountsActionsSetAccountsOrderArguments;
const validateAccountsActionsSetAccountArguments = (account) => {
    (0, assert_1.default)(account && typeof account === 'object', `setAccount account '${account}' not an object`);
    (0, assert_1.default)(typeof account.name === 'string', `setAccount account.name '${account.name}' not a string`);
    (0, assert_1.default)(account.name !== '', `setAccount account.name is empty string`);
    (0, assert_1.default)(typeof account.id === 'string', `setAccount account.id '${account.id}' not a string`);
    (0, assert_1.default)(account.id !== '', `setAccount account.id is empty string`);
};
exports.validateAccountsActionsSetAccountArguments = validateAccountsActionsSetAccountArguments;
const validateAccountsActionsSetActiveAccountArguments = (accountName) => {
    (0, assert_1.default)(typeof accountName === 'string', `setActiveAccountName accountName '${accountName}' not a string`);
    (0, assert_1.default)(accountName !== '', `setActiveAccountName accountName argument is empty string`);
};
exports.validateAccountsActionsSetActiveAccountArguments = validateAccountsActionsSetActiveAccountArguments;
const validateAccountsDatabaseGetAccountsArguments = (accountIds) => {
    (0, assert_1.default)(Array.isArray(accountIds), `accountsDatabase.getAccounts accountIds '${accountIds}' not an array`);
    (0, assert_1.default)(accountIds.length > 0, `accountsDatabase.getAccounts accountIds '${accountIds}' is empty`);
    for (const accountId of accountIds) {
        (0, assert_1.default)(typeof accountId === 'string', `accountsDatabase.getAccountsaccountIds '${accountIds}' accountId '${accountId}' not a string`);
        (0, assert_1.default)(accountId !== '', `accountsDatabase.getAccounts accountIds '${accountIds}' an accountId argument is empty string`);
    }
};
exports.validateAccountsDatabaseGetAccountsArguments = validateAccountsDatabaseGetAccountsArguments;
const validateAccountsProviderAccountNames = (accountNames) => {
    (0, assert_1.default)(Array.isArray(accountNames), `AccountsProviders accountNames '${accountNames}' not an array`);
    for (const accountName of accountNames) {
        (0, assert_1.default)(typeof accountName === 'string', `AccountsProviders accountNames '${accountNames}' accountName '${accountName}' not a string`);
    }
};
exports.validateAccountsProviderAccountNames = validateAccountsProviderAccountNames;
const validateAccountsDatabaseAddAccountArguments = (account) => {
    (0, assert_1.default)(account && typeof account === 'object', `accountsDatabase.addAccount '${account}' not an object`);
    (0, assert_1.default)(typeof account.name === 'string', `accountsDatabase.addAccount account.name '${account.name}' not a string`);
    (0, assert_1.default)(account.name !== '', `accountsDatabase.addAccount account.name is empty string`);
    (0, assert_1.default)(typeof account.id === 'string', `accountsDatabase.addAccount account.id '${account.id}' not a string`);
    (0, assert_1.default)(account.id !== '', `accountsDatabase.addAccount account.id is empty string`);
};
exports.validateAccountsDatabaseAddAccountArguments = validateAccountsDatabaseAddAccountArguments;
const validateUseCommentArguments = (commentCid, account) => {
    (0, assert_1.default)(typeof commentCid === 'string', `useComment commentCid '${commentCid}' not a string`);
    (0, assert_1.default)((account === null || account === void 0 ? void 0 : account.plebbit) && typeof (account === null || account === void 0 ? void 0 : account.plebbit) === 'object', `useComment account.plebbit '${account === null || account === void 0 ? void 0 : account.plebbit}' not an object`);
};
exports.validateUseCommentArguments = validateUseCommentArguments;
const validateUseCommentsArguments = (commentCids, account) => {
    (0, assert_1.default)(Array.isArray(commentCids), 'useComment commentCids not an array');
    for (const commentCid of commentCids) {
        (0, assert_1.default)(typeof commentCid === 'string', `useComments commentCids '${commentCids}' commentCid '${commentCid}' not a string`);
    }
    (0, assert_1.default)((account === null || account === void 0 ? void 0 : account.plebbit) && typeof (account === null || account === void 0 ? void 0 : account.plebbit) === 'object', `useComments account.plebbit '${account === null || account === void 0 ? void 0 : account.plebbit}' not an object`);
};
exports.validateUseCommentsArguments = validateUseCommentsArguments;
const validateUseSubplebbitArguments = (subplebbitAddress, account) => {
    (0, assert_1.default)(typeof subplebbitAddress === 'string', `useSubplebbit subplebbitAddress '${subplebbitAddress}' not a string`);
    (0, assert_1.default)((account === null || account === void 0 ? void 0 : account.plebbit) && typeof (account === null || account === void 0 ? void 0 : account.plebbit) === 'object', `useSubplebbit account.plebbit '${account === null || account === void 0 ? void 0 : account.plebbit}' not an object`);
};
exports.validateUseSubplebbitArguments = validateUseSubplebbitArguments;
const validateUseSubplebbitsArguments = (subplebbitAddresses, account) => {
    (0, assert_1.default)(Array.isArray(subplebbitAddresses), 'useSubplebbit subplebbitAddresses not an array');
    for (const subplebbitAddress of subplebbitAddresses) {
        (0, assert_1.default)(typeof subplebbitAddress === 'string', `useSubplebbits subplebbitAddresses '${subplebbitAddresses}' subplebbitAddress '${subplebbitAddress}' not a string`);
    }
    (0, assert_1.default)((account === null || account === void 0 ? void 0 : account.plebbit) && typeof (account === null || account === void 0 ? void 0 : account.plebbit) === 'object', `useSubplebbit account.plebbit '${account === null || account === void 0 ? void 0 : account.plebbit}' not an object`);
};
exports.validateUseSubplebbitsArguments = validateUseSubplebbitsArguments;
const feedSortTypes = new Set([
    'hot',
    'new',
    'topHour',
    'topDay',
    'topWeek',
    'topMonth',
    'topYear',
    'topAll',
    'controversialHour',
    'controversialDay',
    'controversialWeek',
    'controversialMonth',
    'controversialYear',
    'controversialAll',
]);
const validateFeedSortType = (sortType) => {
    (0, assert_1.default)(feedSortTypes.has(sortType), `invalid feed sort type '${sortType}'`);
};
exports.validateFeedSortType = validateFeedSortType;
const validator = {
    validateAccountsActionsPublishCommentArguments: exports.validateAccountsActionsPublishCommentArguments,
    validateAccountsActionsPublishVoteArguments: exports.validateAccountsActionsPublishVoteArguments,
    validateAccountsActionsExportAccountArguments: exports.validateAccountsActionsExportAccountArguments,
    validateAccountsActionsSetAccountsOrderArguments: exports.validateAccountsActionsSetAccountsOrderArguments,
    validateAccountsActionsSetAccountArguments: exports.validateAccountsActionsSetAccountArguments,
    validateAccountsActionsSetActiveAccountArguments: exports.validateAccountsActionsSetActiveAccountArguments,
    validateAccountsDatabaseAddAccountArguments: exports.validateAccountsDatabaseAddAccountArguments,
    validateAccountsDatabaseGetAccountsArguments: exports.validateAccountsDatabaseGetAccountsArguments,
    validateAccountsProviderAccountNames: exports.validateAccountsProviderAccountNames,
    validateUseCommentArguments: exports.validateUseCommentArguments,
    validateUseCommentsArguments: exports.validateUseCommentsArguments,
    validateUseSubplebbitArguments: exports.validateUseSubplebbitArguments,
    validateUseSubplebbitsArguments: exports.validateUseSubplebbitsArguments,
    validateFeedSortType: exports.validateFeedSortType,
};
exports.default = validator;
