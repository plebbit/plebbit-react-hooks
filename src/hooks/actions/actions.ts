import {useMemo, useState} from 'react'
import useAccountsStore from '../../stores/accounts'
import Logger from '@plebbit/plebbit-logger'
const log = Logger('plebbit-react-hooks:accounts:hooks')
import assert from 'assert'
import {useAccount, useAccountId} from '../accounts'
import type {
  UseSubscribeOptions,
  UseSubscribeResult,
  UsePublishCommentOptions,
  UsePublishCommentResult,
  UseBlockOptions,
  UseBlockResult,
  UseCreateSubplebbitOptions,
  UseCreateSubplebbitResult,
  UsePublishVoteOptions,
  UsePublishVoteResult,
  UsePublishCommentEditOptions,
  UsePublishCommentEditResult,
  UsePublishSubplebbitEditOptions,
  UsePublishSubplebbitEditResult,
  Challenge,
  ChallengeVerification,
  Comment,
  CommentEdit,
  SubplebbitEdit,
  Vote,
  Subplebbit,
} from '../../types'

type PublishChallengeAnswers = (challengeAnswers: string[]) => Promise<void>
const publishChallengeAnswersNotReady: PublishChallengeAnswers = async (challengeAnswers) => {
  throw Error(`can't call publishChallengeAnswers() before result.challenge is defined (before the challenge message is received)`)
}

export function useSubscribe(options?: UseSubscribeOptions): UseSubscribeResult {
  assert(!options || typeof options === 'object', `useSubscribe options argument '${options}' not an object`)
  const {subplebbitAddress, accountName, onError} = options || {}
  const account = useAccount({accountName})
  const accountsActions = useAccountsStore((state) => state.accountsActions)
  const [errors, setErrors] = useState<Error[]>([])
  let state = 'initializing'
  let subscribed: boolean | undefined

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

  return useMemo(
    () => ({
      subscribed,
      subscribe,
      unsubscribe,
      state,
      error: errors[errors.length - 1],
      errors,
    }),
    [state, subscribed, errors, subplebbitAddress, accountName]
  )
}

export function useBlock(options?: UseBlockOptions): UseBlockResult {
  assert(!options || typeof options === 'object', `useBlock options argument '${options}' not an object`)
  const {address, accountName, onError} = options || {}
  const account = useAccount({accountName})
  const accountsActions = useAccountsStore((state) => state.accountsActions)
  const [errors, setErrors] = useState<Error[]>([])
  let state = 'initializing'
  let blocked: boolean | undefined

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

  return useMemo(
    () => ({
      blocked,
      block,
      unblock,
      state,
      error: errors[errors.length - 1],
      errors,
    }),
    [state, blocked, errors, address, accountName]
  )
}

export function usePublishComment(options?: UsePublishCommentOptions): UsePublishCommentResult {
  assert(!options || typeof options === 'object', `usePublishComment options argument '${options}' not an object`)
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

  return useMemo(
    () => ({
      index,
      challenge,
      challengeVerification,
      publishComment,
      publishChallengeAnswers: publishChallengeAnswers || publishChallengeAnswersNotReady,
      state: state || initialState,
      error: errors[errors.length - 1],
      errors,
    }),
    [state, errors, index, challenge, challengeVerification, options, accountName, publishChallengeAnswers]
  )
}

export function usePublishVote(options?: UsePublishVoteOptions): UsePublishVoteResult {
  assert(!options || typeof options === 'object', `usePublishVote options argument '${options}' not an object`)
  const {accountName, ...publishVoteOptions} = options || {}
  const accountsActions = useAccountsStore((state) => state.accountsActions)
  const accountId = useAccountId(accountName)
  const [errors, setErrors] = useState<Error[]>([])
  const [state, setState] = useState<string>()
  const [challenge, setChallenge] = useState<Challenge>()
  const [challengeVerification, setChallengeVerification] = useState<ChallengeVerification>()
  const [publishChallengeAnswers, setPublishChallengeAnswers] = useState<PublishChallengeAnswers>()

  let initialState = 'initializing'
  // before the accountId and options is defined, nothing can happen
  if (accountId && options) {
    initialState = 'ready'
  }

  // define onError if not defined
  const originalOnError = publishVoteOptions.onError
  const onError = async (error: Error) => {
    setState('failed')
    setErrors([...errors, error])
    originalOnError?.(error)
  }
  publishVoteOptions.onError = onError

  // define onChallenge if not defined
  const originalOnChallenge = publishVoteOptions.onChallenge
  const onChallenge = async (challenge: Challenge, vote: Vote) => {
    setState('waiting-challenge-verification')
    // cannot set a function directly with setState
    setPublishChallengeAnswers(() => vote?.publishChallengeAnswers.bind(vote))
    setChallenge(challenge)
    originalOnChallenge?.(challenge)
  }
  publishVoteOptions.onChallenge = onChallenge

  // define onChallengeVerification if not defined
  const originalOnChallengeVerification = publishVoteOptions.onChallengeVerification
  const onChallengeVerification = async (challengeVerification: ChallengeVerification) => {
    setState(challengeVerification?.challengeSuccess === true ? 'succeeded' : 'failed')
    setChallengeVerification(challengeVerification)
    originalOnChallengeVerification?.(challengeVerification)
  }
  publishVoteOptions.onChallengeVerification = onChallengeVerification

  const publishVote = async () => {
    try {
      await accountsActions.publishVote(publishVoteOptions, accountName)
      setState('waiting-challenge')
    } catch (e: any) {
      setErrors([...errors, e])
      publishVoteOptions.onError?.(e)
    }
  }

  return useMemo(
    () => ({
      challenge,
      challengeVerification,
      publishVote,
      publishChallengeAnswers: publishChallengeAnswers || publishChallengeAnswersNotReady,
      state: state || initialState,
      error: errors[errors.length - 1],
      errors,
    }),
    [state, errors, challenge, challengeVerification, options, accountName, publishChallengeAnswers]
  )
}

export function usePublishCommentEdit(options?: UsePublishCommentEditOptions): UsePublishCommentEditResult {
  assert(!options || typeof options === 'object', `usePublishCommentEdit options argument '${options}' not an object`)
  const {accountName, ...publishCommentEditOptions} = options || {}
  const accountsActions = useAccountsStore((state) => state.accountsActions)
  const accountId = useAccountId(accountName)
  const [errors, setErrors] = useState<Error[]>([])
  const [state, setState] = useState<string>()
  const [challenge, setChallenge] = useState<Challenge>()
  const [challengeVerification, setChallengeVerification] = useState<ChallengeVerification>()
  const [publishChallengeAnswers, setPublishChallengeAnswers] = useState<PublishChallengeAnswers>()

  let initialState = 'initializing'
  // before the accountId and options is defined, nothing can happen
  if (accountId && options) {
    initialState = 'ready'
  }

  // define onError if not defined
  const originalOnError = publishCommentEditOptions.onError
  const onError = async (error: Error) => {
    setState('failed')
    setErrors([...errors, error])
    originalOnError?.(error)
  }
  publishCommentEditOptions.onError = onError

  // define onChallenge if not defined
  const originalOnChallenge = publishCommentEditOptions.onChallenge
  const onChallenge = async (challenge: Challenge, commentEdit: CommentEdit) => {
    setState('waiting-challenge-verification')
    // cannot set a function directly with setState
    setPublishChallengeAnswers(() => commentEdit?.publishChallengeAnswers.bind(commentEdit))
    setChallenge(challenge)
    originalOnChallenge?.(challenge)
  }
  publishCommentEditOptions.onChallenge = onChallenge

  // define onChallengeVerification if not defined
  const originalOnChallengeVerification = publishCommentEditOptions.onChallengeVerification
  const onChallengeVerification = async (challengeVerification: ChallengeVerification) => {
    setState(challengeVerification?.challengeSuccess === true ? 'succeeded' : 'failed')
    setChallengeVerification(challengeVerification)
    originalOnChallengeVerification?.(challengeVerification)
  }
  publishCommentEditOptions.onChallengeVerification = onChallengeVerification

  const publishCommentEdit = async () => {
    try {
      await accountsActions.publishCommentEdit(publishCommentEditOptions, accountName)
      setState('waiting-challenge')
    } catch (e: any) {
      setErrors([...errors, e])
      publishCommentEditOptions.onError?.(e)
    }
  }

  return useMemo(
    () => ({
      challenge,
      challengeVerification,
      publishCommentEdit,
      publishChallengeAnswers: publishChallengeAnswers || publishChallengeAnswersNotReady,
      state: state || initialState,
      error: errors[errors.length - 1],
      errors,
    }),
    [state, errors, challenge, challengeVerification, options, accountName, publishChallengeAnswers]
  )
}

export function usePublishSubplebbitEdit(options?: UsePublishSubplebbitEditOptions): UsePublishSubplebbitEditResult {
  assert(!options || typeof options === 'object', `usePublishSubplebbitEdit options argument '${options}' not an object`)
  const {accountName, subplebbitAddress, ...publishSubplebbitEditOptions} = options || {}
  const accountsActions = useAccountsStore((state) => state.accountsActions)
  const accountId = useAccountId(accountName)
  const [errors, setErrors] = useState<Error[]>([])
  const [state, setState] = useState<string>()
  const [challenge, setChallenge] = useState<Challenge>()
  const [challengeVerification, setChallengeVerification] = useState<ChallengeVerification>()
  const [publishChallengeAnswers, setPublishChallengeAnswers] = useState<PublishChallengeAnswers>()

  let initialState = 'initializing'
  // before the accountId and options is defined, nothing can happen
  if (accountId && subplebbitAddress) {
    initialState = 'ready'
  }

  // define onError if not defined
  const originalOnError = publishSubplebbitEditOptions.onError
  const onError = async (error: Error) => {
    setState('failed')
    setErrors([...errors, error])
    originalOnError?.(error)
  }
  publishSubplebbitEditOptions.onError = onError

  // define onChallenge if not defined
  const originalOnChallenge = publishSubplebbitEditOptions.onChallenge
  const onChallenge = async (challenge: Challenge, subplebbitEdit: SubplebbitEdit) => {
    setState('waiting-challenge-verification')
    // cannot set a function directly with setState
    setPublishChallengeAnswers(() => subplebbitEdit?.publishChallengeAnswers.bind(subplebbitEdit))
    setChallenge(challenge)
    originalOnChallenge?.(challenge)
  }
  publishSubplebbitEditOptions.onChallenge = onChallenge

  // define onChallengeVerification if not defined
  const originalOnChallengeVerification = publishSubplebbitEditOptions.onChallengeVerification
  const onChallengeVerification = async (challengeVerification: ChallengeVerification) => {
    setState(challengeVerification?.challengeSuccess === true ? 'succeeded' : 'failed')
    setChallengeVerification(challengeVerification)
    originalOnChallengeVerification?.(challengeVerification)
  }
  publishSubplebbitEditOptions.onChallengeVerification = onChallengeVerification

  const publishSubplebbitEdit = async () => {
    try {
      await accountsActions.publishSubplebbitEdit(subplebbitAddress, publishSubplebbitEditOptions, accountName)
      setState('waiting-challenge')
    } catch (e: any) {
      setErrors([...errors, e])
      publishSubplebbitEditOptions.onError?.(e)
    }
  }

  return useMemo(
    () => ({
      challenge,
      challengeVerification,
      publishSubplebbitEdit,
      publishChallengeAnswers: publishChallengeAnswers || publishChallengeAnswersNotReady,
      state: state || initialState,
      error: errors[errors.length - 1],
      errors,
    }),
    [state, errors, challenge, challengeVerification, options, accountName, publishChallengeAnswers]
  )
}

export function useCreateSubplebbit(options?: UseCreateSubplebbitOptions): UseCreateSubplebbitResult {
  assert(!options || typeof options === 'object', `useCreateSubplebbit options argument '${options}' not an object`)
  const {accountName, onError, ...createSubplebbitOptions} = options || {}
  const accountId = useAccountId(accountName)
  const accountsActions = useAccountsStore((state) => state.accountsActions)
  const [errors, setErrors] = useState<Error[]>([])
  const [state, setState] = useState<string>()
  const [createdSubplebbit, setCreatedSubplebbit] = useState<Subplebbit>()

  let initialState = 'initializing'
  // before the accountId and options is defined, nothing can happen
  if (accountId && options) {
    initialState = 'ready'
  }

  const createSubplebbit = async () => {
    try {
      setState('creating')
      const createdSubplebbit = await accountsActions.createSubplebbit(createSubplebbitOptions, accountName)
      setCreatedSubplebbit(createdSubplebbit)
      setState('succeeded')
    } catch (e: any) {
      setErrors([...errors, e])
      setState('failed')
      onError?.(e)
    }
  }

  return useMemo(
    () => ({
      createdSubplebbit,
      createSubplebbit,
      state: state || initialState,
      error: errors[errors.length - 1],
      errors,
    }),
    [state, errors, createdSubplebbit, options, accountName]
  )
}
