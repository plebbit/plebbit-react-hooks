declare const PlebbitJs: {
    Plebbit: (plebbitOptions?: any) => import("@plebbit/plebbit-js/dist/node/plebbit").Plebbit;
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
