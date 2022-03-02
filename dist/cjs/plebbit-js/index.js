"use strict";
// NOTE: don't import plebbit-js directly to be able to mock it for unit tests
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockPlebbitJs = void 0;
function Plebbit(plebbitOptions) { } // should import from plebbit-js npm module later instead
function Subplebbit(subplebbitOptions) { } // should import from plebbit-js npm module later instead
const PlebbitJs = {
    Plebbit: Plebbit,
    Subplebbit: Subplebbit,
};
// mock the plebbit-js module for unit tests
function mockPlebbitJs(_Plebbit) {
    PlebbitJs.Plebbit = _Plebbit;
    PlebbitJs.Subplebbit = _Plebbit.Subplebbit;
}
exports.mockPlebbitJs = mockPlebbitJs;
exports.default = PlebbitJs;
