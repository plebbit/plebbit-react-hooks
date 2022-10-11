import assert from 'assert';
import { useMemo } from 'react';
/**
 * Filter publications, for example only get comments that are posts, votes in a certain subplebbit, etc.
 * Check UseAccountCommentsFilter type in types.tsx for more information, e.g. filter = {subplebbitAddresses: ['memes.eth']}.
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
export const useAccountsNotifications = (accounts, accountsCommentsReplies) => {
    const accountsBlockedAddresses = Object.fromEntries(
    // do not do `account.blockedAddresses || {}` otherwise can't use as useMemoDependencies
    Object.keys(accountsCommentsReplies || {}).map((accountId) => { var _a; return [accountId, (_a = accounts === null || accounts === void 0 ? void 0 : accounts[accountId]) === null || _a === void 0 ? void 0 : _a.blockedAddresses]; }));
    // use a "shallow" check on the argument dependencies because the argument objects might change
    const useMemoDependencies = [...Object.values(accountsCommentsReplies || {}), ...Object.values(accountsBlockedAddresses)];
    // useMemo deps must always have the same length
    // TODO: will break if there's more than 500 / 2 accounts, must find other solution
    useMemoDependencies.length = 500;
    return useMemo(() => {
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
                // if (accountsBlockedAddresses[accountId]?.[reply.subplebbitAddress] || accountsBlockedAddresses[accountId]?.[reply.author.address]) {
                //   continue
                // }
                accountCommentsReplies.push(reply);
            }
            // TODO: at some point we should also add upvote notifications like 'your post has gotten 10 upvotes'
            accountsNotifications[accountId] = accountCommentsReplies.sort((a, b) => b.timestamp - a.timestamp);
        }
        return accountsNotifications;
    }, useMemoDependencies);
};
// add calculated properties to accounts, like karma and unreadNotificationCount
export const useAccountsWithCalculatedProperties = (accounts, accountsComments, accountsCommentsReplies) => {
    const accountsNotifications = useAccountsNotifications(accounts, accountsCommentsReplies);
    // use a "shallow" check on the argument dependencies because the argument objects might change
    // use accountsCommentsReplies instead of accountsNotifications because useAccountsNotifications uses it
    const useMemoDependencies = [...Object.values(accounts || {}), ...Object.values(accountsComments || {}), ...Object.values(accountsCommentsReplies || {})];
    // useMemo deps must always have the same length
    // TODO: will break if there's more than 1000 / 3 accounts, must find other solution
    useMemoDependencies.length = 1000;
    return useMemo(() => {
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
            for (const comment of accountComments) {
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
    }, useMemoDependencies);
};
