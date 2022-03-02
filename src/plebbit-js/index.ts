// NOTE: don't import plebbit-js directly to be able to mock it for unit tests

function Plebbit(plebbitOptions: any) {} // should import from plebbit-js npm module later instead
function Subplebbit(subplebbitOptions: any) {} // should import from plebbit-js npm module later instead

const PlebbitJs = {
  Plebbit: Plebbit,
  Subplebbit: Subplebbit,
}

// mock the plebbit-js module for unit tests
export function mockPlebbitJs(_Plebbit: any) {
  PlebbitJs.Plebbit = _Plebbit
  PlebbitJs.Subplebbit = _Plebbit.Subplebbit
}

export default PlebbitJs
