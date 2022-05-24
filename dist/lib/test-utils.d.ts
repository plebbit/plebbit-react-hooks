export declare const silenceUpdateUnmountedComponentWarning: () => () => void;
export declare const silenceTestWasNotWrappedInActWarning: () => () => void;
declare type WaitForOptions = {
    timeout?: number;
    interval?: number;
};
declare const testUtils: {
    silenceTestWasNotWrappedInActWarning: () => () => void;
    silenceUpdateUnmountedComponentWarning: () => () => void;
    restoreAll: () => void;
    createWaitFor: (rendered: any, waitForOptions?: WaitForOptions | undefined) => (waitForFunction: Function) => Promise<void>;
};
export default testUtils;
