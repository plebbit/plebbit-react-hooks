var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useEffect, useState, useMemo } from 'react';
import { useInterval } from '../utils/use-interval';
import { useAccount } from '../accounts';
import Logger from '@plebbit/plebbit-logger';
const log = Logger('plebbit-react-hooks:authors:hooks');
import assert from 'assert';
import { useNftMetadataUrl, useNftImageUrl, useVerifiedAuthorAvatarSignature, useAuthorAvatarIsWhitelisted } from './author-avatars';
import { useComment } from '../comments';
import { useAuthorCommentsName, usePlebbitAddress } from './utils';
import useAuthorsCommentsStore from '../../stores/authors-comments';
import PlebbitJs from '../../lib/plebbit-js';
import QuickLRU from 'quick-lru';
export { setAuthorAvatarsWhitelistedTokenAddresses } from './author-avatars';
/**
 * @param authorAddress - The address of the author
 * @param commentCid - The last known comment cid of the author (not possible to get an author without providing at least 1 comment cid)
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useAuthorComments(options) {
    assert(!options || typeof options === 'object', `useAuthorComments options argument '${options}' not an object`);
    const { authorAddress, commentCid, accountName, filter } = options || {};
    const account = useAccount({ accountName });
    const authorCommentsName = useAuthorCommentsName(account === null || account === void 0 ? void 0 : account.id, authorAddress, filter);
    const incrementPageNumber = useAuthorsCommentsStore((state) => state.incrementPageNumber);
    const addAuthorCommentsToStore = useAuthorsCommentsStore((state) => state.addAuthorCommentsToStore);
    const hasMoreBufferedComments = useAuthorsCommentsStore((state) => state.hasMoreBufferedComments[authorCommentsName || '']);
    const hasNextCommentCidToFetch = useAuthorsCommentsStore((state) => Boolean(state.nextCommentCidsToFetch[authorAddress || '']));
    const authorComments = useAuthorsCommentsStore((state) => state.loadedComments[authorCommentsName || '']);
    const lastCommentCid = useAuthorsCommentsStore((state) => state.lastCommentCids[authorAddress || '']);
    // add authors comments to store
    useEffect(() => {
        if (!authorAddress || !commentCid || !account) {
            return;
        }
        try {
            addAuthorCommentsToStore(authorCommentsName, authorAddress, commentCid, filter, account);
        }
        catch (error) {
            log.error('useAuthorComments addAuthorCommentsToStore error', { authorCommentsName, error });
        }
    }, [authorCommentsName, commentCid]);
    const loadMore = () => __awaiter(this, void 0, void 0, function* () {
        try {
            if (!authorAddress || !account) {
                throw Error('useAuthorComments cannot load more authorComments not initalized yet');
            }
            incrementPageNumber(authorCommentsName);
        }
        catch (e) {
            // wait 100 ms so infinite scroll doesn't spam this function
            yield new Promise((r) => setTimeout(r, 50));
            // TODO: maybe add these errors to errors array
        }
    });
    const hasMore = hasMoreBufferedComments || hasNextCommentCidToFetch;
    const authorResult = useAuthor({ commentCid, authorAddress, accountName });
    const state = authorResult.state;
    const errors = authorResult.errors;
    if (authorResult.author) {
        log('useAuthorComments', {
            authorAddress,
            commentCid,
            // authorComments,
            authorCommentsSize: (authorComments === null || authorComments === void 0 ? void 0 : authorComments.length) || 0,
            lastCommentCid,
            hasMoreBufferedComments,
            hasNextCommentCidToFetch,
            hasMore,
            state,
            errors,
            authorResult,
            accountName,
        });
    }
    return useMemo(() => ({
        authorComments: authorComments || [],
        lastCommentCid,
        hasMore,
        loadMore,
        state,
        error: errors[errors.length - 1],
        errors,
    }), [authorComments, lastCommentCid, hasMore, errors, state]);
}
/**
 * @param authorAddress - The address of the author
 * @param commentCid - The last known comment cid of the author (not possible to get an author without providing at least 1 comment cid)
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useAuthor(options) {
    var _a;
    assert(!options || typeof options === 'object', `useAuthor options argument '${options}' not an object`);
    const { authorAddress, commentCid, accountName } = options || {};
    const comment = useComment({ commentCid, accountName });
    // the commentCid doesnt have the same author address as authorAddress
    const useAuthorError = useMemo(() => {
        var _a;
        // if comment is loaded and author address is different from authorAddress
        if ((comment === null || comment === void 0 ? void 0 : comment.timestamp) && authorAddress && ((_a = comment === null || comment === void 0 ? void 0 : comment.author) === null || _a === void 0 ? void 0 : _a.address) !== authorAddress) {
            return Error('commentCid author.address is different from authorAddress');
        }
        if (commentCid && !authorAddress) {
            return Error('missing UseAuthorOptions.authorAddress');
        }
        if (!commentCid && authorAddress) {
            return Error('missing UseAuthorOptions.commentCid');
        }
    }, [commentCid, comment === null || comment === void 0 ? void 0 : comment.timestamp, (_a = comment === null || comment === void 0 ? void 0 : comment.author) === null || _a === void 0 ? void 0 : _a.address, authorAddress]);
    // if has author error, don't return the autor
    let author;
    if (!useAuthorError) {
        author = comment === null || comment === void 0 ? void 0 : comment.author;
    }
    // merge comment.errors with useAuthorError
    const errors = useMemo(() => {
        if (useAuthorError) {
            return [...comment.errors, useAuthorError];
        }
        return comment.errors;
    }, [comment.errors, useAuthorError]);
    // if has author error, state failed
    let state = author ? 'succeeded' : (comment === null || comment === void 0 ? void 0 : comment.state) || 'initializing';
    if (useAuthorError) {
        state = 'failed';
    }
    if (comment === null || comment === void 0 ? void 0 : comment.timestamp) {
        log('useAuthor', { authorAddress, commentCid, author, comment, useAuthorError, state, accountName });
    }
    return useMemo(() => ({
        author,
        state,
        error: errors[errors.length - 1],
        errors,
    }), [author, errors, state]);
}
/**
 * @param author - The Author object to resolve the avatar image URL of.
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
// NOTE: useAuthorAvatar tests are skipped, if changes are made they must be tested manually
export function useAuthorAvatar(options) {
    var _a, _b, _c;
    assert(!options || typeof options === 'object', `useAuthorAvatar options argument '${options}' not an object`);
    const { author, accountName } = options || {};
    const account = useAccount({ accountName });
    // TODO: resolve crypto domain and check if one of the record is a profile pic
    const { verified, error: signatureError } = useVerifiedAuthorAvatarSignature(author, accountName);
    const verifiedError = verified === false && Error(`nft ownership signature proof invalid`);
    const isWhitelisted = useAuthorAvatarIsWhitelisted(author === null || author === void 0 ? void 0 : author.avatar);
    const whitelistedError = isWhitelisted === false && Error(`nft collection '${(_a = author === null || author === void 0 ? void 0 : author.avatar) === null || _a === void 0 ? void 0 : _a.address}' not whitelisted`);
    // don't try to get avatar image url at all if signature isn't verified and whitelisted
    const avatar = verified && isWhitelisted ? author === null || author === void 0 ? void 0 : author.avatar : undefined;
    const { metadataUrl, error: nftMetadataError } = useNftMetadataUrl(avatar, accountName);
    const { imageUrl, error: nftImageUrlError } = useNftImageUrl(metadataUrl, accountName);
    const chainProvider = (_c = (_b = account === null || account === void 0 ? void 0 : account.plebbitOptions) === null || _b === void 0 ? void 0 : _b.chainProviders) === null || _c === void 0 ? void 0 : _c[avatar === null || avatar === void 0 ? void 0 : avatar.chainTicker];
    const error = whitelistedError || verifiedError || signatureError || nftMetadataError || nftImageUrlError || undefined;
    const errors = useMemo(() => (error ? [error] : []), [error]);
    let state = 'initializing';
    if (!(author === null || author === void 0 ? void 0 : author.avatar)) {
        // do nothing, is initializing
    }
    else if (error) {
        state = 'failed';
    }
    else if (imageUrl !== undefined) {
        state = 'succeeded';
    }
    else if (metadataUrl !== undefined) {
        state = 'fetching-metadata';
    }
    else if (verified !== undefined) {
        state = 'fetching-uri';
    }
    else if (author === null || author === void 0 ? void 0 : author.avatar) {
        state = 'fetching-owner';
    }
    if (author === null || author === void 0 ? void 0 : author.avatar) {
        log('useAuthorAvatar', { author, state, verified, isWhitelisted, metadataUrl, imageUrl });
    }
    return useMemo(() => ({
        imageUrl,
        metadataUrl,
        chainProvider,
        state,
        error,
        errors,
    }), [imageUrl, metadataUrl, chainProvider, state, error]);
}
/**
 * @param author - The Author object to resolve the address of.
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useAuthorAddress(options) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    assert(!options || typeof options === 'object', `useAuthorAddress options argument '${options}' not an object`);
    const { comment, accountName } = options || {};
    const account = useAccount({ accountName });
    const isCryptoName = !!((_c = (_b = (_a = comment === null || comment === void 0 ? void 0 : comment.author) === null || _a === void 0 ? void 0 : _a.address) === null || _b === void 0 ? void 0 : _b.includes) === null || _c === void 0 ? void 0 : _c.call(_b, '.'));
    const [resolvedAddress, setResolvedAddress] = useState(isCryptoName ? resolvedAuthorAddressCache.get((_d = comment === null || comment === void 0 ? void 0 : comment.author) === null || _d === void 0 ? void 0 : _d.address) : undefined);
    const signerAddress = usePlebbitAddress(isCryptoName ? (_e = comment === null || comment === void 0 ? void 0 : comment.signature) === null || _e === void 0 ? void 0 : _e.publicKey : undefined);
    // useful for triggering css animation when the address changes from unverified to verified
    const [authorAddressChanged, setAuthorAddressChanged] = useState(false);
    useEffect(() => {
        var _a;
        if (!(account === null || account === void 0 ? void 0 : account.plebbit) || !((_a = comment === null || comment === void 0 ? void 0 : comment.author) === null || _a === void 0 ? void 0 : _a.address) || !isCryptoName) {
            return;
        }
        const resolveAuthorAddressNoCache = () => {
            var _a, _b, _c, _d, _e, _f;
            if (Boolean(resolveAuthorAddressPromises[(_a = comment === null || comment === void 0 ? void 0 : comment.author) === null || _a === void 0 ? void 0 : _a.address])) {
                return resolveAuthorAddressPromises[(_b = comment === null || comment === void 0 ? void 0 : comment.author) === null || _b === void 0 ? void 0 : _b.address];
            }
            log('useAuthorAddress plebbit.resolveAuthorAddress', { address: (_c = comment === null || comment === void 0 ? void 0 : comment.author) === null || _c === void 0 ? void 0 : _c.address });
            resolveAuthorAddressPromises[(_d = comment === null || comment === void 0 ? void 0 : comment.author) === null || _d === void 0 ? void 0 : _d.address] = account.plebbit.resolveAuthorAddress((_e = comment === null || comment === void 0 ? void 0 : comment.author) === null || _e === void 0 ? void 0 : _e.address);
            return resolveAuthorAddressPromises[(_f = comment === null || comment === void 0 ? void 0 : comment.author) === null || _f === void 0 ? void 0 : _f.address];
        };
        const resolveAuthorAddress = () => __awaiter(this, void 0, void 0, function* () {
            var _b, _c;
            const cached = resolvedAuthorAddressCache.get((_b = comment === null || comment === void 0 ? void 0 : comment.author) === null || _b === void 0 ? void 0 : _b.address);
            if (cached) {
                return cached;
            }
            const res = yield resolveAuthorAddressNoCache();
            resolvedAuthorAddressCache.set((_c = comment === null || comment === void 0 ? void 0 : comment.author) === null || _c === void 0 ? void 0 : _c.address, res);
            return res;
        });
        resolveAuthorAddress()
            .then((_resolvedAddress) => {
            if (_resolvedAddress !== resolvedAddress) {
                setResolvedAddress(_resolvedAddress);
                setAuthorAddressChanged(true);
            }
        })
            .catch((error) => log.error('useAuthorAddress error', { error, comment }));
    }, [account === null || account === void 0 ? void 0 : account.plebbit, (_f = comment === null || comment === void 0 ? void 0 : comment.author) === null || _f === void 0 ? void 0 : _f.address, isCryptoName]);
    // use signer address by default
    let authorAddress = signerAddress;
    // if author address was resolved successfully, use author address
    if (resolvedAddress && signerAddress === resolvedAddress) {
        authorAddress = (_g = comment === null || comment === void 0 ? void 0 : comment.author) === null || _g === void 0 ? void 0 : _g.address;
    }
    // if isn't crypto name, always use author address
    if (!isCryptoName) {
        authorAddress = (_h = comment === null || comment === void 0 ? void 0 : comment.author) === null || _h === void 0 ? void 0 : _h.address;
    }
    // if comment has no signature, it's a pending account comment, no need to verify it
    // TODO: eventually account comments will have a signature immediately
    if (comment && !(comment === null || comment === void 0 ? void 0 : comment.signature)) {
        authorAddress = (_j = comment === null || comment === void 0 ? void 0 : comment.author) === null || _j === void 0 ? void 0 : _j.address;
    }
    let shortAuthorAddress = authorAddress && PlebbitJs.Plebbit.getShortAddress(authorAddress);
    // if shortAddress is smaller than crypto name, give a longer
    // shortAddress to cause the least UI displacement as possible
    // -4 chars because most fonts will make the address larger
    if (isCryptoName && authorAddress && shortAuthorAddress.length < ((_l = (_k = comment === null || comment === void 0 ? void 0 : comment.author) === null || _k === void 0 ? void 0 : _k.address) === null || _l === void 0 ? void 0 : _l.length) - 4) {
        const restOfAuthorAddress = authorAddress.split(shortAuthorAddress).pop();
        shortAuthorAddress = (shortAuthorAddress + restOfAuthorAddress).substring(0, ((_o = (_m = comment === null || comment === void 0 ? void 0 : comment.author) === null || _m === void 0 ? void 0 : _m.address) === null || _o === void 0 ? void 0 : _o.length) - 4);
    }
    return useMemo(() => ({
        authorAddress,
        shortAuthorAddress,
        authorAddressChanged,
        state: 'initializing',
        error: undefined,
        errors: [],
    }), [authorAddress, shortAuthorAddress]);
}
// TODO: figure out how to upgrade to quick-lru 6+ to use maxAge
const resolvedAuthorAddressCache = new QuickLRU({ maxSize: 1000 });
const resolveAuthorAddressPromises = {};
/**
 * @param author - The author with author.address to resolve to a public key, e.g. 'john.eth' resolves to '12D3KooW...'.
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
// NOTE: useResolvedAuthorAddress tests are skipped, if changes are made they must be tested manually
export function useResolvedAuthorAddress(options) {
    var _a, _b;
    assert(!options || typeof options === 'object', `useResolvedAuthorAddress options argument '${options}' not an object`);
    let { author, accountName, cache } = options || {};
    // cache by default
    if (typeof cache !== 'boolean') {
        cache = true;
    }
    // poll every 15 seconds, about the duration of an eth block
    let interval = 15000;
    // no point in polling often if caching is on
    if (cache) {
        interval = 1000 * 60 * 60 * 25;
    }
    const account = useAccount({ accountName });
    // possible to use account.plebbit instead of account.plebbitOptions
    const chainProviders = (_a = account === null || account === void 0 ? void 0 : account.plebbitOptions) === null || _a === void 0 ? void 0 : _a.chainProviders;
    const [resolvedAddress, setResolvedAddress] = useState();
    const [errors, setErrors] = useState([]);
    const [state, setState] = useState();
    let initialState = 'initializing';
    // before those defined, nothing can happen
    if (options && account && (author === null || author === void 0 ? void 0 : author.address)) {
        initialState = 'ready';
    }
    const isCryptoName = author === null || author === void 0 ? void 0 : author.address.includes('.');
    const tld = isCryptoName ? (_b = author === null || author === void 0 ? void 0 : author.address) === null || _b === void 0 ? void 0 : _b.split('.').pop() : undefined;
    const resolveAuthorAddressNoCache = () => {
        if (Boolean(resolveAuthorAddressPromises[author === null || author === void 0 ? void 0 : author.address])) {
            return resolveAuthorAddressPromises[author === null || author === void 0 ? void 0 : author.address];
        }
        log('useResolvedAuthorAddress plebbit.resolveAuthorAddress', { address: author === null || author === void 0 ? void 0 : author.address });
        resolveAuthorAddressPromises[author === null || author === void 0 ? void 0 : author.address] = account.plebbit.resolveAuthorAddress(author === null || author === void 0 ? void 0 : author.address);
        return resolveAuthorAddressPromises[author === null || author === void 0 ? void 0 : author.address];
    };
    const resolveAuthorAddress = () => __awaiter(this, void 0, void 0, function* () {
        const cached = resolvedAuthorAddressCache.get(author === null || author === void 0 ? void 0 : author.address);
        if (cached) {
            return cached;
        }
        const res = yield resolveAuthorAddressNoCache();
        resolvedAuthorAddressCache.set(author === null || author === void 0 ? void 0 : author.address, res);
        return res;
    });
    useInterval(() => {
        // no options, do nothing or reset
        if (!account || !(author === null || author === void 0 ? void 0 : author.address)) {
            if (resolvedAddress !== undefined) {
                setResolvedAddress(undefined);
            }
            if (state !== undefined) {
                setState(undefined);
            }
            if (errors.length) {
                setErrors([]);
            }
            return;
        }
        // address isn't a crypto domain, can't be resolved
        if (!isCryptoName) {
            if (state !== 'failed') {
                setErrors([Error('not a crypto domain')]);
                setState('failed');
                setResolvedAddress(undefined);
            }
            return;
        }
        // only support resolving '.eth/.sol' for now
        if (tld !== 'eth' && tld !== 'sol') {
            if (state !== 'failed') {
                setErrors([Error('crypto domain type unsupported')]);
                setState('failed');
                setResolvedAddress(undefined);
            }
            return;
        }
        ;
        (() => __awaiter(this, void 0, void 0, function* () {
            try {
                setState('resolving');
                let res;
                if (cache) {
                    res = yield resolveAuthorAddress();
                }
                else {
                    res = yield resolveAuthorAddressNoCache();
                }
                setState('succeeded');
                // TODO: check if resolved address is the same as author.signer.publicKey
                if (res !== resolvedAddress) {
                    setResolvedAddress(res);
                }
            }
            catch (error) {
                setErrors([...errors, error]);
                setState('failed');
                setResolvedAddress(undefined);
                log.error('useResolvedAuthorAddress resolveAuthorAddress error', { author, chainProviders, error });
            }
        }))();
    }, interval, true, [author === null || author === void 0 ? void 0 : author.address, chainProviders]);
    log('useResolvedAuthorAddress', { author, state, errors, resolvedAddress, chainProviders });
    const chainProvider = chainProviders === null || chainProviders === void 0 ? void 0 : chainProviders[tld];
    return useMemo(() => ({
        resolvedAddress,
        chainProvider,
        state: state || initialState,
        error: errors[errors.length - 1],
        errors,
    }), [resolvedAddress, chainProvider, state, errors]);
}
