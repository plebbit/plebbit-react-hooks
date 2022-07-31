import React from 'react'
import AccountsProvider from './accounts-provider'
import CommentsProvider from './comments-provider'
import SubplebbitsProvider from './subplebbits-provider'
import FeedsProvider from './feeds-provider'
import {Props} from '../types'

export default function PlebbitProvider(props: Props): JSX.Element | null {
  if (!props.children) {
    return null
  }

  // AccountsProvider needs SubplebbitsProvider and vice versa so wrap SubplebbitsProvider twice
  return (
    <SubplebbitsProvider>
      <AccountsProvider>
        <SubplebbitsProvider>
          <CommentsProvider>
            <FeedsProvider>{props.children}</FeedsProvider>
          </CommentsProvider>
        </SubplebbitsProvider>
      </AccountsProvider>
    </SubplebbitsProvider>
  )
}
