*Telegram group for this repo https://t.me/plebbitreact*

### IndexedDb Schema

> Each top level object is its own key-value store database.

```
  Accounts {
    [key: accountName]: Account
  }
  AccountsMetadata {
    names: strings[],
    activeAccountName: string
  }
  AccountsComments {
    [key: commentCid]: AccountComment // used by useAccountComments, but useComment also checks there before doing an IPFS query
  }
  AccountsVotes {
    [key: commentCid]: {
      [key: authorAddress]: AccountVote
    }
  }
  Subplebbits {
    [key: subplebbitAddress]: Subplebbit // last recently used database, delete oldest data
  }
  Comments {
    [key: commentCid]: Comment // last recently used database, delete oldest data, different from AccountsComments that never expire
  }
```

#### Contexts

- SubplebbitsContext // store in indexeddb last recently used
- FeedsContext // no persistant storage, can be rebuilt from subplebbits and comments persistant storage
- CommentsContext // store in indexeddb last recently used
- AccountsContext // store in indexeddb permanently

#### Hooks

- usePlebbit(plebbitOptions)
- useSubplebbit(subplebbitAddress)
- useSubplebbits(subplebbitAddress[])
- useFeed(feedNameOrSubplebbitAddress)
- useComment(commentCid)
- useComments(commentCid[])
- useAccount(accountName | undefined)
- useAccountComments(accountName | undefined)
- useAccountVotes(accountName | undefined) // only used while exporting/backing up account
- useAccountVote(commentCid, accountName | undefined) // used to know if you already voted on some comment
- useAccounts()
- useAuthorComments(authorAddress) // there are no way to fetch all comments from an author, you need to build it from your own cache

### Schema

> For full schema see https://github.com/plebbit/plebbit-js#schema

```
Account {
  name: string, // the nickname of the account, eg "Account 1"
  author: Author,
  signer: Signer,
  plebbit: Plebbit,
  plebbitOptions: PlebbitOptions,
  subscriptions: subplebbitAddress[],
  addressesLimits: {[key: address]: addressLimits} // TODO: not sure about this name, used to block/limit authors/subplebbits
  theme: 'light' | 'dark
}
AccountComment {
  ...Comment,
  previousAccountCommentCid: string // needed to scroll to every comment an account has published
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
  notifications: number
  crossposts: number
}
```

#### Create a post

```js
const {author, signer, plebbit} = useAccount()
const handleCreateComment = (content) => plebbit.createComment({content, author, signer})
```

#### Get a default account, like if the user arrives on the site for the first time

```js
const account = useAccount()
```

#### Get a post

```js
const {plebbit} = useAccount()
const post = useComment({plebbit, commentCid})
```

#### Get a comment

```js
const {plebbit} = useAccount()
const comment = useComment({plebbit, commentCid})
```

#### Get a subplebbit

```js
const {plebbit} = useAccount()
const subplebbit = useSubplebbit({plebbit, subplebbitInsName})
```

#### Get feed

#### Update a subplebbit

#### Edit an author
