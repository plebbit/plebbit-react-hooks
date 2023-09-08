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
import PeerId from 'peer-id';
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string';
// @ts-ignore
import { Ed25519PublicKey } from 'libp2p-crypto/src/keys/ed25519-class';
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
    return useMemo(() => accountId + '-' + authorAddress + '-' + filterName + '-', [accountId, authorAddress, filter]);
};
const getPeerIdFromPublicKey = (publicKeyBase64) => __awaiter(void 0, void 0, void 0, function* () {
    const publicKeyBuffer = uint8ArrayFromString(publicKeyBase64, 'base64');
    // the PeerId public key is not a raw public key, it adds a suffix
    const ed25519PublicKeyInstance = new Ed25519PublicKey(publicKeyBuffer);
    const peerId = yield PeerId.createFromPubKey(new Uint8Array(ed25519PublicKeyInstance.bytes)); // add new Uint8Array or bugs out in jsdom
    return peerId;
});
const getPlebbitAddressFromPublicKey = (publicKeyBase64) => __awaiter(void 0, void 0, void 0, function* () {
    const peerId = yield getPeerIdFromPublicKey(publicKeyBase64);
    return peerId.toB58String().trim();
});
export const usePlebbitAddress = (publicKeyBase64) => {
    const [plebbitAddress, setPlebbitAddress] = useState();
    useEffect(() => {
        if (typeof publicKeyBase64 !== 'string') {
            return;
        }
        getPlebbitAddressFromPublicKey(publicKeyBase64)
            .then((plebbitAddress) => setPlebbitAddress(plebbitAddress))
            .catch(() => { });
    }, [publicKeyBase64]);
    return plebbitAddress;
};
