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

#### Author comments algorithm

1. Start with an author.address and a comment.cid, fetch the comment.cid and validate the comment.author.address
  - in parallel:
    2. Fetch the previous comment using comment.author.previousCommentCid and validate the comment.author.address
      3. Continue this process until comment.author.previousCommentCid is undefined (no more comments)
  - in parallel:
    2. If one of the author comments receives an update with comment.author.subplebbit.lastCommentCid, fetch the lastCommentCid and validate the lastComment.author.address
      3. If the lastComment is more recent than the original comment, replace the original comment with the lastComment and start fetching lastComment.author.previousCommentCid
        4. Continue this process until comment.author.previousCommentCid is undefined (no more comments)

#### Flow of adding authorComments to authorsCommentsStore

1. user calls useAuthorComments(authorAddress, commentCid, filter) and authorAddress+filter gets added to author comments store
  2. nextCommentCidToFetch gets set to commentCid
    3. nextCommentCidToFetch gets added to commentsStore*
      4. on comments store update
        - in parallel:
          5. the fetched nextCommentCidToFetch comment gets added to bufferedCommentCids and filtered loadedComments
        - in parallel:
          5. nextCommentCidToFetch gets set to comment.author.previousCommentCid
            6. go back to step 3
        - in parallel:
          5. if the updated comment has comment.author.subplebbit.lastCommentCid, add the lastCommentCid to commentsStore*
            - go back to step 4
        - in parallel:
          5. if the updated comment was a lastCommentCid, and is comment.timestamp is newer than current lastCommentCid comment.timestamp, and newer than all bufferedCommentCids comment.timestamp, set lastCommentCid as comment.cid
            6. comment gets added to bufferedCommentCids and filtered loadedComments
              7. it is recommended to redirect the user to `/#/u/<authorAddress>/<lastCommentCid>` so if they share the link they share the most recent commentCid
---
*commentsStore: any commentCid added the the commentsStore will fetch the comment (and comment updates), and emit events on comments changes
