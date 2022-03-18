"use strict";
// this file is not part of the tests
// only use it to log the content mock and see if the outputs make sense
// use `jest --testRegex plebbit-js-mock-content.donttest.ts` to run
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
process.env.REACT_APP_PLEBBIT_REACT_HOOKS_MOCK_CONTENT = '1';
process.env.REACT_APP_PLEBBIT_REACT_HOOKS_MOCK_CONTENT_LOADING_TIME = '100';
const react_hooks_1 = require("@testing-library/react-hooks");
const test_utils_1 = __importDefault(require("../../lib/test-utils"));
const index_1 = require("../../index");
const plebbit_provider_1 = __importDefault(require("../../providers/plebbit-provider"));
const localforage_lru_1 = __importDefault(require("../../lib/localforage-lru"));
const localforage_1 = __importDefault(require("localforage"));
const deleteDatabases = () => Promise.all([
    localforage_1.default.createInstance({ name: 'accountsMetadata' }).clear(),
    localforage_1.default.createInstance({ name: 'accounts' }).clear(),
    localforage_lru_1.default.createInstance({ name: 'subplebbits' }).clear(),
    localforage_lru_1.default.createInstance({ name: 'comments' }).clear(),
    localforage_lru_1.default.createInstance({ name: 'sortedPosts' }).clear()
]);
describe('mock content', () => {
    beforeAll(() => {
        test_utils_1.default.silenceUpdateUnmountedComponentWarning();
    });
    afterAll(() => {
        test_utils_1.default.restoreAll();
    });
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield deleteDatabases();
    }));
    test('use comments', () => __awaiter(void 0, void 0, void 0, function* () {
        const rendered = (0, react_hooks_1.renderHook)((commentCid) => (0, index_1.useComment)(commentCid), { wrapper: plebbit_provider_1.default });
        expect(rendered.result.current).toBe(undefined);
        rendered.rerender('QmXxWyFRBUReRNzyJueFLFh84Mtj7ycbySktRQ5ffZLVa0');
        try {
            yield rendered.waitFor(() => typeof rendered.result.current.cid === 'string');
        }
        catch (e) {
            console.error(e);
        }
        console.log(rendered.result.current);
        try {
            yield rendered.waitFor(() => typeof rendered.result.current.upvoteCount === 'number');
        }
        catch (e) {
            console.error(e);
        }
        console.log(rendered.result.current);
        rendered.rerender('QmXxWyFRBUReRNzyJueFLFh84Mtj7ycbySktRQ5ffZLVa1');
        try {
            yield rendered.waitFor(() => typeof rendered.result.current.cid === 'string');
        }
        catch (e) {
            console.error(e);
        }
        console.log(rendered.result.current);
        rendered.rerender('QmXxWyFRBUReRNzyJueFLFh84Mtj7ycbySktRQ5ffZLVa2');
        try {
            yield rendered.waitFor(() => typeof rendered.result.current.cid === 'string');
        }
        catch (e) {
            console.error(e);
        }
        console.log(rendered.result.current);
        rendered.rerender('QmXxWyFRBUReRNzyJueFLFh84Mtj7ycbySktRQ5ffZLVa3');
        try {
            yield rendered.waitFor(() => typeof rendered.result.current.cid === 'string');
        }
        catch (e) {
            console.error(e);
        }
        console.log(rendered.result.current);
    }));
    test('use subplebbits', () => __awaiter(void 0, void 0, void 0, function* () {
        const rendered = (0, react_hooks_1.renderHook)((subplebbitAddress) => (0, index_1.useSubplebbit)(subplebbitAddress), { wrapper: plebbit_provider_1.default });
        expect(rendered.result.current).toBe(undefined);
        rendered.rerender('memes.eth');
        try {
            yield rendered.waitFor(() => typeof rendered.result.current.address === 'string');
        }
        catch (e) {
            console.error(e);
        }
        console.log(rendered.result.current);
        console.log(rendered.result.current.sortedPosts.hot.comments);
    }));
    test('use feed', () => __awaiter(void 0, void 0, void 0, function* () {
        const rendered = (0, react_hooks_1.renderHook)((subplebbitAddresses) => (0, index_1.useFeed)(subplebbitAddresses, 'new'), { wrapper: plebbit_provider_1.default });
        const scrollOnePage = () => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const nextFeedLength = (((_a = rendered.result.current.feed) === null || _a === void 0 ? void 0 : _a.length) || 0) + 25;
            (0, react_hooks_1.act)(() => { rendered.result.current.loadMore(); });
            try {
                yield rendered.waitFor(() => { var _a; return ((_a = rendered.result.current.feed) === null || _a === void 0 ? void 0 : _a.length) >= nextFeedLength; });
            }
            catch (e) {
                console.error('scrollOnePage failed:', e);
            }
        });
        rendered.rerender(['memes.eth', 'news.eth']);
        try {
            yield rendered.waitFor(() => { var _a; return ((_a = rendered.result.current.feed) === null || _a === void 0 ? void 0 : _a.length) > 0; });
        }
        catch (e) {
            console.error(e);
        }
        yield scrollOnePage();
        yield scrollOnePage();
        yield scrollOnePage();
        yield scrollOnePage();
        yield scrollOnePage();
        yield scrollOnePage();
        yield scrollOnePage();
        console.log(rendered.result.current);
    }));
});
