import feedSorter from './feed-sorter'

const feed: any[] = [
  {timestamp: 100, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1'},
  {timestamp: 100, upvoteCount: 1000, downvoteCount: 1, subplebbitAddress: 'sub1'},
  {timestamp: 100, upvoteCount: 10001, downvoteCount: 1000, subplebbitAddress: 'sub1'},
  {timestamp: 100, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1'},
  {timestamp: 103, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1'},
  {timestamp: 102, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1'},
  {timestamp: 101, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1'},
  {timestamp: 100, upvoteCount: 100, downvoteCount: 100, subplebbitAddress: 'sub1'},
  {timestamp: 100, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub2'},
  {timestamp: 100, upvoteCount: 1000, downvoteCount: 1, subplebbitAddress: 'sub2'},
  {timestamp: 100, upvoteCount: 10000, downvoteCount: 1000, subplebbitAddress: 'sub2'},
  {timestamp: 100, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub2'},
  {timestamp: 103, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub2'},
  {timestamp: 102, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub3'},
  {timestamp: 101, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub3'},
  {timestamp: 100, upvoteCount: 100, downvoteCount: 100, subplebbitAddress: 'sub3'},
]
for (const i in feed) {
  feed[i].cid = i
}

describe('feedSorter', () => {
  test('sort by top', async () => {
    const sorted = feedSorter.sort('top', feed)
    expect(sorted).toEqual([
      {timestamp: 100, upvoteCount: 10000, downvoteCount: 1000, subplebbitAddress: 'sub2', cid: '10'},
      {timestamp: 100, upvoteCount: 10001, downvoteCount: 1000, subplebbitAddress: 'sub1', cid: '2'},
      {timestamp: 102, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub3', cid: '13'},
      {timestamp: 101, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub3', cid: '14'},
      {timestamp: 100, upvoteCount: 1000, downvoteCount: 1, subplebbitAddress: 'sub2', cid: '9'},
      {timestamp: 100, upvoteCount: 1000, downvoteCount: 1, subplebbitAddress: 'sub1', cid: '1'},
      {timestamp: 103, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub2', cid: '12'},
      {timestamp: 100, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub2', cid: '8'},
      {timestamp: 100, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub2', cid: '11'},
      {timestamp: 103, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '4'},
      {timestamp: 102, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '5'},
      {timestamp: 101, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '6'},
      {timestamp: 100, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '0'},
      {timestamp: 100, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '3'},
      {timestamp: 100, upvoteCount: 100, downvoteCount: 100, subplebbitAddress: 'sub1', cid: '7'},
      {timestamp: 100, upvoteCount: 100, downvoteCount: 100, subplebbitAddress: 'sub3', cid: '15'}
    ])
  })

  test('sort by controversial', async () => {
    const sorted = feedSorter.sort('controversial', feed)
    expect(sorted).toEqual([
      {timestamp: 100, upvoteCount: 100, downvoteCount: 100, subplebbitAddress: 'sub3', cid: '15'},
      {timestamp: 100, upvoteCount: 100, downvoteCount: 100, subplebbitAddress: 'sub1', cid: '7'},
      {timestamp: 100, upvoteCount: 10000, downvoteCount: 1000, subplebbitAddress: 'sub2', cid: '10'},
      {timestamp: 103, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub2', cid: '12'},
      {timestamp: 100, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub2', cid: '8'},
      {timestamp: 100, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub2', cid: '11'},
      {timestamp: 100, upvoteCount: 1000, downvoteCount: 1, subplebbitAddress: 'sub2', cid: '9'},
      {timestamp: 100, upvoteCount: 10001, downvoteCount: 1000, subplebbitAddress: 'sub1', cid: '2'},
      {timestamp: 102, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub3', cid: '13'},
      {timestamp: 101, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub3', cid: '14'},
      {timestamp: 103, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '4'},
      {timestamp: 102, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '5'},
      {timestamp: 101, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '6'},
      {timestamp: 100, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '0'},
      {timestamp: 100, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '3'},
      {timestamp: 100, upvoteCount: 1000, downvoteCount: 1, subplebbitAddress: 'sub1', cid: '1'} 
    ])
  })

  test('sort by hot', async () => {
    const feedWithRealTimestamps = JSON.parse(JSON.stringify(feed))
    for (const post of feedWithRealTimestamps) {
      post.timestamp = (post.timestamp ** 3) + 1647000000000
    }
    const sorted = feedSorter.sort('hot', feedWithRealTimestamps)
    expect(sorted).toEqual( [
      {timestamp: 1647001061208, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub3', cid: '13'},
      {timestamp: 1647001030301, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub3', cid: '14'},
      {timestamp: 1647001000000, upvoteCount: 100, downvoteCount: 100, subplebbitAddress: 'sub3', cid: '15'},
      {timestamp: 1647001092727, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub2', cid: '12'},
      {timestamp: 1647001000000, upvoteCount: 10000, downvoteCount: 1000, subplebbitAddress: 'sub2', cid: '10'},
      {timestamp: 1647001000000, upvoteCount: 1000, downvoteCount: 1, subplebbitAddress: 'sub2', cid: '9'},
      {timestamp: 1647001000000, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub2', cid: '8'},
      {timestamp: 1647001000000, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub2', cid: '11'},
      {timestamp: 1647001092727, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '4'},
      {timestamp: 1647001000000, upvoteCount: 10001, downvoteCount: 1000, subplebbitAddress: 'sub1', cid: '2'},
      {timestamp: 1647001061208, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '5'},
      {timestamp: 1647001000000, upvoteCount: 1000, downvoteCount: 1, subplebbitAddress: 'sub1', cid: '1'},
      {timestamp: 1647001030301, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '6'},
      {timestamp: 1647001000000, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '0'},
      {timestamp: 1647001000000, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '3'},
      {timestamp: 1647001000000, upvoteCount: 100, downvoteCount: 100, subplebbitAddress: 'sub1', cid: '7'}
    ])
  })
})
