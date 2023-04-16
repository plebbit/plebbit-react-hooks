var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import assert from 'assert';
import { useMemo, useState, useEffect } from 'react';
// @ts-ignore
import memoize from 'memoizee';
import utils from '../../lib/utils';
import PlebbitJs from '../../lib/plebbit-js';
import Logger from '@plebbit/plebbit-logger';
const log = Logger('plebbit-react-hooks:accounts:hooks');
/**
 * Filter publications, for example only get comments that are posts, votes in a certain subplebbit, etc.
 * Check AccountPublicationsFilter type in types.tsx for more information, e.g. filter = {subplebbitAddresses: ['memes.eth']}.
 */
export const filterPublications = (publications, filter) => {
    var _a, _b, _c, _d;
    for (const postCid of filter.postCids || []) {
        assert(postCid && typeof postCid === 'string', `accountCommentsFilter postCid '${postCid}' not a string`);
    }
    for (const subplebbitAddress of filter.subplebbitAddresses || []) {
        assert(subplebbitAddress && typeof subplebbitAddress === 'string', `accountCommentsFilter subplebbitAddress '${subplebbitAddress}' not a string`);
    }
    for (const commentCid of filter.commentCids || []) {
        assert(commentCid && typeof commentCid === 'string', `accountCommentsFilter commentCid '${commentCid}' not a string`);
    }
    for (const parentCid of filter.parentCids || []) {
        assert(parentCid && typeof parentCid === 'string', `accountCommentsFilter parentCid '${parentCid}' not a string`);
    }
    const filteredPublications = [];
    for (const publication of publications) {
        let isFilteredOut = false;
        if (((_a = filter.subplebbitAddresses) === null || _a === void 0 ? void 0 : _a.length) && !filter.subplebbitAddresses.includes(publication.subplebbitAddress)) {
            isFilteredOut = true;
        }
        if (((_b = filter.postCids) === null || _b === void 0 ? void 0 : _b.length) && !filter.postCids.includes(publication.postCid)) {
            isFilteredOut = true;
        }
        if (((_c = filter.commentCids) === null || _c === void 0 ? void 0 : _c.length) && !filter.commentCids.includes(publication.commentCid)) {
            isFilteredOut = true;
        }
        if (((_d = filter.parentCids) === null || _d === void 0 ? void 0 : _d.length) && !filter.parentCids.includes(publication.parentCid)) {
            isFilteredOut = true;
        }
        if (typeof filter.hasParentCid === 'boolean' && filter.hasParentCid !== Boolean(publication.parentCid)) {
            isFilteredOut = true;
        }
        if (!isFilteredOut) {
            filteredPublications.push(publication);
        }
    }
    return filteredPublications;
};
export const useCalculatedNotifications = (account, accountCommentsReplies) => {
    return useMemo(() => {
        if (!account || !accountCommentsReplies) {
            return [];
        }
        // get reply notifications only
        // TODO: at some point we should also add upvote notifications like 'your post has gotten 10 upvotes'
        return getReplyNotificationsFromAccountCommentsReplies(accountCommentsReplies, account === null || account === void 0 ? void 0 : account.blockedAddresses, account === null || account === void 0 ? void 0 : account.blockedCids);
    }, [accountCommentsReplies, account === null || account === void 0 ? void 0 : account.blockedAddresses, account === null || account === void 0 ? void 0 : account.blockedCids]);
};
// accountsBlockedAddresses must be cached to prevent rerenders
// TODO: add accountsBlockedAddresses as an object in the store that can easily be === checked for equality
const getAccountsBlockedAddressesNoCache = (...args) => {
    const accountsBlockedAddresses = {};
    const separator = Math.ceil(args.length / 2);
    for (const [i] of args.entries()) {
        const accountId = args[i];
        const accountBlockedAddresses = args[i + separator];
        if (accountBlockedAddresses) {
            accountsBlockedAddresses[accountId] = accountBlockedAddresses;
        }
    }
    return accountsBlockedAddresses;
};
// length false because variable arguments legnth
const getAccountsBlockedAddressesCached = memoize(getAccountsBlockedAddressesNoCache, { max: 100, length: false });
// accountsBlockedCids must be cached to prevent rerenders
// TODO: add accountsBlockedCids as an object in the store that can easily be === checked for equality
const getAccountsBlockedCidsNoCache = (...args) => {
    const accountsBlockedCids = {};
    const separator = Math.ceil(args.length / 2);
    for (const [i] of args.entries()) {
        const accountId = args[i];
        const accountBlockedCids = args[i + separator];
        if (accountBlockedCids) {
            accountsBlockedCids[accountId] = accountBlockedCids;
        }
    }
    return accountsBlockedCids;
};
// length false because variable arguments legnth
const getAccountsBlockedCidsCached = memoize(getAccountsBlockedCidsNoCache, { max: 100, length: false });
export const useCalculatedAccountsNotifications = (accounts, accountsCommentsReplies) => {
    // accountsBlockedAddresses and accountsBlockedCids must be cached to prevent rerenders
    // TODO: add accountsBlockedAddresses and accountsBlockedCids as objects in the store that can easily be === checked for equality
    let accountsBlockedAddresses;
    let accountsBlockedCids;
    if (accounts && accountsCommentsReplies) {
        const accountIds = Object.keys(accountsCommentsReplies);
        const accountsBlockedAddressesArray = accountIds.map((accountId) => { var _a; return (_a = accounts[accountId]) === null || _a === void 0 ? void 0 : _a.blockedAddresses; });
        accountsBlockedAddresses = getAccountsBlockedAddressesCached(...accountIds, ...accountsBlockedAddressesArray);
        const accountsBlockedCidsArray = accountIds.map((accountId) => { var _a; return (_a = accounts[accountId]) === null || _a === void 0 ? void 0 : _a.blockedCids; });
        accountsBlockedCids = getAccountsBlockedCidsCached(...accountIds, ...accountsBlockedCidsArray);
    }
    return useMemo(() => {
        const accountsNotifications = {};
        if (!accountsCommentsReplies) {
            return accountsNotifications;
        }
        for (const accountId in accountsCommentsReplies) {
            // get reply notifications only
            // TODO: at some point we should also add upvote notifications like 'your post has gotten 10 upvotes'
            accountsNotifications[accountId] = getReplyNotificationsFromAccountCommentsReplies(accountsCommentsReplies[accountId], accountsBlockedAddresses[accountId], accountsBlockedCids[accountId]);
        }
        return accountsNotifications;
    }, [accountsCommentsReplies, accountsBlockedAddresses, accountsBlockedCids]);
};
const getReplyNotificationsFromAccountCommentsReplies = (accountCommentsReplies, accountBlockedAddresses, accountBlockedCids) => {
    var _a;
    // get reply notifications
    const replyNotifications = [];
    for (const replyCid in accountCommentsReplies) {
        const reply = accountCommentsReplies[replyCid];
        if ((accountBlockedAddresses === null || accountBlockedAddresses === void 0 ? void 0 : accountBlockedAddresses[reply.subplebbitAddress]) || (accountBlockedAddresses === null || accountBlockedAddresses === void 0 ? void 0 : accountBlockedAddresses[(_a = reply.author) === null || _a === void 0 ? void 0 : _a.address])) {
            continue;
        }
        if ((accountBlockedCids === null || accountBlockedCids === void 0 ? void 0 : accountBlockedCids[reply.cid]) || (accountBlockedCids === null || accountBlockedCids === void 0 ? void 0 : accountBlockedCids[reply.parentCid]) || (accountBlockedCids === null || accountBlockedCids === void 0 ? void 0 : accountBlockedCids[reply.postCid])) {
            continue;
        }
        replyNotifications.push(reply);
    }
    return replyNotifications.sort((a, b) => b.timestamp - a.timestamp);
};
// add calculated properties to accounts, like karma and unreadNotificationCount
const useAccountCalculatedProperties = (account, accountComments, accountCommentsReplies) => {
    const notifications = useCalculatedNotifications(account, accountCommentsReplies);
    return useMemo(() => {
        return getAccountCalculatedProperties(accountComments, notifications);
    }, [accountComments, accountCommentsReplies]);
};
export const useAccountWithCalculatedProperties = (account, accountComments, accountCommentsReplies) => {
    const accountCalculatedProperties = useAccountCalculatedProperties(account, accountComments, accountCommentsReplies);
    const shortAddress = useAccountAuthorShortAddress(account);
    return useMemo(() => {
        if (!account) {
            return;
        }
        if (shortAddress) {
            account = Object.assign(Object.assign({}, account), { author: Object.assign(Object.assign({}, account.author), { shortAddress }) });
        }
        return Object.assign(Object.assign({}, account), accountCalculatedProperties);
    }, [account, accountCalculatedProperties, shortAddress]);
};
// add calculated properties to accounts, like karma and unreadNotificationCount
export const useAccountsWithCalculatedProperties = (accounts, accountsComments, accountsCommentsReplies) => {
    const accountsNotifications = useCalculatedAccountsNotifications(accounts, accountsCommentsReplies);
    const accountsShortAuthorAddresses = useAccountsAuthorShortAddresses(accounts);
    return useMemo(() => {
        if (!accounts) {
            return;
        }
        if (!accountsComments) {
            return accounts;
        }
        const accountsWithCalculatedProperties = {};
        for (const accountId in accounts) {
            // must cache getAccountCalculatedProperties() or it recalculates every account, instead of only the one changed
            const accountCalculatedProperties = getAccountCalculatedProperties(accountsComments[accountId], accountsNotifications[accountId]);
            const account = Object.assign(Object.assign({}, accounts[accountId]), accountCalculatedProperties);
            if (accountsShortAuthorAddresses[accountId] && account.author) {
                account.author.shortAddress = accountsShortAuthorAddresses[accountId];
            }
            accountsWithCalculatedProperties[accountId] = account;
        }
        return accountsWithCalculatedProperties;
    }, [accounts, accountsComments, accountsCommentsReplies, accountsShortAuthorAddresses]);
};
const getAccountCalculatedPropertiesNoCache = (accountComments, notifications) => {
    const accountCalculatedProperties = {};
    // add karma
    const karma = {
        replyUpvoteCount: 0,
        replyDownvoteCount: 0,
        replyScore: 0,
        postUpvoteCount: 0,
        postDownvoteCount: 0,
        postScore: 0,
        upvoteCount: 0,
        downvoteCount: 0,
        score: 0,
    };
    for (const comment of accountComments || []) {
        if (comment.parentCid && comment.upvoteCount) {
            karma.replyUpvoteCount += comment.upvoteCount;
        }
        if (comment.parentCid && comment.downvoteCount) {
            karma.replyDownvoteCount += comment.downvoteCount;
        }
        if (!comment.parentCid && comment.upvoteCount) {
            karma.postUpvoteCount += comment.upvoteCount;
        }
        if (!comment.parentCid && comment.downvoteCount) {
            karma.postDownvoteCount += comment.downvoteCount;
        }
    }
    karma.replyScore = karma.replyUpvoteCount - karma.replyDownvoteCount;
    karma.postScore = karma.postUpvoteCount - karma.postDownvoteCount;
    karma.upvoteCount = karma.replyUpvoteCount + karma.postUpvoteCount;
    karma.downvoteCount = karma.replyDownvoteCount + karma.postDownvoteCount;
    karma.score = karma.upvoteCount - karma.downvoteCount;
    accountCalculatedProperties.karma = karma;
    // add unreadNotificationCount
    let unreadNotificationCount = 0;
    for (const notification of notifications || []) {
        if (!notification.markedAsRead) {
            unreadNotificationCount++;
        }
    }
    accountCalculatedProperties.unreadNotificationCount = unreadNotificationCount;
    return accountCalculatedProperties;
};
const getAccountCalculatedProperties = memoize(getAccountCalculatedPropertiesNoCache, { max: 100 });
const useAccountAuthorShortAddress = (account) => {
    var _a;
    const [shortAddress, setShortAddress] = useState();
    useEffect(() => {
        var _a;
        getAuthorShortAddress((_a = account === null || account === void 0 ? void 0 : account.author) === null || _a === void 0 ? void 0 : _a.address).then((_shortAddress) => {
            if (_shortAddress !== shortAddress) {
                setShortAddress(_shortAddress);
            }
        });
    }, [(_a = account === null || account === void 0 ? void 0 : account.author) === null || _a === void 0 ? void 0 : _a.address]);
    return shortAddress;
};
const useAccountsAuthorShortAddresses = (accounts) => {
    const [shortAddresses, setShortAddresses] = useState({});
    useEffect(() => {
        ;
        (() => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const newShortAddresses = {};
            let shouldUpdate = false;
            for (const accountId in accounts || {}) {
                const address = (_b = (_a = accounts === null || accounts === void 0 ? void 0 : accounts[accountId]) === null || _a === void 0 ? void 0 : _a.author) === null || _b === void 0 ? void 0 : _b.address;
                newShortAddresses[accountId] = yield getAuthorShortAddress(address);
                if (shortAddresses[accountId] !== newShortAddresses[accountId]) {
                    shouldUpdate = true;
                }
            }
            if (shouldUpdate) {
                setShortAddresses(newShortAddresses);
            }
        }))();
    }, [accounts]);
    return shortAddresses;
};
let plebbit;
const getAuthorShortAddressNoCache = (authorAddress) => __awaiter(void 0, void 0, void 0, function* () {
    if (!authorAddress) {
        return;
    }
    if (!plebbit) {
        plebbit = yield PlebbitJs.Plebbit();
    }
    try {
        const comment = yield plebbit.createComment({ author: { address: authorAddress } });
        return comment.author.shortAddress;
    }
    catch (error) {
        log.error('useAccount plebbit.createComment({author: {address: authorAddress} error', { authorAddress, error });
    }
});
const getAuthorShortAddress = utils.memo(getAuthorShortAddressNoCache, { maxSize: 200 });
