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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountsContext = void 0;
const react_1 = __importStar(require("react"));
const validator_1 = __importDefault(require("../../lib/validator"));
const assert_1 = __importDefault(require("assert"));
const debug_1 = __importDefault(require("debug"));
const debug = (0, debug_1.default)('plebbitreacthooks:providers:accountsprovider');
const accounts_database_1 = __importDefault(require("./accounts-database"));
const account_generator_1 = __importDefault(require("./account-generator"));
const utils_1 = __importDefault(require("../../lib/utils"));
exports.AccountsContext = react_1.default.createContext(undefined);
function AccountsProvider(props) {
    const [accounts, setAccounts] = (0, react_1.useState)(undefined);
    const [accountIds, setAccountIds] = (0, react_1.useState)(undefined);
    const [activeAccountId, setActiveAccountId] = (0, react_1.useState)(undefined);
    const [accountNamesToAccountIds, setAccountNamesToAccountIds] = (0, react_1.useState)(undefined);
    const [accountsComments, setAccountsComments] = (0, react_1.useState)({});
    const [accountsCommentsReplies, setAccountsCommentsReplies] = (0, react_1.useState)({});
    const [accountsVotes, setAccountsVotes] = (0, react_1.useState)({});
    const accountsCommentsWithoutCids = useAccountsCommentsWithoutCids(accounts, accountsComments);
    const accountsNotifications = useAccountsNotifications(accounts, accountsCommentsReplies);
    const accountsWithCalculatedProperties = useAccountsWithCalculatedProperties(accounts, accountsComments, accountsNotifications);
    const accountsActions = {};
    accountsActions.setActiveAccount = (accountName) => __awaiter(this, void 0, void 0, function* () {
        (0, assert_1.default)(accountNamesToAccountIds, `can't use AccountContext.accountActions before initialized`);
        validator_1.default.validateAccountsActionsSetActiveAccountArguments(accountName);
        const accountId = accountNamesToAccountIds[accountName];
        yield accounts_database_1.default.accountsMetadataDatabase.setItem('activeAccountId', accountId);
        debug('accountsActions.setActiveAccount', { accountName, accountId });
        setActiveAccountId(accountId);
    });
    accountsActions.setAccount = (account) => __awaiter(this, void 0, void 0, function* () {
        validator_1.default.validateAccountsActionsSetAccountArguments(account);
        (0, assert_1.default)(accounts === null || accounts === void 0 ? void 0 : accounts[account.id], `cannot set account with account.id '${account.id}' id does not exist in database`);
        // use this function to serialize and update all databases
        yield accounts_database_1.default.addAccount(account);
        const [newAccount, accountNamesToAccountIds] = yield Promise.all([
            // use this function to deserialize
            accounts_database_1.default.getAccount(account.id),
            accounts_database_1.default.accountsMetadataDatabase.getItem('accountNamesToAccountIds'),
        ]);
        const newAccounts = Object.assign(Object.assign({}, accounts), { [newAccount.id]: newAccount });
        debug('accountsActions.setAccount', { account: newAccount });
        setAccounts(newAccounts);
        setAccountNamesToAccountIds(accountNamesToAccountIds);
    });
    accountsActions.setAccountsOrder = (newOrderedAccountNames) => __awaiter(this, void 0, void 0, function* () {
        (0, assert_1.default)(accounts && accountNamesToAccountIds, `can't use AccountContext.accountActions before initialized`);
        const accountIds = [];
        const accountNames = [];
        for (const accountName of newOrderedAccountNames) {
            const accountId = accountNamesToAccountIds[accountName];
            accountIds.push(accountId);
            accountNames.push(accounts[accountId].name);
        }
        validator_1.default.validateAccountsActionsSetAccountsOrderArguments(newOrderedAccountNames, accountNames);
        debug('accountsActions.setAccountsOrder', {
            previousAccountNames: accountNames,
            newAccountNames: newOrderedAccountNames,
        });
        yield accounts_database_1.default.accountsMetadataDatabase.setItem('accountIds', accountIds);
        setAccountIds(accountIds);
    });
    accountsActions.createAccount = (accountName) => __awaiter(this, void 0, void 0, function* () {
        const newAccount = yield account_generator_1.default.generateDefaultAccount();
        if (accountName) {
            newAccount.name = accountName;
        }
        yield accounts_database_1.default.addAccount(newAccount);
        const newAccounts = Object.assign(Object.assign({}, accounts), { [newAccount.id]: newAccount });
        const [newAccountIds, newActiveAccountId, accountNamesToAccountIds] = yield Promise.all([
            accounts_database_1.default.accountsMetadataDatabase.getItem('accountIds'),
            accounts_database_1.default.accountsMetadataDatabase.getItem('activeAccountId'),
            accounts_database_1.default.accountsMetadataDatabase.getItem('accountNamesToAccountIds'),
        ]);
        debug('accountsActions.createAccount', { accountName, account: newAccount });
        setAccounts(newAccounts);
        setAccountIds(newAccountIds);
        setAccountNamesToAccountIds(accountNamesToAccountIds);
        setAccountsComments(Object.assign(Object.assign({}, accountsComments), { [newAccount.id]: [] }));
        setAccountsVotes(Object.assign(Object.assign({}, accountsVotes), { [newAccount.id]: {} }));
    });
    accountsActions.deleteAccount = (accountName) => __awaiter(this, void 0, void 0, function* () {
        throw Error('TODO: not implemented');
        // TODO: delete account from provider and from persistant storage
        // change active account to another active account
        // handle the edge case of a user deleting all his account and having none
        // warn user to back up his private key or lose his account permanently
    });
    accountsActions.importAccount = (serializedAccount) => __awaiter(this, void 0, void 0, function* () {
        throw Error('TODO: not implemented');
        // TODO: deserialize account, import account, if account.name already exists, add ' 2', don't overwrite
        // the 'account' will contain AccountComments and AccountVotes
        // TODO: add options to only import private key, account settings, or include all account comments/votes history
    });
    accountsActions.exportAccount = (accountName) => __awaiter(this, void 0, void 0, function* () {
        throw Error('TODO: not implemented');
        // don't allow no account name to avoid catastrophic bugs
        validator_1.default.validateAccountsActionsExportAccountArguments(accountName);
        // TODO: return account as serialized JSON string for copy paste or save as file
        // the 'account' will contain AccountComments and AccountVotes
        // TODO: add options to only export private key, account settings, or include all account comments/votes history
    });
    accountsActions.publishComment = (publishCommentOptions, accountName) => __awaiter(this, void 0, void 0, function* () {
        (0, assert_1.default)(accounts && accountNamesToAccountIds && activeAccountId, `can't use AccountContext.accountActions before initialized`);
        let account = accounts[activeAccountId];
        if (accountName) {
            const accountId = accountNamesToAccountIds[accountName];
            account = accounts[accountId];
        }
        validator_1.default.validateAccountsActionsPublishCommentArguments({ publishCommentOptions, accountName, account });
        let createCommentOptions = Object.assign({ timestamp: Math.round(Date.now() / 1000), author: account.author, signer: account.signer }, publishCommentOptions);
        let accountCommentIndex;
        let comment = yield account.plebbit.createComment(createCommentOptions);
        const publishAndRetryFailedChallengeVerification = () => {
            comment.once('challenge', (challenge) => __awaiter(this, void 0, void 0, function* () {
                publishCommentOptions.onChallenge(challenge, comment);
            }));
            comment.once('challengeverification', (challengeVerification) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                publishCommentOptions.onChallengeVerification(challengeVerification, comment);
                if (!challengeVerification.challengeSuccess) {
                    // publish again automatically on fail
                    createCommentOptions = Object.assign(Object.assign({}, createCommentOptions), { timestamp: Math.round(Date.now() / 1000) });
                    comment = yield account.plebbit.createComment(createCommentOptions);
                    publishAndRetryFailedChallengeVerification();
                }
                else {
                    // the challengeverification message of a comment publication should in theory send back the CID
                    // of the published comment which is needed to resolve it for replies, upvotes, etc
                    if ((_a = challengeVerification === null || challengeVerification === void 0 ? void 0 : challengeVerification.publication) === null || _a === void 0 ? void 0 : _a.cid) {
                        const commentWithCid = Object.assign(Object.assign({}, createCommentOptions), { cid: challengeVerification.publication.cid });
                        yield accounts_database_1.default.addAccountComment(account.id, commentWithCid, accountCommentIndex);
                        setAccountsComments((previousAccountsComments) => {
                            const updatedAccountComments = [...previousAccountsComments[account.id]];
                            const updatedAccountComment = Object.assign(Object.assign({}, commentWithCid), { index: accountCommentIndex, accountId: account.id });
                            updatedAccountComments[accountCommentIndex] = updatedAccountComment;
                            return Object.assign(Object.assign({}, previousAccountsComments), { [account.id]: updatedAccountComments });
                        });
                        startUpdatingAccountCommentOnCommentUpdateEvents(comment, account, accountCommentIndex);
                    }
                }
            }));
            comment.publish();
        };
        publishAndRetryFailedChallengeVerification();
        yield accounts_database_1.default.addAccountComment(account.id, createCommentOptions);
        debug('accountsActions.publishComment', { createCommentOptions });
        setAccountsComments((previousAccountsComments) => {
            // save account comment index to update the comment later
            accountCommentIndex = previousAccountsComments[account.id].length;
            const createdAccountComment = Object.assign(Object.assign({}, createCommentOptions), { index: accountCommentIndex, accountId: account.id });
            return Object.assign(Object.assign({}, previousAccountsComments), { [account.id]: [...previousAccountsComments[account.id], createdAccountComment] });
        });
    });
    accountsActions.publishCommentEdit = (publishCommentEditOptions, accountName) => __awaiter(this, void 0, void 0, function* () {
        throw Error('TODO: not implemented');
    });
    accountsActions.deleteComment = (commentCidOrAccountCommentIndex, accountName) => __awaiter(this, void 0, void 0, function* () {
        throw Error('TODO: not implemented');
    });
    accountsActions.publishVote = (publishVoteOptions, accountName) => __awaiter(this, void 0, void 0, function* () {
        (0, assert_1.default)(accounts && accountNamesToAccountIds && activeAccountId, `can't use AccountContext.accountActions before initialized`);
        let account = accounts[activeAccountId];
        if (accountName) {
            const accountId = accountNamesToAccountIds[accountName];
            account = accounts[accountId];
        }
        validator_1.default.validateAccountsActionsPublishVoteArguments({ publishVoteOptions, accountName, account });
        let createVoteOptions = Object.assign({ timestamp: Math.round(Date.now() / 1000), author: account.author, signer: account.signer }, publishVoteOptions);
        let vote = yield account.plebbit.createVote(createVoteOptions);
        const publishAndRetryFailedChallengeVerification = () => {
            vote.once('challenge', (challenge) => __awaiter(this, void 0, void 0, function* () {
                publishVoteOptions.onChallenge(challenge, vote);
            }));
            vote.once('challengeverification', (challengeVerification) => __awaiter(this, void 0, void 0, function* () {
                publishVoteOptions.onChallengeVerification(challengeVerification, vote);
                if (!challengeVerification.challengeSuccess) {
                    // publish again automatically on fail
                    vote = yield account.plebbit.createVote(createVoteOptions);
                    publishAndRetryFailedChallengeVerification();
                }
            }));
            vote.publish();
        };
        publishAndRetryFailedChallengeVerification();
        yield accounts_database_1.default.addAccountVote(account.id, createVoteOptions);
        debug('accountsActions.publishVote', { createVoteOptions });
        setAccountsVotes(Object.assign(Object.assign({}, accountsVotes), { [account.id]: Object.assign(Object.assign({}, accountsVotes[account.id]), { [createVoteOptions.commentCid]: createVoteOptions }) }));
        return vote;
    });
    accountsActions.blockAddress = (address, accountName) => __awaiter(this, void 0, void 0, function* () {
        throw Error('TODO: not implemented');
    });
    accountsActions.limitAddress = (address, limitPercent, accountName) => __awaiter(this, void 0, void 0, function* () {
        // limit how many times per feed page an address can appear, limitPercent 1 = 100%, 0.1 = 10%, 0.001 = 0.1%
        throw Error('TODO: not implemented');
    });
    // internal accounts action: the comment CID is not known at the time of publishing, so every time
    // we fetch a new comment, check if its our own, and attempt to add the CID
    const addCidToAccountComment = (comment) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        (0, assert_1.default)(accounts, `can't use AccountContext.accountActions before initialized`);
        const accountCommentsWithoutCids = accountsCommentsWithoutCids[(_a = comment === null || comment === void 0 ? void 0 : comment.author) === null || _a === void 0 ? void 0 : _a.address];
        if (!accountCommentsWithoutCids) {
            return;
        }
        for (const accountComment of accountCommentsWithoutCids) {
            // if author address and timestamp is the same, we assume it's the right comment
            if (accountComment.timestamp && accountComment.timestamp === comment.timestamp) {
                const commentWithCid = utils_1.default.merge(accountComment, comment);
                yield accounts_database_1.default.addAccountComment(accountComment.accountId, commentWithCid, accountComment.index);
                setAccountsComments((previousAccountsComments) => {
                    const updatedAccountComments = [...previousAccountsComments[accountComment.accountId]];
                    updatedAccountComments[accountComment.index] = commentWithCid;
                    return Object.assign(Object.assign({}, previousAccountsComments), { [accountComment.accountId]: updatedAccountComments });
                });
                startUpdatingAccountCommentOnCommentUpdateEvents(comment, accounts[accountComment.accountId], accountComment.index);
                break;
            }
        }
    });
    // internal accounts action: mark an account's notifications as read
    const markAccountNotificationsAsRead = (account) => __awaiter(this, void 0, void 0, function* () {
        (0, assert_1.default)(typeof (account === null || account === void 0 ? void 0 : account.id) === 'string', `AccountContext.markAccountNotificationsAsRead invalid account argument '${account}'`);
        // find all unread replies
        const repliesToMarkAsRead = {};
        for (const replyCid in accountsCommentsReplies[account.id]) {
            if (!accountsCommentsReplies[account.id][replyCid].markedAsRead) {
                repliesToMarkAsRead[replyCid] = Object.assign(Object.assign({}, accountsCommentsReplies[account.id][replyCid]), { markedAsRead: true });
            }
        }
        // add all to database
        const promises = [];
        for (const replyCid in repliesToMarkAsRead) {
            promises.push(accounts_database_1.default.addAccountCommentReply(account.id, repliesToMarkAsRead[replyCid]));
        }
        yield Promise.all(promises);
        // add all to react context
        debug('AccountContext.markAccountNotificationsAsRead', { account, repliesToMarkAsRead });
        setAccountsCommentsReplies((previousAccountsCommentsReplies) => {
            const updatedAccountCommentsReplies = Object.assign(Object.assign({}, previousAccountsCommentsReplies[account.id]), repliesToMarkAsRead);
            return Object.assign(Object.assign({}, previousAccountsCommentsReplies), { [account.id]: updatedAccountCommentsReplies });
        });
    });
    // TODO: we currently subscribe to updates for every single comment
    // in the user's account history. This probably does not scale, we
    // need to eventually schedule and queue older comments to look
    // for updates at a lower priority.
    const [alreadyUpdatingAccountsComments, setAlreadyUpdatingAccountsComments] = (0, react_1.useState)({});
    const startUpdatingAccountCommentOnCommentUpdateEvents = (comment, account, accountCommentIndex) => __awaiter(this, void 0, void 0, function* () {
        (0, assert_1.default)(typeof accountCommentIndex === 'number', `startUpdatingAccountCommentOnCommentUpdateEvents accountCommentIndex '${accountCommentIndex}' not a number`);
        (0, assert_1.default)(typeof (account === null || account === void 0 ? void 0 : account.id) === 'string', `startUpdatingAccountCommentOnCommentUpdateEvents account '${account}' account.id '${account === null || account === void 0 ? void 0 : account.id}' not a string`);
        const commentArgument = comment;
        if (!comment.ipnsName) {
            if (!comment.cid) {
                // comment doesn't have an ipns name yet, so can't receive updates
                // and doesn't have a cid, so has no way to know the ipns name
                return;
            }
            comment = yield account.plebbit.getComment(comment.cid);
        }
        // account comment already updating
        if (alreadyUpdatingAccountsComments[comment.cid]) {
            return;
        }
        // comment is not a `Comment` instance
        if (!comment.on) {
            comment = yield account.plebbit.createComment(comment);
        }
        // @ts-ignore
        setAlreadyUpdatingAccountsComments((prev) => (Object.assign(Object.assign({}, prev), { [comment.cid]: true })));
        comment.on('update', (updatedComment) => __awaiter(this, void 0, void 0, function* () {
            var _b, _c, _d, _e, _f, _g, _h, _j;
            // merge should not be needed if plebbit-js is implemented properly, but no harm in fixing potential errors
            updatedComment = utils_1.default.merge(commentArgument, comment, updatedComment);
            yield accounts_database_1.default.addAccountComment(account.id, updatedComment, accountCommentIndex);
            setAccountsComments((previousAccountsComments) => {
                const updatedAccountComments = [...previousAccountsComments[account.id]];
                const previousComment = updatedAccountComments[accountCommentIndex];
                const updatedAccountComment = utils_1.default.clone(Object.assign(Object.assign({}, updatedComment), { index: accountCommentIndex, accountId: account.id }));
                updatedAccountComments[accountCommentIndex] = updatedAccountComment;
                return Object.assign(Object.assign({}, previousAccountsComments), { [account.id]: updatedAccountComments });
            });
            // update AccountCommentsReplies with new replies if has any new replies
            const replyPageArray = [
                (_c = (_b = updatedComment.replies) === null || _b === void 0 ? void 0 : _b.pages) === null || _c === void 0 ? void 0 : _c.new,
                (_e = (_d = updatedComment.replies) === null || _d === void 0 ? void 0 : _d.pages) === null || _e === void 0 ? void 0 : _e.topAll,
                (_g = (_f = updatedComment.replies) === null || _f === void 0 ? void 0 : _f.pages) === null || _g === void 0 ? void 0 : _g.old,
                (_j = (_h = updatedComment.replies) === null || _h === void 0 ? void 0 : _h.pages) === null || _j === void 0 ? void 0 : _j.controversialAll,
            ];
            const hasReplies = replyPageArray
                .map((replyPage) => { var _a; return ((_a = replyPage === null || replyPage === void 0 ? void 0 : replyPage.comments) === null || _a === void 0 ? void 0 : _a.length) || 0; })
                .reduce((prev, curr) => prev + curr) > 0;
            if (hasReplies) {
                setAccountsCommentsReplies((previousAccountsCommentsReplies) => {
                    var _a, _b;
                    // check which replies are read or not
                    const updatedAccountCommentsReplies = {};
                    for (const replyPage of replyPageArray) {
                        for (const reply of (replyPage === null || replyPage === void 0 ? void 0 : replyPage.comments) || []) {
                            const markedAsRead = ((_b = (_a = previousAccountsCommentsReplies[account.id]) === null || _a === void 0 ? void 0 : _a[reply.cid]) === null || _b === void 0 ? void 0 : _b.markedAsRead) === true ? true : false;
                            updatedAccountCommentsReplies[reply.cid] = Object.assign(Object.assign({}, reply), { markedAsRead });
                        }
                    }
                    // add all to database
                    const promises = [];
                    for (const replyCid in updatedAccountCommentsReplies) {
                        promises.push(accounts_database_1.default.addAccountCommentReply(account.id, updatedAccountCommentsReplies[replyCid]));
                    }
                    Promise.all(promises);
                    // set new react context
                    const newAccountCommentsReplies = Object.assign(Object.assign({}, previousAccountsCommentsReplies[account.id]), updatedAccountCommentsReplies);
                    return Object.assign(Object.assign({}, previousAccountsCommentsReplies), { [account.id]: newAccountCommentsReplies });
                });
            }
        }));
        comment.update();
    });
    // load accounts from database once on load
    (0, react_1.useEffect)(() => {
        ;
        (() => __awaiter(this, void 0, void 0, function* () {
            let accountIds, activeAccountId, accounts, accountNamesToAccountIds;
            accountIds = (yield accounts_database_1.default.accountsMetadataDatabase.getItem('accountIds')) || undefined;
            // get accounts from database if any
            if (accountIds === null || accountIds === void 0 ? void 0 : accountIds.length) {
                ;
                [activeAccountId, accounts, accountNamesToAccountIds] = yield Promise.all([
                    accounts_database_1.default.accountsMetadataDatabase.getItem('activeAccountId'),
                    accounts_database_1.default.getAccounts(accountIds),
                    accounts_database_1.default.accountsMetadataDatabase.getItem('accountNamesToAccountIds'),
                ]);
            }
            // no accounts in database, create a default account
            else {
                const defaultAccount = yield account_generator_1.default.generateDefaultAccount();
                yield accounts_database_1.default.addAccount(defaultAccount);
                accounts = { [defaultAccount.id]: defaultAccount };
                [accountIds, activeAccountId, accountNamesToAccountIds] = yield Promise.all([
                    accounts_database_1.default.accountsMetadataDatabase.getItem('accountIds'),
                    accounts_database_1.default.accountsMetadataDatabase.getItem('activeAccountId'),
                    accounts_database_1.default.accountsMetadataDatabase.getItem('accountNamesToAccountIds'),
                ]);
                (0, assert_1.default)(accountIds && activeAccountId && accountNamesToAccountIds, `AccountsProvider error creating a default account during initialization`);
            }
            const [accountsComments, accountsVotes, accountsCommentsReplies] = yield Promise.all([
                accounts_database_1.default.getAccountsComments(accountIds),
                accounts_database_1.default.getAccountsVotes(accountIds),
                accounts_database_1.default.getAccountsCommentsReplies(accountIds),
            ]);
            setAccounts(accounts);
            setAccountIds(accountIds);
            setActiveAccountId(activeAccountId);
            setAccountNamesToAccountIds(accountNamesToAccountIds);
            setAccountsComments(accountsComments);
            setAccountsVotes(accountsVotes);
            setAccountsCommentsReplies(accountsCommentsReplies);
            // start looking for updates for all accounts comments in database
            for (const accountId in accountsComments) {
                for (const accountComment of accountsComments[accountId]) {
                    startUpdatingAccountCommentOnCommentUpdateEvents(accountComment, accounts[accountId], accountComment.index);
                }
            }
        }))();
    }, []);
    if (!props.children) {
        return null;
    }
    // don't give access to any context until first load
    let accountsContext;
    if (accountIds && accounts && accountNamesToAccountIds) {
        accountsContext = {
            accounts: accountsWithCalculatedProperties,
            accountIds,
            activeAccountId,
            accountNamesToAccountIds,
            accountsActions,
            accountsComments,
            accountsVotes,
            accountsNotifications,
            // internal accounts actions
            addCidToAccountComment,
            markAccountNotificationsAsRead,
        };
    }
    debug({
        accountsContext: accountsContext && {
            accounts: accountsWithCalculatedProperties,
            accountIds,
            activeAccountId,
            accountNamesToAccountIds,
            accountsComments,
            accountsVotes,
            accountsNotifications,
            accountsCommentsWithoutCids,
        },
    });
    return react_1.default.createElement(exports.AccountsContext.Provider, { value: accountsContext }, props.children);
}
exports.default = AccountsProvider;
const useAccountsNotifications = (accounts, accountsCommentsReplies) => {
    return (0, react_1.useMemo)(() => {
        const accountsNotifications = {};
        if (!accountsCommentsReplies) {
            return accountsNotifications;
        }
        for (const accountId in accountsCommentsReplies) {
            // get reply notifications
            const accountCommentsReplies = [];
            for (const replyCid in accountsCommentsReplies[accountId]) {
                const reply = accountsCommentsReplies[accountId][replyCid];
                // TODO: filter blocked addresses
                // if (accounts[accountId].blockedAddress[reply.subplebbitAddress] || accounts[accountId].blockedAddress[reply.author.address]) {
                //   continue
                // }
                accountCommentsReplies.push(reply);
            }
            // TODO: at some point we should also add upvote notifications like 'your post has gotten 10 upvotes'
            accountsNotifications[accountId] = accountCommentsReplies.sort((a, b) => b.timestamp - a.timestamp);
        }
        return accountsNotifications;
    }, [accounts, accountsCommentsReplies]);
};
const useAccountsCommentsWithoutCids = (accounts, accountsComments) => {
    return (0, react_1.useMemo)(() => {
        var _a;
        const accountsCommentsWithoutCids = {};
        if (!accounts || !accountsComments) {
            return accountsCommentsWithoutCids;
        }
        for (const accountId in accountsComments) {
            const accountComments = accountsComments[accountId];
            const account = accounts[accountId];
            for (const accountCommentIndex in accountComments) {
                const accountComment = accountComments[accountCommentIndex];
                if (!accountComment.cid) {
                    const authorAddress = (_a = account === null || account === void 0 ? void 0 : account.author) === null || _a === void 0 ? void 0 : _a.address;
                    if (!authorAddress) {
                        continue;
                    }
                    if (!accountsCommentsWithoutCids[authorAddress]) {
                        accountsCommentsWithoutCids[authorAddress] = [];
                    }
                    accountsCommentsWithoutCids[authorAddress].push(accountComment);
                }
            }
        }
        return accountsCommentsWithoutCids;
    }, [accountsComments]);
};
// add calculated properties to accounts, like karma and unreadNotificationCount
const useAccountsWithCalculatedProperties = (accounts, accountsComments, accountsNotifications) => {
    return (0, react_1.useMemo)(() => {
        if (!accounts) {
            return;
        }
        if (!accountsComments) {
            return accounts;
        }
        const accountsWithCalculatedProperties = Object.assign({}, accounts);
        // add karma
        for (const accountId in accountsComments) {
            const account = accounts[accountId];
            const accountComments = accountsComments[accountId];
            if (!accountComments || !account) {
                continue;
            }
            const karma = {
                commentUpvoteCount: 0,
                commentDownvoteCount: 0,
                commentScore: 0,
                linkUpvoteCount: 0,
                linkDownvoteCount: 0,
                linkScore: 0,
                upvoteCount: 0,
                downvoteCount: 0,
                score: 0,
            };
            for (const comment of accountComments) {
                if (comment.parentCid && comment.upvoteCount) {
                    karma.commentUpvoteCount += comment.upvoteCount;
                }
                if (comment.parentCid && comment.downvoteCount) {
                    karma.commentDownvoteCount += comment.downvoteCount;
                }
                if (!comment.parentCid && comment.upvoteCount) {
                    karma.linkUpvoteCount += comment.upvoteCount;
                }
                if (!comment.parentCid && comment.downvoteCount) {
                    karma.linkDownvoteCount += comment.downvoteCount;
                }
            }
            karma.commentScore = karma.commentUpvoteCount - karma.commentDownvoteCount;
            karma.linkScore = karma.linkUpvoteCount - karma.linkDownvoteCount;
            karma.upvoteCount = karma.commentUpvoteCount + karma.linkUpvoteCount;
            karma.downvoteCount = karma.commentDownvoteCount + karma.linkDownvoteCount;
            karma.score = karma.upvoteCount - karma.downvoteCount;
            const accountWithCalculatedProperties = Object.assign(Object.assign({}, account), { karma });
            accountsWithCalculatedProperties[accountId] = accountWithCalculatedProperties;
        }
        // add unreadNotificationCount
        for (const accountId in accountsWithCalculatedProperties) {
            let unreadNotificationCount = 0;
            for (const notification of (accountsNotifications === null || accountsNotifications === void 0 ? void 0 : accountsNotifications[accountId]) || []) {
                if (!notification.markedAsRead) {
                    unreadNotificationCount++;
                }
            }
            accountsWithCalculatedProperties[accountId].unreadNotificationCount = unreadNotificationCount;
        }
        return accountsWithCalculatedProperties;
    }, [accounts, accountsComments, accountsNotifications]);
};
