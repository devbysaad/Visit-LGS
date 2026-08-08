import React from 'react'
import styled from 'styled-components'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import ArrowRightIcon from '@mui/icons-material/ArrowRight'

import { useAppDispatch, useAppSelector } from '../hooks'
import { setQuestLogOpen } from '../stores/QuestStore'

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: #00000080;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
`

const Panel = styled.div`
  width: 420px;
  max-width: 90vw;
  max-height: 80vh;
  overflow-y: auto;
  background: #123338;
  border-radius: 16px;
  padding: 24px 28px;
  position: relative;
  box-shadow: 0px 0px 20px #00000090;
  border: 1px solid #fb718533;
`

const CloseButton = styled(IconButton)`
  position: absolute !important;
  top: 12px;
  right: 12px;
  color: #eee !important;
`

const Title = styled.h2`
  margin: 0 0 4px;
  color: #fff;
  font-size: 20px;
`

const Intro = styled.p`
  margin: 0 0 20px;
  color: #c2c2c2;
  font-size: 14px;
  line-height: 1.5;
`

const StepList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const StepItem = styled.li<{ current: boolean; done: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: ${({ current }) => (current ? '#fb718522' : 'transparent')};
  color: ${({ done }) => (done ? '#7c7c7c' : '#eee')};
  text-decoration: ${({ done }) => (done ? 'line-through' : 'none')};
  font-size: 14px;

  svg {
    flex-shrink: 0;
    color: ${({ done }) => (done ? '#fb7185' : '#666')};
  }
`

const Footer = styled.div`
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #ffffff1a;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #fb7185;
  font-size: 13px;

  svg {
    font-size: 18px;
  }
`

export default function QuestLog() {
  const dispatch = useAppDispatch()
  const questLogOpen = useAppSelector((state) => state.quest.questLogOpen)
  const quest = useAppSelector((state) => state.quest.quest)
  const currentStepIndex = useAppSelector((state) => state.quest.currentStepIndex)
  const started = useAppSelector((state) => state.quest.started)

  if (!questLogOpen) return null

  return (
    <Backdrop onClick={() => dispatch(setQuestLogOpen(false))}>
      <Panel onClick={(event) => event.stopPropagation()}>
        <CloseButton
          aria-label="close quest log"
          size="small"
          onClick={() => dispatch(setQuestLogOpen(false))}
        >
          <CloseIcon />
        </CloseButton>
        <Title>{quest.id === 'orientation-hunt-v1' ? 'Orientation Hunt' : quest.id}</Title>
        <Intro>{started ? quest.intro : `${quest.intro} Talk to a senior student to begin.`}</Intro>
        <StepList>
          {quest.steps.map((step, index) => {
            const done = index < currentStepIndex
            const current = index === currentStepIndex
            return (
              <StepItem key={step.id} current={current} done={done}>
                {done ? <CheckCircleIcon fontSize="small" /> : <RadioButtonUncheckedIcon fontSize="small" />}
                <span>{step.objective}</span>
              </StepItem>
            )
          })}
        </StepList>
        {currentStepIndex >= quest.steps.length && (
          <Footer>
            <ArrowRightIcon />
            {quest.reward}
          </Footer>
        )}
      </Panel>
    </Backdrop>
  )
}
