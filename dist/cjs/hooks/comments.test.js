"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const react_hooks_1 = require("@testing-library/react-hooks");
const test_utils_1 = __importDefault(require("../lib/test-utils"));
const index_1 = require("../index");
const plebbit_provider_1 = __importDefault(require("../providers/plebbit-provider"));
const localforage_lru_1 = __importDefault(require("../lib/localforage-lru"));
const plebbit_js_mock_1 = __importStar(require("../lib/plebbit-js/plebbit-js-mock"));
(0, plebbit_js_mock_1.mockPlebbitJs)(plebbit_js_mock_1.default);
const deleteDatabases = () => Promise.all([localforage_lru_1.default.createInstance({ name: 'comments' }).clear()]);
describe('comments', () => {
    beforeAll(() => {
        test_utils_1.default.silenceUpdateUnmountedComponentWarning();
    });
    afterAll(() => {
        test_utils_1.default.restoreAll();
    });
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield deleteDatabases();
    }));
    describe('no comments in database', () => {
        test('get comments one at a time', () => __awaiter(void 0, void 0, void 0, function* () {
            // on first render, the account is undefined because it's not yet loaded from database
            const rendered = (0, react_hooks_1.renderHook)((commentCid) => (0, index_1.useComment)(commentCid), { wrapper: plebbit_provider_1.default });
            expect(rendered.result.current).toBe(undefined);
            rendered.rerender('comment cid 1');
            try {
                yield rendered.waitFor(() => typeof rendered.result.current.cid === 'string');
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered.result.current.cid).toBe('comment cid 1');
            // wait for comment.on('update') to fetch the ipns
            try {
                yield rendered.waitFor(() => typeof rendered.result.current.cid === 'string'
                    && typeof rendered.result.current.upvoteCount === 'number');
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered.result.current.cid).toBe('comment cid 1');
            expect(rendered.result.current.upvoteCount).toBe(3);
            rendered.rerender('comment cid 2');
            // wait for addCommentToContext action
            try {
                yield rendered.waitFor(() => typeof rendered.result.current.cid === 'string');
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered.result.current.cid).toBe('comment cid 2');
            // wait for comment.on('update') to fetch the ipns
            try {
                yield rendered.waitForNextUpdate();
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered.result.current.cid).toBe('comment cid 2');
            expect(rendered.result.current.upvoteCount).toBe(3);
            // get comment 1 again, no need to wait for any updates
            rendered.rerender('comment cid 1');
            expect(rendered.result.current.cid).toBe('comment cid 1');
            expect(rendered.result.current.upvoteCount).toBe(3);
            // make sure comments are still in database
            const getComment = plebbit_js_mock_1.Plebbit.prototype.getComment;
            const simulateUpdateEvent = plebbit_js_mock_1.Comment.prototype.simulateUpdateEvent;
            // mock getComment on the Plebbit class
            plebbit_js_mock_1.Plebbit.prototype.getComment = (commentCid) => {
                throw Error(`plebbit.getComment called with comment cid '${commentCid}' should not be called when getting comments from database`);
            };
            // don't simulate 'update' event during this test to see if the updates were saved to database
            let throwOnCommentUpdateEvent = false;
            plebbit_js_mock_1.Comment.prototype.simulateUpdateEvent = () => {
                if (throwOnCommentUpdateEvent) {
                    throw Error('no comment update events should be emitted when comment already in context');
                }
            };
            // on first render, the account is undefined because it's not yet loaded from database
            const rendered2 = (0, react_hooks_1.renderHook)((commentCid) => (0, index_1.useComment)(commentCid), { wrapper: plebbit_provider_1.default });
            expect(rendered2.result.current).toBe(undefined);
            rendered2.rerender('comment cid 1');
            // wait to get account loaded
            try {
                yield rendered2.waitForNextUpdate();
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered2.result.current.cid).toBe('comment cid 1');
            expect(rendered2.result.current.upvoteCount).toBe(3);
            rendered2.rerender('comment cid 2');
            // wait for addCommentToContext action
            try {
                yield rendered2.waitForNextUpdate();
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered2.result.current.cid).toBe('comment cid 2');
            expect(rendered2.result.current.upvoteCount).toBe(3);
            // get comment 1 again from context, should not trigger any comment updates
            throwOnCommentUpdateEvent = true;
            rendered2.rerender('comment cid 1');
            expect(rendered2.result.current.cid).toBe('comment cid 1');
            expect(rendered2.result.current.upvoteCount).toBe(3);
            // restore mock
            plebbit_js_mock_1.Comment.prototype.simulateUpdateEvent = simulateUpdateEvent;
            plebbit_js_mock_1.Plebbit.prototype.getComment = getComment;
        }));
        test('get multiple comments at once', () => __awaiter(void 0, void 0, void 0, function* () {
            const rendered = (0, react_hooks_1.renderHook)((commentCids) => (0, index_1.useComments)(commentCids), { wrapper: plebbit_provider_1.default });
            expect(rendered.result.current).toEqual([]);
            rendered.rerender(['comment cid 1', 'comment cid 2', 'comment cid 3']);
            expect(rendered.result.current).toEqual([undefined, undefined, undefined]);
            try {
                yield rendered.waitFor(() => typeof rendered.result.current[0].cid === 'string'
                    && typeof rendered.result.current[1].cid === 'string'
                    && typeof rendered.result.current[2].cid === 'string');
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered.result.current[0].cid).toBe('comment cid 1');
            expect(rendered.result.current[1].cid).toBe('comment cid 2');
            expect(rendered.result.current[2].cid).toBe('comment cid 3');
            try {
                yield rendered.waitFor(() => typeof rendered.result.current[0].upvoteCount === 'number'
                    && typeof rendered.result.current[1].upvoteCount === 'number'
                    && typeof rendered.result.current[2].upvoteCount === 'number');
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered.result.current[0].upvoteCount).toBe(3);
            expect(rendered.result.current[1].upvoteCount).toBe(3);
            expect(rendered.result.current[2].upvoteCount).toBe(3);
        }));
    });
});
