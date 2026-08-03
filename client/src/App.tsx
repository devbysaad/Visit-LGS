import React from 'react'
import styled from 'styled-components'

import { useAppSelector } from './hooks'

import AuthScreen from './components/AuthScreen'
import LoginDialog from './components/LoginDialog'
import Chat from './components/Chat'
import HelperButtonGroup from './components/HelperButtonGroup'
import BuildingModal from './components/BuildingModal'
import NpcDialogue from './components/NpcDialogue'
import ObjectiveTracker from './components/ObjectiveTracker'
import QuestLog from './components/QuestLog'
import Toast from './components/Toast'
import CompletionScreen from './components/CompletionScreen'
import ConnectionError from './components/ConnectionError'

const Backdrop = styled.div`
  position: absolute;
  height: 100%;
  width: 100%;
`

function App() {
  const authenticated = useAppSelector((state) => state.auth.authenticated)
  const loggedIn = useAppSelector((state) => state.user.loggedIn)
  const roomJoined = useAppSelector((state) => state.room.roomJoined)

  let ui: JSX.Element | null = null
  if (!authenticated) {
    ui = null // AuthScreen is always mounted below until signed in
  } else if (loggedIn) {
    ui = <Chat />
  } else if (roomJoined) {
    ui = <LoginDialog />
  }

  return (
    <Backdrop>
      <AuthScreen />
      <ConnectionError />
      {ui}
      {authenticated && loggedIn && (
        <>
          <ObjectiveTracker />
          <BuildingModal />
          <NpcDialogue />
          <QuestLog />
          <Toast />
          <CompletionScreen />
        </>
      )}
      {authenticated && <HelperButtonGroup />}
    </Backdrop>
  )
}

export default App
