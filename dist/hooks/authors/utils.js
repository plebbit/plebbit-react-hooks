import { useMemo } from 'react';
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string';
import { toString as uint8ArrayToString } from 'uint8arrays/to-string';
import { create as createMultihash } from 'multiformats/hashes/digest';
export const useAuthorCommentsName = (accountId, authorAddress, filter) => {
    return useMemo(() => accountId + '-' + authorAddress + '-' + (filter === null || filter === void 0 ? void 0 : filter.key), [accountId, authorAddress, filter === null || filter === void 0 ? void 0 : filter.key]);
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
    return useMemo(() => (publicKeyBase64 ? getPlebbitAddressFromPublicKey(publicKeyBase64) : undefined), [publicKeyBase64]);
};
