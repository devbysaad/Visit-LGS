import { Command } from '@colyseus/command'
import { Client } from 'colyseus'
import { ICampusState } from '../../../types/ICampusState'
import { NoticePost } from '../schema/CampusState'
import {
  MAX_NOTICE_POSTS,
  noticePostsToPersisted,
  saveNoticePosts,
} from '../../noticeBoardStore'

type Payload = {
  client: Client
  content: string
  boardId: string
}

export default class NoticePostUpdateCommand extends Command<ICampusState, Payload> {
  execute(data: Payload) {
    const { client, content, boardId } = data
    const player = this.room.state.players.get(client.sessionId)
    const noticePosts = this.room.state.noticePosts

    if (!noticePosts || !player) return
    if (!content) return

    if (noticePosts.length >= MAX_NOTICE_POSTS) noticePosts.shift()

    const post = new NoticePost()
    post.id = `${Date.now()}-${client.sessionId}`
    post.author = player.name || 'Anonymous'
    post.createdAt = Date.now()
    post.content = content
    post.boardId = boardId || 'campus-notice'
    noticePosts.push(post)

    saveNoticePosts(noticePostsToPersisted(Array.from(noticePosts)))
  }
}
