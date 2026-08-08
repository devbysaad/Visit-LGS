import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'

import phaserGame from '../PhaserGame'
import CampusScene from '../scenes/CampusScene'
import { useAppDispatch, useAppSelector } from '../hooks'
import { closeBuilding } from '../stores/BuildingStore'
import { staffNotices, campusBuzz } from '../content/notices'
import { sanitizeNoticePost, MAX_NOTICE_LENGTH } from '../utils/moderation'

/**
 * Full-screen corkboard (Among Us task-panel energy):
 * open from the outdoor Notice Board — pin campus buzz + live student posts.
 */

const Stage = styled.div`
  position: fixed;
  inset: 0;
  z-index: 420;
  display: flex;
  flex-direction: column;
  background: radial-gradient(ellipse at center, #1a1520 0%, #0a0c12 70%);
  padding: 28px 36px 24px;
  box-sizing: border-box;
`

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-shrink: 0;
`

const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const Title = styled.h1`
  margin: 0;
  font-family: 'Courier New', Courier, monospace;
  font-size: 28px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #f4e4bc;
  text-shadow: 0 2px 0 #00000088;
`

const Subtitle = styled.p`
  margin: 0;
  color: #9aa3b8;
  font-size: 14px;
`

const CloseButton = styled(IconButton)`
  color: #eee !important;
  background: #ffffff14 !important;
  border: 1px solid #ffffff22 !important;

  &:hover {
    background: #ffffff22 !important;
  }
`

const Cork = styled.div`
  flex: 1;
  min-height: 0;
  position: relative;
  border-radius: 8px;
  border: 10px solid #5c3d2e;
  box-shadow:
    inset 0 0 80px #00000055,
    0 12px 40px #00000088;
  background:
    radial-gradient(circle at 20% 30%, #c4a574 0%, transparent 40%),
    radial-gradient(circle at 80% 70%, #b8956a 0%, transparent 45%),
    repeating-linear-gradient(
      90deg,
      #c9a66b 0px,
      #c9a66b 2px,
      #d4b57a 2px,
      #d4b57a 4px
    ),
    #c9a66b;
  overflow: hidden;
`

const CorkScroll = styled.div`
  position: absolute;
  inset: 0;
  overflow-y: auto;
  padding: 28px 32px 120px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 22px 18px;
  align-content: start;
`

const Pin = styled.article<{ $rot: number; $tone: 'staff' | 'buzz' | 'live' }>`
  position: relative;
  padding: 18px 16px 14px;
  background: ${(p) =>
    p.$tone === 'staff' ? '#fff8e7' : p.$tone === 'buzz' ? '#fff1c9' : '#f7fbff'};
  color: #1a1a1a;
  box-shadow: 2px 3px 0 #00000033, 0 8px 18px #00000033;
  transform: rotate(${(p) => p.$rot}deg);
  border: 1px solid #00000018;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: rotate(0deg) scale(1.03);
    z-index: 2;
    box-shadow: 0 10px 24px #00000044;
  }

  &::before {
    content: '';
    position: absolute;
    top: 8px;
    left: 50%;
    width: 14px;
    height: 14px;
    margin-left: -7px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, #ff6b6b, #b01030 70%);
    box-shadow: 0 2px 2px #00000055;
  }
`

const PinLabel = styled.div`
  margin-top: 8px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #8a6a3a;
`

const PinTitle = styled.h3`
  margin: 6px 0 8px;
  font-size: 15px;
  line-height: 1.25;
  color: #1a1a1a;
`

const PinBody = styled.p`
  margin: 0;
  font-size: 13px;
  line-height: 1.4;
  white-space: pre-wrap;
  color: #333;
`

const PinMeta = styled.div`
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 11px;
  color: #666;
`

const ComposerDock = styled.form`
  position: absolute;
  left: 24px;
  right: 24px;
  bottom: 18px;
  display: flex;
  gap: 12px;
  align-items: flex-end;
  padding: 14px;
  border-radius: 12px;
  background: #1b2430ee;
  border: 1px solid #fb718566;
  box-shadow: 0 8px 24px #00000066;
`

const TextArea = styled.textarea`
  flex: 1;
  min-height: 56px;
  max-height: 120px;
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

const Side = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: stretch;
  min-width: 120px;
`

const CharCount = styled.span`
  color: #9aa3b8;
  font-size: 11px;
  text-align: right;
`

const PostButton = styled.button<{ disabled?: boolean }>`
  padding: 10px 14px;
  border-radius: 8px;
  border: none;
  background: ${(p) => (p.disabled ? '#1a4a50' : '#fb7185')};
  color: ${(p) => (p.disabled ? '#9aa3b8' : '#0e101c')};
  font-weight: 800;
  font-size: 13px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: ${(p) => (p.disabled ? 'default' : 'pointer')};
`

const Status = styled.p<{ $error?: boolean }>`
  margin: 0;
  font-size: 12px;
  color: ${(p) => (p.$error ? '#ff8a80' : '#9aa3b8')};
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

function getNetwork() {
  const game = phaserGame.scene.keys.game as CampusScene | undefined
  return game?.network
}

export default function NoticeBoardModal() {
  const dispatch = useAppDispatch()
  const modalOpen = useAppSelector((state) => state.building.modalOpen)
  const selectedBuildingId = useAppSelector((state) => state.building.selectedBuildingId)
  const playerPosts = useAppSelector((state) => state.noticeBoard.posts)
  const sessionId = useAppSelector((state) => state.user.sessionId)
  const playerName = useAppSelector((state) => state.user.playerNameMap.get(sessionId))
  const [draft, setDraft] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const textRef = useRef<HTMLTextAreaElement>(null)

  const isBoard = modalOpen && selectedBuildingId === 'notice-board'
  const trimmed = draft.trim()
  const canPost = trimmed.length > 0 && trimmed.length <= MAX_NOTICE_LENGTH

  useEffect(() => {
    if (!isBoard) {
      setDraft('')
      setStatus(null)
      setError(false)
      return
    }
    const game = phaserGame.scene.keys.game as CampusScene | undefined
    game?.disableKeys()
    const t = window.setTimeout(() => textRef.current?.focus(), 50)
    return () => window.clearTimeout(t)
  }, [isBoard])

  useEffect(() => {
    if (!isBoard) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dispatch(closeBuilding())
      // Don't let Phaser/WASD steal typing while the board is open
      event.stopPropagation()
    }
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [isBoard, dispatch])

  if (!isBoard) return null

  const livePosts = [...playerPosts]
    .filter((post) => post.boardId === 'campus-notice' || !post.boardId)
    .sort((a, b) => b.createdAt - a.createdAt)

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!canPost) return
    const content = sanitizeNoticePost(draft)
    if (!content) return

    const network = getNetwork()
    if (!network) {
      setError(true)
      setStatus('Not connected to campus yet — wait a second and try again.')
      return
    }

    network.addNoticePost(content, 'campus-notice')
    setDraft('')
    setError(false)
    setStatus(`Pinned as ${playerName || 'Anonymous'} — everyone online can see it.`)
  }

  return (
    <Stage role="dialog" aria-label="Campus notice board">
      <TopBar>
        <TitleBlock>
          <Title>Campus Notice Board</Title>
          <Subtitle>Staff pins · campus buzz · your posts (synced live)</Subtitle>
        </TitleBlock>
        <CloseButton aria-label="close notice board" onClick={() => dispatch(closeBuilding())}>
          <CloseIcon />
        </CloseButton>
      </TopBar>

      <Cork>
        <CorkScroll>
          {staffNotices.map((notice, index) => (
            <Pin key={notice.id} $rot={(index % 2 === 0 ? -2 : 2) + (index % 3)} $tone="staff">
              <PinLabel>Staff</PinLabel>
              <PinTitle>{notice.title}</PinTitle>
              <PinBody>{notice.body}</PinBody>
            </Pin>
          ))}

          {campusBuzz.map((pin) => (
            <Pin key={pin.id} $rot={pin.rotation} $tone="buzz">
              <PinLabel>Campus buzz</PinLabel>
              <PinTitle>{pin.title}</PinTitle>
              <PinBody>{pin.body}</PinBody>
              <PinMeta>
                <span>{pin.author}</span>
                <span>pinned</span>
              </PinMeta>
            </Pin>
          ))}

          {livePosts.map((post, index) => (
            <Pin key={post.id} $rot={(index % 5) - 2} $tone="live">
              <PinLabel>Student pin</PinLabel>
              <PinBody>{post.content}</PinBody>
              <PinMeta>
                <span>{post.author || 'Anonymous'}</span>
                <span>{formatTime(post.createdAt)}</span>
              </PinMeta>
            </Pin>
          ))}
        </CorkScroll>

        <ComposerDock onSubmit={onSubmit}>
          <TextArea
            ref={textRef}
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value.slice(0, MAX_NOTICE_LENGTH))
              setStatus(null)
            }}
            onFocus={() => {
              const game = phaserGame.scene.keys.game as CampusScene | undefined
              game?.disableKeys()
            }}
            placeholder="Share campus news / a rumor / a tip for everyone…"
            maxLength={MAX_NOTICE_LENGTH}
            aria-label="Pin a campus note"
          />
          <Side>
            <CharCount>
              {draft.length}/{MAX_NOTICE_LENGTH}
            </CharCount>
            <PostButton type="submit" disabled={!canPost}>
              Pin it
            </PostButton>
            {status && <Status $error={error}>{status}</Status>}
          </Side>
        </ComposerDock>
      </Cork>
    </Stage>
  )
}
