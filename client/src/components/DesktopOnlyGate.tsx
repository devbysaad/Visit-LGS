import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows'

const MIN_DESKTOP_WIDTH = 768

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 700;
  background: #14161f;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`

const Card = styled.div`
  max-width: 420px;
  text-align: center;
  color: #eee;

  svg {
    font-size: 56px;
    color: #fb7185;
    margin-bottom: 16px;
  }
`

const Title = styled.h1`
  font-size: 22px;
  margin: 0 0 12px;
`

const Body = styled.p`
  font-size: 15px;
  line-height: 1.5;
  color: #c2c2c2;
  margin: 0;
`

function isUnsupportedViewport(): boolean {
  if (typeof window === 'undefined') return false
  const coarsePointer =
    typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches
  return window.innerWidth < MIN_DESKTOP_WIDTH || (coarsePointer && window.innerWidth < 1024)
}

/**
 * CampusQuest is desktop-only in v1 (see AGENTS.md non-negotiables) — no half-ported
 * touch controls. Wraps the whole app and shows a full-screen gate instead of a broken
 * experience on phones/small tablets.
 */
export default function DesktopOnlyGate({ children }: { children: React.ReactNode }) {
  const [unsupported, setUnsupported] = useState(isUnsupportedViewport)

  useEffect(() => {
    const handleResize = () => setUnsupported(isUnsupportedViewport())
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (!unsupported) return <>{children}</>

  return (
    <Backdrop>
      <Card>
        <DesktopWindowsIcon />
        <Title>Desktop required</Title>
        <Body>
          CampusQuest is built for keyboard and mouse on a larger screen. Please open this link
          on a laptop or desktop computer to explore the campus.
        </Body>
      </Card>
    </Backdrop>
  )
}
