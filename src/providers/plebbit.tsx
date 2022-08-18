import React from 'react'
import {Props} from '../types'

export default function PlebbitProvider(props: Props): JSX.Element | null {
  if (!props.children) {
    return null
  }

  // TODO: remove feeds provider to be a zustand store only
  return <div>{props.children}</div>
}
