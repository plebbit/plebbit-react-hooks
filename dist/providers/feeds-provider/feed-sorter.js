/**
 * Sort by top is made using relative score, to encourage small communities to grow
 * and to not incentivize communities to inflate their vote counts
 */
const sortByTop = (feed) => {
    const subplebbitScores = {};
    const postScores = {};
    const postRelativeScores = {};
    for (const post of feed) {
        const score = post.upvoteCount - post.downvoteCount;
        if (!subplebbitScores[post.subplebbitAddress]) {
            subplebbitScores[post.subplebbitAddress] = 0;
        }
        subplebbitScores[post.subplebbitAddress] += score;
        postScores[post.cid] = score;
    }
    for (const post of feed) {
        // don't use subplebbit scores lower than 1 or it reverses the relative score
        const subplebbitScore = subplebbitScores[post.subplebbitAddress] || 1;
        postRelativeScores[post.cid] = postScores[post.cid] / subplebbitScore;
    }
    // sort by new and upvoteCount first, for tiebreaker, then relative scores
    return feed
        .sort((a, b) => b.timestamp - a.timestamp)
        .sort((a, b) => b.upvoteCount - a.upvoteCount)
        .sort((a, b) => postRelativeScores[b.cid] - postRelativeScores[a.cid]);
};
/**
 * Sort by controversial is made using relative score, to encourage small communities to grow
 * and to not incentivize communities to inflate their vote counts
 */
const sortByControversial = (feed) => {
    const subplebbitScores = {};
    const postScores = {};
    const postRelativeScores = {};
    for (const post of feed) {
        const magnitude = post.upvoteCount + post.downvoteCount;
        const balance = post.upvoteCount > post.downvoteCount ? parseFloat(post.downvoteCount) / post.upvoteCount : parseFloat(post.upvoteCount) / post.downvoteCount;
        const score = Math.pow(magnitude, balance);
        if (!subplebbitScores[post.subplebbitAddress]) {
            subplebbitScores[post.subplebbitAddress] = 0;
        }
        subplebbitScores[post.subplebbitAddress] += score;
        postScores[post.cid] = score;
    }
    for (const post of feed) {
        // don't use subplebbit scores lower than 1 or it reverses the relative score
        const subplebbitScore = subplebbitScores[post.subplebbitAddress] || 1;
        postRelativeScores[post.cid] = postScores[post.cid] / subplebbitScore;
    }
    // sort by new and upvoteCount first, for tiebreaker, then relative scores
    return feed
        .sort((a, b) => b.timestamp - a.timestamp)
        .sort((a, b) => b.upvoteCount - a.upvoteCount)
        .sort((a, b) => postRelativeScores[b.cid] - postRelativeScores[a.cid]);
};
/**
 * Sort by hot is made using relative score, to encourage small communities to grow
 * and to not incentivize communities to inflate their vote counts
 * Note: a sub with not many posts will be given very high priority
 */
const sortByHot = (feed) => {
    const subplebbitScores = {};
    const postScores = {};
    const postRelativeScores = {};
    const round = (number, decimalPlaces) => {
        const factorOfTen = Math.pow(10, decimalPlaces);
        return Math.round(number * factorOfTen) / factorOfTen;
    };
    for (const post of feed) {
        const score = post.upvoteCount - post.downvoteCount;
        const order = Math.log10(Math.max(score, 1));
        const sign = score > 0 ? 1 : score < 0 ? -1 : 0;
        const seconds = post.timestamp - 1134028003;
        const hotScore = round(sign * order + seconds / 45000, 7);
        if (!subplebbitScores[post.subplebbitAddress]) {
            subplebbitScores[post.subplebbitAddress] = 0;
        }
        subplebbitScores[post.subplebbitAddress] += hotScore;
        postScores[post.cid] = hotScore;
    }
    for (const post of feed) {
        // don't use subplebbit scores lower than 1 or it reverses the relative score
        const subplebbitScore = subplebbitScores[post.subplebbitAddress] || 1;
        postRelativeScores[post.cid] = postScores[post.cid] / subplebbitScore;
    }
    // sort by new and upvoteCount first, for tiebreaker, then relative scores
    return feed
        .sort((a, b) => b.timestamp - a.timestamp)
        .sort((a, b) => b.upvoteCount - a.upvoteCount)
        .sort((a, b) => postRelativeScores[b.cid] - postRelativeScores[a.cid]);
};
export const sort = (sortType, feed) => {
    feed = [...feed];
    if (sortType === 'new') {
        return feed.sort((a, b) => b.timestamp - a.timestamp);
    }
    if (sortType === 'hot') {
        return sortByHot(feed);
    }
    if (sortType.match('top')) {
        return sortByTop(feed);
    }
    if (sortType.match('controversial')) {
        return sortByControversial(feed);
    }
    throw Error(`FeedsProvider feedSorter sort type '${sortType}' doesn't exist`);
};
export default { sort };
