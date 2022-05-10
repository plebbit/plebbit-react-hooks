// NOTE: don't import plebbit-js directly to be able to mock it for unit tests
import PlebbitJsMockContent from './plebbit-js-mock-content';
function Plebbit(plebbitOptions) { } // should import from plebbit-js npm module later instead
const PlebbitJs = {
    Plebbit: Plebbit,
};
// mock the plebbit-js module for unit tests
export function mockPlebbitJs(_Plebbit) {
    PlebbitJs.Plebbit = _Plebbit;
}
// mock content for front-end dev with this env var
if (process.env.REACT_APP_PLEBBIT_REACT_HOOKS_MOCK_CONTENT) {
    mockPlebbitJs(PlebbitJsMockContent);
}
export default PlebbitJs;