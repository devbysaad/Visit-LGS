import { useEffect } from 'react'
import styled from 'styled-components'
import { useAppDispatch, useAppSelector } from '../hooks'
import { clearAnnouncement } from '../stores/EggStore'
import { accent, font, surface, text, radius } from '../theme'

const Banner = styled.div`
  position: fixed;
  top: 72px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 450;
  max-width: 90vw;
  padding: 10px 18px;
  border-radius: ${radius.md};
  background: ${surface.raised};
  border: 1px solid ${accent.mint};
  color: ${text.primary};
  font-family: ${font.body};
  font-size: 13px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
`

export default function EggBanner() {
  const dispatch = useAppDispatch()
  const announcement = useAppSelector((s) => s.egg.announcement)

  useEffect(() => {
    if (!announcement) return
    const t = window.setTimeout(() => dispatch(clearAnnouncement()), 4200)
    return () => window.clearTimeout(t)
  }, [announcement, dispatch])

  if (!announcement) return null
  return <Banner>{announcement}</Banner>
}
