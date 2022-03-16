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
const localforage_1 = __importDefault(require("localforage"));
const plebbit_js_mock_1 = __importStar(require("../lib/plebbit-js/plebbit-js-mock"));
(0, plebbit_js_mock_1.mockPlebbitJs)(plebbit_js_mock_1.default);
const deleteDatabases = () => Promise.all([
    localforage_1.default.createInstance({ name: 'accountsMetadata' }).clear(),
    localforage_1.default.createInstance({ name: 'accounts' }).clear(),
]);
describe('accounts', () => {
    beforeAll(() => {
        test_utils_1.default.silenceUpdateUnmountedComponentWarning();
    });
    afterAll(() => {
        test_utils_1.default.restoreAll();
    });
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield deleteDatabases();
    }));
    describe('no accounts in database', () => {
        test('generate default account on load', () => __awaiter(void 0, void 0, void 0, function* () {
            // on first render, the account is undefined because it's not yet loaded from database
            const rendered = (0, react_hooks_1.renderHook)(() => (0, index_1.useAccount)(), { wrapper: index_1.PlebbitProvider });
            expect(rendered.result.current).toBe(undefined);
            // on second render, you get the default generated account
            try {
                yield rendered.waitForNextUpdate();
            }
            catch (e) {
                console.error(e);
            }
            const account = rendered.result.current;
            expect(account.name).toBe('Account 1');
            expect(account.author.displayName).toBe(null);
            expect(typeof account.author.address).toBe('string');
            expect(Array.isArray(account.subscriptions)).toBe(true);
            expect(account.blockedAddresses && typeof account.blockedAddresses === 'object').toBe(true);
            expect(account.plebbit && typeof account.plebbit === 'object').toBe(true);
            expect(account.plebbitOptions.ipfsGatewayUrl).toBe('https://cloudflare-ipfs');
            expect(account.plebbitOptions.ipfsApiUrl).toBe('http://localhost:8080');
        }));
        test.todo('default generated account has all the data defined in schema, like signer, author, plebbitOptions, etc');
        test('create new accounts', () => __awaiter(void 0, void 0, void 0, function* () {
            const rendered = (0, react_hooks_1.renderHook)((accountName) => {
                const account = (0, index_1.useAccount)(accountName);
                const { createAccount } = (0, index_1.useAccountsActions)();
                return { account, createAccount };
            }, { wrapper: index_1.PlebbitProvider });
            // on first render, the account is undefined because it's not yet loaded from database
            expect(rendered.result.current.account).toBe(undefined);
            expect(rendered.result.current.createAccount).toBe(undefined);
            // on second render, you get the default generated account
            try {
                yield rendered.waitForNextUpdate();
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered.result.current.account.name).toBe('Account 1');
            expect(typeof rendered.result.current.createAccount).toBe('function');
            yield (0, react_hooks_1.act)(() => __awaiter(void 0, void 0, void 0, function* () {
                // create 'Account 2'
                yield rendered.result.current.createAccount();
                // create 'Account 3'
                yield rendered.result.current.createAccount();
                // create account 'custom name'
                yield rendered.result.current.createAccount('custom name');
            }));
            // get created accounts by name
            rendered.rerender('Account 1');
            expect(rendered.result.current.account.name).toBe('Account 1');
            rendered.rerender('Account 2');
            expect(rendered.result.current.account.name).toBe('Account 2');
            rendered.rerender('Account 3');
            expect(rendered.result.current.account.name).toBe('Account 3');
            rendered.rerender('Account 4');
            expect(rendered.result.current.account).toBe(undefined);
            rendered.rerender('custom name');
            expect(rendered.result.current.account.name).toBe('custom name');
            // render second context with empty state to check if accounts saved to database
            const rendered2 = (0, react_hooks_1.renderHook)((accountName) => (0, index_1.useAccount)(accountName), { wrapper: index_1.PlebbitProvider });
            // accounts not yet loaded from database
            expect(rendered2.result.current).toBe(undefined);
            try {
                yield rendered2.waitForNextUpdate();
            }
            catch (e) {
                console.error(e);
            }
            // default active account is account 1
            expect(rendered2.result.current.name).toBe('Account 1');
            // get all accounts by name
            rendered2.rerender('Account 1');
            expect(rendered2.result.current.name).toBe('Account 1');
            rendered2.rerender('Account 2');
            expect(rendered2.result.current.name).toBe('Account 2');
            rendered2.rerender('Account 3');
            expect(rendered2.result.current.name).toBe('Account 3');
            rendered2.rerender('Account 4');
            expect(rendered2.result.current).toBe(undefined);
            rendered2.rerender('custom name');
            expect(rendered2.result.current.name).toBe('custom name');
        }));
    });
    describe('multiple accounts in database', () => {
        let rendered;
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            // on first render, the account is undefined because it's not yet loaded from database
            rendered = (0, react_hooks_1.renderHook)((accountName) => {
                const account = (0, index_1.useAccount)(accountName);
                const accounts = (0, index_1.useAccounts)();
                const accountsActions = (0, index_1.useAccountsActions)();
                return Object.assign({ account, accounts }, accountsActions);
            }, { wrapper: index_1.PlebbitProvider });
            // on second render, you get the default generated account
            try {
                yield rendered.waitForNextUpdate();
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered.result.current.account.name).toBe('Account 1');
            expect(typeof rendered.result.current.createAccount).toBe('function');
            yield (0, react_hooks_1.act)(() => __awaiter(void 0, void 0, void 0, function* () {
                // create 'Account 2'
                yield rendered.result.current.createAccount();
                // create 'Account 3'
                yield rendered.result.current.createAccount();
                // create account 'custom name'
                yield rendered.result.current.createAccount('custom name');
            }));
        }));
        afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
            yield deleteDatabases();
        }));
        test('change which account is active', () => __awaiter(void 0, void 0, void 0, function* () {
            // active account is Account 1
            expect(rendered.result.current.account.name).toBe('Account 1');
            expect(typeof rendered.result.current.setActiveAccount).toBe('function');
            // change active account
            yield (0, react_hooks_1.act)(() => __awaiter(void 0, void 0, void 0, function* () {
                yield rendered.result.current.setActiveAccount('Account 2');
            }));
            expect(rendered.result.current.account.name).toBe('Account 2');
            // change active account
            yield (0, react_hooks_1.act)(() => __awaiter(void 0, void 0, void 0, function* () {
                yield rendered.result.current.setActiveAccount('custom name');
            }));
            expect(rendered.result.current.account.name).toBe('custom name');
            // render second context with empty state to check if accounts saved to database
            const rendered2 = (0, react_hooks_1.renderHook)(() => (0, index_1.useAccount)(), { wrapper: index_1.PlebbitProvider });
            // accounts not yet loaded from database
            expect(rendered2.result.current).toBe(undefined);
            try {
                yield rendered2.waitForNextUpdate();
            }
            catch (e) {
                console.error(e);
            }
            // active account is still 'custom name'
            expect(rendered2.result.current.name).toBe('custom name');
        }));
        test(`fail to get account that doesn't exist`, () => {
            expect(rendered.result.current.account.name).toBe('Account 1');
            rendered.rerender('account that does not exist');
            expect(rendered.result.current.account).toBe(undefined);
            rendered.rerender('Account 1');
            expect(rendered.result.current.account.name).toBe('Account 1');
        });
        test(`fail to create account with name that already exists`, () => __awaiter(void 0, void 0, void 0, function* () {
            expect(typeof rendered.result.current.account.name).toBe('string');
            yield (0, react_hooks_1.act)(() => __awaiter(void 0, void 0, void 0, function* () {
                expect(() => rendered.result.current.createAccount(rendered.result.current.account.name)).rejects.toThrow(`account name '${rendered.result.current.account.name}' already exists in database`);
            }));
        }));
        test('edit non active account display name', () => __awaiter(void 0, void 0, void 0, function* () {
            rendered.rerender('Account 2');
            expect(rendered.result.current.account.name).toBe('Account 2');
            expect(rendered.result.current.account.author.displayName).toBe(null);
            const newAccount = JSON.parse(JSON.stringify(Object.assign({}, rendered.result.current.account)));
            newAccount.author.displayName = 'display name john';
            yield (0, react_hooks_1.act)(() => __awaiter(void 0, void 0, void 0, function* () {
                yield rendered.result.current.setAccount(newAccount);
            }));
            expect(rendered.result.current.account.author.displayName).toBe('display name john');
            // render second context with empty state to check if account change saved to database
            const rendered2 = (0, react_hooks_1.renderHook)(() => (0, index_1.useAccount)('Account 2'), { wrapper: index_1.PlebbitProvider });
            // accounts not yet loaded from database
            expect(rendered2.result.current).toBe(undefined);
            try {
                yield rendered2.waitForNextUpdate();
            }
            catch (e) {
                console.error(e);
            }
            // active account display name is still 'display name john'
            expect(rendered2.result.current.author.displayName).toBe('display name john');
        }));
        test('edit active account name and display name', () => __awaiter(void 0, void 0, void 0, function* () {
            expect(rendered.result.current.account.name).toBe('Account 1');
            expect(rendered.result.current.account.author.displayName).toBe(null);
            const newAccount = JSON.parse(JSON.stringify(Object.assign({}, rendered.result.current.account)));
            newAccount.author.displayName = 'display name john';
            newAccount.name = 'account name john';
            yield (0, react_hooks_1.act)(() => __awaiter(void 0, void 0, void 0, function* () {
                yield rendered.result.current.setAccount(newAccount);
            }));
            expect(rendered.result.current.account.author.displayName).toBe('display name john');
            expect(rendered.result.current.account.name).toBe('account name john');
            // render second context with empty state to check if account change saved to database
            const rendered2 = (0, react_hooks_1.renderHook)(() => (0, index_1.useAccount)(), { wrapper: index_1.PlebbitProvider });
            // accounts not yet loaded from database
            expect(rendered2.result.current).toBe(undefined);
            try {
                yield rendered2.waitForNextUpdate();
            }
            catch (e) {
                console.error(e);
            }
            // active account is still 'account name john'
            expect(rendered2.result.current.name).toBe('account name john');
        }));
        test('fail to edit account with wrong account id', () => __awaiter(void 0, void 0, void 0, function* () {
            const newAccount = JSON.parse(JSON.stringify(Object.assign({}, rendered.result.current.account)));
            newAccount.author.displayName = 'display name john';
            newAccount.id = 'something incorrect';
            yield (0, react_hooks_1.act)(() => __awaiter(void 0, void 0, void 0, function* () {
                expect(rendered.result.current.setAccount(newAccount)).rejects.toThrow(`cannot set account with account.id 'something incorrect' id does not exist in database`);
            }));
        }));
        test.todo('edited account can still sign and publish comments');
        test.todo(`fail to edit account.address that doesn't match signer private key`);
        test.todo('export account');
        test.todo('import account');
        test.todo(`import account with duplicate account name succeeds by adding ' 2' to account name`);
        test.todo(`import account with duplicate account id succeeds because account id is reset on import`);
        test(`change account order`, () => __awaiter(void 0, void 0, void 0, function* () {
            expect(rendered.result.current.accounts[0].name).toBe('Account 1');
            expect(rendered.result.current.accounts[1].name).toBe('Account 2');
            expect(rendered.result.current.accounts[2].name).toBe('Account 3');
            expect(rendered.result.current.accounts[3].name).toBe('custom name');
            yield (0, react_hooks_1.act)(() => __awaiter(void 0, void 0, void 0, function* () {
                expect(() => rendered.result.current.setAccountsOrder(['wrong account name', 'Account 3', 'Account 2', 'Account 1'])).rejects.toThrow();
                yield rendered.result.current.setAccountsOrder(['custom name', 'Account 3', 'Account 2', 'Account 1']);
            }));
            expect(rendered.result.current.accounts[0].name).toBe('custom name');
            expect(rendered.result.current.accounts[1].name).toBe('Account 3');
            expect(rendered.result.current.accounts[2].name).toBe('Account 2');
            expect(rendered.result.current.accounts[3].name).toBe('Account 1');
            // render second context with empty state to check if saved to database
            const rendered2 = (0, react_hooks_1.renderHook)(() => (0, index_1.useAccounts)(), { wrapper: index_1.PlebbitProvider });
            try {
                yield rendered2.waitForNextUpdate();
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered2.result.current[0].name).toBe('custom name');
            expect(rendered2.result.current[1].name).toBe('Account 3');
            expect(rendered2.result.current[2].name).toBe('Account 2');
            expect(rendered2.result.current[3].name).toBe('Account 1');
        }));
        test.todo(`delete active account, active account switches second account in accountNames`);
        test.todo(`delete all accounts and create a new one, which becomes active`);
    });
    describe('no comments or votes in database', () => {
        let rendered;
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            // on first render, the account is undefined because it's not yet loaded from database
            rendered = (0, react_hooks_1.renderHook)((accountName) => {
                const account = (0, index_1.useAccount)(accountName);
                const accountsActions = (0, index_1.useAccountsActions)();
                return Object.assign({ account }, accountsActions);
            }, { wrapper: index_1.PlebbitProvider });
            // on second render, you get the default generated account
            try {
                yield rendered.waitForNextUpdate();
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered.result.current.account.name).toBe('Account 1');
            expect(typeof rendered.result.current.publishComment).toBe('function');
            expect(typeof rendered.result.current.publishVote).toBe('function');
        }));
        afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
            yield deleteDatabases();
        }));
        describe(`create comment`, () => {
            const onChallenge = jest.fn();
            const onChallengeVerification = jest.fn();
            test('publish comment', () => __awaiter(void 0, void 0, void 0, function* () {
                const publishCommentOptions = {
                    subplebbitAddress: 'Qm...',
                    parentCommentCid: 'Qm...',
                    content: 'some content',
                    onChallenge,
                    onChallengeVerification,
                };
                yield (0, react_hooks_1.act)(() => __awaiter(void 0, void 0, void 0, function* () {
                    yield rendered.result.current.publishComment(publishCommentOptions);
                }));
            }));
            let comment;
            test('onChallenge gets called', () => __awaiter(void 0, void 0, void 0, function* () {
                // onChallenge gets call backed once
                try {
                    yield rendered.waitFor(() => expect(onChallenge).toBeCalledTimes(1));
                }
                catch (e) {
                    console.error(e);
                }
                expect(onChallenge.mock.calls.length).toBe(1);
                // onChallenge arguments are [challenge, comment]
                const challenge = onChallenge.mock.calls[0][0];
                comment = onChallenge.mock.calls[0][1];
                expect(challenge.type).toBe('CHALLENGE');
                expect(challenge.challenges[0]).toEqual({ challenge: '2+2=?', type: 'text' });
                expect(typeof comment.publishChallengeAnswers).toBe('function');
            }));
            test('onChallengeVerification gets called', () => __awaiter(void 0, void 0, void 0, function* () {
                // publish challenge answer and wait for verification
                comment.publishChallengeAnswers(['4']);
                try {
                    yield rendered.waitFor(() => expect(onChallengeVerification).toBeCalledTimes(1));
                }
                catch (e) {
                    console.error(e);
                }
                expect(onChallengeVerification.mock.calls.length).toBe(1);
                const challengeVerification = onChallengeVerification.mock.calls[0][0];
                const commentVerified = onChallengeVerification.mock.calls[0][1];
                expect(challengeVerification.type).toBe('CHALLENGEVERIFICATION');
                expect(commentVerified.constructor.name).toBe('Comment');
            }));
        });
        describe(`create vote`, () => {
            const onChallenge = jest.fn();
            const onChallengeVerification = jest.fn();
            test('publish vote', () => __awaiter(void 0, void 0, void 0, function* () {
                const publishVoteOptions = {
                    subplebbitAddress: 'Qm...',
                    commentCid: 'Qm...',
                    vote: 1,
                    onChallenge,
                    onChallengeVerification,
                };
                yield (0, react_hooks_1.act)(() => __awaiter(void 0, void 0, void 0, function* () {
                    yield rendered.result.current.publishVote(publishVoteOptions);
                }));
            }));
            let vote;
            test('onChallenge gets called', () => __awaiter(void 0, void 0, void 0, function* () {
                // onChallenge gets call backed once
                try {
                    yield rendered.waitFor(() => expect(onChallenge).toBeCalledTimes(1));
                }
                catch (e) {
                    console.error(e);
                }
                expect(onChallenge.mock.calls.length).toBe(1);
                // onChallenge arguments are [challenge, comment]
                const challenge = onChallenge.mock.calls[0][0];
                vote = onChallenge.mock.calls[0][1];
                expect(challenge.type).toBe('CHALLENGE');
                expect(challenge.challenges[0]).toEqual({ challenge: '2+2=?', type: 'text' });
                expect(typeof vote.publishChallengeAnswers).toBe('function');
            }));
            test('onChallengeVerification gets called', () => __awaiter(void 0, void 0, void 0, function* () {
                // publish challenge answer and wait for verification
                vote.publishChallengeAnswers(['4']);
                try {
                    yield rendered.waitFor(() => expect(onChallengeVerification).toBeCalledTimes(1));
                }
                catch (e) {
                    console.error(e);
                }
                expect(onChallengeVerification.mock.calls.length).toBe(1);
                const challengeVerification = onChallengeVerification.mock.calls[0][0];
                const voteVerified = onChallengeVerification.mock.calls[0][1];
                expect(challengeVerification.type).toBe('CHALLENGEVERIFICATION');
                expect(voteVerified.constructor.name).toBe('Vote');
            }));
        });
    });
    describe('multiple comments and votes in database', () => {
        let onChallenge;
        let onChallengeVerification;
        let publishOptions;
        let rendered;
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            onChallenge = jest.fn();
            onChallengeVerification = jest.fn();
            publishOptions = { onChallenge, onChallengeVerification };
            rendered = (0, react_hooks_1.renderHook)((props) => {
                const useAccountCommentsOptions = {
                    accountName: props === null || props === void 0 ? void 0 : props.accountName,
                    filter: {
                        commentCids: (props === null || props === void 0 ? void 0 : props.commentCid) && [props === null || props === void 0 ? void 0 : props.commentCid],
                        postCids: (props === null || props === void 0 ? void 0 : props.postCid) && [props === null || props === void 0 ? void 0 : props.postCid],
                        subplebbitAddresses: (props === null || props === void 0 ? void 0 : props.subplebbitAddress) && [props === null || props === void 0 ? void 0 : props.subplebbitAddress],
                        parentCommentCids: (props === null || props === void 0 ? void 0 : props.parentCommentCid) && [props === null || props === void 0 ? void 0 : props.parentCommentCid],
                        hasParentCommentCid: props === null || props === void 0 ? void 0 : props.hasParentCommentCid,
                    },
                };
                const account = (0, index_1.useAccount)(props === null || props === void 0 ? void 0 : props.accountName);
                const accountsActions = (0, index_1.useAccountsActions)();
                const accountComments = (0, index_1.useAccountComments)(useAccountCommentsOptions);
                const accountVotes = (0, index_1.useAccountVotes)(useAccountCommentsOptions);
                const accountVote = (0, index_1.useAccountVote)(props === null || props === void 0 ? void 0 : props.commentCid, props === null || props === void 0 ? void 0 : props.accountName);
                return Object.assign({ account, accountComments, accountVotes, accountVote }, accountsActions);
            }, { wrapper: index_1.PlebbitProvider });
            try {
                yield rendered.waitForNextUpdate();
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered.result.current.account.name).toBe('Account 1');
            expect(typeof rendered.result.current.publishComment).toBe('function');
            expect(typeof rendered.result.current.publishVote).toBe('function');
            yield (0, react_hooks_1.act)(() => __awaiter(void 0, void 0, void 0, function* () {
                yield rendered.result.current.publishComment(Object.assign(Object.assign({}, publishOptions), { title: 'title 1', content: 'content 1', parentCommentCid: 'parent comment cid 1', postCid: 'post cid 1', subplebbitAddress: 'subplebbit address 1' }));
                yield rendered.result.current.publishComment(Object.assign(Object.assign({}, publishOptions), { title: 'title 2', content: 'content 2', subplebbitAddress: 'subplebbit address 1' }));
                yield rendered.result.current.publishComment(Object.assign(Object.assign({}, publishOptions), { title: 'title 3', content: 'content 3', subplebbitAddress: 'subplebbit address 2' }));
                yield rendered.result.current.publishVote(Object.assign(Object.assign({}, publishOptions), { vote: 1, commentCid: 'comment cid 1', subplebbitAddress: 'subplebbit address 1' }));
                yield rendered.result.current.publishVote(Object.assign(Object.assign({}, publishOptions), { vote: 1, commentCid: 'comment cid 2', subplebbitAddress: 'subplebbit address 1' }));
                yield rendered.result.current.publishVote(Object.assign(Object.assign({}, publishOptions), { vote: 1, commentCid: 'comment cid 3', subplebbitAddress: 'subplebbit address 2' }));
            }));
        }));
        afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
            yield deleteDatabases();
        }));
        const expectAccountCommentsToHaveIndexAndAccountId = (accountComments, accountId) => {
            for (const [i, accountComment] of accountComments.entries()) {
                expect(accountComment.index).toBe(i);
                if (accountId) {
                    expect(accountComment.accountId).toBe(accountId);
                }
                else {
                    expect(typeof accountComment.accountId).toBe('string');
                }
            }
        };
        test(`get all account comments`, () => __awaiter(void 0, void 0, void 0, function* () {
            expect(rendered.result.current.accountComments.length).toBe(3);
            expect(rendered.result.current.accountComments[0].content).toBe('content 1');
            expect(rendered.result.current.accountComments[1].content).toBe('content 2');
            expect(rendered.result.current.accountComments[2].content).toBe('content 3');
            expectAccountCommentsToHaveIndexAndAccountId(rendered.result.current.accountComments, rendered.result.current.account.id);
        }));
        test(`get account comment and add cid to it when receive challengeVerification`, () => __awaiter(void 0, void 0, void 0, function* () {
            expect(rendered.result.current.accountComments.length).toBe(3);
            expect(rendered.result.current.accountComments[0].content).toBe('content 1');
            expect(rendered.result.current.accountComments[1].content).toBe('content 2');
            expect(rendered.result.current.accountComments[2].content).toBe('content 3');
            // wait for all on challenge to be called
            try {
                yield rendered.waitFor(() => onChallenge.mock.calls.length === 6);
            }
            catch (e) {
                console.error(e);
            }
            // publish challenge answers for comment 1 and 2
            onChallenge.mock.calls[0][1].publishChallengeAnswers(['4']);
            onChallenge.mock.calls[1][1].publishChallengeAnswers(['4']);
            // wait for all on challengeverification to be called
            try {
                yield rendered.waitFor(() => onChallengeVerification.mock.calls.length === 2);
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered.result.current.accountComments.length).toBe(3);
            expect(rendered.result.current.accountComments[0].content).toBe('content 1');
            expect(rendered.result.current.accountComments[1].content).toBe('content 2');
            expect(rendered.result.current.accountComments[2].content).toBe('content 3');
            expect(rendered.result.current.accountComments[0].cid).toBe('content 1 cid');
            expect(rendered.result.current.accountComments[1].cid).toBe('content 2 cid');
            expect(rendered.result.current.accountComments[2].cid).toBe(undefined);
            expectAccountCommentsToHaveIndexAndAccountId(rendered.result.current.accountComments, rendered.result.current.account.id);
            // check if cids are in database after getting a new context
            const activeAccountId = rendered.result.current.account.id;
            const rendered2 = (0, react_hooks_1.renderHook)(() => (0, index_1.useAccountComments)(), { wrapper: index_1.PlebbitProvider });
            try {
                yield rendered2.waitForNextUpdate();
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered2.result.current.length).toBe(3);
            expect(rendered2.result.current[0].content).toBe('content 1');
            expect(rendered2.result.current[1].content).toBe('content 2');
            expect(rendered2.result.current[2].content).toBe('content 3');
            expect(rendered2.result.current[0].cid).toBe('content 1 cid');
            expect(rendered2.result.current[1].cid).toBe('content 2 cid');
            expect(rendered2.result.current[2].cid).toBe(undefined);
            expectAccountCommentsToHaveIndexAndAccountId(rendered2.result.current, activeAccountId);
        }));
        test(`cid gets added to account comment after fetched in useComment`, () => __awaiter(void 0, void 0, void 0, function* () {
            const rendered = (0, react_hooks_1.renderHook)((commentCid) => {
                const accountComments = (0, index_1.useAccountComments)();
                const comment = (0, index_1.useComment)(commentCid);
                return accountComments;
            }, { wrapper: index_1.PlebbitProvider });
            try {
                yield rendered.waitForNextUpdate();
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered.result.current[0].content).toBe('content 1');
            expect(rendered.result.current[1].content).toBe('content 2');
            expect(rendered.result.current[0].cid).toBe(undefined);
            expect(rendered.result.current[1].cid).toBe(undefined);
            expectAccountCommentsToHaveIndexAndAccountId(rendered.result.current);
            // mock the comment to get from plebbit.getComment()
            // to simulate getting a comment that the account published
            const commentToGet = plebbit_js_mock_1.Plebbit.prototype.commentToGet;
            plebbit_js_mock_1.Plebbit.prototype.commentToGet = () => ({
                author: rendered.result.current[0].author,
                timestamp: rendered.result.current[0].timestamp,
                content: rendered.result.current[0].content,
            });
            rendered.rerender('content 1 cid');
            try {
                yield rendered.waitFor(() => !!rendered.result.current[0].cid);
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered.result.current[0].content).toBe('content 1');
            expect(rendered.result.current[1].content).toBe('content 2');
            expect(rendered.result.current[0].cid).toBe('content 1 cid');
            expect(rendered.result.current[1].cid).toBe(undefined);
            expectAccountCommentsToHaveIndexAndAccountId(rendered.result.current);
            // make sure the account comment starts updating by checking if it received upvotes
            try {
                yield rendered.waitFor(() => typeof rendered.result.current[0].upvoteCount === 'number');
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered.result.current[0].upvoteCount).toBe(3);
            // mock the second comment to get from plebbit.getComment()
            plebbit_js_mock_1.Plebbit.prototype.commentToGet = () => ({
                author: rendered.result.current[1].author,
                timestamp: rendered.result.current[1].timestamp,
                content: rendered.result.current[1].content,
            });
            rendered.rerender('content 2 cid');
            try {
                yield rendered.waitFor(() => !!rendered.result.current[1].cid);
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered.result.current[0].content).toBe('content 1');
            expect(rendered.result.current[1].content).toBe('content 2');
            expect(rendered.result.current[0].cid).toBe('content 1 cid');
            expect(rendered.result.current[1].cid).toBe('content 2 cid');
            expectAccountCommentsToHaveIndexAndAccountId(rendered.result.current);
            // restore mock
            plebbit_js_mock_1.Plebbit.prototype.commentToGet = commentToGet;
            // check if cids are still in database after new context
            const rendered2 = (0, react_hooks_1.renderHook)(() => (0, index_1.useAccountComments)(), { wrapper: index_1.PlebbitProvider });
            try {
                yield rendered2.waitForNextUpdate();
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered2.result.current[0].cid).toBe('content 1 cid');
            expect(rendered2.result.current[1].cid).toBe('content 2 cid');
            expect(rendered2.result.current[2].cid).toBe(undefined);
            expectAccountCommentsToHaveIndexAndAccountId(rendered2.result.current);
        }));
        test(`account comments are stored to database`, () => __awaiter(void 0, void 0, void 0, function* () {
            // render with new context to see if still in database
            const rendered2 = (0, react_hooks_1.renderHook)(() => (0, index_1.useAccountComments)(), { wrapper: index_1.PlebbitProvider });
            try {
                yield rendered2.waitForNextUpdate();
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered2.result.current.length).toBe(3);
            expect(rendered2.result.current[0].content).toBe('content 1');
            expect(rendered2.result.current[1].content).toBe('content 2');
            expect(rendered2.result.current[2].content).toBe('content 3');
            expectAccountCommentsToHaveIndexAndAccountId(rendered2.result.current);
        }));
        test(`account has no karma before comments are published`, () => __awaiter(void 0, void 0, void 0, function* () {
            expect(rendered.result.current.account.karma.score).toBe(0);
            expect(rendered.result.current.account.karma.upvoteCount).toBe(0);
            expect(rendered.result.current.account.karma.downvoteCount).toBe(0);
            expect(rendered.result.current.account.karma.commentScore).toBe(0);
            expect(rendered.result.current.account.karma.commentUpvoteCount).toBe(0);
            expect(rendered.result.current.account.karma.commentDownvoteCount).toBe(0);
            expect(rendered.result.current.account.karma.linkScore).toBe(0);
            expect(rendered.result.current.account.karma.linkUpvoteCount).toBe(0);
            expect(rendered.result.current.account.karma.linkDownvoteCount).toBe(0);
        }));
        test(`account has karma after comments are published`, () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                yield rendered.waitFor(() => Boolean(onChallenge.mock.calls[0] && onChallenge.mock.calls[1] && onChallenge.mock.calls[2]));
            }
            catch (e) {
                console.error(e);
            }
            // answer challenges to get the comments published
            onChallenge.mock.calls[0][1].publishChallengeAnswers(['4']);
            onChallenge.mock.calls[1][1].publishChallengeAnswers(['4']);
            onChallenge.mock.calls[2][1].publishChallengeAnswers(['4']);
            try {
                yield rendered.waitFor(() => rendered.result.current.account.karma.upvoteCount >= 9);
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered.result.current.account.karma.score).toBe(6);
            expect(rendered.result.current.account.karma.upvoteCount).toBe(9);
            expect(rendered.result.current.account.karma.downvoteCount).toBe(3);
            expect(rendered.result.current.account.karma.commentScore).toBe(2);
            expect(rendered.result.current.account.karma.commentUpvoteCount).toBe(3);
            expect(rendered.result.current.account.karma.commentDownvoteCount).toBe(1);
            expect(rendered.result.current.account.karma.linkScore).toBe(4);
            expect(rendered.result.current.account.karma.linkUpvoteCount).toBe(6);
            expect(rendered.result.current.account.karma.linkDownvoteCount).toBe(2);
            // get the karma from database by created new context
            const rendered2 = (0, react_hooks_1.renderHook)(() => {
                const account = (0, index_1.useAccount)();
                const accountComments = (0, index_1.useAccountComments)();
                return { account, accountComments };
            }, { wrapper: index_1.PlebbitProvider });
            try {
                yield rendered2.waitFor(() => rendered2.result.current.account.karma.upvoteCount >= 9);
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered2.result.current.account.karma.score).toBe(6);
            expect(rendered2.result.current.account.karma.upvoteCount).toBe(9);
            expect(rendered2.result.current.account.karma.downvoteCount).toBe(3);
            expect(rendered2.result.current.account.karma.commentScore).toBe(2);
            expect(rendered2.result.current.account.karma.commentUpvoteCount).toBe(3);
            expect(rendered2.result.current.account.karma.commentDownvoteCount).toBe(1);
            expect(rendered2.result.current.account.karma.linkScore).toBe(4);
            expect(rendered2.result.current.account.karma.linkUpvoteCount).toBe(6);
            expect(rendered2.result.current.account.karma.linkDownvoteCount).toBe(2);
        }));
        test(`get all account votes`, () => __awaiter(void 0, void 0, void 0, function* () {
            expect(rendered.result.current.accountVotes.length).toBe(3);
            expect(rendered.result.current.accountVotes[0].commentCid).toBe('comment cid 1');
            expect(rendered.result.current.accountVotes[1].commentCid).toBe('comment cid 2');
            expect(rendered.result.current.accountVotes[2].commentCid).toBe('comment cid 3');
        }));
        test(`account votes are stored to database`, () => __awaiter(void 0, void 0, void 0, function* () {
            // render with new context to see if still in database
            const rendered2 = (0, react_hooks_1.renderHook)(() => (0, index_1.useAccountVotes)(), { wrapper: index_1.PlebbitProvider });
            try {
                yield rendered2.waitForNextUpdate();
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered2.result.current.length).toBe(3);
            expect(rendered2.result.current[0].commentCid).toBe('comment cid 1');
            expect(rendered2.result.current[1].commentCid).toBe('comment cid 2');
            expect(rendered2.result.current[2].commentCid).toBe('comment cid 3');
        }));
        test(`get all comments and votes from different account name`, () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, react_hooks_1.act)(() => __awaiter(void 0, void 0, void 0, function* () {
                yield rendered.result.current.createAccount();
                yield rendered.result.current.setActiveAccount('Account 2');
                yield rendered.result.current.publishComment(Object.assign(Object.assign({}, publishOptions), { title: 'account 2 title 1', content: 'account 2 content 1', subplebbitAddress: 'account 2 subplebbit address 1' }));
                yield rendered.result.current.publishVote(Object.assign(Object.assign({}, publishOptions), { vote: 1, commentCid: 'account 2 comment cid 1', subplebbitAddress: 'account 2 subplebbit address 1' }));
            }));
            expect(rendered.result.current.accountComments.length).toBe(1);
            expect(rendered.result.current.accountVotes.length).toBe(1);
            expect(rendered.result.current.accountComments[0].content).toBe('account 2 content 1');
            expect(rendered.result.current.accountVotes[0].commentCid).toBe('account 2 comment cid 1');
            yield (0, react_hooks_1.act)(() => __awaiter(void 0, void 0, void 0, function* () {
                yield rendered.result.current.setActiveAccount('Account 1');
            }));
            // no comments were added to 'Account 1'
            expect(rendered.result.current.accountComments.length).toBe(3);
            expect(rendered.result.current.accountVotes.length).toBe(3);
            // render with new context to see if still in database
            const rendered2 = (0, react_hooks_1.renderHook)(() => {
                const accountComments = (0, index_1.useAccountComments)({ accountName: 'Account 2' });
                const accountVotes = (0, index_1.useAccountVotes)({ accountName: 'Account 2' });
                return { accountComments, accountVotes };
            }, { wrapper: index_1.PlebbitProvider });
            try {
                yield rendered2.waitForNextUpdate();
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered2.result.current.accountComments.length).toBe(1);
            expect(rendered2.result.current.accountVotes.length).toBe(1);
            expect(rendered2.result.current.accountComments[0].content).toBe('account 2 content 1');
            expect(rendered2.result.current.accountVotes[0].commentCid).toBe('account 2 comment cid 1');
        }));
        test(`get account comments in a post`, () => {
            rendered.rerender({ postCid: 'post cid 1' });
            expect(rendered.result.current.accountComments.length).toBe(1);
            expect(rendered.result.current.accountVotes.length).toBe(0);
            expect(rendered.result.current.accountComments[0].postCid).toBe('post cid 1');
        });
        test(`get account replies to a comment`, () => {
            rendered.rerender({ parentCommentCid: 'parent comment cid 1' });
            expect(rendered.result.current.accountComments.length).toBe(1);
            expect(rendered.result.current.accountVotes.length).toBe(0);
            expect(rendered.result.current.accountComments[0].parentCommentCid).toBe('parent comment cid 1');
        });
        test(`get account posts in a subplebbit`, () => {
            rendered.rerender({ subplebbitAddress: 'subplebbit address 1', hasParentCommentCid: false });
            expect(rendered.result.current.accountComments.length).toBe(1);
            expect(rendered.result.current.accountVotes.length).toBe(2);
            expect(rendered.result.current.accountComments[0].parentCommentCid).toBe(undefined);
        });
        test(`get account posts and comments in a subplebbit`, () => {
            rendered.rerender({ subplebbitAddress: 'subplebbit address 1' });
            expect(rendered.result.current.accountComments.length).toBe(2);
            expect(rendered.result.current.accountVotes.length).toBe(2);
            expect(rendered.result.current.accountComments[0].parentCommentCid).toBe('parent comment cid 1');
            expect(rendered.result.current.accountComments[1].parentCommentCid).toBe(undefined);
        });
        test(`get all account posts`, () => {
            rendered.rerender({ hasParentCommentCid: false });
            expect(rendered.result.current.accountComments.length).toBe(2);
            expect(rendered.result.current.accountVotes.length).toBe(3);
            expect(rendered.result.current.accountComments[0].parentCommentCid).toBe(undefined);
            expect(rendered.result.current.accountComments[1].parentCommentCid).toBe(undefined);
        });
        test(`get account vote on a specific comment`, () => {
            rendered.rerender({ commentCid: 'comment cid 3' });
            expect(rendered.result.current.accountComments.length).toBe(0);
            expect(rendered.result.current.accountVotes.length).toBe(1);
            expect(rendered.result.current.accountVotes[0].commentCid).toBe('comment cid 3');
        });
    });
});
