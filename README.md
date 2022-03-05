*Telegram group for this repo https://t.me/plebbitreact*

### IndexedDb Schema

> Each top level object is its own key-value store database.

```
  Accounts {
    [key: accountId]: Account
  }
  AccountsMetadata {
    accountIds: strings[], // this array sets the order of the accounts
    activeAccountId: string, // the default account to use with all hooks and actions
    accountNamesToAccountIds: {[key: accountName]: accountId}
  }
  AccountsComments (each database named accountComments-[accountId]) {
    [key: commentIndex]: AccountComment // store in array because cid is still unknown
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
```

### Contexts

```
SubplebbitsContext (store in indexeddb last recently used) {
  // TODO
}
FeedsContext (no persistant storage, can be rebuilt from subplebbits and comments persistant storage) {
  // TODO
}
CommentsContext (store in indexeddb last recently used) {
  comments: {[key: commentCid]: Comment},
}
AccountsContext (store in indexeddb permanently) {
  accounts: {[key: accountName]: Account}
  accountNames: string[], 
  activeAccountName: string,
  accountNamesToAccountIds: {[key: accountName]: accountId},
  accountsComments: {[key: accountName]: AccountComment[]}, // cid of comment unknown at time of posting, so store it in array
  accountsVotes: {[key: accountName]: {[key: commentCid]: AccountVote}},
  accountsActions: AccountsActions
}
```

### Hooks

- usePlebbit(plebbitOptions)

#### Accounts Hooks

- useAccount(accountName | undefined): Account | undefined
- useIsAccountComment(commentCid, accountName | undefined): boolean // know if a comment is your own comment
- useAccountComments(accountCommentsOptions: AccountsCommentsOptions): Comment[] // export or display list of own comments
- useAccountVotes(accountVotesOptions: AccountsCommentsOptions): Vote[]  // export or display list of own votes
- useAccountVote(commentCid, accountName | undefined): Vote // know if you already voted on some comment
- useAccounts(): Account[]
- useAccountsActions(): AccountsActions

#### Comments Hooks

- useComment(commentCid): Comment | undefined // should contain not yet publish replies from your own account unless they are older than X hours
- useComments(commentCid[]): Comment[]

#### Subplebbits Hooks

- useSubplebbit(subplebbitAddress): Subplebbit | undefined // should contain not yet published posts from your own account unless they are older than X hours
- useSubplebbits(subplebbitAddress[]): Subplebbits[]
#### Feeds Hooks

- useFeed(feedNameOrSubplebbitAddress)
- useAuthorComments(authorAddress) // there are no way to fetch all comments from an author, you need to build it from your own cache

### Schema

> For full schema see https://github.com/plebbit/plebbit-js#schema

```
AccountsActions {
  createAccount(account: Account),
  deleteAccount(accountName: string),
  setAccount(account: Account),
  setActiveAccount(accountName: string),
  setAccountsOrder(accountNames: string[]),
  importAccount(serializedAccount: string | buffer),
  exportAccount(accountName: string), // don't allow undefined to prevent catastrophic bugs
  publishComment(comment: Comment, accountName: string | undefined),
  publishVote(vote: Vote, accountName: string | undefined)
}
Account {
  id: string, // random immutable string
  name: string, // the nickname of the account, eg "Account 1"
  author: Author,
  signer: Signer,
  plebbit: Plebbit,
  plebbitOptions: PlebbitOptions,
  subscriptions: subplebbitAddress[],
  addressesLimits: {[key: address]: addressLimits}, // TODO: not sure about this name, used to block/limit authors/subplebbits
  theme: 'light' | 'dark
}
AccountComment {
  ...Comment,
  previousAccountCommentCid: string // needed to scroll to every comment an account has published
}
AccountsCommentsOptions {
  accountName?: string,
  filter: AccountCommentsFilter
}
AccountCommentsFilter { // only get your own account's comments/votes on a certain subplebbit, thread, etc useful for certain UI pages
  subplebbitAddresses?: string[],
  postCids?: string[],
  commentCids?: string[],
  parentCommentCids?: string[],
  hasParentCommentCid?: boolean // get only posts, no comments
}
AccountVote {
  ...Vote,
  previousAccountVoteCid: string // needed to scroll to every vote an account has published
}
Author {
  displayName: string,
  address: string
}
Signer {
  privateKey: string | buffer | undefined,
  type: 'plebbit1'
}
addressLimits { // TODO: not sure about this name, used to block/limit authors/subplebbits
  feed: number,
  notifications: number,
  crossposts: number
}
Challenge {
  type: 'image' | 'text' | 'audio' | 'video' | 'html', // tells the client how to display the challenge, start with implementing image and text only first
  challenge: buffer // data required to complete the challenge, could be html, png, etc.
}
```

#### Create a post

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
    // if user declines, publishChallengeAnswer is not called, retry loop stops
    await comment.publishChallengeAnswer(challengeAnswers)
  }
}

const onChallengeVerification = (challengeVerification, comment) => {
  // if the challengeVerification fails, a new challenge request will be sent automatically
  // to break the loop, the user must decline to send a challenge answer
  // if the subplebbit owner sends more than 1 challenge for the same challenge request, subsequents will be ignored
  console.log('challenge verified', challengeVerification)
}

const {publishComment} = useAccountsActions()

publishComment({
  content: 'hello',
  title: 'hello',
  subplebbitAddress: 'Qm...',
  onChallenge,
  onChallengeVerification
})
```

#### Get a default account, like if the user arrives on the site for the first time

```js
const account = useAccount()
```

#### Get a post

```js
const post = useComment(commentCid)
```

#### Get a comment

```js
const comment = useComment(plebbit, commentCid)
```

#### Get a subplebbit

```js
const subplebbit = useSubplebbit(subplebbitAddress)
```

#### Get feed

#### Update a subplebbit

#### Edit an account

```js
const {setAccount} = useAccountsActions()
const account = useAccount() // or useAccount('Account 2')

const author: {...account.author, displayName: 'John'}
const editedAccount = {...account, author}

await setAccount(editedAccount)
```

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
```

#### Test single file

```
DEBUG=* yarn test file-name
```

#### Before commit

```
yarn test
yarn lint // TODO: fix errors
yarn prettier
yarn build
```
