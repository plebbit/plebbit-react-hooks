"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.silenceTestWasNotWrappedInActWarning = exports.silenceUpdateUnmountedComponentWarning = void 0;
const restorables = [];
const silenceUpdateUnmountedComponentWarning = () => {
    const originalError = console.error;
    console.error = (...args) => {
        if (/Can't perform a React state update on an unmounted component/.test(args[0])) {
            return;
        }
        originalError.call(console, ...args);
    };
    const restore = () => {
        console.error = originalError;
    };
    restorables.push(restore);
    return restore;
};
exports.silenceUpdateUnmountedComponentWarning = silenceUpdateUnmountedComponentWarning;
const silenceTestWasNotWrappedInActWarning = () => {
    const originalError = console.error;
    console.error = (...args) => {
        if (/inside a test was not wrapped in act/.test(args[0])) {
            return;
        }
        originalError.call(console, ...args);
    };
    const restore = () => {
        console.error = originalError;
    };
    restorables.push(restore);
    return restore;
};
exports.silenceTestWasNotWrappedInActWarning = silenceTestWasNotWrappedInActWarning;
const restoreAll = () => {
    for (const restore of restorables) {
        restore();
    }
};
const testUtils = {
    silenceTestWasNotWrappedInActWarning: exports.silenceTestWasNotWrappedInActWarning,
    silenceUpdateUnmountedComponentWarning: exports.silenceUpdateUnmountedComponentWarning,
    restoreAll,
};
exports.default = testUtils;
