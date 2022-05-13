"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const accounts_provider_1 = __importDefault(require("./accounts-provider"));
const comments_provider_1 = __importDefault(require("./comments-provider"));
const subplebbits_provider_1 = __importDefault(require("./subplebbits-provider"));
const feeds_provider_1 = __importDefault(require("./feeds-provider"));
function PlebbitProvider(props) {
    if (!props.children) {
        return null;
    }
    return (react_1.default.createElement(accounts_provider_1.default, null,
        react_1.default.createElement(subplebbits_provider_1.default, null,
            react_1.default.createElement(comments_provider_1.default, null,
                react_1.default.createElement(feeds_provider_1.default, null, props.children)))));
}
exports.default = PlebbitProvider;
