declare function Plebbit(plebbitOptions: any): void;
declare function Subplebbit(subplebbitOptions: any): void;
declare const PlebbitJs: {
    Plebbit: typeof Plebbit;
    Subplebbit: typeof Subplebbit;
};
export declare function mockPlebbitJs(_Plebbit: any): void;
export default PlebbitJs;
