import {Comment, Comments} from '../../types'
import createStore from 'zustand'

export type RepliesCommentsState = {
  comments: Comments
  addCommentsToStoreOrUpdateComments: Function
}

const repliesCommentsStore = createStore<RepliesCommentsState>((setState: Function, getState: Function) => ({
  comments: {},
  addCommentsToStoreOrUpdateComments(comments: Comment[]) {
    setState((state: RepliesCommentsState) => {
      const newComments: Comments = {}
      for (const comment of comments) {
        // updatedAt hasn't changed so no need to update the comment
        if (state.comments[comment.cid] && comment.updatedAt <= state.comments[comment.cid].updatedAt) {
          continue
        }
        newComments[comment.cid] = comment
      }
      if (!Object.keys(newComments).length) {
        return {}
      }
      return {comments: {...state.comments, ...newComments}}
    })
  },
}))

export default repliesCommentsStore
