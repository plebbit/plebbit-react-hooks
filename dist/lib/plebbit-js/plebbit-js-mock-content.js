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
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string';
import { toString as uint8ArrayToString } from 'uint8arrays/to-string';
// changeable with env variable so the frontend can test with different latencies
const doubleMedia = Boolean(process.env.REACT_APP_PLEBBIT_REACT_HOOKS_MOCK_CONTENT_DOUBLE_MEDIA);
const loadingTime = Number(process.env.REACT_APP_PLEBBIT_REACT_HOOKS_MOCK_CONTENT_LOADING_TIME || 100);
const simulateLoadingTime = () => new Promise((r) => setTimeout(r, loadingTime));
const NOW = 1679800000;
const DAY = 60 * 60 * 24;
// TODO: should delete this eventually to reduce npm package size
let captchaImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAJYAAAAyCAMAAACJUtIoAAAAY1BMVEX////y8vLm5ub39/fr7Ozf39/a29u/6c256MjV8N7v+fL0+/bU1dXO7tnp9+7e8+TJ7NTOzs7E69Gt5L+I26ag4bfk9en3/fmS3Kyo4rx42J2Z37LI38/AwMDR5tip1Li+1cUdWDCzAAAEkElEQVRYw+1Y6ZKjIBBuGuTyPqKZHLP7/k+5KrhIUEwms1X7Y76pMYVg23x9IvzgZfQN/I/QXavhP0SXyh6+AdQbEYS3UJ1TkC/zlbDxEtOD7Q8JnQRMFxYzooL0A46APhlZEizw71A2X+kyu5pBHC8JMUJ3ITqpu0O6GPqbRU8l3CM1CdnCjC0a8Yil80pdLinEMXBc5BMCuwaMUejYimzHoZSgzzJ90oaY8HCW7BmD0ug9QmAXxWlULW9yM+IbgqyHUjJJsuZYyWZu6xEwc3keaqTqCoUJx5puCx1vo1GAWPUf1GI8CRhk6IZZQM8RdCu6HiBvlgCCjaetWhZYo28JkvmvpBO/iD5bNLBFHPnsW1oq7mQGoGSlosdqYB+bARiDb4H6NRiZ6AkM+SdG8Vf9BckXK6RQxsVrStF3etxx5Vf8BdGLlBfQS233xXx6SODRHm9oh6HeSLcyScJejIAmn0mgFMoEvWISS+wZcT8ecPpngVrInmPMLdGymKvSubv9TVLM5gVzY8ObOVt+aIJe0kRqdHPp5wVDUveIyRVQFvKTgI1rV6LjIIDJlCsy3IoXDiEyElUrI7UbpbI05jRVjK2oPwJmWcLgzk0W3u/Jnt8p8UplMZLGs0DaEdgcLEiMX3tlHHcKSHQeWIZr71aikfWdvdOoIkdMVtGM0QxG79v2rDPf96vLZ2j5/c33Hyp4EyO46UbJhulIzR55JOSv5zC27DftVFvs2/yxAKVdc833wps9MJBs+A4NWk/3GJ34tQ91AyhRPHeoYAnvAPKT3qE2XpFqujVh5lzcWSHXG7KIYo9qXfTUvqU7mWMPSW3UigO5YzXlk4LPKKYrKcWlVRrKFg4RngQyAnEkuC6opqDFFUuVEGriSKoiF+KSD48+ovTDzr36QP1WarclQPBhFbMFRxt9zfaGUohKr6spVB/NeK9fc9OdWzW4Vsz3SqSmPfsK+NRcm/iXp/EX61FO34im91Sfr+3E4OcvISxJjJ3Up7z+FcXhDYS009+zKZWsTnnye6SkBA/WrfL5yjiAzsW4KAX4uAWd29tAuiQDnH2saNP8apzJZEzqKukp78tz5XVCfSVkdzOLLHnBoeor4HSdqKpWXiq918SneXv+NQStwulyFv2R+GNEtkMR2ip1mShoE5DMqcjDR6mbk5B58RBcizHCCvlqX0ZwDLWT1IAJCfdpKxglj2oZ32ukKNdFp1DDs0ffY5QSegW0RrZLMIRqWfGlkJVeeC26czMNCI00Wc5PWRL7mpCezS2vC6Cx7VVnWawdUEqFprjz26l85qOKVSvqYH45DuMrnKG31q+Vn0I2o6YdRxi2zjCIkQO0I9FbpfX+p6wQDGcy9eB9nmCQKgmncpee0KoB8LhvHuhO2xM6Dnd32ms+uIS9xp0cbpvgYfBiQDh/KK585TdkWSSr6qpgA/SehQY8BllUQePfPFjACa53SO7rjo5YCqoKoBgng+xHMoQvIJtOJJMkNPI43fIGut0H0toOmJJLQDF4C+6d098XwZcn+9ZmsO9SC96Bc5TUSvvBD/49/gDEMCEP8TccuAAAAABJRU5ErkJggg==';
const commentTitles = [
    `Own a Piece of Digital History- Winamp Is Now Selling Its Original 1.0 Skin as an NFT, Iconic Player “was the go-to music player everybody was using at the beginning of the history of digital music and was instrumental in helping the .mp3 become mainstream”.`,
    'Buyer of "Pepe the Frog" NFT files US$500,000 lawsuit after creator releases identical NFTs for free',
    '$5,100,000,000 Bitcoin Whale enters massive crypto accumulation mode',
    'Two Big Developments in Brave Browser',
    '🤡',
];
const commentContents = [
    `First of all, the sentiment in this sub concerning moons seems very __polarized__. Some people think they are a genius idea and others think they are making this sub this sub worse because of “moon farming.” which camp are you in? 

Second, how/where can you sell them. And third c/eEY1MhxPNyvt, how many upvotes=one moon, some people have so many when I’m sitting here at 17.

**Personally** I think Reddit is ahead of the _curve_, in a couple years I could easily see every social media platform incorporating their own coin into their interface. 

Think about it; it costs the company next to nothing, encourages users to spend more time and be more active on the platform, and capitalizes on their existing user base, skipping any need for marketing. 

u/BPNgj2dfHSn8 From the companies point of view it seems like a no brainer. p/reddit-screenshots.eth/c/QmeEY1MhxPNyvt5i8GVxZwqi11yweKuYFWyk1ST4GTKRnm

Can people think of issues with this approach? For either the company or the consumer, because besides increased levels of spamming I don’t see much downside.`,
    'What kind of messes up world is this. *Even* if they stop you, they would need some sort of seed phrase or private key to your account in order to get the funds.',
    '🤡',
    `So real fast u/estebanabaroa.eth/c/QmeEY1MhxPNyvt5i8GVxZwqi11yweKuYFWyk1ST4GTKRnm, I'm not a legal person and this isn't legal advice. I'm just sharing what I found out. What is civil forfeiture In the USA basically the cops can take things if the suspect it could of been used in a crime (any crime even if there is no crime going on now or in the area and any evidence). Lets put it this way, in CA there is pot shops that used armor trucks to move their money (which many stores use). Pot shops in CA is legal, but the cops on a regular bases stopped the truck for stupid things like using the turn signal too early. They use civil forfeiture to take the cash. From there in all cases they send the stuff to the gov, and the gov gives the local cops a major amount of the value of the assets. Note in some states this is illegal like NC. But I seen in the past years where federal wants to cause a loophole using DEA to force cops by law to do it. But note if you travel through states with this being legal. Note this is actually is a huge problem in the USA. Even more for unbanked people and homeless. ALL lawyers and all people I talked to in legal/law thinks this is the ultimate forum of government theft, and this should be federally illegal. That the system is proven to be extremely abused just for the reason of bonuses and the ones taking the money keep a ton of it after it went through the system. My question Can the gov force you to unlock your phone in a civil forfeiture? This giving them access to your hot wallets. Can the gov take your crypto in a civil forfeiture since it is on the blockchain? It should be noted that with 2, there is no clear answer to this. Basically it came down to it has to be tested in courts or a law maker needs to make laws clearing this up. NOTE FOR ANY LAW MAKERS THAT WANT TO HELP WHO THEY REPRESENT, AND WANT TO MAKE A BILL TO HELP THEM GET REELECTED. FIX THIS What I found out So can they take your phone or hardware wallet? The answer to this seems to be yes. Can they force you to unlock your phone? The answer to this seems to be not without a warrant. Can they brute force, hack, or do whatever to get in after they taken the device in a civil forfeiture? The answer seems to be yes. Basically, the idea is that when this happens it now becomes gov property. And if the gov wants to break in their own property or wipe their end. There isn't jack you can do to stop them expect remote format the device (seriously look into this. You can do this with most phones.) Are they likely to break into your phone/hardware wallet if they take it? While there isn't really evidence of this happening yet. The likely if it was to happen then yes. The question is, do they know of a 0 day which will allow them to get in, and that answer to this is maybe. Like I've seen videos of people recovering their funds from their hardware wallet through taking apart something like a ledger, hooking up to given things, and doing a few other things. So lets not rule out they will have some way of doing just this. Because it is likely if they take one, then they most likely are taking as many as they see. Can the gov use civil forfeiture to get the crypto itself without going after the phone/hardware wallet? Chances are is no. Like they can't demand for the given crypto since they have no way of knowing the wallet address unless if you show them or after they taken the device. They have to prove in court they suspected x was used in some way with a crime. Not knowing the address prior to rules this out. So basically, don't talk to the legal people without a lawyer and don't give them more info than needed. Note: if they use the law to take the phone or hardware wallet, then they can make a case that maybe the crypto is part of the taking since you have direct control of the crypto using your phone. Therefore the crypto could've also been used in crime in some way in the same way the phone could've been. Basically, it is the argument of can they take the truck and the music CD inside thing. How to handle the situation? Don't talk to the cops about anything you don't have to. Note the laws, but in general if they ask you to get out of the car ask if it is a command. If they say yes, then get out. If they asked for documents, then give it (don't be an idiot, just give it to them even the technical bits you don't need to. You will just PO the cop which can cause problems.) Ask them if you can leave, and that you would like to leave. This indicates you aren't volunteering your stay, and in many states they have to be reasonable about the length of the stop and many cases they won't have enough time to do something stupid. When asked questions you don't have to answer say a lawyer friend told you to not talk to the cops while being questioned or at a stop. Never agree to them searching your car or you without a warrant. Never argue with them on the side of the road, the day for that is in court (meaning if they decided to arrest you, then let them and then wait to fight it in court since it is likely you can get a big paycheck if done right). Never be open about what you have. If they take the item using civil forfeiture, then it is likely any cash will be gone forever since some of these court cases can last for years. But you can and should fight them in court because there is a growing amount of cases which is forcing judges and others to look more into this and treat it more serious. If you can't afford a lawyer to fight, then there is a few groups that you can call depending on if you have military background, extreme poverty, and so on. But to be blunt, the best way to fight this risk is by getting law makers to make civil forfeiture illegal. BTW for people visiting the USA, you could face this problem.`,
    markdownExample,
];
const commentLinks = [
    'https://fortune.com/2022/03/16/bitcoin-200k-price-prediction-crypto-outlook/',
    'https://finance.yahoo.com/news/c2x-announces-25-million-funding-120000728.html',
    'https://finance.yahoo.com/news/adopting-crypto-legal-tender-signify-101309571.html',
    'https://twitter.com/getplebbit/status/1632113706015309825',
    'https://www.youtube.com/watch?v=jfKfPfyJRdk',
];
const mediaLinks = [
    'https://upload.wikimedia.org/wikipedia/en/transcoded/b/bd/Exorcist_angiogram_scene.webm/Exorcist_angiogram_scene.webm.480p.vp9.webm',
    'https://upload.wikimedia.org/wikipedia/en/f/fa/2001_space_travel.ogv',
    'https://upload.wikimedia.org/wikipedia/en/e/e1/Don%27t_Look_Now_love_scene_.ogg',
    'https://upload.wikimedia.org/wikipedia/en/8/8a/Ellen_comes_out_airport.mp3',
    'https://upload.wikimedia.org/wikipedia/en/b/bf/Dave_Niehaus_Winning_Call_1995_AL_Division_Series.ogg',
];
const subplebbitTitles = ['The Ethereum investment community', 'Cryptography news and discussions', 'Memes', '🤡'];
const subplebbitDescriptions = [
    'Welcome to /r/EthTrader, a 100% community driven sub. Here you can discuss Ethereum news, memes, investing, trading, miscellaneous market-related subjects and other relevant technology.',
    'Cryptography is the art of creating mathematical assurances for who can do what with data, including but not limited to encryption of messages such that only the key-holder can read it. Cryptography lives at an intersection of math and computer science. This subreddit covers the theory and practice of modern and *strong* cryptography, and it is a technical subreddit focused on the algorithms and implementations of cryptography.',
    'Memes',
    '🤡',
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
    '  popic😃',
    'Riderix\n',
    'Romantec__',
    'Sellakuk23',
    '--TickoAim2$',
    'Transia4\t',
    'Trippah+512',
    '😃',
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
    { text: 'MOON 🌕', backgroundColor: '#D36E70' },
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
    { text: '🌕', backgroundColor: '#D36E70' },
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
const getCidHash = (string) => __awaiter(void 0, void 0, void 0, function* () {
    assert(string && typeof string === 'string', `can't getCidHash '${string} not a string'`);
    const seed = yield getNumberHash(string);
    const cid = yield seedToCid(seed);
    return cid;
});
const seedToCid = (seed) => __awaiter(void 0, void 0, void 0, function* () {
    assert(typeof seed === 'number' && !Number.isNaN(seed) && seed >= 0, `seedToCid seed argument must be positive number not '${seed}'`);
    let base10Seed = String(seed);
    // seed base10 string is usually too small for a cid, make it longer
    // the cid is usually around 46 chars in base58, so 80 chars in base10
    const base10SeedLength = 80;
    while (base10Seed.length < base10SeedLength) {
        base10Seed += base10Seed;
    }
    base10Seed = base10Seed.substring(0, base10SeedLength);
    const uint8Array = uint8ArrayFromString(base10Seed, 'base10');
    const base58Cid = uint8ArrayToString(uint8Array, 'base58btc');
    return base58Cid;
});
// fake hash with lots of collision for speed
const getNumberHash = (string) => __awaiter(void 0, void 0, void 0, function* () {
    assert(string && typeof string === 'string', `can't getNumberHash '${string} not a string'`);
    let hash = 0;
    for (let i = 0; i < string.length; i++) {
        const char = string.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash &= hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
});
class _SeedIncrementer {
    constructor(seed) {
        this.index = 0;
        assert(typeof seed === 'number' && !Number.isNaN(seed) && seed >= 0, `getNumberBetween seed argument must be positive number not '${seed}'`);
        this.seed = seed;
        this.numbers = String(seed)
            .split('')
            .map((number) => Number(number));
    }
    increment() {
        this.index++;
        const divider = this.numbers[this.index % this.numbers.length] + this.index;
        return Math.round(this.seed / divider);
    }
}
export const SeedIncrementer = (seed) => new _SeedIncrementer(seed);
const getNumberBetween = (min, max, seed) => __awaiter(void 0, void 0, void 0, function* () {
    assert(typeof seed === 'number' && !Number.isNaN(seed) && seed >= 0, `getNumberBetween seed argument must be positive number not '${seed}'`);
    // if the string is exponent, remove chars
    if (String(seed).match(/[^0-9]/)) {
        throw Error(`getNumberBetween seed too large '${seed}'`);
    }
    const number = Number('0.' + seed);
    return Math.floor(number * (max - min + 1) + min);
});
const getArrayItem = (array, seed) => __awaiter(void 0, void 0, void 0, function* () {
    // const index = await getNumberBetween(0, array.length - 1, seed)
    const index = seed % array.length;
    return array[index];
});
export const getImageUrl = (_seed) => __awaiter(void 0, void 0, void 0, function* () {
    assert(typeof _seed === 'number' && !Number.isNaN(_seed) && _seed >= 0, `getImageUrl seed argument must be positive number not '${_seed}'`);
    const seed = SeedIncrementer(_seed);
    const jpg = `https://picsum.photos/seed/${yield getNumberBetween(10, 2000, seed.increment())}/${yield getNumberBetween(10, 2000, seed.increment())}/${yield getNumberBetween(10, 2000, seed.increment())}.jpg`;
    const webp = `https://picsum.photos/seed/${yield getNumberBetween(10, 2000, seed.increment())}/${yield getNumberBetween(10, 2000, seed.increment())}/${yield getNumberBetween(10, 2000, seed.increment())}.webp`;
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
    const imageUrl = (yield getArrayItem(imageUrls, seed.increment())) + (yield getArrayItem(urlSuffixes, seed.increment()));
    return imageUrl;
});
const getAuthorAddress = (_seed) => __awaiter(void 0, void 0, void 0, function* () {
    assert(typeof _seed === 'number' && !Number.isNaN(_seed) && _seed >= 0, `getAuthorAddress seed argument must be positive number not '${_seed}'`);
    const seed = SeedIncrementer(_seed);
    const hasEns = yield getArrayItem([true, false, false, false], seed.increment());
    if (hasEns) {
        const text = yield getArrayItem([...firstNames, ...displayNames], seed.increment());
        return (text.toLowerCase().replace(/[^a-z0-9]/g, '') || 'john') + '.eth';
    }
    else {
        const address = yield seedToCid(seed.increment());
        return address;
    }
});
const getAuthor = (seed) => __awaiter(void 0, void 0, void 0, function* () {
    const authorNumberSeed = SeedIncrementer(yield getNumberHash(seed));
    const author = {
        address: yield getAuthorAddress(authorNumberSeed.increment()),
    };
    author.shortAddress = author.address.endsWith('.eth') ? author.address : author.address.substring(8, 20);
    const hasDisplayName = yield getArrayItem([true, true, true, false], authorNumberSeed.increment());
    if (hasDisplayName) {
        author.displayName = yield getArrayItem(displayNames, authorNumberSeed.increment());
    }
    const rareTrue = [true, false, false, false, false, false, false, false];
    const hasNftAvatar = yield getArrayItem(rareTrue, authorNumberSeed.increment());
    if (hasNftAvatar) {
        author.avatar = {
            chainTicker: 'eth',
            address: yield getArrayItem([
                '0xed5af388653567af2f388e6224dc7c4b3241c544',
                '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
                '0x60e4d786628fea6478f785a6d7e704777c86a7c6',
                '0x79fcdef22feed20eddacbb2587640e45491b757f',
                '0x0000000000000000000000000000000000000dead',
            ], authorNumberSeed.increment()),
            index: yield getNumberBetween(1, 2000, authorNumberSeed.increment()),
        };
    }
    const hasFlair = yield getArrayItem(rareTrue, authorNumberSeed.increment());
    if (hasFlair) {
        author.flair = yield getArrayItem(authorFlairs, authorNumberSeed.increment());
    }
    return author;
});
const getPostContent = (seed) => __awaiter(void 0, void 0, void 0, function* () {
    const postNumberSeed = SeedIncrementer(yield getNumberHash(seed));
    const postContent = {
        depth: 0,
        author: yield getAuthor(String(postNumberSeed)),
        title: yield getArrayItem(commentTitles, postNumberSeed.increment()),
    };
    const hasFlair = yield getArrayItem([true, false, false, false], postNumberSeed.increment());
    if (hasFlair) {
        postContent.flair = yield getArrayItem(postFlairs, postNumberSeed.increment());
    }
    let isLinkPost = yield getArrayItem([true, false], postNumberSeed.increment());
    if (doubleMedia && !isLinkPost) {
        isLinkPost = yield getArrayItem([true, false], postNumberSeed.increment());
    }
    if (isLinkPost) {
        postContent.link = yield getArrayItem(commentLinks, postNumberSeed.increment());
        let linkIsImage = yield getArrayItem([true, false], postNumberSeed.increment());
        if (doubleMedia && !linkIsImage) {
            linkIsImage = yield getArrayItem([true, false], postNumberSeed.increment());
        }
        if (linkIsImage) {
            postContent.link = yield getImageUrl(postNumberSeed.increment());
            // add video and audio
            const imageIsMedia = yield getArrayItem([true, false, false, false], postNumberSeed.increment());
            if (imageIsMedia) {
                postContent.link = yield getArrayItem(mediaLinks, postNumberSeed.increment());
            }
        }
        const hasThumbnail = yield getArrayItem([true, true, true, false], postNumberSeed.increment());
        if (!linkIsImage && hasThumbnail) {
            postContent.thumbnailUrl = yield getImageUrl(postNumberSeed.increment());
        }
    }
    // else is text post
    else {
        postContent.content = yield getArrayItem(commentContents, postNumberSeed.increment());
        const hasQuote = yield getArrayItem([true, false, false, false], postNumberSeed.increment());
        if (hasQuote) {
            const max = 7;
            const lines = postContent.content.split('\n');
            for (const i in lines) {
                const lineIsQuote = yield getArrayItem([true, false], postNumberSeed.increment());
                if (lineIsQuote) {
                    lines[i] = '>' + lines[i];
                }
                if (Number(i) > max) {
                    break;
                }
            }
            postContent.content = lines.join('\n');
        }
    }
    return postContent;
});
const getReplyContent = (getReplyContentOptions, seed) => __awaiter(void 0, void 0, void 0, function* () {
    const replyNumberSeed = SeedIncrementer(yield getNumberHash(seed));
    const { depth, parentCid, postCid } = getReplyContentOptions;
    const author = yield getAuthor(String(replyNumberSeed.seed));
    let content = yield getArrayItem(commentContents, replyNumberSeed.increment());
    const hasQuote = yield getArrayItem([true, false, false, false], replyNumberSeed.increment());
    if (hasQuote) {
        const max = 7;
        const lines = content.split('\n');
        for (const i in lines) {
            const lineIsQuote = yield getArrayItem([true, false], replyNumberSeed.increment());
            if (lineIsQuote) {
                lines[i] = '>' + lines[i];
            }
            if (Number(i) > max) {
                break;
            }
        }
        content = lines.join('\n');
    }
    const replyContent = { content, author, depth, parentCid, postCid };
    const hasLink = yield getArrayItem([true, false, false, false], replyNumberSeed.increment());
    if (hasLink) {
        replyContent.link = yield getArrayItem(commentLinks, replyNumberSeed.increment());
        const linkIsImage = yield getArrayItem([true, false], replyNumberSeed.increment());
        if (linkIsImage) {
            replyContent.link = yield getImageUrl(replyNumberSeed.increment());
            // add video and audio
            const imageIsMedia = yield getArrayItem([true, false, false, false], replyNumberSeed.increment());
            if (imageIsMedia) {
                replyContent.link = yield getArrayItem(mediaLinks, replyNumberSeed.increment());
            }
        }
        const hasThumbnail = yield getArrayItem([true, true, true, false], replyNumberSeed.increment());
        if (!linkIsImage && hasThumbnail) {
            replyContent.thumbnailUrl = yield getImageUrl(replyNumberSeed.increment());
        }
    }
    const hasTitle = yield getArrayItem([true, false, false, false, false, false, false], replyNumberSeed.increment());
    if (hasTitle) {
        replyContent.title = yield getArrayItem(commentTitles, replyNumberSeed.increment());
    }
    return replyContent;
});
const getSubplebbitContent = (seed) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const subplebbitNumberSeed = SeedIncrementer(yield getNumberHash(seed));
    const subplebbit = {
        pubsubTopic: yield seedToCid(subplebbitNumberSeed.seed),
    };
    const hasChallengeTypes = yield getArrayItem([true, false], subplebbitNumberSeed.increment());
    if (hasChallengeTypes) {
        subplebbit.challengeTypes = ['image'];
    }
    const hasRoles = yield getArrayItem([true, false], subplebbitNumberSeed.increment());
    if (hasRoles) {
        subplebbit.roles = {
            [yield getAuthorAddress(subplebbitNumberSeed.increment())]: { role: 'owner' },
            [yield getAuthorAddress(subplebbitNumberSeed.increment())]: { role: 'admin' },
            [yield getAuthorAddress(subplebbitNumberSeed.increment())]: { role: 'moderator' },
            [yield getAuthorAddress(subplebbitNumberSeed.increment())]: { role: 'moderator' },
            [yield getAuthorAddress(subplebbitNumberSeed.increment())]: { role: 'moderator' },
            [yield getAuthorAddress(subplebbitNumberSeed.increment())]: { role: 'moderator' },
            [yield getAuthorAddress(subplebbitNumberSeed.increment())]: { role: 'moderator' },
            [yield getAuthorAddress(subplebbitNumberSeed.increment())]: { role: 'moderator' },
        };
    }
    const title = yield getArrayItem([undefined, ...subplebbitTitles], subplebbitNumberSeed.increment());
    if (title) {
        subplebbit.title = title;
    }
    const description = yield getArrayItem([undefined, ...subplebbitDescriptions], subplebbitNumberSeed.increment());
    if (description) {
        subplebbit.description = description;
    }
    const hasPostFlairs = yield getArrayItem([true, false], subplebbitNumberSeed.increment());
    if (hasPostFlairs) {
        subplebbit.flairs = { post: postFlairs };
    }
    const hasAuthorFlairs = yield getArrayItem([true, false], subplebbitNumberSeed.increment());
    if (hasAuthorFlairs) {
        subplebbit.flairs = { post: (_a = subplebbit.flairs) === null || _a === void 0 ? void 0 : _a.post, author: authorFlairs };
    }
    const hasSuggested = yield getArrayItem([true, false], subplebbitNumberSeed.increment());
    if (hasSuggested) {
        subplebbit.suggested = {
            primaryColor: (yield getArrayItem(postFlairs, subplebbitNumberSeed.increment())).backgroundColor,
            secondaryColor: (yield getArrayItem(postFlairs, subplebbitNumberSeed.increment())).backgroundColor,
            avatarUrl: yield getArrayItem([undefined, yield getImageUrl(subplebbitNumberSeed.increment())], subplebbitNumberSeed.increment()),
            bannerUrl: yield getArrayItem([undefined, yield getImageUrl(subplebbitNumberSeed.increment())], subplebbitNumberSeed.increment()),
            backgroundUrl: yield getArrayItem([undefined, yield getImageUrl(subplebbitNumberSeed.increment())], subplebbitNumberSeed.increment()),
            language: yield getArrayItem([undefined, undefined, 'en', 'en', 'es', 'ru'], subplebbitNumberSeed.increment()),
        };
    }
    const hasFeatures = yield getArrayItem([true, false], subplebbitNumberSeed.increment());
    if (hasFeatures) {
        subplebbit.features = {
            noVideos: yield getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
            noSpoilers: yield getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
            noImages: yield getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
            noVideoReplies: yield getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
            noSpoilerReplies: yield getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
            noImageReplies: yield getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
            noPolls: yield getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
            noCrossposts: yield getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
            noUpvotes: yield getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
            noDownvotes: yield getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
            noAuthors: yield getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
            anonymousAuthors: yield getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
            noNestedReplies: yield getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
            safeForWork: yield getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
            authorFlairs: yield getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
            requireAuthorFlairs: yield getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
            postFlairs: yield getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
            requirePostFlairs: yield getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
            noMarkdownImages: yield getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
            noMarkdownVideos: yield getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
            markdownImageReplies: yield getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
            markdownVideoReplies: yield getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
        };
    }
    const hasRules = yield getArrayItem([true, false], subplebbitNumberSeed.increment());
    if (hasRules) {
        subplebbit.rules = [
            'no spam',
            'be nice',
            'Do not link to CNN.',
            'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
            'OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO ',
        ];
    }
    const isOnline = yield getArrayItem([true, false], subplebbitNumberSeed.increment());
    if (isOnline) {
        // updated in last 1h
        subplebbit.updatedAt = Math.round(Date.now() / 1000) - (yield getNumberBetween(1, 60 * 60, subplebbitNumberSeed.increment()));
    }
    else {
        // updated in last month
        subplebbit.updatedAt = Math.round(Date.now() / 1000) - (yield getNumberBetween(60 * 60, 60 * 60 * 24 * 30, subplebbitNumberSeed.increment()));
    }
    subplebbit.createdAt = subplebbit.updatedAt - (yield getNumberBetween(1, 60 * 60 * 24 * 3000, subplebbitNumberSeed.increment()));
    return subplebbit;
});
// for debugging slow bulk reply generation
let replyLoopCount = 0;
const getCommentUpdateContent = (comment) => __awaiter(void 0, void 0, void 0, function* () {
    const commentUpdateSeedNumber = SeedIncrementer(yield getNumberHash(comment.cid));
    const upvotesPerUpdate = yield getNumberBetween(1, 1000, commentUpdateSeedNumber.increment());
    const downvotesPerUpdate = yield getNumberBetween(1, 1000, commentUpdateSeedNumber.increment());
    const commentUpdateContent = {};
    // simulate finding vote counts on an IPNS record
    commentUpdateContent.upvoteCount = typeof comment.upvoteCount === 'number' ? comment.upvoteCount + upvotesPerUpdate : upvotesPerUpdate;
    commentUpdateContent.downvoteCount = typeof comment.downvoteCount === 'number' ? comment.downvoteCount + downvotesPerUpdate : downvotesPerUpdate;
    // find the number of replies
    commentUpdateContent.replyCount = 0;
    const hasReplies = yield getArrayItem([true, false, false, false], commentUpdateSeedNumber.increment());
    if (hasReplies) {
        commentUpdateContent.replyCount = yield getNumberBetween(0, 30, commentUpdateSeedNumber.increment());
        if (comment.depth > 0) {
            commentUpdateContent.replyCount = commentUpdateContent.replyCount / Math.pow((comment.depth + 1), 2);
        }
        if (commentUpdateContent.replyCount < 1) {
            commentUpdateContent.replyCount = 0;
        }
        commentUpdateContent.replyCount = Math.round(commentUpdateContent.replyCount);
    }
    // simulate finding replies from IPNS record
    commentUpdateContent.replies = { pages: { topAll: { nextCid: undefined, comments: [] } } };
    const getReplyContentOptions = { depth: comment.depth + 1, parentCid: comment.cid, postCid: comment.cid };
    let replyCount = commentUpdateContent.replyCount;
    const replyCids = new Set();
    while (replyCount-- > 0) {
        // console.log({replyLoopCount: replyLoopCount++, replyCount: commentUpdateContent.replyCount, depth: comment.depth, cid: comment.cid, index: replyCount})
        const cid = yield seedToCid(yield getNumberHash(comment.cid + replyCount));
        const replyContent = yield getReplyContent(getReplyContentOptions, cid + 'replycontent' + replyCount);
        const reply = Object.assign(Object.assign({ cid, shortCid: cid.substring(2, 14), ipnsName: yield seedToCid(commentUpdateSeedNumber.increment()), timestamp: yield getNumberBetween(comment.timestamp, NOW, commentUpdateSeedNumber.increment()) }, replyContent), { subplebbitAddress: comment.subplebbitAddress || 'memes.eth' });
        if (replyCids.has(reply.cid)) {
            console.error(`mock content error: duplicate reply cid '${reply.cid}'`);
        }
        replyCids.add(reply.cid);
        const replyUpdateContent = yield getCommentUpdateContent(reply);
        commentUpdateContent.replies.pages.topAll.comments.push(Object.assign(Object.assign({}, reply), replyUpdateContent));
    }
    const rareTrue = [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
    const isSpoiler = yield getArrayItem(rareTrue, commentUpdateSeedNumber.increment());
    if (isSpoiler) {
        commentUpdateContent.spoiler = true;
    }
    const isEdited = yield getArrayItem(rareTrue, commentUpdateSeedNumber.increment());
    if (isEdited && !comment.edit) {
        commentUpdateContent.edit = {
            commentCid: comment.cid,
            timestamp: comment.timestamp + 60 * 30,
            reason: 'I wanted to know why the downvotes?',
            author: comment.author,
        };
        commentUpdateContent.original = {
            content: comment.content,
        };
        commentUpdateContent.content = (comment.content || '') + ' WHY DOWNVOTES!?';
    }
    const isDeleted = yield getArrayItem(rareTrue, commentUpdateSeedNumber.increment());
    const isPinned = yield getArrayItem(rareTrue, commentUpdateSeedNumber.increment());
    const isRemoved = yield getArrayItem(rareTrue, commentUpdateSeedNumber.increment());
    const isLocked = yield getArrayItem(rareTrue, commentUpdateSeedNumber.increment());
    if (isDeleted) {
        commentUpdateContent.deleted = true;
    }
    else if (isPinned) {
        commentUpdateContent.pinned = true;
    }
    else if (isRemoved) {
        commentUpdateContent.removed = true;
        const hasReason = yield getArrayItem([true, false], commentUpdateSeedNumber.increment());
        if (hasReason) {
            commentUpdateContent.reason = yield getArrayItem(reasons, commentUpdateSeedNumber.increment());
        }
    }
    else if (isLocked && comment.depth === 0) {
        commentUpdateContent.locked = true;
        const hasReason = yield getArrayItem([true, false], commentUpdateSeedNumber.increment());
        if (hasReason) {
            commentUpdateContent.reason = yield getArrayItem(reasons, commentUpdateSeedNumber.increment());
        }
    }
    commentUpdateContent.updatedAt = Math.round(Date.now() / 1000);
    return commentUpdateContent;
});
const pageCommentCids = new Set();
const getCommentsPage = (pageCid, subplebbit) => __awaiter(void 0, void 0, void 0, function* () {
    const commentsPageSeedNumber = SeedIncrementer(yield getNumberHash(pageCid));
    const page = {
        nextCid: yield seedToCid(commentsPageSeedNumber.increment()),
        comments: [],
    };
    const postCount = 100;
    let index = 0;
    const plebbit = new Plebbit();
    while (index++ < postCount) {
        const cid = yield seedToCid(yield getNumberHash(pageCid + index));
        // debug message
        if (pageCommentCids.has(cid)) {
            console.error(`mock content error: duplicate page comment cid '${cid}'`);
        }
        pageCommentCids.add(cid);
        // comment = {...comment, ...(await getPostContent(comment.cid)), ...(await getCommentUpdateContent(comment))}
        const comment = yield plebbit.getComment(cid);
        comment.subplebbitAddress = subplebbit.address;
        const commentUpdateContent = yield getCommentUpdateContent(comment);
        for (const prop in commentUpdateContent) {
            comment[prop] = commentUpdateContent[prop];
        }
        page.comments.push(comment);
    }
    return page;
});
// array of subplebbits probably created by the user
const createdSubplebbits = {};
class Plebbit extends EventEmitter {
    createSigner() {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                privateKey: 'private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key',
                address: yield getCidHash(String(Math.random())),
            };
        });
    }
    resolveAuthorAddress(authorAddress) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    createSubplebbit(createSubplebbitOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            // if the only argument is {address}, the user didn't create the sub, it's a fetched sub
            if ((createSubplebbitOptions === null || createSubplebbitOptions === void 0 ? void 0 : createSubplebbitOptions.address) && Object.keys(createSubplebbitOptions).length === 1) {
                return new Subplebbit(createSubplebbitOptions);
            }
            const signer = yield this.createSigner();
            const subplebbit = new Subplebbit(Object.assign({ signer }, createSubplebbitOptions));
            // keep a list of subplebbits the user probably created himself to use with listSubplebbits
            if (!(createSubplebbitOptions === null || createSubplebbitOptions === void 0 ? void 0 : createSubplebbitOptions.address)) {
                createdSubplebbits[subplebbit.address || ''] = subplebbit;
            }
            return subplebbit;
        });
    }
    getSubplebbit(subplebbitAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const createSubplebbitOptions = {
                address: subplebbitAddress,
            };
            const subplebbit = new Subplebbit(createSubplebbitOptions);
            const hotPageCid = yield seedToCid(yield getNumberHash(subplebbitAddress + 'hotpagecid'));
            subplebbit.posts.pages.hot = yield getCommentsPage(hotPageCid, subplebbit);
            subplebbit.posts.pageCids = {
                hot: yield seedToCid(yield getNumberHash(subplebbitAddress + 'hotpagecid2')),
                topAll: yield seedToCid(yield getNumberHash(subplebbitAddress + 'topallpagecid')),
                new: yield seedToCid(yield getNumberHash(subplebbitAddress + 'newpagecid')),
                active: yield seedToCid(yield getNumberHash(subplebbitAddress + 'activepagecid')),
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
            const subplebbitAddresses = Object.keys(createdSubplebbits);
            return subplebbitAddresses;
        });
    }
    createComment(createCommentOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Comment(createCommentOptions);
        });
    }
    getComment(commentCid) {
        return __awaiter(this, void 0, void 0, function* () {
            const commentSeedNumber = SeedIncrementer(yield getNumberHash(commentCid + 'getcomment'));
            let commentContent = yield getPostContent(commentCid + 'postcontent');
            const isReply = commentCid.endsWith('reply');
            if (isReply) {
                const depth = yield getNumberBetween(1, 10, commentSeedNumber.increment());
                const parentCid = yield seedToCid(commentSeedNumber.increment());
                const postCid = depth === 1 ? parentCid : yield seedToCid(commentSeedNumber.increment());
                const getReplyContentOptions = { depth, parentCid, postCid };
                commentContent = yield getReplyContent(getReplyContentOptions, commentCid + 'replycontent');
            }
            const createCommentOptions = Object.assign({ cid: commentCid, ipnsName: yield seedToCid(commentSeedNumber.increment()), timestamp: yield getNumberBetween(NOW - DAY * 30, NOW, commentSeedNumber.increment()), subplebbitAddress: 'memes.eth' }, commentContent);
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
    fetchCid(cid) {
        return __awaiter(this, void 0, void 0, function* () {
            if (cid === null || cid === void 0 ? void 0 : cid.startsWith('statscid')) {
                return JSON.stringify({
                    hourActiveUserCount: 1,
                    dayActiveUserCount: 11,
                    weekActiveUserCount: 111,
                    monthActiveUserCount: 1111,
                    yearActiveUserCount: 11111,
                    allActiveUserCount: 111111,
                    hourPostCount: 2,
                    dayPostCount: 22,
                    weekPostCount: 222,
                    monthPostCount: 2222,
                    yearPostCount: 22222,
                    allPostCount: 222222,
                });
            }
            throw Error(`plebbit.fetchCid not implemented in mock content for cid '${cid}'`);
        });
    }
    pubsubSubscribe(subplebbitAddress) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    pubsubUnsubscribe(subplebbitAddress) {
        return __awaiter(this, void 0, void 0, function* () { });
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
        var _a, _b, _c, _d, _e, _f, _g;
        super();
        this._getSubplebbitOnFirstUpdate = false;
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
        this.statsCid = 'statscid';
        for (const prop in createSubplebbitOptions) {
            if (createSubplebbitOptions[prop]) {
                // @ts-ignore
                this[prop] = createSubplebbitOptions[prop];
            }
        }
        this.posts = new Pages({ subplebbit: this });
        // add subplebbit.posts from createSubplebbitOptions
        if ((_a = createSubplebbitOptions === null || createSubplebbitOptions === void 0 ? void 0 : createSubplebbitOptions.posts) === null || _a === void 0 ? void 0 : _a.pages) {
            this.posts.pages = (_b = createSubplebbitOptions === null || createSubplebbitOptions === void 0 ? void 0 : createSubplebbitOptions.posts) === null || _b === void 0 ? void 0 : _b.pages;
        }
        if ((_c = createSubplebbitOptions === null || createSubplebbitOptions === void 0 ? void 0 : createSubplebbitOptions.posts) === null || _c === void 0 ? void 0 : _c.pageCids) {
            this.posts.pageCids = (_d = createSubplebbitOptions === null || createSubplebbitOptions === void 0 ? void 0 : createSubplebbitOptions.posts) === null || _d === void 0 ? void 0 : _d.pageCids;
        }
        if (!this.address && ((_e = this.signer) === null || _e === void 0 ? void 0 : _e.address)) {
            this.address = this.signer.address;
        }
        this.shortAddress = ((_f = this.address) === null || _f === void 0 ? void 0 : _f.endsWith('.eth')) ? this.address : (_g = this.address) === null || _g === void 0 ? void 0 : _g.substring(8, 20);
        Object.defineProperty(this, 'updating', { enumerable: false, writable: true });
        // @ts-ignore
        this.updating = false;
        // if the only argument is {address}, it means the first update should use getSubplebbit()
        if ((createSubplebbitOptions === null || createSubplebbitOptions === void 0 ? void 0 : createSubplebbitOptions.address) && Object.keys(createSubplebbitOptions).length === 1) {
            this._getSubplebbitOnFirstUpdate = true;
        }
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
        return __awaiter(this, void 0, void 0, function* () {
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
            this.updatingState = 'fetching-ipns';
            this.emit('updatingstatechange', 'fetching-ipns');
            simulateLoadingTime().then(() => {
                this.simulateUpdateEvent();
            });
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.address) {
                delete createdSubplebbits[this.address];
            }
        });
    }
    simulateUpdateEvent() {
        if (this._getSubplebbitOnFirstUpdate) {
            return this.simulateGetSubplebbitOnFirstUpdateEvent();
        }
        this.emit('update', this);
    }
    simulateGetSubplebbitOnFirstUpdateEvent() {
        return __awaiter(this, void 0, void 0, function* () {
            this._getSubplebbitOnFirstUpdate = false;
            // @ts-ignore
            const subplebbit = yield new Plebbit().getSubplebbit(this.address);
            const props = JSON.parse(JSON.stringify(subplebbit));
            for (const prop in props) {
                if (prop.startsWith('_')) {
                    continue;
                }
                // @ts-ignore
                this[prop] = props[prop];
            }
            this.posts.getPage = subplebbit.posts.getPage;
            this.updatingState = 'succeeded';
            this.emit('update', this);
            this.emit('updatingstatechange', 'succeeded');
            this.simulateUpdateEvent();
        });
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
            yield this.simulateChallengeEvent();
        });
    }
    simulateChallengeEvent() {
        return __awaiter(this, void 0, void 0, function* () {
            const challenges = [];
            // @ts-ignore
            const challengeCount = yield getNumberBetween(1, 3, yield getNumberHash(this.challengeRequestId));
            while (challenges.length < challengeCount) {
                challenges.push({ type: 'image/png', challenge: captchaImageBase64 });
            }
            const challengeMessage = {
                type: 'CHALLENGE',
                // @ts-ignore
                challengeRequestId: this.challengeRequestId,
                challenges,
            };
            this.emit('challenge', challengeMessage, this);
        });
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
            this.cid = this.content || this.title || this.link ? yield getCidHash(this.content + this.title + this.link + 'cid') : undefined;
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
        this._getCommentOnFirstUpdate = false;
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
        this.reason = createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.reason;
        if (this.cid) {
            this.shortCid = this.cid.substring(2, 14);
        }
        Object.defineProperty(this, 'updating', { enumerable: false, writable: true });
        // @ts-ignore
        this.updating = false;
        // add missing props from createCommentOptions
        for (const prop in createCommentOptions) {
            // @ts-ignore
            this[prop] = createCommentOptions[prop];
        }
        // if the only argument is {cid}, it means the first update should use getComment()
        if ((createCommentOptions === null || createCommentOptions === void 0 ? void 0 : createCommentOptions.cid) && Object.keys(createCommentOptions).length === 1) {
            this._getCommentOnFirstUpdate = true;
        }
    }
    update() {
        return __awaiter(this, void 0, void 0, function* () {
            // don't update twice
            // @ts-ignore
            if (this.updating) {
                return;
            }
            // @ts-ignore
            this.updating = true;
            this.updatingState = 'fetching-ipfs';
            this.emit('updatingstatechange', 'fetching-ipfs');
            (() => __awaiter(this, void 0, void 0, function* () {
                while (true) {
                    yield simulateLoadingTime();
                    yield simulateLoadingTime();
                    yield simulateLoadingTime();
                    this.simulateUpdateEvent();
                }
            }))();
        });
    }
    simulateUpdateEvent() {
        return __awaiter(this, void 0, void 0, function* () {
            assert(this.cid, `invalid comment.cid '${this.cid}' can't simulateUpdateEvent`);
            if (this._getCommentOnFirstUpdate) {
                return this.simulateGetCommentOnFirstUpdateEvent();
            }
            const commentUpdateContent = yield getCommentUpdateContent(this);
            for (const prop in commentUpdateContent) {
                // @ts-ignore
                this[prop] = commentUpdateContent[prop];
            }
            this.shortCid = this.cid.substring(2, 14);
            this.updatingState = 'succeeded';
            this.emit('update', this);
            this.emit('updatingstatechange', 'succeeded');
        });
    }
    simulateGetCommentOnFirstUpdateEvent() {
        return __awaiter(this, void 0, void 0, function* () {
            this._getCommentOnFirstUpdate = false;
            // @ts-ignore
            const comment = yield new Plebbit().getComment(this.cid);
            const props = JSON.parse(JSON.stringify(comment));
            for (const prop in props) {
                if (prop.startsWith('_')) {
                    continue;
                }
                // @ts-ignore
                this[prop] = props[prop];
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
