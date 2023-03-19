### Schema

> For full schema see https://github.com/plebbit/plebbit-js#schema

```
Account {
  id: string // random immutable string
  name: string // the nickname of the account, eg "Account 1"
  author: Author,
  signer: Signer,
  plebbit: Plebbit,
  plebbitOptions: PlebbitOptions,
  // subscriptions to show in feed
  subscriptions: string[], // subplebbit subscriptions
  multisubSubscriptions: string[],
  authorSubscriptions: string[],
  // notifications turned on for addresses/cids
  notifyingSubplebbits: {[address: string]: boolean}
  notifyingMultisubs: {[address: string]: boolean}
  notifyingAuthors: {[address: string]: boolean}
  notifyingComments: {[commentCid: string]: boolean}
  blockedAddresses: {[address: string]: boolean}, // hide address from feed and notifications
  blockedCids: {[cid: string]: boolean}, // hide a specific comment cid from feed and notifications  
  limitedAddresses: {[address: string]: number}, // limit how many times per feed page an address can appear, e.g. 1 = 100%, 0.1 = 10%, 0.001 = 0.1%
  savedComments: string[], // save a list of comments for later
  karma: Karma
  unreadNotificationCount: number
  subplebbits: {[subplebbitAddress: string]: AccountSubplebbit} // the subplebbits moderated or created by the user
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
