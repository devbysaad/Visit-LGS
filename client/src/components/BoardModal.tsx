import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'

import phaserGame from '../PhaserGame'
import CampusScene from '../scenes/CampusScene'
import { useAppDispatch, useAppSelector } from '../hooks'
import { closeBoard } from '../stores/BoardStore'
import { getBoardById } from '../content/boards'
import { sanitizeNoticePost, MAX_NOTICE_LENGTH } from '../utils/moderation'

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(14, 16, 28, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 410;
`

const Panel = styled.div`
  width: 520px;
  max-width: 92vw;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  background: #1b2430;
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
  border: 2px solid #c9a22766;
  position: relative;
  overflow: hidden;
`

const Header = styled.div`
  padding: 20px 28px 12px;
  border-bottom: 1px solid #ffffff1a;
  background: linear-gradient(180deg, #2a3344 0%, #1b2430 100%);
`

const CloseButton = styled(IconButton)`
  position: absolute !important;
  top: 12px;
  right: 12px;
  color: #eee !important;
`

const Name = styled.h2`
  margin: 0 0 4px;
  color: #f0e2a8;
  font-size: 20px;
  padding-right: 36px;
  display: flex;
  align-items: center;
  gap: 8px;

  svg {
    color: #fb7185;
  }
`

const Hint = styled.p`
  margin: 0;
  color: #9aa3b8;
  font-size: 13px;
`

const BoardSurface = styled.div`
  flex: 1;
  overflow-y: auto;
  margin: 12px 16px;
  padding: 16px;
  min-height: 180px;
  border-radius: 8px;
  background: #1e3d2f;
  border: 1px solid #2f6b4f;
  color: #e8f5e9;
  font-family: 'Courier New', Courier, monospace;
`

const Post = styled.article`
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #2f6b4f66;

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }
`

const Meta = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: #8fbfa3;
  font-size: 11px;
  margin-bottom: 4px;
`

const Body = styled.p`
  margin: 0;
  white-space: pre-wrap;
  font-size: 14px;
  line-height: 1.45;
`

const Empty = styled.p`
  margin: 0;
  color: #8fbfa3;
  font-size: 13px;
`

const Composer = styled.form`
  padding: 12px 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const TextArea = styled.textarea`
  width: 100%;
  min-height: 64px;
  resize: vertical;
  border-radius: 8px;
  border: 1px solid #ffffff22;
  background: #121820;
  color: #eef1f6;
  padding: 10px 12px;
  font: inherit;
  font-size: 14px;

  &:focus {
    outline: 2px solid #fb7185;
    border-color: transparent;
  }
`

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const CharCount = styled.span`
  color: #9aa3b8;
  font-size: 12px;
`

const PostButton = styled.button<{ disabled?: boolean }>`
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  background: ${(p) => (p.disabled ? '#1a4a50' : '#fb7185')};
  color: ${(p) => (p.disabled ? '#9aa3b8' : '#0e101c')};
  font-weight: 700;
  font-size: 13px;
  cursor: ${(p) => (p.disabled ? 'default' : 'pointer')};
`

function formatTime(ts: number): string {
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export default function BoardModal() {
  const dispatch = useAppDispatch()
  const modalOpen = useAppSelector((state) => state.board.modalOpen)
  const selectedBoardId = useAppSelector((state) => state.board.selectedBoardId)
  const allPosts = useAppSelector((state) => state.noticeBoard.posts)
  const [draft, setDraft] = useState('')

  const board = selectedBoardId ? getBoardById(selectedBoardId) : undefined
  const posts = allPosts
    .filter((post) => post.boardId === selectedBoardId)
    .sort((a, b) => b.createdAt - a.createdAt)
  const canPost = draft.trim().length > 0 && draft.trim().length <= MAX_NOTICE_LENGTH

  useEffect(() => {
    if (!modalOpen) setDraft('')
  }, [modalOpen])

  useEffect(() => {
    if (!modalOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dispatch(closeBoard())
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalOpen, dispatch])

  if (!modalOpen || !selectedBoardId) return null

  const title = board?.name ?? selectedBoardId
  const hint = board?.hint ?? 'Leave a short note for classmates.'

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!canPost) return
    const game = phaserGame.scene.keys.game as CampusScene | undefined
    game?.network.addNoticePost(sanitizeNoticePost(draft), selectedBoardId)
    setDraft('')
  }

  return (
    <Backdrop onClick={() => dispatch(closeBoard())}>
      <Panel onClick={(event) => event.stopPropagation()}>
        <CloseButton aria-label="close" onClick={() => dispatch(closeBoard())} size="small">
          <CloseIcon />
        </CloseButton>
        <Header>
          <Name>
            <EditIcon fontSize="small" />
            {title}
          </Name>
          <Hint>{hint} Notes sync for everyone in the room.</Hint>
        </Header>
        <BoardSurface>
          {posts.length === 0 ? (
            <Empty>Board is blank — write the first note.</Empty>
          ) : (
            posts.map((post) => (
              <Post key={post.id}>
                <Meta>
                  <span>{post.author || 'Anonymous'}</span>
                  <span>{formatTime(post.createdAt)}</span>
                </Meta>
                <Body>{post.content}</Body>
              </Post>
            ))
          )}
        </BoardSurface>
        <Composer onSubmit={onSubmit}>
          <TextArea
            value={draft}
            onChange={(event) => setDraft(event.target.value.slice(0, MAX_NOTICE_LENGTH))}
            placeholder="Write on the board…"
            maxLength={MAX_NOTICE_LENGTH}
            aria-label="Board message"
          />
          <Row>
            <CharCount>
              {draft.length}/{MAX_NOTICE_LENGTH}
            </CharCount>
            <PostButton type="submit" disabled={!canPost}>
              Write
            </PostButton>
          </Row>
        </Composer>
      </Panel>
    </Backdrop>
  )
}
