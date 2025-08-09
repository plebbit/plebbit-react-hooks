// Mirror Karma's injected debug flag using localStorage for browser runs
if (typeof window !== 'undefined') {
  try {
    if (process?.env?.DEBUG) {
      window.localStorage.setItem('debug', String(process.env.DEBUG))
    }
  } catch (_) {}
}

// Provide chai's expect to keep `expect(...).to.equal(...)` assertions working unchanged
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const chai = require('chai')
  // @ts-ignore
  globalThis.expect = chai.expect
} catch (_) {}

// Mocha-style aliases so existing tests using before/after run under Vitest
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const {beforeAll, afterAll} = require('vitest')
  // @ts-ignore
  globalThis.before = globalThis.before || beforeAll
  // @ts-ignore
  globalThis.after = globalThis.after || afterAll
} catch (_) {}

// Real browsers already provide TextEncoder/TextDecoder and fetch
