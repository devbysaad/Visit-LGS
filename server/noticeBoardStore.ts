import fs from 'fs'
import path from 'path'
import { NoticePost } from './rooms/schema/CampusState'

export const MAX_NOTICE_POSTS = 80

export type PersistedNotice = {
  id: string
  author: string
  createdAt: number
  content: string
  boardId: string
}

const DATA_DIR = path.join(__dirname, '..', 'data')
const DATA_FILE = path.join(DATA_DIR, 'notice-board.json')

export function loadNoticePosts(): PersistedNotice[] {
  try {
    if (!fs.existsSync(DATA_FILE)) return []
    const raw = fs.readFileSync(DATA_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (item) =>
          item &&
          typeof item.id === 'string' &&
          typeof item.author === 'string' &&
          typeof item.content === 'string' &&
          typeof item.createdAt === 'number'
      )
      .map((item) => ({
        id: item.id,
        author: item.author,
        createdAt: item.createdAt,
        content: item.content,
        boardId: typeof item.boardId === 'string' && item.boardId ? item.boardId : 'campus-notice',
      }))
      .slice(-MAX_NOTICE_POSTS)
  } catch (error) {
    console.warn('[noticeBoard] failed to load persisted posts', error)
    return []
  }
}

export function saveNoticePosts(posts: PersistedNotice[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
    fs.writeFileSync(DATA_FILE, JSON.stringify(posts.slice(-MAX_NOTICE_POSTS), null, 2), 'utf8')
  } catch (error) {
    console.warn('[noticeBoard] failed to save posts', error)
  }
}

export function noticePostsToPersisted(posts: NoticePost[]): PersistedNotice[] {
  return posts.map((post) => ({
    id: post.id,
    author: post.author,
    createdAt: post.createdAt,
    content: post.content,
    boardId: post.boardId || 'campus-notice',
  }))
}

export function hydrateNoticePost(data: PersistedNotice): NoticePost {
  const post = new NoticePost()
  post.id = data.id
  post.author = data.author
  post.createdAt = data.createdAt
  post.content = data.content
  post.boardId = data.boardId || 'campus-notice'
  return post
}
