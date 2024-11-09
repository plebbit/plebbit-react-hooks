import {useMemo, useState} from 'react'
import useAccountsStore from '../../stores/accounts'
import Logger from '@plebbit/plebbit-logger'
const log = Logger('plebbit-react-hooks:actions:hooks')
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
  UsePublishCommentModerationOptions,
  UsePublishCommentModerationResult,
  UsePublishSubplebbitEditOptions,
  UsePublishSubplebbitEditResult,
  Challenge,
  ChallengeVerification,
  Comment,
  CommentEdit,
  CommentModeration,
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
      setErrors((errors) => [...errors, e])
      onError?.(e)
    }
  }

  const unsubscribe = async () => {
    try {
      await accountsActions.unsubscribe(subplebbitAddress, accountName)
    } catch (e: any) {
      setErrors((errors) => [...errors, e])
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
  const {address, cid, accountName, onError} = options || {}
  if (address && cid) {
    throw Error(`can't useBlock with both an address '${address}' and cid '${cid}' argument at the same time`)
  }
  const account = useAccount({accountName})
  const accountsActions = useAccountsStore((state) => state.accountsActions)
  const [errors, setErrors] = useState<Error[]>([])
  let state = 'initializing'
  let blocked: boolean | undefined

  // before the account and address is defined, nothing can happen
  if (account && (address || cid)) {
    state = 'ready'
    if (address) {
      blocked = Boolean(account.blockedAddresses[address])
    }
    if (cid) {
      blocked = Boolean(account.blockedCids[cid])
    }
  }

  const block = async () => {
    try {
      if (cid) {
        await accountsActions.blockCid(cid, accountName)
      } else {
        await accountsActions.blockAddress(address, accountName)
      }
    } catch (e: any) {
      setErrors((errors) => [...errors, e])
      onError?.(e)
    }
  }

  const unblock = async () => {
    try {
      if (cid) {
        await accountsActions.unblockCid(cid, accountName)
      } else {
        await accountsActions.unblockAddress(address, accountName)
      }
    } catch (e: any) {
      setErrors((errors) => [...errors, e])
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
  const [publishingState, setPublishingState] = useState<string>()
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
    setErrors((errors) => [...errors, error])
    originalOnError?.(error)
  }
  publishCommentOptions.onError = onError

  // define onChallenge if not defined
  const originalOnChallenge = publishCommentOptions.onChallenge
  const onChallenge = async (challenge: Challenge, comment: Comment) => {
    // cannot set a function directly with setState
    setPublishChallengeAnswers(() => comment?.publishChallengeAnswers.bind(comment))
    setChallenge(challenge)
    originalOnChallenge?.(challenge, comment)
  }
  publishCommentOptions.onChallenge = onChallenge

  // define onChallengeVerification if not defined
  const originalOnChallengeVerification = publishCommentOptions.onChallengeVerification
  const onChallengeVerification = async (challengeVerification: ChallengeVerification, comment: Comment) => {
    setChallengeVerification(challengeVerification)
    originalOnChallengeVerification?.(challengeVerification, comment)
  }
  publishCommentOptions.onChallengeVerification = onChallengeVerification

  // change state on publishing state change
  publishCommentOptions.onPublishingStateChange = (publishingState: string) => {
    setPublishingState(publishingState)
  }

  const publishComment = async () => {
    try {
      const {index} = await accountsActions.publishComment(publishCommentOptions, accountName)
      setIndex(index)
    } catch (e: any) {
      setErrors((errors) => [...errors, e])
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
      state: publishingState || initialState,
      error: errors[errors.length - 1],
      errors,
    }),
    [publishingState, initialState, errors, index, challenge, challengeVerification, options, accountName, publishChallengeAnswers]
  )
}

export function usePublishVote(options?: UsePublishVoteOptions): UsePublishVoteResult {
  assert(!options || typeof options === 'object', `usePublishVote options argument '${options}' not an object`)
  const {accountName, ...publishVoteOptions} = options || {}
  const accountsActions = useAccountsStore((state) => state.accountsActions)
  const accountId = useAccountId(accountName)
  const [errors, setErrors] = useState<Error[]>([])
  const [publishingState, setPublishingState] = useState<string>()
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
    setErrors((errors) => [...errors, error])
    originalOnError?.(error)
  }
  publishVoteOptions.onError = onError

  // define onChallenge if not defined
  const originalOnChallenge = publishVoteOptions.onChallenge
  const onChallenge = async (challenge: Challenge, vote: Vote) => {
    // cannot set a function directly with setState
    setPublishChallengeAnswers(() => vote?.publishChallengeAnswers.bind(vote))
    setChallenge(challenge)
    originalOnChallenge?.(challenge, vote)
  }
  publishVoteOptions.onChallenge = onChallenge

  // define onChallengeVerification if not defined
  const originalOnChallengeVerification = publishVoteOptions.onChallengeVerification
  const onChallengeVerification = async (challengeVerification: ChallengeVerification, vote: Vote) => {
    setChallengeVerification(challengeVerification)
    originalOnChallengeVerification?.(challengeVerification, vote)
  }
  publishVoteOptions.onChallengeVerification = onChallengeVerification

  // change state on publishing state change
  publishVoteOptions.onPublishingStateChange = (publishingState: string) => {
    setPublishingState(publishingState)
  }

  const publishVote = async () => {
    try {
      await accountsActions.publishVote(publishVoteOptions, accountName)
    } catch (e: any) {
      setErrors((errors) => [...errors, e])
      publishVoteOptions.onError?.(e)
    }
  }

  return useMemo(
    () => ({
      challenge,
      challengeVerification,
      publishVote,
      publishChallengeAnswers: publishChallengeAnswers || publishChallengeAnswersNotReady,
      state: publishingState || initialState,
      error: errors[errors.length - 1],
      errors,
    }),
    [publishingState, initialState, errors, challenge, challengeVerification, options, accountName, publishChallengeAnswers]
  )
}

export function usePublishCommentEdit(options?: UsePublishCommentEditOptions): UsePublishCommentEditResult {
  assert(!options || typeof options === 'object', `usePublishCommentEdit options argument '${options}' not an object`)
  const {accountName, ...publishCommentEditOptions} = options || {}
  const accountsActions = useAccountsStore((state) => state.accountsActions)
  const accountId = useAccountId(accountName)
  const [errors, setErrors] = useState<Error[]>([])
  const [publishingState, setPublishingState] = useState<string>()
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
    setErrors((errors) => [...errors, error])
    originalOnError?.(error)
  }
  publishCommentEditOptions.onError = onError

  // define onChallenge if not defined
  const originalOnChallenge = publishCommentEditOptions.onChallenge
  const onChallenge = async (challenge: Challenge, commentEdit: CommentEdit) => {
    // cannot set a function directly with setState
    setPublishChallengeAnswers(() => commentEdit?.publishChallengeAnswers.bind(commentEdit))
    setChallenge(challenge)
    originalOnChallenge?.(challenge, commentEdit)
  }
  publishCommentEditOptions.onChallenge = onChallenge

  // define onChallengeVerification if not defined
  const originalOnChallengeVerification = publishCommentEditOptions.onChallengeVerification
  const onChallengeVerification = async (challengeVerification: ChallengeVerification, commentEdit: CommentEdit) => {
    setChallengeVerification(challengeVerification)
    originalOnChallengeVerification?.(challengeVerification, commentEdit)
  }
  publishCommentEditOptions.onChallengeVerification = onChallengeVerification

  // change state on publishing state change
  publishCommentEditOptions.onPublishingStateChange = (publishingState: string) => {
    setPublishingState(publishingState)
  }

  const publishCommentEdit = async () => {
    try {
      await accountsActions.publishCommentEdit(publishCommentEditOptions, accountName)
    } catch (e: any) {
      setErrors((errors) => [...errors, e])
      publishCommentEditOptions.onError?.(e)
    }
  }

  return useMemo(
    () => ({
      challenge,
      challengeVerification,
      publishCommentEdit,
      publishChallengeAnswers: publishChallengeAnswers || publishChallengeAnswersNotReady,
      state: publishingState || initialState,
      error: errors[errors.length - 1],
      errors,
    }),
    [publishingState, initialState, errors, challenge, challengeVerification, options, accountName, publishChallengeAnswers]
  )
}

export function usePublishCommentModeration(options?: UsePublishCommentModerationOptions): UsePublishCommentModerationResult {
  assert(!options || typeof options === 'object', `usePublishCommentModeration options argument '${options}' not an object`)
  const {accountName, ...publishCommentModerationOptions} = options || {}
  const accountsActions = useAccountsStore((state) => state.accountsActions)
  const accountId = useAccountId(accountName)
  const [errors, setErrors] = useState<Error[]>([])
  const [publishingState, setPublishingState] = useState<string>()
  const [challenge, setChallenge] = useState<Challenge>()
  const [challengeVerification, setChallengeVerification] = useState<ChallengeVerification>()
  const [publishChallengeAnswers, setPublishChallengeAnswers] = useState<PublishChallengeAnswers>()

  let initialState = 'initializing'
  // before the accountId and options is defined, nothing can happen
  if (accountId && options) {
    initialState = 'ready'
  }

  // define onError if not defined
  const originalOnError = publishCommentModerationOptions.onError
  const onError = async (error: Error) => {
    setErrors((errors) => [...errors, error])
    originalOnError?.(error)
  }
  publishCommentModerationOptions.onError = onError

  // define onChallenge if not defined
  const originalOnChallenge = publishCommentModerationOptions.onChallenge
  const onChallenge = async (challenge: Challenge, commentModeration: CommentModeration) => {
    // cannot set a function directly with setState
    setPublishChallengeAnswers(() => commentModeration?.publishChallengeAnswers.bind(commentModeration))
    setChallenge(challenge)
    originalOnChallenge?.(challenge, commentModeration)
  }
  publishCommentModerationOptions.onChallenge = onChallenge

  // define onChallengeVerification if not defined
  const originalOnChallengeVerification = publishCommentModerationOptions.onChallengeVerification
  const onChallengeVerification = async (challengeVerification: ChallengeVerification, commentModeration: CommentModeration) => {
    setChallengeVerification(challengeVerification)
    originalOnChallengeVerification?.(challengeVerification, commentModeration)
  }
  publishCommentModerationOptions.onChallengeVerification = onChallengeVerification

  // change state on publishing state change
  publishCommentModerationOptions.onPublishingStateChange = (publishingState: string) => {
    setPublishingState(publishingState)
  }

  const publishCommentModeration = async () => {
    try {
      await accountsActions.publishCommentModeration(publishCommentModerationOptions, accountName)
    } catch (e: any) {
      setErrors((errors) => [...errors, e])
      publishCommentModerationOptions.onError?.(e)
    }
  }

  return useMemo(
    () => ({
      challenge,
      challengeVerification,
      publishCommentModeration,
      publishChallengeAnswers: publishChallengeAnswers || publishChallengeAnswersNotReady,
      state: publishingState || initialState,
      error: errors[errors.length - 1],
      errors,
    }),
    [publishingState, initialState, errors, challenge, challengeVerification, options, accountName, publishChallengeAnswers]
  )
}

export function usePublishSubplebbitEdit(options?: UsePublishSubplebbitEditOptions): UsePublishSubplebbitEditResult {
  assert(!options || typeof options === 'object', `usePublishSubplebbitEdit options argument '${options}' not an object`)
  const {accountName, subplebbitAddress, ...publishSubplebbitEditOptions} = options || {}
  const accountsActions = useAccountsStore((state) => state.accountsActions)
  const accountId = useAccountId(accountName)
  const [errors, setErrors] = useState<Error[]>([])
  const [publishingState, setPublishingState] = useState<string>()
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
    setErrors((errors) => [...errors, error])
    originalOnError?.(error)
  }
  publishSubplebbitEditOptions.onError = onError

  // define onChallenge if not defined
  const originalOnChallenge = publishSubplebbitEditOptions.onChallenge
  const onChallenge = async (challenge: Challenge, subplebbitEdit: SubplebbitEdit) => {
    // cannot set a function directly with setState
    setPublishChallengeAnswers(() => subplebbitEdit?.publishChallengeAnswers.bind(subplebbitEdit))
    setChallenge(challenge)
    originalOnChallenge?.(challenge, subplebbitEdit)
  }
  publishSubplebbitEditOptions.onChallenge = onChallenge

  // define onChallengeVerification if not defined
  const originalOnChallengeVerification = publishSubplebbitEditOptions.onChallengeVerification
  const onChallengeVerification = async (challengeVerification: ChallengeVerification, subplebbitEdit: SubplebbitEdit) => {
    setChallengeVerification(challengeVerification)
    originalOnChallengeVerification?.(challengeVerification, subplebbitEdit)
  }
  publishSubplebbitEditOptions.onChallengeVerification = onChallengeVerification

  // change state on publishing state change
  publishSubplebbitEditOptions.onPublishingStateChange = (publishingState: string) => {
    setPublishingState(publishingState)
  }

  const publishSubplebbitEdit = async () => {
    try {
      await accountsActions.publishSubplebbitEdit(subplebbitAddress, publishSubplebbitEditOptions, accountName)
    } catch (e: any) {
      setErrors((errors) => [...errors, e])
      publishSubplebbitEditOptions.onError?.(e)
    }
  }

  return useMemo(
    () => ({
      challenge,
      challengeVerification,
      publishSubplebbitEdit,
      publishChallengeAnswers: publishChallengeAnswers || publishChallengeAnswersNotReady,
      state: publishingState || initialState,
      error: errors[errors.length - 1],
      errors,
    }),
    [publishingState, initialState, errors, challenge, challengeVerification, options, accountName, publishChallengeAnswers]
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
      setErrors((errors) => [...errors, e])
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
