import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { INoticePost } from '../../../types/ICampusState'

export type NoticePostView = {
  id: string
  author: string
  createdAt: number
  content: string
  boardId: string
}

function toView(post: INoticePost | NoticePostView): NoticePostView {
  return {
    id: post.id,
    author: post.author,
    createdAt: post.createdAt,
    content: post.content,
    boardId: (post as NoticePostView).boardId || (post as INoticePost).boardId || 'campus-notice',
  }
}

export const noticeBoardSlice = createSlice({
  name: 'noticeBoard',
  initialState: {
    posts: [] as NoticePostView[],
  },
  reducers: {
    setNoticePosts: (state, action: PayloadAction<NoticePostView[]>) => {
      state.posts = action.payload
    },
    pushNoticePost: (state, action: PayloadAction<INoticePost | NoticePostView>) => {
      const next = toView(action.payload)
      if (state.posts.some((post) => post.id === next.id)) return
      state.posts.push(next)
    },
  },
})

export const { setNoticePosts, pushNoticePost } = noticeBoardSlice.actions

export default noticeBoardSlice.reducer
