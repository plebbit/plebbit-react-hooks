var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useEffect, useState } from 'react';
import { useInterval } from './utils/use-interval';
import { useAccount } from './accounts';
import Debug from 'debug';
const debug = Debug('plebbit-react-hooks:hooks:authors');
import assert from 'assert';
import { ethers } from 'ethers';
import { getNftImageUrl, resolveEnsTxtRecord, getBlockchainProvider } from '../lib/blockchain';
/**
 * @param author - The Author object to resolve the avatar image URL of.
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
// NOTE: useAuthorAvatarImageUrl tests are skipped, if changes are made they must be tested manually
export function useAuthorAvatarImageUrl(author, accountName) {
    const verified = useVerifiedAuthorAvatarSignature(author, accountName);
    const isWhitelisted = useAuthorAvatarIsWhitelisted(author === null || author === void 0 ? void 0 : author.avatar);
    // don't try to get avatar image url at all if signature isn't verified and whitelisted
    const avatar = verified && isWhitelisted ? author === null || author === void 0 ? void 0 : author.avatar : undefined;
    const nftImageUrl = useNftImageUrl(avatar, accountName);
    if (author) {
        debug('useAuthorAvatarImageUrl', { author, verified, isWhitelisted, nftImageUrl });
    }
    return nftImageUrl;
}
/**
 * @param nft - The NFT object to resolve the image URL of.
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
// NOTE: useNftImageUrl tests are skipped, if changes are made they must be tested manually
export function useNftImageUrl(nft, accountName) {
    var _a, _b;
    const account = useAccount(accountName);
    // possible to use account.plebbit instead of account.plebbitOptions
    const ipfsGatewayUrl = (_a = account === null || account === void 0 ? void 0 : account.plebbitOptions) === null || _a === void 0 ? void 0 : _a.ipfsGatewayUrl;
    const blockchainProviders = (_b = account === null || account === void 0 ? void 0 : account.plebbitOptions) === null || _b === void 0 ? void 0 : _b.blockchainProviders;
    const [nftImageUrl, setNftImageUrl] = useState();
    useEffect(() => {
        if (!account || !nft) {
            return;
        }
        ;
        (() => __awaiter(this, void 0, void 0, function* () {
            try {
                const url = yield getNftImageUrl(nft, ipfsGatewayUrl, blockchainProviders);
                setNftImageUrl(url);
            }
            catch (error) {
                debug('useNftImageUrl getNftImageUrl error', { nft, ipfsGatewayUrl, blockchainProviders, error });
            }
        }))();
    }, [nft === null || nft === void 0 ? void 0 : nft.chainTicker, nft === null || nft === void 0 ? void 0 : nft.address, nft === null || nft === void 0 ? void 0 : nft.id, ipfsGatewayUrl, JSON.stringify(blockchainProviders)]);
    // debug('useNftImageUrl', {nft, ipfsGatewayUrl, nftImageUrl, blockchainProviders})
    return nftImageUrl;
}
// NOTE: useVerifiedAuthorAvatarSignature tests are skipped, if changes are made they must be tested manually
export function useVerifiedAuthorAvatarSignature(author, accountName) {
    var _a;
    const account = useAccount(accountName);
    // possible to use account.plebbit instead of account.plebbitOptions
    const blockchainProviders = (_a = account === null || account === void 0 ? void 0 : account.plebbitOptions) === null || _a === void 0 ? void 0 : _a.blockchainProviders;
    const [verified, setVerified] = useState();
    useEffect(() => {
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
                debug('useVerifiedAuthorAvatarSignature verifyAuthorAvatarSignature error', { author, blockchainProviders, error });
            }
        }))();
    }, [author === null || author === void 0 ? void 0 : author.avatar, author === null || author === void 0 ? void 0 : author.address, JSON.stringify(blockchainProviders)]);
    // don't verify nft signature when using mock content during development
    if (process.env.REACT_APP_PLEBBIT_REACT_HOOKS_MOCK_CONTENT) {
        return true;
    }
    // debug('useVerifiedAuthorAvatarSignature', {author, verified, blockchainProviders})
    return verified;
}
function useAuthorAvatarIsWhitelisted(nft) {
    var _a;
    // TODO: make a list that a dao can vote it, get the list from plebbit.getDefaults()
    // TODO: make subplebbit owners able to whitelist their own nfts in their subplebbits
    // TODO: make each user able to whitelist/blacklist any nft they want for their own client
    // TODO: make hook to list which default nfts are whitelisted to display to the user
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
    const isWhitelisted = (nft === null || nft === void 0 ? void 0 : nft.address) && Boolean(whitelistedTokenAddresses[(_a = nft === null || nft === void 0 ? void 0 : nft.address) === null || _a === void 0 ? void 0 : _a.toLowerCase()]);
    return isWhitelisted;
}
// NOTE: verifyAuthorAvatarSignature tests are skipped, if changes are made they must be tested manually
const verifyAuthorAvatarSignaturePendingPromises = {};
const verifyAuthorAvatarSignatureCache = {};
export const verifyAuthorAvatarSignature = (nft, authorAddress, blockchainProviders) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    assert(nft && typeof nft === 'object', `verifyAuthorAvatarSignature invalid nft argument '${nft}'`);
    assert(nft === null || nft === void 0 ? void 0 : nft.address, `verifyAuthorAvatarSignature invalid nft.address '${nft === null || nft === void 0 ? void 0 : nft.address}'`);
    assert(nft === null || nft === void 0 ? void 0 : nft.id, `verifyAuthorAvatarSignature invalid nft.tokenAddress '${nft === null || nft === void 0 ? void 0 : nft.id}'`);
    assert(nft === null || nft === void 0 ? void 0 : nft.signature, `verifyAuthorAvatarSignature invalid nft.signature '${nft === null || nft === void 0 ? void 0 : nft.signature}'`);
    assert((_a = nft === null || nft === void 0 ? void 0 : nft.signature) === null || _a === void 0 ? void 0 : _a.signature, `verifyAuthorAvatarSignature invalid nft.signature.signature '${(_b = nft === null || nft === void 0 ? void 0 : nft.signature) === null || _b === void 0 ? void 0 : _b.signature}'`);
    assert(authorAddress, `verifyAuthorAvatarSignature invalid authorAddress '${authorAddress}'`);
    // cache the result
    const cacheKey = JSON.stringify({ nft, authorAddress, blockchainProviders });
    if (typeof verifyAuthorAvatarSignatureCache[cacheKey] === 'boolean') {
        return verifyAuthorAvatarSignatureCache[cacheKey];
    }
    // will throw if no matching provider
    const blockchainProvider = getBlockchainProvider(nft.chainTicker, blockchainProviders);
    const nftContract = new ethers.Contract(nft.address, nftAbi, blockchainProvider);
    // don't request the same url twice if fetching is pending
    if (verifyAuthorAvatarSignaturePendingPromises[cacheKey]) {
        return verifyAuthorAvatarSignaturePendingPromises[cacheKey];
    }
    let resolve;
    let verifyAuthorAvatarSignaturePromise = new Promise((_resolve) => {
        resolve = _resolve;
    });
    verifyAuthorAvatarSignaturePendingPromises[cacheKey] = verifyAuthorAvatarSignaturePromise;
    // get the owner of the nft at nft.id
    const currentNftOwnerAddress = yield nftContract.ownerOf(nft.id);
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
    verifyAuthorAvatarSignatureCache[cacheKey] = verified;
    // @ts-ignore
    resolve(verified);
    return verified;
});
/**
 * @param authorAddress - The author address to resolve to a public key, e.g. 'john.eth' resolves to 'Qm...'.
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
// NOTE: useResolvedAuthorAddress tests are skipped, if changes are made they must be tested manually
export function useResolvedAuthorAddress(authorAddress, accountName) {
    var _a;
    const account = useAccount(accountName);
    // possible to use account.plebbit instead of account.plebbitOptions
    const blockchainProviders = (_a = account === null || account === void 0 ? void 0 : account.plebbitOptions) === null || _a === void 0 ? void 0 : _a.blockchainProviders;
    const [resolvedAuthorAddress, setResolvedAuthorAddress] = useState();
    useInterval(() => {
        // only support resolving '.eth' for now
        if (!(authorAddress === null || authorAddress === void 0 ? void 0 : authorAddress.endsWith('.eth'))) {
            return;
        }
        if (!account || !authorAddress) {
            return;
        }
        ;
        (() => __awaiter(this, void 0, void 0, function* () {
            try {
                const res = yield resolveAuthorAddress(authorAddress, blockchainProviders);
                if (res !== resolvedAuthorAddress) {
                    setResolvedAuthorAddress(res);
                }
            }
            catch (error) {
                debug('useResolvedAuthorAddress resolveAuthorAddress error', { authorAddress, blockchainProviders, error });
            }
        }))();
    }, 15000, true, [authorAddress, blockchainProviders]);
    // debug('useResolvedAuthorAddress', {authorAddress, resolvedAuthorAddress, blockchainProviders})
    return resolvedAuthorAddress;
}
// NOTE: resolveAuthorAddress tests are skipped, if changes are made they must be tested manually
export const resolveAuthorAddress = (authorAddress, blockchainProviders) => __awaiter(void 0, void 0, void 0, function* () {
    let resolvedAuthorAddress;
    if (authorAddress.endsWith('.eth')) {
        resolvedAuthorAddress = yield resolveEnsTxtRecord(authorAddress, 'plebbit-author-address', blockchainProviders);
    }
    else {
        throw Error(`resolveAuthorAddress invalid authorAddress '${authorAddress}'`);
    }
    return resolvedAuthorAddress;
});
const nftAbi = [
    {
        inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
        name: 'tokenURI',
        outputs: [{ internalType: 'string', name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
        name: 'ownerOf',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
];
