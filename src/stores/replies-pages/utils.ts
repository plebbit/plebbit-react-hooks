import {RepliesPage, RepliesFeedOptions, RepliesFeedsOptions, Comment} from '../../types'
import repliesStore from '../replies'
import {getSortTypeFromComment} from '../replies/utils'
import repliesCommentsStore from '../replies/replies-comments-store'

export const addChildrenRepliesFeedsToAddToStore = (page: RepliesPage, comment: Comment) => {
  const {feedsOptions, addFeedsToStore} = repliesStore.getState()
  const commentsToAddToStoreOrUpdate: Comment[] = []
  const feedsToAddToStore: RepliesFeedOptions[] = []
  const addRepliesFeedsToStoreRecursively = (page: RepliesPage, feedOptions: RepliesFeedOptions) => {
    // use the sort type availabe on the comment when missing
    // recalculate sort type every addRepliesFeedsToStoreRecursively call
    // because a 'new' page could have nested 'best' preloaded comments
    const sortType = getSortTypeFromComment(comment, feedOptions)

    for (const reply of page?.comments || []) {
      // reply has no replies, so doesn't need a feed
      if (Object.keys(reply?.replies?.pages || {}).length + Object.keys(reply?.replies?.pageCids || {}).length === 0) {
        continue
      }
      commentsToAddToStoreOrUpdate.push(reply)
      feedsToAddToStore.push({...feedOptions, commentCid: reply?.cid})
      addRepliesFeedsToStoreRecursively(reply.replies.pages[sortType], feedOptions)
    }
  }
  const feedsOptionsToAddToStore = Object.values(feedsOptions).filter((feedOptions) => feedOptions.commentCid === comment.cid && !feedOptions.flat)
  for (const feedOptions of feedsOptionsToAddToStore) {
    addRepliesFeedsToStoreRecursively(page, feedOptions)
  }
  addFeedsToStore(feedsToAddToStore)
  repliesCommentsStore.getState().addCommentsToStoreOrUpdateComments(commentsToAddToStoreOrUpdate)
}
