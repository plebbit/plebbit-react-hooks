var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import assert from 'assert';
import Logger from '@plebbit/plebbit-logger';
const log = Logger('plebbit-react-hooks:accounts:stores');
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
export const getCommentCidsToAccountsComments = (accountsComments) => {
    const commentCidsToAccountsComments = {};
    for (const accountId in accountsComments) {
        for (const accountComment of accountsComments[accountId]) {
            if (accountComment.cid) {
                commentCidsToAccountsComments[accountComment.cid] = { accountId, accountCommentIndex: accountComment.index };
            }
        }
    }
    return commentCidsToAccountsComments;
};
export const fetchCommentLinkDimensions = (link) => __awaiter(void 0, void 0, void 0, function* () {
    const fetchImageDimensions = (url) => new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            const dimensions = {
                width: image.width,
                height: image.height,
            };
            resolve(dimensions);
        };
        image.onerror = (error) => {
            reject(Error(`failed fetching image dimensions for url '${url}'`));
        };
        // max loading time
        const timeout = 10000;
        setTimeout(() => reject(Error(`failed fetching image dimensions for url '${url}' timeout '${timeout}'`)), timeout);
        // start loading
        image.src = url;
    });
    const fetchVideoDimensions = (url) => new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.muted = true;
        video.loop = false;
        video.addEventListener('loadeddata', () => {
            const dimensions = {
                width: video.videoWidth,
                height: video.videoHeight,
            };
            resolve(dimensions);
            // prevent video from playing
            try {
                video.pause();
            }
            catch (e) { }
            // prevent video from loading
            try {
                video.src = '';
            }
            catch (e) { }
        });
        video.addEventListener('error', (error) => {
            reject(Error(`failed fetching video dimensions for url '${url}'`));
        });
        // max loading time
        const timeout = 30000;
        setTimeout(() => reject(Error(`failed fetching video dimensions for url '${url}' timeout '${timeout}'`)), timeout);
        // start loading
        video.src = url;
    });
    if (link) {
        try {
            if (new URL(link).protocol !== 'https:') {
                throw Error(`failed fetching comment.link dimensions for link '${link}' not https protocol`);
            }
            const dimensions = yield Promise.race([fetchImageDimensions(link), fetchVideoDimensions(link)]);
            return {
                linkWidth: dimensions.width,
                linkHeight: dimensions.height,
            };
        }
        catch (error) {
            log.error('fetchCommentLinkDimensions error', { error, link });
        }
    }
    return {};
});
export const getInitAccountCommentsToUpdate = (accountsComments) => {
    const accountCommentsToUpdate = [];
    for (const accountId in accountsComments) {
        for (const accountComment of accountsComments[accountId]) {
            accountCommentsToUpdate.push({ accountComment, accountId });
        }
    }
    // update newer comments first, more likely to have notifications
    accountCommentsToUpdate.sort((a, b) => b.accountComment.timestamp - a.accountComment.timestamp);
    // updating too many comments during init slows down fetching comments/subs
    if (accountCommentsToUpdate.length > 10) {
        accountCommentsToUpdate.length = 10;
    }
    // TODO: add some algo to fetch all notifications (even old), but not on init
    // during downtimes when we're not fetching anything else
    return accountCommentsToUpdate;
};
const utils = {
    getAccountSubplebbits,
    getCommentCidsToAccountsComments,
    fetchCommentLinkDimensions,
    getInitAccountCommentsToUpdate,
};
export default utils;
