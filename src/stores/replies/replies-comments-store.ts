import {Comment, Comments} from '../../types'
import createStore from 'zustand'

export type RepliesCommentsState = {
  comments: Comments
  addCommentToStoreOrUpdateComment: Function
}

const repliesCommentsStore = createStore<RepliesCommentsState>((setState: Function, getState: Function) => ({
  comments: {},
  addCommentToStoreOrUpdateComment(comment: Comment) {
    setState((state: RepliesCommentsState) => {
      // updatedAt hasn't changed so no need to update the comment
      if (state.comments[comment.cid] && comment.updatedAt <= state.comments[comment.cid].updatedAt) {
        return
      }
      return {comments: {...state.comments, [comment.cid]: comment}}
    })
  },
}))

export default repliesCommentsStore
