var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import markdownExample from './fixtures/markdown-example';
import EventEmitter from 'events';
import assert from 'assert';
// changeable with env variable so the frontend can test with different latencies
const loadingTime = Number(process.env.REACT_APP_PLEBBIT_REACT_HOOKS_MOCK_CONTENT_LOADING_TIME || 100);
const simulateLoadingTime = () => new Promise((r) => setTimeout(r, loadingTime));
const NOW = 1647600000;
const DAY = 60 * 60 * 24;
// TODO: should delete this eventually to reduce npm package size
let captchaImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAJYAAAAyCAMAAACJUtIoAAAAY1BMVEX////y8vLm5ub39/fr7Ozf39/a29u/6c256MjV8N7v+fL0+/bU1dXO7tnp9+7e8+TJ7NTOzs7E69Gt5L+I26ag4bfk9en3/fmS3Kyo4rx42J2Z37LI38/AwMDR5tip1Li+1cUdWDCzAAAEkElEQVRYw+1Y6ZKjIBBuGuTyPqKZHLP7/k+5KrhIUEwms1X7Y76pMYVg23x9IvzgZfQN/I/QXavhP0SXyh6+AdQbEYS3UJ1TkC/zlbDxEtOD7Q8JnQRMFxYzooL0A46APhlZEizw71A2X+kyu5pBHC8JMUJ3ITqpu0O6GPqbRU8l3CM1CdnCjC0a8Yil80pdLinEMXBc5BMCuwaMUejYimzHoZSgzzJ90oaY8HCW7BmD0ug9QmAXxWlULW9yM+IbgqyHUjJJsuZYyWZu6xEwc3keaqTqCoUJx5puCx1vo1GAWPUf1GI8CRhk6IZZQM8RdCu6HiBvlgCCjaetWhZYo28JkvmvpBO/iD5bNLBFHPnsW1oq7mQGoGSlosdqYB+bARiDb4H6NRiZ6AkM+SdG8Vf9BckXK6RQxsVrStF3etxx5Vf8BdGLlBfQS233xXx6SODRHm9oh6HeSLcyScJejIAmn0mgFMoEvWISS+wZcT8ecPpngVrInmPMLdGymKvSubv9TVLM5gVzY8ObOVt+aIJe0kRqdHPp5wVDUveIyRVQFvKTgI1rV6LjIIDJlCsy3IoXDiEyElUrI7UbpbI05jRVjK2oPwJmWcLgzk0W3u/Jnt8p8UplMZLGs0DaEdgcLEiMX3tlHHcKSHQeWIZr71aikfWdvdOoIkdMVtGM0QxG79v2rDPf96vLZ2j5/c33Hyp4EyO46UbJhulIzR55JOSv5zC27DftVFvs2/yxAKVdc833wps9MJBs+A4NWk/3GJ34tQ91AyhRPHeoYAnvAPKT3qE2XpFqujVh5lzcWSHXG7KIYo9qXfTUvqU7mWMPSW3UigO5YzXlk4LPKKYrKcWlVRrKFg4RngQyAnEkuC6opqDFFUuVEGriSKoiF+KSD48+ovTDzr36QP1WarclQPBhFbMFRxt9zfaGUohKr6spVB/NeK9fc9OdWzW4Vsz3SqSmPfsK+NRcm/iXp/EX61FO34im91Sfr+3E4OcvISxJjJ3Up7z+FcXhDYS009+zKZWsTnnye6SkBA/WrfL5yjiAzsW4KAX4uAWd29tAuiQDnH2saNP8apzJZEzqKukp78tz5XVCfSVkdzOLLHnBoeor4HSdqKpWXiq918SneXv+NQStwulyFv2R+GNEtkMR2ip1mShoE5DMqcjDR6mbk5B58RBcizHCCvlqX0ZwDLWT1IAJCfdpKxglj2oZ32ukKNdFp1DDs0ffY5QSegW0RrZLMIRqWfGlkJVeeC26czMNCI00Wc5PWRL7mpCezS2vC6Cx7VVnWawdUEqFprjz26l85qOKVSvqYH45DuMrnKG31q+Vn0I2o6YdRxi2zjCIkQO0I9FbpfX+p6wQDGcy9eB9nmCQKgmncpee0KoB8LhvHuhO2xM6Dnd32ms+uIS9xp0cbpvgYfBiQDh/KK585TdkWSSr6qpgA/SehQY8BllUQePfPFjACa53SO7rjo5YCqoKoBgng+xHMoQvIJtOJJMkNPI43fIGut0H0toOmJJLQDF4C+6d098XwZcn+9ZmsO9SC96Bc5TUSvvBD/49/gDEMCEP8TccuAAAAABJRU5ErkJggg==';
const commentTitles = [
    `Own a Piece of Digital History- Winamp Is Now Selling Its Original 1.0 Skin as an NFT, Iconic Player ???was the go-to music player everybody was using at the beginning of the history of digital music and was instrumental in helping the .mp3 become mainstream???.`,
    'Buyer of "Pepe the Frog" NFT files US$500,000 lawsuit after creator releases identical NFTs for free',
    '$5,100,000,000 Bitcoin Whale enters massive crypto accumulation mode',
    'Two Big Developments in Brave Browser',
    '????',
];
const commentContents = [
    `First of all, the sentiment in this sub concerning moons seems very polarized. Some people think they are a genius idea and others think they are making this sub this sub worse because of ???moon farming.??? which camp are you in? Second, how/where can you sell them. And third, how many upvotes=one moon, some people have so many when I???m sitting here at 17.

**Personally** I think Reddit is ahead of the curve, in a couple years I could easily see every social media platform incorporating their own coin into their interface. Think about it; it costs the company next to nothing, encourages users to spend more time and be more active on the platform, and capitalizes on their existing user base, skipping any need for marketing. From the companies point of view it seems like a no brainer.

Can people think of issues with this approach? For either the company or the consumer, because besides increased levels of spamming I don???t see much downside.`,
    'What kind of messes up world is this. *Even* if they stop you, they would need some sort of seed phrase or private key to your account in order to get the funds.',
    '????',
    `So real fast, I'm not a legal person and this isn't legal advice. I'm just sharing what I found out. What is civil forfeiture In the USA basically the cops can take things if the suspect it could of been used in a crime (any crime even if there is no crime going on now or in the area and any evidence). Lets put it this way, in CA there is pot shops that used armor trucks to move their money (which many stores use). Pot shops in CA is legal, but the cops on a regular bases stopped the truck for stupid things like using the turn signal too early. They use civil forfeiture to take the cash. From there in all cases they send the stuff to the gov, and the gov gives the local cops a major amount of the value of the assets. Note in some states this is illegal like NC. But I seen in the past years where federal wants to cause a loophole using DEA to force cops by law to do it. But note if you travel through states with this being legal. Note this is actually is a huge problem in the USA. Even more for unbanked people and homeless. ALL lawyers and all people I talked to in legal/law thinks this is the ultimate forum of government theft, and this should be federally illegal. That the system is proven to be extremely abused just for the reason of bonuses and the ones taking the money keep a ton of it after it went through the system. My question Can the gov force you to unlock your phone in a civil forfeiture? This giving them access to your hot wallets. Can the gov take your crypto in a civil forfeiture since it is on the blockchain? It should be noted that with 2, there is no clear answer to this. Basically it came down to it has to be tested in courts or a law maker needs to make laws clearing this up. NOTE FOR ANY LAW MAKERS THAT WANT TO HELP WHO THEY REPRESENT, AND WANT TO MAKE A BILL TO HELP THEM GET REELECTED. FIX THIS What I found out So can they take your phone or hardware wallet? The answer to this seems to be yes. Can they force you to unlock your phone? The answer to this seems to be not without a warrant. Can they brute force, hack, or do whatever to get in after they taken the device in a civil forfeiture? The answer seems to be yes. Basically, the idea is that when this happens it now becomes gov property. And if the gov wants to break in their own property or wipe their end. There isn't jack you can do to stop them expect remote format the device (seriously look into this. You can do this with most phones.) Are they likely to break into your phone/hardware wallet if they take it? While there isn't really evidence of this happening yet. The likely if it was to happen then yes. The question is, do they know of a 0 day which will allow them to get in, and that answer to this is maybe. Like I've seen videos of people recovering their funds from their hardware wallet through taking apart something like a ledger, hooking up to given things, and doing a few other things. So lets not rule out they will have some way of doing just this. Because it is likely if they take one, then they most likely are taking as many as they see. Can the gov use civil forfeiture to get the crypto itself without going after the phone/hardware wallet? Chances are is no. Like they can't demand for the given crypto since they have no way of knowing the wallet address unless if you show them or after they taken the device. They have to prove in court they suspected x was used in some way with a crime. Not knowing the address prior to rules this out. So basically, don't talk to the legal people without a lawyer and don't give them more info than needed. Note: if they use the law to take the phone or hardware wallet, then they can make a case that maybe the crypto is part of the taking since you have direct control of the crypto using your phone. Therefore the crypto could've also been used in crime in some way in the same way the phone could've been. Basically, it is the argument of can they take the truck and the music CD inside thing. How to handle the situation? Don't talk to the cops about anything you don't have to. Note the laws, but in general if they ask you to get out of the car ask if it is a command. If they say yes, then get out. If they asked for documents, then give it (don't be an idiot, just give it to them even the technical bits you don't need to. You will just PO the cop which can cause problems.) Ask them if you can leave, and that you would like to leave. This indicates you aren't volunteering your stay, and in many states they have to be reasonable about the length of the stop and many cases they won't have enough time to do something stupid. When asked questions you don't have to answer say a lawyer friend told you to not talk to the cops while being questioned or at a stop. Never agree to them searching your car or you without a warrant. Never argue with them on the side of the road, the day for that is in court (meaning if they decided to arrest you, then let them and then wait to fight it in court since it is likely you can get a big paycheck if done right). Never be open about what you have. If they take the item using civil forfeiture, then it is likely any cash will be gone forever since some of these court cases can last for years. But you can and should fight them in court because there is a growing amount of cases which is forcing judges and others to look more into this and treat it more serious. If you can't afford a lawyer to fight, then there is a few groups that you can call depending on if you have military background, extreme poverty, and so on. But to be blunt, the best way to fight this risk is by getting law makers to make civil forfeiture illegal. BTW for people visiting the USA, you could face this problem.`,
    markdownExample,
];
const commentLinks = [
    'https://fortune.com/2022/03/16/bitcoin-200k-price-prediction-crypto-outlook/',
    'https://finance.yahoo.com/news/c2x-announces-25-million-funding-120000728.html',
    'https://finance.yahoo.com/news/adopting-crypto-legal-tender-signify-101309571.html',
];
const subplebbitTitles = ['The Ethereum investment community', 'Cryptography news and discussions', 'Memes', '????'];
const subplebbitDescriptions = [
    'Welcome to /r/EthTrader, a 100% community driven sub. Here you can discuss Ethereum news, memes, investing, trading, miscellaneous market-related subjects and other relevant technology.',
    'Cryptography is the art of creating mathematical assurances for who can do what with data, including but not limited to encryption of messages such that only the key-holder can read it. Cryptography lives at an intersection of math and computer science. This subreddit covers the theory and practice of modern and *strong* cryptography, and it is a technical subreddit focused on the algorithms and implementations of cryptography.',
    'Memes',
    '????',
];
const urlSuffixes = [
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '#',
    '#/',
    '#?',
    '?',
    '?query',
    '#hash-value',
    '#hash-value?',
    '#hash-value?query=string',
    '#hash-value?query=string&yes=1',
    '?query=string',
    '?query=string&yes=1',
];
const firstNames = [
    'james',
    'robert',
    'john',
    'michael',
    'william',
    'david',
    'richard',
    'joseph',
    'thomas',
    'charles',
    'christopher',
    'daniel',
    'matthew',
    'anthony',
    'mark',
    'donald',
    'steven',
    'paul',
    'andrew',
    'joshua',
];
const displayNames = [
    'COVERCADIGMENTS!',
    'Everco__Evidehovi',
    'fermind-flashyte',
    'FlirtyraForeguiGoldhil_',
    'Hanmiddie Headro Herdman',
    'Hurigher Irongmug',
    'Islandvi   Jumbinte',
    'Lackapac Lorvalow',
    'MarsEdgyMedprin',
    'parispn!!!',
    'personna',
    '  popic????',
    'Riderix\n',
    'Romantec__',
    'Sellakuk23',
    '--TickoAim2$',
    'Transia4\t',
    'Trippah+512',
    '????',
    'hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh',
    'aaaaaaaaaa aaaaaaaaaa aaaaaaaaaa aaaaaaaaaa aaaaaaaaaa aaaaaaaaaa aaaaaaaaaa aaaaaaaaaa aaaaaaaaaa aaaaaaaaaa',
];
const postFlairs = [
    { text: 'Analysis' },
    { text: 'ADVICE', textColor: '#000000', backgroundColor: '#252850' },
    { text: 'comedy', textColor: '#FFFFFF', backgroundColor: '#23282B' },
    { text: 'General News' },
    {
        text: 'Probably a scam Probably a scam Probably a scam Probably a scam Probably a scam Probably a scam Probably a scam Probably a scam Probably a scam Probably a scam Probably a scam Probably a scam Probably a scam Probably a scam Probably a scam Probably a scam Probably a scam Probably a scam Probably a scam Probably a scam Probably a scam Probably a scam Probably a scam!!!!!!!!!!!!!!!!!!!!!!',
        textColor: '#FFFFFF',
        backgroundColor: '#5B3A29',
    },
    { text: 'education', textColor: '#000000', backgroundColor: '#4A192C' },
    { text: 'MARKETS', backgroundColor: '#F8F32B' },
    { text: 'IMPORTANT!!!', backgroundColor: '#C35831' },
    {
        text: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        backgroundColor: '#AF2B1E',
    },
    { text: 'MOON ????', backgroundColor: '#D36E70' },
    { text: 'video', backgroundColor: '#924E7D' },
];
const authorFlairs = [
    { text: 'SCAMMER' },
    { text: 'Medical Doctor', textColor: '#000000', backgroundColor: '#252850' },
    { text: 'pro', textColor: '#FFFFFF', backgroundColor: '#23282B' },
    {
        text: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    },
    { text: 'Probably a scammer', textColor: '#FFFFFF', backgroundColor: '#5B3A29' },
    { text: 'loser', textColor: '#000000', backgroundColor: '#4A192C' },
    { text: 'WINNER', backgroundColor: '#F8F32B' },
    { text: 'IMPORTANT VIP!!!', backgroundColor: '#C35831' },
    {
        text: 'BE CAREFUL OF THIS MAN BE CAREFUL OF THIS MAN BE CAREFUL OF THIS MAN BE CAREFUL OF THIS MAN BE CAREFUL OF THIS MAN BE CAREFUL OF THIS MAN BE CAREFUL OF THIS MAN BE CAREFUL OF THIS MAN BE CAREFUL OF THIS MAN BE CAREFUL OF THIS MAN!!!!!!!!!!!!!!!!!!',
        backgroundColor: '#AF2B1E',
    },
    { text: '????', backgroundColor: '#D36E70' },
    { text: 'creator', backgroundColor: '#924E7D' },
];
const reasons = [
    'SPAM',
    'this is spam',
    'repeated spamming',
    'User is a known scammer',
    'NSFW',
    'SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM',
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
];
const hash = (string) => __awaiter(void 0, void 0, void 0, function* () {
    assert(string, `cant hash string '${string}'`);
    // use native crypto module in jsdom
    // @ts-ignore
    // const crypto = require('crypto')
    // return crypto.createHash('sha256').update(string).digest('base64').replace(/[^a-zA-Z0-9]/g, '')
    // @ts-ignore
    const hashBuffer = yield crypto.subtle.digest('SHA-256', new TextEncoder().encode(string));
    // @ts-ignore
    return btoa(String.fromCharCode.apply(null, new Uint8Array(hashBuffer))).replace(/[^a-zA-Z0-9]/g, '');
});
const getNumberBetween = (min, max, seed) => __awaiter(void 0, void 0, void 0, function* () {
    const number = Number('0.' + parseInt((yield hash(seed)).substring(6, 12), 36));
    return Math.floor(number * (max - min + 1) + min);
});
const getArrayItem = (array, seed) => __awaiter(void 0, void 0, void 0, function* () {
    const index = yield getNumberBetween(0, array.length - 1, seed);
    return array[index];
});
const getImageUrl = (seed) => __awaiter(void 0, void 0, void 0, function* () {
    const jpg = `https://picsum.photos/seed/${yield getNumberBetween(10, 2000, seed + 1)}/${yield getNumberBetween(10, 2000, seed + 2)}/${yield getNumberBetween(10, 2000, seed + 3)}.jpg`;
    const webp = `https://picsum.photos/seed/${yield getNumberBetween(10, 2000, seed + 4)}/${yield getNumberBetween(10, 2000, seed + 5)}/${yield getNumberBetween(10, 2000, seed + 6)}.webp`;
    const imageUrls = [
        // jpg & webp
        jpg,
        jpg,
        webp,
        webp,
        'https://samplelib.com/lib/preview/png/sample-bumblebee-400x300.png',
        'https://c.tenor.com/WHs8ooxWJUIAAAAM/really-great-example-right-here-echo-gaming.gif',
        'https://filesamples.com/samples/image/bmp/sample_640%C3%97426.bmp',
        'https://brokensite.xyz/images/dog.png',
        'https://brokensite.xyz/images/dog.jpeg', // broken jpeg
    ];
    const imageUrl = (yield getArrayItem(imageUrls, seed + 'image')) + (yield getArrayItem(urlSuffixes, seed + 'suffix'));
    return imageUrl;
});
const getAuthor = (seed) => __awaiter(void 0, void 0, void 0, function* () {
    const author = {
        address: yield hash(seed + 'author address'),
    };
    const hasEns = yield getArrayItem([true, false, false, false], seed + 'has ens');
    if (hasEns) {
        const text = yield getArrayItem([...firstNames, ...displayNames], seed + 'author ens first name');
        author.address = (text.toLowerCase().replace(/[^a-z0-9]/g, '') || 'john') + '.eth';
    }
    const hasDisplayName = yield getArrayItem([true, true, true, false], seed + 'has display name');
    if (hasDisplayName) {
        author.displayName = yield getArrayItem(displayNames, seed + 'display name');
    }
    const rareTrue = [true, false, false, false, false, false, false, false];
    const hasNftAvatar = yield getArrayItem(rareTrue, seed + 'has nft avatar');
    if (hasNftAvatar) {
        author.avatar = {
            chainTicker: 'eth',
            address: yield getArrayItem([
                '0xed5af388653567af2f388e6224dc7c4b3241c544',
                '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
                '0x60e4d786628fea6478f785a6d7e704777c86a7c6',
                '0x79fcdef22feed20eddacbb2587640e45491b757f',
                '0x0000000000000000000000000000000000000dead',
            ], seed + 'nft avatar address'),
            index: yield getNumberBetween(1, 2000, seed + 'nft avatar index'),
        };
    }
    const hasFlair = yield getArrayItem(rareTrue, seed + 'has author flair');
    if (hasFlair) {
        author.flair = yield getArrayItem(authorFlairs, seed + 'author flair');
    }
    return author;
});
const getPostContent = (seed) => __awaiter(void 0, void 0, void 0, function* () {
    const postContent = {
        depth: 0,
        author: yield getAuthor(seed + 'author'),
        title: yield getArrayItem(commentTitles, seed + 'title'),
    };
    const hasFlair = yield getArrayItem([true, false, false, false], seed + 'has flair');
    if (hasFlair) {
        postContent.flair = yield getArrayItem(postFlairs, seed + 'flair');
    }
    const isLinkPost = yield getArrayItem([true, false], seed + 'islinkpost');
    if (isLinkPost) {
        postContent.link = yield getArrayItem(commentLinks, seed + 'link');
        const linkIsImage = yield getArrayItem([true, false], seed + 'linkisimage');
        if (linkIsImage) {
            postContent.link = yield getImageUrl(seed + 'linkimage');
        }
        const hasThumbnail = yield getArrayItem([true, true, true, false], seed + 'hasthumbnail');
        if (!linkIsImage && hasThumbnail) {
            postContent.thumbnailUrl = yield getImageUrl(seed + 'thumbnail');
        }
    }
    // else is text post
    else {
        postContent.content = yield getArrayItem(commentContents, seed + 'content');
    }
    return postContent;
});
const getReplyContent = (getReplyContentOptions, seed) => __awaiter(void 0, void 0, void 0, function* () {
    const { depth, parentCid, postCid } = getReplyContentOptions;
    const author = yield getAuthor(seed + 'author');
    const content = yield getArrayItem(commentContents, seed + 'replycontent');
    return { content, author, depth, parentCid, postCid };
});
const getSubplebbitContent = (seed) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const subplebbit = {
        pubsubTopic: yield hash(seed + 'pubsub topic'),
        createdAt: yield getNumberBetween(NOW - DAY * 1000, NOW, seed + 'sub created at'),
        updatedAt: yield getNumberBetween(NOW - 60 * 10, NOW, seed + 'sub updated at'),
    };
    const hasChallengeTypes = yield getArrayItem([true, false], seed + 'has challenge types');
    if (hasChallengeTypes) {
        subplebbit.challengeTypes = ['image'];
    }
    const hasRoles = yield getArrayItem([true, false], seed + 'has roles');
    if (hasRoles) {
        subplebbit.roles = {
            [(yield getAuthor(seed + 'mod address 1')).address]: { role: 'owner' },
            [(yield getAuthor(seed + 'mod address 2')).address]: { role: 'admin' },
            [(yield getAuthor(seed + 'mod address 3')).address]: { role: 'moderator' },
            [(yield getAuthor(seed + 'mod address 4')).address]: { role: 'moderator' },
            [(yield getAuthor(seed + 'mod address 5')).address]: { role: 'moderator' },
            [(yield getAuthor(seed + 'mod address 6')).address]: { role: 'moderator' },
            [(yield getAuthor(seed + 'mod address 7')).address]: { role: 'moderator' },
            [(yield getAuthor(seed + 'mod address 8')).address]: { role: 'moderator' },
        };
    }
    const title = yield getArrayItem([undefined, ...subplebbitTitles], seed + 'title');
    if (title) {
        subplebbit.title = title;
    }
    const description = yield getArrayItem([undefined, ...subplebbitDescriptions], seed + 'description');
    if (description) {
        subplebbit.description = description;
    }
    const hasPostFlairs = yield getArrayItem([true, false], seed + 'has post flairs');
    if (hasPostFlairs) {
        subplebbit.flairs = { post: postFlairs };
    }
    const hasAuthorFlairs = yield getArrayItem([true, false], seed + 'has author flairs');
    if (hasAuthorFlairs) {
        subplebbit.flairs = { post: (_a = subplebbit.flairs) === null || _a === void 0 ? void 0 : _a.post, author: authorFlairs };
    }
    const hasSuggested = yield getArrayItem([true, false], seed + 'has suggested');
    if (hasSuggested) {
        subplebbit.suggested = {
            primaryColor: (yield getArrayItem(postFlairs, seed + 'suggested primary color')).backgroundColor,
            secondaryColor: (yield getArrayItem(postFlairs, seed + 'suggested secondary color')).backgroundColor,
            avatarUrl: yield getArrayItem([undefined, yield getImageUrl(seed + 'suggested avatar url')], seed + 'suggested avatar url'),
            bannerUrl: yield getArrayItem([undefined, yield getImageUrl(seed + 'suggested banner url')], seed + 'suggested banner url'),
            backgroundUrl: yield getArrayItem([undefined, yield getImageUrl(seed + 'suggested background url')], seed + 'suggested background url'),
            language: yield getArrayItem([undefined, undefined, 'en', 'en', 'es', 'ru'], seed + 'suggested language'),
        };
    }
    const hasFeatures = yield getArrayItem([true, false], seed + 'has features');
    if (hasFeatures) {
        subplebbit.features = {
            noVideos: yield getArrayItem([undefined, undefined, true, false], seed + 'noVideos'),
            noSpoilers: yield getArrayItem([undefined, undefined, true, false], seed + 'noSpoilers'),
            noImages: yield getArrayItem([undefined, undefined, true, false], seed + 'noImages'),
            noVideoReplies: yield getArrayItem([undefined, undefined, true, false], seed + 'noVideoReplies'),
            noSpoilerReplies: yield getArrayItem([undefined, undefined, true, false], seed + 'noSpoilerReplies'),
            noImageReplies: yield getArrayItem([undefined, undefined, true, false], seed + 'noImageReplies'),
            noPolls: yield getArrayItem([undefined, undefined, true, false], seed + 'noPolls'),
            noCrossposts: yield getArrayItem([undefined, undefined, true, false], seed + 'noCrossposts'),
            noUpvotes: yield getArrayItem([undefined, undefined, true, false], seed + 'noUpvotes'),
            noDownvotes: yield getArrayItem([undefined, undefined, true, false], seed + 'noDownvotes'),
            noAuthors: yield getArrayItem([undefined, undefined, true, false], seed + 'noAuthors'),
            anonymousAuthors: yield getArrayItem([undefined, undefined, true, false], seed + 'anonymousAuthors'),
            noNestedReplies: yield getArrayItem([undefined, undefined, true, false], seed + 'noNestedReplies'),
            safeForWork: yield getArrayItem([undefined, undefined, true, false], seed + 'safeForWork'),
            authorFlairs: yield getArrayItem([undefined, undefined, true, false], seed + 'authorFlairs'),
            requireAuthorFlairs: yield getArrayItem([undefined, undefined, true, false], seed + 'requireAuthorFlairs'),
            postFlairs: yield getArrayItem([undefined, undefined, true, false], seed + 'postFlairs'),
            requirePostFlairs: yield getArrayItem([undefined, undefined, true, false], seed + 'requirePostFlairs'),
            noMarkdownImages: yield getArrayItem([undefined, undefined, true, false], seed + 'noMarkdownImages'),
            noMarkdownVideos: yield getArrayItem([undefined, undefined, true, false], seed + 'noMarkdownVideos'),
            markdownImageReplies: yield getArrayItem([undefined, undefined, true, false], seed + 'markdownImageReplies'),
            markdownVideoReplies: yield getArrayItem([undefined, undefined, true, false], seed + 'markdownVideoReplies'),
        };
    }
    const hasRules = yield getArrayItem([true, false], seed + 'has rules');
    if (hasRules) {
        subplebbit.rules = [
            'no spam',
            'be nice',
            'Do not link to CNN.',
            'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
            'OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO ',
        ];
    }
    return subplebbit;
});
// for debugging slow bulk reply generation
let replyLoopCount = 0;
const getCommentUpdateContent = (comment) => __awaiter(void 0, void 0, void 0, function* () {
    const upvotesPerUpdate = yield getNumberBetween(1, 1000, comment.cid + 'upvoteupdate');
    const downvotesPerUpdate = yield getNumberBetween(1, 1000, comment.cid + 'downvoteupdate');
    const commentUpdateContent = {};
    // simulate finding vote counts on an IPNS record
    commentUpdateContent.upvoteCount = typeof comment.upvoteCount === 'number' ? comment.upvoteCount + upvotesPerUpdate : upvotesPerUpdate;
    commentUpdateContent.downvoteCount = typeof comment.downvoteCount === 'number' ? comment.downvoteCount + downvotesPerUpdate : downvotesPerUpdate;
    // find the number of replies
    commentUpdateContent.replyCount = 0;
    const hasReplies = yield getArrayItem([true, false, false, false], comment.cid + 'has replies');
    if (hasReplies) {
        commentUpdateContent.replyCount = yield getNumberBetween(0, 30, comment.cid + 'reply count');
        if (comment.depth > 0) {
            commentUpdateContent.replyCount = commentUpdateContent.replyCount / Math.pow((comment.depth + 1), 2);
        }
        if (commentUpdateContent.replyCount < 1) {
            commentUpdateContent.replyCount = 0;
        }
        commentUpdateContent.replyCount = Math.round(commentUpdateContent.replyCount);
    }
    // simulate finding replies from IPNS record
    commentUpdateContent.replies = { pages: { topAll: { nextCid: null, comments: [] } } };
    const getReplyContentOptions = { depth: comment.depth + 1, parentCid: comment.cid, postCid: comment.cid };
    let replyCount = commentUpdateContent.replyCount;
    while (replyCount-- > 0) {
        // console.log({replyLoopCount: replyLoopCount++, replyCount: commentUpdateContent.replyCount, depth: comment.depth, cid: comment.cid, index: replyCount})
        const replyContent = yield getReplyContent(getReplyContentOptions, comment.cid + 'reply content' + replyCount);
        const reply = Object.assign({ cid: yield hash(comment.cid + 'reply cid' + replyCount), ipnsName: yield hash(comment.cid + 'reply ipns name' + replyCount), timestamp: yield getNumberBetween(comment.timestamp, NOW, comment.cid + 'reply timestamp' + replyCount), subplebbitAddress: comment.subplebbitAddress || 'memes.eth' }, replyContent);
        const replyUpdateContent = yield getCommentUpdateContent(reply);
        commentUpdateContent.replies.pages.topAll.comments.push(Object.assign(Object.assign({}, reply), replyUpdateContent));
    }
    const rareTrue = [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    const isSpoiler = yield getArrayItem(rareTrue, comment.cid + 'is spoiler');
    if (isSpoiler) {
        commentUpdateContent.spoiler = true;
    }
    const isEdited = yield getArrayItem(rareTrue, comment.cid + 'is edited');
    if (isEdited) {
        commentUpdateContent.editTimestamp = comment.timestamp + 60 * 30;
        commentUpdateContent.content = comment.content + ' WHY DOWNVOTES!?';
    }
    const isDeleted = yield getArrayItem(rareTrue, comment.cid + 'is deleted');
    const isPinned = yield getArrayItem(rareTrue, comment.cid + 'is pinned');
    const isRemoved = yield getArrayItem(rareTrue, comment.cid + 'is removed');
    const isLocked = yield getArrayItem(rareTrue, comment.cid + 'is locked');
    if (isDeleted) {
        commentUpdateContent.deleted = true;
    }
    else if (isPinned) {
        commentUpdateContent.pinned = true;
    }
    else if (isRemoved) {
        commentUpdateContent.removed = true;
        const hasReason = yield getArrayItem([true, false], comment.cid + 'is removed reason');
        if (hasReason) {
            commentUpdateContent.reason = yield getArrayItem(reasons, comment.cid + 'reason removed');
        }
    }
    else if (isLocked && comment.depth === 0) {
        commentUpdateContent.locked = true;
        const hasReason = yield getArrayItem([true, false], comment.cid + 'is locked reason');
        if (hasReason) {
            commentUpdateContent.reason = yield getArrayItem(reasons, comment.cid + 'locked removed');
        }
    }
    return commentUpdateContent;
});
const getCommentsPage = (pageCid, subplebbit) => __awaiter(void 0, void 0, void 0, function* () {
    const page = {
        nextCid: yield hash(pageCid + 'next'),
        comments: [],
    };
    const postCount = 100;
    let index = 0;
    while (index++ < postCount) {
        let comment = {
            timestamp: yield getNumberBetween(NOW - DAY * 30, NOW, pageCid + index),
            cid: yield hash(pageCid + index),
            subplebbitAddress: subplebbit.address,
            depth: 0,
        };
        comment = Object.assign(Object.assign(Object.assign({}, comment), (yield getPostContent(comment.cid))), (yield getCommentUpdateContent(comment)));
        page.comments.push(comment);
    }
    return page;
});
// array of subplebbits probably created by the user
const createdSubplebbits = [];
class Plebbit {
    createSigner() {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                privateKey: 'private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key',
                address: yield hash('address' + Math.random()),
            };
        });
    }
    createSubplebbit(createSubplebbitOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            const signer = yield this.createSigner();
            const subplebbit = new Subplebbit(Object.assign({ signer }, createSubplebbitOptions));
            // keep a list of subplebbits the user probably created himself to use with listSubplebbits
            if (!(createSubplebbitOptions === null || createSubplebbitOptions === void 0 ? void 0 : createSubplebbitOptions.address)) {
                createdSubplebbits.push(subplebbit);
            }
            return subplebbit;
        });
    }
    getSubplebbit(subplebbitAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            yield simulateLoadingTime();
            const createSubplebbitOptions = {
                address: subplebbitAddress,
            };
            const subplebbit = new Subplebbit(createSubplebbitOptions);
            const hotPageCid = yield hash(subplebbitAddress + 'hot1');
            subplebbit.posts.pages.hot = yield getCommentsPage(hotPageCid, subplebbit);
            subplebbit.posts.pageCids = {
                hot: yield hash(subplebbitAddress + 'hot1'),
                topAll: yield hash(subplebbitAddress + 'topAll1'),
                new: yield hash(subplebbitAddress + 'new1'),
            };
            const subplebbitContent = yield getSubplebbitContent(subplebbitAddress);
            // add extra props
            for (const prop in subplebbitContent) {
                subplebbit[prop] = subplebbitContent[prop];
            }
            return subplebbit;
        });
    }
    listSubplebbits() {
        return __awaiter(this, void 0, void 0, function* () {
            const subplebbitAddresses = createdSubplebbits.map((subplebbit) => subplebbit.address);
            return [...new Set(subplebbitAddresses)];
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
            let commentContent = yield getPostContent(commentCid + 'postcontent');
            const isReply = yield getArrayItem([true, false, false, false], commentCid + 'isreply');
            if (isReply) {
                const depth = yield getNumberBetween(1, 10, commentCid + 'reply depth');
                const parentCid = yield hash(commentCid + 'parentcid');
                const postCid = depth === 1 ? parentCid : yield hash(commentCid + 'postCid');
                const getReplyContentOptions = { depth, parentCid, postCid };
                commentContent = yield getReplyContent(getReplyContentOptions, commentCid + 'replycontent');
            }
            const createCommentOptions = Object.assign({ cid: commentCid, ipnsName: yield hash(commentCid + 'ipns name'), timestamp: yield getNumberBetween(NOW - DAY * 30, NOW, commentCid + 'timestamp'), subplebbitAddress: 'memes.eth' }, commentContent);
            const comment = new Comment(createCommentOptions);
            // add missing props from createCommentOptions
            for (const prop in createCommentOptions) {
                // @ts-ignore
                comment[prop] = createCommentOptions[prop];
            }
            return comment;
        });
    }
    createVote() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Vote();
        });
    }
    createCommentEdit() {
        return __awaiter(this, void 0, void 0, function* () {
            return new CommentEdit();
        });
    }
    createSubplebbitEdit() {
        return __awaiter(this, void 0, void 0, function* () {
            return new SubplebbitEdit();
        });
    }
}
class Pages {
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
class Subplebbit extends EventEmitter {
    constructor(createSubplebbitOptions) {
        var _a;
        super();
        this.address = createSubplebbitOptions === null || createSubplebbitOptions === void 0 ? void 0 : createSubplebbitOptions.address;
        this.pubsubTopic = createSubplebbitOptions === null || createSubplebbitOptions === void 0 ? void 0 : createSubplebbitOptions.pubsubTopic;
        this.createdAt = createSubplebbitOptions === null || createSubplebbitOptions === void 0 ? void 0 : createSubplebbitOptions.createdAt;
        this.updatedAt = createSubplebbitOptions === null || createSubplebbitOptions === void 0 ? void 0 : createSubplebbitOptions.updatedAt;
        this.challengeTypes = createSubplebbitOptions === null || createSubplebbitOptions === void 0 ? void 0 : createSubplebbitOptions.challengeTypes;
        this.roles = createSubplebbitOptions === null || createSubplebbitOptions === void 0 ? void 0 : createSubplebbitOptions.roles;
        this.flairs = createSubplebbitOptions === null || createSubplebbitOptions === void 0 ? void 0 : createSubplebbitOptions.flairs;
        this.suggested = createSubplebbitOptions === null || createSubplebbitOptions === void 0 ? void 0 : createSubplebbitOptions.suggested;
        this.features = createSubplebbitOptions === null || createSubplebbitOptions === void 0 ? void 0 : createSubplebbitOptions.features;
        this.rules = createSubplebbitOptions === null || createSubplebbitOptions === void 0 ? void 0 : createSubplebbitOptions.rules;
        this.title = createSubplebbitOptions === null || createSubplebbitOptions === void 0 ? void 0 : createSubplebbitOptions.title;
        this.description = createSubplebbitOptions === null || createSubplebbitOptions === void 0 ? void 0 : createSubplebbitOptions.description;
        for (const prop in createSubplebbitOptions) {
            if (createSubplebbitOptions[prop]) {
                // @ts-ignore
                this[prop] = createSubplebbitOptions[prop];
            }
        }
        this.posts = new Pages({ subplebbit: this });
        if (!this.address && ((_a = this.signer) === null || _a === void 0 ? void 0 : _a.address)) {
            this.address = this.signer.address;
        }
        Object.defineProperty(this, 'updating', { enumerable: false, writable: true });
        // @ts-ignore
        this.updating = false;
    }
    edit(editSubplebbitOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            assert(editSubplebbitOptions && typeof editSubplebbitOptions === 'object', `invalid editSubplebbitOptions '${editSubplebbitOptions}'`);
            for (const prop in editSubplebbitOptions) {
                if (editSubplebbitOptions[prop]) {
                    // @ts-ignore
                    this[prop] = editSubplebbitOptions[prop];
                }
            }
        });
    }
    update() {
        // is ipnsName is known, look for updates and emit updates immediately after creation
        if (!this.address) {
            throw Error(`can't update without subplebbit.address`);
        }
        // don't update twice
        // @ts-ignore
        if (this.updating) {
            return;
        }
        // @ts-ignore
        this.updating = true;
        simulateLoadingTime().then(() => {
            this.simulateUpdateEvent();
        });
    }
    simulateUpdateEvent() {
        this.emit('update', this);
    }
}
let challengeRequestCount = 0;
let challengeAnswerCount = 0;
class Publication extends EventEmitter {
    constructor() {
        super();
        Object.defineProperty(this, 'challengeRequestId', { enumerable: false, writable: true });
        Object.defineProperty(this, 'challengeAnswerId', { enumerable: false, writable: true });
        // @ts-ignore
        this.challengeRequestId = `r${++challengeRequestCount}`;
        // @ts-ignore
        this.challengeAnswerId = `a${++challengeAnswerCount}`;
    }
    publish() {
        return __awaiter(this, void 0, void 0, function* () {
            yield simulateLoadingTime();
            this.simulateChallengeEvent();
        });
    }
    simulateChallengeEvent() {
        const challenge = { type: 'image', challenge: captchaImageBase64 };
        const challengeMessage = {
            type: 'CHALLENGE',
            // @ts-ignore
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
        return __awaiter(this, void 0, void 0, function* () {
            // if publication has content, create cid for this content and add it to comment and challengeVerificationMessage
            // @ts-ignore
            this.cid = this.content || this.title || this.link ? yield hash(this.content + this.title + this.link + 'cid') : undefined;
            const publication = this.cid && { cid: this.cid };
            const challengeVerificationMessage = {
                type: 'CHALLENGEVERIFICATION',
                // @ts-ignore
                challengeRequestId: this.challengeRequestId,
                // @ts-ignore
                challengeAnswerId: this.challengeAnswerId,
                challengeSuccess: true,
                publication,
            };
            this.emit('challengeverification', challengeVerificationMessage, this);
        });
    }
}
class Comment extends Publication {
    constructor(createCommentOptions) {
        super();
        this.ipnsName = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.ipnsName;
        this.cid = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.cid;
        this.upvoteCount = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.upvoteCount;
        this.downvoteCount = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.downvoteCount;
        this.content = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.content;
        this.author = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.author;
        this.timestamp = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.timestamp;
        this.parentCid = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.parentCid;
        this.postCid = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.postCid;
        this.parentCid = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.parentCid;
        this.depth = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.depth;
        this.spoiler = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.spoiler;
        this.flair = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.flair;
        this.pinned = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.pinned;
        this.locked = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.locked;
        this.deleted = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.deleted;
        this.removed = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.removed;
        this.editTimestamp = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.editTimestamp;
        this.reason = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.reason;
        Object.defineProperty(this, 'updating', { enumerable: false, writable: true });
        // @ts-ignore
        this.updating = false;
    }
    update() {
        // is ipnsName is known, look for updates and emit updates immediately after creation
        if (!this.ipnsName) {
            throw Error(`can't update without comment.ipnsName`);
        }
        // don't update twice
        // @ts-ignore
        if (this.updating) {
            return;
        }
        // @ts-ignore
        this.updating = true;
        (() => __awaiter(this, void 0, void 0, function* () {
            while (true) {
                yield simulateLoadingTime();
                this.simulateUpdateEvent();
            }
        }))();
    }
    simulateUpdateEvent() {
        return __awaiter(this, void 0, void 0, function* () {
            assert(this.cid, `invalid comment.cid '${this.cid}' can't simulateUpdateEvent`);
            const commentUpdateContent = yield getCommentUpdateContent(this);
            for (const prop in commentUpdateContent) {
                // @ts-ignore
                this[prop] = commentUpdateContent[prop];
            }
            this.emit('update', this);
        });
    }
}
class Vote extends Publication {
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
