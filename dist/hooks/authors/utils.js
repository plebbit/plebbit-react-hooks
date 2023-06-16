var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useEffect, useState, useMemo } from 'react';
import { useComments } from '../comments';
import utils from '../../lib/utils';
import PeerId from 'peer-id';
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string';
// @ts-ignore
import { Ed25519PublicKey } from 'libp2p-crypto/src/keys/ed25519-class';
export const useAuthorLastCommentCid = (authorAddress, comments, accountName) => {
    // get all unique subplebbit.lastCommentCid from comments
    const subplebbitLastCommentCids = useMemo(() => {
        var _a, _b, _c, _d;
        // don't bother fetching anything if no authorAddress
        if (!authorAddress || !(comments === null || comments === void 0 ? void 0 : comments.length)) {
            return [];
        }
        // 2 comment in the same sub can have different lastCommentCid if a CommentUpdate is stale
        // only fetch the lastCommentCid with the latest updatedAt
        const subplebbitLastCommentUpdatedAt = {};
        for (const comment of comments) {
            // no last comment cid to use
            if (!(comment === null || comment === void 0 ? void 0 : comment.subplebbitAddress) || ((_b = (_a = comment === null || comment === void 0 ? void 0 : comment.author) === null || _a === void 0 ? void 0 : _a.subplebbit) === null || _b === void 0 ? void 0 : _b.lastCommentCid)) {
                continue;
            }
            if (((comment === null || comment === void 0 ? void 0 : comment.updatedAt) || 0) > (subplebbitLastCommentUpdatedAt[comment.subplebbitAddress] || 0)) {
                subplebbitLastCommentUpdatedAt[comment.subplebbitAddress] = comment === null || comment === void 0 ? void 0 : comment.updatedAt;
            }
        }
        // find all unique and most recently updated lastCommentCids
        const subplebbitLastCommentCidsSet = new Set();
        for (const comment of comments) {
            const lastCommentCid = (_d = (_c = comment === null || comment === void 0 ? void 0 : comment.author) === null || _c === void 0 ? void 0 : _c.subplebbit) === null || _d === void 0 ? void 0 : _d.lastCommentCid;
            if (!lastCommentCid) {
                continue;
            }
            // another more recently updated comment in the same sub exists
            if (subplebbitLastCommentUpdatedAt[comment.subplebbitAddress] || 0 > (comment === null || comment === void 0 ? void 0 : comment.updatedAt) || 0) {
                continue;
            }
            subplebbitLastCommentCidsSet.add(lastCommentCid);
        }
        return [...subplebbitLastCommentCidsSet];
    }, [authorAddress, comments]);
    const lastSubplebbitComments = useComments({ commentCids: subplebbitLastCommentCids, accountName });
    // find the comment with the most recent timestamp
    const lastComment = useMemo(() => {
        var _a;
        // without author address, can't confirm if a comment is from the correct author
        if (!authorAddress) {
            return;
        }
        let lastComment;
        for (const comment of lastSubplebbitComments.comments) {
            // subplebbit provided a comment with the wrong author in author.subplebbit.lastCommentCid
            if (((_a = comment === null || comment === void 0 ? void 0 : comment.author) === null || _a === void 0 ? void 0 : _a.address) !== authorAddress) {
                continue;
            }
            // comment is the last so far
            if (((comment === null || comment === void 0 ? void 0 : comment.timestamp) || 0) > ((lastComment === null || lastComment === void 0 ? void 0 : lastComment.timestamp) || 0)) {
                lastComment = comment;
            }
        }
        // make sure lastComment is newer than all comments provided in the argument
        if (lastComment) {
            for (const comment of comments || []) {
                // the lastComment is already in the argument, which is ok
                if ((comment === null || comment === void 0 ? void 0 : comment.cid) === (lastComment === null || lastComment === void 0 ? void 0 : lastComment.cid)) {
                    break;
                }
                // a comment in the argument is more recent, so there's no point defining lastComment
                if (((comment === null || comment === void 0 ? void 0 : comment.timestamp) || 0) > lastComment.timestamp || 0) {
                    lastComment = undefined;
                    break;
                }
            }
        }
        return lastComment;
    }, [authorAddress, lastSubplebbitComments.comments]);
    return lastComment === null || lastComment === void 0 ? void 0 : lastComment.cid;
};
// cache JSON.stringify for filter because it's used a lot
const stringifyFilter = utils.memoSync(JSON.stringify, { maxSize: 100 });
export const useAuthorCommentsName = (accountId, authorAddress, filter) => {
    // if filter is an object, stringify it (cached with memo)
    if (filter) {
        filter = stringifyFilter(filter);
    }
    return useMemo(() => accountId + '-' + authorAddress + '-' + filter + '-', [accountId, authorAddress, filter]);
};
const getPeerIdFromPublicKey = (publicKeyBase64) => __awaiter(void 0, void 0, void 0, function* () {
    const publicKeyBuffer = uint8ArrayFromString(publicKeyBase64, 'base64');
    // the PeerId public key is not a raw public key, it adds a suffix
    const ed25519PublicKeyInstance = new Ed25519PublicKey(publicKeyBuffer);
    const peerId = yield PeerId.createFromPubKey(new Uint8Array(ed25519PublicKeyInstance.bytes)); // add new Uint8Array or bugs out in jsdom
    return peerId;
});
const getPlebbitAddressFromPublicKey = (publicKeyBase64) => __awaiter(void 0, void 0, void 0, function* () {
    const peerId = yield getPeerIdFromPublicKey(publicKeyBase64);
    return peerId.toB58String().trim();
});
export const usePlebbitAddress = (publicKeyBase64) => {
    const [plebbitAddress, setPlebbitAddress] = useState();
    useEffect(() => {
        if (typeof publicKeyBase64 !== 'string') {
            return;
        }
        getPlebbitAddressFromPublicKey(publicKeyBase64)
            .then((plebbitAddress) => setPlebbitAddress(plebbitAddress))
            .catch(() => { });
    }, [publicKeyBase64]);
    return plebbitAddress;
};
