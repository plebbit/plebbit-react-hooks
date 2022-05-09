import React, {useState} from 'react'
import {useParams} from 'react-router-dom'
import {useAccountsActions, useAccount} from '../../../../src'

export default function Publish() {
  const account = useAccount()
  const {publishComment, publishVote} = useAccountsActions()
  const [events, setEvents] = useState([])

  // return before defining functions otherwise the tests dont know
  // when functions are ready to be used
  if (!account) {
    return
  }

  // @ts-ignore
  window.publishComment = publishComment
  // @ts-ignore
  window.publishVote = publishVote
  // @ts-ignore
  window.addEvent = (event: any) => {
    console.log('addEvent', event)
    // @ts-ignore
    setEvents(prevEvents => {
      return [...prevEvents, event]
    })
  }

  return (
    <div>
      {JSON.stringify(events)}
    </div>
  )
}
