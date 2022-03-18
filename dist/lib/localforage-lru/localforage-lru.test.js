var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import localForageLru from './localforage-lru';
describe('localForageLru', () => {
    test('get last recently used', () => __awaiter(void 0, void 0, void 0, function* () {
        const testDatabase = localForageLru.createInstance({ name: 'testDatabase', size: 4 });
        yield testDatabase.clear();
        yield testDatabase.setItem('one', 1);
        yield testDatabase.setItem('two', 2);
        yield testDatabase.setItem('three', 3);
        yield testDatabase.setItem('four', 4);
        // access 1 and 2 last to make them last recently used
        yield testDatabase.getItem('three');
        yield testDatabase.getItem('four');
        yield testDatabase.getItem('one');
        yield testDatabase.getItem('two');
        // erase 3 and 4 by adding 2 more items over than size limit 4
        yield testDatabase.setItem('five', 5);
        yield testDatabase.setItem('six', 6);
        expect(yield testDatabase.getItem('one')).toBe(1);
        expect(yield testDatabase.getItem('two')).toBe(2);
        expect(yield testDatabase.getItem('three')).toBe(undefined);
        expect(yield testDatabase.getItem('four')).toBe(undefined);
        expect(yield testDatabase.getItem('five')).toBe(5);
        expect(yield testDatabase.getItem('six')).toBe(6);
        // .keys() is implemented
        expect(yield testDatabase.keys()).toEqual(['five', 'six', 'one', 'two']);
        yield testDatabase.clear();
    }));
});
