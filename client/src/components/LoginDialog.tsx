import React, { useState } from 'react'
import styled from 'styled-components'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Avatar from '@mui/material/Avatar'
import ArrowRightIcon from '@mui/icons-material/ArrowRight'

import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper'
import 'swiper/css'
import 'swiper/css/navigation'

import Adam from '../images/login/Adam_login.png'
import Ash from '../images/login/Ash_login.png'
import Lucy from '../images/login/Lucy_login.png'
import Nancy from '../images/login/Nancy_login.png'
import { useAppSelector, useAppDispatch } from '../hooks'
import { setLoggedIn } from '../stores/UserStore'
import { startQuestIfNeeded } from '../stores/QuestStore'
import { getAvatarString, getColorByString } from '../util'
import { sanitizeName, MAX_NAME_LENGTH } from '../utils/moderation'

import phaserGame from '../PhaserGame'
import CampusScene from '../scenes/CampusScene'
import { surface, text, accent, font, radius, shadow, border, cq } from '../theme'

const Wrapper = styled.form`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: ${surface.raised};
  border-radius: ${radius.lg};
  padding: 40px 56px;
  box-shadow: ${shadow.panel};
  border: 1px solid ${border.strong};
  font-family: ${font.body};
`

const Title = styled.p`
  margin: 0 0 8px;
  font-family: ${font.display};
  font-size: 28px;
  color: ${accent.butter};
  text-align: center;
`

const RoomName = styled.div`
  max-width: 500px;
  max-height: 120px;
  overflow-wrap: anywhere;
  overflow-y: auto;
  display: flex;
  gap: 10px;
  justify-content: center;
  align-items: center;

  h3 {
    font-family: ${font.display};
    font-size: 22px;
    color: ${text.primary};
  }
`

const RoomDescription = styled.div`
  max-width: 500px;
  max-height: 150px;
  overflow-wrap: anywhere;
  overflow-y: auto;
  font-size: 15px;
  color: ${text.muted};
  display: flex;
  justify-content: center;
`

const SubTitle = styled.h3`
  width: 160px;
  font-size: 14px;
  font-family: ${font.body};
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${accent.coral};
  text-align: center;
`

const Content = styled.div`
  display: flex;
  margin: 36px 0;
`

const Left = styled.div`
  margin-right: 48px;

  --swiper-navigation-size: 24px;
  --swiper-navigation-color: ${cq.butter};

  .swiper {
    width: 160px;
    height: 220px;
    border-radius: ${radius.md};
    overflow: hidden;
    border: 2px solid ${border.mint};
  }

  .swiper-slide {
    width: 160px;
    height: 220px;
    background: ${cq.panelLit};
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .swiper-slide img {
    display: block;
    width: 95px;
    height: 136px;
    object-fit: contain;
  }
`

const Right = styled.div`
  width: 300px;
`

const Bottom = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`

const avatars = [
  { name: 'adam', img: Adam },
  { name: 'ash', img: Ash },
  { name: 'lucy', img: Lucy },
  { name: 'nancy', img: Nancy },
]

// shuffle the avatars array
for (let i = avatars.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1))
  ;[avatars[i], avatars[j]] = [avatars[j], avatars[i]]
}

export default function LoginDialog() {
  const authName = useAppSelector((state) => state.auth.user?.displayName || '')
  const [name, setName] = useState<string>(authName)
  const [avatarIndex, setAvatarIndex] = useState<number>(0)
  const [nameFieldEmpty, setNameFieldEmpty] = useState<boolean>(false)
  const dispatch = useAppDispatch()
  const roomJoined = useAppSelector((state) => state.room.roomJoined)
  const roomName = useAppSelector((state) => state.room.roomName)
  const roomDescription = useAppSelector((state) => state.room.roomDescription)
  const game = phaserGame.scene.keys.game as CampusScene

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const cleanName = sanitizeName(name)
    if (cleanName === '') {
      setNameFieldEmpty(true)
    } else if (roomJoined) {
      console.log('Join! Name:', cleanName, 'Avatar:', avatars[avatarIndex].name)
      game.registerKeys()
      game.myPlayer.setPlayerName(cleanName)
      game.myPlayer.setPlayerTexture(avatars[avatarIndex].name)
      game.network.readyToConnect()
      dispatch(setLoggedIn(true))
      // Kick off orientation hunt so the objective tracker is visible immediately
      startQuestIfNeeded(dispatch)
    }
  }

  return (
    <Wrapper onSubmit={handleSubmit}>
      <Title>Step onto campus</Title>
      <RoomName>
        <Avatar style={{ background: getColorByString(roomName) }}>
          {getAvatarString(roomName)}
        </Avatar>
        <h3>{roomName}</h3>
      </RoomName>
      <RoomDescription>
        <ArrowRightIcon sx={{ color: '#fb7185' }} /> {roomDescription}
      </RoomDescription>
      <Content>
        <Left>
          <SubTitle>Pick a look</SubTitle>
          <Swiper
            modules={[Navigation]}
            navigation
            spaceBetween={0}
            slidesPerView={1}
            onSlideChange={(swiper) => {
              setAvatarIndex(swiper.activeIndex)
            }}
          >
            {avatars.map((avatar) => (
              <SwiperSlide key={avatar.name}>
                <img src={avatar.img} alt={avatar.name} />
              </SwiperSlide>
            ))}
          </Swiper>
        </Left>
        <Right>
          <TextField
            autoFocus
            fullWidth
            label="Display name"
            variant="outlined"
            color="primary"
            value={name}
            inputProps={{ maxLength: MAX_NAME_LENGTH }}
            error={nameFieldEmpty}
            helperText={nameFieldEmpty && 'Name is required'}
            onChange={(e) => {
              setName(e.target.value)
              setNameFieldEmpty(false)
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#e0f2f1',
                fontFamily: 'Manrope, sans-serif',
                '& fieldset': { borderColor: '#fb718555' },
                '&:hover fieldset': { borderColor: '#fb7185' },
              },
              '& .MuiInputLabel-root': { color: '#94b0b4' },
            }}
          />
        </Right>
      </Content>
      <Bottom>
        <Button
          variant="contained"
          color="primary"
          size="large"
          type="submit"
          sx={{
            px: 4,
            py: 1.2,
            fontFamily: 'Fraunces, serif',
            fontWeight: 700,
            fontSize: 16,
            borderRadius: '14px',
            textTransform: 'none',
          }}
        >
          Enter Gudwal
        </Button>
      </Bottom>
    </Wrapper>
  )
}
