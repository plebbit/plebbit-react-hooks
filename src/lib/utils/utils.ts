import assert from 'assert'
import QuickLru from 'quick-lru'
import Logger from '@plebbit/plebbit-logger'
import PlebbitJs from '../plebbit-js'
import {Comment} from '../../types'
const log = Logger('plebbit-react-hooks:utils')

const merge = (...args: any) => {
  // @ts-ignore
  const clonedArgs = args.map((arg) => {
    assert(arg && typeof arg === 'object', `utils.merge argument '${arg}' not an object`)
    return clone(arg)
  })
  const mergedObj: any = {}
  while (clonedArgs.length) {
    const currentArg = clonedArgs.shift()
    for (const i in currentArg) {
      if (currentArg[i] === undefined || currentArg[i] === null) {
        continue
      }
      mergedObj[i] = currentArg[i]
    }
  }
  return mergedObj
}

const clone = (obj: any) => {
  assert(obj && typeof obj === 'object', `utils.clone argument '${obj}' not an object`)
  let clonedObj: any = {}

  // clean the object to be cloned
  for (const i in obj) {
    // remove functions
    if (typeof obj[i] === 'function') {
      continue
    }
    // remove internal props
    if (i.startsWith('_')) {
      continue
    }
    if (obj[i] === undefined || obj[i] === null) {
      continue
    }
    // plebbit-js has a bug where plebbit instances have circular deps
    if (obj[i]?.constructor?.name === 'Plebbit') {
      continue
    }
    clonedObj[i] = obj[i]
  }

  // clone the object
  clonedObj = JSON.parse(JSON.stringify(clonedObj))
  return clonedObj
}

// this function should not clone the comments to not waste memory
export const flattenCommentsPages = (pageInstanceOrPagesInstance: any) => {
  const flattenedComments = []

  // if is a Page instance
  if (pageInstanceOrPagesInstance?.comments) {
    for (const comment of pageInstanceOrPagesInstance.comments) {
      flattenedComments.push(comment)
      if (comment.replies?.pages && Object.keys(comment.replies.pages).length) {
        flattenedComments.push(...flattenCommentsPages(comment.replies))
      }
    }
  }

  // if is a Pages instance
  else if (pageInstanceOrPagesInstance?.pages) {
    for (const sortType in pageInstanceOrPagesInstance.pages) {
      flattenedComments.push(...flattenCommentsPages(pageInstanceOrPagesInstance.pages[sortType]))
    }
  }

  // if is a Pages.pages instance
  else {
    for (const sortType in pageInstanceOrPagesInstance) {
      const page = pageInstanceOrPagesInstance[sortType]
      if (page?.comments?.length) {
        flattenedComments.push(...flattenCommentsPages(page))
      }
    }
  }

  // remove duplicate comments
  const flattenedCommentsObject = {}
  for (const comment of flattenedComments) {
    // @ts-ignore
    flattenedCommentsObject[comment.cid] = comment
  }
  const uniqueFlattened = []
  for (const cid in flattenedCommentsObject) {
    // @ts-ignore
    uniqueFlattened.push(flattenedCommentsObject[cid])
  }

  return uniqueFlattened
}

export const memo = (functionToMemo: Function, memoOptions: any) => {
  assert(typeof functionToMemo === 'function', `memo first argument must be a function`)
  const pendingPromises: any = new Map()
  const cache = new QuickLru(memoOptions)

  // preserve function name
  const memoedFunctionName = functionToMemo.name || 'memoedFunction'
  const obj = {
    [memoedFunctionName]: async (...args: any) => {
      let cacheKey = args[0]
      if (args.length > 1) {
        cacheKey = ''
        for (const arg of args) {
          if (typeof arg !== 'string' && typeof arg !== 'number' && arg !== undefined && arg !== null) {
            const argumentIndex = args.indexOf(arg)
            throw Error(
              `memoed function '${memoedFunctionName}' invalid argument number '${argumentIndex}' '${arg}', memoed function can only use multiple arguments if they are all of type string, number, undefined or null`
            )
          }
          cacheKey += arg
        }
      }

      // has cached result
      const cached = cache.get(cacheKey)
      if (cached) {
        return cached
      }

      // don't request the same thing twice if fetching is pending
      let pendingPromise = pendingPromises.get(cacheKey)
      if (pendingPromise) {
        return pendingPromise
      }

      // create the pending promise
      let resolve: any, reject: any
      pendingPromise = new Promise((_resolve, _reject) => {
        resolve = _resolve
        reject = _reject
      })
      pendingPromises.set(cacheKey, pendingPromise)

      // execute the function
      try {
        const result = await functionToMemo(...args)
        cache.set(cacheKey, result)
        pendingPromises.delete(cacheKey)
        resolve?.(result)
      } catch (error) {
        pendingPromises.delete(cacheKey)
        reject?.(error)
      }

      return pendingPromise
    },
  }
  return obj[memoedFunctionName]
}

export const memoSync = (functionToMemo: Function, memoOptions: any) => {
  assert(typeof functionToMemo === 'function', `memo first argument must be a function`)
  const cache = new QuickLru(memoOptions)

  // preserve function name
  const memoedFunctionName = functionToMemo.name || 'memoedFunction'
  const obj = {
    [memoedFunctionName]: (...args: any) => {
      let cacheKey = args[0]
      if (args.length > 1) {
        cacheKey = ''
        for (const arg of args) {
          if (typeof arg !== 'string' && typeof arg !== 'number' && arg !== undefined && arg !== null) {
            const argumentIndex = args.indexOf(arg)
            throw Error(
              `memoed function '${memoedFunctionName}' invalid argument number '${argumentIndex}' '${arg}', memoed function can only use multiple arguments if they are all of type string, number, undefined or null`
            )
          }
          cacheKey += arg
        }
      }

      // has cached result
      const cached = cache.get(cacheKey)
      if (cached) {
        return cached
      }

      // execute the function
      const result = functionToMemo(...args)
      if (typeof result?.then === 'function') {
        throw Error(`memoed function '${memoedFunctionName}' is an async function, cannot be used with memoSync, use memo instead`)
      }
      cache.set(cacheKey, result)
      return result
    },
  }
  return obj[memoedFunctionName]
}

export const clientsOnStateChange = (clients: any, onStateChange: Function) => {
  for (const clientUrl in clients?.ipfsGateways) {
    clients?.ipfsGateways?.[clientUrl].on('statechange', (state: string) => onStateChange(state, 'ipfsGateways', clientUrl))
  }
  for (const clientUrl in clients?.kuboRpcClients) {
    clients?.kuboRpcClients?.[clientUrl].on('statechange', (state: string) => onStateChange(state, 'kuboRpcClients', clientUrl))
  }
  for (const clientUrl in clients?.pubsubKuboRpcClients) {
    clients?.pubsubKuboRpcClients?.[clientUrl].on('statechange', (state: string) => onStateChange(state, 'pubsubKuboRpcClients', clientUrl))
  }
  for (const clientUrl in clients?.plebbitRpcClients) {
    clients?.plebbitRpcClients?.[clientUrl].on('statechange', (state: string) => onStateChange(state, 'plebbitRpcClients', clientUrl))
  }
  for (const clientUrl in clients?.libp2pJsClients) {
    clients?.libp2pJsClients?.[clientUrl].on('statechange', (state: string) => onStateChange(state, 'libp2pJsClients', clientUrl))
  }
  for (const chainTicker in clients?.chainProviders) {
    for (const clientUrl in clients?.chainProviders?.[chainTicker]) {
      clients?.chainProviders?.[chainTicker]?.[clientUrl].on('statechange', (state: string) => onStateChange(state, 'chainProviders', clientUrl, chainTicker))
    }
  }
}

export const subplebbitPostsCacheExpired = (subplebbit: any) => {
  // NOTE: fetchedAt is undefined on owner subplebbits
  if (!subplebbit?.fetchedAt) {
    false
  }
  // if subplebbit cache is older than 1 hour, its subplebbit.posts are considered expired
  const oneHourAgo = Date.now() / 1000 - 60 * 60
  return oneHourAgo > subplebbit.fetchedAt
}

export const removeInvalidComments = async (comments: Comment[], {validateReplies, blockSubplebbit}: any, plebbit: any) => {
  if (!comments.length) {
    return []
  }
  const isValid = await Promise.all(comments.map((comment) => commentIsValid(comment, {validateReplies, blockSubplebbit}, plebbit)))
  const validComments = comments.filter((_, i) => isValid[i])
  return validComments
}

const subplebbitsWithInvalidComments: {[subplebbitAddress: string]: boolean} = {}
export const commentIsValid = async (comment: Comment, {validateReplies, blockSubplebbit}: any = {}, plebbit: any) => {
  validateReplies = Boolean(validateReplies)
  if (blockSubplebbit === undefined || blockSubplebbit === null) {
    blockSubplebbit = true
  }
  if (!comment) {
    return false
  }
  if (subplebbitsWithInvalidComments[comment.subplebbitAddress]) {
    console.log(`subplebbit '${comment.subplebbitAddress}' had an invalid comment, invalidate all its future comments to avoid wasting resources`)
    return false
  }
  try {
    await plebbit.validateComment(comment, {validateReplies})
  } catch (e) {
    if (blockSubplebbit) {
      subplebbitsWithInvalidComments[comment.subplebbitAddress] = true
    }
    console.log('invalid comment', {comment, error: e})
    return false
  }
  return true
}

export const repliesAreValid = async (comment: Comment, {validateReplies, blockSubplebbit}: any = {}, plebbit: any) => {
  validateReplies = Boolean(validateReplies)
  if (blockSubplebbit === undefined || blockSubplebbit === null) {
    blockSubplebbit = true
  }
  if (!comment) {
    return false
  }
  if (subplebbitsWithInvalidComments[comment.subplebbitAddress]) {
    console.log(`subplebbit '${comment.subplebbitAddress}' had an invalid comment, invalidate all its future comments to avoid wasting resources`)
    return false
  }
  const replyPageArray: any[] = Object.values(comment.replies?.pages || {})
  const replies = replyPageArray.flatMap(({comments}) => comments)

  // manual validation
  for (const reply of replies) {
    if (reply.subplebbitAddress !== comment.subplebbitAddress || reply.depth !== comment.depth + 1 || reply.parentCid !== comment.cid) {
      if (blockSubplebbit) {
        subplebbitsWithInvalidComments[comment.subplebbitAddress] = true
      }
      console.log('invalid comment', {
        comment: reply,
        error: 'reply.subplebbitAddress !== comment.subplebbitAddress || reply.depth !== comment.depth + 1 || reply.parentCid !== comment.cid',
      })
      return false
    }
  }

  // signature verification
  try {
    const promises = replies.map((reply) => commentIsValid(reply, {validateReplies: false, blockSubplebbit: true}, plebbit))
    await Promise.all(promises)
  } catch (e: any) {
    if (blockSubplebbit) {
      subplebbitsWithInvalidComments[comment.subplebbitAddress] = true
    }
    console.log('invalid comment', {comment, error: e})
    return false
  }
  return true
}

const utils = {
  merge,
  clone,
  flattenCommentsPages,
  memo,
  memoSync,
  retryInfinity: (f: any, o?: any): any => {},
  // export timeout values to mock them in tests
  retryInfinityMinTimeout: 1000,
  retryInfinityMaxTimeout: 1000 * 60 * 60 * 24,
  clientsOnStateChange,
  subplebbitPostsCacheExpired,
  commentIsValid,
  removeInvalidComments,
  repliesAreValid,
}

export const retryInfinity = async (functionToRetry: any, options?: any) => {
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
  let attempt = 0
  while (true) {
    try {
      const res = await functionToRetry()
      return res
    } catch (e) {
      options?.onError(e || Error(`retryInfinity failed attempt ${attempt}`))
      const factor = 2
      let timeout = Math.round(utils.retryInfinityMinTimeout * Math.pow(factor, attempt++))
      timeout = Math.min(timeout, utils.retryInfinityMaxTimeout)
      await sleep(timeout)
    }
  }
}
utils.retryInfinity = retryInfinity

export default utils
