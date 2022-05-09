import React from 'react'
import {useParams} from 'react-router-dom'
import {useFeed} from '../../../../src'

export default function Feed() {
  const params: any = useParams()
  console.log({params})
  const {feed, loadMore, hasMore} = useFeed(['sub1.eth', 'sub2.eth'], 'new')

  return (
    <div>
      {JSON.stringify(feed)}
    </div>
  )
}
