// NOTE: don't import plebbit-js directly to be able to replace the implementation

import PlebbitJsMockContent from './plebbit-js-mock-content'
import Logger from '@plebbit/plebbit-logger'
import Plebbit from '@plebbit/plebbit-js/dist/browser/index'
import assert from 'assert'
const log = Logger('plebbit-react-hooks:plebbit-js')

const PlebbitJs: any = {
  Plebbit: Plebbit,
}

/**
 * replace PlebbitJs with a different implementation, for
 * example to mock it during unit tests, to add mock content
 * for developing the front-end or to add a PlebbitJs with
 * desktop privileges in the Electron build.
 */
export function setPlebbitJs(_Plebbit: any) {
  assert(typeof _Plebbit === 'function', `setPlebbitJs invalid Plebbit argument '${_Plebbit}' not a function`)
  PlebbitJs.Plebbit = _Plebbit
  log('setPlebbitJs', _Plebbit?.name)
}

export function restorePlebbitJs() {
  PlebbitJs.Plebbit = Plebbit
  log('restorePlebbitJs')
}

try {
  // mock content for front-end dev with this env var
  if (process.env.REACT_APP_PLEBBIT_REACT_HOOKS_MOCK_CONTENT) {
    setPlebbitJs(PlebbitJsMockContent)
  }
} catch (e) {}

export default PlebbitJs
