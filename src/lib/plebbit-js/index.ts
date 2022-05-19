// NOTE: don't import plebbit-js directly to be able to replace the implementation

import PlebbitJsMockContent from './plebbit-js-mock-content'
const Plebbit = (options: any): any => ({})

const PlebbitJs = {
  Plebbit: Plebbit,
}

/**
 * replace PlebbitJs with a different implementation, for
 * example to mock it during unit tests, to add mock content
 * for developing the front-end or to add a PlebbitJs with
 * desktop privileges in the Electron build.
 */
export function setPlebbitJs(_Plebbit: any) {
  PlebbitJs.Plebbit = _Plebbit
}

try {
  // mock content for front-end dev with this env var
  if (process.env.REACT_APP_PLEBBIT_REACT_HOOKS_MOCK_CONTENT) {
    setPlebbitJs(PlebbitJsMockContent)
  }
} catch (e) {}

export default PlebbitJs
