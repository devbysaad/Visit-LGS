import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import phaserGame from '../PhaserGame'
import CampusScene from '../scenes/CampusScene'

export const roomInfoSlice = createSlice({
  name: 'roomInfo',
  initialState: {
    selectedRoomId: null as string | null,
    modalOpen: false,
  },
  reducers: {
    openRoom: (state, action: PayloadAction<string>) => {
      state.selectedRoomId = action.payload
      state.modalOpen = true
      const game = phaserGame.scene.keys.game as CampusScene | undefined
      game?.disableKeys()
    },
    closeRoom: (state) => {
      state.modalOpen = false
      const game = phaserGame.scene.keys.game as CampusScene | undefined
      game?.enableKeys()
    },
  },
})

export const { openRoom, closeRoom } = roomInfoSlice.actions

export default roomInfoSlice.reducer
