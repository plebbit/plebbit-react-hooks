import assert from 'assert';
const toString = (value) => {
    if (typeof value === 'string') {
        return value;
    }
    try {
        const string = JSON.stringify(value);
        return string;
    }
    catch (e) { }
    return value;
};
export const validateAccountsActionsPublishCommentArguments = ({ publishCommentOptions, accountName, account }) => {
    assert(!accountName || typeof accountName === 'string', `publishComment accountName '${accountName}' not a string`);
    assert(accountName !== '', `publishComment accountName argument is empty string`);
    assert(!accountName || account, `publishComment no account with name '${accountName}' in accountsStore`);
    assert(publishCommentOptions && typeof publishCommentOptions === 'object', 'publishComment publishCommentOptions not an object');
    assert(typeof publishCommentOptions.onChallenge === 'function', 'publishComment publishCommentOptions.onChallenge not a function');
    assert(typeof publishCommentOptions.onChallengeVerification === 'function', 'publishComment publishCommentOptions.onChallengeVerification not a function');
    assert(!publishCommentOptions.onError || typeof publishCommentOptions.onError === 'function', 'publishComment publishCommentOptions.onError not a function');
    assert(typeof publishCommentOptions.subplebbitAddress === 'string', 'publishComment publishCommentOptions.subplebbitAddress not a string');
    assert(!publishCommentOptions.parentCid || typeof publishCommentOptions.parentCid === 'string', 'publishComment publishCommentOptions.parentCid not a string');
    assert(!publishCommentOptions.timestamp || typeof publishCommentOptions.timestamp === 'number', 'publishComment publishCommentOptions.timestamp is not a number');
    // validate content
    assert(!publishCommentOptions.content || typeof publishCommentOptions.content === 'string', 'publishComment publishCommentOptions.content not a string');
    assert(publishCommentOptions.content !== '', 'publishComment publishCommentOptions.content is an empty string');
    assert(!publishCommentOptions.link || typeof publishCommentOptions.link === 'string', 'publishComment publishCommentOptions.link not a string');
    assert(publishCommentOptions.link !== '', 'publishComment publishCommentOptions.link is an empty string');
    assert(!publishCommentOptions.title || typeof publishCommentOptions.title === 'string', 'publishComment publishCommentOptions.title not a string');
    assert(publishCommentOptions.title !== '', 'publishComment publishCommentOptions.title is an empty string');
};
export const validateAccountsActionsPublishVoteArguments = ({ publishVoteOptions, accountName, account }) => {
    assert(!accountName || typeof accountName === 'string', `publishVote accountName '${accountName}' not a string`);
    assert(accountName !== '', `publishVote accountName argument is empty string`);
    assert(!accountName || account, `publishVote no account with name '${accountName}' in accountsStore`);
    assert(publishVoteOptions && typeof publishVoteOptions === 'object', 'publishVote publishVoteOptions not an object');
    assert(typeof publishVoteOptions.onChallenge === 'function', 'publishVote publishVoteOptions.onChallenge not a function');
    assert(typeof publishVoteOptions.onChallengeVerification === 'function', 'publishVote publishVoteOptions.onChallengeVerification not a function');
    assert(!publishVoteOptions.onError || typeof publishVoteOptions.onError === 'function', 'publishVote publishVoteOptions.onError not a function');
    assert(typeof publishVoteOptions.subplebbitAddress === 'string', 'publishVote publishVoteOptions.subplebbitAddress not a string');
    assert(typeof publishVoteOptions.commentCid === 'string', 'publishVote publishVoteOptions.commentCid not a string');
    assert(publishVoteOptions.vote === 1 || publishVoteOptions.vote === 0 || publishVoteOptions.vote === -1, 'publishVote publishVoteOptions.vote not 1, 0 or -1');
    assert(!publishVoteOptions.timestamp || typeof publishVoteOptions.timestamp === 'number', 'publishVote publishVoteOptions.timestamp is not a number');
};
export const validateAccountsActionsPublishCommentEditArguments = ({ publishCommentEditOptions, accountName, account }) => {
    assert(!accountName || typeof accountName === 'string', `publishCommentEdit accountName '${accountName}' not a string`);
    assert(accountName !== '', `publishCommentEdit accountName argument is empty string`);
    assert(!accountName || account, `publishCommentEdit no account with name '${accountName}' in accountsStore`);
    assert(publishCommentEditOptions && typeof publishCommentEditOptions === 'object', 'publishCommentEdit publishCommentEditOptions not an object');
    assert(typeof publishCommentEditOptions.onChallenge === 'function', 'publishCommentEdit publishCommentEditOptions.onChallenge not a function');
    assert(typeof publishCommentEditOptions.onChallengeVerification === 'function', 'publishCommentEdit publishCommentEditOptions.onChallengeVerification not a function');
    assert(!publishCommentEditOptions.onError || typeof publishCommentEditOptions.onError === 'function', 'publishCommentEditOptions publishCommentEditOptions.onError not a function');
    assert(typeof publishCommentEditOptions.subplebbitAddress === 'string', 'publishCommentEdit publishCommentEditOptions.subplebbitAddress not a string');
    assert(typeof publishCommentEditOptions.commentCid === 'string', 'publishCommentEdit publishCommentEditOptions.commentCid not a string');
    assert(!publishCommentEditOptions.timestamp || typeof publishCommentEditOptions.timestamp === 'number', 'publishCommentEdit publishCommentEditOptions.timestamp is not a number');
};
export const validateAccountsActionsPublishCommentModerationArguments = ({ publishCommentModerationOptions, accountName, account }) => {
    assert(!accountName || typeof accountName === 'string', `publishCommentModeration accountName '${accountName}' not a string`);
    assert(accountName !== '', `publishCommentModeration accountName argument is empty string`);
    assert(!accountName || account, `publishCommentModeration no account with name '${accountName}' in accountsStore`);
    assert(publishCommentModerationOptions && typeof publishCommentModerationOptions === 'object', 'publishCommentModeration publishCommentModerationOptions not an object');
    assert(typeof publishCommentModerationOptions.onChallenge === 'function', 'publishCommentModeration publishCommentModerationOptions.onChallenge not a function');
    assert(typeof publishCommentModerationOptions.onChallengeVerification === 'function', 'publishCommentModeration publishCommentModerationOptions.onChallengeVerification not a function');
    assert(!publishCommentModerationOptions.onError || typeof publishCommentModerationOptions.onError === 'function', 'publishCommentModerationOptions publishCommentModerationOptions.onError not a function');
    assert(typeof publishCommentModerationOptions.subplebbitAddress === 'string', 'publishCommentModeration publishCommentModerationOptions.subplebbitAddress not a string');
    assert(typeof publishCommentModerationOptions.commentCid === 'string', 'publishCommentModeration publishCommentModerationOptions.commentCid not a string');
    assert(!publishCommentModerationOptions.timestamp || typeof publishCommentModerationOptions.timestamp === 'number', 'publishCommentModeration publishCommentModerationOptions.timestamp is not a number');
    assert(publishCommentModerationOptions.commentModeration && typeof publishCommentModerationOptions.commentModeration === 'object', 'publishCommentModeration publishCommentModerationOptions.commentModeration is not an object');
};
export const validateAccountsActionsPublishSubplebbitEditArguments = ({ subplebbitAddress, publishSubplebbitEditOptions, accountName, account }) => {
    assert(!accountName || typeof accountName === 'string', `publishSubplebbitEdit accountName '${accountName}' not a string`);
    assert(accountName !== '', `publishSubplebbitEdit accountName argument is empty string`);
    assert(!accountName || account, `publishSubplebbitEdit no account with name '${accountName}' in accountsStore`);
    assert(publishSubplebbitEditOptions && typeof publishSubplebbitEditOptions === 'object', 'publishSubplebbitEdit publishSubplebbitEditOptions not an object');
    assert(typeof publishSubplebbitEditOptions.onChallenge === 'function', 'publishSubplebbitEdit publishSubplebbitEditOptions.onChallenge not a function');
    assert(typeof publishSubplebbitEditOptions.onChallengeVerification === 'function', 'publishSubplebbitEdit publishSubplebbitEditOptions.onChallengeVerification not a function');
    assert(!publishSubplebbitEditOptions.onError || typeof publishSubplebbitEditOptions.onError === 'function', 'publishSubplebbitEdit publishSubplebbitEditOptions.onError not a function');
    assert(subplebbitAddress !== '', `publishSubplebbitEdit subplebbitAddress argument is empty string`);
    assert(typeof subplebbitAddress === 'string', 'publishSubplebbitEdit subplebbitAddress not a string');
    assert(!publishSubplebbitEditOptions.timestamp || typeof publishSubplebbitEditOptions.timestamp === 'number', 'publishSubplebbitEdit publishSubplebbitEditOptions.timestamp is not a number');
};
export const validateAccountsActionsExportAccountArguments = (accountName) => {
    assert(typeof accountName === 'string', `exportAccount accountName '${accountName}' not a string`);
    assert(accountName !== '', `exportAccount accountName argument is empty string`);
};
export const validateAccountsActionsSetAccountsOrderArguments = (newOrderedAccountNames, accountNames) => {
    assert(JSON.stringify([...accountNames].sort()) === JSON.stringify([...newOrderedAccountNames].sort()), `previous account names '${accountNames} contain different account names than argument newOrderedAccountNames '${newOrderedAccountNames}'`);
};
export const validateAccountsActionsSetAccountArguments = (account) => {
    assert(account && typeof account === 'object', `setAccount account '${account}' not an object`);
    assert(typeof account.name === 'string', `setAccount account.name '${account.name}' not a string`);
    assert(account.name !== '', `setAccount account.name is empty string`);
    assert(typeof account.id === 'string', `setAccount account.id '${account.id}' not a string`);
    assert(account.id !== '', `setAccount account.id is empty string`);
};
export const validateAccountsActionsSetActiveAccountArguments = (accountName) => {
    assert(typeof accountName === 'string', `setActiveAccountName accountName '${accountName}' not a string`);
    assert(accountName !== '', `setActiveAccountName accountName argument is empty string`);
};
export const validateAccountsDatabaseGetAccountsArguments = (accountIds) => {
    assert(Array.isArray(accountIds), `accountsDatabase.getAccounts accountIds '${accountIds}' not an array`);
    assert(accountIds.length > 0, `accountsDatabase.getAccounts accountIds array is empty`);
    for (const accountId of accountIds) {
        assert(typeof accountId === 'string', `accountsDatabase.getAccountsaccountIds '${accountIds}' accountId '${accountId}' not a string`);
        assert(accountId !== '', `accountsDatabase.getAccounts accountIds '${accountIds}' an accountId argument is empty string`);
    }
};
export const validateAccountsDatabaseAccountNames = (accountNames) => {
    assert(Array.isArray(accountNames), `accountsDatabase accountNames '${accountNames}' not an array`);
    for (const accountName of accountNames) {
        assert(typeof accountName === 'string', `accountsDatabase accountNames '${accountNames}' accountName '${accountName}' not a string`);
    }
};
export const validateAccountsDatabaseAddAccountArguments = (account) => {
    assert(account && typeof account === 'object', `accountsDatabase.addAccount '${account}' not an object`);
    assert(typeof account.name === 'string', `accountsDatabase.addAccount account.name '${account.name}' not a string`);
    assert(account.name !== '', `accountsDatabase.addAccount account.name is empty string`);
    assert(typeof account.id === 'string', `accountsDatabase.addAccount account.id '${account.id}' not a string`);
    assert(account.id !== '', `accountsDatabase.addAccount account.id is empty string`);
};
export const validateUseCommentArguments = (commentCid, account) => {
    assert(typeof commentCid === 'string', `useComment commentCid '${commentCid}' not a string`);
    assert((account === null || account === void 0 ? void 0 : account.plebbit) && typeof (account === null || account === void 0 ? void 0 : account.plebbit) === 'object', `useComment account.plebbit '${account === null || account === void 0 ? void 0 : account.plebbit}' not an object`);
};
export const validateUseCommentsArguments = (commentCids, account) => {
    assert(Array.isArray(commentCids), `useComment commentCids '${toString(commentCids)}' not an array`);
    for (const commentCid of commentCids) {
        assert(typeof commentCid === 'string', `useComments commentCids '${toString(commentCids)}' commentCid '${toString(commentCid)}' not a string`);
    }
    assert((account === null || account === void 0 ? void 0 : account.plebbit) && typeof (account === null || account === void 0 ? void 0 : account.plebbit) === 'object', `useComments account.plebbit '${account === null || account === void 0 ? void 0 : account.plebbit}' not an object`);
};
export const validateUseSubplebbitArguments = (subplebbitAddress, account) => {
    assert(typeof subplebbitAddress === 'string', `useSubplebbit subplebbitAddress '${subplebbitAddress}' not a string`);
    assert((account === null || account === void 0 ? void 0 : account.plebbit) && typeof (account === null || account === void 0 ? void 0 : account.plebbit) === 'object', `useSubplebbit account.plebbit '${account === null || account === void 0 ? void 0 : account.plebbit}' not an object`);
};
export const validateUseSubplebbitsArguments = (subplebbitAddresses, account) => {
    assert(Array.isArray(subplebbitAddresses), `useSubplebbit subplebbitAddresses '${toString(subplebbitAddresses)}' not an array`);
    for (const subplebbitAddress of subplebbitAddresses) {
        assert(typeof subplebbitAddress === 'string', `useSubplebbits subplebbitAddresses '${toString(subplebbitAddresses)}' subplebbitAddress '${toString(subplebbitAddress)}' not a string`);
    }
    assert((account === null || account === void 0 ? void 0 : account.plebbit) && typeof (account === null || account === void 0 ? void 0 : account.plebbit) === 'object', `useSubplebbit account.plebbit '${account === null || account === void 0 ? void 0 : account.plebbit}' not an object`);
};
const feedSortTypes = new Set([
    'hot',
    'new',
    'active',
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
export const validateFeedSortType = (sortType) => {
    assert(feedSortTypes.has(sortType), `invalid feed sort type '${sortType}'`);
};
export const validateUseFeedArguments = (subplebbitAddresses, sortType, accountName, postsPerPage, filter, newerThan) => {
    if (subplebbitAddresses) {
        assert(Array.isArray(subplebbitAddresses), `useFeed subplebbitAddresses argument '${toString(subplebbitAddresses)}' not an array`);
        for (const subplebbitAddress of subplebbitAddresses) {
            assert(typeof subplebbitAddress === 'string', `useFeed subplebbitAddresses argument '${toString(subplebbitAddresses)}' subplebbitAddress '${toString(subplebbitAddress)}' not a string`);
        }
    }
    assert(feedSortTypes.has(sortType), `useFeed sortType argument '${sortType}' invalid`);
    if (accountName) {
        assert(typeof accountName === 'string', `useFeed accountName argument '${accountName}' not a string`);
    }
    if (postsPerPage !== undefined && postsPerPage !== null) {
        assert(typeof postsPerPage === 'number', `useFeed postsPerPage argument '${postsPerPage}' not a number`);
    }
    if (filter) {
        assert(typeof filter.filter === 'function', `useFeed filter.filter argument '${filter.filter}' not a function, useFeedOptions.filter is now an object Filter {filter: (comment: Comment) => Boolean, key: string}`);
        assert(typeof filter.key === 'string', `useFeed filter.key argument '${filter.key}' not a string, a unique filter.key is now required to cache the filter`);
    }
    if (newerThan !== undefined && newerThan !== null) {
        assert(typeof newerThan === 'number', `useFeed newerThan argument '${newerThan}' not a number`);
    }
};
export const validateUseBufferedFeedsArguments = (feedsOptions, accountName) => {
    assert(Array.isArray(feedsOptions), `useBufferedFeeds feedsOptions argument '${toString(feedsOptions)}' not an array`);
    for (const { subplebbitAddresses, sortType, postsPerPage, filter, newerThan } of feedsOptions) {
        if (subplebbitAddresses) {
            assert(Array.isArray(subplebbitAddresses), `useBufferedFeeds feedOptions.subplebbitAddresses argument '${toString(subplebbitAddresses)}' not an array`);
            for (const subplebbitAddress of subplebbitAddresses) {
                assert(typeof subplebbitAddress === 'string', `useBufferedFeeds feedOptions.subplebbitAddresses argument '${toString(subplebbitAddresses)}' subplebbitAddress '${toString(subplebbitAddress)}' not a string`);
            }
        }
        if (sortType) {
            assert(feedSortTypes.has(sortType), `useBufferedFeeds feedOptions.sortType argument '${sortType}' invalid`);
        }
        if (postsPerPage !== undefined && postsPerPage !== null) {
            assert(typeof postsPerPage === 'number', `useBufferedFeeds feedOptions.postsPerPage argument '${postsPerPage}' not a number`);
        }
        if (filter) {
            assert(typeof filter.filter === 'function', `useBufferedFeeds feedOptions.filter.filter argument '${filter.filter}' not a function, useFeedOptions.filter is now an object Filter {filter: (comment: Comment) => Boolean, key: string}`);
            assert(typeof filter.key === 'string', `useBufferedFeeds feedOptions.filter.key argument '${filter.key}' not a string, a unique filter.key is now required to cache the filter`);
        }
        if (newerThan !== undefined && newerThan !== null) {
            assert(typeof newerThan === 'number', `useBufferedFeeds feedOptions.newerThan argument '${newerThan}' not a number`);
        }
    }
    if (accountName) {
        assert(typeof accountName === 'string', `useBufferedFeeds accountName argument '${accountName}' not a string`);
    }
};
const repliesSortTypes = new Set(['best', 'topHour', 'topDay', 'topWeek', 'topMonth', 'topYear', 'topAll', 'new', 'newFlat', 'old', 'oldFlat']);
export const validateRepliesSortType = (sortType) => {
    assert(repliesSortTypes.has(sortType), `invalid replies sort type '${sortType}'`);
};
export const validateUseRepliesArguments = (commentCid, sortType, accountName, flat, accountComments, postsPerPage, filter) => {
    if (commentCid) {
        assert(typeof commentCid === 'string', `useReplies commentCid argument '${commentCid}' not a string`);
    }
    assert(repliesSortTypes.has(sortType), `useReplies sortType argument '${sortType}' invalid`);
    if (accountName) {
        assert(typeof accountName === 'string', `useReplies accountName argument '${accountName}' not a string`);
    }
    if (postsPerPage !== undefined && postsPerPage !== null) {
        assert(typeof postsPerPage === 'number', `useReplies postsPerPage argument '${postsPerPage}' not a number`);
    }
    if (flat !== undefined && flat !== null) {
        assert(typeof flat === 'boolean', `useReplies flat argument '${flat}' not a boolean`);
    }
    if (accountComments !== undefined && accountComments !== null) {
        assert(typeof accountComments === 'boolean', `useReplies accountComments argument '${accountComments}' not a boolean`);
    }
    if (filter) {
        assert(typeof filter.filter === 'function', `useReplies filter.filter argument '${filter.filter}' not a function, useRepliesOptions.filter is now an object Filter {filter: (comment: Comment) => Boolean, key: string}`);
        assert(typeof filter.key === 'string', `useReplies filter.key argument '${filter.key}' not a string, a unique filter.key is now required to cache the filter`);
    }
};
const validator = {
    validateAccountsActionsPublishCommentArguments,
    validateAccountsActionsPublishCommentEditArguments,
    validateAccountsActionsPublishCommentModerationArguments,
    validateAccountsActionsPublishSubplebbitEditArguments,
    validateAccountsActionsPublishVoteArguments,
    validateAccountsActionsExportAccountArguments,
    validateAccountsActionsSetAccountsOrderArguments,
    validateAccountsActionsSetAccountArguments,
    validateAccountsActionsSetActiveAccountArguments,
    validateAccountsDatabaseAddAccountArguments,
    validateAccountsDatabaseGetAccountsArguments,
    validateAccountsDatabaseAccountNames,
    validateUseCommentArguments,
    validateUseCommentsArguments,
    validateUseSubplebbitArguments,
    validateUseSubplebbitsArguments,
    validateFeedSortType,
    validateUseFeedArguments,
    validateUseBufferedFeedsArguments,
    validateRepliesSortType,
    validateUseRepliesArguments,
};
export default validator;
