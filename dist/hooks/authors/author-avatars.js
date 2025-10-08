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
import { useAccount } from '../accounts';
import Logger from '@plebbit/plebbit-logger';
const log = Logger('plebbit-react-hooks:authors:hooks');
import assert from 'assert';
import { ethers } from 'ethers';
import { getNftMetadataUrl, getNftImageUrl, getNftOwner } from '../../lib/chain';
import createStore from 'zustand';
const noMediaIpfsGatewayUrl = 'http://no-media-ipfs-gateway-url';
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
    const ipfsGatewayUrl = (account === null || account === void 0 ? void 0 : account.mediaIpfsGatewayUrl) || noMediaIpfsGatewayUrl;
    const chainProviders = (_a = account === null || account === void 0 ? void 0 : account.plebbitOptions) === null || _a === void 0 ? void 0 : _a.chainProviders;
    const [nftMetadataUrl, setNftMetadataUrl] = useState();
    const [error, setError] = useState();
    const getNftMetadataUrlArgs = [
        nft === null || nft === void 0 ? void 0 : nft.address,
        nft === null || nft === void 0 ? void 0 : nft.id,
        nft === null || nft === void 0 ? void 0 : nft.chainTicker,
        (_c = (_b = chainProviders === null || chainProviders === void 0 ? void 0 : chainProviders[nft === null || nft === void 0 ? void 0 : nft.chainTicker]) === null || _b === void 0 ? void 0 : _b.urls) === null || _c === void 0 ? void 0 : _c[0],
        (_d = chainProviders === null || chainProviders === void 0 ? void 0 : chainProviders[nft === null || nft === void 0 ? void 0 : nft.chainTicker]) === null || _d === void 0 ? void 0 : _d.chainId,
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
                log.error('useNftMetadataUrl getNftMetadataUrl error', { nft, ipfsGatewayUrl, chainProviders, error });
            }
        }))();
    }, getNftMetadataUrlArgs);
    // log('useNftMetadataUrl', {nft, ipfsGatewayUrl, nftMetadataUrl, chainProviders})
    return { metadataUrl: nftMetadataUrl, error };
}
/**
 * @param nftMetadataUrl - The NFT URL to resolve the image URL of.
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
// NOTE: useNftImageUrl tests are skipped, if changes are made they must be tested manually
export function useNftImageUrl(nftMetadataUrl, accountName) {
    assert(!nftMetadataUrl || typeof nftMetadataUrl === 'string', `useNftImageUrl invalid argument nftMetadataUrl '${nftMetadataUrl}' not a string`);
    const account = useAccount({ accountName });
    // possible to use account.plebbit instead of account.plebbitOptions
    const ipfsGatewayUrl = (account === null || account === void 0 ? void 0 : account.mediaIpfsGatewayUrl) || noMediaIpfsGatewayUrl;
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
    const chainProviders = (_a = account === null || account === void 0 ? void 0 : account.plebbitOptions) === null || _a === void 0 ? void 0 : _a.chainProviders;
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
                const res = yield verifyAuthorAvatarSignature(author.avatar, author.address, chainProviders);
                setVerified(res);
            }
            catch (error) {
                setError(error);
                log.error('useVerifiedAuthorAvatarSignature verifyAuthorAvatarSignature error', { author, chainProviders, error });
            }
        }))();
    }, [author === null || author === void 0 ? void 0 : author.avatar, author === null || author === void 0 ? void 0 : author.address, chainProviders]);
    // don't verify nft signature when using mock content during development
    if (process.env.REACT_APP_PLEBBIT_REACT_HOOKS_MOCK_CONTENT) {
        return { verified: true, error: undefined };
    }
    // log('useVerifiedAuthorAvatarSignature', {author, verified, chainProviders})
    return { verified, error };
}
const defaultWhitelistedTokenAddresses = [
    // xpleb nfts
    '0x890a2e81836e0e76e0f49995e6b51ca6ce6f39ed',
    // plebsquat
    '0x52e6cd20f5fca56da5a0e489574c92af118b8188',
];
const useAuthorAvatarsWhitelistedTokenAddressesStore = createStore((setState, getState) => ({
    authorAvatarsWhitelistedTokenAddresses: {},
    setAuthorAvatarsWhitelistedTokenAddresses: (tokenAddresses) => {
        const authorAvatarsWhitelistedTokenAddresses = {};
        for (const tokenAddress of tokenAddresses) {
            authorAvatarsWhitelistedTokenAddresses[tokenAddress] = true;
            // make sure lower case version exists
            authorAvatarsWhitelistedTokenAddresses[tokenAddress.toLowerCase()] = true;
        }
        setState({ authorAvatarsWhitelistedTokenAddresses });
    },
}));
export const setAuthorAvatarsWhitelistedTokenAddresses = useAuthorAvatarsWhitelistedTokenAddressesStore.getState().setAuthorAvatarsWhitelistedTokenAddresses;
setAuthorAvatarsWhitelistedTokenAddresses(defaultWhitelistedTokenAddresses); // init default
export function useAuthorAvatarIsWhitelisted(nft) {
    // TODO: make a list that a dao can vote it, get the list from plebbit.getDefaults()
    // TODO: make subplebbit owners able to whitelist their own nfts in their subplebbits
    // TODO: make each user able to whitelist/blacklist any nft they want for their own client
    // TODO: make hook to list which default nfts are whitelisted to display to the user
    var _a;
    const authorAvatarsWhitelistedTokenAddresses = useAuthorAvatarsWhitelistedTokenAddressesStore((state) => state.authorAvatarsWhitelistedTokenAddresses);
    const isWhitelisted = (nft === null || nft === void 0 ? void 0 : nft.address) && Boolean(authorAvatarsWhitelistedTokenAddresses[(_a = nft === null || nft === void 0 ? void 0 : nft.address) === null || _a === void 0 ? void 0 : _a.toLowerCase()]);
    return isWhitelisted;
}
export const getNftMessageToSign = (authorAddress, timestamp, tokenAddress, tokenId) => {
    // use plain JSON so the user can read what he's signing
    // property names must always be in this order for signature to match so don't use JSON.stringify
    return `{"domainSeparator":"plebbit-author-avatar","authorAddress":"${authorAddress}","timestamp":${timestamp},"tokenAddress":"${tokenAddress}","tokenId":"${tokenId}"}`;
};
// NOTE: verifyAuthorAvatarSignature tests are skipped, if changes are made they must be tested manually
export const verifyAuthorAvatarSignature = (nft, authorAddress, chainProviders) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    assert(nft && typeof nft === 'object', `verifyAuthorAvatarSignature invalid nft argument '${nft}'`);
    assert(nft === null || nft === void 0 ? void 0 : nft.address, `verifyAuthorAvatarSignature invalid nft.address '${nft === null || nft === void 0 ? void 0 : nft.address}'`);
    assert((nft === null || nft === void 0 ? void 0 : nft.id) && typeof (nft === null || nft === void 0 ? void 0 : nft.id) === 'string', `verifyAuthorAvatarSignature invalid nft.tokenAddress '${nft === null || nft === void 0 ? void 0 : nft.id}' not a string`);
    assert(typeof (nft === null || nft === void 0 ? void 0 : nft.timestamp) === 'number', `verifyAuthorAvatarSignature invalid nft.timestamp '${nft === null || nft === void 0 ? void 0 : nft.timestamp}' not a number`);
    assert(nft === null || nft === void 0 ? void 0 : nft.signature, `verifyAuthorAvatarSignature invalid nft.signature '${nft === null || nft === void 0 ? void 0 : nft.signature}'`);
    assert((_a = nft === null || nft === void 0 ? void 0 : nft.signature) === null || _a === void 0 ? void 0 : _a.signature, `verifyAuthorAvatarSignature invalid nft.signature.signature '${(_b = nft === null || nft === void 0 ? void 0 : nft.signature) === null || _b === void 0 ? void 0 : _b.signature}'`);
    assert(authorAddress, `verifyAuthorAvatarSignature invalid authorAddress '${authorAddress}'`);
    // get the owner of the nft at nft.id
    const currentNftOwnerAddress = yield getNftOwner(nft === null || nft === void 0 ? void 0 : nft.address, nft === null || nft === void 0 ? void 0 : nft.id, nft === null || nft === void 0 ? void 0 : nft.chainTicker, (_d = (_c = chainProviders === null || chainProviders === void 0 ? void 0 : chainProviders[nft === null || nft === void 0 ? void 0 : nft.chainTicker]) === null || _c === void 0 ? void 0 : _c.urls) === null || _d === void 0 ? void 0 : _d[0], (_e = chainProviders === null || chainProviders === void 0 ? void 0 : chainProviders[nft === null || nft === void 0 ? void 0 : nft.chainTicker]) === null || _e === void 0 ? void 0 : _e.chainId);
    const messageThatShouldBeSigned = getNftMessageToSign(authorAddress, nft.timestamp, nft.address, nft.id);
    const signatureAddress = ethers.utils.verifyMessage(messageThatShouldBeSigned, nft.signature.signature);
    let verified = true;
    if (currentNftOwnerAddress !== signatureAddress) {
        verified = false;
    }
    return verified;
});
