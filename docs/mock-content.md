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

#### Wrap your App with the PlebbitProvider

```js
import {PlebbitProvider} from '@plebbit/plebbit-react-hooks'

ReactDOM.render(
  <React.StrictMode>
    <PlebbitProvider>
      <App />
    </PlebbitProvider>
  </React.StrictMode>,
  document.getElementById('root')
)
```

#### Get a mock feed

```js
import {useFeed} from '@plebbit/plebbit-react-hooks'

function App() {
  const {feed, hasMore, loadMore} = useFeed(['news.eth'], 'new')
  console.log({feed})
  return <div className="App"></div>
}
```

#### Disable caching

- Add to your .env file

```sh
REACT_APP_PLEBBIT_REACT_HOOKS_NO_CACHE=1
````

#### Delete databases and caches

```js
import {debugUtils} from '@plebbit/plebbit-react-hooks'

await debugUtils.deleteDatabases()
```
