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
try {
    // for debugging without caching
    if (process.env.REACT_APP_PLEBBIT_REACT_HOOKS_NO_CACHE) {
        // @ts-ignore
        localForageLru.createInstance = () => {
            console.warn('@plebbit/plebbit-react-hooks cache is disabled for testing');
            return {
                getItem: function (key) {
                    return __awaiter(this, void 0, void 0, function* () { });
                },
                setItem: function (key, value) {
                    return __awaiter(this, void 0, void 0, function* () { });
                },
                removeItem: function (key) {
                    return __awaiter(this, void 0, void 0, function* () { });
                },
                clear: function () {
                    return __awaiter(this, void 0, void 0, function* () { });
                },
                keys: function () {
                    return __awaiter(this, void 0, void 0, function* () {
                        return [];
                    });
                },
                entries: function () {
                    return __awaiter(this, void 0, void 0, function* () {
                        return [];
                    });
                },
            };
        };
    }
}
catch (e) { }
export default localForageLru;
