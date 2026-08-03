import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import Fab from '@mui/material/Fab'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import CloseIcon from '@mui/icons-material/Close'
import LightbulbIcon from '@mui/icons-material/Lightbulb'

import { BackgroundMode } from '../../../types/BackgroundMode'
import { toggleBackgroundMode } from '../stores/UserStore'
import { useAppSelector, useAppDispatch } from '../hooks'

const Backdrop = styled.div`
  position: fixed;
  display: flex;
  gap: 10px;
  bottom: 16px;
  right: 16px;
  align-items: flex-end;

  .wrapper-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
`

const Wrapper = styled.div`
  position: relative;
  font-size: 16px;
  color: #eee;
  background: #222639;
  box-shadow: 0px 0px 5px #0000006f;
  border-radius: 16px;
  padding: 15px 35px 15px 15px;
  display: flex;
  flex-direction: column;
  align-items: center;

  .close {
    position: absolute;
    top: 15px;
    right: 15px;
  }

  .tip {
    margin-left: 12px;
  }
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
`

const Title = styled.h3`
  font-size: 24px;
  color: #eee;
  text-align: center;
`

const StyledFab = styled(Fab)<{ target?: string }>`
  &:hover {
    color: #33ac96;
  }
`

export default function HelperButtonGroup() {
  const [showControlGuide, setShowControlGuide] = useState(false)
  const backgroundMode = useAppSelector((state) => state.user.backgroundMode)
  const chatFocused = useAppSelector((state) => state.chat.focused)
  const dispatch = useAppDispatch()

  // "?" toggles the control guide, unless the player is typing in chat
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (chatFocused) return
      if (event.key === '?') {
        setShowControlGuide((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [chatFocused])

  return (
    <Backdrop>
      <div className="wrapper-group">
        {showControlGuide && (
          <Wrapper>
            <Title>Controls</Title>
            <IconButton className="close" onClick={() => setShowControlGuide(false)} size="small">
              <CloseIcon />
            </IconButton>
            <ul>
              <li>
                <strong>W, A, S, D or arrow keys</strong> to move
              </li>
              <li>
                <strong>E</strong> to enter a building, talk to an NPC, or sit on a bench
              </li>
              <li>
                <strong>Enter</strong> to open chat
              </li>
              <li>
                <strong>ESC</strong> to close chat / panels
              </li>
              <li>
                <strong>J</strong> to open your quest log
              </li>
              <li>
                <strong>?</strong> to toggle this control guide
              </li>
            </ul>
            <p className="tip">
              <LightbulbIcon />
              Walk onto a building doorway (look for the name label) and press E. Talk to Ayesha at
              the gate if you need a tip — then follow the hunt: Admin → Fee → Library → Science Lab
              → Canteen.
            </p>
          </Wrapper>
        )}
      </div>
      <ButtonGroup>
        <Tooltip title="Control Guide">
          <StyledFab size="small" onClick={() => setShowControlGuide(!showControlGuide)}>
            <HelpOutlineIcon />
          </StyledFab>
        </Tooltip>
        <Tooltip title="Switch Background Theme">
          <StyledFab size="small" onClick={() => dispatch(toggleBackgroundMode())}>
            {backgroundMode === BackgroundMode.DAY ? <DarkModeIcon /> : <LightModeIcon />}
          </StyledFab>
        </Tooltip>
      </ButtonGroup>
    </Backdrop>
  )
}
