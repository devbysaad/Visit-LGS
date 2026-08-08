import { useEffect } from 'react'
import styled from 'styled-components'
import { useAppDispatch, useAppSelector } from '../hooks'
import { clearCheckpoint } from '../stores/CheckpointStore'
import { accent, font, surface, text, radius } from '../theme'

const GREETINGS: Record<string, string> = {
  'spawn_gate': 'Welcome to Gudwal campus — follow the path toward Admin & Library.',
  main: 'Main gate checkpoint — stay alert for vehicles at pickup.',
}

const Banner = styled.div`
  position: fixed;
  bottom: 96px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 440;
  max-width: min(420px, 90vw);
  padding: 12px 16px;
  border-radius: ${radius.md};
  background: ${surface.raised};
  border-left: 4px solid ${accent.coral};
  color: ${text.primary};
  font-family: ${font.body};
  font-size: 13px;
  line-height: 1.4;
`

const Label = styled.div`
  font-family: ${font.display};
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${accent.coral};
  margin-bottom: 4px;
`

export default function CheckpointBanner() {
  const dispatch = useAppDispatch()
  const active = useAppSelector((s) => s.checkpoint.active)

  useEffect(() => {
    if (!active) return
    const t = window.setTimeout(() => dispatch(clearCheckpoint()), 4500)
    return () => window.clearTimeout(t)
  }, [active, dispatch])

  if (!active) return null
  const message = GREETINGS[active] ?? `Checkpoint: ${active}`

  return (
    <Banner>
      <Label>Campus gate</Label>
      {message}
    </Banner>
  )
}
