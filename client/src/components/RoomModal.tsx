import React, { useEffect } from 'react'
import styled from 'styled-components'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'

import { useAppDispatch, useAppSelector } from '../hooks'
import { closeRoom } from '../stores/RoomInfoStore'
import { getRoomById } from '../content/rooms'
import { getBuildingById } from '../content/buildings'

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(14, 16, 28, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 410;
`

const Panel = styled.div`
  width: 420px;
  max-width: 92vw;
  background: #123338;
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
  border: 1px solid #fde68a55;
  padding: 24px 28px 28px;
  position: relative;
`

const CloseButton = styled(IconButton)`
  position: absolute !important;
  top: 12px;
  right: 12px;
  color: #eee !important;
`

const Building = styled.p`
  margin: 0 0 6px;
  color: #9aa3b8;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  display: flex;
  align-items: center;
  gap: 6px;

  svg {
    color: #fb7185;
    font-size: 16px;
  }
`

const Name = styled.h2`
  margin: 0 0 4px;
  color: #eef1f6;
  font-size: 22px;
  padding-right: 36px;
`

const Tagline = styled.p`
  margin: 0 0 16px;
  color: #fb7185;
  font-size: 14px;
  font-weight: 600;
`

const Description = styled.p`
  margin: 0;
  color: #c2c2c2;
  font-size: 15px;
  line-height: 1.5;
`

const Hint = styled.p`
  margin: 16px 0 0;
  color: #9aa3b8;
  font-size: 12px;
`

export default function RoomModal() {
  const dispatch = useAppDispatch()
  const modalOpen = useAppSelector((state) => state.roomInfo.modalOpen)
  const selectedRoomId = useAppSelector((state) => state.roomInfo.selectedRoomId)

  const room = selectedRoomId ? getRoomById(selectedRoomId) : undefined
  const building = room ? getBuildingById(room.buildingId) : undefined

  useEffect(() => {
    if (!modalOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dispatch(closeRoom())
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [modalOpen, dispatch])

  if (!modalOpen || !room) return null

  return (
    <Backdrop onClick={() => dispatch(closeRoom())}>
      <Panel onClick={(event) => event.stopPropagation()}>
        <CloseButton aria-label="close" onClick={() => dispatch(closeRoom())} size="small">
          <CloseIcon />
        </CloseButton>
        <Building>
          <MeetingRoomIcon />
          {building?.name ?? room.buildingId}
        </Building>
        <Name>{room.name}</Name>
        <Tagline>{room.tagline}</Tagline>
        <Description>{room.description}</Description>
        <Hint>Walk between rooms inside the building · Esc closes</Hint>
      </Panel>
    </Backdrop>
  )
}
