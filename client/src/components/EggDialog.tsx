import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import { useAppDispatch, useAppSelector } from '../hooks'
import { closeEggDialog } from '../stores/EggStore'
import phaserGame from '../PhaserGame'
import CampusScene from '../scenes/CampusScene'
import { surface, text, accent, font, radius, shadow, border } from '../theme'

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  background: ${surface.scrim};
  z-index: 500;
  padding: 24px;
`

const Card = styled.div`
  width: 100%;
  max-width: 480px;
  background: ${surface.raised};
  border-radius: ${radius.lg};
  padding: 22px 24px 20px;
  color: ${text.primary};
  font-family: ${font.body};
  position: relative;
  box-shadow: ${shadow.panel};
  border-top: 3px solid ${accent.mint};
`

const Kicker = styled.div`
  font-family: ${font.display};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${accent.mint};
  margin-bottom: 10px;
`

const Prompt = styled.h3`
  margin: 0 0 12px;
  font-family: ${font.display};
  font-size: 20px;
  line-height: 1.35;
`

const Hint = styled.p`
  margin: 0 0 16px;
  font-size: 13px;
  line-height: 1.5;
  color: ${text.muted};
  font-style: italic;
`

const Row = styled.form`
  display: flex;
  gap: 8px;
`

const Input = styled.input`
  flex: 1;
  background: ${surface.alt};
  border: 1px solid ${border.subtle};
  border-radius: ${radius.sm};
  padding: 10px 12px;
  color: ${text.primary};
  font-size: 15px;
  font-family: ${font.body};
  outline: none;
  &:focus {
    border-color: ${accent.mint};
  }
`

const Submit = styled.button`
  background: ${accent.mint};
  color: ${text.onCoral};
  border: 0;
  border-radius: ${radius.sm};
  padding: 10px 18px;
  font-weight: 700;
  font-family: ${font.display};
  cursor: pointer;
  &:disabled {
    opacity: 0.45;
  }
`

const Verdict = styled.div<{ $ok: boolean }>`
  margin-top: 14px;
  font-size: 14px;
  font-weight: 600;
  color: ${(p) => (p.$ok ? accent.mintHot : accent.coral)};
`

const Reveal = styled.div`
  margin-top: 14px;
  padding: 14px 16px;
  background: ${surface.alt};
  border-radius: ${radius.md};
  border: 1px solid ${border.mint};
  font-size: 14px;
  line-height: 1.55;
`

const First = styled.div`
  margin-top: 12px;
  padding: 10px 14px;
  background: rgba(51, 172, 150, 0.15);
  border-radius: ${radius.md};
  color: ${accent.mint};
  font-weight: 700;
  font-family: ${font.display};
`

const Meta = styled.div`
  margin-top: 14px;
  font-size: 12px;
  color: ${text.muted};
`

export default function EggDialog() {
  const dispatch = useAppDispatch()
  const open = useAppSelector((s) => s.egg.dialogOpen)
  const prompt = useAppSelector((s) => s.egg.prompt)
  const hint = useAppSelector((s) => s.egg.hint)
  const eggId = useAppSelector((s) => s.egg.eggId)
  const verdict = useAppSelector((s) => s.egg.verdict)
  const attemptsLeft = useAppSelector((s) => s.egg.attemptsLeft)
  const reveal = useAppSelector((s) => s.egg.reveal)
  const wasFirst = useAppSelector((s) => s.egg.wasFirst)
  const solvedBy = useAppSelector((s) => s.egg.solvedBy)
  const [guess, setGuess] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setGuess('')
    const t = window.setTimeout(() => inputRef.current?.focus(), 40)
    return () => window.clearTimeout(t)
  }, [open, eggId])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dispatch(closeEggDialog())
      e.stopPropagation()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open, dispatch])

  if (!open || !eggId) return null

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!guess.trim() || verdict === 'correct' || verdict === 'locked') return
    const game = phaserGame.scene.keys.game as CampusScene | undefined
    game?.network.answerEgg(eggId, guess.trim())
  }

  return (
    <Backdrop>
      <Card>
        <IconButton
          aria-label="close"
          onClick={() => dispatch(closeEggDialog())}
          size="small"
          sx={{ position: 'absolute', top: 8, right: 8, color: '#eee' }}
        >
          <CloseIcon />
        </IconButton>
        <Kicker>Orientation clue</Kicker>
        <Prompt>{prompt}</Prompt>
        <Hint>{hint}</Hint>
        {verdict !== 'correct' && (
          <Row onSubmit={onSubmit}>
            <Input
              ref={inputRef}
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Your answer…"
              disabled={verdict === 'locked'}
            />
            <Submit type="submit" disabled={!guess.trim() || verdict === 'locked'}>
              Guess
            </Submit>
          </Row>
        )}
        {verdict === 'wrong' && <Verdict $ok={false}>Not quite — {attemptsLeft} tries left</Verdict>}
        {verdict === 'throttled' && <Verdict $ok={false}>Slow down a second…</Verdict>}
        {verdict === 'locked' && <Verdict $ok={false}>This clue is locked for now</Verdict>}
        {verdict === 'correct' && <Verdict $ok>Correct!</Verdict>}
        {reveal && <Reveal>{reveal}</Reveal>}
        {wasFirst && <First>First finder on this server!</First>}
        <Meta>{solvedBy} player(s) have cracked this clue</Meta>
      </Card>
    </Backdrop>
  )
}
