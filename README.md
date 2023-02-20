*Telegram group for this repo https://t.me/plebbitreact*

### IndexedDb Schema

> Each top level object is its own key-value store database.

```
  Accounts {
    [accountId: string]: Account
  }
  AccountsMetadata {
    accountIds: strings[] // this array sets the order of the accounts
    activeAccountId: string // the default account to use with all hooks and actions
    accountNamesToAccountIds: {[accountName: string]: accountId}
  }
  AccountsComments (each database named accountComments-[accountId]) {
    [commentIndex: number]: AccountComment // store in array because cid is still unknown
  }
  AccountsCommentsReplies (each database named accountCommentsReplies-[accountId]) {
    [commentCid: string]: AccountCommentReply // keep replies to own account comments in a separate last recently used database because they should be cached for a different amount of time than regular comments and account comments
  }
  AccountsVotes (each database named accountVotes-[accountId]) {
    [commentCid: string]: AccountVote
  }
  Subplebbits {
    [subplebbitAddress: string]: Subplebbit // last recently used database, delete oldest data
  }
  Comments {
    [commentCid: string]: Comment // last recently used database, delete oldest data, different from AccountsComments that never expire
  }
  SubplebbitPages {
    [pageCid: string]: SubplebbitPage // last recently used database, delete oldest data
  }
```

### Stores

```
accountsStore (store in indexeddb permanently) {
  accounts: {[accountName: string]: Account}
  accountNames: string[]
  activeAccountName: string
  accountNamesToAccountIds: {[accountName: string]: accountId}
  accountsComments: {[accountName: string]: AccountComment[]} // cid of comment unknown at time of posting, so store it in array
  accountsVotes: {[accountName: string]: {[commentCid: string]: AccountVote}}
  accountsCommentsReplies: {[accountName: string]: {[replyCid: string]: AccountCommentReply}}
  accountsActions: AccountsActions
  // internal
  addCidToAccountComment(comment: Comment)
  // internal
  markAccountNotificationsAsRead(account: Account)
}
commentsStore (store in indexeddb last recently used) {
  comments: {[commentCid: string]: Comment}
  // internal
  addCommentToStore(commentCid)
}
subplebbitsStore (store in indexeddb last recently used) {
  subplebbits: {[subplebbitAddress: string]: Subplebbit}
  // internal
  addSubplebbitToStore(subplebbitAddress)
}
feedsStore (no persistant storage, can be rebuilt from Subplebbits and SubplebbitPages databases) {
  bufferedFeeds: {[feedName: string]: Comment[]}
  loadedFeeds: {[feedName: string]: Comment[]}
  feedsHaveMore: {[feedName: string]: boolean}
  // internal
  addFeedToStore(feedName, subplebbitAddresses, sortType, account)
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
useComments(commentCid[], accountName?: string): Comment[]
```
#### Subplebbits Hooks
```
useSubplebbit(subplebbitAddress: string, accountName?: string): Subplebbit | undefined // should contain not yet published posts from your own account unless they are older than X hours
useSubplebbits(subplebbitAddress[]: string[], accountName?: string): Subplebbits[]
useSubplebbitMetrics(subplebbitAddress: string, accountName?: string): SubplebbitMetrics | undefined
useResolvedSubplebbitAddress(subplebbitAddress: string, accountName?: string): string | undefined
```
#### Feeds Hooks
```
useFeed(subplebbitAddresses: string[], sortType?: string): {feed: Feed, loadMore: function, hasMore: boolean}
useBufferedFeeds(feedsOptions: UseBufferedFeedOptions[]) // preload or buffer feeds in the background, so they load faster when you call `useFeed`
useAuthorComments(authorAddress): string | undefined // there are no way to fetch all comments from an author, you need to build it from your own cache
```
#### Authors Hooks
```
useResolvedAuthorAddress(authorAddress?: string, accountName?: string): string | undefined
useAuthorAvatarImageUrl(author?: Author, accountName?: string): string | undefined
```

#### Util functions
```
setPlebbitJs(PlebbitJs) // set which plebbit-js version to use, e.g. to mock content for frontend dev or to use the node version in Electron
debugUtils // reset the databases and other dev utils
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
  publishCommentEdit(commentEdit: CommentEdit, accountName?: string)
  publishVote(vote: Vote, accountName?: string)
  publishSubplebbitEdit(subplebbitAddress: string, subplebbitEdit: SubplebbitEdit, accountName?: string)
  publishReport(report: Report, accountName?: string)
  deleteComment(commentCidOrAccountCommentIndex: string | number, accountName?: string)
  subscribe(subplebbitAddress: string, , accountName?: string) // subscribe to a subplebbit or multisub
  unsubscribe(subplebbitAddress: string, , accountName?: string)
  blockAddress(address: string, accountName?: string) // block a subplebbit address or author address from showing on your feed
  unblockAddress(address: string, accountName?: string)
  limitAddress(address: string | number, limitPercent: number, accountName?: string) // instead of blocking, limit the percent of your feed an address can take
  unlimitAddress(address: string | number, limitPercent: number, accountName?: string)
  saveComment(commentCid: string, accountName?: string) // like https://www.reddit.com/saved
  unsaveComment(commentCid: string, accountName?: string)
  followComment(commentCid: string, accountName?: string) // get notifications for comments that aren't your own
  unfollowComment(commentCid: string, accountName?: string)
  hideComment(commentCid: string, accountName?: string) // hide a comment from showing up anywhere
  unhideComment(commentCid: string, accountName?: string)
  followAuthor(authorAddress: string, accountName?: string) // no method to do this in the backend yet, could use IPNS
  unfollowAuthor(authorAddress: string, accountName?: string)
}
Account {
  id: string // random immutable string
  name: string // the nickname of the account, eg "Account 1"
  author: Author,
  signer: Signer,
  plebbit: Plebbit,
  plebbitOptions: PlebbitOptions,
  subscriptions: SubplebbitAddress[],
  blockedAddresses: {[address: Address]: boolean}, // hide address from feed and notifications
  limitedAddresses: {[address: Address]: number}, // limit how many times per feed page an address can appear, e.g. 1 = 100%, 0.1 = 10%, 0.001 = 0.1%
  karma: Karma
  unreadNotificationCount: number
  subplebbits: {[subplebbitAddress: Address]: AccountSubplebbit} // the subplebbits moderated or created by the user
}
Karma {
  replyUpvoteCount
  replyDownvoteCount
  replyScore
  postUpvoteCount
  postDownvoteCount
  postScore
  upvoteCount
  downvoteCount
  score
}
AccountSubplebbit { // the subplebbits moderated or created by the user
  role: Role
  autoStart: boolean // default true, the subplebbit should start publishing (subplebbit.start()) when the app is launched
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
  type: 'rsa'
}
Challenge {
  type: 'image' | 'text' | 'audio' | 'video' | 'html' // tells the client how to display the challenge, start with implementing image and text only first
  challenge: string // data required to complete the challenge, could be html, png, etc.
}
```

#### Getting started

```js
import {useComment, useAccount, useBufferedFeeds} from '@plebbit/plebbit-react-hooks'

const account = useAccount()
const comment = useComment({commentCid})
```

#### Get the active account, if none exist in browser database, a default account is generated

```js
const account = useAccount()
```

#### Create accounts and change active account

```js
const account = useAccount()
const {accounts} = useAccounts()
const {createAccount} = useCreateAccount()
const {setActiveAccount} = useSetActiveAccount({accountName: 'Account 3'})
const {publishComment} = usePublishComment(comment)

// on first render
console.log(accounts.length) // 1
console.log(account.name) // 'Account 1'

await createAccount() // create 'Account 2'
await createAccount() // create 'Account 3'
await setActiveAccount() // set 'Account 3' as active because useSetActiveAccount('Account 3')

// on render after updates
console.log(accounts.length) // 3
console.log(account.name) // 'Account 3'

// you are now publishing from 'Account 3' because it is the active one
await publishComment()
```

#### Get a post

```js
const post = useComment({commentCid})
```

#### Get a comment

```js
const comment = useComment({commentCid})
const {comments} = useComments({commentCids: [commentCid1, commentCid2, commentCid3]})

// get the nft avatar image url of the comment author
const {imageUrl} = useAuthorAvatarImageUrl({author: comment.author})
```

#### Get a subplebbit

```js
const subplebbit = useSubplebbit({subplebbitAddress})
const subplebbitMetrics = useSubplebbitMetrics({subplebbitAddress})
const subplebbits = useSubplebbits({subplebbitAddresses: [subplebbitAddress, subplebbitAddress2, subplebbitAddress3]})
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
  if (challengeVerification.challengeSuccess === true) {
    console.log('challenge success', {publishedCid: challengeVerification.publication.cid})
  }
  else if (challengeVerification.challengeSuccess === false) {
    console.error('challenge failed', {reason: challengeVerification.reason, errors: challengeVerification.errors})
  }
}

const onError = (error, comment) => console.error(error)

const publishCommentOptions = {
  content: 'hello',
  title: 'hello',
  subplebbitAddress: 'Qm...',
  onChallenge,
  onChallengeVerification,
  onError
}

const {index, state, publishComment} = usePublishComment(publishCommentOptions)

// create post
await publishComment()
// pending comment index
console.log(index)
// pending comment state
console.log(state)

// reply to a post or comment
const publishReplyOptions = {
  content: 'hello',
  parentCid: 'Qm...', // the cid of the comment to reply to
  subplebbitAddress: 'Qm...',
  onChallenge,
  onChallengeVerification,
  onError
}
const {publishComment} = usePublishComment(publishReplyOptions)
await publishComment()
```

#### Create a vote

```js
const publishVoteOptions = {
  commentCid: 'QmZVYzLChjKrYDVty6e5JokKffGDZivmEJz9318EYfp2ui',
  vote: 1,
  subplebbitAddress: 'news.eth',
  onChallenge,
  onChallengeVerification,
  onError
}
const {state, error, publishVote} = usePublishVote(publishVoteOptions)

await publishVote()
console.log(state)
console.log(error)
```

#### Create a comment edit

```js
const publishCommentEditOptions = {
  commentCid: 'QmZVYzLChjKrYDVty6e5JokKffGDZivmEJz9318EYfp2ui',
  content: 'edited content',
  subplebbitAddress: 'news.eth',
  onChallenge,
  onChallengeVerification,
  onError
}
const {state, error, publishCommentEdit} = usePublishCommentEdit(publishCommentEditOptions)

await publishCommentEdit()
console.log(state)
console.log(error)
```

#### Delete a comment

```js
const publishCommentEditOptions = {
  commentCid: 'QmZVYzLChjKrYDVty6e5JokKffGDZivmEJz9318EYfp2ui',
  removed: true,
  subplebbitAddress: 'news.eth',
  onChallenge,
  onChallengeVerification,
  onError
}
const {state, error, publishCommentEdit} = usePublishCommentEdit(publishCommentEditOptions)

await publishCommentEdit()
console.log(state)
console.log(error)

// TODO: implement accountActions.deleteComment to remove your comment from your local accountComments database
```

#### Subscribe to a subplebbit

```js
let subplebbitAddress = 'news.eth'
subplebbitAddress = 'QmZVYzLChjKrYDVty6e5JokKffGDZivmEJz9318EYfp2ui'
subplebbitAddress = 'tech.eth'
const {subscribed, subscribe, unsubscribe} = useSubscribe({subplebbitAddress})
await subscribe()
console.log(subscribed) // true

// view subscriptions
const account = useAccount()
console.log(account.subscriptions) // ['news.eth', 'QmZVYzLChjKrYDVty6e5JokKffGDZivmEJz9318EYfp2ui', 'tech.eth']

// unsubscribe
await unsubscribe()

// get a feed of subscriptions
const {feed, hasMore, loadMore} = useFeed({subplebbitAddresses: account.subscriptions, sortType: 'topAll'})
console.log(feed)
```

#### Get feed

```js
import InfiniteScroll from 'react-infinite-scroller' // or 'react-infinite-scroll-component'
const {feed, hasMore, loadMore} = useFeed({subplebbitAddresses: ['memes.eth', 'Qm...', 'Qm...'], sortType: 'topAll'})
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
useBufferedFeeds({
  feedsOptions: [
    {subplebbitAddresses: ['news.eth', 'crypto.eth'], sortType: 'new'},
    {subplebbitAddresses: ['memes.eth'], sortType: 'topWeek'},
    {subplebbitAddresses: ['Qm...', 'Qm...', 'Qm...', 'Qm...'], sortType: 'hot'}
  ]
})
```

#### Edit an account

```js
const account = useAccount() // or useAccount('Account 2') to use an account other than the active one

const author: {...account.author, displayName: 'John'}
const editedAccount = {...account, author}

const {setAccount} = useSetAccount({account: editedAccount})
await setAccount()

// check if the user has set his ENS name properly
const {address} = useResolvedAuthorAddress({authorAddress: 'username.eth'})
// authorAddress should equal to account.signer.address
```

#### Delete account

> Note: deleting account is unrecoverable, warn the user to export/backup his account before deleting

```js
// delete active account
const {deleteAccount} = useDeleteAccount()
await deleteAccount()

// delete account by name
const {deleteAccount} = useDeleteAccount({accountName: 'Account 2'})
await deleteAccount()
```

#### Get your own comments and votes

```js
// all my own comments
const {accountComments} = useAccountComments()

// all my own votes
const {accountVotes} = useAccountVotes()

// my own comments in memes.eth
const myCommentsInMemesEth = useAccountComments({
  filter: {subplebbitAddresses: ['memes.eth']}
})

// my own posts in memes.eth
const myPostsInMemesEth = useAccountComments({
  filter: {
    hasParentCommentCid: false, 
    subplebbitAddresses: ['memes.eth']
  }
})

// my own replies in a post with cid 'Qm...'
const postCid = 'Qm...'
const myCommentsInSomePost = useAccountComments({
  filter: {postCids: [postCid]}
})

// my own replies to a comment with cid 'Qm...'
const parentCommentCid = 'Qm...'
const myRepliesToSomeComment = useAccountComments({
  filter: {parentCommentCids: [parentCommentCid]}
})

// know if you upvoted a comment already with cid 'Qm...'
const {vote} = useAccountVote({commentCid: 'Qm...'})
console.log(vote) // 1, -1 or 0
```

#### Determine if a comment is your own

```js
const account = useAccount()
const comment = useComment({commentCid})
const isMyOwnComment = account?.author.address === comment?.author.address
```

#### Get account notifications

```js
const {notifications, markAsRead} = useAccountNotifications()
for (const notification of notifications) {
  console.log(notification)
}
await markAsRead()

const johnsNotifications = useAccountNotifications({accountName: 'John'})
for (const notification of johnsNotifications.notifications) {
  console.log(notification)
}
await johnsNotifications.markAsRead()

// get the unread notification counts for all accounts
const {accounts} = useAccounts()
const accountsUnreadNotificationsCounts = accounts?.map(account => account.unreadNotificationCount)
```

#### (Desktop only) Create a subplebbit

```js
const createSubplebbitOptions = {title: 'My subplebbit title'}
const {subplebbit, createSubplebbit} = useCreateSubplebbit(createSubplebbitOptions)
await createSubplebbit()
console.log(subplebbit.title)

// after the subplebbit is created, fetch it using
const {accountSubplebbits} = useAccountSubplebbits()
const accountSubplebbitAddresses = Object.keys(accountSubplebbits)
const subplebbits = useSubplebbits({subplebbitAddresses: accountSubplebbitAddresses})
// or
const _subplebbit = useSubplebbit({subplebbitAddress: subplebbit.address})
```

#### (Desktop only) List the subplebbits you created

```js
const {accountSubplebbits} = useAccountSubplebbits()
const ownerSubplebbitAddresses = Object.keys(accountSubplebbits).map(subplebbitAddress => accountSubplebbits[subplebbitAddress].role === 'owner')
const subplebbits = useSubplebbits({subplebbitAddresses: ownerSubplebbitAddresses})
```

#### (Desktop only) Edit your subplebbit settings

```js
const onChallenge = async (challenges: Challenge[], subplebbitEdit: SubplebbitEdit) => {
  let challengeAnswers: string[]
  try {
    challengeAnswers = await getChallengeAnswersFromUser(challenges)
  }
  catch (e) {}
  if (challengeAnswers) {
    await subplebbitEdit.publishChallengeAnswers(challengeAnswers)
  }
}

const onChallengeVerification = (challengeVerification, subplebbitEdit) => {
  console.log('challenge verified', challengeVerification)
}

const onError = (error, subplebbitEdit) => console.error(error)

// add ENS to your subplebbit
const editSubplebbitOptions = {
  subplebbitAddress: 'QmZVYzLChjKrYDVty6e5JokKffGDZivmEJz9318EYfp2ui', // the previous address before changing it
  address: 'your-subplebbit-address.eth', // the new address to change to
  onChallenge, 
  onChallengeVerification,
  onError
}

await publishSubplebbitEdit()

// edit other subplebbit settings
const editSubplebbitOptions = {
  subplebbitAddress: 'your-subplebbit-address.eth', // the address of the subplebbit to change
  title: 'Your title', 
  description: 'Your description',
  onChallenge, 
  onChallengeVerification,
  onError
}
const {publishSubplebbitEdit} = usePublishSubplebbitEdit(editSubplebbitOptions)
await publishSubplebbitEdit()

// verify if ENS was set correctly
const {address} = useResolvedSubplebbitAddress({subplebbitAddress: 'your-subplebbit-address.eth'})
console.log('ENS set correctly', address === subplebbit.signer.address)
```

#### Export and import account

```js
// get active account 'Account 1'
const activeAccount = useAccount()

// export active account, tell user to copy or download this json
const {exportedAccount, exportAccount} = useExportAccount()
await exportAccount()

// import account
const {importedAccount, importAccount} = useImportAccount({account: exportedAccount})
await importAccount(exportedAccount)

// get imported account 'Account 1 2' (' 2' gets added to account.name if account.name already exists)
const _importedAccount = useAccount({accountName: 'Account 1 2'})
importedAccount.name === _importedAccount.name === 'Account 1 2' // they are the same account

// make imported account active account
const {setActiveAccount} = useSetActiveAccount({accountName: 'Account 1 2'})
await setActiveAccount()

// reorder the accounts list
const {setAccountsOrder} = useSetAccountsOrder({accountNames: ['Account 1 2', 'Account 1']})
await setAccountsOrder()
```

### Algorithms

#### Account notifications and own comment updates

On startup, and every time a comment is created, it is added to the AccountsComments store and database. On the comment challengeverification event, the comment CID is received from the subplebbit owner, and we can start listening to comment update events, and update the store and database every time. Sometimes the user closes the page and the challengeverification event is never received, so every time a comment, subplebbit or subplebbit page is fetched, we awkwardly check to see if it has one of our own comment with a missing CID, and update it if found. 

AccountsCommentsReplies are found on the comment update events and are stored in a last rencently used database and have the field "markedAsRead" once read. `useAccountNotifications` uses the AccountsCommentsReplies to compile the read/unread notifications. TODO: add notifications for upvotes e.g. "Your comment has 10 upvotes".

#### Feed pages and infinite scrolling

A "feed" is a combination of a list of subplebbits to fetch, a sort type (hot/top/new/etc) and an account (for its IPFS settings). After using `useFeed(useFeedOptions)`, a feed with those options is added to the feedsStore. After a feed is added to store, its subplebbits are fetched, then the first page of the subplebbit.posts `Pages` are fetched (if needed, usually the 'hot' sort is included with `plebbit.getSubplebbit()`). Each feed has a `pageNumber` which gets incremented on `loadMore` (used by infinite scrolling). Each feed has a list of `SubplebbitsPostsInfo` which keep track of `SubplebbitPostsInfo.bufferedPostCount` for each combination of subplebbit and sort type. When `SubplebbitPostsInfo.bufferedPostCount` gets below 50, the next page for the subplebbit and sort type is fetched.

When a new post page is received from IPFS, the `feedsStore.bufferedFeeds` are recalculated, but the `feedsStore.loadedFeeds` (which are displayed to the user) are not, new posts fetched will only be displayed to the user the next time he calls `loadMore`. If we detect that a `loadedFeed` is stale, we can prompt the user to load more posts, like Reddit/Facebook/Twitter do. 

Post pages are cached in IndexedDb for a short time, in case the user reloads the app.

When a subplebbit updates, the buffered feeds are emptied of that subplebbit's posts, and the first page is immediately fetched to try to refill it. TODO: If an updated comment already in `loadedFeeds` is fetched by a new subplebbit page, it should replace the old comment with the new one with updated votes/replies. Emptying the buffered feed needs testing in production, it might be too slow and need some caching.

#### Feeds stores

```
feedsStore {
  feedsOptions: FeedsOptions
  bufferedFeeds: Feeds
  bufferedPostsCounts: {[subplebbitAddress+sortType: string]: number}
  loadedFeeds: Feeds
  feedsHaveMore: {[feedName: string]: boolean}
  // actions
  addFeedToStore: (feedName: string, ...feedOptions: FeedOptions) => void
  incrementFeedPageNumber: (feedName: string) => void
  // recalculate all feeds using new subplebbits.post.pages, subplebbitsPagesStore and page numbers
  updateFeeds: () => void
}
subplebbitsStore {
  subplebbits: Subplebbits
  // actions
  addSubplebbitToStore: (subplebbitAddress: string) => void
}
subplebbitsPagesStore {
  subplebbitsPages
  // actions
  // a subplebbit instance only knows its first page CID, so take the first page CID as an argument
  // and scroll through every subplebbit next page in the store until you find the last page, then add it
  addNextSubplebbitPageToStore: (subplebbitFirstPageCid: string) => void
}
```

#### Flow of adding a new feed

1. user calls useFeed(subplebbitAddresses, sortType) and feed gets added to feeds store
2. feed subplebbits are added to subplebbitsStore
  - in parallel:
    3. each feed subplebbit+sortType subscribes to its subplebbit.posts.pages and firstPageCids (subplebbit.posts.pageCids[sortType]) value changing (a subplebbit update)
    4. on each subplebbit.posts.pages and firstPageCids change, updateFeeds and bufferedFeedsSubplebbitsPostCounts
  - in parallel:
    3. each feed subplebbit subscribes to its bufferedFeedsSubplebbitsPostCounts value changing
    4. on each bufferedFeedsSubplebbitsPostCounts change, if the bufferedFeedsSubplebbitsPostCounts is below threshold for the subplebbit, add the next subplebbit+sortType page to the subplebbitsPagesStore
  - in parallel:
    3. each feed subscribes to subplebbitsPagesStore changing
      - on each subplebbitsPagesStore change, if any new pages are relevant to the feed:
        5. the feed's buffered feeds is rebuilt and bufferedFeedsSubplebbitsPostCounts updated
        6. if the loaded feeds is missing posts and buffered feeds has them, rebuild the loaded feeds
  - in parallel:
    3. each feed subscribes to accountsStore changing
    4. on each accounts change, like a blockedAddress added for example, updateFeeds
3. update feeds to rebuild the feeds using the already preloaded subplebbits and pages if any

#### Flow of incrementing a feed's page

1. the feeds store gets updated with the new page number and loadedFeeds, bufferedFeeds and bufferedFeedsSubplebbitsPostCounts are partially recalculated and updated

#### Comments trees and infinite scrolling

Currently not implemented. Only uses the preloaded replies to a post.

#### Accounts settings persistance, export, import and caching

All accounts settings, accounts comments and accounts votes are stored permanently in the various IndexedDb databases. Import from file and export to file are possible but not yet implemented. Ephemeral data like random subplebbits, comments and feeds are stored in last recently used IndexedDb databases, and eventually erased.

#### Editing account.plebbitOptions and replacing the account.plebbit instance

Not implemented, but the easiest method would be to force a page reload, which will reset setting up all the comments and subplebbit listeners.

### Install, testing and building

- Read /docs/testing.md
