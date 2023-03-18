import {act, renderHook} from '@testing-library/react-hooks'
import testUtils from '../../lib/test-utils'
import useAuthorsCommentsStore, {resetAuthorsCommentsDatabaseAndStore, commentsPerPage, commentBufferSize} from './authors-comments-store'
import accountsStore from '../accounts'
import commentsStore from '../comments'
import {getUpdatedBufferedComments} from './utils'
import {AuthorCommentsFilter, Comment, Account} from '../../types'
import {setPlebbitJs} from '../..'
import PlebbitJsMock, {Plebbit} from '../../lib/plebbit-js/plebbit-js-mock'
setPlebbitJs(PlebbitJsMock)

const authorAddress = 'author.eth'

describe('authors comments store', () => {
  // tests take longer than default jest 5 seconds
  jest.setTimeout(10000)

  beforeAll(() => {
    testUtils.silenceReactWarnings()
  })
  afterAll(async () => {
    testUtils.restoreAll()
  })

  let rendered: any, waitFor: any, account: Account
  beforeEach(async () => {
    rendered = renderHook<any, any>(() => useAuthorsCommentsStore())
    // large timeout because it takes a while to fetch all comments
    waitFor = testUtils.createWaitFor(rendered, {timeout: 5000})

    await waitFor(() => Object.values(accountsStore.getState().accounts).length > 0)
    account = Object.values(accountsStore.getState().accounts)[0]
  })

  afterEach(async () => {
    await testUtils.resetDatabasesAndStores()
  })

  test('initial store', async () => {
    expect(rendered.result.current.options).toEqual({})
    expect(rendered.result.current.loadedComments).toEqual({})
    expect(rendered.result.current.bufferedCommentCids).toEqual({})
    expect(rendered.result.current.nextCommentCidsToFetch).toEqual({})
    expect(rendered.result.current.shouldFetchNextComment).toEqual({})
    expect(rendered.result.current.lastCommentCids).toEqual({})
    expect(typeof rendered.result.current.addAuthorCommentsToStore).toBe('function')
    expect(typeof rendered.result.current.incrementPageNumber).toBe('function')
    expect(typeof rendered.result.current.setNextCommentCidsToFetch).toBe('function')
    expect(typeof rendered.result.current.addBufferedCommentCid).toBe('function')
    expect(typeof rendered.result.current.updateLoadedComments).toBe('function')
    expect(typeof rendered.result.current.setLastCommentCid).toBe('function')
  })

  test('get multiple pages', async () => {
    // mock plebbit.getComment() result
    const commentToGet = account.plebbit.commentToGet
    const totalAuthorCommentCount = 110
    let currentAuthorCommentCount = 0
    account.plebbit.commentToGet = (commentCid: string) => {
      currentAuthorCommentCount++
      const authorCommentIndex = totalAuthorCommentCount - currentAuthorCommentCount
      return {
        cid: commentCid,
        timestamp: 1000 + authorCommentIndex,
        author: {
          address: authorAddress,
          // no previous cid if no more comments
          previousCommentCid: authorCommentIndex > 0 ? `previous comment cid ${authorCommentIndex}` : undefined,
        },
      }
    }

    const commentCid = 'comment cid'
    const authorCommentsName = authorAddress + '-comments-name'
    act(() => {
      rendered.result.current.addAuthorCommentsToStore(authorCommentsName, authorAddress, commentCid, undefined, account)
    })

    // wait for 1st page
    await waitFor(() => rendered.result.current.loadedComments[authorCommentsName].length === commentsPerPage)
    expect(rendered.result.current.loadedComments[authorCommentsName].length).toBe(commentsPerPage)
    expect(hasDuplicateComments(rendered.result.current.loadedComments[authorCommentsName])).toBe(false)
    expect(rendered.result.current.shouldFetchNextComment[authorAddress]).toBe(true)
    // wait for buffered comments to stop loading
    await waitFor(() => rendered.result.current.shouldFetchNextComment[authorAddress] === false)
    expect(rendered.result.current.shouldFetchNextComment[authorAddress]).toBe(false)
    expect(rendered.result.current.bufferedCommentCids[authorAddress].size).toBe(commentsPerPage + commentBufferSize)
    expect(rendered.result.current.nextCommentCidsToFetch[authorAddress]).not.toBe(undefined)

    // wait for 2nd page
    act(() => {
      rendered.result.current.incrementPageNumber(authorCommentsName)
    })
    await waitFor(() => rendered.result.current.loadedComments[authorCommentsName].length === 2 * commentsPerPage)
    expect(rendered.result.current.loadedComments[authorCommentsName].length).toBe(2 * commentsPerPage)
    expect(hasDuplicateComments(rendered.result.current.loadedComments[authorCommentsName])).toBe(false)
    // wait for buffered comments to stop loading
    await waitFor(() => rendered.result.current.bufferedCommentCids[authorAddress].size === 2 * commentsPerPage + commentBufferSize)
    expect(rendered.result.current.bufferedCommentCids[authorAddress].size).toBe(2 * commentsPerPage + commentBufferSize)
    expect(rendered.result.current.shouldFetchNextComment[authorAddress]).toBe(false)
    expect(rendered.result.current.nextCommentCidsToFetch[authorAddress]).not.toBe(undefined)

    // wait for 3rd page, fetched all author comments, reach max buffered comments
    act(() => {
      rendered.result.current.incrementPageNumber(authorCommentsName)
    })
    await waitFor(() => rendered.result.current.loadedComments[authorCommentsName].length === 3 * commentsPerPage)
    expect(rendered.result.current.loadedComments[authorCommentsName].length).toBe(3 * commentsPerPage)
    expect(hasDuplicateComments(rendered.result.current.loadedComments[authorCommentsName])).toBe(false)
    // wait for buffered comments to stop loading
    await waitFor(() => rendered.result.current.bufferedCommentCids[authorAddress].size === totalAuthorCommentCount)
    expect(rendered.result.current.bufferedCommentCids[authorAddress].size).toBe(totalAuthorCommentCount)
    // should fetch comment because buffer is not full, but author has no more comments
    expect(rendered.result.current.shouldFetchNextComment[authorAddress]).toBe(true)
    // fetched all author comments, no next comment to fetch
    expect(rendered.result.current.nextCommentCidsToFetch[authorAddress]).toBe(undefined)

    // wait for 4th page, fetched all author comments, reach max buffered comments
    act(() => {
      rendered.result.current.incrementPageNumber(authorCommentsName)
    })
    await waitFor(() => rendered.result.current.loadedComments[authorCommentsName].length === 4 * commentsPerPage)
    expect(rendered.result.current.loadedComments[authorCommentsName].length).toBe(4 * commentsPerPage)
    expect(hasDuplicateComments(rendered.result.current.loadedComments[authorCommentsName])).toBe(false)
    // wait for buffered comments to stop loading
    await waitFor(() => rendered.result.current.bufferedCommentCids[authorAddress].size === totalAuthorCommentCount)
    expect(rendered.result.current.bufferedCommentCids[authorAddress].size).toBe(totalAuthorCommentCount)
    // should fetch comment because buffer is not full, but author has no more comments
    expect(rendered.result.current.shouldFetchNextComment[authorAddress]).toBe(true)
    // fetched all author comments, no next comment to fetch
    expect(rendered.result.current.nextCommentCidsToFetch[authorAddress]).toBe(undefined)

    // wait for 5th page, fetched all author comments, reach max loaded and buffered comments
    act(() => {
      rendered.result.current.incrementPageNumber(authorCommentsName)
    })
    await waitFor(() => rendered.result.current.loadedComments[authorCommentsName].length === totalAuthorCommentCount)
    expect(rendered.result.current.loadedComments[authorCommentsName].length).toBe(totalAuthorCommentCount)
    expect(hasDuplicateComments(rendered.result.current.loadedComments[authorCommentsName])).toBe(false)
    // wait for buffered comments to stop loading
    await waitFor(() => rendered.result.current.bufferedCommentCids[authorAddress].size === totalAuthorCommentCount)
    expect(rendered.result.current.bufferedCommentCids[authorAddress].size).toBe(totalAuthorCommentCount)
    // should fetch comment because buffer is not full, but author has no more comments
    expect(rendered.result.current.shouldFetchNextComment[authorAddress]).toBe(true)
    // fetched all author comments, no next comment to fetch
    expect(rendered.result.current.nextCommentCidsToFetch[authorAddress]).toBe(undefined)

    // restore mock
    account.plebbit.commentToGet = commentToGet
  })

  test.only('discover new lastCommentCid while scrolling', async () => {
    // mock plebbit.getComment() result
    const commentToGet = account.plebbit.commentToGet
    const firstTimestamp = 1000
    const totalAuthorCommentCount = 105
    const totalAuthorCommentCountFromLastCommentCid = 40
    const totalAuthorCommentCountFromLastCommentCid2 = 10
    account.plebbit.commentToGet = (commentCid: string) => {
      let authorCommentIndex = Number(commentCid.match(/\d+$/)?.[0])
      if (commentCid === 'comment cid') {
        authorCommentIndex = totalAuthorCommentCount
      }
      if (commentCid === 'subplebbit last comment cid') {
        authorCommentIndex = totalAuthorCommentCountFromLastCommentCid
      }
      if (commentCid === 'subplebbit last comment cid 2') {
        authorCommentIndex = totalAuthorCommentCountFromLastCommentCid2
      }

      // if is previous from 'comment cid'
      let comment: any = {
        cid: commentCid,
        timestamp: firstTimestamp + authorCommentIndex,
        author: {
          address: authorAddress,
          // no previous cid if no more comments
          previousCommentCid: authorCommentIndex > 1 ? `previous comment cid ${authorCommentIndex - 1}` : undefined,
        },
      }

      // add a last comment cid to comments after the 80th comment
      if (totalAuthorCommentCount - authorCommentIndex > 80) {
        comment.author.subplebbit = {lastCommentCid: 'subplebbit last comment cid'}
        comment.subplebbitAddress = 'subplebbit address'
      }

      // add parent cid to some of the comments for filters
      if (totalAuthorCommentCount - authorCommentIndex > 95) {
        comment.parentCid = 'parent cid'
      }

      // if comment is 'subplebbit last comment cid'
      if (commentCid === 'subplebbit last comment cid') {
        // timestamp of last comment cid must be newer than all
        comment.timestamp = firstTimestamp + totalAuthorCommentCount + totalAuthorCommentCountFromLastCommentCid
        // start a new linked list from the last comment cid
        comment.author.previousCommentCid = `previous from last comment cid ${authorCommentIndex - 1}`
      }

      // if comment is previous from 'subplebbit last comment cid'
      if (commentCid.includes('previous from last comment cid')) {
        comment.timestamp = firstTimestamp + totalAuthorCommentCount + authorCommentIndex
        comment.author.previousCommentCid = `previous from last comment cid ${authorCommentIndex - 1}`

        // no more comments from last comment cid, go back to first 'comment cid'
        if (authorCommentIndex === 1) {
          comment.author.previousCommentCid = 'comment cid'
        }
      }

      // if comment is 'subplebbit last comment cid 2'
      if (commentCid === 'subplebbit last comment cid 2') {
        // timestamp of last comment cid must be newer than all
        comment.timestamp = firstTimestamp + totalAuthorCommentCount + totalAuthorCommentCountFromLastCommentCid + totalAuthorCommentCountFromLastCommentCid2
        // start a new linked list from the last comment cid
        comment.author.previousCommentCid = `previous 2 from last comment cid ${authorCommentIndex - 1}`
      }

      // if comment is previous from 'subplebbit last comment cid 2'
      if (commentCid.includes('previous 2 from last comment cid')) {
        comment.timestamp = firstTimestamp + totalAuthorCommentCount + authorCommentIndex
        comment.author.previousCommentCid = `previous 2 from last comment cid ${authorCommentIndex - 1}`

        // no more comments from last comment cid, go back to first 'subplebbit last comment cid'
        if (authorCommentIndex === 1) {
          comment.author.previousCommentCid = 'subplebbit last comment cid'
        }
      }

      return comment
    }

    const commentCid = 'comment cid'
    const authorCommentsName = authorAddress + '-no-filter'
    act(() => {
      rendered.result.current.addAuthorCommentsToStore(authorCommentsName, authorAddress, commentCid, undefined, account)
    })

    // wait for 1st page
    await waitFor(() => rendered.result.current.loadedComments[authorCommentsName].length === commentsPerPage)
    expect(rendered.result.current.loadedComments[authorCommentsName].length).toBe(commentsPerPage)
    expect(hasDuplicateComments(rendered.result.current.loadedComments[authorCommentsName])).toBe(false)
    expect(rendered.result.current.shouldFetchNextComment[authorAddress]).toBe(true)
    // wait for buffered comments to stop loading
    await waitFor(() => rendered.result.current.shouldFetchNextComment[authorAddress] === false)
    expect(rendered.result.current.shouldFetchNextComment[authorAddress]).toBe(false)
    expect(rendered.result.current.bufferedCommentCids[authorAddress].size).toBe(commentsPerPage + commentBufferSize)
    expect(rendered.result.current.nextCommentCidsToFetch[authorAddress]).not.toBe(undefined)

    // last comment cid should be undefined because it's on the 80th posts and there's only 75 loaded
    expect(rendered.result.current.lastCommentCids[authorAddress]).toBe(undefined)

    // wait for 2nd page
    act(() => {
      rendered.result.current.incrementPageNumber(authorCommentsName)
    })
    await waitFor(() => rendered.result.current.loadedComments[authorCommentsName].length === 2 * commentsPerPage)
    expect(rendered.result.current.loadedComments[authorCommentsName].length).toBe(2 * commentsPerPage)
    expect(hasDuplicateComments(rendered.result.current.loadedComments[authorCommentsName])).toBe(false)
    // wait for buffered comments to stop loading
    await waitFor(() => rendered.result.current.bufferedCommentCids[authorAddress].size === 2 * commentsPerPage + commentBufferSize)
    expect(rendered.result.current.bufferedCommentCids[authorAddress].size).toBe(2 * commentsPerPage + commentBufferSize)
    expect(rendered.result.current.shouldFetchNextComment[authorAddress]).toBe(false)
    expect(rendered.result.current.nextCommentCidsToFetch[authorAddress]).not.toBe(undefined)

    // wait for last comment cid
    await waitFor(() => rendered.result.current.lastCommentCids[authorAddress] === 'subplebbit last comment cid')
    expect(rendered.result.current.lastCommentCids[authorAddress]).toBe('subplebbit last comment cid')

    // last comment of loaded comments is from 'comment cid' previous comments because already loaded feeds can't change
    let bufferedComments = getBufferedComments(rendered, authorCommentsName, authorAddress)
    expect(bufferedComments[2 * commentsPerPage - 1].cid).toBe('previous comment cid 56')
    expect(rendered.result.current.loadedComments[authorCommentsName][2 * commentsPerPage - 1].cid).toBe('previous comment cid 56')

    // first comment of next page is from last cid because buffered comments get reordered by most recent as they are fetched
    expect(bufferedComments[2 * commentsPerPage].cid).toBe('subplebbit last comment cid')
    expect(bufferedComments[2 * commentsPerPage + 1].cid).toBe('previous from last comment cid 39')

    // discover older lastCommentCid, should do nothing because not new
    commentsStore.setState((state: any) => {
      const commentCid = 'previous comment cid 100'
      const comment = {...state.comments[commentCid]}
      comment.author.subplebbit = {lastCommentCid: 'previous comment cid 3'}
      return {comments: {...state.comments, [commentCid]: comment}}
    })

    // wait for 3rd page, still has more comments to buffer because of new comments from lastCommentCid
    act(() => {
      rendered.result.current.incrementPageNumber(authorCommentsName)
    })
    await waitFor(() => rendered.result.current.loadedComments[authorCommentsName].length === 3 * commentsPerPage)
    expect(rendered.result.current.loadedComments[authorCommentsName].length).toBe(3 * commentsPerPage)
    expect(hasDuplicateComments(rendered.result.current.loadedComments[authorCommentsName])).toBe(false)
    // wait for buffered comments to stop loading
    await waitFor(() => rendered.result.current.bufferedCommentCids[authorAddress].size === 3 * commentsPerPage + commentBufferSize)
    expect(rendered.result.current.bufferedCommentCids[authorAddress].size).toBe(3 * commentsPerPage + commentBufferSize)
    // buffer is full because of new comments from lastCommentCid
    expect(rendered.result.current.shouldFetchNextComment[authorAddress]).toBe(false)
    // not yet fetched all author comments because of new comments from lastCommentCid
    expect(typeof rendered.result.current.nextCommentCidsToFetch[authorAddress]).toBe('string')

    // last comment of loaded comments is from 'comment cid' previous comments because not all comments from lastCommentCid have loaded yet
    bufferedComments = getBufferedComments(rendered, authorCommentsName, authorAddress)
    expect(bufferedComments[3 * commentsPerPage - 1].cid).toBe('previous comment cid 47')
    expect(rendered.result.current.loadedComments[authorCommentsName][3 * commentsPerPage - 1].cid).toBe('previous comment cid 47')

    // first comments of next page are from last cid because buffered comments get reordered by most recent as they are fetched
    expect(bufferedComments[3 * commentsPerPage].cid).toBe('previous from last comment cid 24')
    expect(bufferedComments[3 * commentsPerPage + 1].cid).toBe('previous from last comment cid 23')

    // wait for 4th page, fetched all author comments, reach max buffered comments
    act(() => {
      rendered.result.current.incrementPageNumber(authorCommentsName)
    })
    await waitFor(() => rendered.result.current.loadedComments[authorCommentsName].length === 4 * commentsPerPage)
    expect(rendered.result.current.loadedComments[authorCommentsName].length).toBe(4 * commentsPerPage)
    expect(hasDuplicateComments(rendered.result.current.loadedComments[authorCommentsName])).toBe(false)
    // wait for buffered comments to stop loading
    await waitFor(() => rendered.result.current.bufferedCommentCids[authorAddress].size === totalAuthorCommentCount + totalAuthorCommentCountFromLastCommentCid)
    expect(rendered.result.current.bufferedCommentCids[authorAddress].size).toBe(totalAuthorCommentCount + totalAuthorCommentCountFromLastCommentCid)
    // should fetch comment because buffer is not full, but author has no more comments
    expect(rendered.result.current.shouldFetchNextComment[authorAddress]).toBe(true)
    // fetched all author comments, no next comment to fetch
    expect(rendered.result.current.nextCommentCidsToFetch[authorAddress]).toBe(undefined)

    // no more comments from 'subplebbit last comment cid'
    bufferedComments = getBufferedComments(rendered, authorCommentsName, authorAddress)
    expect(bufferedComments[4 * commentsPerPage - 1].cid).toBe('previous comment cid 46')
    expect(rendered.result.current.loadedComments[authorCommentsName][4 * commentsPerPage - 1].cid).toBe('previous comment cid 46')
    expect(bufferedComments[4 * commentsPerPage].cid).toBe('previous comment cid 45')
    expect(bufferedComments[4 * commentsPerPage + 1].cid).toBe('previous comment cid 44')

    // discover a second lastCommentCid
    commentsStore.setState((state: any) => {
      const commentCid = 'comment cid'
      const comment = {...state.comments[commentCid]}
      comment.author.subplebbit = {lastCommentCid: 'subplebbit last comment cid 2'}
      return {comments: {...state.comments, [commentCid]: comment}}
    })

    // wait for last comment cid and next comment cid to fetch
    await waitFor(() => rendered.result.current.lastCommentCids[authorAddress] === 'subplebbit last comment cid 2')
    expect(rendered.result.current.lastCommentCids[authorAddress]).toBe('subplebbit last comment cid 2')
    expect(rendered.result.current.nextCommentCidsToFetch[authorAddress]).toBe('previous 2 from last comment cid 9')

    // wait for 5th page, fetched all author comments, reach max buffered comments
    act(() => {
      rendered.result.current.incrementPageNumber(authorCommentsName)
    })
    await waitFor(() => rendered.result.current.loadedComments[authorCommentsName].length === 5 * commentsPerPage)
    expect(rendered.result.current.loadedComments[authorCommentsName].length).toBe(5 * commentsPerPage)
    expect(hasDuplicateComments(rendered.result.current.loadedComments[authorCommentsName])).toBe(false)
    // wait for buffered comments to stop loading
    await waitFor(
      () =>
        rendered.result.current.bufferedCommentCids[authorAddress].size ===
        totalAuthorCommentCount + totalAuthorCommentCountFromLastCommentCid + totalAuthorCommentCountFromLastCommentCid2
    )
    expect(rendered.result.current.bufferedCommentCids[authorAddress].size).toBe(
      totalAuthorCommentCount + totalAuthorCommentCountFromLastCommentCid + totalAuthorCommentCountFromLastCommentCid2
    )
    // should fetch comment because buffer is not full, but author has no more comments
    expect(rendered.result.current.shouldFetchNextComment[authorAddress]).toBe(true)
    // fetched all author comments, no next comment to fetch
    expect(rendered.result.current.nextCommentCidsToFetch[authorAddress]).toBe(undefined)

    // last comment of loaded comments is from 'comment cid' previous comments because not all comments from lastCommentCid have loaded yet
    bufferedComments = getBufferedComments(rendered, authorCommentsName, authorAddress)
    expect(bufferedComments[5 * commentsPerPage - 1].cid).toBe('previous comment cid 22')
    expect(rendered.result.current.loadedComments[authorCommentsName][5 * commentsPerPage - 1].cid).toBe('previous comment cid 22')

    // first comments of next page are from last cid because buffered comments get reordered by most recent as they are fetched
    expect(bufferedComments[5 * commentsPerPage].cid).toBe('previous 2 from last comment cid 9')
    expect(bufferedComments[5 * commentsPerPage + 1].cid).toBe('previous 2 from last comment cid 8')

    // add another author comments with post filter
    const postFilterName = authorAddress + '-post-filter'
    const postFilter = {hasParentCid: false}
    act(() => {
      rendered.result.current.addAuthorCommentsToStore(postFilterName, authorAddress, commentCid, postFilter, account)
    })
    await waitFor(() => rendered.result.current.loadedComments[postFilterName].length === commentsPerPage)

    // scroll all pages
    const postCount = 128
    await scrollPages(rendered, postFilterName, 6, postCount)

    // the filter actually filtered
    expect(rendered.result.current.loadedComments[postFilterName].length).not.toBe(rendered.result.current.loadedComments[authorCommentsName].length)
    expect(rendered.result.current.loadedComments[postFilterName].length).toBe(postCount)
    for (const comment of rendered.result.current.loadedComments[postFilterName]) {
      expect(comment.parentCid).toBe(undefined)
    }

    // add another author comments with reply filter
    const replyFilterName = authorAddress + '-reply-filter'
    const replyFilter = {hasParentCid: true}
    act(() => {
      rendered.result.current.addAuthorCommentsToStore(replyFilterName, authorAddress, commentCid, replyFilter, account)
    })
    await waitFor(() => rendered.result.current.loadedComments[replyFilterName].length === commentsPerPage)

    // scroll all pages
    const replyCount = 27
    await scrollPages(rendered, replyFilterName, 2, replyCount)

    // the filter actually filtered
    expect(rendered.result.current.loadedComments[replyFilterName].length).not.toBe(rendered.result.current.loadedComments[authorCommentsName].length)
    expect(rendered.result.current.loadedComments[replyFilterName].length).toBe(replyCount)
    for (const comment of rendered.result.current.loadedComments[replyFilterName]) {
      expect(comment.parentCid).toBe('parent cid')
    }
    expect(rendered.result.current.loadedComments[replyFilterName].length + rendered.result.current.loadedComments[postFilterName].length).toBe(
      totalAuthorCommentCount + totalAuthorCommentCountFromLastCommentCid + totalAuthorCommentCountFromLastCommentCid2
    )

    // restore mock
    account.plebbit.commentToGet = commentToGet
  })

  // test('comments are already in store before add authors comments to store', () => {

  // })

  // test('mutliple authors at the same time', () => {

  // })

  // test('filter comments by subplebbit', () => {

  // })

  // test('filter comments by reply', () => {

  // })

  // test('filter comments by post', () => {

  // })

  // test('filter comments by subplebbit and reply', () => {

  // })

  // test('multiple filters and authors at the same time', () => {

  // })
})

const hasDuplicateComments = (comments: any) => {
  const cids = new Set()
  for (const comment of comments) {
    if (cids.has(comment.cid)) {
      return true
    }
    cids.add(comment.cid)
  }
  return false
}

const getBufferedComments = (rendered: any, authorCommentsName: string, authorAddress: string, filter?: AuthorCommentsFilter) => {
  const {comments} = commentsStore.getState()
  const loadedComments = rendered.result.current.loadedComments[authorCommentsName]
  const allBufferedComments: any = [...rendered.result.current.bufferedCommentCids[authorAddress]].map((commentCid: string) => comments[commentCid])
  const filteredAndOrderedBufferedComments: Comment[] = getUpdatedBufferedComments(loadedComments, allBufferedComments, filter, comments)
  return filteredAndOrderedBufferedComments
}

const scrollPages = async (rendered: any, authorCommentsName: string, pageCount: number, commentCount: number) => {
  let pageIndex = 1
  while (pageIndex++ < pageCount) {
    act(() => {
      rendered.result.current.incrementPageNumber(authorCommentsName)
    })
    let currentCommentCount = pageIndex * commentsPerPage
    if (currentCommentCount > commentCount) {
      currentCommentCount = commentCount
    }
    try {
      await rendered.waitFor(() => rendered.result.current.loadedComments[authorCommentsName].length === currentCommentCount)
    } catch (e: any) {
      e.message = 'failed scrollPages waitFor: ' + e.message
      console.warn(e)
    }
  }
}

// debug util
const logBufferedComments = (rendered: any, authorCommentsName: string, authorAddress: string) => {
  const bufferedComments = getBufferedComments(rendered, authorCommentsName, authorAddress)
  for (const [i, comment] of bufferedComments.sort((a: any, b: any) => a.timestamp - b.timestamp).entries()) {
    // console.log(i+1, {timestamp: comment.timestamp, cid: comment.cid, previousCommentCid: comment.author.previousCommentCid})
    console.log(i + 1, comment.timestamp, comment.cid)
  }
  console.log('from last comment cid', bufferedComments.filter((comment: any) => comment.cid.includes('last comment cid')).length)
  console.log('from comment cid', bufferedComments.filter((comment: any) => !comment.cid.includes('last comment cid')).length)
  console.log('shouldFetchNextComment', rendered.result.current.shouldFetchNextComment[authorAddress])
  console.log('nextCommentCidsToFetch', rendered.result.current.nextCommentCidsToFetch[authorAddress])
}
