import React from 'react'
import ReactDOM from 'react-dom/client'
import { Route, Switch, HashRouter } from 'react-router-dom'

import Account from './pages/account'
import Comment from './pages/comment'

import PlebbitReactHooks from '../../../src'

function App() {
  return (
    <div>
      <Switch>
        <Route exact strict path='/account' component={Account} />
        <Route exact strict path='/comment/:commentCid?' component={Comment} />
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
      <li><a href='/#/account'>/#/account</a></li>
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
