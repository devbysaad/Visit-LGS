import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import phaserGame from '../PhaserGame'
import CampusScene from '../scenes/CampusScene'

export const npcSlice = createSlice({
  name: 'npc',
  initialState: {
    selectedNpcId: null as string | null,
    dialogueOpen: false,
    dialogueIndex: 0,
  },
  reducers: {
    openNpc: (state, action: PayloadAction<string>) => {
      state.selectedNpcId = action.payload
      state.dialogueOpen = true
      state.dialogueIndex = 0
      const game = phaserGame.scene.keys.game as CampusScene | undefined
      game?.disableKeys()
    },
    advanceDialogue: (state) => {
      state.dialogueIndex += 1
    },
    closeNpc: (state) => {
      state.dialogueOpen = false
      state.selectedNpcId = null
      state.dialogueIndex = 0
      const game = phaserGame.scene.keys.game as CampusScene | undefined
      game?.enableKeys()
    },
  },
})

export const { openNpc, advanceDialogue, closeNpc } = npcSlice.actions

export default npcSlice.reducer
