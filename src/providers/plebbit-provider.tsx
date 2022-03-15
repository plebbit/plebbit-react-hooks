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

  return (
    <AccountsProvider>
      <SubplebbitsProvider>
        <CommentsProvider>
          <FeedsProvider>
            {props.children}
          </FeedsProvider>
        </CommentsProvider>
      </SubplebbitsProvider>
    </AccountsProvider>
  )
}
