"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Vote = exports.Comment = exports.Subplebbit = exports.Plebbit = void 0;
const events_1 = __importDefault(require("events"));
const crypto_1 = __importDefault(require("crypto"));
const assert_1 = __importDefault(require("assert"));
// changeable with env variable so the frontend can test with different latencies
const loadingTime = Number(process.env.REACT_APP_PLEBBIT_REACT_HOOKS_MOCK_CONTENT_LOADING_TIME || 5000);
const simulateLoadingTime = () => new Promise((r) => setTimeout(r, loadingTime));
const NOW = 1647600000;
const DAY = 60 * 60 * 24;
const commentTitles = [
    `Own a Piece of Digital History- Winamp Is Now Selling Its Original 1.0 Skin as an NFT, Iconic Player “was the go-to music player everybody was using at the beginning of the history of digital music and was instrumental in helping the .mp3 become mainstream”.`,
    'Buyer of "Pepe the Frog" NFT files US$500,000 lawsuit after creator releases identical NFTs for free',
    '$5,100,000,000 Bitcoin Whale enters massive crypto accumulation mode',
    'Two Big Developments in Brave Browser',
    '🤡'
];
const commentContents = [
    `First of all, the sentiment in this sub concerning moons seems very polarized. Some people think they are a genius idea and others think they are making this sub this sub worse because of “moon farming.” which camp are you in? Second, how/where can you sell them. And third, how many upvotes=one moon, some people have so many when I’m sitting here at 17.

**Personally** I think Reddit is ahead of the curve, in a couple years I could easily see every social media platform incorporating their own coin into their interface. Think about it; it costs the company next to nothing, encourages users to spend more time and be more active on the platform, and capitalizes on their existing user base, skipping any need for marketing. From the companies point of view it seems like a no brainer.

Can people think of issues with this approach? For either the company or the consumer, because besides increased levels of spamming I don’t see much downside.`,
    'What kind of messes up world is this. *Even* if they stop you, they would need some sort of seed phrase or private key to your account in order to get the funds.',
    '🤡',
    `So real fast, I'm not a legal person and this isn't legal advice. I'm just sharing what I found out. What is civil forfeiture In the USA basically the cops can take things if the suspect it could of been used in a crime (any crime even if there is no crime going on now or in the area and any evidence). Lets put it this way, in CA there is pot shops that used armor trucks to move their money (which many stores use). Pot shops in CA is legal, but the cops on a regular bases stopped the truck for stupid things like using the turn signal too early. They use civil forfeiture to take the cash. From there in all cases they send the stuff to the gov, and the gov gives the local cops a major amount of the value of the assets. Note in some states this is illegal like NC. But I seen in the past years where federal wants to cause a loophole using DEA to force cops by law to do it. But note if you travel through states with this being legal. Note this is actually is a huge problem in the USA. Even more for unbanked people and homeless. ALL lawyers and all people I talked to in legal/law thinks this is the ultimate forum of government theft, and this should be federally illegal. That the system is proven to be extremely abused just for the reason of bonuses and the ones taking the money keep a ton of it after it went through the system. My question Can the gov force you to unlock your phone in a civil forfeiture? This giving them access to your hot wallets. Can the gov take your crypto in a civil forfeiture since it is on the blockchain? It should be noted that with 2, there is no clear answer to this. Basically it came down to it has to be tested in courts or a law maker needs to make laws clearing this up. NOTE FOR ANY LAW MAKERS THAT WANT TO HELP WHO THEY REPRESENT, AND WANT TO MAKE A BILL TO HELP THEM GET REELECTED. FIX THIS What I found out So can they take your phone or hardware wallet? The answer to this seems to be yes. Can they force you to unlock your phone? The answer to this seems to be not without a warrant. Can they brute force, hack, or do whatever to get in after they taken the device in a civil forfeiture? The answer seems to be yes. Basically, the idea is that when this happens it now becomes gov property. And if the gov wants to break in their own property or wipe their end. There isn't jack you can do to stop them expect remote format the device (seriously look into this. You can do this with most phones.) Are they likely to break into your phone/hardware wallet if they take it? While there isn't really evidence of this happening yet. The likely if it was to happen then yes. The question is, do they know of a 0 day which will allow them to get in, and that answer to this is maybe. Like I've seen videos of people recovering their funds from their hardware wallet through taking apart something like a ledger, hooking up to given things, and doing a few other things. So lets not rule out they will have some way of doing just this. Because it is likely if they take one, then they most likely are taking as many as they see. Can the gov use civil forfeiture to get the crypto itself without going after the phone/hardware wallet? Chances are is no. Like they can't demand for the given crypto since they have no way of knowing the wallet address unless if you show them or after they taken the device. They have to prove in court they suspected x was used in some way with a crime. Not knowing the address prior to rules this out. So basically, don't talk to the legal people without a lawyer and don't give them more info than needed. Note: if they use the law to take the phone or hardware wallet, then they can make a case that maybe the crypto is part of the taking since you have direct control of the crypto using your phone. Therefore the crypto could've also been used in crime in some way in the same way the phone could've been. Basically, it is the argument of can they take the truck and the music CD inside thing. How to handle the situation? Don't talk to the cops about anything you don't have to. Note the laws, but in general if they ask you to get out of the car ask if it is a command. If they say yes, then get out. If they asked for documents, then give it (don't be an idiot, just give it to them even the technical bits you don't need to. You will just PO the cop which can cause problems.) Ask them if you can leave, and that you would like to leave. This indicates you aren't volunteering your stay, and in many states they have to be reasonable about the length of the stop and many cases they won't have enough time to do something stupid. When asked questions you don't have to answer say a lawyer friend told you to not talk to the cops while being questioned or at a stop. Never agree to them searching your car or you without a warrant. Never argue with them on the side of the road, the day for that is in court (meaning if they decided to arrest you, then let them and then wait to fight it in court since it is likely you can get a big paycheck if done right). Never be open about what you have. If they take the item using civil forfeiture, then it is likely any cash will be gone forever since some of these court cases can last for years. But you can and should fight them in court because there is a growing amount of cases which is forcing judges and others to look more into this and treat it more serious. If you can't afford a lawyer to fight, then there is a few groups that you can call depending on if you have military background, extreme poverty, and so on. But to be blunt, the best way to fight this risk is by getting law makers to make civil forfeiture illegal. BTW for people visiting the USA, you could face this problem.`
];
const commentLinks = [
    'https://fortune.com/2022/03/16/bitcoin-200k-price-prediction-crypto-outlook/',
    'https://finance.yahoo.com/news/c2x-announces-25-million-funding-120000728.html',
    'https://finance.yahoo.com/news/adopting-crypto-legal-tender-signify-101309571.html'
];
const subplebbitTitles = [
    'The Ethereum investment community',
    'Cryptography news and discussions',
    'Memes',
    '🤡'
];
const subplebbitDescriptions = [
    'Welcome to /r/EthTrader, a 100% community driven sub. Here you can discuss Ethereum news, memes, investing, trading, miscellaneous market-related subjects and other relevant technology.',
    'Cryptography is the art of creating mathematical assurances for who can do what with data, including but not limited to encryption of messages such that only the key-holder can read it. Cryptography lives at an intersection of math and computer science. This subreddit covers the theory and practice of modern and *strong* cryptography, and it is a technical subreddit focused on the algorithms and implementations of cryptography.',
    'Memes',
    '🤡'
];
const urlSuffixes = [
    '', '', '', '', '', '', '', '', '', '', '',
    '#', '#/', '#?', '?',
    '?query',
    '#hash-value',
    '#hash-value?',
    '#hash-value?query=string',
    '#hash-value?query=string&yes=1',
    '?query=string',
    '?query=string&yes=1'
];
const hash = async (string) => {
    (0, assert_1.default)(string, `cant hash string '${string}'`);
    if (!window.TextEncoder) {
        return crypto_1.default.createHash('sha256').update(string).digest('base64').replace(/[^a-zA-Z0-9]/g, '');
    }
    // @ts-ignore
    const hashBuffer = await crypto_1.default.subtle.digest('SHA-256', new TextEncoder().encode(string));
    // @ts-ignore
    return btoa(String.fromCharCode.apply(null, new Uint8Array(hashBuffer))).replace(/[^a-zA-Z0-9]/g, '');
};
const getNumberBetween = async (min, max, seed) => {
    const number = Number('0.' + parseInt((await hash(seed)).substring(0, 6), 36));
    return Math.floor(number * (max - min + 1) + min);
};
const getArrayItem = async (array, seed) => {
    const index = await getNumberBetween(0, array.length - 1, seed);
    return array[index];
};
const getImageUrl = async (seed) => {
    const imageUrls = [
        'https://filesamples.com/samples/image/bmp/sample_640%C3%97426.bmp',
        'https://brokensite.xyz/images/dog.png',
        // jpg & webp
        `https://picsum.photos/seed/${await getNumberBetween(10, 2000, seed + 1)}/${await getNumberBetween(10, 2000, seed + 2)}/${await getNumberBetween(10, 2000, seed + 3)}.jpg`,
        `https://picsum.photos/seed/${await getNumberBetween(10, 2000, seed + 1)}/${await getNumberBetween(10, 2000, seed + 2)}/${await getNumberBetween(10, 2000, seed + 3)}.webp`,
        'https://samplelib.com/lib/preview/png/sample-bumblebee-400x300.png',
        'https://c.tenor.com/WHs8ooxWJUIAAAAM/really-great-example-right-here-echo-gaming.gif', // gif
    ];
    const imageUrl = await getArrayItem(imageUrls, seed + 'image') + await getArrayItem(urlSuffixes, seed + 'suffix');
    return imageUrl;
};
const getPostContent = async (seed) => {
    const title = await getArrayItem(commentTitles, seed + 'title');
    const isLinkPost = await getArrayItem([true, false], seed + 'islinkpost');
    if (isLinkPost) {
        let link = await getArrayItem(commentLinks, seed + 'link');
        const linkIsImage = await getArrayItem([true, false], seed + 'linkisimage');
        if (linkIsImage) {
            link = await getImageUrl(seed + 'linkimage');
        }
        const hasThumbnail = await getArrayItem([true, true, true, false], seed + 'hasthumbnail');
        if (!linkIsImage && hasThumbnail) {
            const thumbnail = await getImageUrl(seed + 'thumbnail');
            return { title, link, thumbnail };
        }
        return { title, link };
    }
    // else is text post
    const content = await getArrayItem(commentContents, seed + 'content');
    return { title, content };
};
const getReplyContent = async (parentCommentCid, seed) => {
    const content = await getArrayItem(commentContents, seed + 'replycontent');
    return { content, parentCommentCid };
};
const getSubplebbitContent = async (seed) => {
    const title = await getArrayItem([undefined, ...subplebbitTitles], seed + 'title');
    const description = await getArrayItem([undefined, ...subplebbitDescriptions], seed + 'description');
    if (!title && !description) {
        return {};
    }
    if (!description) {
        return { title };
    }
    if (!title) {
        return description;
    }
};
const getCommentUpdateContent = async (comment) => {
    const upvotesPerUpdate = await getNumberBetween(1, 1000, comment.cid + 'upvoteupdate');
    const downvotesPerUpdate = await getNumberBetween(1, 1000, comment.cid + 'downvoteupdate');
    const commentUpdateContent = {};
    // simulate finding vote counts on an IPNS record
    commentUpdateContent.upvoteCount = typeof comment.upvoteCount === 'number' ? comment.upvoteCount + upvotesPerUpdate : upvotesPerUpdate;
    commentUpdateContent.downvoteCount = typeof comment.downvoteCount === 'number' ? comment.downvoteCount + downvotesPerUpdate : downvotesPerUpdate;
    // simulate finding replies from IPNS record
    commentUpdateContent.sortedReplies = {
        topAll: {
            nextSortedCommentsCid: null,
            comments: [
                await getReplyContent(comment.cid, comment.cid + 'replycontent1'),
                await getReplyContent(comment.cid, comment.cid + 'replycontent2'),
                await getReplyContent(comment.cid, comment.cid + 'replycontent3'),
                await getReplyContent(comment.cid, comment.cid + 'replycontent4'),
                await getReplyContent(comment.cid, comment.cid + 'replycontent5')
            ]
        }
    };
    commentUpdateContent.replyCount = 5;
    return commentUpdateContent;
};
const subplebbitGetSortedPosts = async (sortedPostsCid, subplebbit) => {
    const sortedComments = {
        nextSortedCommentsCid: await hash(sortedPostsCid + 'next'),
        comments: []
    };
    const postCount = 100;
    let index = 0;
    while (index++ < postCount) {
        let comment = {
            timestamp: await getNumberBetween(NOW - DAY * 30, NOW, sortedPostsCid + index),
            cid: await hash(sortedPostsCid + index),
            subplebbitAddress: subplebbit.address
        };
        comment = Object.assign(Object.assign(Object.assign({}, comment), (await getPostContent(comment.cid))), (await getCommentUpdateContent(comment)));
        sortedComments.comments.push(comment);
    }
    return sortedComments;
};
class Plebbit {
    createSubplebbit(createSubplebbitOptions) {
        return new Subplebbit(createSubplebbitOptions);
    }
    async getSubplebbit(subplebbitAddress) {
        await simulateLoadingTime();
        const createSubplebbitOptions = {
            address: subplebbitAddress
        };
        const subplebbit = new Subplebbit(createSubplebbitOptions);
        const hotSortedPostsCid = await hash(subplebbitAddress + 'hot1');
        subplebbit.sortedPosts = { hot: await subplebbitGetSortedPosts(hotSortedPostsCid, subplebbit) };
        subplebbit.sortedPostsCids = {
            hot: await hash(subplebbitAddress + 'hot1'),
            topAll: await hash(subplebbitAddress + 'topAll1'),
            new: await hash(subplebbitAddress + 'new1')
        };
        const subplebbitContent = await getSubplebbitContent(subplebbitAddress);
        // add extra props
        for (const prop in subplebbitContent) {
            subplebbit[prop] = subplebbitContent[prop];
        }
        return subplebbit;
    }
    createComment(createCommentOptions) {
        return new Comment(createCommentOptions);
    }
    async getComment(commentCid) {
        await simulateLoadingTime();
        let commentContent = await getPostContent(commentCid + 'postcontent');
        const isReply = await getArrayItem([true, false, false, false], commentCid + 'isreply');
        if (isReply) {
            const parentCommentCid = await hash(commentCid + 'parentcid');
            commentContent = await getReplyContent(parentCommentCid, commentCid + 'replycontent');
        }
        const createCommentOptions = Object.assign({ cid: commentCid, ipnsName: await hash(commentCid + 'ipns name'), timestamp: await getNumberBetween(NOW - DAY * 30, NOW, commentCid + 'timestamp'), subplebbitAddress: 'memes.eth' }, commentContent);
        const comment = new Comment(createCommentOptions);
        // add missing props from createCommentOptions
        for (const prop in createCommentOptions) {
            // @ts-ignore
            comment[prop] = createCommentOptions[prop];
        }
        return comment;
    }
    createVote() {
        return new Vote();
    }
}
exports.Plebbit = Plebbit;
class Subplebbit extends events_1.default {
    constructor(createSubplebbitOptions) {
        super();
        this.updating = false;
        this.address = createSubplebbitOptions === null || createSubplebbitOptions === void 0 ? void 0 : createSubplebbitOptions.address;
    }
    update() {
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
    async getSortedPosts(sortedPostsCid) {
        // need to wait twice otherwise react renders too fast and fetches too many pages in advance
        await simulateLoadingTime();
        return await subplebbitGetSortedPosts(sortedPostsCid, this);
    }
}
exports.Subplebbit = Subplebbit;
let challengeRequestCount = 0;
let challengeAnswerCount = 0;
class Publication extends events_1.default {
    constructor() {
        super(...arguments);
        this.challengeRequestId = `r${++challengeRequestCount}`;
        this.challengeAnswerId = `a${++challengeAnswerCount}`;
    }
    async publish() {
        await simulateLoadingTime();
        this.simulateChallengeEvent();
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
    async publishChallengeAnswers(challengeAnswers) {
        await simulateLoadingTime();
        this.simulateChallengeVerificationEvent();
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
class Comment extends Publication {
    constructor(createCommentOptions) {
        super();
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
        // is ipnsName is known, look for updates and emit updates immediately after creation
        if (!this.ipnsName) {
            throw Error(`can't update without comment.ipnsName`);
        }
        // don't update twice
        if (this.updating) {
            return;
        }
        this.updating = true;
        (async () => {
            while (true) {
                await simulateLoadingTime();
                this.simulateUpdateEvent();
            }
        })();
    }
    async simulateUpdateEvent() {
        (0, assert_1.default)(this.cid, `invalid comment.cid '${this.cid}' can't simulateUpdateEvent`);
        const commentUpdateContent = await getCommentUpdateContent(this);
        for (const prop in commentUpdateContent) {
            // @ts-ignore
            this[prop] = commentUpdateContent[prop];
        }
        this.emit('update', this);
    }
}
exports.Comment = Comment;
class Vote extends Publication {
}
exports.Vote = Vote;
function default_1() {
    return new Plebbit();
}
exports.default = default_1;
