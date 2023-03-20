/// <reference types="node" />
import EventEmitter from 'events';
declare class Plebbit extends EventEmitter {
    createSigner(): Promise<{
        privateKey: string;
        address: string;
    }>;
    createSubplebbit(createSubplebbitOptions: any): Promise<Subplebbit>;
    getSubplebbit(subplebbitAddress: string): Promise<any>;
    listSubplebbits(): Promise<string[]>;
    createComment(createCommentOptions: any): Promise<Comment>;
    getComment(commentCid: string): Promise<Comment>;
    createVote(): Promise<Vote>;
    createCommentEdit(): Promise<CommentEdit>;
    createSubplebbitEdit(): Promise<SubplebbitEdit>;
    fetchCid(cid: string): Promise<string>;
}
declare class Pages {
    pageCids: any;
    pages: any;
    subplebbit: any;
    comment: any;
    constructor(pagesOptions?: any);
    getPage(pageCid: string): Promise<any>;
}
declare class Subplebbit extends EventEmitter {
    address: string | undefined;
    title: string | undefined;
    description: string | undefined;
    pageCids: any;
    posts: Pages;
    pubsubTopic: string | undefined;
    createdAt: number | undefined;
    updatedAt: number | undefined;
    challengeTypes: string[] | undefined;
    roles: any | undefined;
    flairs: any | undefined;
    suggested: any | undefined;
    features: any | undefined;
    rules: string[] | undefined;
    signer: any | undefined;
    shortAddress: string | undefined;
    statsCid: string | undefined;
    constructor(createSubplebbitOptions?: any);
    edit(editSubplebbitOptions: any): Promise<void>;
    update(): Promise<void>;
    delete(): Promise<void>;
    simulateUpdateEvent(): void;
}
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
declare class Comment extends Publication {
    author: any;
    ipnsName: string | undefined;
    upvoteCount: number | undefined;
    downvoteCount: number | undefined;
    content: string | undefined;
    parentCid: string | undefined;
    replies: any;
    replyCount: number | undefined;
    postCid: string | undefined;
    depth: number | undefined;
    spoiler: boolean | undefined;
    flair: any | undefined;
    pinned: boolean | undefined;
    locked: boolean | undefined;
    deleted: boolean | undefined;
    removed: boolean | undefined;
    editTimestamp: number | undefined;
    reason: string | undefined;
    shortCid: string | undefined;
    constructor(createCommentOptions?: any);
    update(): Promise<void>;
    simulateUpdateEvent(): Promise<void>;
}
declare class Vote extends Publication {
}
export declare class CommentEdit extends Publication {
}
export declare class SubplebbitEdit extends Publication {
}
export default function (): Promise<Plebbit>;
export {};
