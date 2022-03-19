import utils from './utils'

describe('utils', () => {
  test('flattenCommentsPages', async () => {
    const sortedReplies = {
      comments: [
        {
          cid: '1',
          sortedReplies: {
            new: {
              comments: [
                { cid: '4' },
                {
                  cid: '5',
                  sortedReplies: {
                    topAll: {
                      comments: [{ cid: '6' }, { cid: '7' }],
                    },
                    new: {
                      comments: [{ cid: '7' }],
                    },
                  },
                },
              ],
            },
          },
        },
        { cid: '2' },
        { cid: '3' },
      ],
    }

    const flattedReplies = utils.flattenCommentsPages(sortedReplies)
    expect(flattedReplies.length).toBe(7)
    expect(flattedReplies[0].cid).toBe('1')
    expect(flattedReplies[1].cid).toBe('2')
    expect(flattedReplies[2].cid).toBe('3')
    expect(flattedReplies[3].cid).toBe('4')
    expect(flattedReplies[4].cid).toBe('5')
    expect(flattedReplies[5].cid).toBe('6')
    expect(flattedReplies[6].cid).toBe('7')

    const pagesInstance = {
      new: sortedReplies,
    }
    const flattedReplies2 = utils.flattenCommentsPages(pagesInstance)
    expect(flattedReplies2).toEqual(flattedReplies)
  })
})
