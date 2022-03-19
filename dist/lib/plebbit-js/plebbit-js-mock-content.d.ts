/// <reference types="node" />
import EventEmitter from 'events';
declare class Plebbit {
    createSubplebbit(createSubplebbitOptions: any): Subplebbit;
    getSubplebbit(subplebbitAddress: string): Promise<any>;
    createComment(createCommentOptions: any): Comment;
    getComment(commentCid: string): Promise<Comment>;
    createVote(): Vote;
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
    updating: boolean;
    address: string | undefined;
    title: string | undefined;
    description: string | undefined;
    pageCids: any;
    posts: Pages;
    constructor(createSubplebbitOptions?: any);
    update(): void;
    simulateUpdateEvent(): void;
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
declare class Comment extends Publication {
    updating: boolean;
    author: any;
    ipnsName: string | undefined;
    upvoteCount: number | undefined;
    downvoteCount: number | undefined;
    content: string | undefined;
    parentCid: string | undefined;
    replies: any;
    replyCount: number | undefined;
    constructor(createCommentOptions?: any);
    update(): void;
    simulateUpdateEvent(): Promise<void>;
}
declare class Vote extends Publication {
}
export default function (): Plebbit;
export {};
