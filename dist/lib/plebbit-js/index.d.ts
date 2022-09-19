declare const PlebbitJs: {
    Plebbit: {
        (plebbitOptions?: import("@plebbit/plebbit-js/dist/node/types").PlebbitOptions | undefined): Promise<import("@plebbit/plebbit-js/dist/node/plebbit").Plebbit>;
        setNativeFunctions: (newNativeFunctions: Partial<import("@plebbit/plebbit-js/dist/node/types").NativeFunctions>) => void;
    };
};
/**
 * replace PlebbitJs with a different implementation, for
 * example to mock it during unit tests, to add mock content
 * for developing the front-end or to add a PlebbitJs with
 * desktop privileges in the Electron build.
 */
export declare function setPlebbitJs(_Plebbit: any): void;
export declare function restorePlebbitJs(): void;
export default PlebbitJs;
