import React from 'react'
import styled from 'styled-components'
import Button from '@mui/material/Button'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'

import { useAppDispatch, useAppSelector } from '../hooks'
import { setShowCompletionScreen } from '../stores/QuestStore'

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: #000000a0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 500;
`

const Panel = styled.div`
  width: 440px;
  max-width: 90vw;
  background: #123338;
  border: 2px solid #fb7185;
  border-radius: 16px;
  padding: 36px 32px;
  text-align: center;
  box-shadow: 0px 0px 24px #00000090;

  svg {
    font-size: 56px;
    color: #ffd54f;
    margin-bottom: 8px;
  }
`

const Title = styled.h2`
  margin: 0 0 12px;
  color: #fff;
  font-size: 24px;
`

const Reward = styled.p`
  margin: 0 0 24px;
  color: #c2c2c2;
  font-size: 15px;
  line-height: 1.5;
`

export default function CompletionScreen() {
  const dispatch = useAppDispatch()
  const showCompletionScreen = useAppSelector((state) => state.quest.showCompletionScreen)
  const quest = useAppSelector((state) => state.quest.quest)

  if (!showCompletionScreen) return null

  return (
    <Backdrop>
      <Panel>
        <EmojiEventsIcon />
        <Title>Orientation Complete!</Title>
        <Reward>{quest.reward}</Reward>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => dispatch(setShowCompletionScreen(false))}
        >
          Keep exploring
        </Button>
      </Panel>
    </Backdrop>
  )
}
