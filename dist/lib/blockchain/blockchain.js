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
// NOTE: getNftImageUrl tests are skipped, if changes are made they must be tested manually
const nftImageUrlPendingPromises = {};
const nftImageUrlCache = {};
export const getNftImageUrl = (nft, ipfsGatewayUrl, blockchainProviders) => __awaiter(void 0, void 0, void 0, function* () {
    assert(blockchainProviders && typeof blockchainProviders === 'object', `invalid blockchainProviders '${blockchainProviders}'`);
    assert(ipfsGatewayUrl && typeof ipfsGatewayUrl === 'string', `invalid ipfsGatewayUrl '${ipfsGatewayUrl}'`);
    // cache the result
    const cacheKey = JSON.stringify({ nft, ipfsGatewayUrl, blockchainProviders });
    if (nftImageUrlCache[cacheKey]) {
        return nftImageUrlCache[cacheKey];
    }
    // will throw if no matching provider
    const blockchainProvider = getBlockchainProvider(nft.chainTicker, blockchainProviders);
    // don't request the same url twice if fetching is pending
    if (nftImageUrlPendingPromises[cacheKey]) {
        return nftImageUrlPendingPromises[cacheKey];
    }
    let resolve;
    let getNftImageUrlPromise = new Promise((_resolve) => {
        resolve = _resolve;
    });
    nftImageUrlPendingPromises[cacheKey] = getNftImageUrlPromise;
    const nftContract = new ethers.Contract(nft.address, nftAbi, blockchainProvider);
    let nftUrl = yield nftContract.tokenURI(nft.id);
    // if the ipfs nft is json, get the image url using the ipfs gateway in account settings
    if (nftUrl.startsWith('ipfs://')) {
        nftUrl = `${ipfsGatewayUrl}/${nftUrl.replace('://', '/')}`;
    }
    // if the ipfs file is json, it probably has an 'image' property
    try {
        const json = yield fetch(nftUrl).then((resp) => resp.json());
        nftUrl = json.image;
        // if the image property is an ipfs url, get the image url using the ipfs gateway in account settings
        if (nftUrl.startsWith('ipfs://')) {
            nftUrl = `${ipfsGatewayUrl}/${nftUrl.replace('://', '/')}`;
        }
    }
    catch (e) { }
    nftImageUrlCache[cacheKey] = nftUrl;
    // @ts-ignore
    resolve(nftUrl);
    return nftUrl;
});
export const resolveEnsTxtRecord = (ensName, txtRecordName, blockchainProviders) => __awaiter(void 0, void 0, void 0, function* () {
    const blockchainProvider = getBlockchainProvider('eth', blockchainProviders);
    const resolver = yield blockchainProvider.getResolver(ensName);
    const txtRecordResult = yield resolver.getText(txtRecordName);
    return txtRecordResult;
});
// cache the blockchain providers because only 1 should be running at the same time
const cachedBlockchainProviders = {};
export const getBlockchainProvider = (chainTicker, blockchainProviders) => {
    var _a, _b;
    assert(chainTicker && typeof chainTicker === 'string', `invalid chainTicker '${chainTicker}'`);
    assert(blockchainProviders && typeof blockchainProviders === 'object', `invalid blockchainProviders '${blockchainProviders}'`);
    if (cachedBlockchainProviders[chainTicker]) {
        return cachedBlockchainProviders[chainTicker];
    }
    if (chainTicker === 'eth') {
        // if using eth, use ethers' default provider unless another provider is specified
        if (!blockchainProviders['eth'] || ((_b = (_a = blockchainProviders['eth']) === null || _a === void 0 ? void 0 : _a.url) === null || _b === void 0 ? void 0 : _b.match(/DefaultProvider/i))) {
            cachedBlockchainProviders['eth'] = ethers.getDefaultProvider();
            return cachedBlockchainProviders['eth'];
        }
    }
    if (blockchainProviders[chainTicker]) {
        // @ts-ignore
        cachedBlockchainProviders[chainTicker] = new ethers.providers.JsonRpcProvider({ url: blockchainProviders[chainTicker].url }, blockchainProviders[chainTicker].chainId);
        return cachedBlockchainProviders[chainTicker];
    }
    throw Error(`no blockchain provider options set for chain ticker '${chainTicker}'`);
};
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
export default {
    getNftImageUrl,
    resolveEnsTxtRecord,
    getBlockchainProvider,
};
