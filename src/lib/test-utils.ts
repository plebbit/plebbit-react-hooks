import {resetCommentsStore, resetCommentsDatabaseAndStore} from '../stores/comments'
import {resetSubplebbitsStore, resetSubplebbitsDatabaseAndStore} from '../stores/subplebbits'
import {resetAccountsStore, resetAccountsDatabaseAndStore} from '../stores/accounts'
import {resetFeedsStore, resetFeedsDatabaseAndStore} from '../stores/feeds'
import {resetSubplebbitsPagesStore, resetSubplebbitsPagesDatabaseAndStore} from '../hooks/feeds/use-subplebbits-pages'
import localForageLru from './localforage-lru'
import localForage from 'localforage'

const restorables: any = []

export const silenceUpdateUnmountedComponentWarning = () => {
  const originalError = console.error
  console.error = (...args) => {
    if (/Can't perform a React state update on an unmounted component/.test(args[0])) {
      return
    }
    originalError.call(console, ...args)
  }
  const restore = () => {
    console.error = originalError
  }
  restorables.push(restore)
  return restore
}

export const silenceTestWasNotWrappedInActWarning = () => {
  const originalError = console.error
  console.error = (...args) => {
    if (/inside a test was not wrapped in act/.test(args[0])) {
      return
    }
    originalError.call(console, ...args)
  }
  const restore = () => {
    console.error = originalError
  }
  restorables.push(restore)
  return restore
}

export const silenceReactWarnings = () => {
  silenceUpdateUnmountedComponentWarning()
  silenceTestWasNotWrappedInActWarning()
}

const restoreAll = () => {
  for (const restore of restorables) {
    restore()
  }
}

type WaitForOptions = {
  timeout?: number
  interval?: number
}
const createWaitFor = (rendered: any, waitForOptions?: WaitForOptions) => {
  if (!rendered?.result) {
    throw Error(`createWaitFor invalid 'rendered' argument`)
  }
  const waitFor = async (waitForFunction: Function) => {
    // format error stack trace for usefulness
    const stackTraceLimit = Error.stackTraceLimit
    Error.stackTraceLimit = 10
    const errorWithUsefulStackTrace = new Error('waitFor')
    Error.stackTraceLimit = stackTraceLimit

    if (typeof waitForFunction !== 'function') {
      throw Error(`waitFor invalid 'waitForFunction' argument`)
    }
    // @ts-ignore
    if (typeof waitForFunction.then === 'function') {
      throw Error(`waitFor 'waitForFunction' can't be async`)
    }
    try {
      await rendered.waitFor(() => Boolean(waitForFunction()), waitForOptions)
    } catch (e) {
      // @ts-ignore
      errorWithUsefulStackTrace.message = `${e.message} ${waitForFunction.toString()}`
      console.warn(errorWithUsefulStackTrace)
    }
  }
  return waitFor
}

export const resetStores = async () => {
  await resetSubplebbitsPagesStore()
  await resetFeedsStore()
  await resetSubplebbitsStore()
  await resetCommentsStore()
  // always accounts last because it has async initialization
  await resetAccountsStore()
}

export const resetDatabasesAndStores = async () => {
  await resetSubplebbitsPagesDatabaseAndStore()
  await resetFeedsDatabaseAndStore()
  await resetSubplebbitsDatabaseAndStore()
  await resetCommentsDatabaseAndStore()
  // always accounts last because it has async initialization
  await resetAccountsDatabaseAndStore()
}

const testUtils = {
  silenceTestWasNotWrappedInActWarning,
  silenceUpdateUnmountedComponentWarning,
  silenceReactWarnings,
  restoreAll,
  createWaitFor,
  resetStores,
  resetDatabasesAndStores,
}

export default testUtils
