/// <reference types="node" />
import EventEmitter from 'events';
declare class _SeedIncrementer {
    seed: number;
    numbers: number[];
    index: number;
    constructor(seed: number);
    increment(): number;
}
export declare const SeedIncrementer: (seed: number) => _SeedIncrementer;
export declare const getImageUrl: (_seed: number) => Promise<any>;
declare class Publication extends EventEmitter {
    timestamp: number | undefined;
    content: string | undefined;
    cid: string | undefined;
    constructor();
    publish(): Promise<void>;
    simulateChallengeEvent(): Promise<void>;
    publishChallengeAnswers(challengeAnswers: string[]): Promise<void>;
    simulateChallengeVerificationEvent(): Promise<void>;
}
export declare class CommentEdit extends Publication {
}
export declare class SubplebbitEdit extends Publication {
}
declare const createPlebbit: any;
export default createPlebbit;
