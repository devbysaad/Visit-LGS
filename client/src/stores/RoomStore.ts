import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export const roomSlice = createSlice({
  name: 'room',
  initialState: {
    roomJoined: false,
    joining: false,
    joinError: null as string | null,
    roomId: '',
    roomName: '',
    roomDescription: '',
  },
  reducers: {
    setRoomJoined: (state, action: PayloadAction<boolean>) => {
      state.roomJoined = action.payload
    },
    setJoining: (state, action: PayloadAction<boolean>) => {
      state.joining = action.payload
    },
    setJoinError: (state, action: PayloadAction<string | null>) => {
      state.joinError = action.payload
    },
    setJoinedRoomData: (
      state,
      action: PayloadAction<{ id: string; name: string; description: string }>
    ) => {
      state.roomId = action.payload.id
      state.roomName = action.payload.name
      state.roomDescription = action.payload.description
    },
  },
})

export const { setRoomJoined, setJoining, setJoinError, setJoinedRoomData } = roomSlice.actions

export default roomSlice.reducer
