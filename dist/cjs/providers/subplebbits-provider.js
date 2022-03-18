"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubplebbitsContext = void 0;
const react_1 = __importStar(require("react"));
const localforage_lru_1 = __importDefault(require("../lib/localforage-lru"));
const subplebbitsDatabase = localforage_lru_1.default.createInstance({ name: 'subplebbits', size: 500 });
const debug_1 = __importDefault(require("debug"));
const debug = (0, debug_1.default)('plebbitreacthooks:providers:subplebbitsprovider');
const utils_1 = __importDefault(require("../lib/utils"));
exports.SubplebbitsContext = react_1.default.createContext(undefined);
const plebbitGetSubplebbitPending = {};
function SubplebbitsProvider(props) {
    const [subplebbits, setSubplebbits] = (0, react_1.useState)({});
    const subplebbitsActions = {};
    subplebbitsActions.addSubplebbitToContext = async (subplebbitAddress, account) => {
        // subplebbit is in context already, do nothing
        let subplebbit = subplebbits[subplebbitAddress];
        if (subplebbit || plebbitGetSubplebbitPending[subplebbitAddress + account.id]) {
            return;
        }
        // try to find subplebbit in database
        subplebbit = await getSubplebbitFromDatabase(subplebbitAddress, account);
        // subplebbit not in database, fetch from plebbit-js
        if (!subplebbit) {
            plebbitGetSubplebbitPending[subplebbitAddress + account.id] = true;
            subplebbit = await account.plebbit.getSubplebbit(subplebbitAddress);
            await subplebbitsDatabase.setItem(subplebbitAddress, utils_1.default.clone(subplebbit));
        }
        debug('subplebbitsActions.addSubplebbitToContext', { subplebbitAddress, subplebbit, account });
        setSubplebbits((previousSubplebbits) => (Object.assign(Object.assign({}, previousSubplebbits), { [subplebbitAddress]: utils_1.default.clone(subplebbit) })));
        plebbitGetSubplebbitPending[subplebbitAddress + account.id] = false;
        // the subplebbit has published new posts
        subplebbit.on('update', async (updatedSubplebbit) => {
            updatedSubplebbit = utils_1.default.clone(updatedSubplebbit);
            await subplebbitsDatabase.setItem(subplebbitAddress, updatedSubplebbit);
            debug('subplebbitsContext subplebbit update', { subplebbitAddress, updatedSubplebbit, account });
            setSubplebbits((previousSubplebbits) => (Object.assign(Object.assign({}, previousSubplebbits), { [subplebbitAddress]: updatedSubplebbit })));
        });
        subplebbit.update();
    };
    if (!props.children) {
        return null;
    }
    const subplebbitsContext = {
        subplebbits,
        subplebbitsActions,
    };
    debug({ subplebbitsContext: subplebbits });
    return react_1.default.createElement(exports.SubplebbitsContext.Provider, { value: subplebbitsContext }, props.children);
}
exports.default = SubplebbitsProvider;
const getSubplebbitFromDatabase = async (subplebbitAddress, account) => {
    const subplebbitData = await subplebbitsDatabase.getItem(subplebbitAddress);
    if (!subplebbitData) {
        return;
    }
    const subplebbit = account.plebbit.createSubplebbit(subplebbitData);
    // add potential missing data from the database onto the subplebbit instance
    for (const prop in subplebbitData) {
        if (subplebbit[prop] === undefined || subplebbit[prop] === null) {
            if (subplebbitData[prop] !== undefined && subplebbitData[prop] !== null)
                subplebbit[prop] = subplebbitData[prop];
        }
    }
    return subplebbit;
};
