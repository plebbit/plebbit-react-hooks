export declare const silenceUpdateUnmountedComponentWarning: () => () => void;
export declare const silenceTestWasNotWrappedInActWarning: () => () => void;
export declare const silenceReactWarnings: () => void;
declare type WaitForOptions = {
    timeout?: number;
    interval?: number;
};
export declare const resetStores: () => Promise<void>;
export declare const resetDatabasesAndStores: () => Promise<void>;
declare const testUtils: {
    silenceTestWasNotWrappedInActWarning: () => () => void;
    silenceUpdateUnmountedComponentWarning: () => () => void;
    silenceReactWarnings: () => void;
    restoreAll: () => void;
    createWaitFor: (rendered: any, waitForOptions?: WaitForOptions | undefined) => (waitForFunction: Function) => Promise<void>;
    resetStores: () => Promise<void>;
    resetDatabasesAndStores: () => Promise<void>;
};
export default testUtils;
