import {act, renderHook} from '@testing-library/react-hooks'
import testUtils from '../../lib/test-utils'
import useAuthorsCommentsStore, {resetAuthorsCommentsDatabaseAndStore} from './authors-comments-store'
import {} from '../../types'
import accountsStore from '../accounts'
import {Plebbit} from '../../lib/plebbit-js/plebbit-js-mock'

const mockAccount: any = {
  id: 'mock account id',
  plebbit: new Plebbit(),
}

const authorAddress = 'author.eth'

const totalCommentCount = 110
let currentCommentCount = 0
mockAccount.plebbit.commentToGet = async (commentCid: string) => {
  currentCommentCount++
  const commentNumber = totalCommentCount - currentCommentCount
  return {
    cid: commentCid,
    timestamp: commentNumber,
    author: {
      address: authorAddress,
      previousCommentCid: `previous comment cid ${commentNumber}`,
    },
  }
}

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
    waitFor = testUtils.createWaitFor(rendered)

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
    expect(rendered.result.current.lastCommentCids).toEqual({})
    expect(rendered.result.current.nextCommentCidsToFetch).toEqual({})
    expect(rendered.result.current.shouldFetchNextComment).toEqual({})
    expect(typeof rendered.result.current.addAuthorCommentsToStore).toBe('function')
    expect(typeof rendered.result.current.incrementPageNumber).toBe('function')
    expect(typeof rendered.result.current.setNextCommentCidsToFetch).toBe('function')
    expect(typeof rendered.result.current.updateLoadedAndBufferedComments).toBe('function')
  })

  test('add author comments to store', async () => {
    const commentCid = 'comment cid'
    act(() => {
      rendered.result.current.addAuthorCommentsToStore(authorAddress, commentCid, undefined, mockAccount)
    })

    await waitFor(() => rendered.result.current.bufferedComments[authorAddress].length > 0)
    console.log(rendered.result.current)
  })
})
