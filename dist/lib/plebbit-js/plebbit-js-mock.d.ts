/// <reference types="node" />
import EventEmitter from 'events';
export declare const simulateLoadingTime: () => Promise<unknown>;
export declare const resetPlebbitJsMock: () => void;
export declare const debugPlebbitJsMock: () => void;
export declare class Plebbit extends EventEmitter {
    createSigner(): Promise<{
        privateKey: string;
        address: string;
    }>;
    createSubplebbit(createSubplebbitOptions: any): Promise<Subplebbit>;
    getSubplebbit(subplebbitAddress: string): Promise<any>;
    listSubplebbits(): Promise<string[]>;
    createComment(createCommentOptions: any): Promise<Comment>;
    getComment(commentCid: string): Promise<Comment>;
    commentToGet(): {};
    createVote(): Promise<Vote>;
    createCommentEdit(createCommentEditOptions: any): Promise<CommentEdit>;
    createSubplebbitEdit(createSubplebbitEditOptions: any): Promise<SubplebbitEdit>;
}
export declare class Pages {
    pageCids: any;
    pages: any;
    subplebbit: any;
    comment: any;
    constructor(pagesOptions?: any);
    getPage(pageCid: string): Promise<any>;
}
export declare class Subplebbit extends EventEmitter {
    updateCalledTimes: number;
    updating: boolean;
    address: string | undefined;
    title: string | undefined;
    description: string | undefined;
    posts: Pages;
    constructor(createSubplebbitOptions?: any);
    update(): Promise<void>;
    delete(): Promise<void>;
    simulateUpdateEvent(): void;
    get roles(): {};
    rolesToGet(): {};
    edit(editSubplebbitOptions: any): Promise<void>;
}
declare class Publication extends EventEmitter {
    timestamp: number | undefined;
    content: string | undefined;
    cid: string | undefined;
    challengeRequestId: string;
    challengeAnswerId: string;
    publish(): Promise<void>;
    simulateChallengeEvent(): void;
    publishChallengeAnswers(challengeAnswers: string[]): Promise<void>;
    simulateChallengeVerificationEvent(): void;
}
export declare class Comment extends Publication {
    updateCalledTimes: number;
    updating: boolean;
    author: any;
    ipnsName: string | undefined;
    upvoteCount: number | undefined;
    downvoteCount: number | undefined;
    content: string | undefined;
    parentCid: string | undefined;
    replies: any;
    constructor(createCommentOptions?: any);
    update(): Promise<void>;
    simulateUpdateEvent(): void;
}
export declare class Vote extends Publication {
}
export declare class CommentEdit extends Publication {
}
export declare class SubplebbitEdit extends Publication {
}
export default function (): Promise<Plebbit>;
export {};
