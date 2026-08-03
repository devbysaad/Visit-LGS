import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'

import { useAppDispatch, useAppSelector } from '../hooks'
import { closeBuilding } from '../stores/BuildingStore'
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
  max-width: 90vw;
  max-height: 85vh;
  overflow-y: auto;
  background: #222639;
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
  border: 1px solid #3ad4ce55;
`

const Photo = styled.div<{ hasImage: boolean }>`
  width: 100%;
  height: 180px;
  border-radius: 16px 16px 0 0;
  background: linear-gradient(160deg, #2f3251 0%, #1a1d2b 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

const PhotoPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #c9a227;
  padding: 16px;
  text-align: center;

  svg {
    font-size: 36px;
  }

  span {
    font-size: 13px;
    color: #9aa3b8;
    max-width: 260px;
    line-height: 1.4;
  }
`

const Content = styled.div`
  padding: 24px 28px 28px;
  position: relative;
`

const CloseButton = styled(IconButton)`
  position: absolute !important;
  top: 12px;
  right: 12px;
  color: #eee !important;
`

const TipBanner = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 16px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #c9a22722;
  border: 1px solid #c9a22766;
  color: #f0e2a8;
  font-size: 13px;
  line-height: 1.4;

  svg {
    color: #c9a227;
    font-size: 18px;
    margin-top: 1px;
    flex-shrink: 0;
  }
`

const Name = styled.h2`
  margin: 0 0 4px;
  color: #eef1f6;
  font-size: 22px;
`

const Tagline = styled.p`
  margin: 0 0 16px;
  color: #33ac96;
  font-size: 14px;
  font-weight: 600;
`

const Description = styled.p`
  margin: 0 0 20px;
  color: #c2c2c2;
  font-size: 15px;
  line-height: 1.5;
`

const WhoToAsk = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #eee;
  font-size: 14px;
  padding-top: 12px;
  border-top: 1px solid #ffffff1a;

  svg {
    color: #33ac96;
    font-size: 18px;
  }
`

export default function BuildingModal() {
  const dispatch = useAppDispatch()
  const modalOpen = useAppSelector((state) => state.building.modalOpen)
  const selectedBuildingId = useAppSelector((state) => state.building.selectedBuildingId)
  const [photoFailed, setPhotoFailed] = useState(false)

  const building = selectedBuildingId ? getBuildingById(selectedBuildingId) : undefined

  useEffect(() => {
    setPhotoFailed(false)
  }, [selectedBuildingId])

  useEffect(() => {
    if (!modalOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        dispatch(closeBuilding())
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [modalOpen, dispatch])

  if (!modalOpen || !building) return null

  const photoSrc = building.photo ? `/assets/images/buildings/${building.photo}` : undefined
  const showImage = Boolean(photoSrc) && !photoFailed
  const isPlaceholderCopy = !showImage

  return (
    <Backdrop onClick={() => dispatch(closeBuilding())}>
      <Panel onClick={(event) => event.stopPropagation()}>
        <Photo hasImage={showImage}>
          {showImage ? (
            <img src={photoSrc} alt={building.name} onError={() => setPhotoFailed(true)} />
          ) : (
            <PhotoPlaceholder>
              <WarningAmberIcon />
              <span>Campus photo coming soon — this tip is still useful for orientation.</span>
            </PhotoPlaceholder>
          )}
        </Photo>
        <Content>
          <CloseButton aria-label="close" onClick={() => dispatch(closeBuilding())} size="small">
            <CloseIcon />
          </CloseButton>
          {isPlaceholderCopy && (
            <TipBanner>
              <InfoOutlinedIcon />
              <span>
                Orientation tip (placeholder). Real Gudwal details can replace this anytime in
                content files — nothing is broken.
              </span>
            </TipBanner>
          )}
          <Name>{building.name}</Name>
          <Tagline>{building.tagline}</Tagline>
          <Description>{building.description}</Description>
          {building.whoToAsk && (
            <WhoToAsk>
              <PersonOutlineIcon />
              <span>Tip — ask: {building.whoToAsk}</span>
            </WhoToAsk>
          )}
        </Content>
      </Panel>
    </Backdrop>
  )
}
