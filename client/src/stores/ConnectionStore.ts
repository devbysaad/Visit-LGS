import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export const connectionSlice = createSlice({
  name: 'connection',
  initialState: {
    lost: false,
    reason: '',
  },
  reducers: {
    connectionLost: (state, action: PayloadAction<string>) => {
      if (state.lost) return
      state.lost = true
      state.reason = action.payload
    },
    connectionRestored: (state) => {
      state.lost = false
      state.reason = ''
    },
  },
})

export const { connectionLost, connectionRestored } = connectionSlice.actions
export default connectionSlice.reducer
