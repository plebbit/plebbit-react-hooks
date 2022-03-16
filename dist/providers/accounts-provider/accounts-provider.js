var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useState, useEffect, useMemo } from 'react';
import validator from '../../lib/validator';
import assert from 'assert';
import Debug from 'debug';
const debug = Debug('plebbitreacthooks:providers:accountsprovider');
import accountsDatabase from './accounts-database';
import accountGenerator from './account-generator';
import utils from '../../lib/utils';
export const AccountsContext = React.createContext(undefined);
export default function AccountsProvider(props) {
    const [accounts, setAccounts] = useState(undefined);
    const [accountIds, setAccountIds] = useState(undefined);
    const [activeAccountId, setActiveAccountId] = useState(undefined);
    const [accountNamesToAccountIds, setAccountNamesToAccountIds] = useState(undefined);
    const [accountsComments, setAccountsComments] = useState({});
    const [accountsVotes, setAccountsVotes] = useState({});
    const accountsCommentsWithoutCids = useAccountsCommentsWithoutCids(accounts, accountsComments);
    const accountsWithCalculatedProperties = useAccountsWithCalculatedProperties(accounts, accountsComments);
    const accountsActions = {};
    accountsActions.setActiveAccount = (accountName) => __awaiter(this, void 0, void 0, function* () {
        assert(accountNamesToAccountIds, `can't use AccountContext.accountActions before initialized`);
        validator.validateAccountsActionsSetActiveAccountArguments(accountName);
        const accountId = accountNamesToAccountIds[accountName];
        yield accountsDatabase.accountsMetadataDatabase.setItem('activeAccountId', accountId);
        debug('accountsActions.setActiveAccount', { accountName, accountId });
        setActiveAccountId(accountId);
    });
    accountsActions.setAccount = (account) => __awaiter(this, void 0, void 0, function* () {
        validator.validateAccountsActionsSetAccountArguments(account);
        assert(accounts === null || accounts === void 0 ? void 0 : accounts[account.id], `cannot set account with account.id '${account.id}' id does not exist in database`);
        // use this function to serialize and update all databases
        yield accountsDatabase.addAccount(account);
        const [newAccount, accountNamesToAccountIds] = yield Promise.all([
            // use this function to deserialize
            accountsDatabase.getAccount(account.id),
            accountsDatabase.accountsMetadataDatabase.getItem('accountNamesToAccountIds'),
        ]);
        const newAccounts = Object.assign(Object.assign({}, accounts), { [newAccount.id]: newAccount });
        debug('accountsActions.setAccount', { account: newAccount });
        setAccounts(newAccounts);
        setAccountNamesToAccountIds(accountNamesToAccountIds);
    });
    accountsActions.setAccountsOrder = (newOrderedAccountNames) => __awaiter(this, void 0, void 0, function* () {
        assert(accounts && accountNamesToAccountIds, `can't use AccountContext.accountActions before initialized`);
        const accountIds = [];
        const accountNames = [];
        for (const accountName of newOrderedAccountNames) {
            const accountId = accountNamesToAccountIds[accountName];
            accountIds.push(accountId);
            accountNames.push(accounts[accountId].name);
        }
        validator.validateAccountsActionsSetAccountsOrderArguments(newOrderedAccountNames, accountNames);
        debug('accountsActions.setAccountsOrder', {
            previousAccountNames: accountNames,
            newAccountNames: newOrderedAccountNames,
        });
        yield accountsDatabase.accountsMetadataDatabase.setItem('accountIds', accountIds);
        setAccountIds(accountIds);
    });
    accountsActions.createAccount = (accountName) => __awaiter(this, void 0, void 0, function* () {
        const newAccount = yield accountGenerator.generateDefaultAccount();
        if (accountName) {
            newAccount.name = accountName;
        }
        yield accountsDatabase.addAccount(newAccount);
        const newAccounts = Object.assign(Object.assign({}, accounts), { [newAccount.id]: newAccount });
        const [newAccountIds, newActiveAccountId, accountNamesToAccountIds] = yield Promise.all([
            accountsDatabase.accountsMetadataDatabase.getItem('accountIds'),
            accountsDatabase.accountsMetadataDatabase.getItem('activeAccountId'),
            accountsDatabase.accountsMetadataDatabase.getItem('accountNamesToAccountIds'),
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
        validator.validateAccountsActionsExportAccountArguments(accountName);
        // TODO: return account as serialized JSON string for copy paste or save as file
        // the 'account' will contain AccountComments and AccountVotes
        // TODO: add options to only export private key, account settings, or include all account comments/votes history
    });
    accountsActions.publishComment = (publishCommentOptions, accountName) => __awaiter(this, void 0, void 0, function* () {
        assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use AccountContext.accountActions before initialized`);
        let account = accounts[activeAccountId];
        if (accountName) {
            const accountId = accountNamesToAccountIds[accountName];
            account = accounts[accountId];
        }
        validator.validateAccountsActionsPublishCommentArguments({ publishCommentOptions, accountName, account });
        let createCommentOptions = {
            subplebbitAddress: publishCommentOptions.subplebbitAddress,
            parentCommentCid: publishCommentOptions.parentCommentCid,
            postCid: publishCommentOptions.postCid,
            content: publishCommentOptions.content,
            title: publishCommentOptions.title,
            timestamp: Math.round(Date.now() / 1000),
            author: account.author,
            signer: account.signer,
        };
        let accountCommentIndex;
        let comment = account.plebbit.createComment(createCommentOptions);
        const publishAndRetryFailedChallengeVerification = () => {
            comment.once('challenge', (challenge) => __awaiter(this, void 0, void 0, function* () {
                publishCommentOptions.onChallenge(challenge, comment);
            }));
            comment.once('challengeverification', (challengeVerification) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                publishCommentOptions.onChallengeVerification(challengeVerification, comment);
                if (!challengeVerification.challengeAnswerIsVerified) {
                    // publish again automatically on fail
                    createCommentOptions = Object.assign(Object.assign({}, createCommentOptions), { timestamp: Math.round(Date.now() / 1000) });
                    comment = account.plebbit.createComment(createCommentOptions);
                    publishAndRetryFailedChallengeVerification();
                }
                else {
                    // the challengeverification message of a comment publication should in theory send back the CID
                    // of the published comment which is needed to resolve it for replies, upvotes, etc
                    if ((_a = challengeVerification === null || challengeVerification === void 0 ? void 0 : challengeVerification.publication) === null || _a === void 0 ? void 0 : _a.cid) {
                        const commentWithCid = Object.assign(Object.assign({}, createCommentOptions), { cid: challengeVerification.publication.cid });
                        yield accountsDatabase.addAccountComment(account.id, commentWithCid, accountCommentIndex);
                        setAccountsComments((previousAccounsComments) => {
                            const updatedAccountComments = [...previousAccounsComments[account.id]];
                            const updatedAccountComment = Object.assign(Object.assign({}, commentWithCid), { index: accountCommentIndex, accountId: account.id });
                            updatedAccountComments[accountCommentIndex] = updatedAccountComment;
                            return Object.assign(Object.assign({}, previousAccounsComments), { [account.id]: updatedAccountComments });
                        });
                        startUpdatingAccountCommentOnCommentUpdateEvents(comment, account, accountCommentIndex);
                    }
                }
            }));
            comment.publish();
        };
        publishAndRetryFailedChallengeVerification();
        yield accountsDatabase.addAccountComment(account.id, createCommentOptions);
        debug('accountsActions.publishComment', { createCommentOptions });
        setAccountsComments((previousAccounsComments) => {
            // save account comment index to update the comment later
            accountCommentIndex = previousAccounsComments[account.id].length;
            const createdAccountComment = Object.assign(Object.assign({}, createCommentOptions), { index: accountCommentIndex, accountId: account.id });
            return Object.assign(Object.assign({}, previousAccounsComments), { [account.id]: [...previousAccounsComments[account.id], createdAccountComment] });
        });
    });
    accountsActions.publishCommentEdit = (publishCommentEditOptions, accountName) => __awaiter(this, void 0, void 0, function* () {
        throw Error('TODO: not implemented');
    });
    accountsActions.deleteComment = (commentCidOrAccountCommentIndex, accountName) => __awaiter(this, void 0, void 0, function* () {
        throw Error('TODO: not implemented');
    });
    accountsActions.publishVote = (publishVoteOptions, accountName) => __awaiter(this, void 0, void 0, function* () {
        assert(accounts && accountNamesToAccountIds && activeAccountId, `can't use AccountContext.accountActions before initialized`);
        let account = accounts[activeAccountId];
        if (accountName) {
            const accountId = accountNamesToAccountIds[accountName];
            account = accounts[accountId];
        }
        validator.validateAccountsActionsPublishVoteArguments({ publishVoteOptions, accountName, account });
        const createVoteOptions = {
            subplebbitAddress: publishVoteOptions.subplebbitAddress,
            vote: publishVoteOptions.vote,
            commentCid: publishVoteOptions.commentCid,
            timestamp: publishVoteOptions.timestamp || Math.round(Date.now() / 1000),
            author: account.author,
            signer: account.signer,
        };
        let vote = account.plebbit.createVote(createVoteOptions);
        const publishAndRetryFailedChallengeVerification = () => {
            vote.once('challenge', (challenge) => __awaiter(this, void 0, void 0, function* () {
                publishVoteOptions.onChallenge(challenge, vote);
            }));
            vote.once('challengeverification', (challengeVerification) => __awaiter(this, void 0, void 0, function* () {
                publishVoteOptions.onChallengeVerification(challengeVerification, vote);
                if (!challengeVerification.challengeAnswerIsVerified) {
                    // publish again automatically on fail
                    vote = account.plebbit.createVote(createVoteOptions);
                    publishAndRetryFailedChallengeVerification();
                }
            }));
            vote.publish();
        };
        publishAndRetryFailedChallengeVerification();
        yield accountsDatabase.addAccountVote(account.id, createVoteOptions);
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
        assert(accounts, `can't use AccountContext.accountActions before initialized`);
        const accountCommentsWithoutCids = accountsCommentsWithoutCids[(_a = comment === null || comment === void 0 ? void 0 : comment.author) === null || _a === void 0 ? void 0 : _a.address];
        if (!accountCommentsWithoutCids) {
            return;
        }
        for (const accountComment of accountCommentsWithoutCids) {
            // if author address and timestamp is the same, we assume it's the right comment
            if (accountComment.timestamp && accountComment.timestamp === comment.timestamp) {
                const commentWithCid = utils.merge(accountComment, comment);
                yield accountsDatabase.addAccountComment(accountComment.accountId, commentWithCid, accountComment.index);
                setAccountsComments((previousAccounsComments) => {
                    const updatedAccountComments = [...previousAccounsComments[accountComment.accountId]];
                    updatedAccountComments[accountComment.index] = commentWithCid;
                    return Object.assign(Object.assign({}, previousAccounsComments), { [accountComment.accountId]: updatedAccountComments });
                });
                startUpdatingAccountCommentOnCommentUpdateEvents(comment, accounts[accountComment.accountId], accountComment.index);
                break;
            }
        }
    });
    // TODO: we currently subscribe to updates for every single comment
    // in the user's account history. This probably does not scale, we
    // need to eventually schedule and queue older comments to look 
    // for updates at a lower priority.
    const [alreadyUpdatingAccountsComments, setAlreadyUpdatingAccountsComments] = useState({});
    const startUpdatingAccountCommentOnCommentUpdateEvents = (comment, account, accountCommentIndex) => __awaiter(this, void 0, void 0, function* () {
        assert(typeof accountCommentIndex === 'number', `startUpdatingAccountCommentOnCommentUpdateEvents accountCommentIndex '${accountCommentIndex}' not a number`);
        assert(typeof (account === null || account === void 0 ? void 0 : account.id) === 'string', `startUpdatingAccountCommentOnCommentUpdateEvents account '${account}' account.id '${account === null || account === void 0 ? void 0 : account.id}' not a string`);
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
            comment = account.plebbit.createComment(comment);
        }
        // @ts-ignore
        setAlreadyUpdatingAccountsComments(prev => (Object.assign(Object.assign({}, prev), { [comment.cid]: true })));
        comment.on('update', (updatedComment) => __awaiter(this, void 0, void 0, function* () {
            // merge should not be needed if plebbit-js is implemented properly, but no harm in fixing potential errors
            updatedComment = utils.merge(commentArgument, comment, updatedComment);
            yield accountsDatabase.addAccountComment(account.id, updatedComment, accountCommentIndex);
            setAccountsComments((previousAccounsComments) => {
                const updatedAccountComments = [...previousAccounsComments[account.id]];
                const previousComment = updatedAccountComments[accountCommentIndex];
                const updatedAccountComment = utils.clone(Object.assign(Object.assign({}, updatedComment), { index: accountCommentIndex, accountId: account.id }));
                updatedAccountComments[accountCommentIndex] = updatedAccountComment;
                return Object.assign(Object.assign({}, previousAccounsComments), { [account.id]: updatedAccountComments });
            });
        }));
        comment.update();
    });
    // load accounts from database once on load
    useEffect(() => {
        ;
        (() => __awaiter(this, void 0, void 0, function* () {
            let accountIds, activeAccountId, accounts, accountNamesToAccountIds;
            accountIds = (yield accountsDatabase.accountsMetadataDatabase.getItem('accountIds')) || undefined;
            // get accounts from database if any
            if (accountIds === null || accountIds === void 0 ? void 0 : accountIds.length) {
                ;
                [activeAccountId, accounts, accountNamesToAccountIds] = yield Promise.all([
                    accountsDatabase.accountsMetadataDatabase.getItem('activeAccountId'),
                    accountsDatabase.getAccounts(accountIds),
                    accountsDatabase.accountsMetadataDatabase.getItem('accountNamesToAccountIds'),
                ]);
            }
            // no accounts in database, create a default account
            else {
                const defaultAccount = yield accountGenerator.generateDefaultAccount();
                yield accountsDatabase.addAccount(defaultAccount);
                accounts = { [defaultAccount.id]: defaultAccount };
                [accountIds, activeAccountId, accountNamesToAccountIds] = yield Promise.all([
                    accountsDatabase.accountsMetadataDatabase.getItem('accountIds'),
                    accountsDatabase.accountsMetadataDatabase.getItem('activeAccountId'),
                    accountsDatabase.accountsMetadataDatabase.getItem('accountNamesToAccountIds'),
                ]);
            }
            const [accountsComments, accountsVotes] = yield Promise.all([
                // @ts-ignore
                accountsDatabase.getAccountsComments(accountIds),
                // @ts-ignore
                accountsDatabase.getAccountsVotes(accountIds),
            ]);
            setAccounts(accounts);
            setAccountIds(accountIds);
            setActiveAccountId(activeAccountId);
            setAccountNamesToAccountIds(accountNamesToAccountIds);
            setAccountsComments(accountsComments);
            setAccountsVotes(accountsVotes);
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
            // internal accounts actions
            addCidToAccountComment,
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
            accountsCommentsWithoutCids,
        },
    });
    return React.createElement(AccountsContext.Provider, { value: accountsContext }, props.children);
}
const useAccountsCommentsWithoutCids = (accounts, accountsComments) => {
    const accountsCommentsWithoutCids = useMemo(() => {
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
    return accountsCommentsWithoutCids;
};
// add calculated properties to accounts, like karma
const useAccountsWithCalculatedProperties = (accounts, accountsComments) => {
    return useMemo(() => {
        if (!accounts) {
            return;
        }
        if (!accountsComments) {
            return accounts;
        }
        const accountsWithCalculatedProperties = Object.assign({}, accounts);
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
                score: 0
            };
            for (const comment of accountComments) {
                if (comment.parentCommentCid && comment.upvoteCount) {
                    karma.commentUpvoteCount += comment.upvoteCount;
                }
                if (comment.parentCommentCid && comment.downvoteCount) {
                    karma.commentDownvoteCount += comment.downvoteCount;
                }
                if (!comment.parentCommentCid && comment.upvoteCount) {
                    karma.linkUpvoteCount += comment.upvoteCount;
                }
                if (!comment.parentCommentCid && comment.downvoteCount) {
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
        return accountsWithCalculatedProperties;
    }, [accounts, accountsComments]);
};
