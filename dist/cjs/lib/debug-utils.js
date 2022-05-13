"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNonAccountsDatabases = exports.deleteAccountsDatabases = exports.deleteCaches = exports.deleteDatabases = void 0;
const localforage_1 = __importDefault(require("localforage"));
const localforage_lru_1 = __importDefault(require("../lib/localforage-lru"));
const deleteDatabases = () => Promise.all([
    localforage_1.default.createInstance({ name: 'accountsMetadata' }).clear(),
    localforage_1.default.createInstance({ name: 'accounts' }).clear(),
    localforage_lru_1.default.createInstance({ name: 'subplebbits' }).clear(),
    localforage_lru_1.default.createInstance({ name: 'comments' }).clear(),
    localforage_lru_1.default.createInstance({ name: 'subplebbitsPages' }).clear(),
]);
exports.deleteDatabases = deleteDatabases;
const deleteCaches = () => Promise.all([
    localforage_lru_1.default.createInstance({ name: 'subplebbits' }).clear(),
    localforage_lru_1.default.createInstance({ name: 'comments' }).clear(),
    localforage_lru_1.default.createInstance({ name: 'subplebbitsPages' }).clear(),
]);
exports.deleteCaches = deleteCaches;
const deleteAccountsDatabases = () => Promise.all([
    localforage_1.default.createInstance({ name: 'accountsMetadata' }).clear(),
    localforage_1.default.createInstance({ name: 'accounts' }).clear(),
]);
exports.deleteAccountsDatabases = deleteAccountsDatabases;
const deleteNonAccountsDatabases = () => Promise.all([
    localforage_lru_1.default.createInstance({ name: 'subplebbits' }).clear(),
    localforage_lru_1.default.createInstance({ name: 'comments' }).clear(),
    localforage_lru_1.default.createInstance({ name: 'subplebbitsPages' }).clear(),
]);
exports.deleteNonAccountsDatabases = deleteNonAccountsDatabases;
const debugUtils = {
    deleteDatabases,
    deleteCaches,
    deleteAccountsDatabases,
    deleteNonAccountsDatabases
};
exports.default = debugUtils;
