import React from 'react'
import {useParams} from 'react-router-dom'
import {useComment} from '../../../../src'

export default function Comment() {
  const params: any = useParams()
  console.log({params})
  const comment = useComment(params.commentCid)
  return (
    <div>
      {JSON.stringify(comment)}
    </div>
  )
}
