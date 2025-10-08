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
import { ethers } from 'ethers';
import utils from '../utils';
import { verifyMessage } from 'viem';
// NOTE: getNftImageUrl tests are skipped, if changes are made they must be tested manually
const getNftImageUrlNoCache = (nftMetadataUrl, ipfsGatewayUrl) => __awaiter(void 0, void 0, void 0, function* () {
    assert(nftMetadataUrl && typeof nftMetadataUrl === 'string', `getNftImageUrl invalid nftMetadataUrl '${nftMetadataUrl}'`);
    assert(ipfsGatewayUrl && typeof ipfsGatewayUrl === 'string', `getNftImageUrl invalid ipfsGatewayUrl '${ipfsGatewayUrl}'`);
    let nftImageUrl;
    // if the ipfs file is json, it probably has an 'image' property
    const text = yield fetch(nftMetadataUrl).then((resp) => resp.text());
    try {
        nftImageUrl = JSON.parse(text).image;
    }
    catch (e) {
        // dont throw the json parse error, instead throw the http response
        throw Error(text);
    }
    // if the image property is an ipfs url, get the image url using the ipfs gateway in account settings
    if (nftImageUrl.startsWith('ipfs://')) {
        nftImageUrl = `${ipfsGatewayUrl}/${nftImageUrl.replace('://', '/')}`;
    }
    return nftImageUrl;
});
export const getNftImageUrl = utils.memo(getNftImageUrlNoCache, { maxSize: 5000 });
// NOTE: getNftMetadataUrl tests are skipped, if changes are made they must be tested manually
// don't use objects in arguments for faster caching
const getNftMetadataUrlNoCache = (nftAddress, nftId, chainTicker, chainProviderUrl, chainId, ipfsGatewayUrl) => __awaiter(void 0, void 0, void 0, function* () {
    assert(nftAddress && typeof nftAddress === 'string', `getNftMetadataUrl invalid nftAddress '${nftAddress}'`);
    assert(nftId && typeof nftId === 'string', `getNftMetadataUrl invalid nftId '${nftId}'`);
    assert(chainTicker && typeof chainTicker === 'string', `getNftMetadataUrl invalid chainTicker '${chainTicker}'`);
    assert(chainProviderUrl && typeof chainProviderUrl === 'string', `getNftMetadataUrl invalid chainProviderUrl '${chainProviderUrl}'`);
    assert(typeof chainId === 'number', `getNftMetadataUrl invalid chainId '${chainId}' not a number`);
    assert(ipfsGatewayUrl && typeof ipfsGatewayUrl === 'string', `getNftMetadataUrl invalid ipfsGatewayUrl '${ipfsGatewayUrl}'`);
    const chainProvider = getChainProvider(chainTicker, chainProviderUrl, chainId);
    const nftContract = new ethers.Contract(nftAddress, nftAbi, chainProvider);
    let nftMetadataUrl = yield nftContract.tokenURI(nftId);
    // if the image property is an ipfs url, get the image url using the ipfs gateway in account settings
    if (nftMetadataUrl.startsWith('ipfs://')) {
        nftMetadataUrl = `${ipfsGatewayUrl}/${nftMetadataUrl.replace('://', '/')}`;
    }
    return nftMetadataUrl;
});
export const getNftMetadataUrl = utils.memo(getNftMetadataUrlNoCache, { maxSize: 5000 });
// don't use objects in arguments for faster caching
export const getNftOwnerNoCache = (nftAddress, nftId, chainTicker, chainProviderUrl, chainId) => __awaiter(void 0, void 0, void 0, function* () {
    assert(nftAddress && typeof nftAddress === 'string', `getNftOwner invalid nftAddress '${nftAddress}'`);
    assert(nftId && typeof nftId === 'string', `getNftOwner invalid nftId '${nftId}'`);
    assert(chainTicker && typeof chainTicker === 'string', `getNftOwner invalid chainTicker '${chainTicker}'`);
    assert(chainProviderUrl && typeof chainProviderUrl === 'string', `getNftOwner invalid chainProviderUrl '${chainProviderUrl}'`);
    assert(typeof chainId === 'number', `getNftOwner invalid chainId '${chainId}' not a number`);
    const chainProvider = getChainProvider(chainTicker, chainProviderUrl, chainId);
    const nftContract = new ethers.Contract(nftAddress, nftAbi, chainProvider);
    const currentNftOwnerAddress = yield nftContract.ownerOf(nftId);
    return currentNftOwnerAddress;
});
export const getNftOwner = utils.memo(getNftOwnerNoCache, { maxSize: 5000, maxAge: 1000 * 60 * 60 * 24 });
export const resolveEnsTxtRecordNoCache = (ensName, txtRecordName, chainTicker, chainProviderUrl, chainId) => __awaiter(void 0, void 0, void 0, function* () {
    const chainProvider = getChainProvider(chainTicker, chainProviderUrl, chainId);
    const resolver = yield chainProvider.getResolver(ensName);
    if (!resolver) {
        throw Error(`name not registered or network error`);
    }
    const txtRecordResult = yield resolver.getText(txtRecordName);
    return txtRecordResult;
});
export const resolveEnsTxtRecord = utils.memo(resolveEnsTxtRecordNoCache, { maxSize: 10000, maxAge: 1000 * 60 * 60 * 24 });
// cache the chain providers because only 1 should be running at the same time
const getChainProviderNoCache = (chainTicker, chainProviderUrl, chainId) => {
    if (chainTicker === 'eth') {
        // if using eth, use ethers' default provider unless another provider is specified
        if (!chainProviderUrl || chainProviderUrl === 'ethers.js') {
            return ethers.getDefaultProvider();
        }
    }
    if (!chainProviderUrl) {
        throw Error(`getChainProvider invalid chainProviderUrl '${chainProviderUrl}'`);
    }
    if (!chainId && chainId !== 0) {
        throw Error(`getChainProvider invalid chainId '${chainId}'`);
    }
    return new ethers.providers.JsonRpcProvider({ url: chainProviderUrl }, chainId);
};
const getChainProvider = utils.memoSync(getChainProviderNoCache, { maxSize: 1000 });
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
export const getWalletMessageToSign = (authorAddress, timestamp) => {
    // use plain JSON so the user can read what he's signing
    // property names must always be in this order for signature to match so don't use JSON.stringify
    return `{"domainSeparator":"plebbit-author-wallet","authorAddress":"${authorAddress}","timestamp":${timestamp}}`;
};
export const getEthWalletFromPlebbitPrivateKey = (privateKeyBase64, authorAddress) => __awaiter(void 0, void 0, void 0, function* () {
    // ignore private key used in plebbit-js signer mock so tests run faster, also make sure nobody uses it
    if (privateKeyBase64 === 'private key') {
        return;
    }
    const privateKeyBytes = Uint8Array.from(atob(privateKeyBase64), (c) => c.charCodeAt(0));
    if (privateKeyBytes.length !== 32) {
        throw Error('failed getting eth address from private key not 32 bytes');
    }
    const publicKeyHex = ethers.utils.computePublicKey(privateKeyBytes, false);
    const privateKeyHex = ethers.utils.hexlify(privateKeyBytes);
    const ethAddress = ethers.utils.computeAddress(publicKeyHex);
    // generate signature
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = yield new ethers.Wallet(privateKeyHex).signMessage(getWalletMessageToSign(authorAddress, timestamp));
    return { address: ethAddress, timestamp, signature: { signature, type: 'eip191' } };
});
export const getEthPrivateKeyFromPlebbitPrivateKey = (privateKeyBase64, authorAddress) => __awaiter(void 0, void 0, void 0, function* () {
    // ignore private key used in plebbit-js signer mock so tests run faster, also make sure nobody uses it
    if (privateKeyBase64 === 'private key') {
        return;
    }
    const privateKeyBytes = Uint8Array.from(atob(privateKeyBase64), (c) => c.charCodeAt(0));
    if (privateKeyBytes.length !== 32) {
        throw Error('failed getting eth address from private key not 32 bytes');
    }
    const privateKeyHex = ethers.utils.hexlify(privateKeyBytes);
    return privateKeyHex;
});
import { getPublicKey as ed25519GetPublicKey, sign as ed25519Sign, verify as ed25519Verify } from '@noble/ed25519';
import { toString as uint8ArrayToString, fromString as uint8ArrayFromString } from 'uint8arrays';
export const getSolWalletFromPlebbitPrivateKey = (privateKeyBase64, authorAddress) => __awaiter(void 0, void 0, void 0, function* () {
    // ignore private key used in plebbit-js signer mock so tests run faster, also make sure nobody uses it
    if (privateKeyBase64 === 'private key') {
        return;
    }
    const privateKeyBytes = Uint8Array.from(atob(privateKeyBase64), (c) => c.charCodeAt(0));
    if (privateKeyBytes.length !== 32) {
        throw Error('failed getting sol address from private key not 32 bytes');
    }
    const publicKeyBytes = yield ed25519GetPublicKey(privateKeyBytes);
    const solAddress = uint8ArrayToString(publicKeyBytes, 'base58btc');
    // generate signature (https://solscan.io/verifiedsignatures)
    const timestamp = Math.floor(Date.now() / 1000);
    const messageBytes = uint8ArrayFromString(getWalletMessageToSign(authorAddress, timestamp), 'utf8');
    const signatureBytes = yield ed25519Sign(messageBytes, privateKeyBytes);
    const signatureBase58 = uint8ArrayToString(signatureBytes, 'base58btc');
    return {
        address: solAddress,
        timestamp,
        signature: {
            signature: signatureBase58,
            // solana has no signature standard so just call it 'sol' for now
            // can't use just 'ed25519' because we use it for plebbit signature with base64
            type: 'sol',
        },
    };
});
export const getSolPrivateKeyFromPlebbitPrivateKey = (privateKeyBase64, authorAddress) => __awaiter(void 0, void 0, void 0, function* () {
    // ignore private key used in plebbit-js signer mock so tests run faster, also make sure nobody uses it
    if (privateKeyBase64 === 'private key') {
        return;
    }
    const privateKeyBytes = Uint8Array.from(atob(privateKeyBase64), (c) => c.charCodeAt(0));
    if (privateKeyBytes.length !== 32) {
        throw Error('failed getting sol address from private key not 32 bytes');
    }
    const publicKeyBytes = yield ed25519GetPublicKey(privateKeyBytes);
    const bytes = new Uint8Array(64);
    bytes.set(privateKeyBytes, 0);
    bytes.set(publicKeyBytes, 32);
    const privateKeyBase58 = uint8ArrayToString(bytes, 'base58btc');
    return privateKeyBase58;
});
export const validateEthWallet = (wallet, authorAddress) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    assert(wallet && typeof wallet === 'object', `validateEthWallet invalid wallet argument '${wallet}'`);
    assert(wallet === null || wallet === void 0 ? void 0 : wallet.address, `validateEthWallet invalid wallet.address '${wallet === null || wallet === void 0 ? void 0 : wallet.address}'`);
    assert(typeof (wallet === null || wallet === void 0 ? void 0 : wallet.timestamp) === 'number', `validateEthWallet invalid wallet.timestamp '${wallet === null || wallet === void 0 ? void 0 : wallet.timestamp}' not a number`);
    assert(wallet === null || wallet === void 0 ? void 0 : wallet.signature, `validateEthWallet invalid wallet.signature '${wallet === null || wallet === void 0 ? void 0 : wallet.signature}'`);
    assert((_a = wallet === null || wallet === void 0 ? void 0 : wallet.signature) === null || _a === void 0 ? void 0 : _a.signature, `validateEthWallet invalid wallet.signature.signature '${(_b = wallet === null || wallet === void 0 ? void 0 : wallet.signature) === null || _b === void 0 ? void 0 : _b.signature}'`);
    assert(wallet.signature.type === 'eip191', `validateEthWallet invalid wallet.signature.type '${(_c = wallet === null || wallet === void 0 ? void 0 : wallet.signature) === null || _c === void 0 ? void 0 : _c.type}'`);
    assert(authorAddress && typeof authorAddress === 'string', `validateEthWallet invalid authorAddress '${authorAddress}'`);
    assert((wallet === null || wallet === void 0 ? void 0 : wallet.timestamp) <= Date.now() / 1000, `validateEthWallet invalid wallet.timestamp '${wallet === null || wallet === void 0 ? void 0 : wallet.timestamp}' greater than current Date.now() / 1000`);
    const signatureAddress = ethers.utils.verifyMessage(getWalletMessageToSign(authorAddress, wallet.timestamp), wallet.signature.signature);
    if (wallet.address.toLowerCase() !== signatureAddress.toLowerCase()) {
        throw Error('wallet address does not equal signature address');
    }
});
export const validateEthWalletViem = (wallet, authorAddress) => __awaiter(void 0, void 0, void 0, function* () {
    var _d, _e, _f;
    // sanity checks
    assert(wallet && typeof wallet === 'object', `validateEthWallet invalid wallet argument '${wallet}'`);
    assert(wallet === null || wallet === void 0 ? void 0 : wallet.address, `validateEthWallet invalid wallet.address '${wallet === null || wallet === void 0 ? void 0 : wallet.address}'`);
    assert(typeof (wallet === null || wallet === void 0 ? void 0 : wallet.timestamp) === 'number', `validateEthWallet invalid wallet.timestamp '${wallet === null || wallet === void 0 ? void 0 : wallet.timestamp}' not a number`);
    assert(wallet === null || wallet === void 0 ? void 0 : wallet.signature, `validateEthWallet invalid wallet.signature '${wallet === null || wallet === void 0 ? void 0 : wallet.signature}'`);
    assert((_d = wallet === null || wallet === void 0 ? void 0 : wallet.signature) === null || _d === void 0 ? void 0 : _d.signature, `validateEthWallet invalid wallet.signature.signature '${(_e = wallet === null || wallet === void 0 ? void 0 : wallet.signature) === null || _e === void 0 ? void 0 : _e.signature}'`);
    assert(wallet.signature.type === 'eip191', `validateEthWallet invalid wallet.signature.type '${(_f = wallet === null || wallet === void 0 ? void 0 : wallet.signature) === null || _f === void 0 ? void 0 : _f.type}'`);
    assert(authorAddress && typeof authorAddress === 'string', `validateEthWallet invalid authorAddress '${authorAddress}'`);
    assert((wallet === null || wallet === void 0 ? void 0 : wallet.timestamp) <= Date.now() / 1000, `validateEthWallet invalid wallet.timestamp '${wallet === null || wallet === void 0 ? void 0 : wallet.timestamp}' greater than current Date.now() / 1000`);
    const valid = yield verifyMessage({
        address: wallet.address,
        message: getWalletMessageToSign(authorAddress, wallet.timestamp),
        signature: wallet.signature.signature,
    });
    if (!valid) {
        throw Error('wallet address does not equal signature address');
    }
});
export const validateSolWallet = (wallet, authorAddress) => __awaiter(void 0, void 0, void 0, function* () {
    var _g, _h;
    assert(wallet && typeof wallet === 'object', `validateSolWallet invalid wallet argument '${wallet}'`);
    assert(wallet === null || wallet === void 0 ? void 0 : wallet.address, `validateSolWallet invalid wallet.address '${wallet === null || wallet === void 0 ? void 0 : wallet.address}'`);
    assert(typeof (wallet === null || wallet === void 0 ? void 0 : wallet.timestamp) === 'number', `validateSolWallet invalid wallet.timestamp '${wallet === null || wallet === void 0 ? void 0 : wallet.timestamp}' not a number`);
    assert(wallet === null || wallet === void 0 ? void 0 : wallet.signature, `validateSolWallet invalid wallet.signature '${wallet === null || wallet === void 0 ? void 0 : wallet.signature}'`);
    assert((_g = wallet === null || wallet === void 0 ? void 0 : wallet.signature) === null || _g === void 0 ? void 0 : _g.signature, `validateSolWallet invalid wallet.signature.signature '${(_h = wallet === null || wallet === void 0 ? void 0 : wallet.signature) === null || _h === void 0 ? void 0 : _h.signature}'`);
    assert(authorAddress && typeof authorAddress === 'string', `validateSolWallet invalid authorAddress '${authorAddress}'`);
    assert((wallet === null || wallet === void 0 ? void 0 : wallet.timestamp) <= Date.now() / 1000, `validateSolWallet invalid wallet.timestamp '${wallet === null || wallet === void 0 ? void 0 : wallet.timestamp}' greater than current Date.now() / 1000`);
    const signatureBytes = uint8ArrayFromString(wallet.signature.signature, 'base58btc');
    const messageBytes = uint8ArrayFromString(getWalletMessageToSign(authorAddress, wallet.timestamp), 'utf8');
    const publicKeyBytes = uint8ArrayFromString(wallet.address, 'base58btc');
    const verified = yield ed25519Verify(signatureBytes, messageBytes, publicKeyBytes);
    if (!verified) {
        throw Error('signature invalid');
    }
});
export default {
    getNftOwner,
    getNftMetadataUrl,
    getNftImageUrl,
    resolveEnsTxtRecord,
    getEthWalletFromPlebbitPrivateKey,
    getSolWalletFromPlebbitPrivateKey,
    getEthPrivateKeyFromPlebbitPrivateKey,
    getSolPrivateKeyFromPlebbitPrivateKey,
    validateEthWallet,
    validateEthWalletViem,
    validateSolWallet,
};
