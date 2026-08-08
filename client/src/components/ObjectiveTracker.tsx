import React from 'react'
import styled from 'styled-components'
import FlagIcon from '@mui/icons-material/Flag'

import { useAppSelector } from '../hooks'

const Wrapper = styled.div`
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 100;
  background: #123338e6;
  border: 1px solid #fb718555;
  border-radius: 12px;
  padding: 10px 16px;
  max-width: 320px;
  box-shadow: 0px 0px 8px #00000060;
  display: flex;
  align-items: flex-start;
  gap: 8px;

  svg {
    color: #fb7185;
    font-size: 18px;
    margin-top: 2px;
    flex-shrink: 0;
  }
`

const Text = styled.div`
  color: #eee;
  font-size: 13px;
  line-height: 1.4;

  strong {
    display: block;
    color: #fb7185;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
  }
`

export default function ObjectiveTracker() {
  const started = useAppSelector((state) => state.quest.started)
  const currentStepIndex = useAppSelector((state) => state.quest.currentStepIndex)
  const quest = useAppSelector((state) => state.quest.quest)

  if (!started) return null

  const currentStep = quest.steps[currentStepIndex]
  const isComplete = !currentStep

  return (
    <Wrapper>
      <FlagIcon />
      <Text>
        <strong>Objective</strong>
        {isComplete ? 'Orientation hunt complete! Press J for your log.' : currentStep.objective}
      </Text>
    </Wrapper>
  )
}
