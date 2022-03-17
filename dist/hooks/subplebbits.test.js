var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { renderHook } from '@testing-library/react-hooks';
import testUtils from '../lib/test-utils';
import { useSubplebbit, useSubplebbits } from '../index';
import PlebbitProvider from '../providers/plebbit-provider';
import localForageLru from '../lib/localforage-lru';
import PlebbitJsMock, { mockPlebbitJs, Plebbit, Subplebbit } from '../lib/plebbit-js/plebbit-js-mock';
mockPlebbitJs(PlebbitJsMock);
const deleteDatabases = () => Promise.all([localForageLru.createInstance({ name: 'subplebbits' }).clear()]);
describe('subplebbits', () => {
    beforeAll(() => {
        testUtils.silenceUpdateUnmountedComponentWarning();
    });
    afterAll(() => {
        testUtils.restoreAll();
    });
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield deleteDatabases();
    }));
    describe('no subplebbits in database', () => {
        test('get subplebbits one at a time', () => __awaiter(void 0, void 0, void 0, function* () {
            const rendered = renderHook((subplebbitAddress) => useSubplebbit(subplebbitAddress), { wrapper: PlebbitProvider });
            expect(rendered.result.current).toBe(undefined);
            rendered.rerender('subplebbit address 1');
            try {
                yield rendered.waitFor(() => typeof rendered.result.current.address === 'string');
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered.result.current.address).toBe('subplebbit address 1');
            expect(rendered.result.current.title).toBe('subplebbit address 1 title');
            // wait for subplebbit.on('update') to fetch the updated description
            try {
                yield rendered.waitFor(() => typeof rendered.result.current.description === 'string');
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered.result.current.description).toBe('subplebbit address 1 description updated');
            rendered.rerender('subplebbit address 2');
            try {
                yield rendered.waitFor(() => typeof rendered.result.current.address === 'string');
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered.result.current.address).toBe('subplebbit address 2');
            expect(rendered.result.current.title).toBe('subplebbit address 2 title');
            // wait for subplebbit.on('update') to fetch the updated description
            try {
                yield rendered.waitFor(() => typeof rendered.result.current.description === 'string');
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered.result.current.description).toBe('subplebbit address 2 description updated');
            // get sub 1 again, no need to wait for any updates
            rendered.rerender('subplebbit address 1');
            expect(rendered.result.current.address).toBe('subplebbit address 1');
            expect(rendered.result.current.description).toBe('subplebbit address 1 description updated');
            // make sure subplebbits are still in database
            const getSubplebbit = Plebbit.prototype.getSubplebbit;
            const simulateUpdateEvent = Subplebbit.prototype.simulateUpdateEvent;
            // mock getSubplebbit on the Plebbit class
            Plebbit.prototype.getSubplebbit = (subplebbitAddress) => {
                throw Error(`plebbit.getSubplebbit called with subplebbit address '${subplebbitAddress}' should not be called when getting subplebbit from database`);
            };
            // don't simulate 'update' event during this test to see if the updates were saved to database
            let throwOnSubplebbitUpdateEvent = false;
            Subplebbit.prototype.simulateUpdateEvent = () => {
                if (throwOnSubplebbitUpdateEvent) {
                    throw Error('no subplebbit update events should be emitted when subplebbit already in context');
                }
            };
            // on first render, the account is undefined because it's not yet loaded from database
            const rendered2 = renderHook((subplebbitAddress) => useSubplebbit(subplebbitAddress), { wrapper: PlebbitProvider });
            expect(rendered2.result.current).toBe(undefined);
            rendered2.rerender('subplebbit address 1');
            // wait to get account loaded
            try {
                yield rendered2.waitForNextUpdate();
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered2.result.current.address).toBe('subplebbit address 1');
            expect(rendered2.result.current.title).toBe('subplebbit address 1 title');
            expect(rendered2.result.current.description).toBe('subplebbit address 1 description updated');
            rendered2.rerender('subplebbit address 2');
            // wait for addSubplebbitToContext action
            try {
                yield rendered2.waitForNextUpdate();
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered2.result.current.address).toBe('subplebbit address 2');
            expect(rendered2.result.current.title).toBe('subplebbit address 2 title');
            expect(rendered2.result.current.description).toBe('subplebbit address 2 description updated');
            // get subplebbit 1 again from context, should not trigger any subplebbit updates
            throwOnSubplebbitUpdateEvent = true;
            rendered2.rerender('subplebbit address 1');
            expect(rendered2.result.current.address).toBe('subplebbit address 1');
            expect(rendered2.result.current.title).toBe('subplebbit address 1 title');
            expect(rendered2.result.current.description).toBe('subplebbit address 1 description updated');
            // restore mock
            Subplebbit.prototype.simulateUpdateEvent = simulateUpdateEvent;
            Plebbit.prototype.getSubplebbit = getSubplebbit;
        }));
        test('get multiple subplebbits at once', () => __awaiter(void 0, void 0, void 0, function* () {
            const rendered = renderHook((subplebbitAddresses) => useSubplebbits(subplebbitAddresses), { wrapper: PlebbitProvider });
            expect(rendered.result.current).toEqual([]);
            rendered.rerender(['subplebbit address 1', 'subplebbit address 2', 'subplebbit address 3']);
            expect(rendered.result.current).toEqual([undefined, undefined, undefined]);
            try {
                yield rendered.waitFor(() => typeof rendered.result.current[0].address === 'string'
                    && typeof rendered.result.current[1].address === 'string'
                    && typeof rendered.result.current[2].address === 'string');
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered.result.current[0].address).toBe('subplebbit address 1');
            expect(rendered.result.current[1].address).toBe('subplebbit address 2');
            expect(rendered.result.current[2].address).toBe('subplebbit address 3');
            try {
                yield rendered.waitFor(() => typeof rendered.result.current[0].description === 'string'
                    && typeof rendered.result.current[1].description === 'string'
                    && typeof rendered.result.current[2].description === 'string');
            }
            catch (e) {
                console.error(e);
            }
            expect(rendered.result.current[0].description).toBe('subplebbit address 1 description updated');
            expect(rendered.result.current[1].description).toBe('subplebbit address 2 description updated');
            expect(rendered.result.current[2].description).toBe('subplebbit address 3 description updated');
        }));
    });
});