import {act, renderHook} from '@testing-library/react-hooks'
import testUtils from '../../lib/test-utils'
import useAuthorsCommentsStore, {resetAuthorsCommentsDatabaseAndStore} from './authors-comments-store'
import accountsStore from '../accounts'
import {Plebbit} from '../../lib/plebbit-js/plebbit-js-mock'
import {commentsPerPage, commentBufferSize} from './authors-comments-store'

const mockAccount: any = {
  id: 'mock account id',
  plebbit: new Plebbit(),
}

const authorAddress = 'author.eth'

const totalAuthorCommentCount = 110
let currentAuthorCommentCount = 0
mockAccount.plebbit.commentToGet = (commentCid: string) => {
  currentAuthorCommentCount++
  const authorCommentIndex = totalAuthorCommentCount - currentAuthorCommentCount
  return {
    cid: commentCid,
    timestamp: authorCommentIndex,
    author: {
      address: authorAddress,
      // no previous cid if no more comments
      previousCommentCid: authorCommentIndex > 0 ? `previous comment cid ${authorCommentIndex}` : undefined,
    },
  }
}

jest.setTimeout(10000)

describe('authors comments store', () => {
  beforeAll(() => {
    testUtils.silenceReactWarnings()
  })
  afterAll(async () => {
    testUtils.restoreAll()
  })

  let rendered: any, waitFor: any, accountId
  beforeEach(async () => {
    rendered = renderHook<any, any>(() => useAuthorsCommentsStore())
    // large timeout because it takes a while to fetch all comments
    waitFor = testUtils.createWaitFor(rendered, {timeout: 5000})

    // set account in accounts store
    const accountsState: any = {accounts: {[mockAccount.id]: mockAccount}}
    accountsStore.setState(() => accountsState)
  })

  afterEach(async () => {
    await resetAuthorsCommentsDatabaseAndStore()
  })

  test('initial store', async () => {
    expect(rendered.result.current.options).toEqual({})
    expect(rendered.result.current.loadedComments).toEqual({})
    expect(rendered.result.current.bufferedComments).toEqual({})
    expect(rendered.result.current.nextCommentCidsToFetch).toEqual({})
    expect(rendered.result.current.shouldFetchNextComment).toEqual({})
    expect(rendered.result.current.lastCommentCids).toEqual({})
    expect(typeof rendered.result.current.addAuthorCommentsToStore).toBe('function')
    expect(typeof rendered.result.current.incrementPageNumber).toBe('function')
    expect(typeof rendered.result.current.setNextCommentCidsToFetch).toBe('function')
    expect(typeof rendered.result.current.updateLoadedAndBufferedComments).toBe('function')
    expect(typeof rendered.result.current.setLastCommentCid).toBe('function')
  })

  test('get multiple pages', async () => {
    const commentCid = 'comment cid'
    const optionsName = authorAddress + '-options-name'
    act(() => {
      rendered.result.current.addAuthorCommentsToStore(optionsName, authorAddress, commentCid, undefined, mockAccount)
    })

    // wait for 1st page
    await waitFor(() => rendered.result.current.loadedComments[optionsName].length === commentsPerPage)
    expect(rendered.result.current.loadedComments[optionsName].length).toBe(commentsPerPage)
    expect(hasDuplicateComments(rendered.result.current.loadedComments[optionsName])).toBe(false)
    expect(rendered.result.current.shouldFetchNextComment[authorAddress]).toBe(true)
    // wait for buffered comments to stop loading
    await waitFor(() => rendered.result.current.shouldFetchNextComment[authorAddress] === false)
    expect(rendered.result.current.shouldFetchNextComment[authorAddress]).toBe(false)
    expect(rendered.result.current.bufferedComments[optionsName].length).toBe(commentsPerPage + commentBufferSize)
    expect(hasDuplicateComments(rendered.result.current.bufferedComments[optionsName])).toBe(false)
    expect(rendered.result.current.nextCommentCidsToFetch[authorAddress]).not.toBe(undefined)

    // wait for 2nd page
    act(() => {
      rendered.result.current.incrementPageNumber(optionsName)
    })
    await waitFor(() => rendered.result.current.loadedComments[optionsName].length === 2 * commentsPerPage)
    expect(rendered.result.current.loadedComments[optionsName].length).toBe(2 * commentsPerPage)
    expect(hasDuplicateComments(rendered.result.current.loadedComments[optionsName])).toBe(false)
    // wait for buffered comments to stop loading
    await waitFor(() => rendered.result.current.bufferedComments[optionsName].length === 2 * commentsPerPage + commentBufferSize)
    expect(rendered.result.current.bufferedComments[optionsName].length).toBe(2 * commentsPerPage + commentBufferSize)
    expect(hasDuplicateComments(rendered.result.current.bufferedComments[optionsName])).toBe(false)
    expect(rendered.result.current.shouldFetchNextComment[authorAddress]).toBe(false)
    expect(rendered.result.current.nextCommentCidsToFetch[authorAddress]).not.toBe(undefined)

    // wait for 3rd page, fetched all author comments, reach max buffered comments
    act(() => {
      rendered.result.current.incrementPageNumber(optionsName)
    })
    await waitFor(() => rendered.result.current.loadedComments[optionsName].length === 3 * commentsPerPage)
    expect(rendered.result.current.loadedComments[optionsName].length).toBe(3 * commentsPerPage)
    expect(hasDuplicateComments(rendered.result.current.loadedComments[optionsName])).toBe(false)
    // wait for buffered comments to stop loading
    await waitFor(() => rendered.result.current.bufferedComments[optionsName].length === totalAuthorCommentCount)
    expect(rendered.result.current.bufferedComments[optionsName].length).toBe(totalAuthorCommentCount)
    expect(hasDuplicateComments(rendered.result.current.bufferedComments[optionsName])).toBe(false)
    // should fetch comment because buffer is not full, but author has no more comments
    expect(rendered.result.current.shouldFetchNextComment[authorAddress]).toBe(true)
    // fetched all author comments, no next comment to fetch
    expect(rendered.result.current.nextCommentCidsToFetch[authorAddress]).toBe(undefined)

    // wait for 4th page, fetched all author comments, reach max buffered comments
    act(() => {
      rendered.result.current.incrementPageNumber(optionsName)
    })
    await waitFor(() => rendered.result.current.loadedComments[optionsName].length === 4 * commentsPerPage)
    expect(rendered.result.current.loadedComments[optionsName].length).toBe(4 * commentsPerPage)
    expect(hasDuplicateComments(rendered.result.current.loadedComments[optionsName])).toBe(false)
    // wait for buffered comments to stop loading
    await waitFor(() => rendered.result.current.bufferedComments[optionsName].length === totalAuthorCommentCount)
    expect(rendered.result.current.bufferedComments[optionsName].length).toBe(totalAuthorCommentCount)
    expect(hasDuplicateComments(rendered.result.current.bufferedComments[optionsName])).toBe(false)
    // should fetch comment because buffer is not full, but author has no more comments
    expect(rendered.result.current.shouldFetchNextComment[authorAddress]).toBe(true)
    // fetched all author comments, no next comment to fetch
    expect(rendered.result.current.nextCommentCidsToFetch[authorAddress]).toBe(undefined)

    // wait for 5th page, fetched all author comments, reach max loaded and buffered comments
    act(() => {
      rendered.result.current.incrementPageNumber(optionsName)
    })
    await waitFor(() => rendered.result.current.loadedComments[optionsName].length === totalAuthorCommentCount)
    expect(rendered.result.current.loadedComments[optionsName].length).toBe(totalAuthorCommentCount)
    expect(hasDuplicateComments(rendered.result.current.loadedComments[optionsName])).toBe(false)
    // wait for buffered comments to stop loading
    await waitFor(() => rendered.result.current.bufferedComments[optionsName].length === totalAuthorCommentCount)
    expect(rendered.result.current.bufferedComments[optionsName].length).toBe(totalAuthorCommentCount)
    expect(hasDuplicateComments(rendered.result.current.bufferedComments[optionsName])).toBe(false)
    // should fetch comment because buffer is not full, but author has no more comments
    expect(rendered.result.current.shouldFetchNextComment[authorAddress]).toBe(true)
    // fetched all author comments, no next comment to fetch
    expect(rendered.result.current.nextCommentCidsToFetch[authorAddress]).toBe(undefined)
  })

  // test('discover new lastCommentCid while scrolling', () => {

  // })

  // test('filter comments by subplebbit', () => {

  // })

  // test('filter comments by reply', () => {

  // })

  // test('filter comments by post', () => {

  // })

  // test('filter comments by subplebbit and reply', () => {

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
