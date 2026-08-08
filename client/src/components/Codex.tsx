import styled from 'styled-components'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import { useAppDispatch, useAppSelector } from '../hooks'
import { closeCodex } from '../stores/EggStore'
import { surface, text, accent, font, radius, shadow, border } from '../theme'

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 510;
  display: grid;
  place-items: center;
  background: ${surface.scrim};
  padding: 24px;
`

const Panel = styled.div`
  width: min(520px, 94vw);
  max-height: 80vh;
  overflow: auto;
  background: ${surface.raised};
  border-radius: ${radius.lg};
  border: 1px solid ${border.mint};
  box-shadow: ${shadow.panel};
  padding: 22px 24px;
  font-family: ${font.body};
  color: ${text.primary};
  position: relative;
`

const Title = styled.h2`
  margin: 0 0 6px;
  font-family: ${font.display};
  color: ${accent.mint};
`

const Sub = styled.p`
  margin: 0 0 16px;
  color: ${text.muted};
  font-size: 13px;
`

const Card = styled.article`
  padding: 12px 14px;
  margin-bottom: 10px;
  border-radius: ${radius.md};
  background: ${surface.alt};
  border: 1px solid ${border.subtle};
`

const Meta = styled.div`
  font-size: 11px;
  color: ${accent.mint};
  font-family: ${font.display};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 6px;
`

export default function Codex() {
  const dispatch = useAppDispatch()
  const open = useAppSelector((s) => s.egg.codexOpen)
  const found = useAppSelector((s) => s.egg.found)

  if (!open) return null

  return (
    <Backdrop onClick={() => dispatch(closeCodex())}>
      <Panel onClick={(e) => e.stopPropagation()}>
        <IconButton
          aria-label="close"
          onClick={() => dispatch(closeCodex())}
          size="small"
          sx={{ position: 'absolute', top: 10, right: 10, color: '#eee' }}
        >
          <CloseIcon />
        </IconButton>
        <Title>Clue Codex</Title>
        <Sub>
          {found.length} orientation clue{found.length === 1 ? '' : 's'} unlocked. Answers stay on
          the server — this is only what you earned.
        </Sub>
        {found.length === 0 ? (
          <Sub>Find glowing mint markers on campus and Press E.</Sub>
        ) : (
          found.map((egg) => (
            <Card key={egg.id}>
              <Meta>
                {egg.kind}
                {egg.first ? ' · first finder' : ''}
              </Meta>
              <div>{egg.reveal}</div>
            </Card>
          ))
        )}
      </Panel>
    </Backdrop>
  )
}
