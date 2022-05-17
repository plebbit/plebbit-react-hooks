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
                  { cid: '4' },
                  {
                    cid: '5',
                    replies: {
                      pages: {
                        topAll: {
                          comments: [{ cid: '6' }, { cid: '7' }],
                        },
                        new: {
                          comments: [{ cid: '7' }],
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        { cid: '2' },
        { cid: '3' },
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
      pages: { new: page },
    }
    const flattedReplies2 = utils.flattenCommentsPages(pagesInstance)
    expect(flattedReplies2).toEqual(flattedReplies)

    const pagesdotpagesInstance = { new: page }
    const flattedReplies3 = utils.flattenCommentsPages(pagesdotpagesInstance)
    expect(flattedReplies3).toEqual(flattedReplies)
  })
})
