"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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
const utils = {
    merge,
    clone
};
exports.default = utils;
