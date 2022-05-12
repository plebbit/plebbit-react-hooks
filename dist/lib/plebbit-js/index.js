// NOTE: don't import plebbit-js directly to be able to mock it for unit tests
var _a;
import PlebbitJsMockContent from './plebbit-js-mock-content';
// @ts-ignore
// import Plebbit from "@plebbit/plebbit-js"
const Plebbit = (options) => ({});
const PlebbitJs = {
    Plebbit: Plebbit,
};
// mock the plebbit-js module for unit tests
export function mockPlebbitJs(_Plebbit) {
    PlebbitJs.Plebbit = _Plebbit;
}
// mock content for front-end dev with this env var
if ((_a = process === null || process === void 0 ? void 0 : process.env) === null || _a === void 0 ? void 0 : _a.REACT_APP_PLEBBIT_REACT_HOOKS_MOCK_CONTENT) {
    mockPlebbitJs(PlebbitJsMockContent);
}
export default PlebbitJs;
