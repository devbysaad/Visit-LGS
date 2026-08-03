import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import phaserGame from '../PhaserGame'
import CampusScene from '../scenes/CampusScene'

export const buildingSlice = createSlice({
  name: 'building',
  initialState: {
    selectedBuildingId: null as string | null,
    modalOpen: false,
  },
  reducers: {
    openBuilding: (state, action: PayloadAction<string>) => {
      state.selectedBuildingId = action.payload
      state.modalOpen = true
      const game = phaserGame.scene.keys.game as CampusScene | undefined
      game?.disableKeys()
    },
    closeBuilding: (state) => {
      state.modalOpen = false
      const game = phaserGame.scene.keys.game as CampusScene | undefined
      game?.enableKeys()
    },
  },
})

export const { openBuilding, closeBuilding } = buildingSlice.actions

export default buildingSlice.reducer
