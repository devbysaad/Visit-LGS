import React, { useEffect } from 'react'
import styled from 'styled-components'

import { useAppDispatch, useAppSelector } from '../hooks'
import { advanceDialogue, closeNpc } from '../stores/NpcStore'
import { getNpcById } from '../content/npcs'

const Wrapper = styled.div`
  position: fixed;
  left: 50%;
  bottom: 80px;
  transform: translateX(-50%);
  width: 520px;
  max-width: 90vw;
  background: #123338;
  border: 2px solid #fb7185;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0px 0px 15px #00000090;
  z-index: 250;
  cursor: pointer;
`

const Name = styled.div`
  color: #fb7185;
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 6px;
`

const Line = styled.p`
  color: #eee;
  font-size: 16px;
  margin: 0 0 10px;
  line-height: 1.4;
`

const Hint = styled.div`
  color: #888;
  font-size: 12px;
  text-align: right;
`

export default function NpcDialogue() {
  const dispatch = useAppDispatch()
  const dialogueOpen = useAppSelector((state) => state.npc.dialogueOpen)
  const selectedNpcId = useAppSelector((state) => state.npc.selectedNpcId)
  const dialogueIndex = useAppSelector((state) => state.npc.dialogueIndex)

  const npc = selectedNpcId ? getNpcById(selectedNpcId) : undefined
  const isLastLine = npc ? dialogueIndex >= npc.dialogue.length - 1 : true

  const advanceOrClose = () => {
    if (isLastLine) {
      dispatch(closeNpc())
    } else {
      dispatch(advanceDialogue())
    }
  }

  useEffect(() => {
    if (!dialogueOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        dispatch(closeNpc())
        return
      }
      if (event.key === 'e' || event.key === 'E' || event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        advanceOrClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogueOpen, dialogueIndex, selectedNpcId])

  if (!dialogueOpen || !npc) return null

  return (
    <Wrapper onClick={advanceOrClose}>
      <Name>{npc.name}</Name>
      <Line>{npc.dialogue[dialogueIndex]}</Line>
      <Hint>{isLastLine ? 'Press E to close' : 'Press E to continue'}</Hint>
    </Wrapper>
  )
}
