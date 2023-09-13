import { useMemo } from 'react';
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string';
import { toString as uint8ArrayToString } from 'uint8arrays/to-string';
import { create as createMultihash } from 'multiformats/hashes/digest';
// filters are functions so they can't be stringified
const filterNumbers = new WeakMap();
let filterCount = 0;
const getFilterName = (filter) => {
    let filterNumber = filterNumbers.get(filter);
    if (!filterNumber) {
        filterCount++;
        filterNumbers.set(filter, filterCount);
        filterNumber = filterCount;
    }
    return `filter${filterNumber}`;
};
export const useAuthorCommentsName = (accountId, authorAddress, filter) => {
    const filterName = filter ? getFilterName(filter) : undefined;
    return useMemo(() => accountId + '-' + authorAddress + '-' + filterName, [accountId, authorAddress, filterName]);
};
const protobufPublicKeyPrefix = new Uint8Array([8, 1, 18, 32]);
const multihashIdentityCode = 0;
const getPlebbitAddressFromPublicKey = (publicKeyBase64) => {
    const publicKeyBuffer = uint8ArrayFromString(publicKeyBase64, 'base64');
    const publicKeyBufferWithPrefix = new Uint8Array(protobufPublicKeyPrefix.length + publicKeyBuffer.length);
    publicKeyBufferWithPrefix.set(protobufPublicKeyPrefix, 0);
    publicKeyBufferWithPrefix.set(publicKeyBuffer, protobufPublicKeyPrefix.length);
    const multihash = createMultihash(multihashIdentityCode, publicKeyBufferWithPrefix).bytes;
    return uint8ArrayToString(multihash, 'base58btc');
};
export const usePlebbitAddress = (publicKeyBase64) => {
    return useMemo(() => getPlebbitAddressFromPublicKey(publicKeyBase64), [publicKeyBase64]);
};
