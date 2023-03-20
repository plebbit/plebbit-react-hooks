import assert from 'assert';
import { useMemo } from 'react';
// @ts-ignore
import memoize from 'memoizee';
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
        return getReplyNotificationsFromAccountCommentsReplies(accountCommentsReplies, account === null || account === void 0 ? void 0 : account.blockedAddresses);
    }, [accountCommentsReplies, account === null || account === void 0 ? void 0 : account.blockedAddresses]);
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
export const useCalculatedAccountsNotifications = (accounts, accountsCommentsReplies) => {
    // accountsBlockedAddresses must be cached to prevent rerenders
    // TODO: add accountsBlockedAddresses as an object in the store that can easily be === checked for equality
    let accountsBlockedAddresses;
    if (accounts && accountsCommentsReplies) {
        const accountIds = Object.keys(accountsCommentsReplies);
        const accountsBlockedAddressesArray = accountIds.map((accountId) => { var _a; return (_a = accounts[accountId]) === null || _a === void 0 ? void 0 : _a.blockedAddresses; });
        accountsBlockedAddresses = getAccountsBlockedAddressesCached(...accountIds, ...accountsBlockedAddressesArray);
    }
    return useMemo(() => {
        const accountsNotifications = {};
        if (!accountsCommentsReplies) {
            return accountsNotifications;
        }
        for (const accountId in accountsCommentsReplies) {
            // get reply notifications only
            // TODO: at some point we should also add upvote notifications like 'your post has gotten 10 upvotes'
            accountsNotifications[accountId] = getReplyNotificationsFromAccountCommentsReplies(accountsCommentsReplies[accountId], accountsBlockedAddresses[accountId]);
        }
        return accountsNotifications;
    }, [accountsCommentsReplies, accountsBlockedAddresses]);
};
const getReplyNotificationsFromAccountCommentsReplies = (accountCommentsReplies, accountBlockedAddresses) => {
    // get reply notifications
    const replyNotifications = [];
    for (const replyCid in accountCommentsReplies) {
        const reply = accountCommentsReplies[replyCid];
        // TODO: filter blocked addresses
        // if (accountBlockedAddresses?.[reply.subplebbitAddress] || accountsBlockedAddresses[accountId]?.[reply.author.address]) {
        //   continue
        // }
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
    return useMemo(() => {
        if (!account) {
            return;
        }
        return Object.assign(Object.assign({}, account), accountCalculatedProperties);
    }, [account, accountCalculatedProperties]);
};
// add calculated properties to accounts, like karma and unreadNotificationCount
export const useAccountsWithCalculatedProperties = (accounts, accountsComments, accountsCommentsReplies) => {
    const accountsNotifications = useCalculatedAccountsNotifications(accounts, accountsCommentsReplies);
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
            accountsWithCalculatedProperties[accountId] = Object.assign(Object.assign({}, accounts[accountId]), accountCalculatedProperties);
        }
        return accountsWithCalculatedProperties;
    }, [accounts, accountsComments, accountsCommentsReplies]);
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
