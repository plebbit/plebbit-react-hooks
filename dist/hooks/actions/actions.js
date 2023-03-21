var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { useMemo, useState } from 'react';
import useAccountsStore from '../../stores/accounts';
import Logger from '@plebbit/plebbit-logger';
const log = Logger('plebbit-react-hooks:accounts:hooks');
import assert from 'assert';
import { useAccount, useAccountId } from '../accounts';
const publishChallengeAnswersNotReady = (challengeAnswers) => __awaiter(void 0, void 0, void 0, function* () {
    throw Error(`can't call publishChallengeAnswers() before result.challenge is defined (before the challenge message is received)`);
});
export function useSubscribe(options) {
    var _a;
    assert(!options || typeof options === 'object', `useSubscribe options argument '${options}' not an object`);
    const { subplebbitAddress, accountName, onError } = options || {};
    const account = useAccount({ accountName });
    const accountsActions = useAccountsStore((state) => state.accountsActions);
    const [errors, setErrors] = useState([]);
    let state = 'initializing';
    let subscribed;
    // before the account and subplebbitAddress is defined, nothing can happen
    if (account && subplebbitAddress) {
        state = 'ready';
        subscribed = Boolean((_a = account.subscriptions) === null || _a === void 0 ? void 0 : _a.includes(subplebbitAddress));
    }
    const subscribe = () => __awaiter(this, void 0, void 0, function* () {
        try {
            yield accountsActions.subscribe(subplebbitAddress, accountName);
        }
        catch (e) {
            setErrors([...errors, e]);
            onError === null || onError === void 0 ? void 0 : onError(e);
        }
    });
    const unsubscribe = () => __awaiter(this, void 0, void 0, function* () {
        try {
            yield accountsActions.unsubscribe(subplebbitAddress, accountName);
        }
        catch (e) {
            setErrors([...errors, e]);
            onError === null || onError === void 0 ? void 0 : onError(e);
        }
    });
    return useMemo(() => ({
        subscribed,
        subscribe,
        unsubscribe,
        state,
        error: errors[errors.length - 1],
        errors,
    }), [state, subscribed, errors, subplebbitAddress, accountName]);
}
export function useBlock(options) {
    assert(!options || typeof options === 'object', `useBlock options argument '${options}' not an object`);
    const { address, cid, accountName, onError } = options || {};
    if (address && cid) {
        throw Error(`can't useBlock with both an address '${address}' and cid '${cid}' argument at the same time`);
    }
    const account = useAccount({ accountName });
    const accountsActions = useAccountsStore((state) => state.accountsActions);
    const [errors, setErrors] = useState([]);
    let state = 'initializing';
    let blocked;
    // before the account and address is defined, nothing can happen
    if (account && (address || cid)) {
        state = 'ready';
        if (address) {
            blocked = Boolean(account.blockedAddresses[address]);
        }
        if (cid) {
            blocked = Boolean(account.blockedCids[cid]);
        }
    }
    const block = () => __awaiter(this, void 0, void 0, function* () {
        try {
            if (cid) {
                yield accountsActions.blockCid(cid, accountName);
            }
            else {
                yield accountsActions.blockAddress(address, accountName);
            }
        }
        catch (e) {
            setErrors([...errors, e]);
            onError === null || onError === void 0 ? void 0 : onError(e);
        }
    });
    const unblock = () => __awaiter(this, void 0, void 0, function* () {
        try {
            if (cid) {
                yield accountsActions.unblockCid(cid, accountName);
            }
            else {
                yield accountsActions.unblockAddress(address, accountName);
            }
        }
        catch (e) {
            setErrors([...errors, e]);
            onError === null || onError === void 0 ? void 0 : onError(e);
        }
    });
    return useMemo(() => ({
        blocked,
        block,
        unblock,
        state,
        error: errors[errors.length - 1],
        errors,
    }), [state, blocked, errors, address, accountName]);
}
export function usePublishComment(options) {
    assert(!options || typeof options === 'object', `usePublishComment options argument '${options}' not an object`);
    const _a = options || {}, { accountName } = _a, publishCommentOptions = __rest(_a, ["accountName"]);
    const accountsActions = useAccountsStore((state) => state.accountsActions);
    const accountId = useAccountId(accountName);
    const [errors, setErrors] = useState([]);
    const [state, setState] = useState();
    const [index, setIndex] = useState();
    const [challenge, setChallenge] = useState();
    const [challengeVerification, setChallengeVerification] = useState();
    const [publishChallengeAnswers, setPublishChallengeAnswers] = useState();
    let initialState = 'initializing';
    // before the accountId and options is defined, nothing can happen
    if (accountId && options) {
        initialState = 'ready';
    }
    // define onError if not defined
    const originalOnError = publishCommentOptions.onError;
    const onError = (error) => __awaiter(this, void 0, void 0, function* () {
        setState('failed');
        setErrors([...errors, error]);
        originalOnError === null || originalOnError === void 0 ? void 0 : originalOnError(error);
    });
    publishCommentOptions.onError = onError;
    // define onChallenge if not defined
    const originalOnChallenge = publishCommentOptions.onChallenge;
    const onChallenge = (challenge, comment) => __awaiter(this, void 0, void 0, function* () {
        setState('waiting-challenge-verification');
        // cannot set a function directly with setState
        setPublishChallengeAnswers(() => comment === null || comment === void 0 ? void 0 : comment.publishChallengeAnswers.bind(comment));
        setChallenge(challenge);
        originalOnChallenge === null || originalOnChallenge === void 0 ? void 0 : originalOnChallenge(challenge);
    });
    publishCommentOptions.onChallenge = onChallenge;
    // define onChallengeVerification if not defined
    const originalOnChallengeVerification = publishCommentOptions.onChallengeVerification;
    const onChallengeVerification = (challengeVerification) => __awaiter(this, void 0, void 0, function* () {
        setState((challengeVerification === null || challengeVerification === void 0 ? void 0 : challengeVerification.challengeSuccess) === true ? 'succeeded' : 'failed');
        setChallengeVerification(challengeVerification);
        originalOnChallengeVerification === null || originalOnChallengeVerification === void 0 ? void 0 : originalOnChallengeVerification(challengeVerification);
    });
    publishCommentOptions.onChallengeVerification = onChallengeVerification;
    const publishComment = () => __awaiter(this, void 0, void 0, function* () {
        var _b;
        try {
            const { index } = yield accountsActions.publishComment(publishCommentOptions, accountName);
            setState('waiting-challenge');
            setIndex(index);
        }
        catch (e) {
            setErrors([...errors, e]);
            (_b = publishCommentOptions.onError) === null || _b === void 0 ? void 0 : _b.call(publishCommentOptions, e);
        }
    });
    return useMemo(() => ({
        index,
        challenge,
        challengeVerification,
        publishComment,
        publishChallengeAnswers: publishChallengeAnswers || publishChallengeAnswersNotReady,
        state: state || initialState,
        error: errors[errors.length - 1],
        errors,
    }), [state, errors, index, challenge, challengeVerification, options, accountName, publishChallengeAnswers]);
}
export function usePublishVote(options) {
    assert(!options || typeof options === 'object', `usePublishVote options argument '${options}' not an object`);
    const _a = options || {}, { accountName } = _a, publishVoteOptions = __rest(_a, ["accountName"]);
    const accountsActions = useAccountsStore((state) => state.accountsActions);
    const accountId = useAccountId(accountName);
    const [errors, setErrors] = useState([]);
    const [state, setState] = useState();
    const [challenge, setChallenge] = useState();
    const [challengeVerification, setChallengeVerification] = useState();
    const [publishChallengeAnswers, setPublishChallengeAnswers] = useState();
    let initialState = 'initializing';
    // before the accountId and options is defined, nothing can happen
    if (accountId && options) {
        initialState = 'ready';
    }
    // define onError if not defined
    const originalOnError = publishVoteOptions.onError;
    const onError = (error) => __awaiter(this, void 0, void 0, function* () {
        setState('failed');
        setErrors([...errors, error]);
        originalOnError === null || originalOnError === void 0 ? void 0 : originalOnError(error);
    });
    publishVoteOptions.onError = onError;
    // define onChallenge if not defined
    const originalOnChallenge = publishVoteOptions.onChallenge;
    const onChallenge = (challenge, vote) => __awaiter(this, void 0, void 0, function* () {
        setState('waiting-challenge-verification');
        // cannot set a function directly with setState
        setPublishChallengeAnswers(() => vote === null || vote === void 0 ? void 0 : vote.publishChallengeAnswers.bind(vote));
        setChallenge(challenge);
        originalOnChallenge === null || originalOnChallenge === void 0 ? void 0 : originalOnChallenge(challenge);
    });
    publishVoteOptions.onChallenge = onChallenge;
    // define onChallengeVerification if not defined
    const originalOnChallengeVerification = publishVoteOptions.onChallengeVerification;
    const onChallengeVerification = (challengeVerification) => __awaiter(this, void 0, void 0, function* () {
        setState((challengeVerification === null || challengeVerification === void 0 ? void 0 : challengeVerification.challengeSuccess) === true ? 'succeeded' : 'failed');
        setChallengeVerification(challengeVerification);
        originalOnChallengeVerification === null || originalOnChallengeVerification === void 0 ? void 0 : originalOnChallengeVerification(challengeVerification);
    });
    publishVoteOptions.onChallengeVerification = onChallengeVerification;
    const publishVote = () => __awaiter(this, void 0, void 0, function* () {
        var _b;
        try {
            yield accountsActions.publishVote(publishVoteOptions, accountName);
            setState('waiting-challenge');
        }
        catch (e) {
            setErrors([...errors, e]);
            (_b = publishVoteOptions.onError) === null || _b === void 0 ? void 0 : _b.call(publishVoteOptions, e);
        }
    });
    return useMemo(() => ({
        challenge,
        challengeVerification,
        publishVote,
        publishChallengeAnswers: publishChallengeAnswers || publishChallengeAnswersNotReady,
        state: state || initialState,
        error: errors[errors.length - 1],
        errors,
    }), [state, errors, challenge, challengeVerification, options, accountName, publishChallengeAnswers]);
}
export function usePublishCommentEdit(options) {
    assert(!options || typeof options === 'object', `usePublishCommentEdit options argument '${options}' not an object`);
    const _a = options || {}, { accountName } = _a, publishCommentEditOptions = __rest(_a, ["accountName"]);
    const accountsActions = useAccountsStore((state) => state.accountsActions);
    const accountId = useAccountId(accountName);
    const [errors, setErrors] = useState([]);
    const [state, setState] = useState();
    const [challenge, setChallenge] = useState();
    const [challengeVerification, setChallengeVerification] = useState();
    const [publishChallengeAnswers, setPublishChallengeAnswers] = useState();
    let initialState = 'initializing';
    // before the accountId and options is defined, nothing can happen
    if (accountId && options) {
        initialState = 'ready';
    }
    // define onError if not defined
    const originalOnError = publishCommentEditOptions.onError;
    const onError = (error) => __awaiter(this, void 0, void 0, function* () {
        setState('failed');
        setErrors([...errors, error]);
        originalOnError === null || originalOnError === void 0 ? void 0 : originalOnError(error);
    });
    publishCommentEditOptions.onError = onError;
    // define onChallenge if not defined
    const originalOnChallenge = publishCommentEditOptions.onChallenge;
    const onChallenge = (challenge, commentEdit) => __awaiter(this, void 0, void 0, function* () {
        setState('waiting-challenge-verification');
        // cannot set a function directly with setState
        setPublishChallengeAnswers(() => commentEdit === null || commentEdit === void 0 ? void 0 : commentEdit.publishChallengeAnswers.bind(commentEdit));
        setChallenge(challenge);
        originalOnChallenge === null || originalOnChallenge === void 0 ? void 0 : originalOnChallenge(challenge);
    });
    publishCommentEditOptions.onChallenge = onChallenge;
    // define onChallengeVerification if not defined
    const originalOnChallengeVerification = publishCommentEditOptions.onChallengeVerification;
    const onChallengeVerification = (challengeVerification) => __awaiter(this, void 0, void 0, function* () {
        setState((challengeVerification === null || challengeVerification === void 0 ? void 0 : challengeVerification.challengeSuccess) === true ? 'succeeded' : 'failed');
        setChallengeVerification(challengeVerification);
        originalOnChallengeVerification === null || originalOnChallengeVerification === void 0 ? void 0 : originalOnChallengeVerification(challengeVerification);
    });
    publishCommentEditOptions.onChallengeVerification = onChallengeVerification;
    const publishCommentEdit = () => __awaiter(this, void 0, void 0, function* () {
        var _b;
        try {
            yield accountsActions.publishCommentEdit(publishCommentEditOptions, accountName);
            setState('waiting-challenge');
        }
        catch (e) {
            setErrors([...errors, e]);
            (_b = publishCommentEditOptions.onError) === null || _b === void 0 ? void 0 : _b.call(publishCommentEditOptions, e);
        }
    });
    return useMemo(() => ({
        challenge,
        challengeVerification,
        publishCommentEdit,
        publishChallengeAnswers: publishChallengeAnswers || publishChallengeAnswersNotReady,
        state: state || initialState,
        error: errors[errors.length - 1],
        errors,
    }), [state, errors, challenge, challengeVerification, options, accountName, publishChallengeAnswers]);
}
export function usePublishSubplebbitEdit(options) {
    assert(!options || typeof options === 'object', `usePublishSubplebbitEdit options argument '${options}' not an object`);
    const _a = options || {}, { accountName, subplebbitAddress } = _a, publishSubplebbitEditOptions = __rest(_a, ["accountName", "subplebbitAddress"]);
    const accountsActions = useAccountsStore((state) => state.accountsActions);
    const accountId = useAccountId(accountName);
    const [errors, setErrors] = useState([]);
    const [state, setState] = useState();
    const [challenge, setChallenge] = useState();
    const [challengeVerification, setChallengeVerification] = useState();
    const [publishChallengeAnswers, setPublishChallengeAnswers] = useState();
    let initialState = 'initializing';
    // before the accountId and options is defined, nothing can happen
    if (accountId && subplebbitAddress) {
        initialState = 'ready';
    }
    // define onError if not defined
    const originalOnError = publishSubplebbitEditOptions.onError;
    const onError = (error) => __awaiter(this, void 0, void 0, function* () {
        setState('failed');
        setErrors([...errors, error]);
        originalOnError === null || originalOnError === void 0 ? void 0 : originalOnError(error);
    });
    publishSubplebbitEditOptions.onError = onError;
    // define onChallenge if not defined
    const originalOnChallenge = publishSubplebbitEditOptions.onChallenge;
    const onChallenge = (challenge, subplebbitEdit) => __awaiter(this, void 0, void 0, function* () {
        setState('waiting-challenge-verification');
        // cannot set a function directly with setState
        setPublishChallengeAnswers(() => subplebbitEdit === null || subplebbitEdit === void 0 ? void 0 : subplebbitEdit.publishChallengeAnswers.bind(subplebbitEdit));
        setChallenge(challenge);
        originalOnChallenge === null || originalOnChallenge === void 0 ? void 0 : originalOnChallenge(challenge);
    });
    publishSubplebbitEditOptions.onChallenge = onChallenge;
    // define onChallengeVerification if not defined
    const originalOnChallengeVerification = publishSubplebbitEditOptions.onChallengeVerification;
    const onChallengeVerification = (challengeVerification) => __awaiter(this, void 0, void 0, function* () {
        setState((challengeVerification === null || challengeVerification === void 0 ? void 0 : challengeVerification.challengeSuccess) === true ? 'succeeded' : 'failed');
        setChallengeVerification(challengeVerification);
        originalOnChallengeVerification === null || originalOnChallengeVerification === void 0 ? void 0 : originalOnChallengeVerification(challengeVerification);
    });
    publishSubplebbitEditOptions.onChallengeVerification = onChallengeVerification;
    const publishSubplebbitEdit = () => __awaiter(this, void 0, void 0, function* () {
        var _b;
        try {
            yield accountsActions.publishSubplebbitEdit(subplebbitAddress, publishSubplebbitEditOptions, accountName);
            setState('waiting-challenge');
        }
        catch (e) {
            setErrors([...errors, e]);
            (_b = publishSubplebbitEditOptions.onError) === null || _b === void 0 ? void 0 : _b.call(publishSubplebbitEditOptions, e);
        }
    });
    return useMemo(() => ({
        challenge,
        challengeVerification,
        publishSubplebbitEdit,
        publishChallengeAnswers: publishChallengeAnswers || publishChallengeAnswersNotReady,
        state: state || initialState,
        error: errors[errors.length - 1],
        errors,
    }), [state, errors, challenge, challengeVerification, options, accountName, publishChallengeAnswers]);
}
export function useCreateSubplebbit(options) {
    assert(!options || typeof options === 'object', `useCreateSubplebbit options argument '${options}' not an object`);
    const _a = options || {}, { accountName, onError } = _a, createSubplebbitOptions = __rest(_a, ["accountName", "onError"]);
    const accountId = useAccountId(accountName);
    const accountsActions = useAccountsStore((state) => state.accountsActions);
    const [errors, setErrors] = useState([]);
    const [state, setState] = useState();
    const [createdSubplebbit, setCreatedSubplebbit] = useState();
    let initialState = 'initializing';
    // before the accountId and options is defined, nothing can happen
    if (accountId && options) {
        initialState = 'ready';
    }
    const createSubplebbit = () => __awaiter(this, void 0, void 0, function* () {
        try {
            setState('creating');
            const createdSubplebbit = yield accountsActions.createSubplebbit(createSubplebbitOptions, accountName);
            setCreatedSubplebbit(createdSubplebbit);
            setState('succeeded');
        }
        catch (e) {
            setErrors([...errors, e]);
            setState('failed');
            onError === null || onError === void 0 ? void 0 : onError(e);
        }
    });
    return useMemo(() => ({
        createdSubplebbit,
        createSubplebbit,
        state: state || initialState,
        error: errors[errors.length - 1],
        errors,
    }), [state, errors, createdSubplebbit, options, accountName]);
}
