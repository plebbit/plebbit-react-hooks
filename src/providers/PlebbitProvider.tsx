import React from 'react'
import AccountsProvider from './AccountsProvider'
import CommentsProvider from './CommentsProvider'

type Props = { children?: React.ReactChild }

export default function PlebbitProvider(props: Props): JSX.Element | null {
  if (!props.children) {
    return null
  }

  return <AccountsProvider>
    <CommentsProvider>
      {props.children}
    </CommentsProvider>
  </AccountsProvider>
}
