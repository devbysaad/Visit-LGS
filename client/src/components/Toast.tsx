import React, { useEffect } from 'react'
import styled from 'styled-components'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'

import { useAppDispatch, useAppSelector } from '../hooks'
import { clearToast } from '../stores/QuestStore'

const TOAST_DURATION_MS = 4500

const Wrapper = styled.div`
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 400;
  background: #123338;
  border: 1px solid #fb7185;
  border-radius: 10px;
  padding: 10px 18px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0px 4px 12px #00000060;
  max-width: 400px;
  animation: toast-in 0.2s ease-out;

  @keyframes toast-in {
    from {
      opacity: 0;
      transform: translate(-50%, -8px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }

  svg {
    color: #fb7185;
    flex-shrink: 0;
  }
`

const Message = styled.span`
  color: #eee;
  font-size: 14px;
`

export default function Toast() {
  const dispatch = useAppDispatch()
  const toastMessage = useAppSelector((state) => state.quest.toastMessage)

  useEffect(() => {
    if (!toastMessage) return
    const timer = window.setTimeout(() => dispatch(clearToast()), TOAST_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [toastMessage, dispatch])

  if (!toastMessage) return null

  return (
    <Wrapper>
      <CheckCircleOutlineIcon fontSize="small" />
      <Message>{toastMessage}</Message>
    </Wrapper>
  )
}
