"use strict";
// NOTE: don't import plebbit-js directly to be able to mock it for unit tests
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockPlebbitJs = void 0;
function Plebbit(plebbitOptions) { } // should import from plebbit-js npm module later instead
const PlebbitJs = {
    Plebbit: Plebbit
};
// mock the plebbit-js module for unit tests
function mockPlebbitJs(_Plebbit) {
    PlebbitJs.Plebbit = _Plebbit;
}
exports.mockPlebbitJs = mockPlebbitJs;
exports.default = PlebbitJs;
