import {describe, expect, test, vi, beforeAll, afterAll, afterEach} from 'vitest'
import utils from './utils'

describe('utils', () => {
  test('flattenCommentsPages', async () => {
    const page = {
      comments: [
        {
          cid: '1',
          replies: {
            pages: {
              new: {
                comments: [
                  {cid: '4'},
                  {
                    cid: '5',
                    replies: {
                      pages: {
                        topAll: {
                          comments: [{cid: '6'}, {cid: '7'}],
                        },
                        new: {
                          comments: [{cid: '7'}],
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        {cid: '2'},
        {cid: '3'},
      ],
    }

    const flattedReplies = utils.flattenCommentsPages(page)
    expect(flattedReplies.length).toBe(7)
    expect(flattedReplies[0].cid).toBe('1')
    expect(flattedReplies[1].cid).toBe('2')
    expect(flattedReplies[2].cid).toBe('3')
    expect(flattedReplies[3].cid).toBe('4')
    expect(flattedReplies[4].cid).toBe('5')
    expect(flattedReplies[5].cid).toBe('6')
    expect(flattedReplies[6].cid).toBe('7')

    const pagesInstance = {
      pages: {new: page},
    }
    const flattedReplies2 = utils.flattenCommentsPages(pagesInstance)
    expect(flattedReplies2).toEqual(flattedReplies)

    const pagesdotpagesInstance = {new: page}
    const flattedReplies3 = utils.flattenCommentsPages(pagesdotpagesInstance)
    expect(flattedReplies3).toEqual(flattedReplies)
  })

  describe('memo', () => {
    test('can cache multiple args', async () => {
      let calledTimes = 0
      const functionToMemo = (...args: any) => ++calledTimes
      const memoedFunction = utils.memo(functionToMemo, {maxSize: 100})
      expect(await memoedFunction('1', 2, undefined, null)).toBe(1)
      expect(await memoedFunction('1', 2, undefined, null)).toBe(1)
      expect(await memoedFunction('2', 2, undefined, null)).toBe(2)
    })

    test('can lru', async () => {
      let calledTimes = 0
      const functionToMemo = (...args: any) => ++calledTimes
      const memoedFunction = utils.memo(functionToMemo, {maxSize: 1})
      expect(await memoedFunction('1', 2, undefined, null)).toBe(1)
      expect(await memoedFunction('1', 2, undefined, null)).toBe(1)
      expect(await memoedFunction('2', 2, undefined, null)).toBe(2)
      expect(await memoedFunction('1', 2, undefined, null)).toBe(3)
    })

    test('can cache pending', async () => {
      let delay = 1
      let calledTimes = 0
      const functionToMemo = async (arg: any) => {
        await new Promise((r) => setTimeout(r, delay++ * 10))
        return ++calledTimes
      }
      const memoedFunction = utils.memo(functionToMemo, {maxSize: 100})
      const arg1 = {}
      const arg2 = {}
      const results = await Promise.all([memoedFunction(arg1), memoedFunction(arg1), memoedFunction(arg1), memoedFunction(arg2)])
      expect(results).toEqual([1, 1, 1, 2])
    })

    test('can throw pending', async () => {
      let delay = 1
      let calledTimes = 0
      const functionToMemo = async (arg: any) => {
        await new Promise((r) => setTimeout(r, delay++ * 10))
        if (calledTimes !== 0) {
          throw 'failed'
        }
        return ++calledTimes
      }
      const memoedFunction = utils.memo(functionToMemo, {maxSize: 100})
      const arg1 = {}
      const arg2 = {}
      expect(await memoedFunction(arg1)).toBe(1)
      expect(await memoedFunction(arg1)).toBe(1)
      expect(await memoedFunction(arg1)).toBe(1)
      expect(memoedFunction(arg2)).rejects.toThrow(`failed`)
    })

    test('wrong args', async () => {
      let calledTimes = 0
      const functionToMemo = async (arg: any) => {
        return ++calledTimes
      }
      const memoedFunction = utils.memo(functionToMemo, {maxSize: 100})
      const arg1 = {}
      const arg2 = {}
      expect(memoedFunction(arg1, arg2)).rejects.toThrow()
      expect(memoedFunction(arg1, 'arg2')).rejects.toThrow()
      expect(memoedFunction(arg1, undefined)).rejects.toThrow()
    })
  })

  describe('memoSync', () => {
    test('can cache multiple args', async () => {
      let calledTimes = 0
      const functionToMemo = (...args: any) => ++calledTimes
      const memoedFunction = utils.memoSync(functionToMemo, {maxSize: 100})
      expect(memoedFunction('1', 2, undefined, null)).toBe(1)
      expect(memoedFunction('1', 2, undefined, null)).toBe(1)
      expect(memoedFunction('2', 2, undefined, null)).toBe(2)
    })

    test('can lru', async () => {
      let calledTimes = 0
      const functionToMemo = (...args: any) => ++calledTimes
      const memoedFunction = utils.memoSync(functionToMemo, {maxSize: 1})
      expect(memoedFunction('1', 2, undefined, null)).toBe(1)
      expect(memoedFunction('1', 2, undefined, null)).toBe(1)
      expect(memoedFunction('2', 2, undefined, null)).toBe(2)
      expect(memoedFunction('1', 2, undefined, null)).toBe(3)
    })

    test('can throw', async () => {
      let delay = 1
      let calledTimes = 0
      const functionToMemo = (arg: any) => {
        if (calledTimes !== 0) {
          throw 'failed'
        }
        return ++calledTimes
      }
      const memoedFunction = utils.memoSync(functionToMemo, {maxSize: 100})
      const arg1 = {}
      const arg2 = {}
      expect(memoedFunction(arg1)).toBe(1)
      expect(memoedFunction(arg1)).toBe(1)
      expect(memoedFunction(arg1)).toBe(1)
      expect(() => memoedFunction(arg2)).toThrow(`failed`)
    })

    test('wrong args', async () => {
      let calledTimes = 0
      const functionToMemo = (arg: any) => {
        return ++calledTimes
      }
      const memoedFunction = utils.memoSync(functionToMemo, {maxSize: 100})
      const arg1 = {}
      const arg2 = {}
      expect(() => memoedFunction(arg1, arg2)).toThrow()
      expect(() => memoedFunction(arg1, 'arg2')).toThrow()
      expect(() => memoedFunction(arg1, undefined)).toThrow()
    })

    test('wrong async', async () => {
      let calledTimes = 0
      const functionToMemo = async (arg: any) => {
        return ++calledTimes
      }
      const memoedFunction = utils.memoSync(functionToMemo, {maxSize: 100})
      const arg1 = {}
      expect(() => memoedFunction(arg1)).toThrow()
      expect(() => memoedFunction('arg2')).toThrow()
    })
  })
})
