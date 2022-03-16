var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import EventEmitter from 'events';
export { mockPlebbitJs as mockPlebbitJs } from '.';
// TODO: make load time changeable with env variable
// so the frontend can test with latency
const loadingTime = 10;
export const simulateLoadingTime = () => new Promise((r) => setTimeout(r, loadingTime));
export class Plebbit {
    createSubplebbit(createSubplebbitOptions) {
        return new Subplebbit(createSubplebbitOptions);
    }
    getSubplebbit(subplebbitAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            yield simulateLoadingTime();
            const createSubplebbitOptions = {
                address: subplebbitAddress
            };
            const subplebbit = new Subplebbit(createSubplebbitOptions);
            subplebbit.title = subplebbit.address + ' title';
            const hotSortedPostsCid = subplebbit.address + ' sorted posts cid hot';
            subplebbit.sortedPosts = { hot: subplebbitGetSortedPosts(hotSortedPostsCid, subplebbit) };
            subplebbit.sortedPostsCids = {
                hot: hotSortedPostsCid,
                topAll: subplebbit.address + ' sorted posts cid topAll',
                new: subplebbit.address + ' sorted posts cid new'
            };
            // mock properties of subplebbitToGet unto the subplebbit instance
            for (const prop in this.subplebbitToGet(subplebbit)) {
                subplebbit[prop] = this.subplebbitToGet(subplebbit)[prop];
            }
            return subplebbit;
        });
    }
    // mock this method to get a subplebbit with different title, posts, address, etc
    subplebbitToGet(subplebbit) {
        return {
        // title: 'some title'
        };
    }
    createComment(createCommentOptions) {
        return new Comment(createCommentOptions);
    }
    getComment(commentCid) {
        return __awaiter(this, void 0, void 0, function* () {
            yield simulateLoadingTime();
            const createCommentOptions = Object.assign({ cid: commentCid, ipnsName: commentCid + ' ipns name' }, this.commentToGet());
            return new Comment(createCommentOptions);
        });
    }
    // mock this method to get a comment with different content, timestamp, address, etc
    commentToGet() {
        return {
        // content: 'mock some content'
        // author: {address: 'mock some address'},
        // timestamp: 1234
        };
    }
    createVote() {
        return new Vote();
    }
}
export class Subplebbit extends EventEmitter {
    constructor(createSubplebbitOptions) {
        super();
        this.updateCalledTimes = 0;
        this.updating = false;
        this.address = createSubplebbitOptions === null || createSubplebbitOptions === void 0 ? void 0 : createSubplebbitOptions.address;
    }
    update() {
        this.updateCalledTimes++;
        if (this.updateCalledTimes > 1) {
            throw Error('with the current hooks, subplebbit.update() should be called maximum 1 times, this number might change if the hooks change and is only there to catch bugs, the real comment.update() can be called infinite times');
        }
        // is ipnsName is known, look for updates and emit updates immediately after creation
        if (!this.address) {
            throw Error(`can't update without subplebbit.address`);
        }
        // don't update twice
        if (this.updating) {
            return;
        }
        this.updating = true;
        simulateLoadingTime().then(() => {
            this.simulateUpdateEvent();
        });
    }
    simulateUpdateEvent() {
        this.description = this.address + ' description updated';
        this.emit('update', this);
    }
    getSortedPosts(sortedPostsCid) {
        return __awaiter(this, void 0, void 0, function* () {
            // need to wait twice otherwise react renders too fast and fetches too many pages in advance
            yield simulateLoadingTime();
            return subplebbitGetSortedPosts(sortedPostsCid, this);
        });
    }
}
// define it here because also used it plebbit.getSubplebbit()
const subplebbitGetSortedPosts = (sortedPostsCid, subplebbit) => {
    const sortedComments = {
        nextSortedCommentsCid: subplebbit.address + ' ' + sortedPostsCid + ' - next sorted comments cid',
        comments: []
    };
    const postCount = 100;
    let index = 0;
    while (index++ < postCount) {
        sortedComments.comments.push({
            timestamp: index,
            cid: sortedPostsCid + ' comment cid ' + index,
            subplebbitAddress: subplebbit.address,
            upvoteCount: index,
            downvoteCount: 10
        });
    }
    return sortedComments;
};
let challengeRequestCount = 0;
let challengeAnswerCount = 0;
class Publication extends EventEmitter {
    constructor() {
        super(...arguments);
        this.challengeRequestId = `r${++challengeRequestCount}`;
        this.challengeAnswerId = `a${++challengeAnswerCount}`;
    }
    publish() {
        return __awaiter(this, void 0, void 0, function* () {
            yield simulateLoadingTime();
            this.simulateChallengeEvent();
        });
    }
    simulateChallengeEvent() {
        const challenge = { type: 'text', challenge: '2+2=?' };
        const challengeMessage = {
            type: 'CHALLENGE',
            challengeRequestId: this.challengeRequestId,
            challenges: [challenge],
        };
        this.emit('challenge', challengeMessage, this);
    }
    publishChallengeAnswers(challengeAnswers) {
        return __awaiter(this, void 0, void 0, function* () {
            yield simulateLoadingTime();
            this.simulateChallengeVerificationEvent();
        });
    }
    simulateChallengeVerificationEvent() {
        // if publication has content, create cid for this content and add it to comment and challengeVerificationMessage
        this.cid = this.content && `${this.content} cid`;
        const publication = this.cid && { cid: this.cid };
        const challengeVerificationMessage = {
            type: 'CHALLENGEVERIFICATION',
            challengeRequestId: this.challengeRequestId,
            challengeAnswerId: this.challengeAnswerId,
            challengeAnswerIsVerified: true,
            publication,
        };
        this.emit('challengeverification', challengeVerificationMessage, this);
    }
}
export class Comment extends Publication {
    constructor(createCommentOptions) {
        super();
        this.updateCalledTimes = 0;
        this.updating = false;
        this.ipnsName = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.ipnsName;
        this.cid = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.cid;
        this.upvoteCount = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.upvoteCount;
        this.downvoteCount = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.downvoteCount;
        this.content = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.content;
        this.author = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.author;
        this.timestamp = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.timestamp;
        this.parentCommentCid = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.parentCommentCid;
    }
    update() {
        this.updateCalledTimes++;
        if (this.updateCalledTimes > 2) {
            throw Error('with the current hooks, comment.update() should be called maximum 2 times, this number might change if the hooks change and is only there to catch bugs, the real comment.update() can be called infinite times');
        }
        // is ipnsName is known, look for updates and emit updates immediately after creation
        if (!this.ipnsName) {
            throw Error(`can't update without comment.ipnsName`);
        }
        // don't update twice
        if (this.updating) {
            return;
        }
        this.updating = true;
        simulateLoadingTime().then(() => {
            this.simulateUpdateEvent();
        });
    }
    simulateUpdateEvent() {
        // simulate finding vote counts on an IPNS record
        this.upvoteCount = typeof this.upvoteCount === 'number' ? this.upvoteCount + 2 : 3;
        this.downvoteCount = typeof this.downvoteCount === 'number' ? this.downvoteCount + 1 : 1;
        this.emit('update', this);
    }
}
export class Vote extends Publication {
}
export default function () {
    return new Plebbit();
}
