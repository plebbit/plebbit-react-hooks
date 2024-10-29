/**
 * Sort by top is made using relative score, to encourage small communities to grow
 * and to not incentivize communities to inflate their vote counts
 */
const sortByTop = (feed) => {
    const postScores = {};
    for (const post of feed) {
        const score = post.upvoteCount - post.downvoteCount || 0;
        postScores[post.cid] = score;
    }
    // sort by new and upvoteCount first for tiebreaker, then scores
    return feed
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        .sort((a, b) => (b.upvoteCount || 0) - (a.upvoteCount || 0))
        .sort((a, b) => (postScores[b.cid] || 0) - (postScores[a.cid] || 0));
};
/**
 * Sort by controversial is made using relative score, to encourage small communities to grow
 * and to not incentivize communities to inflate their vote counts
 */
const sortByControversial = (feed) => {
    const postScores = {};
    for (const post of feed) {
        let upvoteCount = post.upvoteCount || 0;
        upvoteCount++; // reddit initial upvotes is 1, plebbit is 0
        const downvoteCount = post.downvoteCount || 0;
        const magnitude = upvoteCount + downvoteCount;
        const balance = upvoteCount > downvoteCount ? parseFloat(downvoteCount) / upvoteCount : parseFloat(upvoteCount) / downvoteCount;
        const score = Math.pow(magnitude, balance);
        postScores[post.cid] = score;
    }
    // sort by new and upvoteCount first for tiebreaker, then scores
    return feed
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        .sort((a, b) => (b.upvoteCount || 0) - (a.upvoteCount || 0))
        .sort((a, b) => (postScores[b.cid] || 0) - (postScores[a.cid] || 0));
};
/**
 * Sort by hot is made using relative score, to encourage small communities to grow
 * and to not incentivize communities to inflate their vote counts
 * Note: a sub with not many posts will be given very high priority
 */
const sortByHot = (feed) => {
    const postScores = {};
    const round = (number, decimalPlaces) => {
        const factorOfTen = Math.pow(10, decimalPlaces);
        return Math.round(number * factorOfTen) / factorOfTen;
    };
    for (const post of feed) {
        let score = (post.upvoteCount || 0) - (post.downvoteCount || 0);
        score++; // reddit initial upvotes is 1, plebbit is 0
        const order = Math.log10(Math.max(Math.abs(score), 1));
        const sign = score > 0 ? 1 : score < 0 ? -1 : 0;
        const seconds = post.timestamp - 1134028003;
        const hotScore = round(sign * order + seconds / 45000, 7);
        postScores[post.cid] = hotScore;
    }
    // sort by new and upvoteCount first for tiebreaker, then scores
    return feed
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        .sort((a, b) => (b.upvoteCount || 0) - (a.upvoteCount || 0))
        .sort((a, b) => (postScores[b.cid] || 0) - (postScores[a.cid] || 0));
};
/**
 * Sort by new is made using relative timestamp score, to encourage small communities to grow
 * and to not incentivize communities to inflate their timestamp
 */
const sortByNew = (feed) => {
    // sort by upvoteCount first for tiebreaker, then timestamp
    return feed.sort((a, b) => (b.upvoteCount || 0) - (a.upvoteCount || 0)).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
};
/**
 * Sort by active is made using relative lastReplyTimestamp score, to encourage small communities to grow
 * and to not incentivize communities to inflate their lastReplyTimestamp
 */
const sortByActive = (feed) => {
    // sort by new and upvoteCount first for tiebreaker, then lastReplyTimestamp
    return feed
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        .sort((a, b) => (b.upvoteCount || 0) - (a.upvoteCount || 0))
        .sort((a, b) => (b.lastReplyTimestamp || b.timestamp || 0) - (a.lastReplyTimestamp || a.timestamp || 0));
};
const sortByOld = (feed) => {
    // sort by upvoteCount first for tiebreaker, then timestamp
    return feed.sort((a, b) => (b.upvoteCount || 0) - (a.upvoteCount || 0)).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
};
// "best" sort from reddit replies
// https://web.archive.org/web/20100305052116/http://blog.reddit.com/2009/10/reddits-new-comment-sorting-system.html
// https://medium.com/hacking-and-gonzo/how-reddit-ranking-algorithms-work-ef111e33d0d9
// http://www.evanmiller.org/how-not-to-sort-by-average-rating.html
// https://github.com/reddit-archive/reddit/blob/753b17407e9a9dca09558526805922de24133d53/r2/r2/lib/db/_sorts.pyx#L70
const sortByBest = (feed) => {
    const postScores = {};
    for (const post of feed) {
        let upvoteCount = post.upvoteCount || 0;
        upvoteCount++; // reddit initial upvotes is 1, plebbit is 0
        const downvoteCount = post.downvoteCount || 0;
        // n is the total number of ratings
        const n = upvoteCount + downvoteCount;
        if (n === 0) {
            postScores[post.cid] = 0;
            continue;
        }
        // zα/2 is the (1-α/2) quantile of the standard normal distribution
        const z = 1.281551565545;
        // p is the observed fraction of positive ratings
        const p = upvoteCount / n;
        const left = p + (1 / (2 * n)) * z * z;
        const right = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
        const under = 1 + (1 / n) * z * z;
        postScores[post.cid] = (left - right) / under;
    }
    // sort by old first for tiebreaker (like reddit does)
    return feed.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)).sort((a, b) => (postScores[b.cid] || 0) - (postScores[a.cid] || 0));
};
export const sort = (sortType, feed) => {
    // pinned posts are not sorted, maybe in a future version we can sort them based on something
    const pinnedPosts = feed.filter((post) => post.pinned);
    feed = feed.filter((post) => !post.pinned);
    if (sortType === 'new') {
        return [...pinnedPosts, ...sortByNew(feed)];
    }
    if (sortType === 'hot') {
        return [...pinnedPosts, ...sortByHot(feed)];
    }
    if (sortType.match('top')) {
        return [...pinnedPosts, ...sortByTop(feed)];
    }
    if (sortType.match('controversial')) {
        return [...pinnedPosts, ...sortByControversial(feed)];
    }
    if (sortType.match('active')) {
        return [...pinnedPosts, ...sortByActive(feed)];
    }
    if (sortType.match('old')) {
        return [...pinnedPosts, ...sortByOld(feed)];
    }
    if (sortType.match('best')) {
        return [...pinnedPosts, ...sortByBest(feed)];
    }
    throw Error(`feedsStore feedSorter sort type '${sortType}' doesn't exist`);
};
export default { sort };
