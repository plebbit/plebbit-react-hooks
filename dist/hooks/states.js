import { useMemo } from 'react';
import Logger from '@plebbit/plebbit-logger';
const log = Logger('plebbit-react-hooks:states:hooks');
import assert from 'assert';
import { useSubplebbits } from './subplebbits';
import { subplebbitPostsCacheExpired } from '../lib/utils';
// TODO: implement getting peers
const peers = {};
/**
 * @param comment - The comment to get the states from
 * @param subplebbit - The subplebbit to get the states from
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useClientsStates(options) {
    assert(!options || typeof options === 'object', `useClientsStates options argument '${options}' not an object`);
    const { comment, subplebbit } = options || {};
    assert(!comment || typeof comment === 'object', `useClientsStates options.comment argument '${comment}' not an object`);
    assert(!subplebbit || typeof subplebbit === 'object', `useClientsStates options.subplebbit argument '${subplebbit}' not an object`);
    assert(!(comment && subplebbit), `useClientsStates options.comment and options.subplebbit arguments cannot be defined at the same time`);
    const commentOrSubplebbit = comment || subplebbit;
    const states = useMemo(() => {
        var _a, _b, _c, _d, _e, _f;
        const states = {};
        // if comment is newer than 5 minutes, don't show updating state so user knows it finished
        if ((commentOrSubplebbit === null || commentOrSubplebbit === void 0 ? void 0 : commentOrSubplebbit.cid) && commentOrSubplebbit.timestamp + 5 * 60 > Date.now() / 1000) {
            return states;
        }
        if (!(commentOrSubplebbit === null || commentOrSubplebbit === void 0 ? void 0 : commentOrSubplebbit.clients)) {
            return states;
        }
        const clients = commentOrSubplebbit === null || commentOrSubplebbit === void 0 ? void 0 : commentOrSubplebbit.clients;
        const addState = (state, clientUrl) => {
            if (!state || state === 'stopped') {
                return;
            }
            if (!states[state]) {
                states[state] = [];
            }
            states[state].push(clientUrl);
        };
        // dont show state if the data is already fetched
        if (!(commentOrSubplebbit === null || commentOrSubplebbit === void 0 ? void 0 : commentOrSubplebbit.updatedAt) || subplebbitPostsCacheExpired(commentOrSubplebbit)) {
            for (const clientUrl in clients === null || clients === void 0 ? void 0 : clients.ipfsGateways) {
                addState((_a = clients.ipfsGateways[clientUrl]) === null || _a === void 0 ? void 0 : _a.state, clientUrl);
            }
            for (const clientUrl in clients === null || clients === void 0 ? void 0 : clients.ipfsClients) {
                addState((_b = clients.ipfsClients[clientUrl]) === null || _b === void 0 ? void 0 : _b.state, clientUrl);
            }
            for (const clientUrl in clients === null || clients === void 0 ? void 0 : clients.pubsubClients) {
                addState((_c = clients.pubsubClients[clientUrl]) === null || _c === void 0 ? void 0 : _c.state, clientUrl);
            }
            for (const clientUrl in clients === null || clients === void 0 ? void 0 : clients.plebbitRpcClients) {
                addState((_d = clients.plebbitRpcClients[clientUrl]) === null || _d === void 0 ? void 0 : _d.state, clientUrl);
            }
            for (const chainTicker in clients === null || clients === void 0 ? void 0 : clients.chainProviders) {
                for (const clientUrl in clients.chainProviders[chainTicker]) {
                    addState((_e = clients.chainProviders[chainTicker][clientUrl]) === null || _e === void 0 ? void 0 : _e.state, clientUrl);
                }
            }
        }
        // find subplebbit pages states
        if ((_f = commentOrSubplebbit === null || commentOrSubplebbit === void 0 ? void 0 : commentOrSubplebbit.posts) === null || _f === void 0 ? void 0 : _f.clients) {
            for (const clientType in commentOrSubplebbit.posts.clients) {
                for (const sortType in commentOrSubplebbit.posts.clients[clientType]) {
                    for (const clientUrl in commentOrSubplebbit.posts.clients[clientType][sortType]) {
                        let state = commentOrSubplebbit.posts.clients[clientType][sortType][clientUrl].state;
                        if (state === 'stopped') {
                            continue;
                        }
                        state += `-page-${sortType}`;
                        if (!states[state]) {
                            states[state] = [];
                        }
                        states[state].push(clientUrl);
                    }
                }
            }
        }
        log('useClientsStates', {
            subplebbitAddress: commentOrSubplebbit === null || commentOrSubplebbit === void 0 ? void 0 : commentOrSubplebbit.address,
            commentCid: commentOrSubplebbit === null || commentOrSubplebbit === void 0 ? void 0 : commentOrSubplebbit.cid,
            states,
            commentOrSubplebbit,
        });
        return states;
    }, [commentOrSubplebbit]);
    return useMemo(() => ({
        states,
        peers,
        state: 'initializing',
        error: undefined,
        errors: [],
    }), [states, peers]);
}
/**
 * @param subplebbitAddresses - The subplebbit addresses to get the states from
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useSubplebbitsStates(options) {
    assert(!options || typeof options === 'object', `useClientsStatesCounts options argument '${options}' not an object`);
    const { subplebbitAddresses } = options || {};
    assert(!subplebbitAddresses || Array.isArray(subplebbitAddresses), `useClientsStatesCounts subplebbitAddresses '${subplebbitAddresses}' not an array`);
    for (const subplebbitAddress of subplebbitAddresses || []) {
        assert(typeof subplebbitAddress === 'string', `useClientsStatesCounts subplebbitAddresses '${subplebbitAddresses}' subplebbitAddress '${subplebbitAddress}' not a string`);
    }
    const { subplebbits } = useSubplebbits({ subplebbitAddresses });
    const states = useMemo(() => {
        var _a;
        const states = {};
        for (const subplebbit of subplebbits) {
            if (!(subplebbit === null || subplebbit === void 0 ? void 0 : subplebbit.updatingState)) {
                continue;
            }
            // dont show subplebbit state if data is already fetched
            if ((!subplebbit.updatedAt || subplebbitPostsCacheExpired(subplebbit)) && (subplebbit === null || subplebbit === void 0 ? void 0 : subplebbit.updatingState) !== 'stopped' && (subplebbit === null || subplebbit === void 0 ? void 0 : subplebbit.updatingState) !== 'succeeded') {
                if (!states[subplebbit.updatingState]) {
                    states[subplebbit.updatingState] = { subplebbitAddresses: new Set(), clientUrls: new Set() };
                }
                states[subplebbit.updatingState].subplebbitAddresses.add(subplebbit.address);
                // find client urls
                for (const clientType in subplebbit.clients) {
                    if (clientType === 'chainProviders') {
                        for (const chainTicker in subplebbit.clients.chainProviders) {
                            for (const clientUrl in subplebbit.clients.chainProviders[chainTicker]) {
                                const state = subplebbit.clients.chainProviders[chainTicker][clientUrl].state;
                                // match 'resolving' in case plebbit-js has clients with incorrect states
                                // TODO: this should in theory never happen, but it does, and difficult to debug
                                if (state !== 'stopped' && (state === null || state === void 0 ? void 0 : state.startsWith('resolving'))) {
                                    states[subplebbit.updatingState].clientUrls.add(clientUrl);
                                }
                            }
                        }
                    }
                    else {
                        for (const clientUrl in subplebbit.clients[clientType]) {
                            const state = subplebbit.clients[clientType][clientUrl].state;
                            // match 'resolving' in case plebbit-js has clients with incorrect states
                            // TODO: this should in theory never happen, but it does, and difficult to debug
                            if (state !== 'stopped' && (state === null || state === void 0 ? void 0 : state.startsWith('resolving')) === false) {
                                states[subplebbit.updatingState].clientUrls.add(clientUrl);
                            }
                        }
                    }
                }
            }
            // find subplebbit pages states and client urls
            const pagesClientsUrls = {};
            for (const clientType in (_a = subplebbit === null || subplebbit === void 0 ? void 0 : subplebbit.posts) === null || _a === void 0 ? void 0 : _a.clients) {
                for (const sortType in subplebbit.posts.clients[clientType]) {
                    for (const clientUrl in subplebbit.posts.clients[clientType][sortType]) {
                        let state = subplebbit.posts.clients[clientType][sortType][clientUrl].state;
                        if (state !== 'stopped') {
                            state += `-page-${sortType}`;
                            if (!pagesClientsUrls[state]) {
                                pagesClientsUrls[state] = [];
                            }
                            pagesClientsUrls[state].push(clientUrl);
                        }
                    }
                }
            }
            // add subplebbitAddresses and clientUrls
            for (const pagesState in pagesClientsUrls) {
                if (!states[pagesState]) {
                    states[pagesState] = { subplebbitAddresses: new Set(), clientUrls: new Set() };
                }
                states[pagesState].subplebbitAddresses.add(subplebbit.address);
                pagesClientsUrls[pagesState].forEach((clientUrl) => states[pagesState].clientUrls.add(clientUrl));
            }
        }
        // convert sets to arrays
        const _states = {};
        for (const state in states) {
            _states[state] = {
                subplebbitAddresses: [...states[state].subplebbitAddresses],
                clientUrls: [...states[state].clientUrls],
            };
        }
        log('useSubplebbitsStates', {
            subplebbitAddresses,
            states: _states,
            subplebbits,
        });
        return _states;
    }, [subplebbits]);
    return useMemo(() => ({
        states,
        peers,
        state: 'initializing',
        error: undefined,
        errors: [],
    }), [states, peers]);
}
