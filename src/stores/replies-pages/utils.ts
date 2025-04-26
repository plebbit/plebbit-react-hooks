import {RepliesPage, RepliesFeedOptions, RepliesFeedsOptions, Comment} from '../../types'
import repliesStore from '../replies'
import {getSortTypeFromComment} from '../replies/utils'
import repliesCommentsStore from '../replies/replies-comments-store'

export const addChildrenRepliesFeedsToAddToStore = (page: RepliesPage, comment: Comment) => {
  const {feedsOptions, addFeedsToStore} = repliesStore.getState()
  const commentsToAddToStoreOrUpdate: Comment[] = []
  const feedsToAddToStore: RepliesFeedOptions[] = []
  const addRepliesFeedsToStoreRecursively = (page: RepliesPage, feedOptions: RepliesFeedOptions, sortType: string) => {
    for (const reply of page?.comments || []) {
      // reply has no replies, so doesn't need a feed
      if (Object.keys(reply?.replies?.pages || {}).length + Object.keys(reply?.replies?.pageCids || {}).length === 0) {
        continue
      }
      commentsToAddToStoreOrUpdate.push(reply)
      feedsToAddToStore.push({...feedOptions, commentCid: reply?.cid})
      addRepliesFeedsToStoreRecursively(reply.replies.pages[sortType], feedOptions, sortType)
    }
  }
  const feedsOptionsToAddToStore = Object.values(feedsOptions).filter((feedOptions) => feedOptions.commentCid === comment.cid && !feedOptions.flat)
  for (const feedOptions of feedsOptionsToAddToStore) {
    // use the sort type availabe on the comment when missing
    const sortType = getSortTypeFromComment(comment, feedOptions)
    addRepliesFeedsToStoreRecursively(page, feedOptions, sortType)
  }
  addFeedsToStore(feedsToAddToStore)
  repliesCommentsStore.getState().addCommentsToStoreOrUpdateComments(commentsToAddToStoreOrUpdate)
}
