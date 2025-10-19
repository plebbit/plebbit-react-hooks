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
const loadingTime = 10;
export const simulateLoadingTime = () => new Promise((r) => setTimeout(r, loadingTime));
// keep a list of created and edited owner subplebbits
// to reinitialize them with plebbit.createSubplebbit()
let createdOwnerSubplebbits = {};
let editedOwnerSubplebbits = {};
// reset the plebbit-js global state in between tests
export const resetPlebbitJsMock = () => {
    createdOwnerSubplebbits = {};
    editedOwnerSubplebbits = {};
};
export const debugPlebbitJsMock = () => {
    console.log({ createdOwnerSubplebbits, editedOwnerSubplebbits });
};
export class Plebbit extends EventEmitter {
    constructor() {
        super(...arguments);
        this.clients = {
            plebbitRpcClients: {
                'http://localhost:9138': new PlebbitRpcClient(),
            },
        };
    }
    resolveAuthorAddress(authorAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            return 'resolved author address';
        });
    }
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
            // no address provided so probably a user creating an owner subplebbit
            if (!createSubplebbitOptions.address && !createdOwnerSubplebbits[createSubplebbitOptions.address]) {
                createSubplebbitOptions = Object.assign(Object.assign({}, createSubplebbitOptions), { address: 'created subplebbit address' });
                // createdSubplebbitAddresses.push('created subplebbit address')
                createdOwnerSubplebbits[createSubplebbitOptions.address] = Object.assign({}, createSubplebbitOptions);
            }
            // only address provided, so could be a previously created owner subplebbit
            // add props from previously created sub
            else if (createdOwnerSubplebbits[createSubplebbitOptions.address] && JSON.stringify(Object.keys(createSubplebbitOptions)) === '["address"]') {
                for (const prop in createdOwnerSubplebbits[createSubplebbitOptions.address]) {
                    if (createdOwnerSubplebbits[createSubplebbitOptions.address][prop]) {
                        createSubplebbitOptions[prop] = createdOwnerSubplebbits[createSubplebbitOptions.address][prop];
                    }
                }
            }
            // add edited props if owner subplebbit was edited in the past
            if (editedOwnerSubplebbits[createSubplebbitOptions.address]) {
                for (const prop in editedOwnerSubplebbits[createSubplebbitOptions.address]) {
                    if (editedOwnerSubplebbits[createSubplebbitOptions.address][prop]) {
                        createSubplebbitOptions[prop] = editedOwnerSubplebbits[createSubplebbitOptions.address][prop];
                    }
                }
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
            subplebbit.posts.pages.hot = subplebbit.posts.pageToGet(hotPageCid);
            subplebbit.posts.pageCids = {
                hot: hotPageCid,
                topAll: subplebbit.address + ' page cid topAll',
                new: subplebbit.address + ' page cid new',
                active: subplebbit.address + ' page cid active',
            };
            subplebbit.modQueue.pageCids = {
                pendingApproval: subplebbit.address + ' page cid pendingApproval',
            };
            return subplebbit;
        });
    }
    // TODO: implement event subplebbitschange
    get subplebbits() {
        return [...new Set(['list subplebbit address 1', 'list subplebbit address 2', ...Object.keys(createdOwnerSubplebbits)])];
    }
    createComment(createCommentOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Comment(createCommentOptions);
        });
    }
    getComment(commentCid) {
        return __awaiter(this, void 0, void 0, function* () {
            yield simulateLoadingTime();
            const createCommentOptions = Object.assign({ cid: commentCid, 
                // useComment() requires timestamp or will use account comment instead of comment from store
                timestamp: 1670000000 }, this.commentToGet(commentCid));
            return new Comment(createCommentOptions);
        });
    }
    // mock this method to get a comment with different content, timestamp, address, etc
    commentToGet(commentCid) {
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
    createCommentModeration(createCommentModerationOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            return new CommentModeration(createCommentModerationOptions);
        });
    }
    createSubplebbitEdit(createSubplebbitEditOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            return new SubplebbitEdit(createSubplebbitEditOptions);
        });
    }
    fetchCid(cid) {
        return __awaiter(this, void 0, void 0, function* () {
            if (cid === null || cid === void 0 ? void 0 : cid.startsWith('statscid')) {
                return JSON.stringify({ hourActiveUserCount: 1 });
            }
            throw Error(`plebbit.fetchCid not implemented in plebbit-js mock for cid '${cid}'`);
        });
    }
    pubsubSubscribe(subplebbitAddress) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    pubsubUnsubscribe(subplebbitAddress) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    validateComment(comment, validateCommentOptions) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}
class PlebbitRpcClient extends EventEmitter {
    constructor() {
        super();
        this.state = 'connecting';
        this.settings = undefined;
        // simulate connecting to the rpc
        setTimeout(() => {
            this.state = 'connected';
            this.settings = { challenges: {} };
            this.emit('statechange', this.state);
            this.emit('settingschange', this.settings);
        }, 10);
    }
    setSettings(settings) {
        return __awaiter(this, void 0, void 0, function* () {
            this.settings = settings;
            this.emit('settingschange', this.settings);
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
            return this.pageToGet(pageCid);
        });
    }
    validatePage(page) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    // mock this method to get pages with different content, or use to getPage without simulated loading time
    pageToGet(pageCid) {
        var _a, _b;
        const subplebbitAddress = ((_a = this.subplebbit) === null || _a === void 0 ? void 0 : _a.address) || ((_b = this.comment) === null || _b === void 0 ? void 0 : _b.subplebbitAddress);
        const page = {
            nextCid: subplebbitAddress + ' ' + pageCid + ' - next page cid',
            comments: [],
        };
        const postCount = 100;
        let index = 0;
        while (index++ < postCount) {
            page.comments.push({
                timestamp: index,
                cid: pageCid + ' comment cid ' + index,
                subplebbitAddress,
                upvoteCount: index,
                downvoteCount: 10,
                author: {
                    address: pageCid + ' author address ' + index,
                },
                updatedAt: index,
            });
        }
        return page;
    }
}
export class Subplebbit extends EventEmitter {
    constructor(createSubplebbitOptions) {
        var _a, _b, _c, _d, _e, _f;
        super();
        this.updateCalledTimes = 0;
        this.updating = false;
        this.firstUpdate = true;
        this.address = createSubplebbitOptions === null || createSubplebbitOptions === void 0 ? void 0 : createSubplebbitOptions.address;
        this.title = createSubplebbitOptions === null || createSubplebbitOptions === void 0 ? void 0 : createSubplebbitOptions.title;
        this.description = createSubplebbitOptions === null || createSubplebbitOptions === void 0 ? void 0 : createSubplebbitOptions.description;
        this.statsCid = 'statscid';
        this.state = 'stopped';
        this.updatingState = 'stopped';
        this.updatedAt = createSubplebbitOptions === null || createSubplebbitOptions === void 0 ? void 0 : createSubplebbitOptions.updatedAt;
        this.posts = new Pages({ subplebbit: this });
        // add subplebbit.posts from createSubplebbitOptions
        if ((_a = createSubplebbitOptions === null || createSubplebbitOptions === void 0 ? void 0 : createSubplebbitOptions.posts) === null || _a === void 0 ? void 0 : _a.pages) {
            this.posts.pages = (_b = createSubplebbitOptions === null || createSubplebbitOptions === void 0 ? void 0 : createSubplebbitOptions.posts) === null || _b === void 0 ? void 0 : _b.pages;
        }
        if ((_c = createSubplebbitOptions === null || createSubplebbitOptions === void 0 ? void 0 : createSubplebbitOptions.posts) === null || _c === void 0 ? void 0 : _c.pageCids) {
            this.posts.pageCids = (_d = createSubplebbitOptions === null || createSubplebbitOptions === void 0 ? void 0 : createSubplebbitOptions.posts) === null || _d === void 0 ? void 0 : _d.pageCids;
        }
        this.modQueue = new Pages({ subplebbit: this });
        // add subplebbit.modQueue from createSubplebbitOptions
        if ((_e = createSubplebbitOptions === null || createSubplebbitOptions === void 0 ? void 0 : createSubplebbitOptions.modQueue) === null || _e === void 0 ? void 0 : _e.pageCids) {
            this.modQueue.pageCids = (_f = createSubplebbitOptions === null || createSubplebbitOptions === void 0 ? void 0 : createSubplebbitOptions.modQueue) === null || _f === void 0 ? void 0 : _f.pageCids;
        }
        // only trigger a first update if argument is only ({address})
        if (!(createSubplebbitOptions === null || createSubplebbitOptions === void 0 ? void 0 : createSubplebbitOptions.address) || Object.keys(createSubplebbitOptions).length !== 1) {
            this.firstUpdate = false;
        }
    }
    update() {
        return __awaiter(this, void 0, void 0, function* () {
            this.updateCalledTimes++;
            if (this.updateCalledTimes > 1) {
                throw Error('with the current hooks, subplebbit.update() should be called maximum 1 times, this number might change if the hooks change and is only there to catch bugs, the real comment.update() can be called infinite times');
            }
            if (!this.address) {
                throw Error(`can't update without subplebbit.address`);
            }
            // don't update twice
            if (this.updating) {
                return;
            }
            this.updating = true;
            this.state = 'updating';
            this.updatingState = 'fetching-ipns';
            this.emit('statechange', 'updating');
            this.emit('updatingstatechange', 'fetching-ipns');
            simulateLoadingTime().then(() => {
                this.simulateUpdateEvent();
            });
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.address) {
                delete createdOwnerSubplebbits[this.address];
                delete editedOwnerSubplebbits[this.address];
            }
        });
    }
    simulateUpdateEvent() {
        if (this.firstUpdate) {
            this.simulateFirstUpdateEvent();
            return;
        }
        this.description = this.address + ' description updated';
        // @ts-ignore
        this.updatedAt = this.updatedAt + 1;
        this.updatingState = 'succeeded';
        this.emit('update', this);
        this.emit('updatingstatechange', 'succeeded');
    }
    // the first update event adds all the field from getSubplebbit
    simulateFirstUpdateEvent() {
        return __awaiter(this, void 0, void 0, function* () {
            this.firstUpdate = false;
            this.updatedAt = Math.floor(Date.now() / 1000);
            this.title = this.address + ' title';
            const hotPageCid = this.address + ' page cid hot';
            this.posts.pages.hot = this.posts.pageToGet(hotPageCid);
            this.posts.pageCids = {
                hot: hotPageCid,
                topAll: this.address + ' page cid topAll',
                new: this.address + ' page cid new',
                active: this.address + ' page cid active',
            };
            this.modQueue.pageCids = {
                pendingApproval: this.address + ' page cid pendingApproval',
            };
            // simulate the ipns update
            this.updatingState = 'succeeded';
            this.emit('update', this);
            this.emit('updatingstatechange', 'succeeded');
            // simulate the next update
            this.updatingState = 'fetching-ipns';
            this.emit('updatingstatechange', 'fetching-ipns');
            simulateLoadingTime().then(() => {
                this.simulateUpdateEvent();
            });
        });
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
            if (!this.address || typeof this.address !== 'string') {
                throw Error(`can't subplebbit.edit with no subplebbit.address`);
            }
            const previousAddress = this.address;
            // do subplebbit.edit
            for (const prop in editSubplebbitOptions) {
                if (editSubplebbitOptions[prop]) {
                    // @ts-ignore
                    this[prop] = editSubplebbitOptions[prop];
                }
            }
            // keep a list of edited subplebbits to reinitialize
            // them with plebbit.createSubplebbit()
            editedOwnerSubplebbits[this.address] = {
                address: this.address,
                title: this.title,
                description: this.description,
            };
            // handle change of subplebbit.address
            if (editSubplebbitOptions.address) {
                // apply address change to editedOwnerSubplebbits
                editedOwnerSubplebbits[previousAddress] = {
                    address: this.address,
                    title: this.title,
                    description: this.description,
                };
                delete editedOwnerSubplebbits[previousAddress];
                // apply address change to createdOwnerSubplebbits
                createdOwnerSubplebbits[this.address] = Object.assign(Object.assign({}, createdOwnerSubplebbits[previousAddress]), { address: this.address });
                delete createdOwnerSubplebbits[previousAddress];
            }
        });
    }
}
// make roles enumarable so it acts like a regular prop
Object.defineProperty(Subplebbit.prototype, 'roles', { enumerable: true });
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
            this.state = 'publishing';
            this.publishingState = 'publishing-challenge-request';
            this.emit('statechange', 'publishing');
            this.emit('publishingstatechange', 'publishing-challenge-request');
            yield simulateLoadingTime();
            this.simulateChallengeEvent();
        });
    }
    simulateChallengeEvent() {
        this.publishingState = 'waiting-challenge-answers';
        this.emit('publishingstatechange', 'waiting-challenge-answers');
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
            this.publishingState = 'publishing-challenge-answer';
            this.emit('publishingstatechange', 'publishing-challenge-answer');
            yield simulateLoadingTime();
            this.publishingState = 'waiting-challenge-verification';
            this.emit('publishingstatechange', 'waiting-challenge-verification');
            yield simulateLoadingTime();
            this.simulateChallengeVerificationEvent();
        });
    }
    simulateChallengeVerificationEvent() {
        // if publication has content, create cid for this content and add it to comment and challengeVerificationMessage
        this.cid = this.content && `${this.content} cid`;
        const commentUpdate = this.cid && { cid: this.cid };
        const challengeVerificationMessage = {
            type: 'CHALLENGEVERIFICATION',
            challengeRequestId: this.challengeRequestId,
            challengeAnswerId: this.challengeAnswerId,
            challengeSuccess: true,
            commentUpdate,
        };
        this.emit('challengeverification', challengeVerificationMessage, this);
        this.publishingState = 'succeeded';
        this.emit('publishingstatechange', 'succeeded');
    }
}
export class Comment extends Publication {
    constructor(createCommentOptions) {
        var _a, _b, _c, _d, _e;
        super();
        this.updateCalledTimes = 0;
        this.updating = false;
        this.cid = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.cid;
        this.upvoteCount = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.upvoteCount;
        this.downvoteCount = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.downvoteCount;
        this.content = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.content;
        this.author = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.author;
        this.timestamp = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.timestamp;
        this.parentCid = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.parentCid;
        this.subplebbitAddress = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.subplebbitAddress;
        this.state = 'stopped';
        this.updatingState = 'stopped';
        this.publishingState = 'stopped';
        if ((_a = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.author) === null || _a === void 0 ? void 0 : _a.address) {
            this.author.shortAddress = `short ${createCommentOptions.author.address}`;
        }
        this.replies = new Pages({ comment: this });
        // add comment.replies from createCommentOptions
        if ((_b = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.replies) === null || _b === void 0 ? void 0 : _b.pages) {
            this.replies.pages = (_c = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.replies) === null || _c === void 0 ? void 0 : _c.pages;
        }
        if ((_d = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.replies) === null || _d === void 0 ? void 0 : _d.pageCids) {
            this.replies.pageCids = (_e = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.replies) === null || _e === void 0 ? void 0 : _e.pageCids;
        }
    }
    update() {
        return __awaiter(this, void 0, void 0, function* () {
            this.updateCalledTimes++;
            if (this.updateCalledTimes > 2) {
                throw Error('with the current hooks, comment.update() should be called maximum 2 times, this number might change if the hooks change and is only there to catch bugs, the real comment.update() can be called infinite times');
            }
            // don't update twice
            if (this.updating) {
                return;
            }
            this.updating = true;
            this.state = 'updating';
            this.updatingState = 'fetching-ipfs';
            this.emit('statechange', 'updating');
            this.emit('updatingstatechange', 'fetching-ipfs');
            simulateLoadingTime().then(() => {
                this.simulateUpdateEvent();
            });
        });
    }
    simulateUpdateEvent() {
        // if timestamp isn't defined, simulate fetching the comment ipfs
        if (!this.timestamp) {
            this.simulateFetchCommentIpfsUpdateEvent();
            return;
        }
        // simulate finding vote counts on an IPNS record
        this.upvoteCount = typeof this.upvoteCount === 'number' ? this.upvoteCount + 2 : 3;
        this.downvoteCount = typeof this.downvoteCount === 'number' ? this.downvoteCount + 1 : 1;
        this.updatedAt = Math.floor(Date.now() / 1000);
        this.updatingState = 'succeeded';
        this.emit('update', this);
        this.emit('updatingstatechange', 'succeeded');
    }
    simulateFetchCommentIpfsUpdateEvent() {
        return __awaiter(this, void 0, void 0, function* () {
            // use plebbit.getComment() so mocking Plebbit.prototype.getComment works
            const commentIpfs = yield new Plebbit().getComment(this.cid || '');
            this.content = commentIpfs.content;
            this.author = commentIpfs.author;
            this.timestamp = commentIpfs.timestamp;
            this.parentCid = commentIpfs.parentCid;
            this.subplebbitAddress = commentIpfs.subplebbitAddress;
            // simulate the ipns update
            this.updatingState = 'fetching-update-ipns';
            this.emit('update', this);
            this.emit('updatingstatechange', 'fetching-update-ipns');
            simulateLoadingTime().then(() => {
                this.simulateUpdateEvent();
            });
        });
    }
}
export class Vote extends Publication {
}
export class CommentEdit extends Publication {
}
export class CommentModeration extends Publication {
}
export class SubplebbitEdit extends Publication {
}
const createPlebbit = (...args) => __awaiter(void 0, void 0, void 0, function* () {
    return new Plebbit(...args);
});
createPlebbit.getShortAddress = (address) => {
    if (address.includes('.')) {
        return address;
    }
    return address.substring(2, 14);
};
createPlebbit.getShortCid = (cid) => {
    return cid.substring(2, 14);
};
export default createPlebbit;
