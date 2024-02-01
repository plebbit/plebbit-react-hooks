var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useState, useMemo, useEffect } from 'react';
import { useAccount } from './accounts';
import Logger from '@plebbit/plebbit-logger';
const log = Logger('plebbit-react-hooks:states:plebbit-rpc');
import assert from 'assert';
/**
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function usePlebbitRpcSettings(options) {
    assert(!options || typeof options === 'object', `usePlebbitRpcSettings options argument '${options}' not an object`);
    const { accountName } = options || {};
    const account = useAccount({ accountName });
    const [plebbitRpcSettingsState, setPlebbitRpcSettingsState] = useState();
    const [state, setState] = useState('initializing');
    const [errors, setErrors] = useState([]);
    useEffect(() => {
        if (!account) {
            return;
        }
        setState('calling-rpc');
        account.plebbit
            .rpcCall('getSettings', [])
            .then((plebbitRpcSettings) => {
            setPlebbitRpcSettingsState(plebbitRpcSettings);
            setState('succeeded');
        })
            .catch((e) => {
            setErrors([...errors, e]);
            setState('failed');
        });
    }, [account === null || account === void 0 ? void 0 : account.id]);
    const setPlebbitRpcSettings = (plebbitRpcSettings) => __awaiter(this, void 0, void 0, function* () {
        assert(account, `can't use usePlebbitRpcSettings.setPlebbitRpcSettings before initialized`);
        assert(plebbitRpcSettings && typeof plebbitRpcSettings === 'object', `usePlebbitRpcSettings.setPlebbitRpcSettings plebbitRpcSettings argument '${plebbitRpcSettings}' not an object`);
        setState('calling-rpc');
        try {
            yield account.plebbit.rpcCall('setSettings', [plebbitRpcSettings]);
            setPlebbitRpcSettingsState(plebbitRpcSettings);
            setState('succeeded');
        }
        catch (e) {
            setErrors([...errors, e]);
            setState('failed');
        }
    });
    return useMemo(() => ({
        plebbitRpcSettings: plebbitRpcSettingsState,
        setPlebbitRpcSettings,
        state,
        error: errors === null || errors === void 0 ? void 0 : errors[errors.length - 1],
        errors,
    }), [plebbitRpcSettingsState, setPlebbitRpcSettings, state, errors]);
}
