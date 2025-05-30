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

  // assume a page always uses the same sort type recursively
  // could be incorrect, but we don't care about bad pages implementations for now
  const sortType = getSortTypeFromPage(page) || 'best'

  const addRepliesFeedsToStoreRecursively = (page: RepliesPage, feedOptions: RepliesFeedOptions) => {
    for (const reply of page?.comments || []) {
      // NOTE: even a comment with no replies needs a feed, to know it has 0 replies and not displace the UI when a new replies appears
      commentsToAddToStoreOrUpdate.push(reply)
      feedsToAddToStore.push({...feedOptions, commentCid: reply?.cid, commentDepth: reply?.depth})
      addRepliesFeedsToStoreRecursively(reply?.replies?.pages?.[sortType], feedOptions)
    }
  }
  const feedsOptionsToAddToStore = Object.values(feedsOptions).filter((feedOptions) => feedOptions.commentCid === comment.cid && !feedOptions.flat)
  for (const feedOptions of feedsOptionsToAddToStore) {
    addRepliesFeedsToStoreRecursively(page, feedOptions)
  }
  log('repliesPagesStore.addChildrenRepliesFeedsToAddToStore', {
    feedsToAddToStore,
    commentsToAddToStoreOrUpdate,
  })
  addFeedsToStore(feedsToAddToStore)
  repliesCommentsStore.getState().addCommentsToStoreOrUpdateComments(commentsToAddToStoreOrUpdate)
}
