"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSubplebbits = exports.useSubplebbit = void 0;
const react_1 = require("react");
const accounts_1 = require("./accounts");
const subplebbits_provider_1 = require("../providers/subplebbits-provider");
const validator_1 = __importDefault(require("../lib/validator"));
const debug_1 = __importDefault(require("debug"));
const debug = (0, debug_1.default)('plebbitreacthooks:hooks:subplebbits');
/**
 * @param subplebbitAddress - The address of the subplebbit, e.g. 'memes.eth', 'Qm...', etc
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
function useSubplebbit(subplebbitAddress, accountName) {
    const account = (0, accounts_1.useAccount)(accountName);
    const subplebbitsContext = (0, react_1.useContext)(subplebbits_provider_1.SubplebbitsContext);
    const subplebbit = subplebbitAddress && subplebbitsContext.subplebbits[subplebbitAddress];
    (0, react_1.useEffect)(() => {
        if (!subplebbitAddress || !account) {
            return;
        }
        validator_1.default.validateUseSubplebbitArguments(subplebbitAddress, account);
        if (!subplebbit) {
            // if subplebbit isn't already in context, add it
            subplebbitsContext.subplebbitsActions.addSubplebbitToContext(subplebbitAddress, account);
        }
    }, [subplebbitAddress, account]);
    debug('useSubplebbit', { subplebbitsContext: subplebbitsContext.subplebbits, subplebbit, account });
    return subplebbit;
}
exports.useSubplebbit = useSubplebbit;
/**
 * @param subplebbitAddresses - The addresses of the subplebbits, e.g. ['memes.eth', 'Qm...']
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
function useSubplebbits(subplebbitAddresses, accountName) {
    const account = (0, accounts_1.useAccount)(accountName);
    const subplebbitsContext = (0, react_1.useContext)(subplebbits_provider_1.SubplebbitsContext);
    const subplebbits = [];
    for (const subplebbitAddress of subplebbitAddresses || []) {
        subplebbits.push(subplebbitsContext.subplebbits[subplebbitAddress]);
    }
    (0, react_1.useEffect)(() => {
        if (!subplebbitAddresses || !account) {
            return;
        }
        validator_1.default.validateUseSubplebbitsArguments(subplebbitAddresses, account);
        const uniqueSubplebbitAddresses = new Set(subplebbitAddresses);
        for (const subplebbitAddress of uniqueSubplebbitAddresses) {
            // if subplebbit isn't already in context, add it
            if (!subplebbitsContext.subplebbits[subplebbitAddress]) {
                subplebbitsContext.subplebbitsActions.addSubplebbitToContext(subplebbitAddress, account);
            }
        }
    }, [subplebbitAddresses, account]);
    debug('useSubplebbits', { subplebbitsContext: subplebbitsContext.subplebbits, subplebbits, account });
    return subplebbits;
}
exports.useSubplebbits = useSubplebbits;
