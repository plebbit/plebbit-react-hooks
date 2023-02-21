import {useMemo, useState} from 'react'
import useAccountsStore from '../../stores/accounts'
import Logger from '@plebbit/plebbit-logger'
const log = Logger('plebbit-react-hooks:hooks:accounts')
import assert from 'assert'
import {useAccount} from '../accounts'
import type {UseSubscribeOptions, UseSubscribeResult} from '../../types-new'

export function useSubscribe(options?: UseSubscribeOptions): UseSubscribeResult {
  const {subplebbitAddress, accountName, onError} = options || {}
  const account = useAccount(accountName)
  const accountsActions = useAccountsStore((state) => state.accountsActions)
  const [errors, setErrors] = useState<Error[]>([])
  let state = 'initializing'
  let subscribed = undefined

  // before the account and subplebbitAddress is defined, nothing can happen
  if (account && subplebbitAddress) {
    state = 'ready'
    subscribed = Boolean(account.subscriptions?.includes(subplebbitAddress))
  }

  const subscribe = async () => {
    try {
      await accountsActions.subscribe(subplebbitAddress, accountName)
    } catch (e: any) {
      setErrors([...errors, e])
      onError?.(e)
    }
  }

  const unsubscribe = async () => {
    try {
      await accountsActions.unsubscribe(subplebbitAddress, accountName)
    } catch (e: any) {
      setErrors([...errors, e])
      onError?.(e)
    }
  }

  return {
    state,
    error: errors[errors.length - 1],
    errors,
    subscribed,
    subscribe,
    unsubscribe,
  }
}

// interface PublishCommentResult extends Result {
//   publishComment: Function
//   index: number | undefined
//   challenge: ChallengeMessage
//   challengeVerification: ChallengeVerificationMessage
// }

// export function usePublishComment(publishCommentOptions: PublishCommentOptions, accountName?: string) {
//   const accountsActions = useAccountsStore((state) => state.accountsActions)

//   const publishComment = async () => {
//     try {
//       await accountsActions.publishComment(publishCommentOptions, accountName)
//       // set index, challenge, etc
//     }
//     catch (e) {
//       // set error
//     }
//   }

//   const result: PublishCommentResult = {
//     state: 'initializing'
//     error: undefined,
//     errors: [],
//     publishComment,
//     index: undefined
//     challenge: undefined
//     challengeVerification: undefined
//   }
//   return result
// }

// interface SetAccountResult extends Result {
//   account: Account
//   setAccount: Function
// }

// export function useSetAccount(account: Account) {
//   const accountsActions = useAccountsStore((state) => state.accountsActions)

//   const setAccount = async () => {
//     try {
//       await accountsActions.setAccount(account)
//       // set index, challenge, etc
//     }
//     catch (e) {
//       // set error
//     }
//   }

//   const result: SetAccountResult = {
//     state: 'initializing'
//     error: undefined,
//     errors: [],
//     setAccount,
//     account: undefined
//   }
//   return result
// }
