import { Subplebbits } from '../../types';
export declare const listeners: any;
export declare type SubplebbitsState = {
    subplebbits: Subplebbits;
    errors: {
        [subplebbitAddress: string]: Error[];
    };
    addSubplebbitToStore: Function;
    editSubplebbit: Function;
    createSubplebbit: Function;
    deleteSubplebbit: Function;
};
declare const subplebbitsStore: import("zustand").UseBoundStore<import("zustand").StoreApi<SubplebbitsState>>;
export declare const resetSubplebbitsStore: () => Promise<void>;
export declare const resetSubplebbitsDatabaseAndStore: () => Promise<void>;
export default subplebbitsStore;
