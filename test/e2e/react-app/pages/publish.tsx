import React, {useState, useEffect} from 'react'
import {useParams} from 'react-router-dom'
import {useAccountsActions, useAccount} from '../../../../src'

export default function Publish() {
  // enable browser debugging
  localStorage.debug = 'plebbit-js:*,plebbitreacthooks:*'

  const account = useAccount()
  console.log({account})
  const {publishComment, publishVote, setAccount} = useAccountsActions()
  const [events, setEvents] = useState([])

  // set the account's plebbit options to localhost if not set
  useEffect(() => {
    if (account?.plebbitOptions) {
      if (account.plebbitOptions.ipfsGatewayUrl !== 'http://localhost:8080') {
        const plebbitOptions = {...account.plebbitOptions, ipfsGatewayUrl: 'http://localhost:8080'}
        setAccount({...account, plebbitOptions})
      }
    }
  }, [account])

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
  // @ts-ignore
  window.publishTest = async () => {
    const onChallenge = (event: any, comment: any) => {
      // @ts-ignore
      window.addEvent(event)
      comment.publishChallengeAnswers(['answer'])
    }
    const onChallengeVerification = (event: any) => {
      // @ts-ignore
      window.addEvent(event)
    }
    // @ts-ignore
    await window.publishComment({
      subplebbitAddress: 'QmbdJpNU6cAgSXHjUNnSBrUZGBtStKPkdwKyiffqRy1x6c', 
      content: 'content', 
      title: 'title', 
      onChallenge, 
      onChallengeVerification
    })
  }

  return (
    <div>
      {JSON.stringify(events)}
    </div>
  )
}
