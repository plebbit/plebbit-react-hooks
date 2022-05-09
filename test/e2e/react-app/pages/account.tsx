import React from 'react'
import {useAccount} from '../../../../src'

export default function Account() {
  const account = useAccount()
  return (
    <div>
      {JSON.stringify(account)}
    </div>
  )
}
