import React from 'react'
import styled from 'styled-components'
import Button from '@mui/material/Button'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import phaserGame from '../PhaserGame'
import Bootstrap from '../scenes/Bootstrap'
import { useAppSelector } from '../hooks'

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 650;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(14, 16, 28, 0.72);
`

const Panel = styled.div`
  width: min(420px, 92vw);
  background: #123338;
  border: 1px solid #c9a22788;
  border-radius: 12px;
  padding: 28px 24px;
  color: #eef1f6;
  text-align: center;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);

  .icon {
    color: #c9a227;
    font-size: 36px;
    margin-bottom: 8px;
  }

  h2 {
    margin: 0 0 12px;
    font-size: 1.25rem;
    color: #f0e2a8;
  }

  p {
    margin: 0 0 8px;
    color: #9aa3b8;
    font-size: 0.95rem;
    line-height: 1.5;
  }

  code {
    color: #45cbb0;
    font-size: 0.85rem;
  }

  .actions {
    margin-top: 20px;
    display: flex;
    justify-content: center;
    gap: 12px;
  }

  button {
    background: #c9a227 !important;
    color: #1a1508 !important;
    font-weight: 700;
  }
`

/** Soft warning when the Colyseus server is unreachable — not a hard error state. */
export default function ConnectionError() {
  const joinError = useAppSelector((state) => state.room.joinError)
  const joining = useAppSelector((state) => state.room.joining)
  const roomJoined = useAppSelector((state) => state.room.roomJoined)

  if (!joinError || roomJoined) return null

  const retry = () => {
    const bootstrap = phaserGame.scene.keys.bootstrap as Bootstrap | undefined
    bootstrap?.network?.retryJoin()
  }

  return (
    <Backdrop>
      <Panel>
        <WarningAmberIcon className="icon" />
        <h2>Campus server offline</h2>
        <p>This is a temporary connection warning — your game files are fine.</p>
        <p>{joinError}</p>
        <p>
          Start the server with <code>yarn start</code> or <code>yarn dev</code>, then retry.
        </p>
        <div className="actions">
          <Button variant="contained" onClick={retry} disabled={joining}>
            {joining ? 'Connecting…' : 'Retry connection'}
          </Button>
        </div>
      </Panel>
    </Backdrop>
  )
}
