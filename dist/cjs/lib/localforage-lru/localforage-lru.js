"use strict";
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
const localforage_1 = __importDefault(require("localforage"));
function createLocalForageInstance(localForageLruOptions) {
    if (typeof (localForageLruOptions === null || localForageLruOptions === void 0 ? void 0 : localForageLruOptions.size) !== 'number') {
        throw Error(`LocalForageLru.createInstance localForageLruOptions.size '${localForageLruOptions === null || localForageLruOptions === void 0 ? void 0 : localForageLruOptions.size}' not a number`);
    }
    const localForageOptions = Object.assign({}, localForageLruOptions);
    delete localForageOptions.size;
    let database1, database2, databaseSize, initialized = false;
    (() => __awaiter(this, void 0, void 0, function* () {
        const localForage1 = localforage_1.default.createInstance(Object.assign(Object.assign({}, localForageOptions), { name: localForageLruOptions.name }));
        const localForage2 = localforage_1.default.createInstance(Object.assign(Object.assign({}, localForageOptions), { name: localForageLruOptions.name + '2' }));
        const [localForage1Size, localForage2Size] = yield Promise.all([localForage1.length(), localForage2.length()]);
        if (localForage1Size > localForage2Size) {
            database2 = localForage1;
            database1 = localForage2;
            databaseSize = localForage1Size;
        }
        else {
            database2 = localForage2;
            database1 = localForage1;
            databaseSize = localForage2Size;
        }
        initialized = true;
    }))();
    return {
        getItem: function (key) {
            return __awaiter(this, void 0, void 0, function* () {
                yield initialization();
                const value = yield database1.getItem(key);
                const value2 = yield database2.getItem(key);
                let returnValue = value;
                if (returnValue !== null && value !== undefined)
                    return returnValue;
                if ((returnValue = value2) !== null && (returnValue = value2) !== undefined) {
                    yield updateDatabases(key, returnValue);
                    return returnValue;
                }
            });
        },
        setItem: function (key, value) {
            return __awaiter(this, void 0, void 0, function* () {
                yield initialization();
                const databaseValue = yield database1.getItem(key);
                if (databaseValue !== null && databaseValue !== undefined) {
                    yield database1.setItem(key, value);
                }
                else {
                    yield updateDatabases(key, value);
                }
            });
        },
        removeItem: function (key) {
            return __awaiter(this, void 0, void 0, function* () {
                yield initialization();
                yield database1.removeItem(key);
                yield database2.removeItem(key);
            });
        },
        clear: function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield initialization();
                yield database1.clear();
                yield database2.clear();
            });
        },
        key: function (keyIndex) {
            return __awaiter(this, void 0, void 0, function* () {
                throw Error('not implemented');
            });
        },
        keys: function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield initialization();
                return [...new Set([...(yield database1.keys()), ...(yield database2.keys())])];
            });
        },
        length: function () {
            return __awaiter(this, void 0, void 0, function* () {
                throw Error('not implemented');
            });
        },
    };
    function updateDatabases(key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield database1.setItem(key, value);
            }
            catch (e) {
                console.error('TODO: figure out sure why this error happens', { localForageLruOptions, databaseSize });
                console.error(e);
            }
            databaseSize++;
            if (databaseSize >= localForageLruOptions.size) {
                databaseSize = 0;
                const database1Temp = database1;
                const database2Temp = database2;
                database2 = database1Temp;
                database1 = database2Temp;
                yield database1.clear();
            }
        });
    }
    function initialization() {
        return __awaiter(this, void 0, void 0, function* () {
            if (initialized)
                return;
            yield new Promise((r) => setTimeout(r, 10));
            yield initialization();
        });
    }
}
const instances = {};
const createInstance = (localForageLruOptions) => {
    if (typeof (localForageLruOptions === null || localForageLruOptions === void 0 ? void 0 : localForageLruOptions.name) !== 'string') {
        throw Error(`LocalForageLru.createInstance localForageLruOptions.name '${localForageLruOptions === null || localForageLruOptions === void 0 ? void 0 : localForageLruOptions.name}' not a string`);
    }
    if (instances[localForageLruOptions.name]) {
        if (localForageLruOptions.size) {
            throw Error(`LocalForageLru.createInstance with name '${localForageLruOptions.name}' already created, remove localForageLruOptions.size, size cannot be changed`);
        }
        return instances[localForageLruOptions.name];
    }
    instances[localForageLruOptions.name] = createLocalForageInstance(localForageLruOptions);
    return instances[localForageLruOptions.name];
};
exports.default = { createInstance };
