*Telegram group for this repo https://t.me/plebbitreact*

### IndexedDb Schema

> Each top level object is its own key-value store database.

```
  Accounts {
    [key: accountId]: Account
  }
  AccountsMetadata {
    accountIds: strings[] // this array sets the order of the accounts
    activeAccountId: string // the default account to use with all hooks and actions
    accountNamesToAccountIds: {[key: accountName]: accountId}
  }
  AccountsComments (each database named accountComments-[accountId]) {
    [key: commentIndex]: AccountComment // store in array because cid is still unknown
  }
  AccountsCommentsReplies (each database named accountCommentsReplies-[accountId]) {
    [key: commentCid]: AccountCommentReply // keep replies to own account comments in a separate last recently used database because they should be cached for a different amount of time than regular comments and account comments
  }
  AccountsVotes (each database named accountVotes-[accountId]) {
    [key: commentCid]: AccountVote
  }
  Subplebbits {
    [key: subplebbitAddress]: Subplebbit // last recently used database, delete oldest data
  }
  Comments {
    [key: commentCid]: Comment // last recently used database, delete oldest data, different from AccountsComments that never expire
  }
  SubplebbitPages {
    [key: pageCid]: SubplebbitPage // last recently used database, delete oldest data
  }
```

### Contexts

```
AccountsContext (store in indexeddb permanently) {
  accounts: {[key: accountName]: Account}
  accountNames: string[]
  activeAccountName: string
  accountNamesToAccountIds: {[key: accountName]: accountId}
  accountsComments: {[key: accountName]: AccountComment[]} // cid of comment unknown at time of posting, so store it in array
  accountsVotes: {[key: accountName]: {[key: commentCid]: AccountVote}}
  accountsCommentsReplies: {[key: accountName]: {[key: replyCid]: AccountCommentReply}}
  accountsActions: AccountsActions
  // internal
  addCidToAccountComment(comment: Comment)
  // internal
  markAccountNotificationsAsRead(account: Account)
}
CommentsContext (store in indexeddb last recently used) {
  comments: {[key: commentCid]: Comment}
  // internal
  addCommentToContext(commentCid)
}
SubplebbitsContext (store in indexeddb last recently used) {
  subplebbits: {[key: subplebbitAddress]: Subplebbit}
  // internal
  addSubplebbitToContext(subplebbitAddress)
}
FeedsContext (no persistant storage, can be rebuilt from Subplebbits and SubplebbitPages databases) {
  bufferedFeeds: {[key: feedName]: Comment[]}
  loadedFeeds: {[key: feedName]: Comment[]}
  feedsHaveMore: {[key: feedName]: boolean}
  // internal
  addFeedToContext(feedName, subplebbitAddresses, sortType, account)
}
```

### Hooks

#### Accounts Hooks
```
useAccount(accountName?: string): Account | undefined
useAccountComments(accountCommentsOptions: AccountsCommentsOptions): Comment[] // export or display list of own comments
useAccountVotes(accountVotesOptions: AccountsCommentsOptions): Vote[]  // export or display list of own votes
useAccountVote(commentCid: string, accountName?: string): Vote // know if you already voted on some comment
useAccounts(): Account[]
useAccountsActions(): AccountsActions
useAccountNotifications(accountName?: string): Notification[]
```
#### Comments Hooks
```
useComment(commentCid: string, accountName?: string): Comment | undefined // should contain not yet publish replies from your own account unless they are older than X hours
useComments(commentCid[],  accountName?: string): Comment[]
```
#### Subplebbits Hooks
```
useSubplebbit(subplebbitAddress): Subplebbit | undefined // should contain not yet published posts from your own account unless they are older than X hours
useSubplebbits(subplebbitAddress[]): Subplebbits[]
```
#### Feeds Hooks
```
useFeed(subplebbitAddresses: string[], sortType?: string): {feed: Feed, loadMore: function, hasMore: boolean}
useBufferedFeeds(feedsOptions: UseBufferedFeedOptions[]) // preload or buffer feeds in the background, so they load faster when you call `useFeed`
useAuthorComments(authorAddress) // there are no way to fetch all comments from an author, you need to build it from your own cache
```

### Schema

> For full schema see https://github.com/plebbit/plebbit-js#schema

```
AccountsActions {
  createAccount(account: Account)
  deleteAccount(accountName: string)
  setAccount(account: Account)
  setActiveAccount(accountName: string)
  setAccountsOrder(accountNames: string[])
  importAccount(serializedAccount: string | buffer)
  exportAccount(accountName: string) // don't allow undefined to prevent catastrophic bugs
  publishComment(comment: Comment, accountName?: string)
  publishCommentEdit(comment: Comment, accountName?: string)
  publishVote(vote: Vote, accountName?: string)
  publishReport(report: Report, accountName?: string)
  deleteComment(commentCidOrAccountCommentIndex: string | number, accountName?: string)
  blockAddress(address: string, accountName?: string) // block a subplebbit address or author address from showing on your feed
  limitAddress(address: string | number, limitPercent: number, accountName?: string) // instead of blocking, limit the percent of your feed an address can take
  saveComment(commentCid: string, accountName?: string) // like https://www.reddit.com/saved
  followComment(commentCid: string, accountName?: string) // get notifications for comments that aren't your own
  hideComment(commentCid: string, accountName?: string) // hide a comment from showing up anywhere
  followAuthor(authorAddress: string, accountName?: string) // no method to do this in the backend yet, could use IPNS
}
Account {
  id: string // random immutable string
  name: string // the nickname of the account, eg "Account 1"
  author: Author,
  signer: Signer,
  plebbit: Plebbit,
  plebbitOptions: PlebbitOptions,
  subscriptions: SubplebbitAddress[],
  blockedAddresses: {[key: Address]: boolean}, // hide address from feed and notifications
  limitedAddresses: {[key: Address]: number}, // limit how many times per feed page an address can appear, e.g. 1 = 100%, 0.1 = 10%, 0.001 = 0.1%
  theme: 'light' | 'dark
  karma: Karma
  unreadNotificationCount: number
}
Karma {
  commentUpvoteCount
  commentDownvoteCount
  commentScore
  linkUpvoteCount
  linkDownvoteCount
  linkScore
  upvoteCount
  downvoteCount
  score
}
AccountComment extends Comment {
  index: number // the index of the comment in the AccountComments array and database
  accountId: string
  upvoteCountMarkedAsRead: number // upvote count the last time the user read it, needed for upvote notifications
}
AccountCommentReply extends Comment {
  markedAsRead: boolean // has the user read this reply, needed for reply notifications
}
UseAccountsCommentsOptions {
  accountName?: string
  filter: UseAccountCommentsFilter
}
UseAccountCommentsFilter { // only get your own account's comments/votes on a certain subplebbit, thread, etc useful for certain UI pages
  subplebbitAddresses?: string[]
  postCids?: string[]
  commentCids?: string[]
  parentCommentCids?: string[]
  hasParentCommentCid?: boolean // get only posts, no comments
}
AccountVote extends Vote {
  previousAccountVoteCid: string // needed to scroll to every vote an account has published
}
Author {
  displayName: string
  address: string
}
Signer {
  privateKey?: string | buffer
  type: 'plebbit1'
}
Challenge {
  type: 'image' | 'text' | 'audio' | 'video' | 'html' // tells the client how to display the challenge, start with implementing image and text only first
  challenge: buffer // data required to complete the challenge, could be html, png, etc.
}
FeedItem {
  cid?: string // Currently feeds are used to reference comments, but might reference other stuff later
}
```

#### Getting started

```js
import {PlebbitProvider, useComment, useAccount, useBufferedFeeds} from '@plebbit/plebbit-react-hooks'

// wrap your app with the PlebbitProvider
// ...
return <PlebbitProvider><App/></PlebbitProvider>

// then use the hooks anywhere in your app
const account = useAccount()
const comment = useComment(commentCid)
```

#### Get the active account, if none exist in browser database, a default account is generated

```js
const account = useAccount()
```

#### Create accounts and change active account

```js
const account = useAccount()
const accounts = useAccounts()
const {createAccount, setActiveAccount, publishComment} = useAccountsActions()

// on first render
console.log(accounts.length) // 1
console.log(account.name) // 'Account 1'

await createAccount() // create 'Account 2'
await createAccount() // create 'Account 3'
await setActiveAccount('Account 3')

// on render after updates
console.log(accounts.length) // 3
console.log(account.name) // 'Account 1'

// you are now publishing from 'Account 3' because it is the active one
await publishComment(comment)
```

#### Get a post

```js
const post = useComment(commentCid)
```

#### Get a comment

```js
const comment = useComment(commentCid)
const comments = useComments([commentCid1, commentCid2, commentCid3])
```

#### Get a subplebbit

```js
const subplebbit = useSubplebbit(subplebbitAddress)
const subplebbits = useSubplebbits([subplebbitAddress, subplebbitAddress2, subplebbitAddress3])
```

#### Create a post or comment

```js
const onChallenge = async (challenges: Challenge[], comment: Comment) => {
  let challengeAnswers: string[]
  try {
    // ask the user to complete the challenges in a modal window
    challengeAnswers = await getChallengeAnswersFromUser(challenges)
  }
  catch (e) {
    // if he declines, throw error and don't get a challenge answer
  }
  if (challengeAnswers) {
    // if user declines, publishChallengeAnswers is not called, retry loop stops
    await comment.publishChallengeAnswers(challengeAnswers)
  }
}

const onChallengeVerification = (challengeVerification, comment) => {
  // if the challengeVerification fails, a new challenge request will be sent automatically
  // to break the loop, the user must decline to send a challenge answer
  // if the subplebbit owner sends more than 1 challenge for the same challenge request, subsequents will be ignored
  console.log('challenge verified', challengeVerification)
}

const {publishComment} = useAccountsActions()

// create post
publishComment({
  content: 'hello',
  title: 'hello',
  subplebbitAddress: 'Qm...',
  onChallenge,
  onChallengeVerification
})

// reply to a post or comment
publishComment({
  content: 'hello',
  postCid: 'Qm...', // the thread the comment is on
  parentCommentCid: 'Qm...', // if top level reply to a post, same as postCid
  subplebbitAddress: 'Qm...',
  onChallenge,
  onChallengeVerification
})
```

#### Create a vote

#### Create a comment edit

#### Get feed

```js
import InfiniteScroll from 'react-infinite-scroller' // or 'react-infinite-scroll-component'
const {feed, hasMore, loadMore} = useFeed(['memes.eth', 'Qm...', 'Qm...'], 'topAll')
const posts = feed.map(post => <Post post={post} />)

<InfiniteScroll
  pageStart={0}
  loadMore={loadMore}
  hasMore={hasMore}
  loader={<div>Loading...</div>}
>
  {posts}
</InfiniteScroll>

// you probably will want to buffer some feeds in the background so they are already loaded
// when you need them
useBufferedFeeds([
  {subplebbitAddresses: ['news.eth', 'crypto.eth'], sortType: 'new'},
  {subplebbitAddresses: ['memes.eth'], sortType: 'topWeek'},
  {subplebbitAddresses: ['Qm...', 'Qm...', 'Qm...', 'Qm...'], sortType: 'hot'}
])
```

#### Edit an account

```js
const {setAccount} = useAccountsActions()
const account = useAccount() // or useAccount('Account 2') to use an account other than the active one

const author: {...account.author, displayName: 'John'}
const editedAccount = {...account, author}

await setAccount(editedAccount)
```

#### Get your own comments and votes

```js
const myComments = useAccountComments()
const myVotes = useAccountVotes()
const subplebbitAddress = 'memes.eth'
const myCommentsInMemesEth = useAccountComments({
  filter: {subplebbitAddresses: [subplebbitAddress]}
})
const myPostsInMemesEth = useAccountComments({
  filter: {
    hasParentCommentCid: false, 
    subplebbitAddresses: [subplebbitAddress]
  }
})
const postCid = 'Qm...'
const myCommentsInSomePost = useAccountComments({
  filter: {postCids: [postCid]}
})
const parentCommentCid = 'Qm...'
const myRepliesToSomeComment = useAccountComments({
  filter: {parentCommentCids: [parentCommentCid]}
})

// know if you upvoted a comment already or not
const myVoteOnSomePost = useAccountVote(postCid)
const myVoteOnSomeComment = useAccountVote(commentCid, 'Account 2') // to get account that isn't active use the account name
```

#### Determine if a comment is your own

```js
const account = useAccount()
const comment = useComment(commentCid)
const isMyOwnComment = account?.author.address === comment?.author.address
```

#### Get account notifications

```js
const {notifications, markAsRead} = useAccountNotifications()
for (const notification of notifications) {
  console.log(notification)
}
await markAsRead()

const johnsNotifications = useAccountNotifications('John')
for (const notification of johnsNotifications.notifications) {
  console.log(notification)
}
await johnsNotifications.markAsRead()

// get the unread notification counts for all accounts
const accounts = useAccounts()
const accountsUnreadNotificationsCounts = accounts?.map(account => account.unreadNotificationCount)
```

#### Create a subplebbit

```
```

#### Edit your subplebbit settings

```
```

#### Edit a comment

```
```

### Algorithms

#### Account notifications and own comment updates

On startup, and every time a comment is created, it is added to the AccountsComments context and database. On the comment challengeverification event, the comment CID is received from the subplebbit owner, and we can start listening to comment update events, and update the context and database every time. Sometimes the user closes the page and the challengeverification event is never received, so every time a comment, subplebbit or subplebbit page is fetched, we awkwardly check to see if it has one of our own comment with a missing CID, and update it if found. 

AccountsCommentsReplies are found on the comment update events and are stored in a last rencently used database and have the field "markedAsRead" once read. `useAccountNotifications` uses the AccountsCommentsReplies to compile the read/unread notifications. TODO: add notifications for upvotes e.g. "Your comment has 10 upvotes".

#### Feed pages and infinite scrolling

A "feed" is a combination of a list of subplebbits to fetch, a sort type (hot/top/new/etc) and an account (for its IPFS settings). After using `useFeed(useFeedOptions)`, a feed with those options is added to the FeedsContext. After a feed is added to context, its subplebbits are fetched, then the first page of the subplebbit.posts `Pages` are fetched (if needed, usually the 'hot' sort is included with `plebbit.getSubplebbit()`). Each feed has a `pageNumber` which gets incremented on `loadMore` (used by infinite scrolling). Each feed has a list of `SubplebbitsPostsInfo` which keep track of `SubplebbitPostsInfo.bufferedPostCount` for each combination of subplebbit and sort type. When `SubplebbitPostsInfo.bufferedPostCount` gets below 50, the next page for the subplebbit and sort type is fetched.

When a new post page is received from IPFS, the `FeedsContext.bufferedFeeds` are recalculated, but the `FeedsContext.loadedFeeds` (which are displayed to the user) are not, new posts fetched will only be displayed to the user the next time he calls `loadMore`. If we detect that a `loadedFeed` is stale, we can prompt the user to load more posts, like Reddit/Facebook/Twitter do. 

Post pages are cached in IndexedDb for a short time, in case the user reloads the app.

When a subplebbit updates, the buffered feeds are emptied of that subplebbit's posts, and the first page is immediately fetched to try to refill it. TODO: If an updated comment already in `loadedFeeds` is fetched by a new subplebbit page, it should replace the old comment with the new one with updated votes/replies. Emptying the buffered feed needs testing in production, it might be too slow and need some caching.

#### Comments trees and infinite scrolling

Currently not implemented. Only uses the preloaded replies to a post.

#### Accounts settings persistance, export, import and caching

All accounts settings, accounts comments and accounts votes are stored permanently in the various IndexedDb databases. Import from file and export to file are possible but not yet implemented. Ephemeral data like random subplebbits, comments and feeds are stored in last recently used IndexedDb databases, and eventually erased.

#### Editing account.plebbitOptions and replacing the account.plebbit instance

Not implemented, but the easiest method would be to force a page reload, which will reset setting up all the comments and subplebbit listeners.

### Install

```
sudo npm install -g typescript ts-node jest n yarn prettier
# install version of node specified in .nvmrc
sudo n auto
# install node modules
yarn
```

#### Test

```
yarn test
```

#### Test with logs

```
DEBUG=* yarn test
DEBUG=plebbitreacthooks:* yarn test
DEBUG=plebbitreacthooks:hooks:* yarn test
DEBUG=plebbitreacthooks:hooks:accounts yarn test
DEBUG=plebbitreacthooks:hooks:accounts DEBUG_DEPTH=6 yarn test feeds
```

#### Test single file

```
yarn test file-name
```

> Note: some async tests might fail randomly in different environments because of timing, it can be fixed by waiting for something specific:

```js
// replace
await rendered.waitForNextUpdate() // will not always wait the same amount of time depending on env
// with
await rendered.waitFor(() => typeof rendered.result.current.cid === 'string') // best to use broad matching like typeof because doens't give specific error line when timing out
expect(rendered.result.current.cid).toBe('comment cid 2')
```

> Note: `waitForNextUpdate()` and `waitFor()` should always be wrapped in try/catch because `waitFor` timeouts don't tell error line numbers and are annoying to debug. They should also be followed by an `expect` statement.

```js
// replace 
await rendered.waitFor(() => typeof rendered.result.current.cid === 'string')
// with
try {await rendered.waitFor(() => typeof rendered.result.current.cid === 'string')} catch (e) {console.error(e)}
expect(typeof rendered.result.current.cid).toBe('string')
````

#### Before commit

```
yarn test
yarn lint // TODO: fix errors
yarn prettier
yarn build
```
