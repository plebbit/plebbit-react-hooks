// @ts-nocheck
import React from 'react'
import ReactDOM from 'react-dom/client'
import { Route, Switch, HashRouter, Link } from 'react-router-dom'

import Account from './pages/account'
import Comment from './pages/comment'
import Subplebbit from './pages/subplebbit'
import Feed from './pages/feed'
import Publish from './pages/publish'

import PlebbitReactHooks from '../../../src'

function App() {
  return (
    <div>
      <Switch>
        <Route exact strict path='/account' component={Account} />
        <Route exact strict path='/comment/:commentCid?' component={Comment} />
        <Route exact strict path='/subplebbit/:subplebbitAddress?' component={Subplebbit} />
        <Route exact strict path='/feed' component={Feed} />
        <Route exact strict path='/publish' component={Publish} />
        <Route component={Home} />
      </Switch>
    </div>
  )
}

function Home () {
  return (<div>
    <h1>Plebbit React Hooks Test React App Home</h1>
    <h2>Available pages:</h2>
    <ul>
      <li><Link to='/account'>/#/account</Link></li>
      <li><Link to='/comment/someCid...'>/#/comment/someCid...</Link></li>
      <li><Link to='/subplebbit/someSubplebbitAddress...'>/#/subplebbit/someSubplebbitAddress...</Link></li>
      <li><Link to='/feed'>/#/feed</Link></li>
      <li><Link to='/publish'>/#/publish</Link></li>
    </ul>
  </div>)
}

// create the root element like in the index.html of a create-react-app
const el = document.createElement('div')
el.setAttribute('id', 'root')
document.body.appendChild(el)

// create the usual index page
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
)
root.render(
  <React.StrictMode>
    <HashRouter>
      <PlebbitReactHooks.PlebbitProvider>
        <App />
      </PlebbitReactHooks.PlebbitProvider>
    </HashRouter>
  </React.StrictMode>
)
