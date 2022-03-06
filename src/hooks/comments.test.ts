import { act, renderHook } from '@testing-library/react-hooks'
import { useComment } from './comments'
import CommentsProvider from '../providers/CommentsProvider'
import localForage from 'localforage'
import PlebbitMock from '../lib/plebbit-js/plebbit-js-mock'
import { mockPlebbitJs } from '../lib/plebbit-js'
mockPlebbitJs(PlebbitMock)

const deleteDatabases = () =>
  Promise.all([
    localForage.createInstance({ name: 'comments' }).clear(),
  ])

describe('comments', () => {
  afterEach(async () => {
    await deleteDatabases()
  })

  test('get comment', () => {

  })
})
