var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import assert from 'assert';
import QuickLru from 'quick-lru';
import Logger from '@plebbit/plebbit-logger';
const log = Logger('plebbit-react-hooks:utils');
const merge = (...args) => {
    // @ts-ignore
    const clonedArgs = args.map((arg) => {
        assert(arg && typeof arg === 'object', `utils.merge argument '${arg}' not an object`);
        return clone(arg);
    });
    const mergedObj = {};
    while (clonedArgs.length) {
        const currentArg = clonedArgs.shift();
        for (const i in currentArg) {
            if (currentArg[i] === undefined || currentArg[i] === null) {
                continue;
            }
            mergedObj[i] = currentArg[i];
        }
    }
    return mergedObj;
};
const clone = (obj) => {
    var _a, _b;
    assert(obj && typeof obj === 'object', `utils.clone argument '${obj}' not an object`);
    let clonedObj = {};
    // clean the object to be cloned
    for (const i in obj) {
        // remove functions
        if (typeof obj[i] === 'function') {
            continue;
        }
        // remove internal props
        if (i.startsWith('_')) {
            continue;
        }
        if (obj[i] === undefined || obj[i] === null) {
            continue;
        }
        // plebbit-js has a bug where plebbit instances have circular deps
        if (((_b = (_a = obj[i]) === null || _a === void 0 ? void 0 : _a.constructor) === null || _b === void 0 ? void 0 : _b.name) === 'Plebbit') {
            continue;
        }
        clonedObj[i] = obj[i];
    }
    // clone the object
    clonedObj = JSON.parse(JSON.stringify(clonedObj));
    return clonedObj;
};
// this function should not clone the comments to not waste memory
export const flattenCommentsPages = (pageInstanceOrPagesInstance) => {
    var _a, _b;
    const flattenedComments = [];
    // if is a Page instance
    if (pageInstanceOrPagesInstance === null || pageInstanceOrPagesInstance === void 0 ? void 0 : pageInstanceOrPagesInstance.comments) {
        for (const comment of pageInstanceOrPagesInstance.comments) {
            flattenedComments.push(comment);
            if (((_a = comment.replies) === null || _a === void 0 ? void 0 : _a.pages) && Object.keys(comment.replies.pages).length) {
                flattenedComments.push(...flattenCommentsPages(comment.replies));
            }
        }
    }
    // if is a Pages instance
    else if (pageInstanceOrPagesInstance === null || pageInstanceOrPagesInstance === void 0 ? void 0 : pageInstanceOrPagesInstance.pages) {
        for (const sortType in pageInstanceOrPagesInstance.pages) {
            flattenedComments.push(...flattenCommentsPages(pageInstanceOrPagesInstance.pages[sortType]));
        }
    }
    // if is a Pages.pages instance
    else {
        for (const sortType in pageInstanceOrPagesInstance) {
            const page = pageInstanceOrPagesInstance[sortType];
            if ((_b = page === null || page === void 0 ? void 0 : page.comments) === null || _b === void 0 ? void 0 : _b.length) {
                flattenedComments.push(...flattenCommentsPages(page));
            }
        }
    }
    // remove duplicate comments
    const flattenedCommentsObject = {};
    for (const comment of flattenedComments) {
        // @ts-ignore
        flattenedCommentsObject[comment.cid] = comment;
    }
    const uniqueFlattened = [];
    for (const cid in flattenedCommentsObject) {
        // @ts-ignore
        uniqueFlattened.push(flattenedCommentsObject[cid]);
    }
    return uniqueFlattened;
};
export const memo = (functionToMemo, memoOptions) => {
    assert(typeof functionToMemo === 'function', `memo first argument must be a function`);
    const pendingPromises = new Map();
    const cache = new QuickLru(memoOptions);
    // preserve function name
    const memoedFunctionName = functionToMemo.name || 'memoedFunction';
    const obj = {
        [memoedFunctionName]: (...args) => __awaiter(void 0, void 0, void 0, function* () {
            let cacheKey = args[0];
            if (args.length > 1) {
                cacheKey = '';
                for (const arg of args) {
                    if (typeof arg !== 'string' && typeof arg !== 'number' && arg !== undefined && arg !== null) {
                        const argumentIndex = args.indexOf(arg);
                        throw Error(`memoed function '${memoedFunctionName}' invalid argument number '${argumentIndex}' '${arg}', memoed function can only use multiple arguments if they are all of type string, number, undefined or null`);
                    }
                    cacheKey += arg;
                }
            }
            // has cached result
            const cached = cache.get(cacheKey);
            if (cached) {
                return cached;
            }
            // don't request the same thing twice if fetching is pending
            let pendingPromise = pendingPromises.get(cacheKey);
            if (pendingPromise) {
                return pendingPromise;
            }
            // create the pending promise
            let resolve, reject;
            pendingPromise = new Promise((_resolve, _reject) => {
                resolve = _resolve;
                reject = _reject;
            });
            pendingPromises.set(cacheKey, pendingPromise);
            // execute the function
            try {
                const result = yield functionToMemo(...args);
                cache.set(cacheKey, result);
                pendingPromises.delete(cacheKey);
                resolve === null || resolve === void 0 ? void 0 : resolve(result);
            }
            catch (error) {
                pendingPromises.delete(cacheKey);
                reject === null || reject === void 0 ? void 0 : reject(error);
            }
            return pendingPromise;
        }),
    };
    return obj[memoedFunctionName];
};
export const memoSync = (functionToMemo, memoOptions) => {
    assert(typeof functionToMemo === 'function', `memo first argument must be a function`);
    const cache = new QuickLru(memoOptions);
    // preserve function name
    const memoedFunctionName = functionToMemo.name || 'memoedFunction';
    const obj = {
        [memoedFunctionName]: (...args) => {
            let cacheKey = args[0];
            if (args.length > 1) {
                cacheKey = '';
                for (const arg of args) {
                    if (typeof arg !== 'string' && typeof arg !== 'number' && arg !== undefined && arg !== null) {
                        const argumentIndex = args.indexOf(arg);
                        throw Error(`memoed function '${memoedFunctionName}' invalid argument number '${argumentIndex}' '${arg}', memoed function can only use multiple arguments if they are all of type string, number, undefined or null`);
                    }
                    cacheKey += arg;
                }
            }
            // has cached result
            const cached = cache.get(cacheKey);
            if (cached) {
                return cached;
            }
            // execute the function
            const result = functionToMemo(...args);
            if (typeof (result === null || result === void 0 ? void 0 : result.then) === 'function') {
                throw Error(`memoed function '${memoedFunctionName}' is an async function, cannot be used with memoSync, use memo instead`);
            }
            cache.set(cacheKey, result);
            return result;
        },
    };
    return obj[memoedFunctionName];
};
export const clientsOnStateChange = (clients, onStateChange) => {
    var _a, _b, _c, _d, _e, _f, _g;
    for (const clientUrl in clients === null || clients === void 0 ? void 0 : clients.ipfsGateways) {
        (_a = clients === null || clients === void 0 ? void 0 : clients.ipfsGateways) === null || _a === void 0 ? void 0 : _a[clientUrl].on('statechange', (state) => onStateChange(state, 'ipfsGateways', clientUrl));
    }
    for (const clientUrl in clients === null || clients === void 0 ? void 0 : clients.kuboRpcClients) {
        (_b = clients === null || clients === void 0 ? void 0 : clients.kuboRpcClients) === null || _b === void 0 ? void 0 : _b[clientUrl].on('statechange', (state) => onStateChange(state, 'kuboRpcClients', clientUrl));
    }
    for (const clientUrl in clients === null || clients === void 0 ? void 0 : clients.pubsubKuboRpcClients) {
        (_c = clients === null || clients === void 0 ? void 0 : clients.pubsubKuboRpcClients) === null || _c === void 0 ? void 0 : _c[clientUrl].on('statechange', (state) => onStateChange(state, 'pubsubKuboRpcClients', clientUrl));
    }
    for (const clientUrl in clients === null || clients === void 0 ? void 0 : clients.plebbitRpcClients) {
        (_d = clients === null || clients === void 0 ? void 0 : clients.plebbitRpcClients) === null || _d === void 0 ? void 0 : _d[clientUrl].on('statechange', (state) => onStateChange(state, 'plebbitRpcClients', clientUrl));
    }
    for (const chainTicker in clients === null || clients === void 0 ? void 0 : clients.chainProviders) {
        for (const clientUrl in (_e = clients === null || clients === void 0 ? void 0 : clients.chainProviders) === null || _e === void 0 ? void 0 : _e[chainTicker]) {
            (_g = (_f = clients === null || clients === void 0 ? void 0 : clients.chainProviders) === null || _f === void 0 ? void 0 : _f[chainTicker]) === null || _g === void 0 ? void 0 : _g[clientUrl].on('statechange', (state) => onStateChange(state, 'chainProviders', clientUrl, chainTicker));
        }
    }
};
export const subplebbitPostsCacheExpired = (subplebbit) => {
    // NOTE: fetchedAt is undefined on owner subplebbits
    if (!(subplebbit === null || subplebbit === void 0 ? void 0 : subplebbit.fetchedAt)) {
        false;
    }
    // if subplebbit cache is older than 1 hour, its subplebbit.posts are considered expired
    const oneHourAgo = Date.now() / 1000 - 60 * 60;
    return oneHourAgo > subplebbit.fetchedAt;
};
export const removeInvalidComments = (comments, { validateReplies, blockSubplebbit }, plebbit) => __awaiter(void 0, void 0, void 0, function* () {
    if (!comments.length) {
        return [];
    }
    const isValid = yield Promise.all(comments.map(comment => commentIsValid(comment, { validateReplies, blockSubplebbit }, plebbit)));
    const validComments = comments.filter((_, i) => isValid[i]);
    return validComments;
});
const subplebbitsWithInvalidComments = {};
export const commentIsValid = (comment, { validateReplies, blockSubplebbit } = {}, plebbit) => __awaiter(void 0, void 0, void 0, function* () {
    validateReplies = Boolean(validateReplies);
    if (blockSubplebbit === undefined || blockSubplebbit === null) {
        blockSubplebbit = true;
    }
    if (!comment) {
        return false;
    }
    if (subplebbitsWithInvalidComments[comment.subplebbitAddress]) {
        console.log(`subplebbit '${comment.subplebbitAddress}' had an invalid comment, invalidate all its future comments to avoid wasting resources`);
        return false;
    }
    try {
        yield plebbit.validateComment(comment, { validateReplies });
    }
    catch (e) {
        if (blockSubplebbit) {
            subplebbitsWithInvalidComments[comment.subplebbitAddress] = true;
        }
        console.log('invalid comment', { comment, error: e });
        return false;
    }
    return true;
});
export const repliesAreValid = (comment, { validateReplies, blockSubplebbit } = {}, plebbit) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    validateReplies = Boolean(validateReplies);
    if (blockSubplebbit === undefined || blockSubplebbit === null) {
        blockSubplebbit = true;
    }
    if (!comment) {
        return false;
    }
    if (subplebbitsWithInvalidComments[comment.subplebbitAddress]) {
        console.log(`subplebbit '${comment.subplebbitAddress}' had an invalid comment, invalidate all its future comments to avoid wasting resources`);
        return false;
    }
    const replyPageArray = Object.values(((_a = comment.replies) === null || _a === void 0 ? void 0 : _a.pages) || {});
    const replies = replyPageArray.flatMap(({ comments }) => comments);
    // manual validation
    for (const reply of replies) {
        if (reply.subplebbitAddress !== comment.subplebbitAddress || reply.depth !== comment.depth + 1 || reply.parentCid !== comment.cid) {
            if (blockSubplebbit) {
                subplebbitsWithInvalidComments[comment.subplebbitAddress] = true;
            }
            console.log('invalid comment', { comment: reply, error: 'reply.subplebbitAddress !== comment.subplebbitAddress || reply.depth !== comment.depth + 1 || reply.parentCid !== comment.cid' });
            return false;
        }
    }
    // signature verification
    try {
        const promises = replies.map((reply) => commentIsValid(reply, { validateReplies: false, blockSubplebbit: true }, plebbit));
        yield Promise.all(promises);
    }
    catch (e) {
        if (blockSubplebbit) {
            subplebbitsWithInvalidComments[comment.subplebbitAddress] = true;
        }
        console.log('invalid comment', { comment, error: e });
        return false;
    }
    return true;
});
const utils = {
    merge,
    clone,
    flattenCommentsPages,
    memo,
    memoSync,
    retryInfinity: (f, o) => { },
    // export timeout values to mock them in tests
    retryInfinityMinTimeout: 1000,
    retryInfinityMaxTimeout: 1000 * 60 * 60 * 24,
    clientsOnStateChange,
    subplebbitPostsCacheExpired,
    commentIsValid,
    removeInvalidComments,
    repliesAreValid
};
export const retryInfinity = (functionToRetry, options) => __awaiter(void 0, void 0, void 0, function* () {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    let attempt = 0;
    while (true) {
        try {
            const res = yield functionToRetry();
            return res;
        }
        catch (e) {
            options === null || options === void 0 ? void 0 : options.onError(e || Error(`retryInfinity failed attempt ${attempt}`));
            const factor = 2;
            let timeout = Math.round(utils.retryInfinityMinTimeout * Math.pow(factor, attempt++));
            timeout = Math.min(timeout, utils.retryInfinityMaxTimeout);
            yield sleep(timeout);
        }
    }
});
utils.retryInfinity = retryInfinity;
export default utils;
