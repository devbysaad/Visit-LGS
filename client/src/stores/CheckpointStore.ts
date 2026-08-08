import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface CheckpointState {
  active: string | null
  seen: string[]
}

const initialState: CheckpointState = { active: null, seen: [] }

const checkpointSlice = createSlice({
  name: 'checkpoint',
  initialState,
  reducers: {
    arriveAtCheckpoint: (state, action: PayloadAction<string>) => {
      const gate = action.payload
      if (state.seen.includes(gate)) return
      state.seen.push(gate)
      state.active = gate
    },
    clearCheckpoint: (state) => {
      state.active = null
    },
  },
})

export const { arriveAtCheckpoint, clearCheckpoint } = checkpointSlice.actions
export default checkpointSlice.reducer
