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
useAccountEdits({filer: AccountPublicationsFilter}):  {accountEdits: AccountEdit[]}
useAccountSubplebbits(): {accountSubplebbits: {[subplebbitAddress: string]: AccountSubplebbit}, onlyIfCached?: boolean}
useAccounts(): Account[]
useNotifications(): {notifications: Notification[], markAsRead: Function}
```
#### Comments Hooks
```
useComment({commentCid: string, onlyIfCached?: boolean}): Comment
useReplies({comment: Comment, sortType?: string, flat?: boolean, repliesPerPage?: number, filter?: CommentsFilter, accountComments?: {newerThan: number, append?: boolean}}): {replies: Comment[], hasMore: boolean, loadMore: function, reset: function, updatedReplies: Comment[], bufferedReplies: Comment[]}
useComments({commentCids: string[], onlyIfCached?: boolean}): {comments: Comment[]}
useEditedComment({comment: Comment}): {editedComment: Comment | undefined}
useValidateComment({comment: Comment, validateReplies?: boolean}): {valid: boolean}
```
#### Subplebbits Hooks
```
useSubplebbit({subplebbitAddress: string, onlyIfCached?: boolean}): Subplebbit
useSubplebbits({subplebbitAddresses: string[], onlyIfCached?: boolean}): {subplebbits: Subplebbits[]}
useSubplebbitStats({subplebbitAddress: string, onlyIfCached?: boolean}): SubplebbitStats
useResolvedSubplebbitAddress({subplebbitAddress: string, cache: boolean}): {resolvedAddress: string | undefined} // use {cache: false} when checking the user's own subplebbit address
```
#### Authors Hooks
```
useAuthor({authorAddress: string, commentCid: string}): {author: Author | undefined}
useAuthorAddress({comment: Comment}): {authorAddress: string | undefined, shortAuthorAddress: string | undefined, authorAddressChanged: boolean}
useAuthorComments({authorAddress: string, commentCid: string, filter?: CommentsFilter}): {authorComments: Comment[], hasMore: boolean, loadMore: Promise<void>}
useResolvedAuthorAddress({author?: Author, cache?: boolean}): {resolvedAddress: string | undefined} // use {cache: false} when checking the user's own author address
useAuthorAvatar({author?: Author}): {imageUrl: string | undefined}
setAuthorAvatarsWhitelistedTokenAddresses(tokenAddresses: string[])
```
#### Feeds Hooks
```
useFeed({subplebbitAddresses: string[], sortType?: string, postsPerPage?: number, filter?: CommentsFilter, newerThan?: number, accountComments?: {newerThan: number, append?: boolean}, modQueue: ['pendingApproval']}): {feed: Comment[], loadMore: function, hasMore: boolean, reset: function, updatedFeed: Comment[], bufferedFeed: Comment[], subplebbitAddressesWithNewerPosts: string[]}
useBufferedFeeds({feedsOptions: UseFeedOptions[]}) // preload or buffer feeds in the background, so they load faster when you call `useFeed`
```
#### Actions Hooks
```
useSubscribe({subplebbitAddress: string}): {subscribed: boolean | undefined, subscribe: Function, unsubscribe: Function}
useBlock({address?: string, cid?: string}): {blocked: boolean | undefined, block: Function, unblock: Function}
usePublishComment(options: UsePublishCommentOptions): {index: number, ...UsePublishCommentResult}
usePublishVote(options: UsePublishVoteOptions): UsePublishVoteResult
usePublishCommentEdit(options: UsePublishCommentEditOptions): UsePublishCommentEditResult
usePublishCommentModeration(options: UsePublishCommentModerationOptions): UsePublishCommentModerationResult
usePublishSubplebbitEdit(options: UsePublishSubplebbitEditOptions): UsePublishSubplebbitEditResult
useCreateSubplebbit(options: CreateSubplebbitOptions): {createdSubplebbit: Subplebbit | undefined, createSubplebbit: Function}
```
#### States Hooks
```
useClientsStates({comment?: Comment, subplebbit?: Subplebbit}): {states, peers}
useSubplebbitsStates({subplebbitAddresses: string[]}): {states, peers}
```
#### Plebbit RPC Hooks
```
usePlebbitRpcSettings(): {plebbitRpcSettings: {plebbitOptions, challenges}, setPlebbitRpcSettings: Function}
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
deleteSubplebbit(subplebbitAddress: string, accountName?: string)
```
#### Util functions
```
setPlebbitJs(PlebbitJs) // set which plebbit-js version to use, e.g. to mock content for frontend dev or to use the node version in Electron
deleteDatabases() // delete all databases, including all caches and accounts data
deleteCaches() // delete the cached comments, cached subplebbits and cached pages only, no accounts data
```

#### Getting started

```jsx
import {useComment, useAccount} from '@plebbit/plebbit-react-hooks'

const account = useAccount()
const comment = useComment({commentCid})
```

#### Get the active account, if none exist in browser database, a default account is generated

```jsx
const account = useAccount()
```

#### Create accounts and change active account

```jsx
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

```jsx
const post = useComment({commentCid})

// post.author.address should not be used directly, it needs to be verified asynchronously using useAuthorAddress
const {authorAddress, shortAuthorAddress} = useAuthorAddress({comment: post})
// exception: when linking to an author profile page, /u/${comment.author.address}/c/${comment.cid} should be used, not useAuthorAddress({comment}).authorAddress

// use many times in a page without affecting performance
const post = useComment({commentCid, onlyIfCached: true})

// post.replies are not validated, to show replies
const {replies, hasMore, loadMore} = useReplies({comment: post})

// to show a preloaded reply without rerenders, validate manually
const {valid} = useValidateComment({comment: post.replies.pages.best.comments[0]})
if (valid === false) {
  // don't show this reply, it's malicious
}
// won't cause any rerenders if true
```

#### Get a comment

```jsx
const comment = useComment({commentCid})
const {comments} = useComments({commentCids: [commentCid1, commentCid2, commentCid3]})

// content
console.log(comment.content || comment.link || comment.title)

// comment.author.address should not be used directly, it needs to be verified asynchronously using useAuthorAddress
const {authorAddress, shortAuthorAddress} = useAuthorAddress({comment})
// exception: when linking to an author profile page, /u/${comment.author.address}/c/${comment.cid} should be used, not useAuthorAddress({comment}).authorAddress

// use without affecting performance
const {comments} = useComments({commentCids, onlyIfCached: true})
```

#### Get author avatar

```jsx
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
  console.log('Fetching NFT owner address from chain provider', chainProvider.urls)
}
if (state === 'fetching-uri') {
  console.log('Fetching NFT URI from chain provider URL', chainProvider.urls)
}
if (state === 'fetching-metadata') {
  console.log('Fetching NFT URI from', metadataUrl)
}
```

#### Get author profile page

```jsx
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
import {Virtuoso} from 'react-virtuoso'

<Virtuoso
  data={authorComments}
  itemContent={(index, comment) => <Comment index={index} comment={comment}/>}
  useWindowScroll={true}
  components={{Footer: hasMore ? () => <Loading/> : undefined}}
  endReached={loadMore}
  increaseViewportBy={{bottom: 600, top: 600}}
/>

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

// search an author's comments
const createSearchFilter = (searchTerm) => ({
  filter: (comment) => comment.title?.includes(searchTerm) || comment.content?.includes(searchTerm),
  key: `includes-${searchTerm}` // required key to cache the filter
})
const filter = createSearchFilter('bitcoin')
const {authorComments, lastCommentCid, hasMore, loadMore} = useAuthorComments({commentCid, authorAddress, filter})
```

#### Get a subplebbit

```jsx
const subplebbit = useSubplebbit({subplebbitAddress})
const subplebbitStats = useSubplebbitStats({subplebbitAddress})
const {subplebbits} = useSubplebbits({subplebbitAddresses: [subplebbitAddress, subplebbitAddress2, subplebbitAddress3]})

// use without affecting performance
const {subplebbits} = useSubplebbits({subplebbitAddresses: [subplebbitAddress, subplebbitAddress2, subplebbitAddress3], onlyIfCached: true})

// subplebbit.posts are not validated, to show posts
const {feed, hasMore, loadMore} = useFeed({subplebbitAddresses: [subplebbitAddress]})

// to show a preloaded post without rerenders, validate manually
const {valid} = useValidateComment({comment: subplebbit.posts.pages.topAll.comments[0]})
if (valid === false) {
  // don't show this post, it's malicious
}
// won't cause any rerenders if true
```

#### Create a post or comment using callbacks

```jsx
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
  subplebbitAddress: '12D3KooW...',
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

// after publishComment is called, the account comment index gets defined
// it is recommended to immediately redirect the user to a page displaying
// the user's comment with a "pending" label
if (index !== undefined) {
  history.push(`/profile/c/${index}`)
  // on the "pending" comment page, you can get the pending comment by doing
  // const accountComment = useAccountComment({commentIndex: index})
  // after accountComment.cid gets defined, it means the comment was published successfully
  // it is recommended to immediately redirect to `/p/${accountComment.subplebbitAddress}/c/${useAccountComment.cid}`
}

// reply to a post or comment
const publishReplyOptions = {
  content: 'hello',
  parentCid: 'Qm...', // the cid of the comment to reply to
  subplebbitAddress: '12D3KooW...',
  onChallenge,
  onChallengeVerification,
  onError
}
const {publishComment} = usePublishComment(publishReplyOptions)
await publishComment()

// when displaying replies, it is recommended to include the user's pending replies
// https://github.com/plebbit/plebbit-react-hooks/#get-replies-to-a-post-nested (nested)
// https://github.com/plebbit/plebbit-react-hooks/#get-replies-to-a-post-flattened-not-nested (not nested)
```

#### Create a post or comment using hooks

```jsx
const publishCommentOptions = {
  content: 'hello',
  title: 'hello',
  subplebbitAddress: '12D3KooW...',
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

// after publishComment is called, the account comment index gets defined
// it is recommended to immediately redirect the user to a page displaying
// the user's comment with a "pending" label
if (index !== undefined) {
  history.push(`/profile/c/${index}`)
  // on the "pending" comment page, you can get the pending comment by doing
  // const accountComment = useAccountComment({commentIndex: index})
  // after accountComment.cid gets defined, it means the comment was published successfully
  // it is recommended to immediately redirect to `/p/${accountComment.subplebbitAddress}/c/${useAccountComment.cid}`
}

// create post
await publishComment()
```

#### Create a post or comment anonymously (without account.signer or account.author)

```jsx
const account = useAccount()
const signer = await account.plebbit.createSigner()

const publishCommentOptions = {
  content: 'hello',
  title: 'hello',
  subplebbitAddress: '12D3KooW...',
  // use a newly generated author address (optional)
  signer,
  // use a different display name (optional)
  author: {
    displayName: 'Esteban',
    address: signer.address
  }
}

const {publishComment} = usePublishComment(publishCommentOptions)
await publishComment()
```

#### Create a vote

```jsx
const commentCid = 'QmZVYzLChjKrYDVty6e5JokKffGDZivmEJz9318EYfp2ui'
const publishVoteOptions = {
  commentCid,
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

// display the user's vote
const {vote} = useAccountVote({commentCid})

if (vote === 1)
  console.log('user voted 1')
if (vote === -1)
  console.log('user voted -1')
if (vote === 0)
  console.log('user voted 0')
if (vote === undefined)
  console.log(`user didn't vote yet`)
```

#### Create a comment edit

```jsx
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

// view the status of a comment edit instantly
let comment = useComment({commentCid: publishCommentEditOptions.commentCid})
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

#### Create a comment moderation

```jsx
const publishCommentModerationOptions = {
  commentCid: 'QmZVYzLChjKrYDVty6e5JokKffGDZivmEJz9318EYfp2ui',
  subplebbitAddress: 'news.eth',
  commentModeration: {locked: true},
  onChallenge,
  onChallengeVerification,
  onError
}
const {state, error, publishCommentModeration} = usePublishCommentModeration(publishCommentModerationOptions)

await publishCommentModeration()
console.log(state)
console.log(error)

// view the status of a comment moderation instantly
let comment = useComment({commentCid: publishCommentModerationOptions.commentCid})
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

#### Delete a comment

```jsx
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

```jsx
let subplebbitAddress = 'news.eth'
subplebbitAddress = '12D3KooWANwdyPERMQaCgiMnTT1t3Lr4XLFbK1z4ptFVhW2ozg1z'
subplebbitAddress = 'tech.eth'
const {subscribed, subscribe, unsubscribe} = useSubscribe({subplebbitAddress})
await subscribe()
console.log(subscribed) // true

// view subscriptions
const account = useAccount()
console.log(account.subscriptions) // ['news.eth', '12D3KooWANwdyPERMQaCgiMnTT1t3Lr4XLFbK1z4ptFVhW2ozg1z', 'tech.eth']

// unsubscribe
await unsubscribe()

// get a feed of subscriptions
const {feed, hasMore, loadMore} = useFeed({subplebbitAddresses: account.subscriptions, sortType: 'topAll'})
console.log(feed)
```

#### Get feed

```jsx
import {Virtuoso} from 'react-virtuoso'
const {feed, hasMore, loadMore} = useFeed({subplebbitAddresses: ['memes.eth', '12D3KooW...', '12D3KooW...'], sortType: 'topAll'})

<Virtuoso
  data={feed}
  itemContent={(index, post) => <Post index={index} post={post}/>}
  useWindowScroll={true}
  components={{Footer: hasMore ? () => <Loading/> : undefined}}
  endReached={loadMore}
  increaseViewportBy={{bottom: 600, top: 600}}
/>

// you probably will want to buffer some feeds in the background so they are already loaded
// when you need them
useBufferedFeeds({
  feedsOptions: [
    {subplebbitAddresses: ['news.eth', 'crypto.eth'], sortType: 'new'},
    {subplebbitAddresses: ['memes.eth'], sortType: 'topWeek'},
    {subplebbitAddresses: ['12D3KooW...', '12D3KooW...', '12D3KooW...', '12D3KooW...'], sortType: 'hot'}
  ]
})

// search a feed
const createSearchFilter = (searchTerm) => ({
  filter: (comment) => comment.title?.includes(searchTerm) || comment.content?.includes(searchTerm),
  key: `includes-${searchTerm}` // required key to cache the filter
})
const filter = createSearchFilter('bitcoin')
const {feed, hasMore, loadMore} = useFeed({subplebbitAddresses, filter})

// image only feed
const filter = {
  filter: (comment) => getCommentLinkMediaType(comment?.link) === 'image',
  key: 'image-only' // required key to cache the filter
}
const {feed, hasMore, loadMore} = useFeed({subplebbitAddresses, filter})
```

#### Get mod queue (pending approval)

```jsx
import {Virtuoso} from 'react-virtuoso'
const {feed, hasMore, loadMore} = useFeed({
  subplebbitAddresses: ['memes.eth', '12D3KooW...', '12D3KooW...'],
  modQueue: ['pendingApproval']
})

<Virtuoso
  data={feed}
  itemContent={(index, post) => <Post index={index} post={post}/>}
  useWindowScroll={true}
  components={{Footer: hasMore ? () => <Loading/> : undefined}}
  endReached={loadMore}
  increaseViewportBy={{bottom: 600, top: 600}}
/>
```

#### Approve a pending approval comment

```jsx
const publishCommentModerationOptions = {
  commentCid: 'QmZVYzLChjKrYDVty6e5JokKffGDZivmEJz9318EYfp2ui',
  subplebbitAddress: 'news.eth',
  commentModeration: {approved: true},
  onChallenge,
  onChallengeVerification,
  onError
}
const {state, error, publishCommentModeration} = usePublishCommentModeration(publishCommentModerationOptions)

await publishCommentModeration()
console.log(state)
console.log(error)
```

#### Edit an account

```jsx
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
  console.log('Resolving address from chain provider URL', chainProvider.urls)
}
```

#### Delete account

> Note: deleting account is unrecoverable, warn the user to export/backup his account before deleting

```jsx
import {deleteAccount} from '@plebbit/plebbit-react-hooks'

// delete active account
await deleteAccount()

// delete account by name
await deleteAccount('Account 2')
```

#### Get your own comments and votes

```jsx
// all my own comments
const {accountComments} = useAccountComments()
for (const accountComment of accountComments) {
  // it is recommended to show a label in the UI if accountComment.state is 'pending' or 'failed'
  console.log('comment', accountComment.index, 'is status', accountComment.state)
}

// all my own votes
const {accountVotes} = useAccountVotes()

// my own comments in memes.eth
const subplebbitAddress = 'memes.eth'
const filter = useCallback((comment) => comment.subplebbitAddress === subplebbitAddress, [subplebbitAddress]) // important to use useCallback or the same function or will cause rerenders
const myCommentsInMemesEth = useAccountComments({filter})

// my own posts in memes.eth
const filter = useCallback((comment) => comment.subplebbitAddress === subplebbitAddress && !comment.parentCid, [subplebbitAddress])
const myPostsInMemesEth = useAccountComments({filter})

// my own replies in a post with cid 'Qm...'
const postCid = 'Qm...'
const filter = useCallback((comment) => comment.postCid === postCid, [postCid])
const myCommentsInSomePost = useAccountComments({filter})

// my own replies to a comment with cid 'Qm...'
const parentCommentCid = 'Qm...'
const filter = useCallback((comment) => comment.parentCid === parentCommentCid, [parentCommentCid])
const myRepliesToSomeComment = useAccountComments({filter})

// know if you upvoted a comment already with cid 'Qm...'
const {vote} = useAccountVote({commentCid: 'Qm...'})
console.log(vote) // 1, -1 or 0

// my own pending posts in a feed
const {feed} = useFeed({subplebbitAddresses: [subplebbitAddress], accountComments: {newerThan: Infinity, append: false}})

// my own pending replies in a replies feed
const {replies} = useReplies({comment: post, accountComments: {newerThan: Infinity, append: false}})
```

#### Determine if a comment is your own

```jsx
const account = useAccount()
const comment = useComment({commentCid})
const isMyOwnComment = account?.author.address === comment?.author.address
```

#### Get account notifications

```jsx
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

#### Block an address (author, subplebbit or multisub)

```jsx
const address: 'subplebbit-address.eth' // or 'author-address.eth' or '12D3KooW...'
const {blocked, unblock, block} = useBlock({address})

if (blocked) {
  console.log(`'${address}' is blocked`)
}
else {
  console.log(`'${address}' is not blocked`)
}

// to block
block()

// to unblock
unblock()
```

#### Block a cid (hide a comment)

```jsx
const {blocked, unblock, block} = useBlock({cid: 'Qm...'})

if (blocked) {
  console.log(`'${cid}' is blocked`)
}
else {
  console.log(`'${cid}' is not blocked`)
}

// to block
block()

// to unblock
unblock()
```

#### (Desktop only) Create a subplebbit

```jsx
const createSubplebbitOptions = {title: 'My subplebbit title'}
const {createdSubplebbit, createSubplebbit} = useCreateSubplebbit(createSubplebbitOptions)
await createSubplebbit()

// it is recommended to redirect to `p/${createdSubplebbit.address}` after creation
if (createdSubplebbit?.address) {
  console.log('created subplebbit with title', createdSubplebbit.title)
  history.push(`/p/${createdSubplebbit.address}`)
}

// after the subplebbit is created, fetch it using
const {accountSubplebbits} = useAccountSubplebbits()
const accountSubplebbitAddresses = Object.keys(accountSubplebbits)
const subplebbits = useSubplebbits({subplebbitAddresses: accountSubplebbitAddresses})
// or
const _subplebbit = useSubplebbit({subplebbitAddress: createdSubplebbit.address})
```

#### (Desktop only) List the subplebbits you created

```jsx
const {accountSubplebbits} = useAccountSubplebbits()
const ownerSubplebbitAddresses = Object.keys(accountSubplebbits).map(subplebbitAddress => accountSubplebbits[subplebbitAddress].role === 'owner')
const subplebbits = useSubplebbits({subplebbitAddresses: ownerSubplebbitAddresses})
```

#### (Desktop only) Edit your subplebbit settings

```jsx
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
  subplebbitAddress: '12D3KooWANwdyPERMQaCgiMnTT1t3Lr4XLFbK1z4ptFVhW2ozg1z', // the previous address before changing it
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
  console.log('Resolving address from chain provider URL', chainProvider.urls)
}
```

#### Export and import account

```jsx
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

```jsx
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

#### View the status of a specific comment edit property

```jsx
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

```jsx
const {accountEdits} = useAccountEdits()
for (const accountEdit of accountEdits) {
  console.log(accountEdit)
}
console.log(`there's ${accountEdits.length} account edits`)

// get only the account edits of a specific comment
const commentCid = 'Qm...'
const filter = useCallback((edit) => edit.commentCid === commentCid, [commentCid]) // important to use useMemo or the same function or will cause rerenders
const {accountEdits} = useAccountEdits({filter})

// only get account edits in a specific subplebbit
const subplebbitAddress = 'news.eth'
const filter = useCallback((edit) => edit.subplebbitAddress === subplebbitAddress, [subplebbitAddress])
const {accountEdits} = useAccountEdits({filter})
```

#### Get replies to a post (nested or flat)

```jsx
import {useReplies, useComment, useAccountComment} from '@plebbit/plebbit-react-hooks'

// NOTE: recommended to use the same replies options for all depths, or will load slower
const useRepliesOptions = {sortType: 'best', flat: false, repliesPerPage: 20, accountComments: {newerThan: Infinity, append: false}}

const Reply = ({reply, updatedReply}) => {
  const {replies, updatedReplies, bufferedReplies, hasMore, loadMore} = useReplies({...useRepliesOptions, comment: reply})

  // updatedReply updates values in real time, reply does not
  const score = (updatedReply?.upvoteCount || 0) - (updatedReply?.downvoteCount || 0)

  // bufferedReplies updates in real time, can show new replies count in real time
  const moreReplies = hasMore && bufferedReplies?.length !== 0 ? `(${bufferedReplies.length} more replies)` : ''

  // publishing states exist only on account comment
  const accountReply = useAccountComment({commentIndex: reply.index})
  const state = accountReply?.state
  const publishingStateString = useStateString(accountReply)

  return (
    <div>
      <div>{score} {reply.author.address} {reply.timestamp} {moreReplies}</div>
      {state === 'pending' && <div>PENDING ({publishingStateString})</div>}
      {state === 'failed' && <div>FAILED</div>}
      <div>{reply.content}</div>
      <div style={{marginLeft: 4}}>
        {replies.map((reply, index) => <Reply key={reply?.index || reply?.cid} reply={reply} updatedReply={updatedReplies[index]}/>)}
      </div>
    </div>
  )
}

const comment = useComment({commentCid})
const {replies, updatedReplies, hasMore, loadMore} = useReplies({...useRepliesOptions, comment})
const repliesComponents = replies.map((reply, index) => <Reply key={reply?.index || reply?.cid} reply={reply} updatedReply={updatedReplies[index]}/>)
```

#### Get a shortCid or shortAddress

```jsx
// NOTE: not possible to do from plebbit-react-hooks, needs plebbit-js
import {getShortAddress, getShortCid} from '@plebbit/plebbit-js'

const shortParentCid = getShortAddress(comment.parentCid)
const shortAddress = getShortCid(address)
```

#### Get a shortCid or shortAddress

```jsx
import {useShortAddress, useShortCid} from '@plebbit/plebbit-react-hooks'

const shortParentCid = useShortCid(comment.parentCid)
const shortAddress = useShortAddress(address)
```

#### useBufferedFeeds with concurrency

```jsx
const useBufferedFeedsWithConcurrency = ({feedOptions}) => {

  const subplebbits = useSubplebbits()

  return useBufferedFeeds({feedsOptions})
}

const feedOptions = [
  {subplebbitAddresses: ['news.eth', 'crypto.eth'], sortType: 'new'},
  {subplebbitAddresses: ['memes.eth'], sortType: 'topWeek'},
  {subplebbitAddresses: ['12D3KooW...', '12D3KooW...', '12D3KooW...', '12D3KooW...'], sortType: 'hot'},
  ...
]

useBufferedFeedsWithConcurrency({feedOptions})
```
