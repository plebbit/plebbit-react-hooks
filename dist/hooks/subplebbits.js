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
import { useAccount } from './accounts';
import validator from '../lib/validator';
import Logger from '@plebbit/plebbit-logger';
const log = Logger('plebbit-react-hooks:subplebbits:hooks');
import assert from 'assert';
import useInterval from './utils/use-interval';
import { resolveEnsTxtRecord } from '../lib/chain';
import useSubplebbitsStore from '../stores/subplebbits';
import shallow from 'zustand/shallow';
/**
 * @param subplebbitAddress - The address of the subplebbit, e.g. 'memes.eth', '12D3KooW...', etc
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useSubplebbit(options) {
    assert(!options || typeof options === 'object', `useSubplebbit options argument '${options}' not an object`);
    const { subplebbitAddress, accountName } = options || {};
    const account = useAccount({ accountName });
    const subplebbit = useSubplebbitsStore((state) => state.subplebbits[subplebbitAddress || '']);
    const addSubplebbitToStore = useSubplebbitsStore((state) => state.addSubplebbitToStore);
    const errors = useSubplebbitsStore((state) => state.errors[subplebbitAddress || '']);
    useEffect(() => {
        if (!subplebbitAddress || !account) {
            return;
        }
        validator.validateUseSubplebbitArguments(subplebbitAddress, account);
        if (!subplebbit) {
            // if subplebbit isn't already in store, add it
            addSubplebbitToStore(subplebbitAddress, account).catch((error) => log.error('useSubplebbit addSubplebbitToStore error', { subplebbitAddress, error }));
        }
    }, [subplebbitAddress, account === null || account === void 0 ? void 0 : account.id]);
    if (account && subplebbitAddress) {
        log('useSubplebbit', { subplebbitAddress, subplebbit, account });
    }
    let state = (subplebbit === null || subplebbit === void 0 ? void 0 : subplebbit.updatingState) || 'initializing';
    if (subplebbit === null || subplebbit === void 0 ? void 0 : subplebbit.updatedAt) {
        state = 'succeeded';
    }
    return useMemo(() => (Object.assign(Object.assign({}, subplebbit), { state, error: errors === null || errors === void 0 ? void 0 : errors[errors.length - 1], errors: errors || [] })), [subplebbit, subplebbitAddress, errors]);
}
/**
 * @param subplebbitAddress - The address of the subplebbit, e.g. 'memes.eth', '12D3KooW...', etc
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useSubplebbitStats(options) {
    assert(!options || typeof options === 'object', `useSubplebbitStats options argument '${options}' not an object`);
    const { subplebbitAddress, accountName } = options || {};
    const account = useAccount({ accountName });
    const subplebbit = useSubplebbit({ subplebbitAddress });
    const subplebbitStatsCid = subplebbit === null || subplebbit === void 0 ? void 0 : subplebbit.statsCid;
    const [subplebbitStats, setSubplebbitStats] = useState();
    useEffect(() => {
        if (!subplebbitStatsCid || !account) {
            return;
        }
        ;
        (() => __awaiter(this, void 0, void 0, function* () {
            let fetchedCid;
            try {
                fetchedCid = yield account.plebbit.fetchCid(subplebbitStatsCid);
                fetchedCid = JSON.parse(fetchedCid);
                setSubplebbitStats(fetchedCid);
            }
            catch (error) {
                log.error('useSubplebbitStats plebbit.fetchCid error', { subplebbitAddress, subplebbitStatsCid, subplebbit, fetchedCid, error });
            }
        }))();
    }, [subplebbitStatsCid, account === null || account === void 0 ? void 0 : account.id]);
    if (account && subplebbitStatsCid) {
        log('useSubplebbitStats', { subplebbitAddress, subplebbitStatsCid, subplebbitStats, subplebbit, account });
    }
    const state = subplebbitStats ? 'succeeded' : 'fetching-ipfs';
    return useMemo(() => (Object.assign(Object.assign({}, subplebbitStats), { state, error: undefined, errors: [] })), [subplebbitStats, subplebbitStatsCid]);
}
/**
 * @param subplebbitAddresses - The addresses of the subplebbits, e.g. ['memes.eth', '12D3KooWA...']
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useSubplebbits(options) {
    assert(!options || typeof options === 'object', `useSubplebbits options argument '${options}' not an object`);
    const { subplebbitAddresses, accountName } = options || {};
    const account = useAccount({ accountName });
    const subplebbits = useSubplebbitsStore((state) => (subplebbitAddresses || []).map((subplebbitAddress) => state.subplebbits[subplebbitAddress || '']), shallow);
    const addSubplebbitToStore = useSubplebbitsStore((state) => state.addSubplebbitToStore);
    useEffect(() => {
        if (!subplebbitAddresses || !account) {
            return;
        }
        validator.validateUseSubplebbitsArguments(subplebbitAddresses, account);
        const uniqueSubplebbitAddresses = new Set(subplebbitAddresses);
        for (const subplebbitAddress of uniqueSubplebbitAddresses) {
            addSubplebbitToStore(subplebbitAddress, account).catch((error) => log.error('useSubplebbits addSubplebbitToStore error', { subplebbitAddress, error }));
        }
    }, [subplebbitAddresses === null || subplebbitAddresses === void 0 ? void 0 : subplebbitAddresses.toString(), account === null || account === void 0 ? void 0 : account.id]);
    if (account && (subplebbitAddresses === null || subplebbitAddresses === void 0 ? void 0 : subplebbitAddresses.length)) {
        log('useSubplebbits', { subplebbitAddresses, subplebbits, account });
    }
    // succeed if no subplebbits are undefined
    const state = subplebbits.indexOf(undefined) === -1 ? 'succeeded' : 'fetching-ipns';
    return useMemo(() => ({
        subplebbits,
        state,
        error: undefined,
        errors: [],
    }), [subplebbits, subplebbitAddresses === null || subplebbitAddresses === void 0 ? void 0 : subplebbitAddresses.toString()]);
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
            if (_subplebbitAddresses.toString() === subplebbitAddresses.toString()) {
                return;
            }
            log('useListSubplebbits', { subplebbitAddresses });
            setSubplebbitAddresses(_subplebbitAddresses);
        });
    }, delay, immediate);
    return subplebbitAddresses;
}
/**
 * @param subplebbitAddress - The subplebbit address to resolve to a public key, e.g. 'news.eth' resolves to '12D3KooW...'.
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
// NOTE: useResolvedSubplebbitAddress tests are skipped, if changes are made they must be tested manually
export function useResolvedSubplebbitAddress(options) {
    var _a;
    assert(!options || typeof options === 'object', `useResolvedSubplebbitAddress options argument '${options}' not an object`);
    let { subplebbitAddress, accountName, cache } = options || {};
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
    if (options && account && subplebbitAddress) {
        initialState = 'ready';
    }
    useInterval(() => {
        // no options, do nothing or reset
        if (!account || !subplebbitAddress) {
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
        if (!(subplebbitAddress === null || subplebbitAddress === void 0 ? void 0 : subplebbitAddress.includes('.'))) {
            if (state !== 'failed') {
                setErrors([Error('not a crypto domain')]);
                setState('failed');
                setResolvedAddress(undefined);
            }
            return;
        }
        // only support resolving '.eth' for now
        if (!(subplebbitAddress === null || subplebbitAddress === void 0 ? void 0 : subplebbitAddress.endsWith('.eth'))) {
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
                const res = yield resolveSubplebbitAddress(subplebbitAddress, chainProviders);
                setState('succeeded');
                if (res !== resolvedAddress) {
                    setResolvedAddress(res);
                }
            }
            catch (error) {
                setErrors([...errors, error]);
                setState('failed');
                setResolvedAddress(undefined);
                log.error('useResolvedSubplebbitAddress resolveSubplebbitAddress error', { subplebbitAddress, chainProviders, error });
            }
        }))();
    }, interval, true, [subplebbitAddress, chainProviders]);
    // only support ENS at the moment
    const chainProvider = chainProviders === null || chainProviders === void 0 ? void 0 : chainProviders['eth'];
    // log('useResolvedSubplebbitAddress', {subplebbitAddress, state, errors, resolvedAddress, chainProviders})
    return {
        resolvedAddress,
        chainProvider,
        state: state || initialState,
        error: errors[errors.length - 1],
        errors,
    };
}
// NOTE: resolveSubplebbitAddress tests are skipped, if changes are made they must be tested manually
export const resolveSubplebbitAddress = (subplebbitAddress, chainProviders) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    let resolvedSubplebbitAddress;
    if (subplebbitAddress.endsWith('.eth')) {
        resolvedSubplebbitAddress = yield resolveEnsTxtRecord(subplebbitAddress, 'subplebbit-address', 'eth', (_a = chainProviders === null || chainProviders === void 0 ? void 0 : chainProviders['eth']) === null || _a === void 0 ? void 0 : _a.url, (_b = chainProviders === null || chainProviders === void 0 ? void 0 : chainProviders['eth']) === null || _b === void 0 ? void 0 : _b.chainId);
    }
    else {
        throw Error(`resolveSubplebbitAddress invalid subplebbitAddress '${subplebbitAddress}'`);
    }
    return resolvedSubplebbitAddress;
});
