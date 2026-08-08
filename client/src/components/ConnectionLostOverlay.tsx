import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useAppSelector } from '../hooks'
import { surface, text, accent, font, radius, shadow, border } from '../theme'

const Screen = styled.div`
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: ${surface.scrim};
  backdrop-filter: blur(6px);
`

const Card = styled.div`
  width: 100%;
  max-width: 400px;
  padding: 28px 24px;
  border-radius: ${radius.lg};
  border: 1px solid ${border.mint};
  background: ${surface.raised};
  text-align: center;
  color: ${text.primary};
  box-shadow: ${shadow.panel};
  font-family: ${font.body};
`

const Title = styled.h2`
  margin: 0 0 10px;
  font-family: ${font.display};
  font-size: 22px;
  letter-spacing: 0.04em;
  color: ${accent.mint};
`

const Body = styled.p`
  margin: 0 0 8px;
  font-size: 14px;
  line-height: 1.5;
  color: ${text.muted};
`

const Reason = styled.p`
  margin: 0 0 20px;
  font-size: 11px;
  color: ${text.muted};
  opacity: 0.7;
  word-break: break-word;
`

const Button = styled.button`
  width: 100%;
  padding: 13px 16px;
  border: none;
  border-radius: ${radius.sm};
  background: ${accent.mint};
  color: ${text.onCoral};
  font-family: ${font.display};
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
`

const AUTO_REJOIN_AFTER = 5

export default function ConnectionLostOverlay() {
  const lost = useAppSelector((state) => state.connection.lost)
  const reason = useAppSelector((state) => state.connection.reason)
  const [countdown, setCountdown] = useState(AUTO_REJOIN_AFTER)

  const rejoin = () => window.location.reload()

  useEffect(() => {
    if (!lost) return
    setCountdown(AUTO_REJOIN_AFTER)
    const tick = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          window.clearInterval(tick)
          rejoin()
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => window.clearInterval(tick)
  }, [lost])

  if (!lost) return null

  return (
    <Screen role="alertdialog" aria-label="Connection lost">
      <Card>
        <Title>Connection lost</Title>
        <Body>Campus wifi dropped the session. Rejoining so your hunt stays in sync.</Body>
        {reason ? <Reason>{reason}</Reason> : null}
        <Button type="button" onClick={rejoin}>
          Rejoin now ({countdown}s)
        </Button>
      </Card>
    </Screen>
  )
}
