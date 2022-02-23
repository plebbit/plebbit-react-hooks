*Telegram group for this repo https://t.me/plebbitreact*

> For full schema see https://github.com/plebbit/plebbit-js#schema

#### Contexts

- SubplebbitsProvider
- SubplebbitsContext
- FeedsProvider
- FeedsContext
- CommentsProvider
- CommentsContext
- AccountsProvider
- AccountsContext

#### Hooks

- usePlebbit(plebbitOptions)
- useSubplebbit(subplebbitIpnsName)
- useSubplebbits(subplebbitIpnsName[])
- useSubplebbitIpnsNames()
- useFeed(feedNameOrIpnsName)
- useFeedNames()
- useComment(commentCid)
- useComments(commentCid[])
- useCommentCids()
- useAccount(accountName | undefined)
- useAccounts()

### Schema

```
Account {
  name: string, // the nickname of the account, eg "Account 1"
  author: Author,
  plebbit: Plebbit,
  plebbitOptions: PlebbitOptions,
  subscriptions: subplebbitIpnsName[],
  ipnsNamesLimits: {[key: ipnsName]: IpnsNameLimits} // TODO: not sure about this name
}
Author {
  displayName: string,
  ipnsName: string
}
Signer {
  privateKey: string | buffer | undefined,
  type: 'plebbit1'
}
IpnsNameLimits {
  feed: number, // TODO: not sure if good
  notifications: number, // TODO: not sure if good
  crosspost: number // TODO: not sure if good
}
```

#### create a post

```js
const {author, signer, plebbit} = useAccount()
const handleCreateComment = (content) => plebbit.createComment({content, author, signer})
```

#### get a default account, like if the user arrives on the site for the first time

```js
const account = useAccount()
```

#### get a post

```js
const {plebbit} = useAccount()
const post = useComment({plebbit, commentCid})
```

#### get a comment

```js
const {plebbit} = useAccount()
const comment = useComment({plebbit, commentCid})
```

#### get a subplebbit

```js
const {plebbit} = useAccount()
const subplebbit = useSubplebbit({plebbit, subplebbitInsName})
```

#### get feed

#### update a subplebbit

#### edit an author
