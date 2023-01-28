import assert from 'assert';
const getAuthorAddressRolesFromSubplebbits = (authorAddress, subplebbits) => {
    var _a, _b;
    const roles = {};
    for (const subplebbitAddress in subplebbits) {
        const role = (_b = (_a = subplebbits[subplebbitAddress]) === null || _a === void 0 ? void 0 : _a.roles) === null || _b === void 0 ? void 0 : _b[authorAddress];
        if (role) {
            roles[subplebbitAddress] = role;
        }
    }
    return roles;
};
export const getAccountSubplebbits = (account, subplebbits) => {
    var _a, _b, _c;
    assert(((_a = account === null || account === void 0 ? void 0 : account.author) === null || _a === void 0 ? void 0 : _a.address) && typeof ((_b = account === null || account === void 0 ? void 0 : account.author) === null || _b === void 0 ? void 0 : _b.address) === 'string', `accountsStore utils getAccountSubplebbits invalid account.author.address '${(_c = account === null || account === void 0 ? void 0 : account.author) === null || _c === void 0 ? void 0 : _c.address}'`);
    assert(subplebbits && typeof subplebbits === 'object', `accountsStore utils getAccountSubplebbits invalid subplebbits '${subplebbits}'`);
    const roles = getAuthorAddressRolesFromSubplebbits(account.author.address, subplebbits);
    const accountSubplebbits = Object.assign({}, account.subplebbits);
    for (const subplebbitAddress in roles) {
        accountSubplebbits[subplebbitAddress] = Object.assign({}, accountSubplebbits[subplebbitAddress]);
        accountSubplebbits[subplebbitAddress].role = roles[subplebbitAddress];
    }
    return accountSubplebbits;
};
const utils = {
    getAccountSubplebbits,
};
export default utils;
