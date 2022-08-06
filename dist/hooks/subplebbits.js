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
import { useAccount } from './accounts';
import validator from '../lib/validator';
import Debug from 'debug';
const debug = Debug('plebbit-react-hooks:hooks:subplebbits');
import useInterval from './utils/use-interval';
import { resolveEnsTxtRecord } from '../lib/blockchain';
import useSubplebbitsStore from '../stores/subplebbits';
import shallow from 'zustand/shallow';
/**
 * @param subplebbitAddress - The address of the subplebbit, e.g. 'memes.eth', 'Qm...', etc
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useSubplebbit(subplebbitAddress, accountName) {
    const account = useAccount(accountName);
    const subplebbit = useSubplebbitsStore((state) => state.subplebbits[subplebbitAddress || '']);
    const addSubplebbitToStore = useSubplebbitsStore((state) => state.addSubplebbitToStore);
    useEffect(() => {
        if (!subplebbitAddress || !account) {
            return;
        }
        validator.validateUseSubplebbitArguments(subplebbitAddress, account);
        if (!subplebbit) {
            // if subplebbit isn't already in store, add it
            addSubplebbitToStore(subplebbitAddress, account).catch((error) => console.error('useSubplebbit addSubplebbitToStore error', { subplebbitAddress, error }));
        }
    }, [subplebbitAddress, account]);
    debug('useSubplebbit', { subplebbitAddress, subplebbit, account });
    return subplebbit;
}
/**
 * @param subplebbitAddresses - The addresses of the subplebbits, e.g. ['memes.eth', 'Qm...']
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useSubplebbits(subplebbitAddresses = [], accountName) {
    const account = useAccount(accountName);
    const subplebbits = useSubplebbitsStore((state) => subplebbitAddresses.map((subplebbitAddress) => state.subplebbits[subplebbitAddress || '']), shallow);
    const addSubplebbitToStore = useSubplebbitsStore((state) => state.addSubplebbitToStore);
    useEffect(() => {
        if (!subplebbitAddresses || !account) {
            return;
        }
        validator.validateUseSubplebbitsArguments(subplebbitAddresses, account);
        const uniqueSubplebbitAddresses = new Set(subplebbitAddresses);
        for (const subplebbitAddress of uniqueSubplebbitAddresses) {
            addSubplebbitToStore(subplebbitAddress, account).catch((error) => console.error('useSubplebbits addSubplebbitToStore error', { subplebbitAddress, error }));
        }
    }, [subplebbitAddresses, account]);
    debug('useSubplebbits', { subplebbitAddresses, subplebbits, account });
    return subplebbits;
}
/**
 * Returns all the owner subplebbits created by plebbit-js by calling plebbit.listSubplebbits()
 */
export function useListSubplebbits() {
    const account = useAccount();
    const [subplebbitAddresses, setSubplebbitAddresses] = useState([]);
    const delay = 1000;
    const immediate = true;
    useInterval(() => {
        if (!(account === null || account === void 0 ? void 0 : account.plebbit)) {
            return;
        }
        account.plebbit.listSubplebbits().then((_subplebbitAddresses) => {
            if (JSON.stringify(_subplebbitAddresses) === JSON.stringify(subplebbitAddresses)) {
                return;
            }
            setSubplebbitAddresses(_subplebbitAddresses);
        });
    }, delay, immediate);
    debug('useListSubplebbits', { subplebbitAddresses });
    return subplebbitAddresses;
}
/**
 * @param subplebbitAddress - The subplebbit address to resolve to a public key, e.g. 'news.eth' resolves to 'Qm...'.
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
// NOTE: useResolvedSubplebbitAddress tests are skipped, if changes are made they must be tested manually
export function useResolvedSubplebbitAddress(subplebbitAddress, accountName) {
    var _a;
    const account = useAccount(accountName);
    // possible to use account.plebbit instead of account.plebbitOptions
    const blockchainProviders = (_a = account === null || account === void 0 ? void 0 : account.plebbitOptions) === null || _a === void 0 ? void 0 : _a.blockchainProviders;
    const [resolvedSubplebbitAddress, setResolvedSubplebbitAddress] = useState();
    useInterval(() => {
        // only support resolving '.eth' for now
        if (!(subplebbitAddress === null || subplebbitAddress === void 0 ? void 0 : subplebbitAddress.endsWith('.eth'))) {
            return;
        }
        if (!account || !subplebbitAddress) {
            return;
        }
        ;
        (() => __awaiter(this, void 0, void 0, function* () {
            try {
                const res = yield resolveSubplebbitAddress(subplebbitAddress, blockchainProviders);
                if (res !== resolvedSubplebbitAddress) {
                    setResolvedSubplebbitAddress(res);
                }
            }
            catch (error) {
                debug('useResolvedSubplebbitAddress resolveSubplebbitAddress error', { subplebbitAddress, blockchainProviders, error });
            }
        }))();
    }, 15000, true, [subplebbitAddress, blockchainProviders]);
    debug('useResolvedSubplebbitAddress', { subplebbitAddress, resolvedSubplebbitAddress, blockchainProviders });
    return resolvedSubplebbitAddress;
}
// NOTE: resolveSubplebbitAddress tests are skipped, if changes are made they must be tested manually
export const resolveSubplebbitAddress = (subplebbitAddress, blockchainProviders) => __awaiter(void 0, void 0, void 0, function* () {
    let resolvedSubplebbitAddress;
    if (subplebbitAddress.endsWith('.eth')) {
        resolvedSubplebbitAddress = yield resolveEnsTxtRecord(subplebbitAddress, 'subplebbit-address', blockchainProviders);
    }
    else {
        throw Error(`resolveSubplebbitAddress invalid subplebbitAddress '${subplebbitAddress}'`);
    }
    return resolvedSubplebbitAddress;
});
