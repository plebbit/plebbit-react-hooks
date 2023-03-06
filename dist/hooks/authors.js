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
import { useInterval } from './utils/use-interval';
import { useAccount } from './accounts';
import Logger from '@plebbit/plebbit-logger';
const log = Logger('plebbit-react-hooks:authors:hooks');
import assert from 'assert';
import { ethers } from 'ethers';
import { getNftMetadataUrl, getNftImageUrl, getNftOwner, resolveEnsTxtRecord, resolveEnsTxtRecordNoCache } from '../lib/blockchain';
/**
 * @param author - The Author object to resolve the avatar image URL of.
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
// NOTE: useAuthorAvatar tests are skipped, if changes are made they must be tested manually
export function useAuthorAvatar(options) {
    var _a, _b, _c;
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
    const chainProvider = (_c = (_b = account === null || account === void 0 ? void 0 : account.plebbitOptions) === null || _b === void 0 ? void 0 : _b.blockchainProviders) === null || _c === void 0 ? void 0 : _c[avatar === null || avatar === void 0 ? void 0 : avatar.chainTicker];
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
 * @param nft - The NFT object to resolve the URL of.
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
// NOTE: useNftMetadataUrl tests are skipped, if changes are made they must be tested manually
export function useNftMetadataUrl(nft, accountName) {
    var _a, _b, _c, _d;
    const account = useAccount({ accountName });
    // possible to use account.plebbit instead of account.plebbitOptions
    const ipfsGatewayUrl = (_a = account === null || account === void 0 ? void 0 : account.plebbitOptions) === null || _a === void 0 ? void 0 : _a.ipfsGatewayUrl;
    const blockchainProviders = (_b = account === null || account === void 0 ? void 0 : account.plebbitOptions) === null || _b === void 0 ? void 0 : _b.blockchainProviders;
    const [nftMetadataUrl, setNftMetadataUrl] = useState();
    const [error, setError] = useState();
    const getNftMetadataUrlArgs = [
        nft === null || nft === void 0 ? void 0 : nft.address,
        nft === null || nft === void 0 ? void 0 : nft.id,
        nft === null || nft === void 0 ? void 0 : nft.chainTicker,
        (_c = blockchainProviders === null || blockchainProviders === void 0 ? void 0 : blockchainProviders[nft === null || nft === void 0 ? void 0 : nft.chainTicker]) === null || _c === void 0 ? void 0 : _c.url,
        (_d = blockchainProviders === null || blockchainProviders === void 0 ? void 0 : blockchainProviders[nft === null || nft === void 0 ? void 0 : nft.chainTicker]) === null || _d === void 0 ? void 0 : _d.chainId,
        ipfsGatewayUrl,
    ];
    useEffect(() => {
        // reset
        setError(undefined);
        setNftMetadataUrl(undefined);
        if (!account || !nft) {
            return;
        }
        ;
        (() => __awaiter(this, void 0, void 0, function* () {
            try {
                const url = yield getNftMetadataUrl(...getNftMetadataUrlArgs);
                setNftMetadataUrl(url);
            }
            catch (error) {
                setError(error);
                log.error('useNftMetadataUrl getNftMetadataUrl error', { nft, ipfsGatewayUrl, blockchainProviders, error });
            }
        }))();
    }, getNftMetadataUrlArgs);
    log('useNftMetadataUrl', { nft, ipfsGatewayUrl, nftMetadataUrl, blockchainProviders });
    return { metadataUrl: nftMetadataUrl, error };
}
/**
 * @param nftMetadataUrl - The NFT URL to resolve the image URL of.
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
// NOTE: useNftImageUrl tests are skipped, if changes are made they must be tested manually
export function useNftImageUrl(nftMetadataUrl, accountName) {
    var _a;
    assert(!nftMetadataUrl || typeof nftMetadataUrl === 'string', `useNftImageUrl invalid argument nftMetadataUrl '${nftMetadataUrl}' not a string`);
    const account = useAccount({ accountName });
    // possible to use account.plebbit instead of account.plebbitOptions
    const ipfsGatewayUrl = (_a = account === null || account === void 0 ? void 0 : account.plebbitOptions) === null || _a === void 0 ? void 0 : _a.ipfsGatewayUrl;
    const [imageUrl, setImageUrl] = useState();
    const [error, setError] = useState();
    useEffect(() => {
        // reset
        setError(undefined);
        setImageUrl(undefined);
        if (!account || !nftMetadataUrl) {
            return;
        }
        ;
        (() => __awaiter(this, void 0, void 0, function* () {
            try {
                const url = yield getNftImageUrl(nftMetadataUrl, ipfsGatewayUrl);
                setImageUrl(url);
            }
            catch (error) {
                setError(error);
                log.error('useNftImageUrl getNftImageUrl error', { nftMetadataUrl, ipfsGatewayUrl, error });
            }
        }))();
    }, [nftMetadataUrl, ipfsGatewayUrl]);
    // log('useNftImageUrl', {nftMetadataUrl, ipfsGatewayUrl, imageUrl})
    return { imageUrl, error };
}
// NOTE: useVerifiedAuthorAvatarSignature tests are skipped, if changes are made they must be tested manually
export function useVerifiedAuthorAvatarSignature(author, accountName) {
    var _a;
    const account = useAccount({ accountName });
    // possible to use account.plebbit instead of account.plebbitOptions
    const blockchainProviders = (_a = account === null || account === void 0 ? void 0 : account.plebbitOptions) === null || _a === void 0 ? void 0 : _a.blockchainProviders;
    const [verified, setVerified] = useState();
    const [error, setError] = useState();
    useEffect(() => {
        // reset
        setError(undefined);
        setVerified(undefined);
        if (!account || !(author === null || author === void 0 ? void 0 : author.avatar)) {
            return;
        }
        ;
        (() => __awaiter(this, void 0, void 0, function* () {
            try {
                const res = yield verifyAuthorAvatarSignature(author.avatar, author.address, blockchainProviders);
                setVerified(res);
            }
            catch (error) {
                setError(error);
                log.error('useVerifiedAuthorAvatarSignature verifyAuthorAvatarSignature error', { author, blockchainProviders, error });
            }
        }))();
    }, [author === null || author === void 0 ? void 0 : author.avatar, author === null || author === void 0 ? void 0 : author.address, blockchainProviders]);
    // don't verify nft signature when using mock content during development
    if (process.env.REACT_APP_PLEBBIT_REACT_HOOKS_MOCK_CONTENT) {
        return { verified: true, error: undefined };
    }
    // log('useVerifiedAuthorAvatarSignature', {author, verified, blockchainProviders})
    return { verified, error };
}
const whitelistedTokenAddresses = {
    // xpleb nfts
    '0x890a2e81836e0e76e0f49995e6b51ca6ce6f39ed': true,
    // plebsquat
    '0x52e6cd20f5fca56da5a0e489574c92af118b8188': true,
    // random nfts contracts used in mock content and tests
    '0xed5af388653567af2f388e6224dc7c4b3241c544': true,
    '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d': true,
    '0x60e4d786628fea6478f785a6d7e704777c86a7c6': true,
    '0x79fcdef22feed20eddacbb2587640e45491b757f': true,
    '0xf6d8e606c862143556b342149a7fe0558c220375': true,
};
// make sure lower case version exists
for (const i in whitelistedTokenAddresses) {
    whitelistedTokenAddresses[i.toLowerCase()] = whitelistedTokenAddresses[i];
}
function useAuthorAvatarIsWhitelisted(nft) {
    // TODO: make a list that a dao can vote it, get the list from plebbit.getDefaults()
    // TODO: make subplebbit owners able to whitelist their own nfts in their subplebbits
    // TODO: make each user able to whitelist/blacklist any nft they want for their own client
    // TODO: make hook to list which default nfts are whitelisted to display to the user
    var _a;
    const isWhitelisted = (nft === null || nft === void 0 ? void 0 : nft.address) && Boolean(whitelistedTokenAddresses[(_a = nft === null || nft === void 0 ? void 0 : nft.address) === null || _a === void 0 ? void 0 : _a.toLowerCase()]);
    return isWhitelisted;
}
// NOTE: verifyAuthorAvatarSignature tests are skipped, if changes are made they must be tested manually
export const verifyAuthorAvatarSignature = (nft, authorAddress, blockchainProviders) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    assert(nft && typeof nft === 'object', `verifyAuthorAvatarSignature invalid nft argument '${nft}'`);
    assert(nft === null || nft === void 0 ? void 0 : nft.address, `verifyAuthorAvatarSignature invalid nft.address '${nft === null || nft === void 0 ? void 0 : nft.address}'`);
    assert(nft === null || nft === void 0 ? void 0 : nft.id, `verifyAuthorAvatarSignature invalid nft.tokenAddress '${nft === null || nft === void 0 ? void 0 : nft.id}'`);
    assert(nft === null || nft === void 0 ? void 0 : nft.signature, `verifyAuthorAvatarSignature invalid nft.signature '${nft === null || nft === void 0 ? void 0 : nft.signature}'`);
    assert((_a = nft === null || nft === void 0 ? void 0 : nft.signature) === null || _a === void 0 ? void 0 : _a.signature, `verifyAuthorAvatarSignature invalid nft.signature.signature '${(_b = nft === null || nft === void 0 ? void 0 : nft.signature) === null || _b === void 0 ? void 0 : _b.signature}'`);
    assert(authorAddress, `verifyAuthorAvatarSignature invalid authorAddress '${authorAddress}'`);
    // get the owner of the nft at nft.id
    const currentNftOwnerAddress = yield getNftOwner(nft === null || nft === void 0 ? void 0 : nft.address, nft === null || nft === void 0 ? void 0 : nft.id, nft === null || nft === void 0 ? void 0 : nft.chainTicker, (_c = blockchainProviders === null || blockchainProviders === void 0 ? void 0 : blockchainProviders[nft === null || nft === void 0 ? void 0 : nft.chainTicker]) === null || _c === void 0 ? void 0 : _c.url, (_d = blockchainProviders === null || blockchainProviders === void 0 ? void 0 : blockchainProviders[nft === null || nft === void 0 ? void 0 : nft.chainTicker]) === null || _d === void 0 ? void 0 : _d.chainId);
    let messageThatShouldBeSigned = {};
    // the property names must be in this order for the signature to match
    // insert props one at a time otherwise babel/webpack will reorder
    messageThatShouldBeSigned.domainSeparator = 'plebbit-author-avatar';
    messageThatShouldBeSigned.tokenAddress = nft.address;
    messageThatShouldBeSigned.tokenId = String(nft.id); // must be string type, not number
    messageThatShouldBeSigned.authorAddress = authorAddress;
    messageThatShouldBeSigned = JSON.stringify(messageThatShouldBeSigned);
    const signatureAddress = ethers.utils.verifyMessage(messageThatShouldBeSigned, nft.signature.signature);
    let verified = true;
    if (currentNftOwnerAddress !== signatureAddress) {
        verified = false;
    }
    return verified;
});
/**
 * @param author - The author address to resolve to a public key, e.g. 'john.eth' resolves to 'Qm...'.
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
// NOTE: useResolvedAuthorAddress tests are skipped, if changes are made they must be tested manually
export function useResolvedAuthorAddress(options) {
    var _a;
    let { author, accountName, cache } = options || {};
    // cache by default
    if (cache === undefined) {
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
    const blockchainProviders = (_a = account === null || account === void 0 ? void 0 : account.plebbitOptions) === null || _a === void 0 ? void 0 : _a.blockchainProviders;
    const [resolvedAddress, setResolvedAddress] = useState();
    const [errors, setErrors] = useState([]);
    const [state, setState] = useState();
    let initialState = 'initializing';
    // before those defined, nothing can happen
    if (options && account && (author === null || author === void 0 ? void 0 : author.address)) {
        initialState = 'ready';
    }
    useInterval(() => {
        var _a;
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
        if (!(author === null || author === void 0 ? void 0 : author.address.includes('.'))) {
            if (state !== 'failed') {
                setErrors([Error('not a crypto domain')]);
                setState('failed');
                setResolvedAddress(undefined);
            }
            return;
        }
        // only support resolving '.eth' for now
        if (!((_a = author === null || author === void 0 ? void 0 : author.address) === null || _a === void 0 ? void 0 : _a.endsWith('.eth'))) {
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
                const res = yield resolveAuthorAddress(author === null || author === void 0 ? void 0 : author.address, blockchainProviders, cache);
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
                log.error('useResolvedAuthorAddress resolveAuthorAddress error', { author, blockchainProviders, error });
            }
        }))();
    }, interval, true, [author === null || author === void 0 ? void 0 : author.address, blockchainProviders]);
    // log('useResolvedAuthorAddress', {author, state, errors, resolvedAddress, blockchainProviders})
    // only support ENS at the moment
    const chainProvider = blockchainProviders === null || blockchainProviders === void 0 ? void 0 : blockchainProviders['eth'];
    return useMemo(() => ({
        resolvedAddress,
        chainProvider,
        state: state || initialState,
        error: errors[errors.length - 1],
        errors,
    }), [resolvedAddress, chainProvider, state, errors]);
}
// NOTE: resolveAuthorAddress tests are skipped, if changes are made they must be tested manually
export const resolveAuthorAddress = (authorAddress, blockchainProviders, cache) => __awaiter(void 0, void 0, void 0, function* () {
    var _e, _f;
    let resolvedAuthorAddress;
    if (authorAddress.endsWith('.eth')) {
        const resolve = cache ? resolveEnsTxtRecord : resolveEnsTxtRecordNoCache;
        resolvedAuthorAddress = yield resolve(authorAddress, 'plebbit-author-address', 'eth', (_e = blockchainProviders === null || blockchainProviders === void 0 ? void 0 : blockchainProviders['eth']) === null || _e === void 0 ? void 0 : _e.url, (_f = blockchainProviders === null || blockchainProviders === void 0 ? void 0 : blockchainProviders['eth']) === null || _f === void 0 ? void 0 : _f.chainId);
    }
    else {
        throw Error(`resolveAuthorAddress invalid authorAddress '${authorAddress}'`);
    }
    return resolvedAuthorAddress;
});
