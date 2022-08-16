import assert from 'assert';
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
const sortTypes = [
    'hot',
    'new',
    'old',
    'topHour',
    'topDay',
    'topWeek',
    'topMonth',
    'topYear',
    'topAll',
    'controversialHour',
    'controversialDay',
    'controversialWeek',
    'controversialMonth',
    'controversialYear',
    'controversialAll',
];
export const flattenCommentsPages = (pageInstanceOrPagesInstance) => {
    var _a, _b, _c, _d, _e;
    const flattenedComments = [];
    // if is a Page instance
    for (const comment of (pageInstanceOrPagesInstance === null || pageInstanceOrPagesInstance === void 0 ? void 0 : pageInstanceOrPagesInstance.comments) || []) {
        flattenedComments.push(comment);
        for (const sortType of sortTypes) {
            if ((_b = (_a = comment === null || comment === void 0 ? void 0 : comment.replies) === null || _a === void 0 ? void 0 : _a.pages) === null || _b === void 0 ? void 0 : _b[sortType]) {
                flattenedComments.push(...flattenCommentsPages((_d = (_c = comment.replies) === null || _c === void 0 ? void 0 : _c.pages) === null || _d === void 0 ? void 0 : _d[sortType]));
            }
        }
    }
    // if is a Pages instance
    for (const sortType of sortTypes) {
        if ((_e = pageInstanceOrPagesInstance === null || pageInstanceOrPagesInstance === void 0 ? void 0 : pageInstanceOrPagesInstance.pages) === null || _e === void 0 ? void 0 : _e[sortType]) {
            flattenedComments.push(...flattenCommentsPages(pageInstanceOrPagesInstance.pages[sortType]));
        }
    }
    // if is a Pages.pages instance
    for (const sortType of sortTypes) {
        if (pageInstanceOrPagesInstance === null || pageInstanceOrPagesInstance === void 0 ? void 0 : pageInstanceOrPagesInstance[sortType]) {
            flattenedComments.push(...flattenCommentsPages(pageInstanceOrPagesInstance[sortType]));
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
// use with zustand store to know if an object has changed
export function jsonStringifyEqual(objA, objB) {
    if (JSON.stringify(objA) === JSON.stringify(objB)) {
        return true;
    }
    return false;
}
const utils = {
    merge,
    clone,
    flattenCommentsPages,
    jsonStringifyEqual,
};
export default utils;
