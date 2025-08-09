// Mirror Karma's injected debug flag using localStorage for browser runs
if (typeof window !== 'undefined') {
  try {
    if (process?.env?.DEBUG) {
      window.localStorage.setItem('debug', String(process.env.DEBUG))
    }
  } catch (_) {}

  // Surface browser import/parse errors in logs
  window.addEventListener('error', (e) => {
    // eslint-disable-next-line no-console
    console.error('window.error', e.message, e.error?.stack || '')
  })
  window.addEventListener('unhandledrejection', (e) => {
    // eslint-disable-next-line no-console
    console.error('unhandledrejection', e.reason?.message || e.reason || '')
  })
}

// Vitest already provides expect with chai-style matchers. No override needed.

// Mocha-style aliases so existing tests using before/after run under Vitest
import {beforeAll, afterAll} from 'vitest'
// @ts-ignore
globalThis.before = globalThis.before || beforeAll
// @ts-ignore
globalThis.after = globalThis.after || afterAll

// Real browsers already provide TextEncoder/TextDecoder and fetch
