import markdownExample from './fixtures/markdown-example'
import EventEmitter from 'events'
import assert from 'assert'
import {sha256} from 'multiformats/hashes/sha2'
import {fromString as uint8ArrayFromString} from 'uint8arrays/from-string'
import {toString as uint8ArrayToString} from 'uint8arrays/to-string'

// changeable with env variable so the frontend can test with different latencies
const doubleMedia = Boolean(process.env.REACT_APP_PLEBBIT_REACT_HOOKS_MOCK_CONTENT_DOUBLE_MEDIA)
const loadingTime = Number(process.env.REACT_APP_PLEBBIT_REACT_HOOKS_MOCK_CONTENT_LOADING_TIME || 100)
const simulateLoadingTime = () => new Promise((r) => setTimeout(r, loadingTime))
const NOW = 1679800000
const DAY = 60 * 60 * 24

// TODO: should delete this eventually to reduce npm package size
let captchaImageBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAJYAAAAyCAMAAACJUtIoAAAAY1BMVEX////y8vLm5ub39/fr7Ozf39/a29u/6c256MjV8N7v+fL0+/bU1dXO7tnp9+7e8+TJ7NTOzs7E69Gt5L+I26ag4bfk9en3/fmS3Kyo4rx42J2Z37LI38/AwMDR5tip1Li+1cUdWDCzAAAEkElEQVRYw+1Y6ZKjIBBuGuTyPqKZHLP7/k+5KrhIUEwms1X7Y76pMYVg23x9IvzgZfQN/I/QXavhP0SXyh6+AdQbEYS3UJ1TkC/zlbDxEtOD7Q8JnQRMFxYzooL0A46APhlZEizw71A2X+kyu5pBHC8JMUJ3ITqpu0O6GPqbRU8l3CM1CdnCjC0a8Yil80pdLinEMXBc5BMCuwaMUejYimzHoZSgzzJ90oaY8HCW7BmD0ug9QmAXxWlULW9yM+IbgqyHUjJJsuZYyWZu6xEwc3keaqTqCoUJx5puCx1vo1GAWPUf1GI8CRhk6IZZQM8RdCu6HiBvlgCCjaetWhZYo28JkvmvpBO/iD5bNLBFHPnsW1oq7mQGoGSlosdqYB+bARiDb4H6NRiZ6AkM+SdG8Vf9BckXK6RQxsVrStF3etxx5Vf8BdGLlBfQS233xXx6SODRHm9oh6HeSLcyScJejIAmn0mgFMoEvWISS+wZcT8ecPpngVrInmPMLdGymKvSubv9TVLM5gVzY8ObOVt+aIJe0kRqdHPp5wVDUveIyRVQFvKTgI1rV6LjIIDJlCsy3IoXDiEyElUrI7UbpbI05jRVjK2oPwJmWcLgzk0W3u/Jnt8p8UplMZLGs0DaEdgcLEiMX3tlHHcKSHQeWIZr71aikfWdvdOoIkdMVtGM0QxG79v2rDPf96vLZ2j5/c33Hyp4EyO46UbJhulIzR55JOSv5zC27DftVFvs2/yxAKVdc833wps9MJBs+A4NWk/3GJ34tQ91AyhRPHeoYAnvAPKT3qE2XpFqujVh5lzcWSHXG7KIYo9qXfTUvqU7mWMPSW3UigO5YzXlk4LPKKYrKcWlVRrKFg4RngQyAnEkuC6opqDFFUuVEGriSKoiF+KSD48+ovTDzr36QP1WarclQPBhFbMFRxt9zfaGUohKr6spVB/NeK9fc9OdWzW4Vsz3SqSmPfsK+NRcm/iXp/EX61FO34im91Sfr+3E4OcvISxJjJ3Up7z+FcXhDYS009+zKZWsTnnye6SkBA/WrfL5yjiAzsW4KAX4uAWd29tAuiQDnH2saNP8apzJZEzqKukp78tz5XVCfSVkdzOLLHnBoeor4HSdqKpWXiq918SneXv+NQStwulyFv2R+GNEtkMR2ip1mShoE5DMqcjDR6mbk5B58RBcizHCCvlqX0ZwDLWT1IAJCfdpKxglj2oZ32ukKNdFp1DDs0ffY5QSegW0RrZLMIRqWfGlkJVeeC26czMNCI00Wc5PWRL7mpCezS2vC6Cx7VVnWawdUEqFprjz26l85qOKVSvqYH45DuMrnKG31q+Vn0I2o6YdRxi2zjCIkQO0I9FbpfX+p6wQDGcy9eB9nmCQKgmncpee0KoB8LhvHuhO2xM6Dnd32ms+uIS9xp0cbpvgYfBiQDh/KK585TdkWSSr6qpgA/SehQY8BllUQePfPFjACa53SO7rjo5YCqoKoBgng+xHMoQvIJtOJJMkNPI43fIGut0H0toOmJJLQDF4C+6d098XwZcn+9ZmsO9SC96Bc5TUSvvBD/49/gDEMCEP8TccuAAAAABJRU5ErkJggg=='

const commentTitles = [
  `Own a Piece of Digital History- Winamp Is Now Selling Its Original 1.0 Skin as an NFT, Iconic Player “was the go-to music player everybody was using at the beginning of the history of digital music and was instrumental in helping the .mp3 become mainstream”.`,
  'Buyer of "Pepe the Frog" NFT files US$500,000 lawsuit after creator releases identical NFTs for free',
  '$5,100,000,000 Bitcoin Whale enters massive crypto accumulation mode',
  'Two Big Developments in Brave Browser',
  '🤡',
]

const commentContents = [
  `First of all, the sentiment in this sub concerning moons seems very __polarized__. Some people think they are a genius idea and others think they are making this sub this sub worse because of “moon farming.” which camp are you in? 

Second, how/where can you sell them. And third, how many upvotes=one moon, some people have so many when I’m sitting here at 17.

**Personally** I think Reddit is ahead of the _curve_, in a couple years I could easily see every social media platform incorporating their own coin into their interface. 

Think about it; it costs the company next to nothing, encourages users to spend more time and be more active on the platform, and capitalizes on their existing user base, skipping any need for marketing. 

From the companies point of view it seems like a no brainer.

Can people think of issues with this approach? For either the company or the consumer, because besides increased levels of spamming I don’t see much downside.`,
  'What kind of messes up world is this. *Even* if they stop you, they would need some sort of seed phrase or private key to your account in order to get the funds.',
  '🤡',
  `So real fast, I'm not a legal person and this isn't legal advice. I'm just sharing what I found out. What is civil forfeiture In the USA basically the cops can take things if the suspect it could of been used in a crime (any crime even if there is no crime going on now or in the area and any evidence). Lets put it this way, in CA there is pot shops that used armor trucks to move their money (which many stores use). Pot shops in CA is legal, but the cops on a regular bases stopped the truck for stupid things like using the turn signal too early. They use civil forfeiture to take the cash. From there in all cases they send the stuff to the gov, and the gov gives the local cops a major amount of the value of the assets. Note in some states this is illegal like NC. But I seen in the past years where federal wants to cause a loophole using DEA to force cops by law to do it. But note if you travel through states with this being legal. Note this is actually is a huge problem in the USA. Even more for unbanked people and homeless. ALL lawyers and all people I talked to in legal/law thinks this is the ultimate forum of government theft, and this should be federally illegal. That the system is proven to be extremely abused just for the reason of bonuses and the ones taking the money keep a ton of it after it went through the system. My question Can the gov force you to unlock your phone in a civil forfeiture? This giving them access to your hot wallets. Can the gov take your crypto in a civil forfeiture since it is on the blockchain? It should be noted that with 2, there is no clear answer to this. Basically it came down to it has to be tested in courts or a law maker needs to make laws clearing this up. NOTE FOR ANY LAW MAKERS THAT WANT TO HELP WHO THEY REPRESENT, AND WANT TO MAKE A BILL TO HELP THEM GET REELECTED. FIX THIS What I found out So can they take your phone or hardware wallet? The answer to this seems to be yes. Can they force you to unlock your phone? The answer to this seems to be not without a warrant. Can they brute force, hack, or do whatever to get in after they taken the device in a civil forfeiture? The answer seems to be yes. Basically, the idea is that when this happens it now becomes gov property. And if the gov wants to break in their own property or wipe their end. There isn't jack you can do to stop them expect remote format the device (seriously look into this. You can do this with most phones.) Are they likely to break into your phone/hardware wallet if they take it? While there isn't really evidence of this happening yet. The likely if it was to happen then yes. The question is, do they know of a 0 day which will allow them to get in, and that answer to this is maybe. Like I've seen videos of people recovering their funds from their hardware wallet through taking apart something like a ledger, hooking up to given things, and doing a few other things. So lets not rule out they will have some way of doing just this. Because it is likely if they take one, then they most likely are taking as many as they see. Can the gov use civil forfeiture to get the crypto itself without going after the phone/hardware wallet? Chances are is no. Like they can't demand for the given crypto since they have no way of knowing the wallet address unless if you show them or after they taken the device. They have to prove in court they suspected x was used in some way with a crime. Not knowing the address prior to rules this out. So basically, don't talk to the legal people without a lawyer and don't give them more info than needed. Note: if they use the law to take the phone or hardware wallet, then they can make a case that maybe the crypto is part of the taking since you have direct control of the crypto using your phone. Therefore the crypto could've also been used in crime in some way in the same way the phone could've been. Basically, it is the argument of can they take the truck and the music CD inside thing. How to handle the situation? Don't talk to the cops about anything you don't have to. Note the laws, but in general if they ask you to get out of the car ask if it is a command. If they say yes, then get out. If they asked for documents, then give it (don't be an idiot, just give it to them even the technical bits you don't need to. You will just PO the cop which can cause problems.) Ask them if you can leave, and that you would like to leave. This indicates you aren't volunteering your stay, and in many states they have to be reasonable about the length of the stop and many cases they won't have enough time to do something stupid. When asked questions you don't have to answer say a lawyer friend told you to not talk to the cops while being questioned or at a stop. Never agree to them searching your car or you without a warrant. Never argue with them on the side of the road, the day for that is in court (meaning if they decided to arrest you, then let them and then wait to fight it in court since it is likely you can get a big paycheck if done right). Never be open about what you have. If they take the item using civil forfeiture, then it is likely any cash will be gone forever since some of these court cases can last for years. But you can and should fight them in court because there is a growing amount of cases which is forcing judges and others to look more into this and treat it more serious. If you can't afford a lawyer to fight, then there is a few groups that you can call depending on if you have military background, extreme poverty, and so on. But to be blunt, the best way to fight this risk is by getting law makers to make civil forfeiture illegal. BTW for people visiting the USA, you could face this problem.`,
  markdownExample,
]

const commentLinks = [
  'https://fortune.com/2022/03/16/bitcoin-200k-price-prediction-crypto-outlook/',
  'https://finance.yahoo.com/news/c2x-announces-25-million-funding-120000728.html',
  'https://finance.yahoo.com/news/adopting-crypto-legal-tender-signify-101309571.html',
  'https://twitter.com/getplebbit/status/1632113706015309825',
  'https://www.youtube.com/watch?v=jfKfPfyJRdk',
]

const mediaLinks = [
  'https://upload.wikimedia.org/wikipedia/en/transcoded/b/bd/Exorcist_angiogram_scene.webm/Exorcist_angiogram_scene.webm.480p.vp9.webm',
  'https://upload.wikimedia.org/wikipedia/en/f/fa/2001_space_travel.ogv',
  'https://upload.wikimedia.org/wikipedia/en/e/e1/Don%27t_Look_Now_love_scene_.ogg',
  'https://upload.wikimedia.org/wikipedia/en/8/8a/Ellen_comes_out_airport.mp3',
  'https://upload.wikimedia.org/wikipedia/en/b/bf/Dave_Niehaus_Winning_Call_1995_AL_Division_Series.ogg',
]

const subplebbitTitles = ['The Ethereum investment community', 'Cryptography news and discussions', 'Memes', '🤡']

const subplebbitDescriptions = [
  'Welcome to /r/EthTrader, a 100% community driven sub. Here you can discuss Ethereum news, memes, investing, trading, miscellaneous market-related subjects and other relevant technology.',
  'Cryptography is the art of creating mathematical assurances for who can do what with data, including but not limited to encryption of messages such that only the key-holder can read it. Cryptography lives at an intersection of math and computer science. This subreddit covers the theory and practice of modern and *strong* cryptography, and it is a technical subreddit focused on the algorithms and implementations of cryptography.',
  'Memes',
  '🤡',
]

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
]

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
]

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
]

const postFlairs = [
  {text: 'Analysis'},
  {text: 'ADVICE', textColor: '#000000', backgroundColor: '#252850'},
  {text: 'comedy', textColor: '#FFFFFF', backgroundColor: '#23282B'},
  {text: 'General News'},
  {
    text: 'Probably a scam Probably a scam Probably a scam Probably a scam Probably a scam Probably a scam Probably a scam Probably a scam Probably a scam Probably a scam Probably a scam Probably a scam Probably a scam Probably a scam Probably a scam Probably a scam Probably a scam Probably a scam Probably a scam Probably a scam Probably a scam Probably a scam Probably a scam!!!!!!!!!!!!!!!!!!!!!!',
    textColor: '#FFFFFF',
    backgroundColor: '#5B3A29',
  },
  {text: 'education', textColor: '#000000', backgroundColor: '#4A192C'},
  {text: 'MARKETS', backgroundColor: '#F8F32B'},
  {text: 'IMPORTANT!!!', backgroundColor: '#C35831'},
  {
    text: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    backgroundColor: '#AF2B1E',
  },
  {text: 'MOON 🌕', backgroundColor: '#D36E70'},
  {text: 'video', backgroundColor: '#924E7D'},
]

const authorFlairs = [
  {text: 'SCAMMER'},
  {text: 'Medical Doctor', textColor: '#000000', backgroundColor: '#252850'},
  {text: 'pro', textColor: '#FFFFFF', backgroundColor: '#23282B'},
  {
    text: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  },
  {text: 'Probably a scammer', textColor: '#FFFFFF', backgroundColor: '#5B3A29'},
  {text: 'loser', textColor: '#000000', backgroundColor: '#4A192C'},
  {text: 'WINNER', backgroundColor: '#F8F32B'},
  {text: 'IMPORTANT VIP!!!', backgroundColor: '#C35831'},
  {
    text: 'BE CAREFUL OF THIS MAN BE CAREFUL OF THIS MAN BE CAREFUL OF THIS MAN BE CAREFUL OF THIS MAN BE CAREFUL OF THIS MAN BE CAREFUL OF THIS MAN BE CAREFUL OF THIS MAN BE CAREFUL OF THIS MAN BE CAREFUL OF THIS MAN BE CAREFUL OF THIS MAN!!!!!!!!!!!!!!!!!!',
    backgroundColor: '#AF2B1E',
  },
  {text: '🌕', backgroundColor: '#D36E70'},
  {text: 'creator', backgroundColor: '#924E7D'},
]

const reasons = [
  'SPAM',
  'this is spam',
  'repeated spamming',
  'User is a known scammer',
  'NSFW',
  'SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM SPAM',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
]

const getCidHash = async (string: string) => {
  assert(string && typeof string === 'string', `can't getCidHash '${string} not a string'`)
  const seed = await getNumberHash(string)
  const cid = await seedToCid(seed)
  return cid
}

const seedToCid = async (seed: number) => {
  assert(typeof seed === 'number' && seed !== NaN && seed >= 0, `seedToCid seed argument must be positive number not '${seed}'`)
  let base10Seed = String(seed)

  // seed base10 string is usually too small for a cid, make it longer
  // the cid is usually around 46 chars in base58, so 80 chars in base10
  const base10SeedLength = 80
  while (base10Seed.length < base10SeedLength) {
    base10Seed += base10Seed
  }
  base10Seed = base10Seed.substring(0, base10SeedLength)

  const uint8Array = uint8ArrayFromString(base10Seed, 'base10')
  const base58Cid = uint8ArrayToString(uint8Array, 'base58btc')
  return base58Cid
}

// fake hash with lots of collision for speed
const getNumberHash = async (string: string) => {
  assert(string && typeof string === 'string', `can't getNumberHash '${string} not a string'`)
  let hash = 0
  for (let i = 0; i < string.length; i++) {
    const char = string.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash &= hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

class _SeedIncrementer {
  seed: number
  numbers: number[]
  index = 0
  constructor(seed: number) {
    assert(typeof seed === 'number' && seed !== NaN && seed >= 0, `getNumberBetween seed argument must be positive number not '${seed}'`)
    this.seed = seed
    this.numbers = String(seed)
      .split('')
      .map((number) => Number(number))
  }
  increment() {
    this.index++
    const multiplier = this.numbers[this.index % this.numbers.length] + this.index
    return Math.round(this.seed / multiplier)
  }
}
export const SeedIncrementer = (seed: number) => new _SeedIncrementer(seed)

const getNumberBetween = async (min: number, max: number, seed: number) => {
  assert(typeof seed === 'number' && seed !== NaN && seed >= 0, `getNumberBetween seed argument must be positive number not '${seed}'`)

  // if the string is exponent, remove chars
  if (String(seed).match(/[^0-9]/)) {
    throw Error(`getNumberBetween seed too large '${seed}'`)
  }

  const number = Number('0.' + seed)
  return Math.floor(number * (max - min + 1) + min)
}

const getArrayItem = async (array: any[], seed: number) => {
  // const index = await getNumberBetween(0, array.length - 1, seed)
  const index = seed % array.length
  return array[index]
}

export const getImageUrl = async (_seed: number) => {
  assert(typeof _seed === 'number' && _seed !== NaN && _seed >= 0, `getImageUrl seed argument must be positive number not '${_seed}'`)
  const seed = SeedIncrementer(_seed)
  const jpg = `https://picsum.photos/seed/${await getNumberBetween(10, 2000, seed.increment())}/${await getNumberBetween(
    10,
    2000,
    seed.increment()
  )}/${await getNumberBetween(10, 2000, seed.increment())}.jpg`

  const webp = `https://picsum.photos/seed/${await getNumberBetween(10, 2000, seed.increment())}/${await getNumberBetween(
    10,
    2000,
    seed.increment()
  )}/${await getNumberBetween(10, 2000, seed.increment())}.webp`

  const imageUrls = [
    // jpg & webp
    jpg,
    jpg,
    webp,
    webp,
    'https://samplelib.com/lib/preview/png/sample-bumblebee-400x300.png', // png
    'https://c.tenor.com/WHs8ooxWJUIAAAAM/really-great-example-right-here-echo-gaming.gif', // gif
    'https://filesamples.com/samples/image/bmp/sample_640%C3%97426.bmp', // bmp
    'https://brokensite.xyz/images/dog.png', // broken image
    'https://brokensite.xyz/images/dog.jpeg', // broken jpeg
  ]
  const imageUrl = (await getArrayItem(imageUrls, seed.increment())) + (await getArrayItem(urlSuffixes, seed.increment()))
  return imageUrl
}

const getAuthorAddress = async (_seed: number) => {
  assert(typeof _seed === 'number' && _seed !== NaN && _seed >= 0, `getAuthorAddress seed argument must be positive number not '${_seed}'`)
  const seed = SeedIncrementer(_seed)
  const hasEns = await getArrayItem([true, false, false, false], seed.increment())
  if (hasEns) {
    const text = await getArrayItem([...firstNames, ...displayNames], seed.increment())
    return (text.toLowerCase().replace(/[^a-z0-9]/g, '') || 'john') + '.eth'
  } else {
    const address = await seedToCid(seed.increment())
    return address
  }
}

const getAuthor = async (seed: string) => {
  const authorNumberSeed = SeedIncrementer(await getNumberHash(seed))
  const author: any = {
    address: await getAuthorAddress(authorNumberSeed.increment()),
  }
  author.shortAddress = author.address.endsWith('.eth') ? author.address : author.address.substring(8, 20)
  const hasDisplayName = await getArrayItem([true, true, true, false], authorNumberSeed.increment())
  if (hasDisplayName) {
    author.displayName = await getArrayItem(displayNames, authorNumberSeed.increment())
  }
  const rareTrue = [true, false, false, false, false, false, false, false]
  const hasNftAvatar = await getArrayItem(rareTrue, authorNumberSeed.increment())
  if (hasNftAvatar) {
    author.avatar = {
      chainTicker: 'eth',
      address: await getArrayItem(
        [
          '0xed5af388653567af2f388e6224dc7c4b3241c544',
          '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
          '0x60e4d786628fea6478f785a6d7e704777c86a7c6',
          '0x79fcdef22feed20eddacbb2587640e45491b757f',
          '0x0000000000000000000000000000000000000dead',
        ],
        authorNumberSeed.increment()
      ),
      index: await getNumberBetween(1, 2000, authorNumberSeed.increment()),
    }
  }
  const hasFlair = await getArrayItem(rareTrue, authorNumberSeed.increment())
  if (hasFlair) {
    author.flair = await getArrayItem(authorFlairs, authorNumberSeed.increment())
  }
  return author
}

const getPostContent = async (seed: string) => {
  const postNumberSeed = SeedIncrementer(await getNumberHash(seed))
  const postContent: any = {
    depth: 0,
    author: await getAuthor(String(postNumberSeed)),
    title: await getArrayItem(commentTitles, postNumberSeed.increment()),
  }
  const hasFlair = await getArrayItem([true, false, false, false], postNumberSeed.increment())
  if (hasFlair) {
    postContent.flair = await getArrayItem(postFlairs, postNumberSeed.increment())
  }
  let isLinkPost = await getArrayItem([true, false], postNumberSeed.increment())
  if (doubleMedia && !isLinkPost) {
    isLinkPost = await getArrayItem([true, false], postNumberSeed.increment())
  }
  if (isLinkPost) {
    postContent.link = await getArrayItem(commentLinks, postNumberSeed.increment())
    let linkIsImage = await getArrayItem([true, false], postNumberSeed.increment())
    if (doubleMedia && !linkIsImage) {
      linkIsImage = await getArrayItem([true, false], postNumberSeed.increment())
    }
    if (linkIsImage) {
      postContent.link = await getImageUrl(postNumberSeed.increment())

      // add video and audio
      const imageIsMedia = await getArrayItem([true, false, false, false], postNumberSeed.increment())
      if (imageIsMedia) {
        postContent.link = await getArrayItem(mediaLinks, postNumberSeed.increment())
      }
    }
    const hasThumbnail = await getArrayItem([true, true, true, false], postNumberSeed.increment())
    if (!linkIsImage && hasThumbnail) {
      postContent.thumbnailUrl = await getImageUrl(postNumberSeed.increment())
    }
  }
  // else is text post
  else {
    postContent.content = await getArrayItem(commentContents, postNumberSeed.increment())
    const hasQuote = await getArrayItem([true, false, false, false], postNumberSeed.increment())
    if (hasQuote) {
      const max = 7
      const lines = postContent.content.split('\n')
      for (const i in lines) {
        const lineIsQuote = await getArrayItem([true, false], postNumberSeed.increment())
        if (lineIsQuote) {
          lines[i] = '>' + lines[i]
        }
        if (Number(i) > max) {
          break
        }
      }
      postContent.content = lines.join('\n')
    }
  }
  return postContent
}

const getReplyContent = async (getReplyContentOptions: any, seed: string) => {
  const replyNumberSeed = SeedIncrementer(await getNumberHash(seed))
  const {depth, parentCid, postCid} = getReplyContentOptions
  const author = await getAuthor(String(replyNumberSeed.seed))
  let content = await getArrayItem(commentContents, replyNumberSeed.increment())

  const hasQuote = await getArrayItem([true, false, false, false], replyNumberSeed.increment())
  if (hasQuote) {
    const max = 7
    const lines = content.split('\n')
    for (const i in lines) {
      const lineIsQuote = await getArrayItem([true, false], replyNumberSeed.increment())
      if (lineIsQuote) {
        lines[i] = '>' + lines[i]
      }
      if (Number(i) > max) {
        break
      }
    }
    content = lines.join('\n')
  }

  const replyContent: any = {content, author, depth, parentCid, postCid}

  const hasLink = await getArrayItem([true, false, false, false], replyNumberSeed.increment())
  if (hasLink) {
    replyContent.link = await getArrayItem(commentLinks, replyNumberSeed.increment())
    const linkIsImage = await getArrayItem([true, false], replyNumberSeed.increment())
    if (linkIsImage) {
      replyContent.link = await getImageUrl(replyNumberSeed.increment())

      // add video and audio
      const imageIsMedia = await getArrayItem([true, false, false, false], replyNumberSeed.increment())
      if (imageIsMedia) {
        replyContent.link = await getArrayItem(mediaLinks, replyNumberSeed.increment())
      }
    }
    const hasThumbnail = await getArrayItem([true, true, true, false], replyNumberSeed.increment())
    if (!linkIsImage && hasThumbnail) {
      replyContent.thumbnailUrl = await getImageUrl(replyNumberSeed.increment())
    }
  }

  const hasTitle = await getArrayItem([true, false, false, false, false, false, false], replyNumberSeed.increment())
  if (hasTitle) {
    replyContent.title = await getArrayItem(commentTitles, replyNumberSeed.increment())
  }

  return replyContent
}

const getSubplebbitContent = async (seed: string) => {
  const subplebbitNumberSeed = SeedIncrementer(await getNumberHash(seed))
  const subplebbit: any = {
    pubsubTopic: await seedToCid(subplebbitNumberSeed.seed),
  }

  const hasChallengeTypes = await getArrayItem([true, false], subplebbitNumberSeed.increment())
  if (hasChallengeTypes) {
    subplebbit.challengeTypes = ['image']
  }

  const hasRoles = await getArrayItem([true, false], subplebbitNumberSeed.increment())
  if (hasRoles) {
    subplebbit.roles = {
      [await getAuthorAddress(subplebbitNumberSeed.increment())]: {role: 'owner'},
      [await getAuthorAddress(subplebbitNumberSeed.increment())]: {role: 'admin'},
      [await getAuthorAddress(subplebbitNumberSeed.increment())]: {role: 'moderator'},
      [await getAuthorAddress(subplebbitNumberSeed.increment())]: {role: 'moderator'},
      [await getAuthorAddress(subplebbitNumberSeed.increment())]: {role: 'moderator'},
      [await getAuthorAddress(subplebbitNumberSeed.increment())]: {role: 'moderator'},
      [await getAuthorAddress(subplebbitNumberSeed.increment())]: {role: 'moderator'},
      [await getAuthorAddress(subplebbitNumberSeed.increment())]: {role: 'moderator'},
    }
  }

  const title = await getArrayItem([undefined, ...subplebbitTitles], subplebbitNumberSeed.increment())
  if (title) {
    subplebbit.title = title
  }
  const description = await getArrayItem([undefined, ...subplebbitDescriptions], subplebbitNumberSeed.increment())
  if (description) {
    subplebbit.description = description
  }

  const hasPostFlairs = await getArrayItem([true, false], subplebbitNumberSeed.increment())
  if (hasPostFlairs) {
    subplebbit.flairs = {post: postFlairs}
  }
  const hasAuthorFlairs = await getArrayItem([true, false], subplebbitNumberSeed.increment())
  if (hasAuthorFlairs) {
    subplebbit.flairs = {post: subplebbit.flairs?.post, author: authorFlairs}
  }

  const hasSuggested = await getArrayItem([true, false], subplebbitNumberSeed.increment())
  if (hasSuggested) {
    subplebbit.suggested = {
      primaryColor: (await getArrayItem(postFlairs, subplebbitNumberSeed.increment())).backgroundColor,
      secondaryColor: (await getArrayItem(postFlairs, subplebbitNumberSeed.increment())).backgroundColor,
      avatarUrl: await getArrayItem([undefined, await getImageUrl(subplebbitNumberSeed.increment())], subplebbitNumberSeed.increment()),
      bannerUrl: await getArrayItem([undefined, await getImageUrl(subplebbitNumberSeed.increment())], subplebbitNumberSeed.increment()),
      backgroundUrl: await getArrayItem([undefined, await getImageUrl(subplebbitNumberSeed.increment())], subplebbitNumberSeed.increment()),
      language: await getArrayItem([undefined, undefined, 'en', 'en', 'es', 'ru'], subplebbitNumberSeed.increment()),
    }
  }

  const hasFeatures = await getArrayItem([true, false], subplebbitNumberSeed.increment())
  if (hasFeatures) {
    subplebbit.features = {
      noVideos: await getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
      noSpoilers: await getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
      noImages: await getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
      noVideoReplies: await getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
      noSpoilerReplies: await getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
      noImageReplies: await getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
      noPolls: await getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
      noCrossposts: await getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
      noUpvotes: await getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
      noDownvotes: await getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
      noAuthors: await getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
      anonymousAuthors: await getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
      noNestedReplies: await getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
      safeForWork: await getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
      authorFlairs: await getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
      requireAuthorFlairs: await getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
      postFlairs: await getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
      requirePostFlairs: await getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
      noMarkdownImages: await getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
      noMarkdownVideos: await getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
      markdownImageReplies: await getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
      markdownVideoReplies: await getArrayItem([undefined, undefined, true, false], subplebbitNumberSeed.increment()),
    }
  }

  const hasRules = await getArrayItem([true, false], subplebbitNumberSeed.increment())
  if (hasRules) {
    subplebbit.rules = [
      'no spam',
      'be nice',
      'Do not link to CNN.',
      'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      'OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO OOOOOOOOOO ',
    ]
  }

  const isOnline = await getArrayItem([true, false], subplebbitNumberSeed.increment())
  if (isOnline) {
    // updated in last 1h
    subplebbit.updatedAt = Math.round(Date.now() / 1000) - (await getNumberBetween(1, 60 * 60, subplebbitNumberSeed.increment()))
  } else {
    // updated in last month
    subplebbit.updatedAt = Math.round(Date.now() / 1000) - (await getNumberBetween(60 * 60, 60 * 60 * 24 * 30, subplebbitNumberSeed.increment()))
  }
  subplebbit.createdAt = subplebbit.updatedAt - (await getNumberBetween(1, 60 * 60 * 24 * 3000, subplebbitNumberSeed.increment()))

  return subplebbit
}

// for debugging slow bulk reply generation
let replyLoopCount = 0

const getCommentUpdateContent = async (comment: any) => {
  const commentUpdateSeedNumber = SeedIncrementer(await getNumberHash(comment.cid))
  const upvotesPerUpdate = await getNumberBetween(1, 1000, commentUpdateSeedNumber.increment())
  const downvotesPerUpdate = await getNumberBetween(1, 1000, commentUpdateSeedNumber.increment())

  const commentUpdateContent: any = {}
  // simulate finding vote counts on an IPNS record
  commentUpdateContent.upvoteCount = typeof comment.upvoteCount === 'number' ? comment.upvoteCount + upvotesPerUpdate : upvotesPerUpdate
  commentUpdateContent.downvoteCount = typeof comment.downvoteCount === 'number' ? comment.downvoteCount + downvotesPerUpdate : downvotesPerUpdate

  // find the number of replies
  commentUpdateContent.replyCount = 0
  const hasReplies = await getArrayItem([true, false, false, false], commentUpdateSeedNumber.increment())
  if (hasReplies) {
    commentUpdateContent.replyCount = await getNumberBetween(0, 30, commentUpdateSeedNumber.increment())
    if (comment.depth > 0) {
      commentUpdateContent.replyCount = commentUpdateContent.replyCount / (comment.depth + 1) ** 2
    }
    if (commentUpdateContent.replyCount < 1) {
      commentUpdateContent.replyCount = 0
    }
    commentUpdateContent.replyCount = Math.round(commentUpdateContent.replyCount)
  }

  // simulate finding replies from IPNS record
  commentUpdateContent.replies = {pages: {topAll: {nextCid: undefined, comments: []}}}
  const getReplyContentOptions = {depth: comment.depth + 1, parentCid: comment.cid, postCid: comment.cid}
  let replyCount = commentUpdateContent.replyCount
  while (replyCount-- > 0) {
    // console.log({replyLoopCount: replyLoopCount++, replyCount: commentUpdateContent.replyCount, depth: comment.depth, cid: comment.cid, index: replyCount})
    const replyContent = await getReplyContent(getReplyContentOptions, String(commentUpdateSeedNumber.increment()))
    const reply = {
      cid: await seedToCid(commentUpdateSeedNumber.increment()),
      ipnsName: await seedToCid(commentUpdateSeedNumber.increment()),
      timestamp: await getNumberBetween(comment.timestamp, NOW, commentUpdateSeedNumber.increment()),
      subplebbitAddress: comment.subplebbitAddress || 'memes.eth',
      ...replyContent,
    }
    const replyUpdateContent = await getCommentUpdateContent(reply)
    commentUpdateContent.replies.pages.topAll.comments.push({...reply, ...replyUpdateContent})
  }

  const rareTrue = [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]

  const isSpoiler = await getArrayItem(rareTrue, commentUpdateSeedNumber.increment())
  if (isSpoiler) {
    commentUpdateContent.spoiler = true
  }

  const isEdited = await getArrayItem(rareTrue, commentUpdateSeedNumber.increment())
  if (isEdited && !comment.edit) {
    commentUpdateContent.edit = {
      timestamp: comment.timestamp + 60 * 30,
      reason: 'I wanted to know why the downvotes?',
    }
    commentUpdateContent.original = {
      content: comment.content,
    }
    commentUpdateContent.content = (comment.content || '') + ' WHY DOWNVOTES!?'
  }

  const isDeleted = await getArrayItem(rareTrue, commentUpdateSeedNumber.increment())
  const isPinned = await getArrayItem(rareTrue, commentUpdateSeedNumber.increment())
  const isRemoved = await getArrayItem(rareTrue, commentUpdateSeedNumber.increment())
  const isLocked = await getArrayItem(rareTrue, commentUpdateSeedNumber.increment())

  if (isDeleted) {
    commentUpdateContent.deleted = true
  } else if (isPinned) {
    commentUpdateContent.pinned = true
  } else if (isRemoved) {
    commentUpdateContent.removed = true
    const hasReason = await getArrayItem([true, false], commentUpdateSeedNumber.increment())
    if (hasReason) {
      commentUpdateContent.reason = await getArrayItem(reasons, commentUpdateSeedNumber.increment())
    }
  } else if (isLocked && comment.depth === 0) {
    commentUpdateContent.locked = true
    const hasReason = await getArrayItem([true, false], commentUpdateSeedNumber.increment())
    if (hasReason) {
      commentUpdateContent.reason = await getArrayItem(reasons, commentUpdateSeedNumber.increment())
    }
  }

  commentUpdateContent.updatedAt = Math.round(Date.now() / 1000)

  return commentUpdateContent
}

const getCommentsPage = async (pageCid: string, subplebbit: any) => {
  const commentsPageSeedNumber = SeedIncrementer(await getNumberHash(pageCid))
  const page: any = {
    nextCid: await seedToCid(commentsPageSeedNumber.seed),
    comments: [],
  }
  const postCount = 100
  let index = 0
  while (index++ < postCount) {
    let comment = {
      timestamp: await getNumberBetween(NOW - DAY * 30, NOW, commentsPageSeedNumber.increment()),
      cid: await seedToCid(commentsPageSeedNumber.increment()),
      subplebbitAddress: subplebbit.address,
      depth: 0,
    }
    comment = {...comment, ...(await getPostContent(comment.cid)), ...(await getCommentUpdateContent(comment))}
    page.comments.push(comment)
  }
  return page
}

// array of subplebbits probably created by the user
const createdSubplebbits: any = {}

class Plebbit extends EventEmitter {
  async createSigner() {
    return {
      privateKey:
        'private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key private key',
      address: await getCidHash(String(Math.random())),
    }
  }

  async createSubplebbit(createSubplebbitOptions: any) {
    // if the only argument is {address}, the user didn't create the sub, it's a fetched sub
    if (createSubplebbitOptions?.address && Object.keys(createSubplebbitOptions).length === 1) {
      return new Subplebbit(createSubplebbitOptions)
    }

    const signer = await this.createSigner()
    const subplebbit = new Subplebbit({signer, ...createSubplebbitOptions})

    // keep a list of subplebbits the user probably created himself to use with listSubplebbits
    if (!createSubplebbitOptions?.address) {
      createdSubplebbits[subplebbit.address || ''] = subplebbit
    }

    return subplebbit
  }

  async getSubplebbit(subplebbitAddress: string) {
    await simulateLoadingTime()
    const createSubplebbitOptions = {
      address: subplebbitAddress,
    }
    const subplebbit: any = new Subplebbit(createSubplebbitOptions)
    const subplebbitPagesSeedNumber = SeedIncrementer(await getNumberHash(subplebbitAddress + 'pages'))
    const hotPageCid = await seedToCid(subplebbitPagesSeedNumber.increment())
    subplebbit.posts.pages.hot = await getCommentsPage(hotPageCid, subplebbit)
    subplebbit.posts.pageCids = {
      hot: await seedToCid(subplebbitPagesSeedNumber.increment()),
      topAll: await seedToCid(subplebbitPagesSeedNumber.increment()),
      new: await seedToCid(subplebbitPagesSeedNumber.increment()),
    }

    const subplebbitContent = await getSubplebbitContent(subplebbitAddress)
    // add extra props
    for (const prop in subplebbitContent) {
      subplebbit[prop] = subplebbitContent[prop]
    }
    return subplebbit
  }

  async listSubplebbits() {
    const subplebbitAddresses = Object.keys(createdSubplebbits)
    return subplebbitAddresses
  }

  async createComment(createCommentOptions: any) {
    return new Comment(createCommentOptions)
  }

  async getComment(commentCid: string) {
    await simulateLoadingTime()
    const commentSeedNumber = SeedIncrementer(await getNumberHash(commentCid + 'getcomment'))
    let commentContent: any = await getPostContent(commentCid + 'postcontent')
    const isReply = await getArrayItem([true, false, false, false], commentSeedNumber.increment())
    if (isReply) {
      const depth = await getNumberBetween(1, 10, commentSeedNumber.increment())
      const parentCid = await seedToCid(commentSeedNumber.increment())
      const postCid = depth === 1 ? parentCid : await seedToCid(commentSeedNumber.increment())
      const getReplyContentOptions = {depth, parentCid, postCid}
      commentContent = await getReplyContent(getReplyContentOptions, commentCid + 'replycontent')
    }
    const createCommentOptions = {
      cid: commentCid,
      ipnsName: await seedToCid(commentSeedNumber.increment()),
      timestamp: await getNumberBetween(NOW - DAY * 30, NOW, commentSeedNumber.increment()),
      subplebbitAddress: 'memes.eth',
      ...commentContent,
    }
    const comment = new Comment(createCommentOptions)
    // add missing props from createCommentOptions
    for (const prop in createCommentOptions) {
      // @ts-ignore
      comment[prop] = createCommentOptions[prop]
    }
    return comment
  }

  async createVote() {
    return new Vote()
  }

  async createCommentEdit() {
    return new CommentEdit()
  }

  async createSubplebbitEdit() {
    return new SubplebbitEdit()
  }

  async fetchCid(cid: string) {
    if (cid?.startsWith('statscid')) {
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
      })
    }
    throw Error(`plebbit.fetchCid not implemented in mock content for cid '${cid}'`)
  }
}

class Pages {
  pageCids: any = {}
  pages: any = {}
  subplebbit: any
  comment: any

  constructor(pagesOptions?: any) {
    Object.defineProperty(this, 'subplebbit', {value: pagesOptions?.subplebbit, enumerable: false})
    Object.defineProperty(this, 'comment', {value: pagesOptions?.comment, enumerable: false})
  }

  async getPage(pageCid: string) {
    // need to wait twice otherwise react renders too fast and fetches too many pages in advance
    await simulateLoadingTime()
    return getCommentsPage(pageCid, this.subplebbit)
  }
}

class Subplebbit extends EventEmitter {
  address: string | undefined
  title: string | undefined
  description: string | undefined
  pageCids: any
  posts: Pages
  pubsubTopic: string | undefined
  createdAt: number | undefined
  updatedAt: number | undefined
  challengeTypes: string[] | undefined
  roles: any | undefined
  flairs: any | undefined
  suggested: any | undefined
  features: any | undefined
  rules: string[] | undefined
  signer: any | undefined
  shortAddress: string | undefined
  statsCid: string | undefined
  _getSubplebbitOnFirstUpdate = false
  updatingState: string | undefined

  constructor(createSubplebbitOptions?: any) {
    super()
    this.address = createSubplebbitOptions?.address
    this.pubsubTopic = createSubplebbitOptions?.pubsubTopic
    this.createdAt = createSubplebbitOptions?.createdAt
    this.updatedAt = createSubplebbitOptions?.updatedAt
    this.challengeTypes = createSubplebbitOptions?.challengeTypes
    this.roles = createSubplebbitOptions?.roles
    this.flairs = createSubplebbitOptions?.flairs
    this.suggested = createSubplebbitOptions?.suggested
    this.features = createSubplebbitOptions?.features
    this.rules = createSubplebbitOptions?.rules
    this.title = createSubplebbitOptions?.title
    this.description = createSubplebbitOptions?.description
    this.statsCid = 'statscid'

    for (const prop in createSubplebbitOptions) {
      if (createSubplebbitOptions[prop]) {
        // @ts-ignore
        this[prop] = createSubplebbitOptions[prop]
      }
    }
    this.posts = new Pages({subplebbit: this})

    // add subplebbit.posts from createSubplebbitOptions
    if (createSubplebbitOptions?.posts?.pages) {
      this.posts.pages = createSubplebbitOptions?.posts?.pages
    }
    if (createSubplebbitOptions?.posts?.pageCids) {
      this.posts.pageCids = createSubplebbitOptions?.posts?.pageCids
    }

    if (!this.address && this.signer?.address) {
      this.address = this.signer.address
    }
    this.shortAddress = this.address?.endsWith('.eth') ? this.address : this.address?.substring(8, 20)

    Object.defineProperty(this, 'updating', {enumerable: false, writable: true})
    // @ts-ignore
    this.updating = false

    // if the only argument is {address}, it means the first update should use getSubplebbit()
    if (createSubplebbitOptions?.address && Object.keys(createSubplebbitOptions).length === 1) {
      this._getSubplebbitOnFirstUpdate = true
    }
  }

  async edit(editSubplebbitOptions: any) {
    assert(editSubplebbitOptions && typeof editSubplebbitOptions === 'object', `invalid editSubplebbitOptions '${editSubplebbitOptions}'`)
    for (const prop in editSubplebbitOptions) {
      if (editSubplebbitOptions[prop]) {
        // @ts-ignore
        this[prop] = editSubplebbitOptions[prop]
      }
    }
  }

  async update() {
    // is ipnsName is known, look for updates and emit updates immediately after creation
    if (!this.address) {
      throw Error(`can't update without subplebbit.address`)
    }
    // don't update twice
    // @ts-ignore
    if (this.updating) {
      return
    }
    // @ts-ignore
    this.updating = true
    this.updatingState = 'fetching-ipns'
    this.emit('updatingstatechange', 'fetching-ipns')
    simulateLoadingTime().then(() => {
      this.simulateUpdateEvent()
    })
  }

  async delete() {
    if (this.address) {
      delete createdSubplebbits[this.address]
    }
  }

  simulateUpdateEvent() {
    if (this._getSubplebbitOnFirstUpdate) {
      return this.simulateGetSubplebbitOnFirstUpdateEvent()
    }
    this.emit('update', this)
  }

  async simulateGetSubplebbitOnFirstUpdateEvent() {
    this._getSubplebbitOnFirstUpdate = false

    // @ts-ignore
    const subplebbit = await new Plebbit().getSubplebbit(this.address)
    const props = JSON.parse(JSON.stringify(subplebbit))
    for (const prop in props) {
      if (prop.startsWith('_')) {
        continue
      }
      // @ts-ignore
      this[prop] = props[prop]
    }
    this.updatingState = 'succeeded'
    this.emit('update', this)
    this.emit('updatingstatechange', 'succeeded')

    this.simulateUpdateEvent()
  }
}

let challengeRequestCount = 0
let challengeAnswerCount = 0

class Publication extends EventEmitter {
  timestamp: number | undefined
  content: string | undefined
  cid: string | undefined

  constructor() {
    super()
    Object.defineProperty(this, 'challengeRequestId', {enumerable: false, writable: true})
    Object.defineProperty(this, 'challengeAnswerId', {enumerable: false, writable: true})
    // @ts-ignore
    this.challengeRequestId = `r${++challengeRequestCount}`
    // @ts-ignore
    this.challengeAnswerId = `a${++challengeAnswerCount}`
  }

  async publish() {
    await simulateLoadingTime()
    await this.simulateChallengeEvent()
  }

  async simulateChallengeEvent() {
    const challenges: any = []
    // @ts-ignore
    const challengeCount = await getNumberBetween(1, 3, await getNumberHash(this.challengeRequestId))
    while (challenges.length < challengeCount) {
      challenges.push({type: 'image/png', challenge: captchaImageBase64})
    }
    const challengeMessage = {
      type: 'CHALLENGE',
      // @ts-ignore
      challengeRequestId: this.challengeRequestId,
      challenges,
    }
    this.emit('challenge', challengeMessage, this)
  }

  async publishChallengeAnswers(challengeAnswers: string[]) {
    await simulateLoadingTime()
    this.simulateChallengeVerificationEvent()
  }

  async simulateChallengeVerificationEvent() {
    // if publication has content, create cid for this content and add it to comment and challengeVerificationMessage
    // @ts-ignore
    this.cid = this.content || this.title || this.link ? await getCidHash(this.content + this.title + this.link + 'cid') : undefined
    const publication = this.cid && {cid: this.cid}

    const challengeVerificationMessage = {
      type: 'CHALLENGEVERIFICATION',
      // @ts-ignore
      challengeRequestId: this.challengeRequestId,
      // @ts-ignore
      challengeAnswerId: this.challengeAnswerId,
      challengeSuccess: true,
      publication,
    }
    this.emit('challengeverification', challengeVerificationMessage, this)
  }
}

class Comment extends Publication {
  author: any
  ipnsName: string | undefined
  upvoteCount: number | undefined
  downvoteCount: number | undefined
  content: string | undefined
  parentCid: string | undefined
  replies: any
  replyCount: number | undefined
  postCid: string | undefined
  depth: number | undefined
  spoiler: boolean | undefined
  flair: any | undefined
  pinned: boolean | undefined
  locked: boolean | undefined
  deleted: boolean | undefined
  removed: boolean | undefined
  edit: any
  original: any
  reason: string | undefined
  shortCid: string | undefined
  _getCommentOnFirstUpdate = false
  updatingState: string | undefined

  constructor(createCommentOptions?: any) {
    super()
    this.ipnsName = createCommentOptions?.ipnsName
    this.cid = createCommentOptions?.cid
    this.upvoteCount = createCommentOptions?.upvoteCount
    this.downvoteCount = createCommentOptions?.downvoteCount
    this.content = createCommentOptions?.content
    this.author = createCommentOptions?.author
    this.timestamp = createCommentOptions?.timestamp
    this.parentCid = createCommentOptions?.parentCid
    this.postCid = createCommentOptions?.postCid
    this.parentCid = createCommentOptions?.parentCid
    this.depth = createCommentOptions?.depth
    this.spoiler = createCommentOptions?.spoiler
    this.flair = createCommentOptions?.flair
    this.pinned = createCommentOptions?.pinned
    this.locked = createCommentOptions?.locked
    this.deleted = createCommentOptions?.deleted
    this.removed = createCommentOptions?.removed
    this.reason = createCommentOptions?.reason
    if (this.cid) {
      this.shortCid = this.cid.substring(2, 14)
    }

    Object.defineProperty(this, 'updating', {enumerable: false, writable: true})
    // @ts-ignore
    this.updating = false

    // add missing props from createCommentOptions
    for (const prop in createCommentOptions) {
      // @ts-ignore
      this[prop] = createCommentOptions[prop]
    }

    // if the only argument is {cid}, it means the first update should use getComment()
    if (createCommentOptions?.cid && Object.keys(createCommentOptions).length === 1) {
      this._getCommentOnFirstUpdate = true
    }
  }

  async update() {
    // don't update twice
    // @ts-ignore
    if (this.updating) {
      return
    }
    // @ts-ignore
    this.updating = true
    this.updatingState = 'fetching-ipfs'
    this.emit('updatingstatechange', 'fetching-ipfs')
    ;(async () => {
      while (true) {
        await simulateLoadingTime()
        this.simulateUpdateEvent()
      }
    })()
  }

  async simulateUpdateEvent() {
    assert(this.cid, `invalid comment.cid '${this.cid}' can't simulateUpdateEvent`)
    if (this._getCommentOnFirstUpdate) {
      return this.simulateGetCommentOnFirstUpdateEvent()
    }

    const commentUpdateContent = await getCommentUpdateContent(this)
    for (const prop in commentUpdateContent) {
      // @ts-ignore
      this[prop] = commentUpdateContent[prop]
    }
    this.shortCid = this.cid.substring(2, 14)
    this.updatingState = 'succeeded'
    this.emit('update', this)
    this.emit('updatingstatechange', 'succeeded')
  }

  async simulateGetCommentOnFirstUpdateEvent() {
    this._getCommentOnFirstUpdate = false

    // @ts-ignore
    const comment = await new Plebbit().getComment(this.cid)
    const props = JSON.parse(JSON.stringify(comment))
    for (const prop in props) {
      if (prop.startsWith('_')) {
        continue
      }
      // @ts-ignore
      this[prop] = props[prop]
    }
    this.emit('update', this)
  }
}

class Vote extends Publication {}

export class CommentEdit extends Publication {}

export class SubplebbitEdit extends Publication {}

export default async function () {
  return new Plebbit()
}
