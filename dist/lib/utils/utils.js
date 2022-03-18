"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.flattenSortedComments = void 0;
const assert_1 = __importDefault(require("assert"));
const merge = (...args) => {
    // @ts-ignore
    const clonedArgs = args.map((arg) => {
        (0, assert_1.default)(arg && typeof arg === 'object', `utils.merge argument '${arg}' not an object`);
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
    (0, assert_1.default)(obj && typeof obj === 'object', `utils.clone argument '${obj}' not an object`);
    const clonedObj = {};
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
        clonedObj[i] = obj[i];
    }
    return JSON.parse(JSON.stringify(clonedObj));
};
const sortTypes = ['hot', 'new', 'old', 'topHour', 'topDay', 'topWeek', 'topMonth', 'topYear', 'topAll', 'controversialHour', 'controversialDay', 'controversialWeek', 'controversialMonth', 'controversialYear', 'controversialAll'];
const flattenSortedComments = (sortedCommentsOrSortedCommentsObject) => {
    var _a;
    const flattenedComments = [];
    // if is SortedComments
    for (const reply of (sortedCommentsOrSortedCommentsObject === null || sortedCommentsOrSortedCommentsObject === void 0 ? void 0 : sortedCommentsOrSortedCommentsObject.comments) || []) {
        flattenedComments.push(reply);
        for (const sortType of sortTypes) {
            if ((_a = reply === null || reply === void 0 ? void 0 : reply.sortedReplies) === null || _a === void 0 ? void 0 : _a[sortType]) {
                flattenedComments.push(...(0, exports.flattenSortedComments)(reply.sortedReplies[sortType]));
            }
        }
    }
    // if is SortedCommentsObject
    for (const sortType of sortTypes) {
        if (sortedCommentsOrSortedCommentsObject === null || sortedCommentsOrSortedCommentsObject === void 0 ? void 0 : sortedCommentsOrSortedCommentsObject[sortType]) {
            flattenedComments.push(...(0, exports.flattenSortedComments)(sortedCommentsOrSortedCommentsObject[sortType]));
        }
    }
    // remove duplicate comments
    const flattenedCommentsObject = {};
    for (const reply of flattenedComments) {
        // @ts-ignore
        flattenedCommentsObject[reply.cid] = reply;
    }
    const uniqueFlattened = [];
    for (const cid in flattenedCommentsObject) {
        // @ts-ignore
        uniqueFlattened.push(flattenedCommentsObject[cid]);
    }
    return uniqueFlattened;
};
exports.flattenSortedComments = flattenSortedComments;
const utils = {
    merge,
    clone,
    flattenSortedComments: exports.flattenSortedComments
};
exports.default = utils;
