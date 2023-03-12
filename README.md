*Telegram group for this repo https://t.me/plebbitreact*

### Docs:

- [Hooks API](#hooks)
- [Getting started](#getting-started)
- Install, testing and building: https://github.com/plebbit/plebbit-react-hooks/blob/master/docs/testing.md
- Mock content (for UI development): https://github.com/plebbit/plebbit-react-hooks/blob/master/docs/mock-content.md
- Algorithms: https://github.com/plebbit/plebbit-react-hooks/blob/master/docs/algorithms.md
- Schema (Types, IndexedDb and state management): https://github.com/plebbit/plebbit-react-hooks/blob/master/docs/schema.md
- Types: https://github.com/plebbit/plebbit-react-hooks/blob/master/src/types.ts

### Hooks

#### Accounts Hooks
```
useAccount(): Account | undefined
useAccountComment({commentIndex: string}): Comment // get a pending published comment by its index
useAccountComments({filter: AccountPublicationsFilter}): {accountComments: Comment[]} // export or display list of own comments
useAccountVotes({filter: AccountPublicationsFilter}): {accountVotes: Vote[]}  // export or display list of own votes
useAccountVote({commentCid: string}): Vote // know if you already voted on some comment
useAccountSubplebbits(): {accountSubplebbits: {[subplebbitAddress: string]: AccountSubplebbit}}
useAccounts(): Account[]
useNotifications(): {notifications: Notification[], markAsRead: Function}
```
#### Comments Hooks
```
useComment({commentCid: string}): Comment
useComments({commentCids: string[]}): {comments: Comment[]}
```
#### Subplebbits Hooks
```
useSubplebbit({subplebbitAddress: string}): Subplebbit
useSubplebbits({subplebbitAddresses: string[]}): {subplebbits: Subplebbits[]}
useSubplebbitMetrics({subplebbitAddress: string}): SubplebbitMetrics
useResolvedSubplebbitAddress({subplebbitAddress: string, cache: boolean}): {resolvedAddress: string | undefined} // use {cache: false} when checking the user's own subplebbit address
```
#### Feeds Hooks
```
useFeed({subplebbitAddresses: string[], sortType?: string}): {feed: Feed, loadMore: function, hasMore: boolean}
useBufferedFeeds({feedsOptions: UseFeedOptions[]}) // preload or buffer feeds in the background, so they load faster when you call `useFeed`
```
#### Authors Hooks
```
useResolvedAuthorAddress({author?: Author, cache?: boolean}): {resolvedAddress: string | undefined} // use {cache: false} when checking the user's own author address
useAuthorAvatar({author?: Author}): {imageUrl: string | undefined}
```
#### Actions Hooks
```
useSubscribe({subplebbitAddress: string}): {subscribed: boolean | undefined, subscribe: Function, unsubscribe: Function}
useBlock({address: string}): {blocked: boolean | undefined, block: Function, unblock: Function}
usePublishComment(options: UsePublishCommentOptions): {index: number, ...UsePublishCommentResult}
usePublishVote(options: UsePublishVoteOptions): UsePublishVoteResult
usePublishCommentEdit(options: UsePublishCommentEditOptions): UsePublishCommentEditResult
usePublishSubplebbitEdit(options: UsePublishSubplebbitEditOptions): UsePublishSubplebbitEditResult
useCreateSubplebbit(options: CreateSubplebbitOptions): {createdSubplebbit: Subplebbit | undefined, createSubplebbit: Function}
```
#### Actions with no hooks implementations yet
```
createAccount(account: Account)
deleteAccount(accountName: string)
setAccount(account: Account)
setActiveAccount(accountName: string)
setAccountsOrder(accountNames: string[])
importAccount(serializedAccount: string)
exportAccount(accountName: string): string // don't allow undefined to prevent catastrophic bugs
```
#### Util functions
```
setPlebbitJs(PlebbitJs) // set which plebbit-js version to use, e.g. to mock content for frontend dev or to use the node version in Electron
deleteDatabases() // delete all databases, including all caches and accounts data
deleteCaches() // delete the cached comments, cached subplebbits and cached pages only, no accounts data
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
import {useAccount, useAccounts, createAccount, setActiveAccount} from '@plebbit/plebbit-react-hooks'

const account = useAccount()
const {accounts} = useAccounts()

// on first render
console.log(accounts.length) // 1
console.log(account.name) // 'Account 1'

await createAccount() // create 'Account 2'
await createAccount() // create 'Account 3'
await setActiveAccount('Account 3')

// on render after updates
console.log(accounts.length) // 3
console.log(account.name) // 'Account 3'

// you are now publishing from 'Account 3' because it is the active one
const {publishComment} = usePublishComment(publishCommentOptions)
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

// content
console.log(comment.content || comment.link || comment.title)

// author address
console.log(comment.author.address)
```

#### Get author avatar

```js
const comment = useComment({commentCid})

// get the nft avatar image url of the comment author
const {imageUrl, state, error, chainProvider, metadataUrl} = useAuthorAvatar({author: comment.author})

// result
if (state === 'succeeded') {
  console.log('Succeeded getting avatar image URL', imageUrl)
}
if (state === 'failed') {
  console.log('Failed getting avatar image URL', error.message)
}

// pending
if (state === 'fetching-owner') {
  console.log('Fetching NFT owner address from chain provider', chainProvider.url)
}
if (state === 'fetching-uri') {
  console.log('Fetching NFT URI from chain provider URL', chainProvider.url)
}
if (state === 'fetching-metadata') {
  console.log('Fetching NFT URI from', metadataUrl)
}
```

#### Get author profile page

```js
// NOTE: you must have a comment cid from the author to load his profile page
// e.g. the page url would be /#/u/<authorAddress>/c/<commentCid>
const authorResult = useAuthor({commentCid, authorAddress})
const {imageUrl} = useAuthorAvatar({author: authorResult.author})
const {authorComments, lastCommentCid, hasMore, loadMore} = useAuthorComments({commentCid, authorAddress})

// result
if (authorResult.state === 'succeeded') {
  console.log('Succeeded getting author', authorResult.author)
}
if (state === 'failed') {
  console.log('Failed getting author', authorResult.error.message)
}

// listing the author comments with infinite scroll
import InfiniteScroll from 'react-infinite-scroller' // or 'react-infinite-scroll-component'

const comments = authorComments.map(comment => <Comment comment={comment} />)

<InfiniteScroll
  pageStart={0}
  loadMore={loadMore}
  hasMore={hasMore}
  loader={<div>Loading...</div>}
>
  {comments}
</InfiniteScroll>

// it is recommended to always redirect the user to the last known comment cid
// in case they want to share the url with someone, the author's comments
// will load faster when using the last comment cid
import {useParams} from 'react-router-dom'
const params = useParams()

useEffect(() => {
  if (lastCommentCid && params.comentCid !== lastCommentCid) {
    history.push(`/u/${params.authorAddress}/c/${lastCommentCid}`);
  }
}, [lastCommentCid])
```

#### Get a subplebbit

```js
const subplebbit = useSubplebbit({subplebbitAddress})
const subplebbitMetrics = useSubplebbitMetrics({subplebbitAddress})
const {subplebbits} = useSubplebbits({subplebbitAddresses: [subplebbitAddress, subplebbitAddress2, subplebbitAddress3]})
```

#### Create a post or comment using callbacks

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

#### Create a post or comment using hooks

```js
const publishCommentOptions = {
  content: 'hello',
  title: 'hello',
  subplebbitAddress: 'Qm...',
}

const {index, state, publishComment, challenge, challengeVerification, publishChallengeAnswers, error} = usePublishComment(publishCommentOptions)

if (challenge) {
  // display challenges to user and call publishChallengeAnswers(challengeAnswers)
}

if (challengeVerification) {
  // display challengeVerification.challengeSuccess to user
  // redirect to challengeVerification.publication.cid
}

if (error) {
  // display error to user
}

// create post
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
import {useAccount, setAccount, useResolvedAuthorAddress} from '@plebbit/plebbit-react-hooks'
const account = useAccount() // or useAccount('Account 2') to use an account other than the active one

const author: {...account.author, displayName: 'John'}
const editedAccount = {...account, author}

await setAccount(editedAccount)

// check if the user has set his ENS name properly, use {cache: false} or it won't update
const author = {...account.author, address: 'username.eth'}
// authorAddress should equal to account.signer.address
const {resolvedAddress, state, error, chainProvider} = useResolvedAuthorAddress({author, cache: false}) 

// result
if (state === 'succeeded') {
  console.log('Succeeded resolving address', resolvedAddress)
}
if (state === 'failed') {
  console.log('Failed resolving address', error.message)
}

// pending
if (state === 'resolving') {
  console.log('Resolving address from chain provider URL', chainProvider.url)
}
```

#### Delete account

> Note: deleting account is unrecoverable, warn the user to export/backup his account before deleting

```js
import {deleteAccount} from '@plebbit/plebbit-react-hooks'

// delete active account
await deleteAccount()

// delete account by name
await deleteAccount('Account 2')
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
const {notifications, markAsRead} = useNotifications()
for (const notification of notifications) {
  console.log(notification)
}
await markAsRead()

const johnsNotifications = useNotifications({accountName: 'John'})
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
const {createdSubplebbit, createSubplebbit} = useCreateSubplebbit(createSubplebbitOptions)
await createSubplebbit()
console.log(createdSubplebbit.title)

// after the subplebbit is created, fetch it using
const {accountSubplebbits} = useAccountSubplebbits()
const accountSubplebbitAddresses = Object.keys(accountSubplebbits)
const subplebbits = useSubplebbits({subplebbitAddresses: accountSubplebbitAddresses})
// or
const _subplebbit = useSubplebbit({subplebbitAddress: createdSubplebbit.address})
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

// verify if ENS was set correctly, use {cache: false} or it won't update
const {resolvedAddress} = useResolvedSubplebbitAddress({subplebbitAddress: 'your-subplebbit-address.eth', cache: false})

// result
if (state === 'succeeded') {
  console.log('Succeeded resolving address', resolvedAddress)
  console.log('ENS set correctly', resolvedAddress === subplebbit.signer.address)
}
if (state === 'failed') {
  console.log('Failed resolving address', error.message)
}

// pending
if (state === 'resolving') {
  console.log('Resolving address from chain provider URL', chainProvider.url)
}
```

#### Export and import account

```js
import {exportAccount, importAccount, setActiveAccount, setAccountsOrder} from '@plebbit/plebbit-react-hooks'

// get active account 'Account 1'
const activeAccount = useAccount()

// export active account, tell user to copy or download this json
const activeAccountJson = await exportAccount()

// import account
await importAccount(activeAccountJson)

// get imported account 'Account 1 2' (' 2' gets added to account.name if account.name already exists)
const importedAccount = useAccount('Account 1 2')

// make imported account active account
await setActiveAccount('Account 1 2')

// reorder the accounts list
await setAccountsOrder(['Account 1 2', 'Account 1'])
```

#### View the status of a comment edit

```js
let comment = useComment({commentCid})
const {state: editedCommentState, editedComment} = useEditedComment({comment})

// if the comment has a succeeded, failed or pending edit, use the edited comment
if (editedComment) {
  comment = editedComment
}

let editLabel
if (editedCommentState === 'succeeded') {
  editLabel = {text: 'EDITED', color: 'green'}
}
if (editedCommentState === 'pending') {
  editLabel = {text: 'PENDING EDIT', color: 'orange'}
}
if (editedCommentState === 'failed') {
  editLabel = {text: 'FAILED EDIT', color: 'red'}
}
```

### View the status of a specific comment edit property

```js
const comment = useComment({commentCid})
const editedComment = useEditedComment({comment})
if (editedComment.failedEdits.removed !== undefined) {
  console.log('failed editing comment.removed property')
}
if (editedComment.succeededEdits.removed !== undefined) {
  console.log('succeeded editing comment.removed property')
}
if (editedCommentResult.pendingEdits.removed !== undefined) {
  console.log('pending editing comment.removed property')
}

// view the full comment with all edited properties (both succeeded and pending)
console.log(editedComment.editedComment)

// view the state of all edits of the comment
console.log(editedComment.state) // 'unedited' | 'succeeded' | 'pending' | 'failed'
```

#### List all comment and subplebbit edits the account has performed

```js
const {accountEdits} = useAccountEdits()
for (const accountEdit of accountEdits) {
  console.log(accountEdit)
}
console.log(`there's ${accountEdits.length} account edits`)

// get only the account edits of a specific comment
const filter = {commentCids: ['Qm...']}
const {accountEdits} = useAccountEdits({filter})

// only get account edits in a specific subplebbit
const filter = {subplebbitAddresses: ['news.eth']}
const {accountEdits} = useAccountEdits({filter})
```
