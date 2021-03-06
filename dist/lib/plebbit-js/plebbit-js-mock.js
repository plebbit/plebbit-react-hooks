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
// TODO: make load time changeable with env variable
// so the frontend can test with latency
const loadingTime = 10;
export const simulateLoadingTime = () => new Promise((r) => setTimeout(r, loadingTime));
// array of subplebbit addresses probably created by the user
const createdSubplebbitAddresses = [];
export class Plebbit {
    createSigner() {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                privateKey: 'private key',
                address: 'address',
            };
        });
    }
    createSubplebbit(createSubplebbitOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!createSubplebbitOptions) {
                createSubplebbitOptions = {};
            }
            if (!createSubplebbitOptions.address) {
                createSubplebbitOptions = Object.assign(Object.assign({}, createSubplebbitOptions), { address: 'created subplebbit address' });
                createdSubplebbitAddresses.push('created subplebbit address');
            }
            return new Subplebbit(createSubplebbitOptions);
        });
    }
    getSubplebbit(subplebbitAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            yield simulateLoadingTime();
            const createSubplebbitOptions = {
                address: subplebbitAddress,
            };
            const subplebbit = new Subplebbit(createSubplebbitOptions);
            subplebbit.title = subplebbit.address + ' title';
            const hotPageCid = subplebbit.address + ' page cid hot';
            subplebbit.posts.pages.hot = getCommentsPage(hotPageCid, subplebbit);
            subplebbit.posts.pageCids = {
                hot: hotPageCid,
                topAll: subplebbit.address + ' page cid topAll',
                new: subplebbit.address + ' page cid new',
            };
            return subplebbit;
        });
    }
    listSubplebbits() {
        return __awaiter(this, void 0, void 0, function* () {
            return [...new Set(['list subplebbit address 1', 'list subplebbit address 2', ...createdSubplebbitAddresses])];
        });
    }
    createComment(createCommentOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Comment(createCommentOptions);
        });
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
        return __awaiter(this, void 0, void 0, function* () {
            return new Vote();
        });
    }
    createCommentEdit(createCommentEditOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            return new CommentEdit(createCommentEditOptions);
        });
    }
    createSubplebbitEdit(createSubplebbitEditOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            return new SubplebbitEdit(createSubplebbitEditOptions);
        });
    }
}
export class Pages {
    constructor(pagesOptions) {
        this.pageCids = {};
        this.pages = {};
        Object.defineProperty(this, 'subplebbit', { value: pagesOptions === null || pagesOptions === void 0 ? void 0 : pagesOptions.subplebbit, enumerable: false });
        Object.defineProperty(this, 'comment', { value: pagesOptions === null || pagesOptions === void 0 ? void 0 : pagesOptions.comment, enumerable: false });
    }
    getPage(pageCid) {
        return __awaiter(this, void 0, void 0, function* () {
            // need to wait twice otherwise react renders too fast and fetches too many pages in advance
            yield simulateLoadingTime();
            return getCommentsPage(pageCid, this.subplebbit);
        });
    }
}
export class Subplebbit extends EventEmitter {
    constructor(createSubplebbitOptions) {
        super();
        this.updateCalledTimes = 0;
        this.updating = false;
        this.address = createSubplebbitOptions === null || createSubplebbitOptions === void 0 ? void 0 : createSubplebbitOptions.address;
        this.posts = new Pages({ subplebbit: this });
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
    // use getting to easily mock it
    get roles() {
        return this.rolesToGet();
    }
    // mock this method to get different roles
    rolesToGet() {
        return {};
    }
    edit(editSubplebbitOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const prop in editSubplebbitOptions) {
                if (editSubplebbitOptions[prop]) {
                    // @ts-ignore
                    this[prop] = editSubplebbitOptions[prop];
                }
            }
        });
    }
}
// make roles enumarable so it acts like a regular prop
Object.defineProperty(Subplebbit.prototype, 'roles', { enumerable: true });
// define it here because also used it plebbit.getSubplebbit()
const getCommentsPage = (pageCid, subplebbit) => {
    const page = {
        nextCid: subplebbit.address + ' ' + pageCid + ' - next page cid',
        comments: [],
    };
    const postCount = 100;
    let index = 0;
    while (index++ < postCount) {
        page.comments.push({
            timestamp: index,
            cid: pageCid + ' comment cid ' + index,
            subplebbitAddress: subplebbit.address,
            upvoteCount: index,
            downvoteCount: 10,
            author: {
                address: pageCid + ' author address ' + index,
            },
        });
    }
    return page;
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
            challengeSuccess: true,
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
        this.parentCid = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.parentCid;
        this.replies = new Pages({ comment: this });
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
export class CommentEdit extends Publication {
}
export class SubplebbitEdit extends Publication {
}
export default function () {
    return __awaiter(this, void 0, void 0, function* () {
        return new Plebbit();
    });
}
