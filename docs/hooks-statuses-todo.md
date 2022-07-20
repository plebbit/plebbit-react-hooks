### Hook statuses to add at some point

#### Accounts Hooks (need status, like database corrupted, etc)
```
useAccount(accountName?: string): Account | undefined
useAccountComments(accountCommentsOptions: AccountsCommentsOptions): Comment[] // export or display list of own comments
useAccountVotes(accountVotesOptions: AccountsCommentsOptions): Vote[]  // export or display list of own votes
useAccountVote(commentCid: string, accountName?: string): Vote // know if you already voted on some comment
useAccounts(): Account[]
useAccountsActions(): AccountsActions
useAccountNotifications(accountName?: string): Notification[]
```
#### Comments Hooks (need status, like comment with invalid sigature, comment timed out, etc)
```
useComment(commentCid: string, accountName?: string): Comment | undefined // should contain not yet publish replies from your own account unless they are older than X hours
useComments(commentCid[], accountName?: string): Comment[]
```
#### Subplebbits Hooks (need status, like sub with invalid sigature, sub timed out, etc)
```
useSubplebbit(subplebbitAddress): Subplebbit | undefined // should contain not yet published posts from your own account unless they are older than X hours
useSubplebbits(subplebbitAddress[]): Subplebbits[]
```
#### Feeds Hooks (need statuses, like sub errors or pages errors, etc)
```
useFeed(subplebbitAddresses: string[], sortType?: string): {feed: Feed, loadMore: function, hasMore: boolean}
useBufferedFeeds(feedsOptions: UseBufferedFeedOptions[]) // preload or buffer feeds in the background, so they load faster when you call `useFeed`
useAuthorComments(authorAddress) // there are no way to fetch all comments from an author, you need to build it from your own cache
```
#### Authors Hooks (need statuses, like invalid signature, timed out, still loading, next fetch time for polling, etc)
```
useResolvedAuthorAddress(authorAddress?: string, accountName?: string): string | undefined
useAuthorAvatarImageUrl(author?: Author, accountName?: string): string | undefined
```
```
AccountsActions {
  createAccount(account: Account) // need statuses progress, error, success
  deleteAccount(accountName: string) // need statuses progress, error, success
  setAccount(account: Account) // need statuses progress, error, success
  setActiveAccount(accountName: string) // need statuses progress, error, success
  setAccountsOrder(accountNames: string[]) // need statuses progress, error, success
  importAccount(serializedAccount: string | buffer) // need statuses progress, current step
  exportAccount(accountName: string) // need statuses progress, current step
  publishComment(comment: Comment, accountName?: string) // need statuses progress, current step, challenge, challengeVerification
  publishCommentEdit(commentEdit: CommentEdit, accountName?: string) // need statuses progress, current step, challenge, challengeVerification
  publishVote(vote: Vote, accountName?: string) // need statuses progress, current step, challenge, challengeVerification
  publishSubplebbitEdit(subplebbitAddress: string, subplebbitEdit: SubplebbitEdit, accountName?: string) // need statuses progress, current step, challenge, challengeVerification
  publishReport(report: Report, accountName?: string) // need statuses progress, current step, challenge, challengeVerification
  deleteComment(commentCidOrAccountCommentIndex: string | number, accountName?: string)
  subscribe(subplebbitAddress: string, , accountName?: string) // need statuses subscribe to a subplebbit or multisub
  unsubscribe(subplebbitAddress: string, , accountName?: string) // need statuses progress, error, success
  blockAddress(address: string, accountName?: string) // need statuses progress, error, success
  unblockAddress(address: string, accountName?: string) // need statuses progress, error, success
  limitAddress(address: string | number, limitPercent: number, accountName?: string) // need statuses progress, error, success
  unlimitAddress(address: string | number, limitPercent: number, accountName?: string) // need statuses progress, error, success
  saveComment(commentCid: string, accountName?: string) // need statuses progress, error, success
  unsaveComment(commentCid: string, accountName?: string) // need statuses progress, error, success
  followComment(commentCid: string, accountName?: string) // need statuses progress, error, success
  unfollowComment(commentCid: string, accountName?: string) // need statuses progress, error, success
  hideComment(commentCid: string, accountName?: string) // need statuses progress, error, success
  unhideComment(commentCid: string, accountName?: string) // need statuses progress, error, success
  followAuthor(authorAddress: string, accountName?: string) // need statuses progress, error, success
  unfollowAuthor(authorAddress: string, accountName?: string) // need statuses progress, error, success
}
```