import {describe, expect, test, vi, beforeAll, afterAll, afterEach} from 'vitest'
import feedSorter from './feed-sorter'

const timestamp = 1600000000000
const approximateDay = 100000
const day = (day: number) => timestamp + approximateDay * day

const feed: any[] = [
  {timestamp: day(0), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1'},
  {timestamp: day(0), upvoteCount: 1000, downvoteCount: 1, subplebbitAddress: 'sub1'},
  {timestamp: day(0), upvoteCount: 10001, downvoteCount: 1000, subplebbitAddress: 'sub1'},
  {timestamp: day(0), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1'},
  {timestamp: day(3), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1'},
  {timestamp: day(2), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1'},
  {timestamp: day(1), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1'},
  {timestamp: day(0), upvoteCount: 100, downvoteCount: 100, subplebbitAddress: 'sub1'},
  {timestamp: day(0), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub2'},
  {timestamp: day(0), upvoteCount: 1000, downvoteCount: 1, subplebbitAddress: 'sub2'},
  {timestamp: day(0), upvoteCount: 10000, downvoteCount: 1000, subplebbitAddress: 'sub2'},
  {timestamp: day(0), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub2'},
  {timestamp: day(3), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub2'},
  {timestamp: day(2), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub3'},
  {timestamp: day(1), lastReplyTimestamp: day(4) + 1, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub3'},
  {timestamp: day(0), lastReplyTimestamp: day(4) + 2, upvoteCount: 100, downvoteCount: 100, subplebbitAddress: 'sub3'},
  // pinned posts should be on top
  {timestamp: day(1), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', pinned: true},
  {timestamp: day(0), upvoteCount: 1000, downvoteCount: 1, subplebbitAddress: 'sub1', pinned: true},
]
for (const i in feed) {
  feed[i].cid = i
}

describe('feedSorter', () => {
  test('sort by top', async () => {
    const sorted = feedSorter.sort('top', feed)
    expect(sorted).toEqual([
      {timestamp: day(1), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', pinned: true, cid: '16'},
      {timestamp: day(0), upvoteCount: 1000, downvoteCount: 1, subplebbitAddress: 'sub1', pinned: true, cid: '17'},
      {timestamp: day(0), upvoteCount: 10001, downvoteCount: 1000, subplebbitAddress: 'sub1', cid: '2'},
      {timestamp: day(0), upvoteCount: 10000, downvoteCount: 1000, subplebbitAddress: 'sub2', cid: '10'},
      {timestamp: day(0), upvoteCount: 1000, downvoteCount: 1, subplebbitAddress: 'sub1', cid: '1'},
      {timestamp: day(0), upvoteCount: 1000, downvoteCount: 1, subplebbitAddress: 'sub2', cid: '9'},
      {timestamp: day(3), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '4'},
      {timestamp: day(3), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub2', cid: '12'},
      {timestamp: day(2), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '5'},
      {timestamp: day(2), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub3', cid: '13'},
      {timestamp: day(1), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '6'},
      {timestamp: day(1), lastReplyTimestamp: day(4) + 1, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub3', cid: '14'},
      {timestamp: day(0), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '0'},
      {timestamp: day(0), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '3'},
      {timestamp: day(0), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub2', cid: '8'},
      {timestamp: day(0), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub2', cid: '11'},
      {timestamp: day(0), upvoteCount: 100, downvoteCount: 100, subplebbitAddress: 'sub1', cid: '7'},
      {timestamp: day(0), lastReplyTimestamp: day(4) + 2, upvoteCount: 100, downvoteCount: 100, subplebbitAddress: 'sub3', cid: '15'},
    ])
  })

  test('sort by controversial', async () => {
    const sorted = feedSorter.sort('controversial', feed)
    expect(sorted).toEqual([
      {timestamp: day(1), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', pinned: true, cid: '16'},
      {timestamp: day(0), upvoteCount: 1000, downvoteCount: 1, subplebbitAddress: 'sub1', pinned: true, cid: '17'},
      {timestamp: day(0), upvoteCount: 100, downvoteCount: 100, subplebbitAddress: 'sub1', cid: '7'},
      {timestamp: day(0), lastReplyTimestamp: day(4) + 2, upvoteCount: 100, downvoteCount: 100, subplebbitAddress: 'sub3', cid: '15'},
      {timestamp: day(0), upvoteCount: 10000, downvoteCount: 1000, subplebbitAddress: 'sub2', cid: '10'},
      {timestamp: day(0), upvoteCount: 10001, downvoteCount: 1000, subplebbitAddress: 'sub1', cid: '2'},
      {timestamp: day(3), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '4'},
      {timestamp: day(3), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub2', cid: '12'},
      {timestamp: day(2), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '5'},
      {timestamp: day(2), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub3', cid: '13'},
      {timestamp: day(1), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '6'},
      {timestamp: day(1), lastReplyTimestamp: day(4) + 1, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub3', cid: '14'},
      {timestamp: day(0), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '0'},
      {timestamp: day(0), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '3'},
      {timestamp: day(0), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub2', cid: '8'},
      {timestamp: day(0), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub2', cid: '11'},
      {timestamp: day(0), upvoteCount: 1000, downvoteCount: 1, subplebbitAddress: 'sub1', cid: '1'},
      {timestamp: day(0), upvoteCount: 1000, downvoteCount: 1, subplebbitAddress: 'sub2', cid: '9'},
    ])
  })

  test('sort by hot', async () => {
    const sorted = feedSorter.sort('hot', feed)
    expect(sorted).toEqual([
      {timestamp: day(1), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', pinned: true, cid: '16'},
      {timestamp: day(0), upvoteCount: 1000, downvoteCount: 1, subplebbitAddress: 'sub1', pinned: true, cid: '17'},
      {timestamp: day(3), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '4'},
      {timestamp: day(3), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub2', cid: '12'},
      {timestamp: day(2), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '5'},
      {timestamp: day(2), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub3', cid: '13'},
      {timestamp: day(1), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '6'},
      {timestamp: day(1), lastReplyTimestamp: day(4) + 1, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub3', cid: '14'},
      {timestamp: day(0), upvoteCount: 10001, downvoteCount: 1000, subplebbitAddress: 'sub1', cid: '2'},
      {timestamp: day(0), upvoteCount: 10000, downvoteCount: 1000, subplebbitAddress: 'sub2', cid: '10'},
      {timestamp: day(0), upvoteCount: 1000, downvoteCount: 1, subplebbitAddress: 'sub1', cid: '1'},
      {timestamp: day(0), upvoteCount: 1000, downvoteCount: 1, subplebbitAddress: 'sub2', cid: '9'},
      {timestamp: day(0), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '0'},
      {timestamp: day(0), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '3'},
      {timestamp: day(0), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub2', cid: '8'},
      {timestamp: day(0), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub2', cid: '11'},
      {timestamp: day(0), upvoteCount: 100, downvoteCount: 100, subplebbitAddress: 'sub1', cid: '7'},
      {timestamp: day(0), lastReplyTimestamp: day(4) + 2, upvoteCount: 100, downvoteCount: 100, subplebbitAddress: 'sub3', cid: '15'},
    ])
  })

  test('sort by new', async () => {
    const sorted = feedSorter.sort('new', feed)
    expect(sorted).toEqual([
      {timestamp: day(1), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', pinned: true, cid: '16'},
      {timestamp: day(0), upvoteCount: 1000, downvoteCount: 1, subplebbitAddress: 'sub1', pinned: true, cid: '17'},
      {timestamp: day(3), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '4'},
      {timestamp: day(3), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub2', cid: '12'},
      {timestamp: day(2), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '5'},
      {timestamp: day(2), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub3', cid: '13'},
      {timestamp: day(1), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '6'},
      {timestamp: day(1), lastReplyTimestamp: day(4) + 1, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub3', cid: '14'},
      {timestamp: day(0), upvoteCount: 10001, downvoteCount: 1000, subplebbitAddress: 'sub1', cid: '2'},
      {timestamp: day(0), upvoteCount: 10000, downvoteCount: 1000, subplebbitAddress: 'sub2', cid: '10'},
      {timestamp: day(0), upvoteCount: 1000, downvoteCount: 1, subplebbitAddress: 'sub1', cid: '1'},
      {timestamp: day(0), upvoteCount: 1000, downvoteCount: 1, subplebbitAddress: 'sub2', cid: '9'},
      {timestamp: day(0), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '0'},
      {timestamp: day(0), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '3'},
      {timestamp: day(0), upvoteCount: 100, downvoteCount: 100, subplebbitAddress: 'sub1', cid: '7'},
      {timestamp: day(0), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub2', cid: '8'},
      {timestamp: day(0), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub2', cid: '11'},
      {timestamp: day(0), lastReplyTimestamp: day(4) + 2, upvoteCount: 100, downvoteCount: 100, subplebbitAddress: 'sub3', cid: '15'},
    ])
  })

  test('sort by active', async () => {
    const sorted = feedSorter.sort('active', feed)
    expect(sorted).toEqual([
      {timestamp: day(1), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', pinned: true, cid: '16'},
      {timestamp: day(0), upvoteCount: 1000, downvoteCount: 1, subplebbitAddress: 'sub1', pinned: true, cid: '17'},
      {timestamp: day(0), lastReplyTimestamp: day(4) + 2, upvoteCount: 100, downvoteCount: 100, subplebbitAddress: 'sub3', cid: '15'},
      {timestamp: day(1), lastReplyTimestamp: day(4) + 1, upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub3', cid: '14'},
      {timestamp: day(3), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '4'},
      {timestamp: day(3), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub2', cid: '12'},
      {timestamp: day(2), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '5'},
      {timestamp: day(2), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub3', cid: '13'},
      {timestamp: day(1), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '6'},
      {timestamp: day(0), upvoteCount: 10001, downvoteCount: 1000, subplebbitAddress: 'sub1', cid: '2'},
      {timestamp: day(0), upvoteCount: 10000, downvoteCount: 1000, subplebbitAddress: 'sub2', cid: '10'},
      {timestamp: day(0), upvoteCount: 1000, downvoteCount: 1, subplebbitAddress: 'sub1', cid: '1'},
      {timestamp: day(0), upvoteCount: 1000, downvoteCount: 1, subplebbitAddress: 'sub2', cid: '9'},
      {timestamp: day(0), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '0'},
      {timestamp: day(0), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub1', cid: '3'},
      {timestamp: day(0), upvoteCount: 100, downvoteCount: 100, subplebbitAddress: 'sub1', cid: '7'},
      {timestamp: day(0), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub2', cid: '8'},
      {timestamp: day(0), upvoteCount: 100, downvoteCount: 10, subplebbitAddress: 'sub2', cid: '11'},
    ])
  })
})
