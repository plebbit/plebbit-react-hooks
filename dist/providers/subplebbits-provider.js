var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useState, useContext } from 'react';
import assert from 'assert';
import localForageLru from '../lib/localforage-lru';
const subplebbitsDatabase = localForageLru.createInstance({ name: 'subplebbits', size: 500 });
import Debug from 'debug';
const debug = Debug('plebbit-react-hooks:providers:subplebbits-provider');
import { AccountsContext } from './accounts-provider';
import utils from '../lib/utils';
export const SubplebbitsContext = React.createContext(undefined);
const plebbitGetSubplebbitPending = {};
export default function SubplebbitsProvider(props) {
    const accountsContext = useContext(AccountsContext);
    const [subplebbits, setSubplebbits] = useState({});
    const subplebbitsActions = {};
    subplebbitsActions.addSubplebbitToContext = (subplebbitAddress, account) => __awaiter(this, void 0, void 0, function* () {
        // subplebbit is in context already, do nothing
        let subplebbit = subplebbits[subplebbitAddress];
        if (subplebbit || plebbitGetSubplebbitPending[subplebbitAddress + account.id]) {
            return;
        }
        // try to find subplebbit in database
        subplebbit = yield getSubplebbitFromDatabase(subplebbitAddress, account);
        // subplebbit not in database, fetch from plebbit-js
        if (!subplebbit) {
            plebbitGetSubplebbitPending[subplebbitAddress + account.id] = true;
            subplebbit = yield account.plebbit.getSubplebbit(subplebbitAddress);
            yield subplebbitsDatabase.setItem(subplebbitAddress, utils.clone(subplebbit));
        }
        debug('subplebbitsActions.addSubplebbitToContext', { subplebbitAddress, subplebbit, account });
        setSubplebbits((previousSubplebbits) => (Object.assign(Object.assign({}, previousSubplebbits), { [subplebbitAddress]: utils.clone(subplebbit) })));
        plebbitGetSubplebbitPending[subplebbitAddress + account.id] = false;
        // the subplebbit has published new posts
        subplebbit.on('update', (updatedSubplebbit) => __awaiter(this, void 0, void 0, function* () {
            updatedSubplebbit = utils.clone(updatedSubplebbit);
            yield subplebbitsDatabase.setItem(subplebbitAddress, updatedSubplebbit);
            debug('subplebbitsContext subplebbit update', { subplebbitAddress, updatedSubplebbit, account });
            setSubplebbits((previousSubplebbits) => (Object.assign(Object.assign({}, previousSubplebbits), { [subplebbitAddress]: updatedSubplebbit })));
            // if a subplebbit has a role with an account's address add it to the account.subplebbits
            accountsContext.addSubplebbitRoleToAccountsSubplebbits(updatedSubplebbit);
        }));
        subplebbit.update();
    });
    // user is the owner of the subplebbit and can edit it locally
    subplebbitsActions.editSubplebbit = (subplebbitAddress, subplebbitEditOptions, account) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        assert(subplebbitAddress !== '' && typeof subplebbitAddress === 'string', `subplebbitsActions.editSubplebbit invalid subplebbitAddress argument '${subplebbitAddress}'`);
        assert(subplebbitEditOptions && typeof subplebbitEditOptions === 'object', `subplebbitsActions.editSubplebbit invalid subplebbitEditOptions argument '${subplebbitEditOptions}'`);
        assert(typeof ((_a = account === null || account === void 0 ? void 0 : account.plebbit) === null || _a === void 0 ? void 0 : _a.createSubplebbit) === 'function', `subplebbitsActions.editSubplebbit invalid account argument '${account}'`);
        // `subplebbitAddress` is different from  `subplebbitEditOptions.address` when editing the subplebbit address
        const subplebbit = yield account.plebbit.createSubplebbit({ address: subplebbitAddress });
        yield subplebbit.edit(subplebbitEditOptions);
        debug('subplebbitsActions.editSubplebbit', { subplebbitAddress, subplebbitEditOptions, subplebbit, account });
        setSubplebbits((previousSubplebbits) => (Object.assign(Object.assign({}, previousSubplebbits), { 
            // edit react state of both old and new subplebbit address to not break the UI
            [subplebbitAddress]: utils.clone(subplebbit), [subplebbit.address]: utils.clone(subplebbit) })));
    });
    if (!props.children) {
        return null;
    }
    const subplebbitsContext = {
        subplebbits,
        subplebbitsActions,
    };
    debug({ subplebbitsContext: subplebbits });
    return React.createElement(SubplebbitsContext.Provider, { value: subplebbitsContext }, props.children);
}
const getSubplebbitFromDatabase = (subplebbitAddress, account) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const subplebbitData = yield subplebbitsDatabase.getItem(subplebbitAddress);
    if (!subplebbitData) {
        return;
    }
    const subplebbit = yield account.plebbit.createSubplebbit(subplebbitData);
    // add potential missing data from the database onto the subplebbit instance
    for (const prop in subplebbitData) {
        if (subplebbit[prop] === undefined || subplebbit[prop] === null) {
            if (subplebbitData[prop] !== undefined && subplebbitData[prop] !== null)
                subplebbit[prop] = subplebbitData[prop];
        }
    }
    // add potential missing data from the Pages API
    if (subplebbit.posts) {
        subplebbit.posts.pages = utils.merge(((_a = subplebbitData === null || subplebbitData === void 0 ? void 0 : subplebbitData.posts) === null || _a === void 0 ? void 0 : _a.pages) || {}, ((_b = subplebbit === null || subplebbit === void 0 ? void 0 : subplebbit.posts) === null || _b === void 0 ? void 0 : _b.pages) || {});
        subplebbit.posts.pageCids = utils.merge(((_c = subplebbitData === null || subplebbitData === void 0 ? void 0 : subplebbitData.posts) === null || _c === void 0 ? void 0 : _c.pageCids) || {}, ((_d = subplebbit === null || subplebbit === void 0 ? void 0 : subplebbit.posts) === null || _d === void 0 ? void 0 : _d.pageCids) || {});
    }
    // NOTE: adding missing data is probably not needed with a full implementation of plebbit-js with no bugs
    // but the plebbit mock is barely implemented
    return subplebbit;
});
