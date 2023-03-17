import {act, renderHook} from '@testing-library/react-hooks'
import testUtils from '../../lib/test-utils'
import useAuthorsCommentsStore, {resetAuthorsCommentsDatabaseAndStore} from './authors-comments-store'
import accountsStore from '../accounts'
import {Plebbit} from '../../lib/plebbit-js/plebbit-js-mock'
import {commentsPerPage, commentBufferSize} from './authors-comments-store'
import commentsStore from '../comments'
import {getUpdatedBufferedComments} from './utils'
import {AuthorCommentsFilter, Comment, Account} from '../../types'
import {useAccount} from '../..'

const authorAddress = 'author.eth'

// tests take longer than default jest 5 seconds
jest.setTimeout(10000)

describe('authors comments store', () => {
  beforeAll(() => {
    testUtils.silenceReactWarnings()
  })
  afterAll(async () => {
    testUtils.restoreAll()
  })

  let rendered: any, waitFor: any, account: Account
  beforeEach(async () => {
    rendered = renderHook<any, any>(() => {
      const account = useAccount()
      return useAuthorsCommentsStore()
    })
    // large timeout because it takes a while to fetch all comments
    waitFor = testUtils.createWaitFor(rendered, {timeout: 5000})

    await waitFor(() => Object.values(accountsStore.getState().accounts).length > 0)
    account = Object.values(accountsStore.getState().accounts)[0]
    console.log(accountsStore.getState(), {account})
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

  test('discover new lastCommentCid while scrolling', async () => {
    // mock plebbit.getComment() result
    const commentToGet = account.plebbit.commentToGet
    const firstTimestamp = 1000
    const totalAuthorCommentCount = 105
    const totalAuthorCommentCountFromLastCommentCid = 40
    account.plebbit.commentToGet = (commentCid: string) => {
      let authorCommentIndex = Number(commentCid.match(/\d+/)?.[0])
      if (commentCid === 'comment cid') {
        authorCommentIndex = totalAuthorCommentCount
      }
      if (commentCid === 'subplebbit last comment cid') {
        authorCommentIndex = totalAuthorCommentCountFromLastCommentCid
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

      return comment
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

    // logBufferedComments(rendered, authorAddress)

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

// debug util
const logBufferedComments = (rendered: any, authorCommentsName: string, authorAddress: string) => {
  const bufferedComments = getBufferedComments(rendered, authorCommentsName, authorAddress)
  for (const [i, comment] of bufferedComments.sort((a: any, b: any) => a.timestamp - b.timestamp).entries()) {
    // console.log(i+1, {timestamp: comment.timestamp, cid: comment.cid, previousCommentCid: comment.author.previousCommentCid})
    console.debug(i + 1, comment.timestamp, comment.cid)
  }
  console.log('from last comment cid', bufferedComments.filter((comment: any) => comment.cid.includes('last comment cid')).length)
  console.log('from comment cid', bufferedComments.filter((comment: any) => !comment.cid.includes('last comment cid')).length)
  console.log('shouldFetchNextComment', rendered.result.current.shouldFetchNextComment[authorAddress])
  console.log('nextCommentCidsToFetch', rendered.result.current.nextCommentCidsToFetch[authorAddress])
}
