import {useMemo, useState} from 'react'
import useAccountsStore from '../../stores/accounts'
import Logger from '@plebbit/plebbit-logger'
const log = Logger('plebbit-react-hooks:hooks:accounts')
import assert from 'assert'
import {useAccount, useAccountId} from '../accounts'
import type {
  UseSubscribeOptions,
  UseSubscribeResult,
  UsePublishCommentOptions,
  UsePublishCommentResult,
  UseBlockOptions,
  UseBlockResult,
  Challenge,
  ChallengeVerification,
  Comment,
} from '../../types-new'

type PublishChallengeAnswers = (challengeAnswers: string[]) => Promise<void>
const publishChallengeAnswersNotReady: PublishChallengeAnswers = async (challengeAnswers) => {
  throw Error(`can't call publishChallengeAnswers() before result.challenge is defined (before the challenge message is received)`)
}

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

export function useBlock(options?: UseBlockOptions): UseBlockResult {
  const {address, accountName, onError} = options || {}
  const account = useAccount(accountName)
  const accountsActions = useAccountsStore((state) => state.accountsActions)
  const [errors, setErrors] = useState<Error[]>([])
  let state = 'initializing'
  let blocked = undefined

  // before the account and address is defined, nothing can happen
  if (account && address) {
    state = 'ready'
    blocked = Boolean(account.blockedAddresses[address])
  }

  const block = async () => {
    try {
      await accountsActions.blockAddress(address, accountName)
    } catch (e: any) {
      setErrors([...errors, e])
      onError?.(e)
    }
  }

  const unblock = async () => {
    try {
      await accountsActions.unblockAddress(address, accountName)
    } catch (e: any) {
      setErrors([...errors, e])
      onError?.(e)
    }
  }

  return {
    state,
    error: errors[errors.length - 1],
    errors,
    blocked,
    block,
    unblock,
  }
}

export function usePublishComment(options: UsePublishCommentOptions): UsePublishCommentResult {
  const {accountName, ...publishCommentOptions} = options || {}
  const accountsActions = useAccountsStore((state) => state.accountsActions)
  const accountId = useAccountId(accountName)
  const [errors, setErrors] = useState<Error[]>([])
  const [state, setState] = useState<string>()
  const [index, setIndex] = useState<number>()
  const [challenge, setChallenge] = useState<Challenge>()
  const [challengeVerification, setChallengeVerification] = useState<ChallengeVerification>()
  const [publishChallengeAnswers, setPublishChallengeAnswers] = useState<PublishChallengeAnswers>()

  let initialState = 'initializing'
  // before the accountId and options is defined, nothing can happen
  if (accountId && options) {
    initialState = 'ready'
  }

  // define onError if not defined
  const originalOnError = publishCommentOptions.onError
  const onError = async (error: Error) => {
    setState('failed')
    setErrors([...errors, error])
    originalOnError?.(error)
  }
  publishCommentOptions.onError = onError

  // define onChallenge if not defined
  const originalOnChallenge = publishCommentOptions.onChallenge
  const onChallenge = async (challenge: Challenge, comment: Comment) => {
    setState('waiting-challenge-verification')
    // cannot set a function directly with setState
    setPublishChallengeAnswers(() => comment?.publishChallengeAnswers.bind(comment))
    setChallenge(challenge)
    originalOnChallenge?.(challenge)
  }
  publishCommentOptions.onChallenge = onChallenge

  // define onChallengeVerification if not defined
  const originalOnChallengeVerification = publishCommentOptions.onChallengeVerification
  const onChallengeVerification = async (challengeVerification: ChallengeVerification) => {
    setState(challengeVerification?.challengeSuccess === true ? 'succeeded' : 'failed')
    setChallengeVerification(challengeVerification)
    originalOnChallengeVerification?.(challengeVerification)
  }
  publishCommentOptions.onChallengeVerification = onChallengeVerification

  const publishComment = async () => {
    try {
      const {index} = await accountsActions.publishComment(publishCommentOptions, accountName)
      setState('waiting-challenge')
      setIndex(index)
    } catch (e: any) {
      setErrors([...errors, e])
      publishCommentOptions.onError?.(e)
    }
  }

  return {
    state: state || initialState,
    error: errors[errors.length - 1],
    errors,
    publishComment,
    publishChallengeAnswers: publishChallengeAnswers || publishChallengeAnswersNotReady,
    index,
    challenge,
    challengeVerification,
  }
}