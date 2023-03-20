// internal accounts actions that are not called by the user
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import accountsStore, { listeners } from './accounts-store';
import accountsDatabase from './accounts-database';
import Logger from '@plebbit/plebbit-logger';
import assert from 'assert';
const log = Logger('plebbit-react-hooks:accounts:stores');
import utils from '../../lib/utils';
// TODO: we currently subscribe to updates for every single comment
// in the user's account history. This probably does not scale, we
// need to eventually schedule and queue older comments to look
// for updates at a lower priority.
export const startUpdatingAccountCommentOnCommentUpdateEvents = (comment, account, accountCommentIndex) => __awaiter(void 0, void 0, void 0, function* () {
    assert(typeof accountCommentIndex === 'number', `startUpdatingAccountCommentOnCommentUpdateEvents accountCommentIndex '${accountCommentIndex}' not a number`);
    assert(typeof (account === null || account === void 0 ? void 0 : account.id) === 'string', `startUpdatingAccountCommentOnCommentUpdateEvents account '${account}' account.id '${account === null || account === void 0 ? void 0 : account.id}' not a string`);
    const commentArgument = comment;
    if (!comment.ipnsName) {
        if (!comment.cid) {
            // comment doesn't have an ipns name yet, so can't receive updates
            // and doesn't have a cid, so has no way to know the ipns name
            return;
        }
        comment = yield utils.retryInfinity(() => account.plebbit.getComment(comment.cid));
    }
    // account comment already updating
    if (accountsStore.getState().accountsCommentsUpdating[comment.cid]) {
        return;
    }
    accountsStore.setState(({ accountsCommentsUpdating }) => ({ accountsCommentsUpdating: Object.assign(Object.assign({}, accountsCommentsUpdating), { [comment.cid]: true }) }));
    // comment is not a `Comment` instance
    if (!comment.on) {
        comment = yield account.plebbit.createComment(comment);
    }
    comment.on('update', (updatedComment) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        // merge should not be needed if plebbit-js is implemented properly, but no harm in fixing potential errors
        updatedComment = utils.merge(commentArgument, comment, updatedComment);
        yield accountsDatabase.addAccountComment(account.id, updatedComment, accountCommentIndex);
        log('startUpdatingAccountCommentOnCommentUpdateEvents comment update', { commentCid: comment.cid, accountCommentIndex, updatedComment, account });
        accountsStore.setState(({ accountsComments }) => {
            // account no longer exists
            if (!accountsComments[account.id]) {
                log.error(`startUpdatingAccountCommentOnCommentUpdateEvents comment.on('update') invalid accountsStore.accountsComments['${account.id}'] '${accountsComments[account.id]}', account may have been deleted`);
                return {};
            }
            const updatedAccountComments = [...accountsComments[account.id]];
            const previousComment = updatedAccountComments[accountCommentIndex];
            const updatedAccountComment = utils.clone(Object.assign(Object.assign({}, updatedComment), { index: accountCommentIndex, accountId: account.id }));
            updatedAccountComments[accountCommentIndex] = updatedAccountComment;
            return { accountsComments: Object.assign(Object.assign({}, accountsComments), { [account.id]: updatedAccountComments }) };
        });
        // update AccountCommentsReplies with new replies if has any new replies
        const replyPageArray = [
            (_b = (_a = updatedComment.replies) === null || _a === void 0 ? void 0 : _a.pages) === null || _b === void 0 ? void 0 : _b.new,
            (_d = (_c = updatedComment.replies) === null || _c === void 0 ? void 0 : _c.pages) === null || _d === void 0 ? void 0 : _d.topAll,
            (_f = (_e = updatedComment.replies) === null || _e === void 0 ? void 0 : _e.pages) === null || _f === void 0 ? void 0 : _f.old,
            (_h = (_g = updatedComment.replies) === null || _g === void 0 ? void 0 : _g.pages) === null || _h === void 0 ? void 0 : _h.controversialAll,
        ];
        const hasReplies = replyPageArray.map((replyPage) => { var _a; return ((_a = replyPage === null || replyPage === void 0 ? void 0 : replyPage.comments) === null || _a === void 0 ? void 0 : _a.length) || 0; }).reduce((prev, curr) => prev + curr) > 0;
        if (hasReplies) {
            accountsStore.setState(({ accountsCommentsReplies }) => {
                var _a, _b;
                // account no longer exists
                if (!accountsCommentsReplies[account.id]) {
                    log.error(`startUpdatingAccountCommentOnCommentUpdateEvents comment.on('update') invalid accountsStore.accountsCommentsReplies['${account.id}'] '${accountsCommentsReplies[account.id]}', account may have been deleted`);
                    return {};
                }
                // check which replies are read or not
                const updatedAccountCommentsReplies = {};
                for (const replyPage of replyPageArray) {
                    for (const reply of (replyPage === null || replyPage === void 0 ? void 0 : replyPage.comments) || []) {
                        const markedAsRead = ((_b = (_a = accountsCommentsReplies[account.id]) === null || _a === void 0 ? void 0 : _a[reply.cid]) === null || _b === void 0 ? void 0 : _b.markedAsRead) === true ? true : false;
                        updatedAccountCommentsReplies[reply.cid] = Object.assign(Object.assign({}, reply), { markedAsRead });
                    }
                }
                // add all to database
                const promises = [];
                for (const replyCid in updatedAccountCommentsReplies) {
                    promises.push(accountsDatabase.addAccountCommentReply(account.id, updatedAccountCommentsReplies[replyCid]));
                }
                Promise.all(promises);
                // set new store
                const newAccountCommentsReplies = Object.assign(Object.assign({}, accountsCommentsReplies[account.id]), updatedAccountCommentsReplies);
                return { accountsCommentsReplies: Object.assign(Object.assign({}, accountsCommentsReplies), { [account.id]: newAccountCommentsReplies }) };
            });
        }
    }));
    listeners.push(comment);
    comment.update().catch((error) => log.trace('comment.update error', { comment, error }));
});
// internal accounts action: the comment CID is not known at the time of publishing, so every time
// we fetch a new comment, check if its our own, and attempt to add the CID
export const addCidToAccountComment = (comment) => __awaiter(void 0, void 0, void 0, function* () {
    var _j;
    const { accounts } = accountsStore.getState();
    assert(accounts, `can't use accountsStore.accountActions before initialized`);
    const accountCommentsWithoutCids = getAccountsCommentsWithoutCids()[(_j = comment === null || comment === void 0 ? void 0 : comment.author) === null || _j === void 0 ? void 0 : _j.address];
    if (!accountCommentsWithoutCids) {
        return;
    }
    for (const accountComment of accountCommentsWithoutCids) {
        // if author address and timestamp is the same, we assume it's the right comment
        if (accountComment.timestamp && accountComment.timestamp === comment.timestamp) {
            const commentWithCid = utils.merge(accountComment, comment);
            yield accountsDatabase.addAccountComment(accountComment.accountId, commentWithCid, accountComment.index);
            log('accountsActions.addCidToAccountComment', { commentCid: comment.cid, accountCommentIndex: accountComment.index, accountComment: commentWithCid });
            accountsStore.setState(({ accountsComments }) => {
                const updatedAccountComments = [...accountsComments[accountComment.accountId]];
                updatedAccountComments[accountComment.index] = commentWithCid;
                return { accountsComments: Object.assign(Object.assign({}, accountsComments), { [accountComment.accountId]: updatedAccountComments }) };
            });
            startUpdatingAccountCommentOnCommentUpdateEvents(comment, accounts[accountComment.accountId], accountComment.index).catch((error) => log.error('accountsActions.addCidToAccountComment startUpdatingAccountCommentOnCommentUpdateEvents error', {
                comment,
                account: accounts[accountComment.accountId],
                accountCommentIndex: accountComment.index,
                error,
            }));
            break;
        }
    }
});
// cache the last result of this function
let previousAccountsCommentsJson;
let previousAccountsCommentsWithoutCids = {};
const getAccountsCommentsWithoutCids = () => {
    var _a;
    const { accounts, accountsComments } = accountsStore.getState();
    // same accounts comments as last time, return cached value
    const accountsCommentsJson = JSON.stringify(accountsComments);
    if (accountsCommentsJson === previousAccountsCommentsJson) {
        return previousAccountsCommentsWithoutCids;
    }
    previousAccountsCommentsJson = accountsCommentsJson;
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
    previousAccountsCommentsWithoutCids = accountsCommentsWithoutCids;
    return accountsCommentsWithoutCids;
};
// internal accounts action: mark an account's notifications as read
export const markNotificationsAsRead = (account) => __awaiter(void 0, void 0, void 0, function* () {
    const { accountsCommentsReplies } = accountsStore.getState();
    assert(typeof (account === null || account === void 0 ? void 0 : account.id) === 'string', `accountsStore.markNotificationsAsRead invalid account argument '${account}'`);
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
        promises.push(accountsDatabase.addAccountCommentReply(account.id, repliesToMarkAsRead[replyCid]));
    }
    yield Promise.all(promises);
    // add all to react store
    log('accountsActions.markNotificationsAsRead', { account, repliesToMarkAsRead });
    accountsStore.setState(({ accountsCommentsReplies }) => {
        const updatedAccountCommentsReplies = Object.assign(Object.assign({}, accountsCommentsReplies[account.id]), repliesToMarkAsRead);
        return { accountsCommentsReplies: Object.assign(Object.assign({}, accountsCommentsReplies), { [account.id]: updatedAccountCommentsReplies }) };
    });
});
// internal accounts action: if a subplebbit has a role with an account's address
// add it to the account.subplebbits database
export const addSubplebbitRoleToAccountsSubplebbits = (subplebbit) => __awaiter(void 0, void 0, void 0, function* () {
    if (!subplebbit) {
        return;
    }
    const { accounts } = accountsStore.getState();
    assert(accounts, `can't use accountsStore.accountActions before initialized`);
    // find subplebbit roles to add and remove
    const getChange = (accounts, subplebbit) => {
        var _a;
        const toAdd = [];
        const toRemove = [];
        for (const accountId in accounts) {
            const account = accounts[accountId];
            if (!((_a = subplebbit.roles) === null || _a === void 0 ? void 0 : _a[account.author.address])) {
                if (account.subplebbits[subplebbit.address]) {
                    toRemove.push(accountId);
                }
            }
            else {
                if (!account.subplebbits[subplebbit.address]) {
                    toAdd.push(accountId);
                }
            }
        }
        return { toAdd, toRemove, hasChange: toAdd.length !== 0 || toRemove.length !== 0 };
    };
    const { hasChange } = getChange(accounts, subplebbit);
    if (!hasChange) {
        return;
    }
    accountsStore.setState(({ accounts }) => {
        const { toAdd, toRemove, hasChange } = getChange(accounts, subplebbit);
        const nextAccounts = Object.assign({}, accounts);
        // edit databases and build next accounts
        for (const accountId of toAdd) {
            const account = Object.assign({}, nextAccounts[accountId]);
            account.subplebbits = Object.assign(Object.assign({}, account.subplebbits), { [subplebbit.address]: { role: subplebbit.roles[account.author.address] } });
            nextAccounts[accountId] = account;
            accountsDatabase.addAccount(account);
        }
        for (const accountId of toRemove) {
            const account = Object.assign({}, nextAccounts[accountId]);
            account.subplebbits = Object.assign({}, account.subplebbits);
            delete account.subplebbits[subplebbit.address];
            nextAccounts[accountId] = account;
            accountsDatabase.addAccount(account);
        }
        log('accountsActions.addSubplebbitRoleToAccountsSubplebbits', { subplebbit, toAdd, toRemove });
        return { accounts: nextAccounts };
    });
});
