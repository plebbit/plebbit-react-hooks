#### Install the node module

```sh
yarn add https://github.com/plebbit/plebbit-react-hooks
```

#### Add env variable for mocking

- Create a .env file in your react project with the content:

```sh
REACT_APP_PLEBBIT_REACT_HOOKS_MOCK_CONTENT=1
REACT_APP_PLEBBIT_REACT_HOOKS_MOCK_CONTENT_LOADING_TIME=1000
```

#### Get a mock feed

```js
import {useFeed} from '@plebbit/plebbit-react-hooks'

function App() {
  const {feed, hasMore, loadMore} = useFeed({subplebbitAddresses: ['news.eth'], sortType: 'new'})
  console.log({feed})
  return <div className="App"></div>
}
```

#### Disable caching (warning: extremely slow loading)

- Add to your .env file:

```sh
REACT_APP_PLEBBIT_REACT_HOOKS_NO_CACHE=1
```

#### Delete databases and caches

```js
import {deleteCaches, deleteDatabases} from '@plebbit/plebbit-react-hooks'

// delete all databases, including all caches and accounts data
await deleteDatabases()

// delete the cached comments, cached subplebbits and cached pages only, no accounts data
await deleteCaches()
```
