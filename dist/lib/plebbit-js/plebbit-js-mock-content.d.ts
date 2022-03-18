/// <reference types="node" />
import EventEmitter from 'events';
export declare class Plebbit {
    createSubplebbit(createSubplebbitOptions: any): Subplebbit;
    getSubplebbit(subplebbitAddress: string): Promise<any>;
    createComment(createCommentOptions: any): Comment;
    getComment(commentCid: string): Promise<Comment>;
    createVote(): Vote;
}
export declare class Subplebbit extends EventEmitter {
    updating: boolean;
    address: string | undefined;
    title: string | undefined;
    description: string | undefined;
    sortedPosts: any;
    sortedPostsCids: any;
    constructor(createSubplebbitOptions?: any);
    update(): void;
    simulateUpdateEvent(): void;
    getSortedPosts(sortedPostsCid: string): Promise<any>;
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
    updating: boolean;
    author: any;
    ipnsName: string | undefined;
    upvoteCount: number | undefined;
    downvoteCount: number | undefined;
    content: string | undefined;
    parentCommentCid: string | undefined;
    sortedReplies: any;
    replyCount: number | undefined;
    constructor(createCommentOptions?: any);
    update(): void;
    simulateUpdateEvent(): Promise<void>;
}
export declare class Vote extends Publication {
}
export default function (): Plebbit;
export {};
