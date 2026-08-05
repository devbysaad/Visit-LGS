import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import phaserGame from '../PhaserGame'
import CampusScene from '../scenes/CampusScene'

export const boardSlice = createSlice({
  name: 'board',
  initialState: {
    selectedBoardId: null as string | null,
    modalOpen: false,
  },
  reducers: {
    openBoard: (state, action: PayloadAction<string>) => {
      state.selectedBoardId = action.payload
      state.modalOpen = true
      const game = phaserGame.scene.keys.game as CampusScene | undefined
      game?.disableKeys()
    },
    closeBoard: (state) => {
      state.modalOpen = false
      const game = phaserGame.scene.keys.game as CampusScene | undefined
      game?.enableKeys()
    },
  },
})

export const { openBoard, closeBoard } = boardSlice.actions

export default boardSlice.reducer
