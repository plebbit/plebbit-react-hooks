import React from 'react'
import {useParams} from 'react-router-dom'
import {useSubplebbit} from '../../../../src'

export default function Subplebbit() {
  const params: any = useParams()
  console.log({params})
  const subplebbit = useSubplebbit(params.subplebbitAddress)

  let subplebbitString = ''
  if (subplebbit) {
    const copy = {...subplebbit}
    // takes too long to strinfigy
    delete copy.posts.pages
    subplebbitString = JSON.stringify(copy)
  }

  return (
    <div>
      {subplebbitString}
    </div>
  )
}
