import {RepliesPage, RepliesFeedOptions, RepliesFeedsOptions, Comment} from '../../types'
import repliesStore from '../replies'
import {getSortTypeFromComment} from '../replies/utils'
import repliesCommentsStore from '../replies/replies-comments-store'
import Logger from '@plebbit/plebbit-logger'
// include replies pages store with feeds for debugging
const log = Logger('plebbit-react-hooks:replies:stores')

const getSortTypeFromPage = (page: RepliesPage) => {
  for (const reply of page.comments || []) {
    for (const sortType in reply?.replies?.pages) {
      if (reply.replies.pages[sortType]?.comments?.length) {
        return sortType
      }
    }
  }
}

export const addChildrenRepliesFeedsToAddToStore = (page: RepliesPage, comment: Comment) => {
  const {feedsOptions, addFeedsToStore} = repliesStore.getState()
  const commentsToAddToStoreOrUpdate: Comment[] = []
  const feedsToAddToStore: RepliesFeedOptions[] = []
  const addRepliesFeedsToStoreRecursivelyCalls: any[] = []
  const beforeAddRepliesFeedsToStoreRecursivelyCalls: any[] = []

  // assume a page always uses the same sort type recursively
  // could be incorrect, but we don't care about bad pages implementations for now
  const sortType = getSortTypeFromPage(page) || 'best'

  const addRepliesFeedsToStoreRecursively = (page: RepliesPage, feedOptions: RepliesFeedOptions) => {
    addRepliesFeedsToStoreRecursivelyCalls.push({sortType, page, feedOptions})
    for (const reply of page?.comments || []) {
      // reply has no replies, so doesn't need a feed
      if (Object.keys(reply?.replies?.pages || {}).length + Object.keys(reply?.replies?.pageCids || {}).length === 0) {
        continue
      }
      commentsToAddToStoreOrUpdate.push(reply)
      feedsToAddToStore.push({...feedOptions, commentCid: reply?.cid})
      beforeAddRepliesFeedsToStoreRecursivelyCalls.push({sortType, reply, page: reply.replies.pages[sortType], feedOptions: {...feedOptions, commentCid: reply?.cid}})
      addRepliesFeedsToStoreRecursively(reply.replies.pages[sortType], feedOptions)
    }
  }
  const feedsOptionsToAddToStore = Object.values(feedsOptions).filter((feedOptions) => feedOptions.commentCid === comment.cid && !feedOptions.flat)
  for (const feedOptions of feedsOptionsToAddToStore) {
    addRepliesFeedsToStoreRecursively(page, feedOptions)
  }
  log('repliesPagesStore.addChildrenRepliesFeedsToAddToStore', {
    feedsToAddToStore,
    commentsToAddToStoreOrUpdate,
    addRepliesFeedsToStoreRecursivelyCalls,
    beforeAddRepliesFeedsToStoreRecursivelyCalls,
  })
  addFeedsToStore(feedsToAddToStore)
  repliesCommentsStore.getState().addCommentsToStoreOrUpdateComments(commentsToAddToStoreOrUpdate)
}
