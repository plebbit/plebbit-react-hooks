if (typeof window !== 'undefined') {
  try {
    if (localStorageDebug) {
      window.localStorage.setItem('debug', localStorageDebug)
    }
  } catch (_) {}

  // browser import/parse errors in logs
  window.addEventListener('error', (e) => {
    // eslint-disable-next-line no-console
    console.error('window.error', e.message, e.error?.stack || '')
  })
  window.addEventListener('unhandledrejection', (e) => {
    // eslint-disable-next-line no-console
    console.error('unhandledrejection', e.reason?.message || e.reason || '')
  })
}

// mocha-style aliases so existing tests using before/after run under vitest
import {beforeAll, afterAll} from 'vitest'
// @ts-ignore
globalThis.before = globalThis.before || beforeAll
// @ts-ignore
globalThis.after = globalThis.after || afterAll
