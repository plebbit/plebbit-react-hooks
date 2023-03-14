import validator from '../../lib/validator'
import localForageLru from '../../lib/localforage-lru'
const commentsDatabase = localForageLru.createInstance({name: 'comments', size: 5000})
import Logger from '@plebbit/plebbit-logger'
const log = Logger('plebbit-react-hooks:comments:stores')
import {Comment, Comments, Account} from '../../types'
import utils from '../../lib/utils'
import createStore from 'zustand'
import accountsStore from '../accounts'

let plebbitGetCommentPending: {[key: string]: boolean} = {}

// reset all event listeners in between tests
export const listeners: any = []

export type CommentsState = {
  comments: Comments
  addCommentToStore: Function
}

const commentsStore = createStore<CommentsState>((setState: Function, getState: Function) => ({
  comments: {},

  async addCommentToStore(commentId: string, account: Account) {
    const {comments} = getState()

    // comment is in store already, do nothing
    let comment: Comment | undefined = comments[commentId]
    if (comment || plebbitGetCommentPending[commentId + account.id]) {
      return
    }
    plebbitGetCommentPending[commentId + account.id] = true

    // try to find comment in database
    comment = await getCommentFromDatabase(commentId, account)

    // comment not in database, fetch from plebbit-js
    try {
      if (!comment) {
        comment = await utils.retryInfinity(() => account.plebbit.getComment(commentId))
        log.trace('commentsStore.addCommentToStore plebbit.getComment', {commentId, comment, account})
        await commentsDatabase.setItem(commentId, utils.clone(comment))
      }
      log('commentsStore.addCommentToStore', {commentId, comment, account})
      setState((state: any) => ({comments: {...state.comments, [commentId]: utils.clone(comment)}}))
    } catch (e) {
      throw e
    } finally {
      plebbitGetCommentPending[commentId + account.id] = false
    }

    // the comment is still missing up to date mutable data like upvotes, edits, replies, etc
    comment?.on('update', async (updatedComment: Comment) => {
      updatedComment = utils.clone(updatedComment)
      await commentsDatabase.setItem(commentId, updatedComment)
      log('commentsStore comment update', {commentId, updatedComment, account})
      setState((state: any) => ({comments: {...state.comments, [commentId]: updatedComment}}))
    })
    listeners.push(comment)
    comment?.update().catch((error: unknown) => log.trace('comment.update error', {comment, error}))

    // when publishing a comment, you don't yet know its CID
    // so when a new comment is fetched, check to see if it's your own
    // comment, and if yes, add the CID to your account comments database
    await accountsStore.getState().accountsActionsInternal.addCidToAccountComment(comment)
  },
}))

const getCommentFromDatabase = async (commentId: string, account: Account) => {
  const commentData: any = await commentsDatabase.getItem(commentId)
  if (!commentData) {
    return
  }
  const comment = await account.plebbit.createComment(commentData)
  // add potential missing data from the database onto the comment instance
  // should not be necessary if Plebbit.createComment is implemented properly
  for (const prop in commentData) {
    if (comment[prop] === undefined || comment[prop] === null) {
      if (commentData[prop] !== undefined && commentData[prop] !== null) comment[prop] = commentData[prop]
    }
  }

  // add potential missing data from the Pages API
  if (comment.replies) {
    comment.replies.pages = utils.merge(commentData?.replies?.pages || {}, comment?.replies?.pages || {})
    comment.replies.pageCids = utils.merge(commentData?.replies?.pageCids || {}, comment?.replies?.pageCids || {})
  }

  // NOTE: adding missing data is probably not needed with a full implementation of plebbit-js with no bugs
  // but the plebbit mock is barely implemented
  return comment
}

// reset store in between tests
const originalState = commentsStore.getState()
// async function because some stores have async init
export const resetCommentsStore = async () => {
  plebbitGetCommentPending = {}
  // remove all event listeners
  listeners.forEach((listener: any) => listener.removeAllListeners())
  // destroy all component subscriptions to the store
  commentsStore.destroy()
  // restore original state
  commentsStore.setState(originalState)
}

// reset database and store in between tests
export const resetCommentsDatabaseAndStore = async () => {
  await localForageLru.createInstance({name: 'comments'}).clear()
  await resetCommentsStore()
}

export default commentsStore
