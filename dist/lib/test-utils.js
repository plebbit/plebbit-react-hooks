var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const restorables = [];
export const silenceUpdateUnmountedComponentWarning = () => {
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
export const silenceTestWasNotWrappedInActWarning = () => {
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
const restoreAll = () => {
    for (const restore of restorables) {
        restore();
    }
};
const createWaitFor = (rendered, waitForOptions) => {
    if (!(rendered === null || rendered === void 0 ? void 0 : rendered.result)) {
        throw Error(`createWaitFor invalid 'rendered' argument`);
    }
    const waitFor = (waitForFunction) => __awaiter(void 0, void 0, void 0, function* () {
        if (typeof waitForFunction !== 'function') {
            throw Error(`waitFor invalid 'waitForFunction' argument`);
        }
        // @ts-ignore
        if (typeof waitForFunction.then === 'function') {
            throw Error(`waitFor 'waitForFunction' can't be async`);
        }
        try {
            yield rendered.waitFor(() => Boolean(waitForFunction()), waitForOptions);
        }
        catch (e) {
            console.error(e);
        }
    });
    return waitFor;
};
const testUtils = {
    silenceTestWasNotWrappedInActWarning,
    silenceUpdateUnmountedComponentWarning,
    restoreAll,
    createWaitFor,
};
export default testUtils;
